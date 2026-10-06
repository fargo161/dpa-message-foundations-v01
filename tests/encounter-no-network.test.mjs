import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
const forbidden = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|importScripts)\s*\(|\bsendBeacon\s*\(|\bimport\s*\(/;
async function scripts(directory) {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(item.name + (item.isDirectory() ? "/" : ""), directory);
    if (item.isDirectory()) result.push(...await scripts(path));
    else if (/\.(?:m?js|html)$/.test(item.name)) result.push(path);
  }
  return result;
}
test("encounter source forbids every transport call checked by the standalone audit", async () => {
  for (const file of await scripts(new URL("../public/encounter/", import.meta.url))) assert.doesNotMatch(await readFile(file, "utf8"), forbidden, file.pathname);
  const server = await readFile(new URL("../scripts/encounter-server.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(server, /\/api\/|createConversation|resolveConversation|previewConversation|csrf|cookie|createPlaytestDiskStore/);
  const builder = await readFile(new URL("../tools/build_standalone.py", import.meta.url), "utf8"); assert.doesNotMatch(builder, /LOCAL_API|localFetch/);
});
