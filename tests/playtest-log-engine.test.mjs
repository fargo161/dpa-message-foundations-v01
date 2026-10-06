import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { createLocalEngine, PLAYTEST_STORAGE_KEY } from "../public/encounter/local-engine.mjs";
import { resolveConversation, projectConversation } from "../src/conversation/runtime.mjs";
import { renderLogMarkdown } from "../src/playtest/markdown.mjs";
const mode = { languageMode: "AUTHORING_PREVIEW" };
const localLogRoot = new URL("../playtest-logs/", import.meta.url);
const beforeLocalFiles = existsSync(localLogRoot) ? readdirSync(localLogRoot).sort() : [];
function harness(options = {}) {
  const saved = new Map(), errors = [];
  const storage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  const settings = { storage, offsetMinutes: -240, clock: () => Date.parse("2026-10-01T22:05:12Z"),
    build: { mode: "dev-server", packageVersion: "0.1.0", commitFull: "1".repeat(40) }, onWarning: code => errors.push(code), ...options };
  const engine = createLocalEngine(settings); let view = engine.getState();
  const command = fields => ({ runId: view.play.runId, version: view.play.version, requestId: crypto.randomUUID(), ...(fields.action ? { vibeId: "EA", intensity: "BALANCED" } : {}), ...fields });
  const commit = (method, input) => { view = engine[method](input); return view; };
  const flush = (runId = view.play.runId, records = []) => engine.ingestLog({ runId, batchId: "flush", records });
  return { engine, storage, settings, saved, errors, command, commit, flush, getLog: () => engine.exportLog().log, get view() { return view; } };
}
const ui = (index, data = { label: "More things to say", target: "more" }, type = "UI_ACTION") => ({ type, clientEventId: `browser-${index}`, clientSeq: index, observedT: "2026-10-01T22:05:13.000Z", observedMs: 1000, data });

test("local engine exports complete agreement logs from authoritative events and bounded UI batches", () => {
  const api = harness(); api.commit("restart", api.command({ seed: "r17-proof-0", scenarioId: "marcus" }));
  api.flush(undefined, [ui(1), ui(2, { userAgent: "test-browser", viewport: { width: 1000, height: 700 } }, "RUN_METADATA")]);
  api.commit("sendTurn", api.command({ action: "ASK", topic: "R17_HINT" }));
  api.commit("sendTurn", api.command({ action: "DEAL", information: "OFFER_INFORMATION", terms: { units: 2, upfront: 70, repayment: 50, extra: 20, days: 7 } }));
  api.commit("sendTurn", api.command({ action: "ACCEPT", offerId: api.view.play.counteroffer.id, offerVersion: api.view.play.counteroffer.version })); api.flush();
  const log = api.getLog();
  assert.match(log.header.fileBase, /^2026-10-01_18-05-12-0400_r17-proof-0_/);
  assert.equal(log.header.endStatus, "AGREED"); assert.equal(log.header.userAgent, "test-browser"); assert.equal(log.turns.length, 3);
  assert.deepEqual(log.turns[1].event, api.view.debug.state.events[1]); assert.equal(log.turns[1].submittedTerms.extra, 20); assert.equal(log.turns[1].normalizedTerms.extra, 4);
  assert.equal(log.header.private.marcusInterest, "cares"); assert.equal(log.header.private.r17Version, "GOOD");
  const json = api.engine.exportLog("json"), md = api.engine.exportLog("md");
  assert.equal(json.basename, log.header.fileBase); assert.equal(md.basename, log.header.fileBase);
  assert.deepEqual(JSON.parse(json.content), log); assert.equal(json.content, JSON.stringify(log, null, 2) + "\n");
  assert.equal(md.content, renderLogMarkdown(log)); assert.match(md.content, /R-17 saved you \$4/);
});

test("restart replaces an open run, retains old UI identity, and does not overwrite a final walk-away", () => {
  const api = harness(), oldId = api.view.play.runId;
  api.commit("restart", api.command({ seed: "../../outside?", scenarioId: "marcus" })); api.flush(oldId, [ui(1)]); api.flush();
  const replaced = api.engine.exportLog("json", { runId: oldId }).log;
  assert.equal(replaced.header.endStatus, "REPLACED"); assert.equal(replaced.records.at(-1).source, "ui");
  const current = api.getLog(); assert.notEqual(current.header.runId, oldId); assert.ok(!current.header.fileBase.includes(".."));
  api.commit("sendTurn", api.command({ action: "WALK" })); api.flush(); const final = api.getLog(); assert.equal(final.header.endStatus, "WITHDRAWN");
  api.commit("restart", api.command({ seed: "r17-proof-0" })); api.flush();
  assert.equal(api.engine.exportLog("json", { runId: final.header.runId }).log.header.endStatus, "WITHDRAWN");
});

test("interrupted log snapshots stay readable and incomplete; corrupt saved evidence never restores state", () => {
  const api = harness(); api.flush(undefined, [ui(1, {}, "PAGE_HIDDEN")]);
  const fresh = createLocalEngine(api.settings), recovered = fresh.exportLog("json", { previous: true }).log;
  assert.equal(recovered.header.endStatus, "incomplete"); assert.equal(recovered.records.at(-1).type, "PAGE_HIDDEN"); assert.match(renderLogMarkdown(recovered), /incomplete/);
  assert.equal(fresh.getState().play.version, 0);
  api.saved.set(PLAYTEST_STORAGE_KEY, api.saved.get(PLAYTEST_STORAGE_KEY) + '{"incomplete":');
  const corrupt = createLocalEngine(api.settings); assert.equal(corrupt.hasPreviousLog(), false); assert.equal(corrupt.getState().play.version, 0); assert.ok(api.errors.length > 0);
});

test("log intake rejects wrong runs, forged authority and oversized or path-bearing envelopes without changing gameplay", () => {
  const api = harness(), before = JSON.stringify(api.view), body = { runId: api.view.play.runId, batchId: "batch", records: [ui(1)] };
  const rejects = (input, code) => assert.throws(() => api.engine.ingestLog(input), error => typeof error.message === "string" && error.status === code);
  rejects({ ...body, runId: "../../outside" }, 404); rejects({ ...body, filename: "../../outside" }, 400);
  rejects({ ...body, records: [{ ...ui(1), type: "TURN_COMMITTED" }] }, 400);
  rejects({ ...body, records: [ui(1, { text: "x".repeat(50000) })] }, 413);
  rejects({ ...body, records: [ui(1, { source: "engine" })] }, 400);
  assert.equal(JSON.stringify(api.engine.getState()), before);
});

test("UI retries are idempotent and do not spend a gameplay request or turn", () => {
  const api = harness(), before = api.view.play.version;
  assert.equal(api.flush(undefined, [ui(1)]).accepted, 1); assert.equal(api.flush(undefined, [ui(1)]).accepted, 0);
  assert.equal(api.getLog().records.filter(record => record.type === "UI_ACTION").length, 1);
  api.commit("sendTurn", api.command({ action: "WALK" })); assert.equal(api.view.play.version, before + 1);
});

test("unwritable browser storage never changes a gameplay result or projection", () => {
  const api = harness({ storage: { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } } });
  const command = api.command({ action: "WALK" }), expected = projectConversation(resolveConversation(api.view.debug.state, command, mode), "LOCAL-OFFLINE", mode); delete expected.csrf;
  api.commit("sendTurn", command); assert.deepEqual(api.view, expected); assert.equal(api.flush().persisted, false); assert.ok(api.errors.length > 0);
});

test("automated logging tests write nothing into the repository log folder", () => {
  assert.deepEqual(existsSync(localLogRoot) ? readdirSync(localLogRoot).sort() : [], beforeLocalFiles);
});
