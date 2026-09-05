import test from "node:test";
import assert from "node:assert/strict";
import { BASED_VIBES, DELIVERY_INTENSITIES } from "../src/based.mjs";
import { PERSONALITY, selectQuirk } from "../src/encounter/marcus-profile.mjs";
import { evaluateTurn } from "../src/encounter/marcus-policy.mjs";
import { playerMessage, marcusMessage } from "../src/encounter/messages.mjs";
import { createState } from "../src/encounter/state.mjs";

const state = (quirk = "plain_dealing") => createState("policy-fixture", "policy-run", quirk);
const ask = (topic = "TERMS", vibeId = "EA", intensity = "BALANCED") => ({ action: "ASK", topic, vibeId, intensity });
const deal = (terms = { units: 2, upfront: 40, repayment: 80, extra: 12, days: 7 }, vibeId = "EA", intensity = "BALANCED") => ({ action: "DEAL", terms, vibeId, intensity });

test("policy supports every canonical ordered Vibe without changing proposal semantics", () => {
  assert.deepEqual(Object.keys(PERSONALITY.reactions).sort(), BASED_VIBES.map(v => v.vibeId).sort());
  for (const vibe of BASED_VIBES) for (const intensity of DELIVERY_INTENSITIES) {
    const input = deal(undefined, vibe.vibeId, intensity);
    const original = structuredClone(input);
    const current = state();
    const originalState = structuredClone(current);
    const decision = evaluateTurn(current, input);
    assert.deepEqual(input, original);
    assert.deepEqual(current, originalState);
    assert.equal(decision.based.fusionLogic, vibe.fusionLogic);
    assert.deepEqual(Object.keys(decision.social).sort(), ["confidence", "patience", "tension"]);
    assert.ok(decision.reasons.length > 0);
  }
});

test("same seed picks the same quirk, all three quirks are reachable, policy is deterministic", () => {
  const picked = new Set();
  for (let i = 0; i < 100; i++) {
    assert.equal(selectQuirk(String(i)), selectQuirk(String(i)));
    picked.add(selectQuirk(String(i)));
  }
  assert.deepEqual([...picked].sort(), ["final_say", "plain_dealing", "recognition"]);
  assert.deepEqual(evaluateTurn(state(), deal()), evaluateTurn(state(), deal()));
});

test("cash, risk, repayment time and debt produce approval, distinct counters and refusals", () => {
  assert.equal(evaluateTurn(state(), deal({ units: 2, upfront: 60, repayment: 60, extra: 12, days: 7 })).outcome, "ACCEPT");
  const counter = evaluateTurn(state(), deal());
  assert.equal(counter.outcome, "COUNTER");
  assert.deepEqual(counter.counterTerms, { units: 2, upfront: 48, repayment: 72, extra: 11, days: 7 });
  const smaller = evaluateTurn(state(), deal({ units: 4, upfront: 80, repayment: 160, extra: 24, days: 20 }));
  assert.equal(smaller.outcome, "COUNTER");
  assert.deepEqual(smaller.counterTerms, { units: 3, upfront: 80, repayment: 100, extra: 15, days: 10 });
  const refusal = evaluateTurn(state(), deal({ units: 8, upfront: 0, repayment: 480, extra: 0, days: 30 }));
  assert.equal(refusal.outcome, "REJECT");
  const indebted = state(); indebted.metrics.debt = 650;
  assert.equal(evaluateTurn(indebted, deal()).outcome, "REJECT");
});

test("confidence cannot bypass practical limits and extravagant extra is not cash", () => {
  const current = state(); current.metrics.confidence = 100; current.metrics.tension = 0;
  const result = evaluateTurn(current, deal({ units: 8, upfront: 0, repayment: 480, extra: 9999, days: 30 }));
  assert.notEqual(result.outcome, "ACCEPT");
  assert.equal(result.derived.creditDefensible, false);
  assert.equal(current.metrics.cash, 80);
});

test("BASED/intensity reactions depend on context and have no universally best Vibe", () => {
  const business = evaluateTurn(state(), deal());
  const accountability = evaluateTurn(state(), ask("DEBT", "EA"));
  assert.notDeepEqual(business.based.contribution, accountability.based.contribution);
  assert.ok(business.based.contribution.confidence > evaluateTurn(state(), deal(undefined, "SE")).based.contribution.confidence);
  assert.ok(evaluateTurn(state(), ask("DEBT", "SE")).based.contribution.confidence > accountability.based.contribution.confidence);
  assert.ok(evaluateTurn(state(), ask("TERMS", "BA", "OVERT")).social.tension > evaluateTurn(state(), ask("TERMS", "BA", "SUBTLE")).social.tension);
});

test("history and current tension change decisions; tone switching cannot farm a topic", () => {
  const current = state();
  current.events.push({ intent: ask("DEBT", "SE") });
  const repeated = evaluateTurn(current, ask("DEBT", "EA", "OVERT"));
  assert.equal(repeated.derived.repetition, 1);
  assert.ok(repeated.social.confidence <= 0);
  assert.ok(repeated.social.tension >= 0);
  assert.equal(repeated.social.patience, -2);
  current.events = ["DEBT", "RISK", "PRIORITIES"].map(topic => ({ intent: ask(topic) }));
  assert.ok(evaluateTurn(current, ask("FINAL_SAY", "SE")).social.confidence <= 0);
  current.metrics.tension = 70;
  assert.equal(evaluateTurn(current, deal()).outcome, "REJECT");
  current.metrics.patience = 1;
  assert.equal(evaluateTurn(current, ask()).outcome, "END");
});

test("quirks are discoverable through priorities and welcome probes without diagnostic names", () => {
  for (const [id, quirk] of Object.entries(PERSONALITY.quirks)) {
    const current = state(id);
    const probe = evaluateTurn(current, ask("PRIORITIES", "SE"));
    assert.equal(probe.clue, quirk.clue);
    assert.ok(!probe.clue.includes(id));
    const welcome = evaluateTurn(current, ask(quirk.welcomeTopic, "SE"));
    assert.ok(welcome.social.confidence > 0);
    assert.ok(welcome.social.tension < 0);
    assert.equal(welcome.social.patience, -1);
    const unwelcome = evaluateTurn(current, ask(quirk.unwelcomeTopic, "SE"));
    assert.ok(unwelcome.social.confidence < welcome.social.confidence);
    assert.ok(!marcusMessage(current, ask("PRIORITIES"), probe).includes(id));
  }
});

test("authored messages retain exact terms, guarantee semantics, and explicit confirmation", () => {
  const intent = deal({ units: 2, upfront: 60, repayment: 60, extra: 12, days: 7 });
  const result = evaluateTurn(state(), intent);
  assert.match(playerMessage(intent), /2 Contra unit\(s\), \$60 upfront, \$60 new principal plus \$12 extra due in 7 day\(s\)/);
  assert.match(marcusMessage(state(), intent, result), /Review it and confirm/);
  assert.match(playerMessage(ask("GUARANTEE")), /My future profits are guaranteed/);
  const acceptance = playerMessage({ action: "ACCEPT", vibeId: "EA", intensity: "BALANCED", offerId: "private-diagnostic-id" }, { offer: { terms: intent.terms } });
  assert.match(acceptance, /2 Contra unit\(s\), \$60 upfront/);
  assert.ok(!acceptance.includes("private-diagnostic-id"));
  const confirm = evaluateTurn(state(), { action: "ACCEPT", vibeId: "BA", intensity: "OVERT" });
  assert.equal(confirm.outcome, "ACCEPT");
  assert.deepEqual(confirm.social, { confidence: 0, tension: 0, patience: 0 });
});
