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
  assert.equal(capacity.candidatePairs, 8);
  assert.equal(capacity.theoretical, 4320);
  assert.equal(capacity.actCompatibleTheoretical, 4320);
  assert.equal(capacity.actIncompatible, 8640);
  assert.equal(capacity.blocked, 3660);
  assert.equal(capacity.duplicate, 0);
  assert.equal(capacity.unreachable, 0);
  assert.equal(capacity.validUnique, 660);
  assert.equal(capacity.totalCandidateCombinations, 12960);
  assert.equal(capacity.validUniqueSemanticConfigurations, 660);
  assert.equal(capacity.blockedCandidates, 3660);
  assert.deepEqual(capacity.classificationTotals, { theoretical: 4320, actIncompatible: 8640, blocked: 3660, duplicate: 0, unreachable: 0, validUnique: 660 });
  assert.ok(capacity.validUnique > 100);
  assert.ok(capacity.validConfigurations.every((entry) => entry.coordinateKey.startsWith(`${entry.macroAct}_`)));
});

test("truth scope, temporal validity, active context, and authored blockers govern availability", () => {
  const state = structuredClone(DEMO_SCENARIOS[0]);
  state.facts.find((entry) => entry.assertionId === "player_owes_marcus_250").scope = "BELIEF";
  const beliefEvaluation = evaluateAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  assert.equal(beliefEvaluation.status, "BLOCKED");
  assert.ok(beliefEvaluation.blockers.some((entry) => entry.code === "MISSING_OWES"));

  const futureState = structuredClone(DEMO_SCENARIOS[0]);
  futureState.facts.find((entry) => entry.assertionId === "player_owes_marcus_250").validFrom = "2026-09-03T00:00:00.000Z";
  assert.equal(evaluateAction(futureState, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION").status, "BLOCKED");

  const inactiveContext = structuredClone(DEMO_SCENARIOS[0]);
  inactiveContext.contexts[0].active = false;
  assert.ok(evaluateAction(inactiveContext, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION").blockers.some((entry) => entry.code === "CONTEXT_NOT_ACTIVE"));
  assert.ok(evaluateAction(DEMO_SCENARIOS[0], "REQUEST_EXTENSION", "player", "marcus_broker_hill", "MISSING_CONTEXT").blockers.some((entry) => entry.code === "CONTEXT_NOT_ACTIVE"));

  const blockedByState = structuredClone(DEMO_SCENARIOS[0]);
  blockedByState.blockers.push({ id: "negotiation_lock", actor: "player", target: "marcus_broker_hill", reason: "negotiation_suspended" });
  const evaluation = evaluateAction(blockedByState, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  assert.equal(evaluation.status, "BLOCKED");
  assert.ok(evaluation.blockers.some((entry) => entry.code === "STATE_BLOCKER"));
});

test("authority contradiction and relationship tension are explicit", () => {
  const access = structuredClone(DEMO_SCENARIOS[1]);
  access.facts.push({
    assertionId: "rowan_prohibits_player_archive",
    keywordId: "PROHIBITED",
    args: { subject: "rowan_warden", object: "player", term: "archive_door" },
    scope: "ACTUAL",
    polarity: "ASSERTED",
    status: "ACTIVE",
    contextIds: ["ACCESS_REVIEW"],
    validFrom: "2026-01-01T00:00:00.000Z",
    validUntil: null,
    provenance: { sourceId: "test", sourceVersion: "1", sourceRecordId: "rowan_prohibits_player_archive", transformVersion: "test@1", licenseId: "PROJECT_AUTHORED" },
    notes: [],
  });
  const contradiction = evaluateAction(access, "REQUEST_ACCESS", "player", "rowan_warden", "ACCESS_REVIEW");
  assert.equal(contradiction.status, "BLOCKED");
  assert.ok(contradiction.blockers.some((entry) => entry.code === "SPECIFIC_PROHIBITION" || entry.code === "CONTRADICTORY_AUTHORITY"));

  const support = evaluateAction(DEMO_SCENARIOS[0], "REQUEST_SUPPORT", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  assert.equal(support.status, "AVAILABLE");
  assert.equal(support.consistencyChecks[0].code, "TRUST_RESENTMENT_TENSION");
});

test("blocked actions are quarantined and repeated resolutions receive unique history IDs", () => {
  const state = DEMO_SCENARIOS[0];
  const first = resolveAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  const second = resolveAction(first.stateAfter, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  assert.notEqual(first.emittedHistory[0].historyId, second.emittedHistory[0].historyId);
  assert.equal(new Set(second.stateAfter.history.map((entry) => entry.historyId)).size, 2);

  const blocked = resolveAction(state, "REQUEST_EXTENSION", "player", "apartment_305_entry", "PRIVATE_NEGOTIATION");
  assert.equal(blocked.outcome, "BLOCKED");
  assert.equal(blocked.payload, null);
  assert.equal(blocked.quarantine.status, "QUARANTINED");
  assert.ok(blocked.trace.some((step) => step.step === "BLOCKED_ACTION_QUARANTINED"));
});
