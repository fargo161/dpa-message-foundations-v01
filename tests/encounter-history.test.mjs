import test from "node:test";
import assert from "node:assert/strict";
import { createState, METRIC_DEFINITIONS } from "../src/encounter/state.mjs";
import { transition, projectState } from "../src/encounter/engine.mjs";
import { selectQuirk } from "../src/encounter/marcus-profile.mjs";

const start = (seed = "lore-review") => createState(seed, "history-review", selectQuirk(seed));
const input = (state, fields) => ({ requestId: `history_${state.events.length}`, runId: state.runId,
  version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields });
const ask = (state, topic, extra = {}) => transition(state, input(state, { action: "ASK", topic, ...extra }));
const propose = (state, terms, extra = {}) => transition(state, input(state, { action: "DEAL", terms, ...extra }));
const accept = (state) => transition(state, input(state, { action: "ACCEPT", offerId: state.counteroffer.id, offerVersion: state.counteroffer.version }));
const goodTerms = { units: 2, upfront: 60, repayment: 60, extra: 12, days: 7 };

test("lore history: optional contact and immediate business both permit useful credit", () => {
  const direct = accept(propose(start(), goodTerms));
  assert.equal(direct.status, "AGREED"); assert.ok(direct.metrics.playerStock >= 2); assert.ok(direct.obligations.principal > 0);
  const contact = ask(start(), "SMALL_TALK", { vibeId: "ES" });
  assert.ok(contact.metrics.confidence > start().metrics.confidence || contact.metrics.tension < start().metrics.tension);
  assert.equal(accept(propose(contact, goodTerms)).status, "AGREED");
  assert.equal(Object.keys(direct.metrics).length, 7);
  assert.equal(METRIC_DEFINITIONS.find(({ key }) => key === "patience").max, 20);
});

test("lore history: substantive progress beyond turn three and meaningful six-exchange route", () => {
  let state = start();
  for (const topic of ["SMALL_TALK", "ACK_MISSED", "VERIFY_SOURCE", "PROBE_USEFULNESS"]) {
    const previous = state; state = ask(state, topic, { vibeId: "SE" });
    assert.equal(state.status, "OPEN"); assert.ok(state.metrics.patience < previous.metrics.patience);
  }
  assert.ok(state.events[3].progressKey, "Fourth exchange should make specific progress");
  const weaker = { units: 2, upfront: 40, repayment: 80, extra: 0, days: 12 };
  state = propose(state, weaker);
  const prior = state;
  state = propose(state, goodTerms);
  assert.equal(state.events.length, 6); assert.ok(state.events.at(-1).progressKey, "Real later concession must count");
  assert.ok(state.metrics.confidence > prior.metrics.confidence || state.metrics.tension < prior.metrics.tension,
    "Real later concession must remain socially meaningful");
  const done = accept(state); assert.equal(done.status, "AGREED"); assert.ok(done.metrics.playerStock >= 2);
});

test("lore history: repeated and oscillating subjects cannot farm; finite end preserves resources", () => {
  let state = ask(start(), "SMALL_TALK", { vibeId: "ES" });
  for (let n = 0; n < 30 && state.status === "OPEN"; n++) {
    const before = state; state = ask(state, "SMALL_TALK", { vibeId: n % 2 ? "SE" : "EA" });
    assert.ok(state.metrics.confidence <= before.metrics.confidence); assert.ok(state.metrics.tension >= before.metrics.tension);
  }
  assert.equal(state.status, "ENDED"); assert.equal(state.metrics.cash, 80); assert.equal(state.metrics.playerStock, 0);
  let bargaining = propose(start(), goodTerms);
  const worse = { ...goodTerms, upfront: 40, repayment: 80 };
  bargaining = propose(bargaining, worse);
  const before = bargaining; bargaining = propose(bargaining, goodTerms, { vibeId: "SE", intensity: "OVERT" });
  assert.ok(bargaining.metrics.confidence <= before.metrics.confidence); assert.ok(bargaining.metrics.tension >= before.metrics.tension);
});

test("lore history: pure clarification preserves exact offer, material discussion invalidates it", () => {
  const offered = propose(start(), goodTerms); const offer = structuredClone(offered.counteroffer);
  const clarified = ask(offered, "CLARIFY_OFFER");
  assert.deepEqual(clarified.counteroffer, offer); assert.ok(clarified.metrics.patience < offered.metrics.patience);
  assert.equal(clarified.metrics.confidence, offered.metrics.confidence); assert.equal(clarified.metrics.tension, offered.metrics.tension);
  assert.equal(accept(clarified).status, "AGREED");
  const changed = ask(offered, "RISK");
  assert.throws(() => transition(changed, input(changed, { action: "ACCEPT", offerId: offer.id, offerVersion: offer.version })));
  const tired = structuredClone(offered); tired.metrics.patience = 1;
  const ended = ask(tired, "CLARIFY_OFFER"); assert.equal(ended.status, "ENDED"); assert.equal(ended.counteroffer, null);
});

test("lore history: worsening every risk measure cannot buy goodwill with a token upfront increase", () => {
  let state = propose(start(), { units: 1, upfront: 60, repayment: 0, extra: 0, days: 1 });
  const before = state;
  state = propose(state, { units: 8, upfront: 61, repayment: 419, extra: 0, days: 30 });
  assert.equal(state.events.at(-1).derived.creditDefensible, false);
  assert.equal(state.events.at(-1).derived.meaningfulProgress, false);
  assert.ok(state.metrics.confidence <= before.metrics.confidence); assert.ok(state.metrics.tension >= before.metrics.tension);
});

test("lore history: limited cash purchase and intended credit outcome stay distinct and transparent", () => {
  const cash = accept(propose(start(), { units: 1, upfront: 60, repayment: 0, extra: 0, days: 1 }));
  const credit = accept(propose(start(), goodTerms));
  assert.equal(cash.metrics.playerStock, 1); assert.equal(cash.metrics.cash, 20); assert.equal(cash.metrics.debt, 250);
  assert.equal(credit.metrics.playerStock, 2); assert.equal(credit.metrics.cash, 20); assert.equal(credit.metrics.debt, 320);
  const cashQuality = projectState(cash, "csrf").play.conversation.outcomeQuality;
  const creditQuality = projectState(credit, "csrf").play.conversation.outcomeQuality;
  assert.equal(cashQuality.creditObjectiveMet, false); assert.equal(creditQuality.creditObjectiveMet, true);
  assert.equal(cashQuality.cashRetained, cash.metrics.cash); assert.equal(creditQuality.newPrincipal, credit.obligations.principal);
});

test("lore history: every resolved turn including agreement, withdrawal and exhaustion has reaction continuity", () => {
  const routes = [accept(propose(ask(start(), "SMALL_TALK"), goodTerms)), transition(start(), input(start(), { action: "WALK" }))];
  let exhausted = start(); while (exhausted.status === "OPEN") exhausted = ask(exhausted, "TERMS"); routes.push(exhausted);
  for (const state of routes) for (const [index, event] of state.events.entries()) {
    assert.ok(event.reactionCause && typeof event.reactionCause === "object", `${event.outcome} lacks reaction cause`);
    const cause = event.reactionCause;
    assert.equal(cause.schemaVersion, "marcus-reaction-cause@0.1");
    assert.deepEqual(cause.turnRef, { runId: state.runId, index: index + 1 });
    assert.deepEqual(cause.continuity.previousTurnRef, index ? { runId: state.runId, index } : null);
    for (const key of ["action", "topic", "terms", "information", "vibeId", "intensity", "offerId", "offerVersion"]) {
      if (Object.hasOwn(event.intent, key)) assert.deepEqual(cause.semanticIntent[key], event.intent[key]);
    }
    assert.equal(cause.consequences.outcome, event.outcome);
    assert.deepEqual(cause.consequences.reasons, event.reasons);
    assert.equal(cause.consequences.transfersCommitted, event.outcome === "AGREED");
    assert.ok(cause.remainingAvenues.length > 0);
    if (index === state.events.length - 1) {
      assert.equal(cause.continuity.status, state.status); assert.equal(cause.continuity.phase, "RESOLUTION");
    }
    assert.ok(!/leftBrow|rightBrow|leftEye|rightEye|EMP_/.test(JSON.stringify(event.reactionCause)), "Later face mapping is out of scope");
  }
});
