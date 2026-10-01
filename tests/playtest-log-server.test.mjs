import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, writeFile, appendFile, mkdir, symlink } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createEncounterServer } from "../scripts/encounter-server.mjs";
import { recoverPlaytestStream, createPlaytestDiskStore } from "../scripts/playtest-log-store.mjs";
import { resolveConversation, projectConversation } from "../src/conversation/runtime.mjs";
import { renderLogMarkdown } from "../src/playtest/markdown.mjs";
const mode = { languageMode: "AUTHORING_PREVIEW" };
const localLogRoot = new URL("../playtest-logs/", import.meta.url);
const beforeLocalFiles = existsSync(localLogRoot) ? readdirSync(localLogRoot).sort() : [];

async function serve(t, options = {}) {
  const root = await mkdtemp(join(tmpdir(), "marcus-playtest-")), directory = options.logDirectory ?? join(root, "logs"), errors = [];
  const server = createEncounterServer({ logging: true, logDirectory: directory, logOffset: -240, logClock: () => Date.parse("2026-10-01T22:05:12Z"), logBuild: { mode: "dev-server", packageVersion: "0.1.0", commitFull: "1".repeat(40) }, logError: code => errors.push(code), ...options });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}`, response = await fetch(`${url}/api/state`), cookie = response.headers.get("set-cookie").split(";")[0];
  let view = await response.json();
  const post = (path, body, headers = {}) => fetch(`${url}${path}`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json", "X-CSRF-Token": view.csrf, ...headers }, body: JSON.stringify(body) });
  const command = fields => ({ runId: view.play.runId, version: view.play.version, requestId: crypto.randomUUID(), ...(fields.action ? { vibeId: "EA", intensity: "BALANCED" } : {}), ...fields });
  const commit = async (path, body) => { const response = await post(path, body); assert.equal(response.status, 200, await response.clone().text()); view = await response.json(); return view; };
  const flush = async (runId = view.play.runId, records = []) => { const response = await post("/api/playtest-log", { runId, batchId: "flush", records }); assert.equal(response.status, 200, await response.clone().text()); return response.json(); };
  const getLog = async () => (await fetch(`${url}/api/playtest-log.json`, { headers: { Cookie: cookie } })).json();
  await flush();
  return { root, directory, errors, cookie, url, command, commit, post, flush, getLog, get view() { return view; } };
}
const ui = (index, data = { label: "More things to say", target: "more" }, type = "UI_ACTION") => ({ type, clientEventId: `browser-${index}`, clientSeq: index, observedT: "2026-10-01T22:05:13.000Z", observedMs: 1000, data });

test("live server writes complete agreement log sets from authoritative events and bounded UI batches", async t => {
  const api = await serve(t); await api.commit("/api/restart", api.command({ seed: "r17-proof-0", scenarioId: "marcus" }));
  await api.flush(undefined, [ui(1), ui(2, { userAgent: "test-browser", viewport: { width: 1000, height: 700 } }, "RUN_METADATA")]);
  await api.commit("/api/turn", api.command({ action: "ASK", topic: "R17_HINT" }));
  await api.commit("/api/turn", api.command({ action: "DEAL", information: "OFFER_INFORMATION", terms: { units: 2, upfront: 70, repayment: 50, extra: 20, days: 7 } }));
  await api.commit("/api/turn", api.command({ action: "ACCEPT", offerId: api.view.play.counteroffer.id, offerVersion: api.view.play.counteroffer.version }));
  await api.flush();
  const log = await api.getLog(), files = await readdir(api.directory);
  assert.match(log.header.fileBase, /^2026-10-01_18-05-12-0400_r17-proof-0_/);
  assert.equal(log.header.endStatus, "AGREED"); assert.equal(log.header.userAgent, "test-browser"); assert.equal(log.turns.length, 3);
  assert.deepEqual(log.turns[1].event, api.view.debug.state.events[1]); assert.equal(log.turns[1].submittedTerms.extra, 20); assert.equal(log.turns[1].normalizedTerms.extra, 4);
  assert.equal(log.header.private.marcusInterest, "cares"); assert.equal(log.header.private.r17Version, "GOOD");
  for (const extension of ["events.jsonl", "json", "md"]) assert.ok(files.includes(`${log.header.fileBase}.${extension}`));
  const json = JSON.parse(await readFile(join(api.directory, `${log.header.fileBase}.json`), "utf8")), md = await readFile(join(api.directory, `${log.header.fileBase}.md`), "utf8");
  assert.deepEqual(json, log); assert.equal(md, renderLogMarkdown(log)); assert.match(md, /R-17 saved you \$4/);
});

test("restart replaces an open run, retains old UI identity, and does not overwrite a final walk-away", async t => {
  const api = await serve(t), oldId = api.view.play.runId;
  await api.commit("/api/restart", api.command({ seed: "../../outside?", scenarioId: "marcus" }));
  await api.flush(oldId, [ui(1)]); await api.flush();
  const replaced = (await Promise.all((await readdir(api.directory)).filter(name => name.endsWith(".json")).map(async name => JSON.parse(await readFile(join(api.directory, name), "utf8"))))).find(log => log.header.runId === oldId);
  assert.equal(replaced.header.endStatus, "REPLACED"); assert.equal(replaced.records.at(-1).source, "ui");
  const current = await api.getLog(); assert.notEqual(current.header.runId, oldId); assert.ok(!current.header.fileBase.includes(".."));
  await api.commit("/api/turn", api.command({ action: "WALK" })); await api.flush();
  const final = await api.getLog(); assert.equal(final.header.endStatus, "WITHDRAWN");
  await api.commit("/api/restart", api.command({ seed: "r17-proof-0" })); await api.flush();
  const retained = JSON.parse(await readFile(join(api.directory, `${final.header.fileBase}.json`), "utf8")); assert.equal(retained.header.endStatus, "WITHDRAWN");
});

test("interrupted streams stay readable and incomplete; a torn last line is recoverable", async t => {
  const api = await serve(t); const log = await api.getLog(), path = join(api.directory, `${log.header.fileBase}.events.jsonl`);
  await api.flush(undefined, [ui(1, {}, "PAGE_HIDDEN")]); await appendFile(path, '{"incomplete":');
  const recovered = await recoverPlaytestStream(path);
  assert.equal(recovered.header.endStatus, "incomplete"); assert.equal(recovered.records.at(-1).type, "PAGE_HIDDEN"); assert.match(renderLogMarkdown(recovered), /incomplete/); assert.equal(recovered.header.diagnostics.length, 1);
});

test("log endpoint rejects missing CSRF, wrong origin/session/run, forged authority and oversized/path-bearing envelopes", async t => {
  const api = await serve(t), before = JSON.stringify(api.view), body = { runId: api.view.play.runId, batchId: "batch", records: [ui(1)] };
  assert.equal((await api.post("/api/playtest-log", body, { "X-CSRF-Token": "" })).status, 403);
  assert.equal((await api.post("/api/playtest-log", body, { Origin: "https://other.example" })).status, 403);
  assert.equal((await fetch(`${api.url}/api/playtest-log.json`)).status, 401);
  assert.equal((await api.post("/api/playtest-log", { ...body, runId: "../../outside" })).status, 404);
  assert.equal((await api.post("/api/playtest-log", { ...body, filename: "../../outside" })).status, 400);
  assert.equal((await api.post("/api/playtest-log", { ...body, records: [{ ...ui(1), type: "TURN_COMMITTED" }] })).status, 400);
  assert.equal((await api.post("/api/playtest-log", { ...body, records: [ui(1, { text: "x".repeat(50000) })] })).status, 413);
  assert.equal((await api.post("/api/playtest-log", { ...body, records: [ui(1, { source: "engine" })] })).status, 400);
  assert.equal(JSON.stringify(await (await fetch(`${api.url}/api/state`, { headers: { Cookie: api.cookie } })).json()), before);
  assert.equal((await readdir(api.root)).length, 1);
});

test("UI retries are idempotent and do not spend a gameplay request or turn", async t => {
  const api = await serve(t), before = api.view.play.version;
  assert.equal((await api.flush(undefined, [ui(1)])).accepted, 1); assert.equal((await api.flush(undefined, [ui(1)])).accepted, 0);
  assert.equal((await api.getLog()).records.filter(record => record.type === "UI_ACTION").length, 1);
  await api.commit("/api/turn", api.command({ action: "WALK" })); assert.equal(api.view.play.version, before + 1);
});

test("an unwritable logging root never changes a gameplay result or API projection", async t => {
  const scratch = await mkdtemp(join(tmpdir(), "marcus-blocked-log-")), file = join(scratch, "not-a-directory"); await writeFile(file, "preserve");
  const api = await serve(t, { logDirectory: file });
  const command = api.command({ action: "WALK" }), expected = resolveConversation(api.view.debug.state, command, mode), csrf = api.view.csrf;
  await api.commit("/api/turn", command);
  assert.deepEqual(api.view, projectConversation(expected, csrf, mode)); await api.flush();
  assert.ok(api.errors.length > 0); assert.equal(await readFile(file, "utf8"), "preserve");
});

test("disk adapter refuses symlink roots instead of writing through them", async () => {
  const scratch = await mkdtemp(join(tmpdir(), "marcus-symlink-log-")), destination = join(scratch, "destination"), linked = join(scratch, "linked"), errors = [];
  await mkdir(destination); await symlink(destination, linked, "junction");
  const disk = createPlaytestDiskStore({ directory: linked, onError: (runId, code) => errors.push(code) });
  disk.append({ runId: "link-run", type: "RUN_STARTED", data: { header: { fileBase: "safe" } } }); await disk.flush();
  assert.equal((await readdir(destination)).length, 0); assert.equal(errors.length, 1);
});

test("automated logging tests write nothing into the repository log folder", () => {
  assert.deepEqual(existsSync(localLogRoot) ? readdirSync(localLogRoot).sort() : [], beforeLocalFiles);
});
