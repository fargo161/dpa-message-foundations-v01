import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createConversation, resolveConversation, projectConversation } from "../src/conversation/runtime.mjs";
import { createRunRecorder, localTime, logBasename, portableValue, assembleRecords, validateUiBatch, LOG_LIMITS } from "../src/playtest/recorder.mjs";
import { renderLogMarkdown } from "../src/playtest/markdown.mjs";
import { oracleSnapshot } from "./helpers/marcus-world-model-oracle.mjs";
import { informationVariant, r17Interest } from "../src/encounter/marcus-world.mjs";
const mode = { languageMode: "AUTHORING_PREVIEW" }, view = state => projectConversation(state, "log-test", mode);
const input = (state, fields) => ({ requestId: `log_request_${state.events.length}`, runId: state.runId, version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields });
const startMs = Date.parse("2026-10-01T22:05:12.000Z");
const observation = (seq, type = "UI_ACTION", data = { label: "More things to say", target: "more" }) => ({ type, clientEventId: `client-${seq}`, clientSeq: seq, observedT: new Date(startMs + seq).toISOString(), observedMs: seq, data });
const batch = (runId, records) => ({ runId, batchId: "test-batch", records });

test("recorder uses local time with numeric offset and also preserves UTC", () => {
  assert.deepEqual(localTime(startMs, -240), { utc: "2026-10-01T22:05:12.000Z", local: "2026-10-01T18:05:12.000-04:00", offset: "-0400", filenameTime: "2026-10-01_18-05-12-0400" });
  assert.equal(localTime(startMs, 330).local, "2026-10-02T03:35:12.000+05:30");
  assert.match(logBasename(startMs, "../../unsafe?seed", "run:one", -240), /^2026-10-01_18-05-12-0400_[A-Za-z0-9_-]+_run-one$/);
});

test("scripted run captures exact submitted/normalized terms, faces, screen and end summary without mutating engine", () => {
  let state = createConversation("marcus", "r17-proof-0", "logger-script"); let now = startMs;
  const recorder = createRunRecorder(state, { view: view(state), clock: () => now, offsetMinutes: -240 });
  recorder.ingest(batch(state.runId, [observation(1, "RUN_METADATA", { userAgent: "test-browser", viewport: { width: 1000, height: 700 } }), observation(2)]));
  const steps = [{ action: "ASK", topic: "R17_HINT" }, { action: "DEAL", terms: { units: 2, upfront: 70, repayment: 50, extra: 9999, days: 7 }, information: "OFFER_INFORMATION" }, { action: "ACCEPT" }];
  for (const fields of steps) {
    if (fields.action === "ACCEPT") Object.assign(fields, { offerId: state.counteroffer.id, offerVersion: state.counteroffer.version });
    const submitted = input(state, fields), before = state; state = resolveConversation(state, submitted, mode);
    const untouched = JSON.stringify(state); now += 100;
    const record = recorder.turn(before, state, submitted, view(state));
    assert.deepEqual(record.data.event, state.events.at(-1)); assert.deepEqual(record.data.faces, state.events.at(-1).faces);
    assert.equal(record.data.outcome, state.events.at(-1).outcome); assert.equal(record.data.playerLine, state.events.at(-1).playerText); assert.equal(record.data.marcusReply, state.events.at(-1).marcusText);
    assert.equal(JSON.stringify(state), untouched);
    recorder.ingest(batch(state.runId, [observation(10 + state.events.length, "SCREEN_OBSERVED", { turn: state.events.length, text: { "edge-note": { text: view(state).play.edge.card.label } } })]));
  }
  const log = recorder.assemble();
  assert.equal(log.header.endStatus, "AGREED"); assert.equal(log.header.private.r17Version, "GOOD"); assert.equal(log.header.private.marcusInterest, "cares");
  assert.equal(log.turns[1].submittedTerms.extra, 9999); assert.equal(log.turns[1].normalizedTerms.extra, 4); assert.equal(log.turns[1].charge.rate, 8);
  assert.equal(log.turns[1].charge.standardExtra, 8); assert.equal(log.endSummary.savingsLine, "R-17 saved you $4 on the extra charge.");
  assert.equal(log.turns[2].screenObservations.length, 1); assert.equal(log.turns[1].reactionFamily, "R17_TRADE_VALUABLE");
  assert.deepEqual(log.turns[1].metricsAfter, state.events[1].after); assert.equal(log.turns[1].screenState.extraChargeRate, 8);
  const md = renderLogMarkdown(log); assert.match(md, /SPOILERS — private run facts/); assert.match(md, /Full turns/); assert.match(md, /R-17 saved you \$4/);
  assert.deepEqual(assembleRecords(log.records).turns, log.turns);
});

test("sequences are monotonic across delayed UI observations, clock rollback and retries", () => {
  const state = createConversation("marcus", "r17-proof-2", "logger-order"); let now = startMs;
  const recorder = createRunRecorder(state, { clock: () => now });
  now += 20; recorder.ingest(batch(state.runId, [observation(1)]));
  now -= 100; recorder.ingest(batch(state.runId, [observation(2)]));
  assert.equal(recorder.ingest(batch(state.runId, [observation(1)])), 0);
  const records = recorder.assemble().records;
  records.forEach((record, index) => { assert.equal(record.seq, index + 1); assert.equal(new Date(record.t).toISOString(), record.t); assert.ok(record.ms >= (records[index - 1]?.ms ?? 0)); });
  assert.equal(records[2].observedMs, 2); assert.equal(records[2].clientSeq, 2);
});

test("all seeded private combinations are truthful only in the separate log header", () => {
  for (const seed of ["r17-proof-0", "r17-proof-1", "r17-proof-2", "r17-proof-19"]) {
    const state = createConversation("marcus", seed, "private-run"), before = view(state);
    const recorder = createRunRecorder(state, { view: before });
    assert.equal(recorder.header.private.r17Version, informationVariant(seed) === "POSITIVE" ? "GOOD" : "BAD");
    assert.equal(recorder.header.private.marcusInterest, r17Interest(seed) ? "cares" : "doesn't care");
    assert.deepEqual(view(state), before); assert.equal(before.play.r17RateContext.knownMarcusInterest, null); assert.equal(Object.hasOwn(before.play, "private"), false);
  }
});

test("path-bearing values and keys are omitted while relative references remain", () => {
  const machinePath = String.fromCharCode(67, 58, 47) + ["Users", "someone", "secret.txt"].join("/");
  const result = portableValue({ [machinePath]: machinePath, relative: "src/playtest/recorder.mjs", unix: "/" + ["home", "someone", "secret.txt"].join("/") });
  assert.equal(result["[local-path omitted]"], "[local-path omitted]"); assert.equal(result.relative, "src/playtest/recorder.mjs"); assert.equal(result.unix, "[local-path omitted]");
});

test("UI batches reject forged authority, malformed ordering and quotas before recording", () => {
  assert.throws(() => validateUiBatch(batch("run", [{ ...observation(1), type: "TURN_COMMITTED" }])), /UI observations/);
  assert.throws(() => validateUiBatch(batch("run", [observation(1, "UI_ACTION", { private: {} })])), /Reserved/);
  assert.throws(() => validateUiBatch(batch("run", [{ ...observation(1), clientSeq: -1 }])), /order/);
  assert.throws(() => validateUiBatch(batch("run", [observation(1, "UI_ACTION", { text: "x".repeat(LOG_LIMITS.uiRecord) })])), /oversized/);
  assert.throws(() => validateUiBatch(batch("run", Array.from({ length: 33 }, (_, index) => observation(index + 1)))), /large/);
});

test("replacement preserves completed results and initially leaves a partial run incomplete", () => {
  const recorder = createRunRecorder(createConversation("marcus", "r17-proof-0", "replace-one"));
  assert.equal(recorder.assemble().header.endStatus, "incomplete"); recorder.end("REPLACED");
  assert.equal(recorder.assemble().header.endStatus, "REPLACED"); recorder.end("AGREED");
  assert.equal(recorder.assemble().header.endStatus, "REPLACED");
});

test("throwing persistence sink cannot mutate gameplay or prevent authoritative recording", () => {
  const state = createConversation("marcus", "r17-proof-0", "sink-failure"), recorder = createRunRecorder(state, { onRecord() { throw new Error("disk unavailable"); } });
  const command = input(state, { action: "WALK" }), after = resolveConversation(state, command, mode), expected = JSON.stringify(after);
  recorder.turn(state, after, command, view(after)); assert.equal(JSON.stringify(after), expected); assert.equal(recorder.assemble().header.endStatus, "WITHDRAWN");
  assert.ok(recorder.header.diagnostics.length > 0);
});

test("logging on/off preserves all frozen routes and every golden outcome", () => {
  const proof = JSON.parse(readFileSync(new URL("./fixtures/marcus-r17-exchange-v01.json", import.meta.url)));
  for (const route of proof.runs) {
    let plain = createConversation("marcus", route.seed, "frozen-marcus-oracle"), logged = structuredClone(plain);
    const recorder = createRunRecorder(logged);
    assert.deepEqual(oracleSnapshot(logged), route.snapshots[0]);
    for (const [index, step] of route.steps.entries()) {
      if (step.control === "REMOVE_NEGATIVE_WINDOW") { plain = structuredClone(plain); logged = structuredClone(logged); plain.informationLocal.negativeWindow = null; logged.informationLocal.negativeWindow = null; }
      const command = route.inputs[index], before = logged;
      plain = resolveConversation(plain, command, mode); logged = resolveConversation(logged, command, mode);
      recorder.turn(before, logged, command, view(logged)); assert.deepEqual(logged, plain); assert.deepEqual(oracleSnapshot(logged), route.snapshots[index + 1]);
    }
  }
  const goldens = JSON.parse(readFileSync(new URL("../docs/marcus-information-exchange-v01/GOLDEN_RUNS.json", import.meta.url)));
  for (const route of goldens.routes) {
    let plain = createConversation("marcus", route.seed, `golden-log-${route.scenario}`), logged = structuredClone(plain);
    const recorder = createRunRecorder(logged);
    const actions = [...route.actions]; if (route.observations.length > actions.length) actions.push({ action: "ACCEPT" });
    for (const [index, fields] of actions.entries()) {
      const command = input(plain, fields); if (command.action === "ACCEPT") Object.assign(command, { offerId: plain.counteroffer.id, offerVersion: plain.counteroffer.version });
      const before = logged; plain = resolveConversation(plain, command, mode); logged = resolveConversation(logged, command, mode);
      recorder.turn(before, logged, command, view(logged)); assert.deepEqual(logged, plain); assert.equal(view(logged).play.extraChargeRate, route.observations[index].rate);
      if (logged.counteroffer) assert.deepEqual(logged.counteroffer, route.observations[index].offer && { ...route.observations[index].offer, id: logged.counteroffer.id });
    }
  }
});
