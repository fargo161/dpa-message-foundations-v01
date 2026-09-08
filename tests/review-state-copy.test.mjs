import test from "node:test";
import assert from "node:assert/strict";
import { createState } from "../src/encounter/state.mjs";
import { resolveInformation } from "../src/encounter/information-policy.mjs";
import { loreOptions, projectLore } from "../src/encounter/knowledge.mjs";
import { keywordBank } from "../src/conversation/keyword-bank.mjs";
import { edgeView } from "../src/conversation/edge.mjs";
import { conversationView } from "../src/encounter/conversation.mjs";
import { createBrokenPromiseState, transitionBrokenPromise, projectBrokenPromise } from "../src/conversation/scenarios.mjs";

const ask = topic => ({ action: "ASK", topic, vibeId: "EA", intensity: "BALANCED" });
function step(state, intent) {
  const effect = resolveInformation(state, intent);
  return { ...structuredClone(state), lore: effect.lore, events: [...state.events, { intent }] };
}

test("information guidance tracks private, prepared and shared states without changing mechanics", () => {
  let state = createState("lore-3", "review-copy");
  assert.equal(state.lore.variant, "POSITIVE");
  const exchange = () => projectLore(state).informationOptions.find(item => item.id === "OFFER_INFORMATION");
  assert.equal(exchange().available, false);
  assert.match(exchange().reason, /source/);
  state = step(state, ask("VERIFY_SOURCE"));
  assert.doesNotMatch(edgeView(state).source.label, /wrongdoing/);
  assert.match(exchange().reason, /useful reason/);
  state = step(state, ask("PROBE_USEFULNESS"));
  assert.equal(exchange().available, true);
  state = step(state, ask("DISCLOSE_FULL"));
  assert.equal(exchange().available, false);
  assert.match(exchange().reason, /already has/);
  const before = structuredClone(state);
  const source = keywordBank(state).flatMap(card => card.actions).find(action => action.intent.topic === "VERIFY_SOURCE");
  assert.match(source.label, /already shared/);
  assert.doesNotMatch(source.description, /keeping|covered/);
  assert.match(loreOptions(state).find(topic => topic.id === "VERIFY_SOURCE").label, /already shared/);
  assert.match(projectLore(state).briefing.at(-1), /Marcus now has/);
  assert.deepEqual(state, before);
});

test("late proposal stays expired while an on-time proposal spends the one opening", () => {
  let prepared = createState("lore-0", "review-expiry");
  for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS", "QUESTION_RECORD", "DISCLOSE_FULL"]) prepared = step(prepared, ask(topic));
  let late = step(step(prepared, ask("PRIORITIES")), ask("DEBT"));
  assert.match(edgeView(late).opening.label, /1 turn remains/);
  late = step(late, ask("PRIORITIES"));
  const proposal = { action: "DEAL", information: "NONE", vibeId: "EA", intensity: "BALANCED" };
  late = step(late, proposal);
  assert.equal(edgeView(late).opening.status, "ELAPSED");
  assert.match(edgeView(late).opening.label, /expired before your proposal/);
  assert.equal(edgeView(step(prepared, proposal)).opening.status, "USED");
  assert.equal(late.lore.disclosure, "FULL");
});

test("Avery current knowledge records the unverified explanation through ending", () => {
  let state = createBrokenPromiseState("review-avery", "review-avery");
  for (const topic of ["EXPLANATION", "ACCOUNTABILITY", "ACCOUNTABILITY", "ACCOUNTABILITY", "ACCOUNTABILITY", "ACCOUNTABILITY"]) {
    state = transitionBrokenPromise(state, { ...ask(topic), requestId: `review_avery_${state.events.length}`, runId: state.runId, version: state.events.length });
    const before = structuredClone(state);
    const view = projectBrokenPromise(state, "csrf");
    assert.doesNotMatch(JSON.stringify(view.play.lore), /not heard an explanation/);
    assert.match(view.play.lore.playerKnowledge.join(" "), /bus broke down.*not independently checked/);
    assert.equal(view.options.keywords.find(card => card.id === "avery-explanation").kindLabel, "What Avery said");
    assert.deepEqual(state, before);
  }
  assert.equal(state.status, "ENDED");
});

test("patience ending explanation leads even when social signals improved", () => {
  const state = createState("lore-3", "review-ending");
  state.status = "ENDED";
  state.events = [{ intent: ask("CLARIFY_OFFER"), before: { confidence: 20, tension: 20 } }, { intent: ask("CLARIFY_OFFER") }];
  state.metrics.patience = 0;
  state.metrics.confidence = 40;
  state.metrics.tension = 10;
  assert.match(conversationView(state).outcomeQuality.relationalConsequences[0], /ran out of patience after repeated questions/);
});
