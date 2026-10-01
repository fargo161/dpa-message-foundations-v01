import { projectMarcusLore } from "../src/encounter/marcus-world-adapter.mjs";
import { withoutFact, alterPrivateClaim, setOldDebt, setResources, prepareInformation, rewriteMarcusHistory } from "./helpers/marcus-world-interventions.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { edgeView, legacyEdgeView } from "../src/conversation/edge.mjs";
import { keywordBank } from "../src/conversation/keyword-bank.mjs";
import { resolveContextAction } from "../src/conversation/context-actions.mjs";
import { createState } from "../src/encounter/state.mjs";
import { resolveInformation } from "../src/encounter/information-policy.mjs";

const initial = (seed = "lore-3") => createState(seed, "edge-refinement");
const ask = topic => ({ action: "ASK", topic, vibeId: "EA", intensity: "BALANCED" });
function step(state, intent) {
  intent = { vibeId: "EA", intensity: "BALANCED", ...intent };
  const effect = resolveInformation(state, intent);
  return { ...structuredClone(state), world: effect.world, informationLocal: effect.informationLocal, events: [...state.events, { intent, informationCauses: effect.causes }] };
}
const action = (state, topic) => keywordBank(state).flatMap(card => card.actions).find(item => item.intent.topic === topic);
function opened() {
  let state = initial("lore-0");
  for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS", "QUESTION_RECORD", "DISCLOSE_FULL"]) state = step(state, ask(topic));
  assert.ok(projectMarcusLore(state).negativeWindow);
  return state;
}

test("edge persists owned detail, uses observed evidence, and never projects NPC-private interpretation", () => {
  const state = initial(), before = structuredClone(state);
  const edge = edgeView(state);
  assert.match(edge.detail, /gate C/);
  assert.equal(edge.card.id, "HELD");
  assert.equal(edge.source, undefined);
  assert.equal(edge.relevance.id, "UNTESTED");
  state.metrics.tension = 99;
  state.quirk = { id: "SECRET_QUIRK" };
  const detached = projectMarcusLore(state);
  detached.beliefs.source = "CHECKED";
  detached.beliefs.relevance = "POSSIBLY_USEFUL";
  assert.deepEqual(edgeView(state), edge);
  edge.observations.push("client mutation");
  assert.deepEqual(edgeView(before).observations, []);
  const safe = JSON.stringify(edgeView(state));
  for (const secret of ["SECRET_QUIRK", "scoreBonus", "tension", "PICKUP_NEED", "LEDGER_CLOSING", "knowledge", "beliefs"]) assert.ok(!safe.includes(secret));
  assert.equal(edgeView({ status: "OPEN" }), null);
  withoutFact(state, projectMarcusLore(state).privateFactId);
  assert.equal(edgeView(state), null);
});

test("positive edge guides Hint and conditional Trade; Show spends the card", () => {
  let state = initial();
  assert.equal(edgeView(state).action.contextActionId, "ask-r17-hint");
  state = step(state, ask("R17_HINT"));
  const ready = edgeView(state);
  assert.equal(ready.disclosure.id, "PARTIAL");
  assert.equal(ready.action.contextActionId, "offer-information");
  assert.equal(ready.relevance.id, "CARES");
  assert.equal(ready.observations.length, 1);
  assert.deepEqual(resolveContextAction(state, ready.action.keywordId, ready.action.contextActionId), { action: "DEAL", information: "OFFER_INFORMATION" });
  state = step(state, { action: "DEAL", information: "OFFER_INFORMATION", vibeId: "EA", intensity: "BALANCED" });
  assert.equal(edgeView(state).disclosure.id, "PARTIAL");
  state = step(state, ask("R17_SHOW"));
  assert.equal(edgeView(state).disclosure.id, "FULL");
  assert.equal(edgeView(state).card.id, "SPENT");
  assert.equal(edgeView(state).action.contextActionId, "propose-terms");
});

test("opening advertises only remaining next-turn positions and used never implies reward", () => {
  let state = opened();
  assert.equal(legacyEdgeView(state).opening.remainingTurns, 3);
  assert.equal(edgeView(state).opening, undefined);
  const snapshot = structuredClone(state);
  edgeView(state); keywordBank(state);
  assert.deepEqual(state, snapshot);
  for (const remaining of [2, 1, 0]) {
    state = step(state, ask("PRIORITIES"));
    assert.equal(legacyEdgeView(state).opening.remainingTurns, remaining);
  }
  assert.equal(state.events.length, 7);
  assert.equal(projectMarcusLore(state).negativeWindow.expiredAt, undefined);
  assert.equal(legacyEdgeView(state).opening.status, "ELAPSED");
  const consumed = step(opened(), { action: "DEAL", information: "NONE", vibeId: "BD", intensity: "OVERT" });
  assert.equal(legacyEdgeView(consumed).opening.status, "USED");
  assert.match(legacyEdgeView(consumed).opening.label, /does not mean a concession/);
});

test("pending conditional offer is remembered and its clarification is preferred to replacement", () => {
  let state = initial();
  for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS"]) state = step(state, ask(topic));
  state.counteroffer = { informationExchange: { factId: "POSITIVE_ROUTE" } };
  const edge = edgeView(state);
  assert.equal(edge.disclosure.id, "PARTIAL");
  assert.equal(edge.action.keywordId, "current-offer");
  assert.equal(edge.action.contextActionId, "ask-clarify-offer");
  assert.ok(edge.observations.some(text => /remains yours and private until you confirm/.test(text)));
  assert.deepEqual(resolveContextAction(state, edge.action.keywordId, edge.action.contextActionId), { action: "ASK", topic: "CLARIFY_OFFER" });
});

test("early reveal and late preparation do not advertise a recreated opening", () => {
  let state = step(initial("lore-0"), ask("DISCLOSE_FULL"));
  assert.equal(legacyEdgeView(state).opening.status, "NOT_OPENED");
  for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS", "QUESTION_RECORD"]) state = step(state, ask(topic));
  assert.equal(legacyEdgeView(state).opening.status, "NOT_OPENED");
  assert.equal(edgeView(state).disclosure.id, "FULL");
  state.status = "ENDED";
  assert.equal(edgeView(state).action, null);
});

test("completed steps stay selectable, cross-topic hints count, and private browsing changes nothing", () => {
  let state = initial();
  assert.equal(action(state, "R17_HINT").completion.done, false);
  state = step(state, ask("R17_HINT"));
  const checked = action(state, "R17_HINT");
  assert.equal(checked.completion.done, true);
  assert.equal(checked.available, true);
  assert.equal(action(state, "R17_SHOW").completion.done, false);
  const before = structuredClone(state);
  keywordBank(state); edgeView(state);
  assert.deepEqual(state, before);
});
