import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createMarcusWorld, advanceMarcusWorld, projectMarcusEconomy, worldAssertion } from "../src/encounter/marcus-world.mjs";
import { projectMarcusLore, projectPlayerInformation, projectMarcusInformation } from "../src/encounter/marcus-world-adapter.mjs";
import { createLedger, createEvent, appendCommit } from "../src/world/ledger.mjs";
import { createClaim } from "../src/world/claims.mjs";

const fixture = JSON.parse(fs.readFileSync(new URL("./fixtures/marcus-world-model-baseline-v01.json", import.meta.url)));
const legacyKeys = ["knowledge", "beliefs", "disclosure", "evidence", "privateFactId", "progressKeys", "negativeWindow"];
function worldState(run) {
  const initial = run.snapshots[0].outcome;
  return { seed: run.seed, runId: "frozen-marcus-oracle", quirk: initial.quirk, status: initial.status,
    metrics: structuredClone(initial.metrics), counteroffer: null, events: [], ...createMarcusWorld(run.seed, initial.quirk) };
}
// Component tests supply recorded encounter-local policy inputs. Information and
// hard state are independently derived. Full runtime/public parity is covered by
// marcus-world-model-baseline.test.mjs; no temporary baseline runtime remains.
for (const run of fixture.runs) test(`Marcus world transition projections: ${run.id}`, () => {
  let state = worldState(run);
  function compare(index) {
    const actual = projectMarcusLore(state), expected = run.snapshots[index];
    assert.deepEqual(Object.fromEntries(legacyKeys.map(key => [key, actual[key]])), expected.legacy, `${run.id} snapshot ${index}: independently derived information`);
    const economic = projectMarcusEconomy(state.world);
    assert.deepEqual(economic.obligations, expected.outcome.obligations);
    for (const [key, value] of Object.entries(economic.metrics)) assert.equal(value, expected.outcome.metrics[key], `${run.id}:${index}:${key}`);
  }
  compare(0);
  for (const [index, step] of run.steps.entries()) {
    if (step.control === "REMOVE_NEGATIVE_WINDOW") state.informationLocal.negativeWindow = null;
    const input = run.inputs[index];
    const outcome = run.snapshots[index + 1].outcome;
    const worldEffect = advanceMarcusWorld(state, input, { status: outcome.status });
    state = { ...state, ...worldEffect, events: [...state.events, { intent: input }],
      metrics: structuredClone(outcome.metrics), counteroffer: structuredClone(outcome.counteroffer), status: outcome.status };
    compare(index + 1);
  }
});

test("Reading L42 alone does not report a statement or stance Marcus never expressed", () => {
  const run = fixture.runs.find(item => item.snapshots[0].outcome.variant === "NEGATIVE");
  const state = worldState(run);
  let rebuilt = createLedger({ seed: state.world.seed, entities: state.world.entities });
  for (const original of state.world.events) {
    if (original.kind === "STATEMENT" && original.payload.speakerId === "MARCUS" && original.payload.claimIds.includes("L42:body:0")) continue;
    const { time, placeId, presentIds, observability, provenance, causedBy, commitGroup } = original;
    const event = createEvent(rebuilt, original.kind, original.payload, { time, placeId, presentIds, observability, provenance, causedBy, commitGroup });
    const claims = state.world.claims.filter(claim => claim.originEventId === original.eventId).map(claim => ({ ...claim, originEventId: event.eventId }));
    rebuilt = appendCommit(rebuilt, [event], claims);
  }
  state.world = rebuilt;
  const player = projectPlayerInformation(state);
  assert.ok(player.perceptions.some(record => record.channel === "READ" && record.act.documentId === "L42"));
  assert.ok(!player.factIds.includes("RECORD_ASSERTION"));
  assert.ok(player.factIds.includes("NEGATIVE_DISCREPANCY"));
});

function initialWorld(variant) {
  const run = fixture.runs.find(item => item.snapshots[0].outcome.variant === variant);
  return worldState(run);
}
function rebuildWith(state, change) {
  let rebuilt = createLedger({ seed: state.world.seed, entities: state.world.entities });
  for (const original of state.world.events) {
    const payload = change(structuredClone(original));
    if (!payload) continue;
    const { time, placeId, presentIds, observability, provenance, causedBy, commitGroup } = original;
    const event = createEvent(rebuilt, original.kind, payload, { time, placeId, presentIds, observability, provenance, causedBy, commitGroup });
    const allowed = original.kind === "DOCUMENT_ISSUED" ? payload.parts.flatMap(part => part.claimIds) : payload.claimIds;
    const claims = state.world.claims.filter(claim => claim.originEventId === original.eventId && (!allowed || allowed.includes(claim.claimId))).map(claim => ({ ...claim, originEventId: event.eventId }));
    rebuilt = appendCommit(rebuilt, [event], claims);
  }
  state.world = rebuilt;
  return state;
}
test("A later private need cancellation replaces its earlier value in Marcus's own view", () => {
  const state = initialWorld("POSITIVE"), before = projectPlayerInformation(state);
  assert.equal(projectMarcusInformation(state).pickupNeed, true);
  const assertion = { ...worldAssertion("need-ended", "NEEDS", { subject: "MARCUS", object: "COLLECTION_ARRANGED" }), polarity: "NEGATED" };
  state.world = appendCommit(state.world, [createEvent(state.world, "ATTITUDE_SET", { holderId: "MARCUS", assertion }, { placeId: "COUNTER", presentIds: ["MARCUS"], observability: "PRIVATE" })]);
  const view = projectMarcusInformation(state);
  assert.equal(view.pickupNeed, false); assert.equal(view.relevant, false);
  assert.equal(view.attitudes.filter(item => item.keywordId === "NEEDS").length, 1);
  assert.equal(view.attitudes.find(item => item.keywordId === "NEEDS").polarity, "NEGATED");
  assert.deepEqual(projectPlayerInformation(state), before);
});
test("A lone R17 docket cannot reveal unread gate and time, and one count cannot reveal a mismatch", () => {
  const positive = rebuildWith(initialWorld("POSITIVE"), event => {
    if (event.kind === "DOCUMENT_ISSUED" && event.payload.documentId === "R17") event.payload.parts.find(part => part.partId === "body").claimIds = ["R17:body:2"];
    return event.payload;
  });
  const player = projectPlayerInformation(positive);
  assert.equal(player.privateFactId, null); assert.ok(!player.factIds.includes("POSITIVE_ROUTE"));
  assert.equal(player.bodyClaims.length, 1); assert.equal(player.bodyClaims[0].proposition.args.attribute, "docket");
  assert.ok(!JSON.stringify(player.facts).includes("between 07:00"));
  const changed = initialWorld("POSITIVE");
  changed.world = structuredClone(changed.world);
  changed.world.claims.find(claim => claim.claimId === "R17:body:0").proposition.args.value = "COUNTER";
  rebuildWith(changed, event => event.payload);
  assert.equal(projectPlayerInformation(changed).privateFactId, null, "A received different gate cannot license the static gate-C sentence");
  const negative = rebuildWith(initialWorld("NEGATIVE"), event => event.kind === "DOCUMENT_PRESENTED" && event.payload.documentId === "L42" ? null : event.payload);
  const negativePlayer = projectPlayerInformation(negative);
  assert.equal(negativePlayer.privateFactId, null); assert.ok(!negativePlayer.factIds.includes("NEGATIVE_DISCREPANCY"));
  assert.ok(negativePlayer.factIds.includes("RECORD_ASSERTION"), "Marcus's TOLD claim remains, but is not a READ of the count");
});
test("Only the current trust attitude supplies TOLD rank to Marcus", () => {
  const state = initialWorld("POSITIVE");
  const options = { placeId: "COUNTER", presentIds: ["PLAYER", "MARCUS"] };
  const setTrust = polarity => { const assertion = { ...worldAssertion(`trust:${polarity}`, "TRUSTS", { subject: "MARCUS", object: "PLAYER" }), polarity }; state.world = appendCommit(state.world, [createEvent(state.world, "ATTITUDE_SET", { holderId: "MARCUS", assertion }, { ...options, observability: "PRIVATE" })]); };
  setTrust("ASSERTED");
  const event = createEvent(state.world, "STATEMENT", { speakerId: "PLAYER", audienceIds: ["MARCUS"], earshotIds: [], claimIds: ["trust-test"], resolution: "EXACT", delivery: { vibeId: "EA", intensity: "BALANCED", landed: 1 } }, options);
  const claim = createClaim({ claimId: "trust-test", proposition: worldAssertion("trust-test", "HAS_ATTRIBUTE", { subject: "INTAKE", attribute: "crates", value: 7 }), category: { categoryId: "COUNT_TEST", label: "A count" }, carrier: { actorId: "PLAYER" }, originEventId: event.eventId });
  state.world = appendCommit(state.world, [event], [claim]);
  assert.equal(projectMarcusInformation(state).beliefs.find(belief => belief.heldClaim === claim.claimId).rank, 2);
  setTrust("NEGATED");
  assert.equal(projectMarcusInformation(state).beliefs.find(belief => belief.heldClaim === claim.claimId).rank, 1);
});
