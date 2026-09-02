#!/usr/bin/env node
import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { writeFile } from "node:fs/promises";
import { createReceipt, assertAllowedSourceUrl, SOURCE_BY_ID, validateArchiveEntries } from "../src/sources.mjs";

const args = process.argv.slice(2);
const valueOf = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; };
const sourceId = valueOf("--source");
const localFile = valueOf("--file");
const entries = valueOf("--entries");
const force = args.includes("--force");

if (!sourceId || args.includes("--help")) {
  console.log("Usage: node scripts/acquire.mjs --source SOURCE_ID [--file PATH] [--force]");
  console.log("Without --file, the command reports the manifest boundary and does not download.");
  process.exit(sourceId ? 0 : 1);
}

const source = SOURCE_BY_ID.get(sourceId);
if (!source) { console.error(`Unknown source: ${sourceId}`); process.exit(1); }
if (entries) validateArchiveEntries(entries.split(",").map((name) => name.trim()).filter(Boolean));

const cacheDir = resolve(".cache/emp-lore-packs/downloads", sourceId);
const destination = resolve(cacheDir, basename(source.expectedArtifactName || `${sourceId}.archive`));

async function acquireRemote() {
  const first = assertAllowedSourceUrl(source.artifactUrl);
  let current = first;
  for (let hop = 0; hop < 6; hop += 1) {
    const response = await fetch(current, { redirect: "manual" });
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      current = assertAllowedSourceUrl(new URL(response.headers.get("location"), current).toString());
      continue;
    }
    if (!response.ok || !response.body) throw new Error(`SOURCE_FETCH_FAILED:${response.status}`);
    if (existsSync(destination) && !force) throw new Error(`CACHE_EXISTS_USE_FORCE:${destination}`);
    mkdirSync(cacheDir, { recursive: true });
    await pipeline(Readable.fromWeb(response.body), createWriteStream(destination, { flags: "w" }));
    return { resolvedUrl: current, bytes: readFileSync(destination) };
  }
  throw new Error("SOURCE_REDIRECT_LIMIT");
}

try {
  let result;
  if (localFile) {
    const path = resolve(localFile);
    if (!existsSync(path) || !statSync(path).isFile()) throw new Error(`LOCAL_ARTIFACT_NOT_FOUND:${path}`);
    if (existsSync(destination) && !force) throw new Error(`CACHE_EXISTS_USE_FORCE:${destination}`);
    const bytes = readFileSync(path);
    result = { resolvedUrl: source.artifactUrl, bytes };
    mkdirSync(cacheDir, { recursive: true });
    await writeFile(destination, bytes);
  } else if (source.acquisitionStatus === "BLOCKED" || source.artifactUrl == null) {
    console.log(JSON.stringify({ sourceId, status: source.artifactUrl == null ? "MANIFEST_ONLY" : "BLOCKED", reason: source.notes[0], artifactUrl: source.artifactUrl }, null, 2));
    process.exit(0);
  } else result = await acquireRemote();
  const receipt = createReceipt({ sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, artifactUrl: result.resolvedUrl, bytes: result.bytes, retrievedAt: new Date().toISOString() });
  const receiptPath = `${destination}.receipt.json`;
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: "ACQUIRED_AND_RECEIPTED", artifactPath: destination, receiptPath, ...receipt }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "BLOCKED_OR_REJECTED", sourceId, error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exit(2);
}
