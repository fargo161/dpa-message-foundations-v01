import test from "node:test";
import assert from "node:assert/strict";
import { HISTORY_CONTENT, INFORMATION_RULES } from "../src/encounter/history-content.mjs";
import { createLore, hasLoreFact, informationEligibility, informationPlayerText, loreOptions, projectLore } from "../src/encounter/knowledge.mjs";
import { resolveInformation } from "../src/encounter/information-policy.mjs";
import { createState } from "../src/encounter/state.mjs";
import { selectQuirk } from "../src/encounter/marcus-profile.mjs";

const initial = (seed = "lore-3") => ({ ...createState(seed, "knowledge-unit", selectQuirk(seed)), lore: createLore(seed) });
const ask = topic => ({ action: "ASK", topic, vibeId: "EA", intensity: "BALANCED" });
const deal = (information = "NONE") => ({ action: "DEAL", information, vibeId: "EA", intensity: "BALANCED", terms: { units: 2, upfront: 40, repayment: 80, extra: 4, days: 7 } });
function step(state, intent) {
  const effect = resolveInformation(state, intent);
  return { ...structuredClone(state), lore: effect.lore, events: [...state.events, { intent, progressKey: effect.progressKey }], lastEffect: effect };
}
function prepare(state = initial()) { return ["VERIFY_SOURCE", "PROBE_USEFULNESS"].reduce((current, topic) => step(current, ask(topic)), state); }
function negativePrepared() { return step(prepare(initial("lore-0")), ask("QUESTION_RECORD")); }

test("knowledge catalog: ten frozen, grounded entries include complete mechanic and absence contracts", () => {
  assert.equal(Object.keys(HISTORY_CONTENT).length, 10);
  assert.ok(Object.isFrozen(HISTORY_CONTENT)); assert.ok(Object.isFrozen(INFORMATION_RULES));
  for (const [id, fact] of Object.entries(HISTORY_CONTENT)) {
    assert.equal(fact.id, id); assert.ok(Object.isFrozen(fact));
    for (const key of ["proposition", "provenance", "scope", "actor", "target", "context", "validity", "initialKnowers", "initialBelievers", "playerVisible", "interest", "mechanic", "use", "preconditions", "evidence", "repetition", "continuity", "acceptanceScenario"]) assert.notEqual(fact[key], undefined, `${id} lacks ${key}`);
  }
});

test("knowledge seed examples reproduce all six independent variant/quirk combinations", () => {
  const expected = { "lore-0": ["NEGATIVE", "recognition"], "lore-1": ["NEGATIVE", "plain_dealing"], "lore-2": ["NEGATIVE", "final_say"], "lore-3": ["POSITIVE", "recognition"], "lore-4": ["POSITIVE", "plain_dealing"], "lore-25": ["POSITIVE", "final_say"] };
  for (const [seed, pair] of Object.entries(expected)) {
    assert.deepEqual([createLore(seed).variant, selectQuirk(seed)], pair);
    assert.deepEqual(createLore(seed), createLore(seed));
    assert.equal(Object.keys(createLore(seed).facts).length, 8);
  }
});

test("opening reveals player's exact private knowledge without hidden interests or diagnostic keys", () => {
  for (const seed of ["lore-0", "lore-3"]) {
    const state = initial(seed), id = state.lore.privateFactId;
    assert.ok(state.lore.knowledge.player.includes(id));
    assert.ok(!state.lore.knowledge.marcus.includes(id));
    assert.ok(!state.lore.knowledge.marcusAwarePlayerKnows.includes(id));
    const view = projectLore(state);
    assert.ok(view.playerKnowledge.includes(state.lore.facts[id].proposition));
    assert.equal(view.disclosed.length, 0);
    const text = JSON.stringify(view);
    for (const hidden of ["LEDGER_CLOSING", "PICKUP_NEED", "negativeWindow", "plain_dealing", "recognition", "final_say", "scoreBonus"]) assert.ok(!text.includes(hidden));
    assert.ok(!text.includes(HISTORY_CONTENT.LEDGER_CLOSING.proposition));
  }
});

test("every meaningful fact has a concrete absence consequence, not merely altered prose", () => {
  const fixtures = [
    ["OLD_ACCOUNT", "lore-3", ask("DEBT")], ["STOCK_TITLE", "lore-3", deal()],
    ["MISSED_CHECKIN", "lore-3", ask("ACK_MISSED")], ["SHARED_LOADING_SHIFT", "lore-3", ask("SMALL_TALK")],
    ["DIRECT_RECEIPT", "lore-3", ask("VERIFY_SOURCE")], ["LEDGER_CLOSING", "lore-3", ask("PROBE_USEFULNESS")],
    ["POSITIVE_ROUTE", "lore-3", ask("DISCLOSE_FULL")], ["NEGATIVE_DISCREPANCY", "lore-0", ask("DISCLOSE_FULL")],
    ["RECORD_ASSERTION", "lore-0", ask("QUESTION_RECORD")],
  ];
  for (const [id, seed, intent] of fixtures) {
    const state = initial(seed); assert.equal(informationEligibility(state, intent).allowed, true, id);
    delete state.lore.facts[id]; const before = structuredClone(state);
    assert.equal(informationEligibility(state, intent).allowed, false, id);
    assert.throws(() => resolveInformation(state, intent), undefined, id);
    assert.deepEqual(state, before); assert.equal(state.obligations.existing, 250);
  }
  const present = prepare(), absent = initial(); delete absent.lore.facts.PICKUP_NEED;
  const absentPrepared = prepare(absent);
  assert.equal(informationEligibility(present, deal("OFFER_INFORMATION")).allowed, true);
  assert.equal(informationEligibility(absentPrepared, deal("OFFER_INFORMATION")).allowed, false);
  assert.equal(absentPrepared.lore.evidence.some(item => item.id === "RELEVANCE_OBSERVED"), false);
});

test("inactive, wrongly scoped or player-unknown facts cannot authorize private information", () => {
  for (const mutation of [state => { state.lore.facts.POSITIVE_ROUTE.status = "INACTIVE"; }, state => { state.lore.facts.POSITIVE_ROUTE.scope = "BELIEF"; }, state => { state.lore.knowledge.player = state.lore.knowledge.player.filter(id => id !== "POSITIVE_ROUTE"); }]) {
    const state = initial(); mutation(state);
    assert.equal(informationEligibility(state, ask("DISCLOSE_FULL")).allowed, false);
  }
  assert.equal(hasLoreFact(initial(), "missing"), false);
});

test("verification and partial disclosure never give Marcus the covered exact proposition", () => {
  let state = initial();
  for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS", "DISCLOSE_PARTIAL"]) state = step(state, ask(topic));
  assert.equal(state.lore.disclosure, "PARTIAL");
  assert.ok(state.lore.knowledge.marcus.includes("DIRECT_RECEIPT"));
  assert.ok(state.lore.knowledge.marcusAwarePlayerKnows.includes("POSITIVE_ROUTE"));
  assert.ok(!state.lore.knowledge.marcus.includes("POSITIVE_ROUTE"));
  assert.ok(projectLore(state).disclosed.every(text => !text.includes("gate C")));
  assert.equal(state.lore.beliefs.content, "UNKNOWN");
});

test("positive offer is voluntary, conditional and delivers exact information only at confirmation", () => {
  const state = prepare(); const before = structuredClone(state);
  const result = resolveInformation(state, deal("OFFER_INFORMATION"));
  assert.deepEqual(state, before); assert.equal(result.scoreBonus, 8);
  assert.equal(result.exchange.factId, "POSITIVE_ROUTE");
  assert.ok(!result.lore.knowledge.marcus.includes("POSITIVE_ROUTE"));
  assert.match(informationPlayerText(state, deal("OFFER_INFORMATION")), /free to decline/);
  const pending = { ...state, lore: result.lore, counteroffer: { informationExchange: result.exchange } };
  const confirmed = resolveInformation(pending, { action: "ACCEPT" });
  assert.equal(confirmed.lore.disclosure, "FULL"); assert.ok(confirmed.lore.knowledge.marcus.includes("POSITIVE_ROUTE"));
  assert.equal(confirmed.scoreBonus, 0); assert.deepEqual(confirmed.social, { confidence: 0, tension: 0 });
  const withdrawn = resolveInformation(pending, { action: "WALK" });
  assert.equal(withdrawn.lore.disclosure, "PARTIAL"); assert.ok(!withdrawn.lore.knowledge.marcus.includes("POSITIVE_ROUTE"));
});

test("early full disclosure permanently loses private exchange value and cannot be reversed with hints", () => {
  let state = step(initial(), ask("DISCLOSE_FULL"));
  state = prepare(state); state = step(state, ask("DISCLOSE_PARTIAL"));
  assert.equal(state.lore.disclosure, "FULL");
  assert.equal(informationEligibility(state, deal("OFFER_INFORMATION")).allowed, false);
  const repeated = resolveInformation(state, ask("DISCLOSE_FULL"));
  assert.deepEqual(repeated.social, { confidence: 0, tension: 0 }); assert.equal(repeated.scoreBonus, 0);
  assert.equal(repeated.progressKey, null);
});

test("late source and usefulness checks preserve full-disclosure continuity without reviving value", () => {
  for (const seed of ["lore-0", "lore-3"]) {
    const early = step(initial(seed), ask("DISCLOSE_FULL"));
    assert.equal(early.lore.beliefs.content, "RECEIVED_UNVERIFIED");
    const verified = step(early, ask("VERIFY_SOURCE"));
    assert.equal(verified.lore.beliefs.content, "DOCUMENT_SUPPORTED");
    assert.ok(verified.lore.evidence.some(item => item.text.includes("already disclosed")));
    const probed = step(verified, ask("PROBE_USEFULNESS"));
    assert.match(probed.lastEffect.feedback, /already been disclosed/);
    assert.ok(!probed.lastEffect.feedback.includes("still yours to disclose"));
    assert.equal(probed.lore.disclosure, "FULL"); assert.equal(probed.lore.negativeWindow, null);
    assert.equal(informationEligibility(probed, deal("OFFER_INFORMATION")).allowed, false);
  }
});

test("prepared negative disclosure revises a belief and opens one bounded next-DEAL benefit", () => {
  const current = negativePrepared(); const revealed = step(current, ask("DISCLOSE_FULL"));
  assert.equal(revealed.lore.beliefs.record, "DISPUTED");
  assert.equal(revealed.lore.negativeWindow.openedAt, 4);
  assert.equal(revealed.lore.negativeWindow.expiresAt, 7);
  const first = step(revealed, deal()); assert.equal(first.lastEffect.scoreBonus, 6);
  assert.equal(first.lore.negativeWindow.consumedAt, 5);
  assert.equal(resolveInformation(first, deal()).scoreBonus, 0);
  assert.equal(resolveInformation(first, ask("DISCLOSE_FULL")).scoreBonus, 0);
});

test("negative opportunity expires by event position, and a hostile first proposal consumes it", () => {
  let state = step(negativePrepared(), ask("DISCLOSE_FULL"));
  for (let i = 0; i < 3; i++) state = step(state, ask("TERMS"));
  assert.equal(resolveInformation(state, deal()).scoreBonus, 0);
  assert.ok(resolveInformation(state, deal()).causes.some(cause => cause.kind === "OPPORTUNITY_EXPIRED"));
  const opened = step(negativePrepared(), ask("DISCLOSE_FULL"));
  const hostileDeal = step(opened, { ...deal(), vibeId: "BD" });
  assert.equal(hostileDeal.lastEffect.scoreBonus, 0);
  assert.equal(resolveInformation(hostileDeal, deal()).scoreBonus, 0);
});

test("hostile or unprepared negative disclosure backlashes; later preparation cannot replay the reveal", () => {
  for (const [state, intent] of [[initial("lore-0"), ask("DISCLOSE_FULL")], [negativePrepared(), { ...ask("DISCLOSE_FULL"), vibeId: "BE", intensity: "OVERT" }]]) {
    const revealed = step(state, intent);
    assert.equal(revealed.lore.disclosure, "FULL"); assert.equal(revealed.lore.negativeWindow, null);
    assert.deepEqual(revealed.lastEffect.social, { confidence: -4, tension: 9 });
    assert.equal(resolveInformation(prepare(revealed), ask("DISCLOSE_FULL")).lore.negativeWindow, null);
  }
});

test("topic and fact repetition never repays goodwill, including a new Vibe", () => {
  for (const topic of ["SMALL_TALK", "ACK_MISSED", "VERIFY_SOURCE", "PROBE_USEFULNESS", "DISCLOSE_PARTIAL"]) {
    const first = step(initial(), ask(topic));
    const repeated = resolveInformation(first, { ...ask(topic), vibeId: "SE", intensity: "OVERT" });
    assert.deepEqual(repeated.social, { confidence: 0, tension: 0 }, topic);
    assert.equal(repeated.progressKey, null, topic);
  }
  assert.ok(loreOptions(initial()).every(option => typeof option.available === "boolean" && typeof option.reason === "string"));
});

test("category already supplied by a probe or offer cannot be farmed as a fresh partial disclosure", () => {
  const probed = step(initial(), ask("PROBE_USEFULNESS"));
  const offered = step(prepare(), deal("OFFER_INFORMATION"));
  for (const current of [probed, offered, negativePrepared()]) {
    const hint = resolveInformation(current, { ...ask("DISCLOSE_PARTIAL"), vibeId: "SE", intensity: "OVERT" });
    assert.equal(hint.progressKey, null);
    assert.deepEqual(hint.social, { confidence: 0, tension: 0 });
    assert.ok(hint.causes.some(cause => cause.kind === "TOPIC_EXHAUSTED"));
  }
});
