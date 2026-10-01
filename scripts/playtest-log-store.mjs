import { mkdir, lstat, realpath, open, rename, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, join, basename, relative, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import { LOG_LIMITS, assembleRecords } from "../src/playtest/recorder.mjs";
import { renderLogMarkdown } from "../src/playtest/markdown.mjs";

/** Node-only disk adapter. Tests provide a temporary root. @param {any} options */
export function createPlaytestDiskStore(options) {
  const root = resolve(options.directory), entries = new Map();
  let rootReady;
  async function ensureRoot() {
    if (!rootReady) rootReady = (async () => {
      await mkdir(root, { recursive: true });
      const stat = await lstat(root);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Unsafe log root.");
      return realpath(root);
    })();
    return rootReady;
  }
  async function target(name) {
    if (basename(name) !== name || !/^[A-Za-z0-9_.+-]+$/.test(name)) throw new Error("Unsafe log filename.");
    const actualRoot = await ensureRoot(), file = join(actualRoot, name), rel = relative(actualRoot, file);
    if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("Log path escapes root.");
    try { if ((await lstat(file)).isSymbolicLink()) throw new Error("Unsafe log symlink."); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    return file;
  }
  function enqueue(entry, work) {
    entry.queue = entry.queue.then(async () => { if (!entry.failed) await work(); }).catch(error => {
      entry.failed = true;
      options.onError?.(entry.runId, /^[A-Z0-9_]+$/.test(error.code ?? "") ? error.code : "LOG_WRITE_FAILED");
    });
  }
  async function atomic(name, content) {
    if (Buffer.byteLength(content) > LOG_LIMITS.assembled) throw new Error("Assembled log limit reached.");
    const file = await target(name), temp = await target(`${name}.tmp-${randomUUID()}`);
    const handle = await open(temp, "wx");
    try { await handle.writeFile(content, "utf8"); await handle.sync(); } finally { await handle.close(); }
    await target(name); await rename(temp, file);
  }
  return {
    append(record) {
      let entry = entries.get(record.runId);
      if (!entry) {
        if (record.type !== "RUN_STARTED") throw new Error("Missing log start.");
        entry = { runId: record.runId, base: record.data.header.fileBase, queue: Promise.resolve(), bytes: 0, started: false, failed: false };
        entries.set(record.runId, entry);
      }
      const line = JSON.stringify(record) + "\n";
      entry.bytes += Buffer.byteLength(line);
      enqueue(entry, async () => {
        if (entry.bytes > LOG_LIMITS.stream) throw new Error("Event stream limit reached.");
        const file = await target(`${entry.base}.events.jsonl`);
        const flags = entry.started ? constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0) : "wx";
        const handle = await open(file, flags);
        try { await handle.writeFile(line, "utf8"); await handle.sync(); } finally { await handle.close(); }
        entry.started = true;
      });
    },
    snapshot(log) {
      const entry = entries.get(log.header.runId);
      if (!entry) return;
      const json = JSON.stringify(log, null, 2) + "\n", md = renderLogMarkdown(log);
      enqueue(entry, async () => { await atomic(`${entry.base}.json`, json); await atomic(`${entry.base}.md`, md); });
    },
    async flush(runId = null) {
      await Promise.all((runId ? [entries.get(runId)].filter(Boolean) : [...entries.values()]).map(entry => entry.queue));
    },
    failed(runId) { return entries.get(runId)?.failed ?? false; },
  };
}

/** Recover complete lines, discarding only a torn last line. No game restoration. */
export async function recoverPlaytestStream(file) {
  if ((await lstat(file)).size > LOG_LIMITS.stream) throw new Error("Event stream too large.");
  const content = await readFile(file, "utf8"), lines = content.split("\n"), records = [];
  let torn = false;
  for (const [index, line] of lines.entries()) {
    if (!line) continue;
    try {
      const record = JSON.parse(line);
      if (record.seq !== records.length + 1 || !["ui", "engine"].includes(record.source) || !Number.isFinite(Date.parse(record.t)) || record.ms < (records.at(-1)?.ms ?? 0)) throw new Error("Invalid stream sequence.");
      records.push(record);
    } catch (error) { if (index !== lines.length - 1) throw error; torn = true; }
  }
  if (records[0]?.type !== "RUN_STARTED") throw new Error("Missing log header.");
  const log = assembleRecords(records);
  if (torn) log.header.diagnostics.push("Recovered complete records; torn final line omitted.");
  return log;
}
