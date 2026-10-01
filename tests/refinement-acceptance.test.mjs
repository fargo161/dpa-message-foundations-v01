import test from "node:test";
import { projectMarcusLore } from "../src/encounter/marcus-world-adapter.mjs";
import { legacyEdgeView } from "../src/conversation/edge.mjs";
import assert from "node:assert/strict";
import { BASED_VIBES, DELIVERY_INTENSITIES } from "../src/based.mjs";
import { createConversation, resolveConversation, previewConversation, projectConversation } from "../src/conversation/runtime.mjs";

const options = { languageMode: "AUTHORING_PREVIEW" };
const fresh = (seed = "conversation-coverage-6", scenario = "marcus") => createConversation(scenario, seed, "independent-acceptance");
const intent = (state, fields) => ({ requestId: crypto.randomUUID(), runId: state.runId, version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields });
const act = (state, fields) => resolveConversation(state, intent(state, fields), options);
const ask = (state, topic) => act(state, { action: "ASK", topic });
const view = state => projectConversation(state, "test-csrf", options).play;

test("refinement independent: 120 preview coordinates describe delivery, remain pure and equal committed speech", () => {
  for (const scenario of ["marcus", "broken-promise"]) {
    const state = fresh("conversation-coverage-6", scenario);
    const before = structuredClone(state);
    for (const vibe of BASED_VIBES) for (const intensity of DELIVERY_INTENSITIES) {
      const input = intent(state, { action: "ASK", topic: scenario === "marcus" ? "PRIORITIES" : "EXPLANATION", vibeId: vibe.vibeId, intensity });
      const preview = previewConversation(state, input, options);
      assert.match(preview.renderingStatus, /^AUTHORING_PREVIEW/);
      assert.deepEqual(Object.keys(preview.deliveryDescription).sort(), ["applicability", "description", "label", "note"]);
      for (const field of ["description", "label", "applicability"]) assert.ok(preview.deliveryDescription[field].length > 0);
      assert.equal(resolveConversation(state, input, options).events.at(-1).playerText, preview.playerText);
      assert.deepEqual(state, before);
      assert.equal(preview.readiness.productionProtocolsApproved, 0);
    }
  }
});

test("refinement independent: edge is persistent player-safe information, independent of secret temperament", async () => {
  const { edgeView } = await import("../src/conversation/edge.mjs");
  for (const seed of ["conversation-coverage-6", "conversation-coverage-9"]) {
    let state = fresh(seed);
    const initial = edgeView(state);
    assert.ok(initial.title && initial.detail);
    assert.deepEqual(Object.keys(initial).sort(), ["action", "card", "detail", "disclosure", "note", "observations", "relevance", "title"]);
    const altered = structuredClone(state);
    altered.quirk = "final_say";
    altered.metrics.confidence = 1;
    altered.metrics.tension = 89;
    altered.metrics.patience = 2;
    assert.deepEqual(edgeView(altered), initial, "Public edge must not reveal private temperament or scores");
    state = ask(state, "R17_HINT");
    assert.equal(view(state).edge.title, initial.title);
    state = ask(state, "DEBT");
    assert.equal(view(state).edge.title, initial.title, "Talking about debt cannot replace held-information panel");
    assert.ok(view(state).edge.observations.length);
  }
});

test("refinement independent: revealed negative opening expires for next action after turn seven", () => {
  let state = fresh();
  for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS", "QUESTION_RECORD", "DISCLOSE_FULL"]) state = ask(state, topic);
  assert.equal(state.events.length, 4);
  assert.equal(view(state).edge.opening, undefined);
  assert.equal(legacyEdgeView(state).opening.status, "AVAILABLE");
  assert.equal(legacyEdgeView(state).opening.remainingTurns, 3);
  for (const [topic, remaining] of [["DEBT", 2], ["RISK", 1], ["PRIORITIES", 0]]) {
    state = ask(state, topic);
    assert.equal(legacyEdgeView(state).opening.remainingTurns, remaining);
  }
  assert.equal(state.events.length, 7);
  assert.equal(legacyEdgeView(state).opening.status, "ELAPSED");
  assert.equal(state.informationLocal.negativeWindow.consumedAt, null, "Projection handles deadline before lazy resolver expires it");
});

test("refinement independent: conditional information remains private until confirmation and edge identifies pending exchange", () => {
  let state = ask(fresh("lore-3"), "R17_HINT");
  const factId = projectMarcusLore(state).privateFactId;
  state = act(state, { action: "DEAL", terms: { units: 2, upfront: 41, repayment: 79, extra: 0, days: 7 }, information: "OFFER_INFORMATION" });
  assert.ok(state.counteroffer?.informationExchange);
  assert.equal(projectMarcusLore(state).knowledge.marcus.includes(projectMarcusLore(state).privateFactId), false);
  assert.match(JSON.stringify(view(state).edge), /confirm/i);
  const offer = structuredClone(state.counteroffer);
  const before = structuredClone(state);
  const input = intent(state, { action: "ACCEPT", offerId: offer.id, offerVersion: offer.version });
  const preview = previewConversation(state, input, options);
  assert.match(preview.deliveryDescription.applicability, /does not (?:renegotiate|change).*terms/);
  assert.deepEqual(state, before);
  state = resolveConversation(state, input, options);
  assert.equal(state.events.at(-1).playerText, preview.playerText);
  assert.ok(projectMarcusLore(state).knowledge.marcus.includes(factId));
  assert.equal(projectMarcusLore(state).privateFactId, null);
  assert.equal(view(state).edge.disclosure.id, "FULL");
  assert.equal(view(state).edge.card.id, "TRADED");
  assert.equal(view(state).edge.card.physicallyHeld, false);
});

test("refinement independent: late and repeated preparation cannot imply restored secrecy or progress", () => {
  let state = ask(fresh(), "DISCLOSE_FULL");
  const preview = previewConversation(state, intent(state, { action: "ASK", topic: "VERIFY_SOURCE" }), options);
  assert.doesNotMatch(preview.playerText, /keeping.*covered|still.*private/i);
  assert.match(preview.playerText, /already|shared|showed|disclosed/i);
  for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS", "QUESTION_RECORD"]) state = ask(state, topic);
  assert.equal(legacyEdgeView(state).opening.status, "NOT_OPENED");
  assert.match(state.events.at(-1).feedback, /cannot.*replay|cannot.*fresh|cannot.*opening/i);
  state = ask(state, "PROBE_USEFULNESS");
  assert.match(state.events.at(-1).feedback, /already|repeat/i);
  assert.match(state.events.at(-1).feedback, /no new/);
  const cards = projectConversation(state, "test-csrf", options).options.keywords;
  const repeated = cards.flatMap(card => card.actions).filter(action => action.intent.topic === "PROBE_USEFULNESS");
  assert.equal(repeated.length, 0, "Deferred preparation is absent from the proof surface");
  assert.ok(cards.flatMap(card => card.actions).filter(action => ["R17_HINT", "R17_SHOW"].includes(action.intent.topic)).every(action => !action.available));
});

test("refinement independent: mixed economic deterioration earns no concession progress", () => {
  let state = act(fresh(), { action: "DEAL", terms: { units: 4, upfront: 60, repayment: 180, extra: 24, days: 14 } });
  state = act(state, { action: "DEAL", terms: { units: 4, upfront: 61, repayment: 179, extra: 0, days: 14 } });
  const event = state.events.at(-1);
  assert.equal(event.derived.meaningfulProgress, false);
  assert.doesNotMatch(event.progressKey ?? "", /^CONCESSION/);
});

test("refinement independent: hostile counter cannot cut fee alone", () => {
  let state = fresh();
  for (const topic of ["PRIORITIES", "VERIFY_SOURCE", "PROBE_USEFULNESS"]) state = ask(state, topic);
  const terms = { units: 2, upfront: 60, repayment: 60, extra: 12, days: 7 };
  state = act(state, { action: "DEAL", terms, vibeId: "BA", intensity: "OVERT" });
  const counter = state.counteroffer?.terms;
  if (counter && ["units", "upfront", "repayment", "days"].every(key => counter[key] === terms[key])) assert.ok(counter.extra >= terms.extra);
  assert.notEqual(state.status, "AGREED");
});

test("refinement independent: Avery keeps attributed knowledge and no Marcus information edge", () => {
  let state = fresh("avery-refinement", "broken-promise");
  assert.equal(view(state).edge, null);
  assert.ok(view(state).situation.summary && view(state).situation.objective);
  state = ask(state, "EXPLANATION");
  assert.equal(view(state).edge, null);
  assert.deepEqual(view(state).metrics, {});
  const claims = projectConversation(state, "test-csrf", options).options.keywords.filter(card => card.kind === "REPORTED_CLAIM");
  assert.equal(claims.length, 1);
  assert.match(claims[0].summary, /not independently checked/);
});
