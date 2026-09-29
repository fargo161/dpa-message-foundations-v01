import test from "node:test";
import assert from "node:assert/strict";
import { createState } from "../src/encounter/state.mjs";
import { evaluateTurn as evaluatePolicy } from "../src/encounter/marcus-policy.mjs";
import { marcusDecisionContext } from "../src/encounter/marcus-world-adapter.mjs";
import { createConversation, resolveConversation } from "../src/conversation/runtime.mjs";

const deal = terms => ({ action: "DEAL", vibeId: "EA", intensity: "BALANCED", terms });
const evaluateTurn = (current, intent) => {
  const context = marcusDecisionContext(current), before = structuredClone(context);
  const result = evaluatePolicy(context, intent);
  assert.deepEqual(context, before, "Policy cannot mutate its narrowed NPC input");
  return result;
};
const original = { units: 4, upfront: 60, repayment: 180, extra: 24, days: 14 };
const afterProposal = () => {
  const state = createState("conversation-coverage-6", "refinement-policy", "plain_dealing");
  state.events.push({ intent: deal(original), progressKey: "FIRST_PROPOSAL" });
  return state;
};

test("one more dollar of security cannot disguise removing the whole fee as fresh concession", () => {
  const result = evaluateTurn(afterProposal(), deal({ ...original, upfront: 61, repayment: 179, extra: 0 }));
  assert.equal(result.derived.meaningfulProgress, false);
  assert.equal(result.derived.progressKey, "NONE");
  assert.ok(result.social.confidence <= 0);
});

test("a justified lower fee can remain progress when cash and principal improve enough", () => {
  const state = afterProposal();
  const result = evaluateTurn(state, deal({ ...original, upfront: 80, repayment: 160, extra: 20 }));
  assert.equal(result.derived.meaningfulProgress, true);
  assert.match(result.derived.progressKey, /^CONCESSION:/);
  assert.ok(result.social.confidence > 0);
  assert.equal(evaluateTurn(state, deal({ ...original, upfront: 80, repayment: 160, extra: 20, days: 15 })).derived.meaningfulProgress, false);
  assert.equal(evaluateTurn(state, deal({ ...original, extra: 25 })).derived.meaningfulProgress, false, "a fee-only edit is no fresh security record");
});

test("replaying a financial record cannot farm another concession", () => {
  const state = afterProposal();
  const input = deal({ ...original, upfront: 80, repayment: 160, extra: 20 });
  const first = evaluateTurn(state, input);
  state.events.push({ intent: input, progressKey: first.derived.progressKey });
  assert.equal(evaluateTurn(state, { ...input, vibeId: "SA" }).derived.meaningfulProgress, false);
});

test("shared probe route: hostile delivery cannot buy a fee-only counterdiscount", () => {
  let state = createConversation("marcus", "conversation-coverage-6", "refinement-policy");
  const submit = (current, extra) => resolveConversation(current, {
    requestId: `refinement-request-${current.events.length}`, runId: current.runId,
    version: current.events.length, action: "ASK", vibeId: "EA", intensity: "BALANCED", ...extra,
  });
  for (const topic of ["PRIORITIES", "VERIFY_SOURCE", "PROBE_USEFULNESS"]) state = submit(state, { topic });
  const terms = { units: 2, upfront: 60, repayment: 60, extra: 12, days: 7 };
  const before = structuredClone(state);
  const warm = submit(state, { action: "DEAL", vibeId: "SA", intensity: "OVERT", terms, information: "NONE" });
  const hostile = submit(state, { action: "DEAL", vibeId: "BA", intensity: "OVERT", terms, information: "NONE" });
  assert.equal(warm.events.at(-1).outcome, "ACCEPT");
  assert.equal(hostile.events.at(-1).outcome, "REJECT");
  assert.equal(hostile.counteroffer, null);
  assert.deepEqual(state, before);
  assert.equal(hostile.metrics.cash, before.metrics.cash);
  assert.equal(hostile.metrics.debt, before.metrics.debt);
});

test("genuine security counters and the established credit ceiling remain unchanged", () => {
  const state = createState("policy-fixture", "refinement-policy", "plain_dealing");
  const counter = evaluateTurn(state, deal({ units: 2, upfront: 40, repayment: 80, extra: 12, days: 7 }));
  assert.deepEqual(counter.counterTerms, { units: 2, upfront: 48, repayment: 72, extra: 11, days: 7 });
  const excessive = evaluateTurn(state, deal({ units: 8, upfront: 0, repayment: 480, extra: 9999, days: 30 }));
  assert.equal(excessive.derived.creditDefensible, false);
  assert.notEqual(excessive.outcome, "ACCEPT");
});
