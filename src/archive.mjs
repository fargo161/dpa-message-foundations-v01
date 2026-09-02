import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";
import { basename, relative, resolve, sep } from "node:path";
import { safeExtractEntries, validateArchiveEntries } from "./sources.mjs";

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

function findEndOfCentralDirectory(bytes) {
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 22 - 65_535); offset -= 1) {
    if (bytes.readUInt32LE(offset) === EOCD) return offset;
  }
  throw new Error("ZIP_END_OF_CENTRAL_DIRECTORY_NOT_FOUND");
}

export function readZipEntries(bytes, { maxEntries = 100_000, maxBytes = 1_000_000_000 } = {}) {
  const buffer = Buffer.from(bytes);
  const eocd = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (entryCount > maxEntries) throw new Error("ARCHIVE_ENTRY_COUNT_EXCEEDED");
  if (centralOffset + centralSize > buffer.length) throw new Error("ZIP_CENTRAL_DIRECTORY_OUT_OF_RANGE");
  const entries = [];
  let cursor = centralOffset;
  let expandedBytes = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== CENTRAL) throw new Error(`ZIP_CENTRAL_ENTRY_INVALID:${index}`);
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) throw new Error("ZIP64_NOT_SUPPORTED_IN_PHASE_1");
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    if (flags & 0x1) throw new Error(`ZIP_ENCRYPTED_ENTRY:${name}`);
    entries.push({ name, method, compressedSize, uncompressedSize, localOffset, directory: name.endsWith("/") });
    expandedBytes += uncompressedSize;
    if (expandedBytes > maxBytes) throw new Error("ARCHIVE_EXPANDED_SIZE_EXCEEDED");
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  validateArchiveEntries(entries.map((entry) => entry.name), { maxEntries });
  return { buffer, entries, expandedBytes };
}

function inflateEntry(buffer, entry) {
  if (buffer.readUInt32LE(entry.localOffset) !== LOCAL) throw new Error(`ZIP_LOCAL_ENTRY_INVALID:${entry.name}`);
  const nameLength = buffer.readUInt16LE(entry.localOffset + 26);
  const extraLength = buffer.readUInt16LE(entry.localOffset + 28);
  const dataStart = entry.localOffset + 30 + nameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);
  if (compressed.length !== entry.compressedSize) throw new Error(`ZIP_COMPRESSED_DATA_OUT_OF_RANGE:${entry.name}`);
  const bytes = entry.method === 0 ? Buffer.from(compressed) : entry.method === 8 ? inflateRawSync(compressed) : null;
  if (!bytes) throw new Error(`ZIP_COMPRESSION_METHOD_UNSUPPORTED:${entry.method}:${entry.name}`);
  if (bytes.byteLength !== entry.uncompressedSize) throw new Error(`ZIP_SIZE_MISMATCH:${entry.name}`);
  return bytes;
}

export function extractZipBuffer(bytes, destination, options = {}) {
  const parsed = readZipEntries(bytes, options);
  const files = parsed.entries.filter((entry) => !entry.directory).map((entry) => ({ ...entry, bytes: inflateEntry(parsed.buffer, entry) }));
  const safe = safeExtractEntries(files, destination, options);
  return safe.map((entry, index) => ({ name: files[index].name, outputPath: entry.outputPath, bytes: entry.bytes, sha256: createHash("sha256").update(entry.bytes).digest("hex") }));
}

export async function extractZipFile(archivePath, destination, options = {}) {
  const parsed = readZipEntries(await readFile(archivePath), options);
  const destinationPath = resolve(destination);
  await mkdir(destinationPath, { recursive: true });
  const files = [];
  for (const entry of parsed.entries.filter((candidate) => !candidate.directory)) {
    const bytes = inflateEntry(parsed.buffer, entry);
    const outputPath = resolve(destinationPath, entry.name.replaceAll("/", sep));
    const rel = relative(destinationPath, outputPath);
    if (rel.startsWith(`..${sep}`) || rel === "..") throw new Error(`ARCHIVE_OUTPUT_ESCAPE:${entry.name}`);
    await mkdir(resolve(outputPath, ".."), { recursive: true });
    await writeFile(outputPath, bytes, { flag: "wx" }).catch(async (error) => {
      if (error.code !== "EEXIST") throw error;
      await writeFile(outputPath, bytes, { flag: "w" });
    });
    files.push({ name: entry.name, outputPath, sha256: createHash("sha256").update(bytes).digest("hex") });
  }
  return files;
}
