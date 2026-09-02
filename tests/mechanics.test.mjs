import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_SCENARIOS, evaluateAction, evaluateAvailableActions, enumerateSemanticConfigurations, priorCannotMutateState, resolveAction } from "../src/mechanics.mjs";
import { generateMatrix } from "../src/based.mjs";

test("demo scenarios expose directional actions and authored blockers", () => {
  const marcus = DEMO_SCENARIOS[0];
  assert.equal(evaluateAction(marcus, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION").status, "AVAILABLE");
  assert.equal(evaluateAction(marcus, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION").status, "AVAILABLE");
  assert.equal(evaluateAction(marcus, "INVOKE_CONSEQUENCE", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION").status, "BLOCKED");
  const access = DEMO_SCENARIOS[1];
  assert.equal(evaluateAction(access, "REQUEST_ACCESS", "player", "rowan_warden", "ACCESS_REVIEW").status, "AVAILABLE");
  assert.equal(evaluateAction(access, "REQUEST_ACCESS", "third_party", "archive_door", "ACCESS_REVIEW").status, "BLOCKED");
  const secret = DEMO_SCENARIOS[2];
  assert.equal(evaluateAction(secret, "TRADE_INFORMATION", "imani_intermediary", "player", "PRIVATE_DISCLOSURE").status, "AVAILABLE");
  assert.ok(evaluateAction(secret, "REQUEST_EVIDENCE", "player", "imani_intermediary", "PRIVATE_DISCLOSURE").trace.some((step) => step.step === "AVAILABILITY_RESOLVED"));
});

test("resolution emits history only after preconditions pass and priors cannot mutate state", () => {
  const state = DEMO_SCENARIOS[0];
  const resolved = resolveAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  assert.equal(resolved.outcome, "PROPOSED");
  assert.equal(resolved.emittedHistory.length, 1);
  assert.equal(resolved.stateAfter.history.length, 1);
  const blocked = resolveAction(state, "REQUEST_EXTENSION", "player", "apartment_305_entry", "PRIVATE_NEGOTIATION");
  assert.equal(blocked.outcome, "BLOCKED");
  assert.equal(blocked.emittedHistory.length, 0);
  assert.equal(blocked.stateAfter.history.length, 0);
  const prior = priorCannotMutateState(state, { priorId: "prior_1", text: "suggested debt scene" });
  assert.equal(prior.unchanged, true);
  assert.equal(prior.prior.status, "SUGGESTION_ONLY");
  assert.equal(prior.prior.defaultOnly, true);
});

test("authored action capacity clears the requested proof threshold", () => {
  const capacity = enumerateSemanticConfigurations(DEMO_SCENARIOS, generateMatrix());
  assert.equal(capacity.theoretical, 12960);
  assert.equal(capacity.validUniqueSemanticConfigurations, 1980);
  assert.ok(capacity.validUniqueSemanticConfigurations > 100);
  assert.ok(capacity.blockedCandidates > 0);
});
