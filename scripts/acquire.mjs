#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { EXTERNAL_DATA_CACHE_ROOT, SOURCE_BY_ID, SOURCE_MANIFESTS, assertAllowedSourceUrl, createReceiptFromDigest, validateArtifactDigest } from "../src/sources.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cacheRoot = resolve(root, EXTERNAL_DATA_CACHE_ROOT);
const maxDownloadBytes = 2_000_000_000;
const args = process.argv.slice(2);
const valueOf = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; };
const sourceId = valueOf("--source");
const localFile = valueOf("--file");
const force = args.includes("--force");
const all = args.includes("--all");

function usage(exitCode = 0) {
  console.log("Usage: node scripts/acquire.mjs --source SOURCE_ID [--file PATH] [--force]");
  console.log("       node scripts/acquire.mjs --all [--force]");
  console.log("Acquisition uses .cache/external-data, validates registered byte size and SHA-256, and writes receipt.json.");
  process.exit(exitCode);
}

if (args.includes("--help")) usage();
if ((!sourceId && !all) || (sourceId && all) || (all && localFile)) usage(1);

const selectedSources = all ? SOURCE_MANIFESTS.filter((source) => source.artifactUrl) : [SOURCE_BY_ID.get(sourceId)];
if (!selectedSources[0]) throw new Error(`UNKNOWN_SOURCE:${sourceId}`);

function displayPath(path) { return relative(root, path).split(sep).join("/"); }
function artifactPath(source) { return resolve(cacheRoot, source.sourceId, basename(source.expectedArtifactName || `${source.sourceId}.archive`)); }
function receiptPath(source) { return resolve(cacheRoot, source.sourceId, "receipt.json"); }

async function digestFile(path) {
  const hash = createHash("sha256");
  let byteSize = 0;
  for await (const chunk of createReadStream(path)) {
    byteSize += chunk.byteLength;
    hash.update(chunk);
  }
  return { byteSize, sha256: hash.digest("hex") };
}

async function readStoredReceipt(path) {
  try { return JSON.parse(await readFile(path, "utf8")); } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new Error(`CACHE_RECEIPT_INVALID:${path}`);
  }
}

function validateReceiptMetadata(source, receipt) {
  if (!receipt || receipt.sourceId !== source.sourceId || receipt.sourceVersion !== source.sourceVersion || receipt.licenseId !== source.licenseId || !receipt.retrievedAt) {
    throw new Error(`CACHE_RECEIPT_METADATA_MISMATCH:${source.sourceId}`);
  }
}

async function verifiedCache(source, destination) {
  if (!existsSync(destination)) return null;
  const digest = await digestFile(destination);
  validateArtifactDigest(source, digest);
  const stored = await readStoredReceipt(receiptPath(source));
  if (stored) {
    validateReceiptMetadata(source, stored);
    if (stored.byteSize !== digest.byteSize || stored.sha256 !== digest.sha256) throw new Error(`CACHE_RECEIPT_DIGEST_MISMATCH:${source.sourceId}`);
  }
  const retrievedAt = stored?.retrievedAt ?? source.retrievedAt ?? new Date().toISOString();
  const receipt = createReceiptFromDigest({ sourceId: source.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, artifactUrl: stored?.artifactUrl ?? source.artifactUrl, retrievedAt, ...digest });
  return { status: "REUSED_VERIFIED", destination, receipt };
}

async function downloadRemote(source, temporaryPath) {
  let current = assertAllowedSourceUrl(source.artifactUrl);
  for (let hop = 0; hop < 6; hop += 1) {
    let response;
    try {
      response = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(10 * 60 * 1000) });
    } catch (error) {
      throw new Error(`SOURCE_FETCH_FAILED:${source.sourceId}:${error instanceof Error ? error.message : String(error)}`);
    }
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      current = assertAllowedSourceUrl(new URL(response.headers.get("location"), current).toString());
      continue;
    }
    if (!response.ok || !response.body) throw new Error(`SOURCE_FETCH_FAILED:${source.sourceId}:${response.status}`);
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isSafeInteger(declaredLength) && declaredLength > maxDownloadBytes) throw new Error(`SOURCE_DOWNLOAD_SIZE_EXCEEDED:${source.sourceId}`);
    let received = 0;
    const counter = new Transform({ transform(chunk, encoding, callback) {
      received += chunk.byteLength;
      callback(received > maxDownloadBytes ? new Error(`SOURCE_DOWNLOAD_SIZE_EXCEEDED:${source.sourceId}`) : null, chunk);
    } });
    await pipeline(Readable.fromWeb(response.body), counter, createWriteStream(temporaryPath, { flags: "wx" }));
    return { resolvedUrl: current };
  }
  throw new Error(`SOURCE_REDIRECT_LIMIT:${source.sourceId}`);
}

async function copyLocal(source, localPath, temporaryPath) {
  const path = resolve(localPath);
  const details = await stat(path).catch(() => null);
  if (!details?.isFile()) throw new Error(`LOCAL_ARTIFACT_NOT_FOUND:${path}`);
  await copyFile(path, temporaryPath);
  return { resolvedUrl: source.artifactUrl };
}

async function replaceArtifact(temporaryPath, destination) {
  try {
    await rename(temporaryPath, destination);
  } catch (error) {
    if (!force || !["EEXIST", "EPERM"].includes(error.code)) throw error;
    await unlink(destination);
    await rename(temporaryPath, destination);
  }
}

async function acquireOne(source) {
  if (source.acquisitionStatus === "BLOCKED") throw new Error(`BLOCKED:${source.sourceId}:${source.notes[0] ?? "source is blocked"}`);
  if (!source.artifactUrl) return { sourceId: source.sourceId, status: "MANIFEST_ONLY", reason: source.notes[0] ?? "no artifact URL registered" };
  const destination = artifactPath(source);
  const cacheDir = resolve(cacheRoot, source.sourceId);
  const reusable = await verifiedCache(source, destination).catch((error) => {
    if (!force) throw error;
    return null;
  });
  if (reusable) {
    await mkdir(cacheDir, { recursive: true });
    await writeFile(receiptPath(source), `${JSON.stringify(reusable.receipt, null, 2)}\n`, "utf8");
    return { sourceId: source.sourceId, status: reusable.status, artifactPath: displayPath(destination), receiptPath: displayPath(receiptPath(source)), ...reusable.receipt };
  }

  await mkdir(cacheDir, { recursive: true });
  const temporaryPath = `${destination}.part-${process.pid}-${Date.now()}`;
  try {
    const result = localFile ? await copyLocal(source, localFile, temporaryPath) : await downloadRemote(source, temporaryPath);
    const digest = await digestFile(temporaryPath);
    validateArtifactDigest(source, digest);
    await replaceArtifact(temporaryPath, destination);
    const finalDigest = await digestFile(destination);
    validateArtifactDigest(source, finalDigest);
    const receipt = createReceiptFromDigest({ sourceId: source.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, artifactUrl: result.resolvedUrl, retrievedAt: new Date().toISOString(), ...finalDigest });
    await writeFile(receiptPath(source), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
    return { sourceId: source.sourceId, status: "ACQUIRED_AND_RECEIPTED", artifactPath: displayPath(destination), receiptPath: displayPath(receiptPath(source)), ...receipt };
  } finally {
    await unlink(temporaryPath).catch(() => {});
  }
}

try {
  const results = [];
  for (const source of selectedSources) {
    const result = await acquireOne(source);
    results.push(result);
    console.log(JSON.stringify(result, null, 2));
  }
  if (all) console.log(`acquire-all-ok: ${results.filter((result) => result.status === "ACQUIRED_AND_RECEIPTED" || result.status === "REUSED_VERIFIED").length} verified artifacts in ${EXTERNAL_DATA_CACHE_ROOT}`);
} catch (error) {
  console.error(JSON.stringify({ status: "BLOCKED_OR_REJECTED", sourceId: sourceId ?? "all", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exit(2);
}
