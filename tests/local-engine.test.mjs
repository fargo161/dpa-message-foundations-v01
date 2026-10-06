import test from "node:test";
import assert from "node:assert/strict";
import { createLocalEngine, PLAYTEST_STORAGE_KEY, PLAYTEST_STORAGE_LIMIT } from "../public/encounter/local-engine.mjs";
import { resolveConversation, projectConversation } from "../src/conversation/runtime.mjs";
const mode = { languageMode: "AUTHORING_PREVIEW" };
function engine(options = {}) {
  let n = 0;
  return createLocalEngine({ seed: "r17-proof-0", generateId: () => `local-run-${++n}`,
    clock: () => Date.parse("2026-10-01T22:05:12Z"), offsetMinutes: -240, ...options });
}
const command = (e, fields, requestId = crypto.randomUUID()) => {
  const { play } = e.getState();
  return { runId: play.runId, version: play.version, requestId, ...fields };
};
const speak = fields => ({ vibeId: "EA", intensity: "BALANCED", ...fields });

test("local engine: preview is pure, commit is exact and duplicate identity survives restart", () => {
  const e = engine(), before = e.getState(), input = command(e, speak({ action: "ASK", topic: "R17_HINT" }));
  const preview = e.preview(input); assert.deepEqual(e.getState(), before); assert.deepEqual(e.preview(input), preview);
  const expected = projectConversation(resolveConversation(before.debug.state, input, mode), "LOCAL-OFFLINE", mode); delete expected.csrf;
  const next = e.sendTurn(input); assert.deepEqual(next, expected); assert.equal(next.play.events[0].playerText, preview.playerText);
  assert.throws(() => e.sendTurn(input), { message: "Submission already used." });
  assert.throws(() => e.preview(input), { message: "Submission already used." });
  e.restart(command(e, { seed: "r17-proof-2" }));
  assert.throws(() => e.sendTurn(input), { message: "Submission already used." });
  assert.equal(e.getState().play.version, 0);
});

test("local engine: restart validates exact fields, identity, version, seed and scenario before mutation", () => {
  const e = engine(), before = e.getState(), valid = command(e, { seed: "repeatable" });
  for (const fields of [{ seed: "" }, { seed: 9 }, { seed: "x".repeat(81) }, { seed: "bad\nseed" }, { state: {} },
    { version: 1 }, { version: "0" }, { runId: "foreign" }, { requestId: "bad" }, { scenarioId: "unknown" }]) {
    assert.throws(() => e.restart({ ...valid, ...fields })); assert.deepEqual(e.getState(), before);
  }
  const avery = e.restart({ ...valid, scenarioId: "broken-promise" }); assert.equal(avery.play.character.id, "avery");
  const marcus = e.restart(command(e, { seed: "repeatable" })); assert.equal(marcus.play.character.id, "marcus");
});

test("local engine: returned snapshots cannot mutate live state and stale parallel commands have one effect", async () => {
  const e = engine(), before = e.getState(); before.debug.state.metrics.cash = 9999; before.play.metrics.cash = 9999;
  assert.equal(e.getState().play.metrics.cash, 80);
  const input = command(e, speak({ action: "WALK" }));
  const outcomes = await Promise.allSettled([Promise.resolve().then(() => e.sendTurn(input)), Promise.resolve().then(() => e.sendTurn({ ...input, requestId: "parallel-request" }))]);
  assert.deepEqual(outcomes.map(item => item.status), ["fulfilled", "rejected"]);
  assert.equal(e.getState().play.events.length, 1); assert.equal(e.getState().play.status, "WITHDRAWN");
});

test("local engine: storage failure and throwing warnings cannot block authoritative gameplay", () => {
  const e = engine({ storage: { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } }, onWarning() { throw Error("warning blocked"); } });
  const view = e.sendTurn(command(e, speak({ action: "WALK" })));
  assert.equal(view.play.status, "WITHDRAWN"); assert.equal(e.exportLog().log.header.endStatus, "WITHDRAWN");
});

test("local engine: previous saved log is downloadable evidence and never restores gameplay", () => {
  const map = new Map(), storage = { getItem: key => map.get(key), setItem: (key, value) => map.set(key, value) };
  const prior = engine({ storage }); prior.sendTurn(command(prior, speak({ action: "WALK" })));
  const old = prior.exportLog(), fresh = engine({ storage });
  assert.equal(fresh.hasPreviousLog(), true); assert.equal(fresh.getState().play.version, 0);
  assert.deepEqual(fresh.exportLog("json", { previous: true }), old);
  assert.match(fresh.exportLog("md", { previous: true }).content, /WITHDRAWN/);
  assert.ok(map.get(PLAYTEST_STORAGE_KEY).length <= PLAYTEST_STORAGE_LIMIT);
});

test("local engine: face source injection changes image sources only", () => {
  const plain = engine().getState(), mapped = engine({ assetSource: src => `embedded:${src}` }).getState();
  for (const asset of [mapped.options.faceCatalog.base, ...mapped.options.faceCatalog.assets]) asset.src = asset.src.slice("embedded:".length);
  assert.deepEqual(mapped, plain);
});
