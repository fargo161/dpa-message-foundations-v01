import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { SOURCE_BY_ID, validateAllSourceManifests } from "../src/sources.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifestPath = fileURLToPath(new URL("../data/acquisition-manifest.json", import.meta.url));

async function digest(path) {
  const hash = createHash("sha256");
  let byteSize = 0;
  for await (const chunk of createReadStream(path)) { hash.update(chunk); byteSize += chunk.byteLength; }
  return { byteSize, sha256: hash.digest("hex") };
}

async function firstJsonRecord(path) {
  const input = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  try {
    for await (const line of input) if (line.trim()) return JSON.parse(line);
  } finally { input.close(); input.input.destroy(); }
  throw new Error(`NORMALIZED_FILE_EMPTY:${path}`);
}

test("real acquisition receipts, ignored cache, indexing, and source statuses are reproducible", async () => {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.sources.length, 8);
  assert.deepEqual(
    Object.fromEntries(manifest.sources.map((source) => [source.status, manifest.sources.filter((item) => item.status === source.status).length])),
    { ACQUIRED_AND_INDEXED: 7, ACQUIRED_NOT_INDEXED: 1 },
  );
  assert.deepEqual(validateAllSourceManifests(), []);
  assert.equal(execFileSync("git", ["ls-files", "--", ".cache/external-data"], { cwd: root, encoding: "utf8" }).trim(), "");
  assert.doesNotThrow(() => execFileSync("git", ["check-ignore", "--quiet", "--", ".cache/external-data"], { cwd: root }));

  const indexed = manifest.sources.filter((source) => source.status === "ACQUIRED_AND_INDEXED");
  for (const source of manifest.sources) {
    const artifactPath = fileURLToPath(new URL(`../${source.artifactCachePath.replaceAll("\\", "/")}`, import.meta.url));
    await access(artifactPath);
    const actual = await digest(artifactPath);
    assert.equal(actual.byteSize, source.byteSize, `${source.sourceId}: byte size`);
    assert.equal(actual.sha256, source.sha256, `${source.sourceId}: SHA-256`);
    const receipt = JSON.parse(await readFile(fileURLToPath(new URL(`../${source.receiptPath.replaceAll("\\", "/")}`, import.meta.url)), "utf8"));
    assert.deepEqual({ byteSize: receipt.byteSize, sha256: receipt.sha256, retrievedAt: receipt.retrievedAt }, { byteSize: source.byteSize, sha256: source.sha256, retrievedAt: source.retrievedAt });
    const registered = SOURCE_BY_ID.get(source.sourceId);
    assert.equal(registered.acquisitionStatus, "ACQUIRED");
    assert.equal(registered.checksum, source.sha256);
    assert.equal(registered.byteSize, source.byteSize);
    assert.equal(registered.sourceVersion, source.sourceVersion);
    if (source.status === "ACQUIRED_NOT_INDEXED") {
      assert.equal(source.counts.indexed, 0);
      assert.equal(source.probes.length, 0);
      continue;
    }
    assert.ok(source.counts.raw > 0);
    assert.equal(source.counts.raw, source.counts.accepted + source.counts.rejected);
    assert.equal(source.counts.accepted, source.counts.normalized + source.counts.duplicate + (source.counts.aggregatedAnnotationRows ?? 0));
    assert.equal(source.counts.normalized, source.counts.indexed);
    assert.equal(source.indexSnapshot.recordCount, source.counts.indexed);
    assert.equal(source.indexSnapshot.persistedTokenCount, source.indexSnapshot.tokenCount);
    await access(fileURLToPath(new URL(`../${source.indexSnapshot.persistedPostingsPath.replaceAll("\\", "/")}`, import.meta.url)));
    assert.equal(source.probes.length, 3);
    assert.ok(source.probes.every((probe) => probe.results.length === 3));
    assert.ok(source.probes.every((probe) => probe.results.every((result) => result.sourceId === source.sourceId && result.sourceRecordId && result.provenance.length > 0 && result.provenance.every((ref) => ref.sourceId === source.sourceId && ref.sourceRecordId && ref.sourceVersion && ref.transformVersion && ref.licenseId))));
    assert.match(source.evidenceBoundary, /Evidence\/prior only/);
    const normalizedPath = fileURLToPath(new URL(`../${source.normalizedRecordsPath.replaceAll("\\", "/")}`, import.meta.url));
    await access(normalizedPath);
    const firstRecord = await firstJsonRecord(normalizedPath);
    assert.equal(firstRecord.defaultOnly, true);
    assert.equal(firstRecord.approvalStatus, "EVIDENCE_PRIOR");
    assert.equal(firstRecord.runtimeEligible, false);
  }
  assert.equal(indexed.reduce((sum, source) => sum + source.counts.indexed, 0), 1586907);
});

test("the seven indexed datasets retain distinct retrieval probes", async () => {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const expected = {
    "atomic-2020": ["xIntent", "xNeed", "HinderedBy"],
    "social-chemistry-101": ["losing trust", "thanks", "legal"],
    casino: ["firewood", "food", "water"],
    "persuasion-for-good": ["donate", "charity", "good"],
    "stanford-politeness-wikipedia": ["thanks", "please", "would you"],
    "stanford-politeness-stack-exchange": ["explain", "question", "please"],
    "moral-stories": ["moral_action", "immoral_action", "responsible"],
  };
  for (const [sourceId, queries] of Object.entries(expected)) {
    const source = manifest.sources.find((item) => item.sourceId === sourceId);
    assert.deepEqual(source.probes.map((probe) => probe.query), queries);
    assert.ok(source.probes.every((probe) => probe.results.length === 3));
  }
});
