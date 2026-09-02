#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { once } from "node:events";
import { createInterface } from "node:readline";
import { resolve, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCE_BY_ID } from "../src/sources.mjs";
import { extractZipFile } from "../src/archive.mjs";
import { buildSearchIndex } from "../src/index.mjs";
import { normalizeAtomicRows, normalizeJsonl, normalizeMoralStoriesRows, normalizePfgCsv, normalizeSocialChemistryRow, dedupeNormalizedRecords, parseCsv, parseTsv } from "../src/ingestion.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cacheRoot = resolve(root, ".cache/external-data");
const indexRoot = resolve(root, "data/indexes");
const registrationTime = new Date().toISOString();

const artifactJobs = [
  { sourceId: "atomic-2020", archive: "atomic-2020/atomic2020_data-feb2021.zip", extracted: "atomic-2020/extracted", kind: "atomic", probes: ["xIntent", "xNeed", "HinderedBy"] },
  { sourceId: "social-chemistry-101", archive: "social-chemistry-101/social-chem-101.zip", extracted: "social-chemistry-101/extracted", kind: "social", probes: ["losing trust", "thanks", "legal"] },
  { sourceId: "casino", archive: "casino/casino-corpus.zip", extracted: "casino/extracted", kind: "casino", probes: ["firewood", "food", "water"] },
  { sourceId: "persuasion-for-good", archive: "persuasion-for-good/persuasionforgood-master.zip", extracted: "persuasion-for-good/extracted", kind: "pfg", probes: ["donate", "charity", "good"] },
  { sourceId: "stanford-politeness-wikipedia", archive: "stanford-politeness-wikipedia/wikipedia-politeness-corpus.zip", extracted: "stanford-politeness-wikipedia/extracted", kind: "wiki", probes: ["thanks", "please", "would you"] },
  { sourceId: "stanford-politeness-stack-exchange", archive: "stanford-politeness-stack-exchange/stack-exchange-politeness-corpus.zip", extracted: "stanford-politeness-stack-exchange/extracted", kind: "stack", probes: ["explain", "question", "please"] },
];
const directJobs = [{ sourceId: "moral-stories", artifact: "moral-stories/moral_stories_full.jsonl", kind: "moral", probes: ["moral_action", "immoral_action", "responsible"] }];

function sourceInfo(sourceId) {
  const source = SOURCE_BY_ID.get(sourceId);
  if (!source) throw new Error(`SOURCE_MANIFEST_MISSING:${sourceId}`);
  return source;
}
function nonemptyLines(text) { return text.split(/\r?\n/).filter((line) => line.trim()); }
function firstJsonLine(text) { const line = nonemptyLines(text)[0]; return line ? JSON.parse(line) : {}; }

async function receiptForFile(source, artifactPath) {
  const hash = createHash("sha256");
  let byteSize = 0;
  for await (const chunk of createReadStream(artifactPath)) { hash.update(chunk); byteSize += chunk.byteLength; }
  const sha256 = hash.digest("hex");
  let retrievedAt = registrationTime;
  try {
    const previous = JSON.parse(await readFile(resolve(cacheRoot, source.sourceId, "receipt.json"), "utf8"));
    if (previous.sha256 === sha256 && previous.byteSize === byteSize && previous.retrievedAt) retrievedAt = previous.retrievedAt;
  } catch {}
  return { sourceId: source.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, artifactUrl: source.artifactUrl, retrievedAt, byteSize, sha256, receiptVersion: "source-receipt@0.1" };
}
async function writeLine(stream, line) { if (!stream.write(`${line}\n`, "utf8")) await once(stream, "drain"); }

async function persistPostings(index, postingsPath) {
  const output = createWriteStream(postingsPath, { flags: "w" });
  for (const [token, recordIds] of [...index.postings.entries()].sort(([a], [b]) => a.localeCompare(b))) await writeLine(output, JSON.stringify({ token, recordIds: [...recordIds] }));
  output.end();
  await once(output, "finish");
  return { path: postingsPath, tokenCount: index.postings.size };
}

async function streamNormalize(job, source, dataPath, normalizedPath, schema) {
  const index = buildSearchIndex([], { sourceId: job.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, compactIndex: true });
  const output = createWriteStream(normalizedPath, { flags: "w" });
  const seen = new Set();
  const rejections = [];
  let rawRecordCount = 0;
  let accepted = 0;
  let duplicate = 0;
  let headers = null;
  for (const currentPath of (Array.isArray(dataPath) ? dataPath : [dataPath])) {
    const input = createInterface({ input: createReadStream(currentPath), crlfDelay: Infinity });
    let splitRecordCount = 0;
    for await (const line of input) {
      if (!line.trim()) continue;
      if (job.kind === "social" && headers == null) { headers = parseTsv(line)[0].map((value) => String(value).trim()); continue; }
      rawRecordCount += 1;
      splitRecordCount += 1;
      const row = parseTsv(line)[0] ?? [];
      const split = job.kind === "atomic" ? basename(currentPath, ".tsv") : "data";
      const normalized = job.kind === "atomic"
        ? normalizeAtomicRows([{ id: `${split}:${splitRecordCount}`, head: row[0], relation: row[1], tail: row[2] }], { sourceId: job.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId })
        : normalizeSocialChemistryRow(row, headers, { sourceId: job.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId }, rawRecordCount + 1);
      const candidates = normalized.records ?? (normalized.record ? [normalized.record] : []);
      for (const record of candidates) {
        accepted += 1;
        const key = record.recordId;
        if (seen.has(key)) { duplicate += 1; continue; }
        seen.add(key);
        index.add([record]);
        await writeLine(output, JSON.stringify(record));
      }
      const rejected = normalized.rejections ?? (normalized.rejected ? [normalized.rejected] : []);
      for (const item of rejected) rejections.push(item);
    }
  }
  output.end();
  await once(output, "finish");
  return { index, rawRecordCount, accepted, rejected: rejections.length, duplicate, rejections: rejections.slice(0, 100), schema: job.kind === "social" ? { ...schema, fields: headers } : schema };
}

async function finalize({ job, source, artifactPath, receipt, receiptPath, extractedFiles, result, index, normalizedPath, counts }) {
  const probes = job.probes.map((query) => ({ query, results: index.search(query, { limit: 3 }) }));
  if (probes.some((probe) => probe.results.length === 0)) throw new Error(`RETRIEVAL_PROBE_EMPTY:${job.sourceId}`);
  const postingsPath = resolve(cacheRoot, job.sourceId, "search-index.postings.jsonl");
  const persistedPostings = await persistPostings(index, postingsPath);
  const payload = {
    status: "ACQUIRED_AND_INDEXED", sourceId: job.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, redistributionPolicy: source.redistributionPolicy,
    canonicalUrl: source.canonicalUrl, artifactUrl: source.artifactUrl, artifactFilename: basename(artifactPath), artifactCachePath: relative(root, artifactPath), retrievedAt: receipt.retrievedAt, byteSize: receipt.byteSize, sha256: receipt.sha256, receiptPath: relative(root, receiptPath),
    extraction: job.archive ? { sourceArchive: true, extractedPath: relative(root, resolve(cacheRoot, job.extracted)), extractedFileCount: extractedFiles.length, extractedFiles } : { sourceArchive: false, extractedPath: null },
    observedSchema: result.schema, counts: { raw: counts.raw, accepted: counts.accepted, rejected: counts.rejected, duplicate: counts.duplicate, normalized: counts.normalized, indexed: index.records.size }, duplicateRecordIds: counts.duplicateRecordIds ?? [], rejections: result.rejections ?? [], indexSnapshot: { ...index.snapshot(), persistedPostingsPath: relative(root, persistedPostings.path), persistedTokenCount: persistedPostings.tokenCount }, probes,
    normalizedRecordsPath: relative(root, normalizedPath), evidenceBoundary: "Evidence/prior only. No mechanics, BASED mapping, TPL protocol, or runtime dialogue approval is implied.",
  };
  await writeFile(resolve(indexRoot, `${job.sourceId}.json`), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

async function normalizeJob(job) {
  const source = sourceInfo(job.sourceId);
  const artifactPath = resolve(cacheRoot, job.artifact ?? job.archive);
  const receipt = await receiptForFile(source, artifactPath);
  const receiptPath = resolve(cacheRoot, job.sourceId, "receipt.json");
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  let extractedFiles = [];
  const normalizedPath = resolve(cacheRoot, job.sourceId, "normalized.records.jsonl");
  if (job.archive) extractedFiles = await extractZipFile(artifactPath, resolve(cacheRoot, job.extracted), { maxEntries: 1000, maxBytes: 1_000_000_000 });
  if (job.kind === "atomic" || job.kind === "social") {
    const dataPath = job.kind === "atomic" ? ["train.tsv", "dev.tsv", "test.tsv"].map((split) => resolve(cacheRoot, job.extracted, "atomic2020_data-feb2021", split)) : resolve(cacheRoot, job.extracted, "social-chem-101", "social-chem-101.v1.0.tsv");
    const result = await streamNormalize(job, source, dataPath, normalizedPath, { format: job.kind === "atomic" ? "headerless TSV" : "TSV", fields: job.kind === "atomic" ? ["head", "relation", "tail"] : [] });
    return finalize({ job, source, artifactPath, receipt, receiptPath, extractedFiles, result: { schema: result.schema, rejections: result.rejections }, index: result.index, normalizedPath, counts: { raw: result.rawRecordCount, accepted: result.accepted, rejected: result.rejected, duplicate: result.duplicate, normalized: result.index.records.size } });
  }
  let text;
  let result;
  if (job.kind === "moral") {
    text = await readFile(artifactPath, "utf8");
    const rows = nonemptyLines(text).map((line) => JSON.parse(line));
    result = normalizeMoralStoriesRows(rows, { sourceId: job.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId });
    result.rawRecordCount = rows.length;
    result.schema = { format: "JSONL", fields: Object.keys(rows[0] ?? {}).sort(), branchFields: ["moral_action", "moral_consequence", "immoral_action", "immoral_consequence"] };
  } else {
    const directory = job.kind === "casino" ? "casino-corpus" : job.kind === "wiki" ? "wikipedia-politeness-corpus" : job.kind === "stack" ? "stack-exchange-politeness-corpus" : "persuasionforgood-master/data/FullData";
    const dataPath = job.kind === "pfg" ? resolve(cacheRoot, job.extracted, directory, "full_dialog.csv") : resolve(cacheRoot, job.extracted, directory, "utterances.jsonl");
    text = await readFile(dataPath, "utf8");
    const options = { sourceId: job.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, priorKind: job.kind === "casino" ? "NEGOTIATION_DIALOGUE" : "REQUEST_OR_PERSUASION_DIALOGUE" };
    result = job.kind === "pfg" ? normalizePfgCsv(text, options) : normalizeJsonl(text, options);
    result.rawRecordCount = Math.max(0, nonemptyLines(text).length - (job.kind === "pfg" ? 1 : 0));
    if (job.kind === "pfg") result.schema = { format: "CSV", fields: parseCsv(text)[0], note: "B2=dialogue ID, B4=role, Turn=turn index, Unit=text; participant metadata excluded." };
    else { const first = firstJsonLine(text); result.schema = { format: "JSONL", fields: Object.keys(first).sort(), metadataFields: Object.keys(first.meta ?? {}).sort() }; }
  }
  const deduped = dedupeNormalizedRecords(result.records);
  const index = buildSearchIndex(deduped.records, { sourceId: job.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, compactIndex: true });
  await writeFile(normalizedPath, `${deduped.records.map((record) => JSON.stringify(record)).join("\n")}\n`, "utf8");
  return finalize({ job, source, artifactPath, receipt, receiptPath, extractedFiles, result, index, normalizedPath, counts: { raw: result.rawRecordCount, accepted: result.records.length, rejected: result.rejections?.length ?? result.rejected?.length ?? 0, duplicate: deduped.duplicateRecords.length, normalized: deduped.records.length, duplicateRecordIds: deduped.duplicateRecords } });
}

async function registerTplAuthority() {
  const job = { sourceId: "tpl-ontology-luangrath-peck-barger", artifact: "tpl-ontology-luangrath-peck-barger/1605.06799.pdf" };
  const source = sourceInfo(job.sourceId);
  const artifactPath = resolve(cacheRoot, job.artifact);
  const receipt = await receiptForFile(source, artifactPath);
  const receiptPath = resolve(cacheRoot, job.sourceId, "receipt.json");
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const file = await stat(artifactPath);
  if (file.size !== receipt.byteSize) throw new Error("TPL_AUTHORITY_RECEIPT_SIZE_MISMATCH");
  return {
    status: "ACQUIRED_NOT_INDEXED", sourceId: source.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, redistributionPolicy: source.redistributionPolicy,
    canonicalUrl: source.canonicalUrl, artifactUrl: source.artifactUrl, artifactFilename: basename(artifactPath), artifactCachePath: relative(root, artifactPath), retrievedAt: receipt.retrievedAt, byteSize: receipt.byteSize, sha256: receipt.sha256, receiptPath: relative(root, receiptPath),
    extraction: { sourceArchive: false, extractedPath: null, extractedFileCount: 0, extractedFiles: [] },
    observedSchema: { format: "PDF", fields: ["manuscript metadata and conceptual TPL taxonomy"], note: "Research authority registration only; no underlying social-media corpus is asserted available or reusable." },
    counts: { raw: 0, accepted: 0, rejected: 0, duplicate: 0, normalized: 0, indexed: 0 }, duplicateRecordIds: [], rejections: [], indexSnapshot: null, probes: [], normalizedRecordsPath: null,
    evidenceBoundary: "Research authority only. No underlying social-media corpus was acquired, normalized, indexed, or claimed reusable; no mechanics, BASED mapping, TPL protocol, or runtime dialogue approval is implied.",
  };
}

await mkdir(indexRoot, { recursive: true });
const results = [];
for (const job of [...artifactJobs, ...directJobs]) {
  const result = await normalizeJob(job);
  results.push(result);
  console.log(JSON.stringify({ sourceId: result.sourceId, status: result.status, artifactFilename: result.artifactFilename, byteSize: result.byteSize, sha256: result.sha256, counts: result.counts, probeHits: result.probes.map((probe) => ({ query: probe.query, hits: probe.results.length })) }, null, 2));
  if (global.gc) global.gc();
}
const tplAuthority = await registerTplAuthority();
results.push(tplAuthority);
console.log(JSON.stringify({ sourceId: tplAuthority.sourceId, status: tplAuthority.status, artifactFilename: tplAuthority.artifactFilename, byteSize: tplAuthority.byteSize, sha256: tplAuthority.sha256, counts: tplAuthority.counts }, null, 2));
await writeFile(resolve(root, "data/acquisition-manifest.json"), `${JSON.stringify({ generatedAt: registrationTime, sources: results }, null, 2)}\n`, "utf8");
console.log(`real-acquisition-ok: ${results.filter((result) => result.status === "ACQUIRED_AND_INDEXED").length} datasets acquired and indexed; ${results.filter((result) => result.status === "ACQUIRED_NOT_INDEXED").length} research authority artifact acquired`);
