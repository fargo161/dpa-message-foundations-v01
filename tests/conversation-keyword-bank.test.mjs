import test from "node:test";
import assert from "node:assert/strict";
import { keywordBank } from "../src/conversation/keyword-bank.mjs";
import { resolveContextAction } from "../src/conversation/context-actions.mjs";
import { createState, TOPICS } from "../src/encounter/state.mjs";
import { HISTORY_CONTENT, LORE_TOPICS } from "../src/encounter/history-content.mjs";
import { informationEligibility } from "../src/encounter/knowledge.mjs";
import { resolveInformation } from "../src/encounter/information-policy.mjs";

const initial = (seed = "lore-3") => createState(seed, "keyword-bank-test");
const card = (state, id) => keywordBank(state).find(item => item.id === id);
const move = (state, id, actionId) => card(state, id)?.actions.find(action => action.id === actionId);
const ask = topic => ({ action: "ASK", topic, vibeId: "EA", intensity: "BALANCED" });
function step(state, intent) {
  const effect = resolveInformation(state, intent);
  return { ...structuredClone(state), lore: effect.lore, events: [...state.events, { intent }] };
}
const prepare = state => step(step(state, ask("VERIFY_SOURCE")), ask("PROBE_USEFULNESS"));

test("keyword projection is deterministic, detached, read-only and hides NPC-private context", () => {
  for (const seed of ["lore-0", "lore-3"]) {
    const state = initial(seed), before = structuredClone(state);
    const bank = keywordBank(state);
    assert.deepEqual(keywordBank(state), bank);
    assert.deepEqual(state, before);
    assert.equal(new Set(bank.map(item => item.id)).size, bank.length);
    const text = JSON.stringify(bank);
    for (const hidden of ["LEDGER_CLOSING", "PICKUP_NEED", "negativeWindow", "scoreBonus", "plain_dealing", "recognition", "final_say", HISTORY_CONTENT.LEDGER_CLOSING.proposition, HISTORY_CONTENT.PICKUP_NEED.proposition]) assert.ok(!text.includes(hidden), hidden);
    bank[0].summary = "changed client copy";
    bank[0].actions[0].intent.action = "PRESSURE";
    assert.deepEqual(state, before);
    assert.notDeepEqual(keywordBank(state), bank);
  }
});

test("only known active subjects appear, and removing knowledge removes subject-bound actions", () => {
  for (const mutate of [
    state => { state.lore.knowledge.player = state.lore.knowledge.player.filter(id => id !== "POSITIVE_ROUTE"); },
    state => { state.lore.facts.POSITIVE_ROUTE.status = "INACTIVE"; },
    state => { state.lore.facts.POSITIVE_ROUTE.scope = "BELIEF"; },
    state => { delete state.lore.facts.POSITIVE_ROUTE; },
  ]) {
    const state = initial(); mutate(state);
    assert.equal(card(state, "collection-change"), undefined);
    assert.equal(move(state, "depot-counterfoil", "ask-disclose-full"), undefined);
    assert.throws(() => resolveContextAction(state, "collection-change", "ask-disclose-full"));
  }
  const state = initial();
  state.lore.knowledge.player = state.lore.knowledge.player.filter(id => id !== "MISSED_CHECKIN");
  assert.equal(card(state, "missed-check-in"), undefined);
  assert.equal(move(state, "old-account", "ask-ack-missed"), undefined);
  assert.equal(state.obligations.existing, 250);
  assert.deepEqual(keywordBank({ status: "OPEN" }), []);
});

test("cards distinguish reported claims and exact owned information without revealing the other route", () => {
  const positive = initial(), negative = initial("lore-0");
  assert.match(card(positive, "collection-change").summary, /gate C/);
  assert.equal(card(positive, "intake-mismatch"), undefined);
  assert.ok(!JSON.stringify(keywordBank(positive)).includes("two-crate mismatch"));
  assert.equal(card(negative, "collection-change"), undefined);
  assert.equal(card(negative, "reconciled-record").kind, "REPORTED_CLAIM");
  assert.match(card(negative, "reconciled-record").summary, /Marcus said/);
  assert.match(card(negative, "reconciled-record").summary, /neither.*establishes blame/);
});

test("all eligible authored ASK topics and ordinary actions remain reachable including risky moves", () => {
  for (const seed of ["lore-0", "lore-3"]) {
    const state = initial(seed), actions = keywordBank(state).flatMap(item => item.actions);
    for (const topic of [...TOPICS, ...LORE_TOPICS]) {
      if (informationEligibility(state, ask(topic.id)).allowed) assert.ok(actions.some(action => action.available && action.intent.topic === topic.id), `${seed}:${topic.id}`);
    }
    for (const action of ["DEAL", "WALK"]) assert.ok(actions.some(item => item.available && item.intent.action === action));
    assert.match(move(state, "old-account", "ask-guarantee").description, /unsupported claim/);
    assert.match(move(state, "contra-stock", "ask-entitlement").description, /strain/);
    for (const item of keywordBank(state)) {
      assert.equal(new Set(item.actions.map(action => action.id)).size, item.actions.length);
      const available = item.actions.filter(action => action.available);
      assert.deepEqual(item.actions.slice(0, Math.min(3, available.length)), available.slice(0, 3));
    }
  }
});

test("subject-action resolver rejects cross-subject, unknown, unavailable and mutated selections", () => {
  const state = initial(), before = structuredClone(state);
  assert.deepEqual(resolveContextAction(state, "old-account", "ask-debt"), { action: "ASK", topic: "DEBT" });
  for (const pair of [["old-account", "ask-disclose-full"], ["LEDGER_CLOSING", "ask-probe-usefulness"], ["collection-change", "offer-information"], ["__proto__", "constructor"], [null, "ask-debt"]]) {
    assert.throws(() => resolveContextAction(state, ...pair));
  }
  const selection = resolveContextAction(state, "old-account", "ask-debt");
  selection.topic = "DISCLOSE_FULL";
  assert.deepEqual(resolveContextAction(state, "old-account", "ask-debt"), { action: "ASK", topic: "DEBT" });
  assert.deepEqual(state, before);
});

test("positive information action follows existing preparation and cannot restore disclosed value", () => {
  const state = initial();
  assert.equal(move(state, "collection-change", "offer-information").available, false);
  const prepared = prepare(state), before = structuredClone(prepared);
  const intent = resolveContextAction(prepared, "collection-change", "offer-information");
  assert.deepEqual(intent, { action: "DEAL", information: "OFFER_INFORMATION" });
  assert.deepEqual(prepared, before);
  const offered = step(prepared, { ...intent, vibeId: "EA", intensity: "BALANCED" });
  assert.equal(offered.lore.disclosure, "PARTIAL");
  assert.ok(!offered.lore.knowledge.marcus.includes(offered.lore.privateFactId));
  assert.match(card(offered, "collection-change").summary, /remains withheld/);
  const disclosed = step(prepared, resolveContextAction(prepared, "collection-change", "ask-disclose-full"));
  assert.equal(move(disclosed, "collection-change", "offer-information").available, false);
  assert.match(card(disclosed, "collection-change").summary, /already shared/);
  assert.throws(() => resolveContextAction(prepare(disclosed), "collection-change", "offer-information"));
});

test("negative contextual route preserves prepared one-use opening and no browsing side effects", () => {
  let state = initial("lore-0");
  for (const actionId of ["ask-verify-source", "ask-probe-usefulness", "ask-question-record", "ask-disclose-full"]) {
    const intent = resolveContextAction(state, "intake-mismatch", actionId);
    state = step(state, { ...intent, vibeId: "EA", intensity: "BALANCED" });
  }
  assert.ok(state.lore.negativeWindow);
  const before = structuredClone(state);
  keywordBank(state); keywordBank(state);
  assert.deepEqual(state, before);
  const intent = resolveContextAction(state, "intake-mismatch", "propose-terms");
  const first = resolveInformation(state, { ...intent, vibeId: "EA", intensity: "BALANCED" });
  assert.equal(first.scoreBonus, 6);
  const used = step(state, { ...intent, vibeId: "EA", intensity: "BALANCED" });
  assert.equal(resolveInformation(used, { ...intent, vibeId: "EA", intensity: "BALANCED" }).scoreBonus, 0);
});

test("current-offer card preserves clarification and separates draft revision from exact confirmation", () => {
  const state = prepare(initial());
  assert.equal(card(state, "current-offer"), undefined);
  state.counteroffer = { id: "current-offer-id", version: 2, terms: { units: 2, upfront: 41, repayment: 79, extra: 0, days: 7 }, informationExchange: { factId: "POSITIVE_ROUTE", summary: "private collection instructions" } };
  const before = structuredClone(state);
  assert.deepEqual(resolveContextAction(state, "current-offer", "ask-clarify-offer"), { action: "ASK", topic: "CLARIFY_OFFER" });
  assert.deepEqual(resolveContextAction(state, "current-offer", "accept-offer"), { action: "ACCEPT" });
  assert.match(move(state, "current-offer", "ask-clarify-offer").description, /without changing/);
  assert.match(move(state, "old-account", "ask-debt").description, /replaces or closes/);
  assert.deepEqual(state, before);
  delete state.lore.facts.STOCK_TITLE;
  assert.equal(move(state, "current-offer", "accept-offer").available, false);
});

test("ended encounters retain readable knowledge but no keyword can authorize another turn", () => {
  for (const status of ["AGREED", "WITHDRAWN", "ENDED"]) {
    const state = initial(); state.status = status;
    assert.ok(keywordBank(state).length > 0);
    assert.ok(keywordBank(state).flatMap(item => item.actions).every(action => !action.available));
    assert.throws(() => resolveContextAction(state, "conversation", "walk-away"));
  }
});
