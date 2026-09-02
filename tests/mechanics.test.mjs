import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_SCENARIOS, evaluateAction, evaluateAvailableActions, enumerateSemanticConfigurations, fact, priorCannotMutateState, resolveAction } from "../src/mechanics.mjs";
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
  // The strict pressure grounding repair correctly removes the previously
  // available but unauthored secret-pressure branch: 600 valid, 3,720 blocked.
  assert.equal(capacity.blocked, 3720);
  assert.equal(capacity.duplicate, 0);
  assert.equal(capacity.unreachable, 0);
  assert.equal(capacity.validUnique, 600);
  assert.equal(capacity.totalCandidateCombinations, 12960);
  assert.equal(capacity.validUniqueSemanticConfigurations, 600);
  assert.equal(capacity.blockedCandidates, 3720);
  assert.deepEqual(capacity.classificationTotals, { theoretical: 4320, actIncompatible: 8640, blocked: 3720, duplicate: 0, unreachable: 0, validUnique: 600 });
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

test("INVOKE_CONSEQUENCE emits only a fully linked authored pressure payload", () => {
  const state = structuredClone(DEMO_SCENARIOS[0]);
  const resolved = resolveAction(state, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(resolved.outcome, "PROPOSED");
  assert.equal(resolved.payload.actor, "marcus_broker_hill");
  assert.equal(resolved.payload.target, "player");
  assert.equal(resolved.payload.contextId, "PRIVATE_NEGOTIATION");
  assert.deepEqual(resolved.payload.leverage, {
    actor: "marcus_broker_hill",
    target: "player",
    basis: "debt_250_usd",
    sourceAssertionId: "marcus_leverage_debt",
    scope: "ACTUAL",
    contextId: "PRIVATE_NEGOTIATION",
    validFrom: "2026-01-01T00:00:00.000Z",
    pressureContractId: "pressure_debt_exposure",
  });
  assert.equal(resolved.payload.demand.kind, "FULFILL_OBLIGATION");
  assert.equal(resolved.payload.demand.demandId, "OWES:player_owes_marcus_250");
  assert.equal(resolved.payload.demand.term, "debt_250_usd");
  assert.equal(resolved.payload.demand.sourceAssertionId, "player_owes_marcus_250");
  assert.equal(resolved.payload.demand.scope, "ACTUAL");
  assert.equal(resolved.payload.demand.contextId, "PRIVATE_NEGOTIATION");
  assert.equal(resolved.payload.demand.validUntil, undefined);
  assert.equal(resolved.payload.consequence.consequenceId, "public_debt_exposure");
  assert.equal(resolved.payload.consequence.text, "Marcus reports the active debt to the building owner.");
  assert.equal(resolved.payload.consequence.fearedBy, "player");
  assert.equal(resolved.payload.consequence.fearedConsequenceSourceAssertionId, "player_fears_exposure");
  assert.equal(resolved.payload.consequence.leverageBasis, "debt_250_usd");
  assert.equal(resolved.payload.consequence.demandId, "OWES:player_owes_marcus_250");
  assert.deepEqual(resolved.payload.consequence.validity, {
    scope: "ACTUAL",
    contextId: "PRIVATE_NEGOTIATION",
    validFrom: "2026-01-01T00:00:00.000Z",
    validUntilIsUnbounded: true,
  });
  assert.ok(resolved.trace.some((step) => step.code === "PRESSURE_LEVERAGE_GROUNDED" && step.matchedFacts.includes("marcus_leverage_debt")));
  assert.ok(resolved.trace.some((step) => step.code === "PRESSURE_DEMAND_GROUNDED" && step.matchedFacts.includes("player_owes_marcus_250")));
  assert.ok(resolved.trace.some((step) => step.code === "PRESSURE_CONSEQUENCE_GROUNDED" && step.matchedFacts.includes("player_fears_exposure")));
});

test("INVOKE_CONSEQUENCE rejects unrelated fear and consequence identities", () => {
  const state = structuredClone(DEMO_SCENARIOS[0]);
  state.facts.find((entry) => entry.assertionId === "player_fears_exposure").args.object = "unrelated_fear";
  const unlinked = evaluateAction(state, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(unlinked.status, "BLOCKED");
  assert.ok(unlinked.blockers.some((entry) => entry.code === "PRESSURE_FEAR_NOT_LINKED"));
});

test("INVOKE_CONSEQUENCE rejects a consequence with no active authored demand", () => {
  const state = structuredClone(DEMO_SCENARIOS[0]);
  state.facts = state.facts.filter((entry) => !["player_owes_marcus_250", "player_promised_payment"].includes(entry.assertionId));
  const evaluation = evaluateAction(state, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(evaluation.status, "BLOCKED");
  assert.ok(evaluation.blockers.some((entry) => ["MISSING_PRESSURE_DEMAND", "PRESSURE_EVIDENCE_NOT_ACTIVE", "PRESSURE_EVIDENCE_MISSING"].includes(entry.code)));
  const resolved = resolveAction(state, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(resolved.payload, null);
  assert.equal(resolved.emittedHistory.length, 0);
});

test("INVOKE_CONSEQUENCE rejects inactive or completed obligations", () => {
  const state = structuredClone(DEMO_SCENARIOS[0]);
  for (const assertionId of ["player_owes_marcus_250", "player_promised_payment"]) {
    state.facts.find((entry) => entry.assertionId === assertionId).args.status = "FULFILLED";
  }
  const evaluation = evaluateAction(state, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(evaluation.status, "BLOCKED");
  assert.ok(evaluation.blockers.some((entry) => ["MISSING_PRESSURE_DEMAND", "PRESSURE_EVIDENCE_NOT_ACTIVE"].includes(entry.code)));
});

test("INVOKE_CONSEQUENCE cannot cross-contaminate secret and debt leverage", () => {
  const secretOnly = structuredClone(DEMO_SCENARIOS[0]);
  secretOnly.facts = secretOnly.facts.filter((entry) => entry.assertionId !== "marcus_leverage_debt");
  const secretEvaluation = evaluateAction(secretOnly, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(secretEvaluation.status, "BLOCKED");
  assert.ok(secretEvaluation.blockers.some((entry) => entry.code === "PRESSURE_DEMAND_LEVERAGE_MISMATCH"));

  const secretDemandOnly = structuredClone(DEMO_SCENARIOS[0]);
  secretDemandOnly.facts = secretDemandOnly.facts.filter((entry) => !["player_owes_marcus_250", "player_promised_payment"].includes(entry.assertionId));
  secretDemandOnly.facts.push(fact("PROMISED_TO", { subject: "player", object: "marcus_broker_hill", term: "secret_unregistered_sublet", status: "PENDING" }, {
    assertionId: "player_promised_secret_disclosure",
    contextIds: ["PRIVATE_NEGOTIATION"],
  }));
  const debtEvaluation = evaluateAction(secretDemandOnly, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(debtEvaluation.status, "BLOCKED");
  assert.ok(debtEvaluation.blockers.some((entry) => ["MISSING_PRESSURE_DEMAND", "PRESSURE_EVIDENCE_MISSING", "PRESSURE_DEMAND_LEVERAGE_MISMATCH", "MISSING_PRESSURE_FEARED_CONSEQUENCE"].includes(entry.code)));
});

test("INVOKE_CONSEQUENCE rejects belief-only, disputed, future, and expired pressure evidence", () => {
  const cases = [
    ["BELIEF", (state) => { state.facts.find((entry) => entry.assertionId === "marcus_leverage_debt").scope = "BELIEF"; }, "PRESSURE_SCOPE_NOT_ACTUAL"],
    ["DISPUTED", (state) => { state.facts.find((entry) => entry.assertionId === "marcus_leverage_debt").polarity = "DISPUTED"; }, "PRESSURE_EVIDENCE_NOT_ASSERTED"],
    ["FUTURE", (state) => { state.facts.find((entry) => entry.assertionId === "marcus_leverage_debt").validFrom = "2026-09-03T00:00:00.000Z"; }, "PRESSURE_EVIDENCE_OUTSIDE_VALIDITY"],
    ["EXPIRED", (state) => { state.facts.find((entry) => entry.assertionId === "marcus_leverage_debt").validUntil = "2026-09-02T11:59:59.000Z"; }, "PRESSURE_EVIDENCE_OUTSIDE_VALIDITY"],
  ];
  for (const [label, mutate, expectedCode] of cases) {
    const state = structuredClone(DEMO_SCENARIOS[0]);
    state.facts = state.facts.filter((entry) => entry.assertionId !== "marcus_leverage_secret");
    mutate(state);
    const evaluation = evaluateAction(state, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
    assert.equal(evaluation.status, "BLOCKED", `${label} pressure evidence was accepted`);
    assert.ok(evaluation.blockers.some((entry) => entry.code === expectedCode), `${label} did not preserve ${expectedCode} in the deterministic trace`);
  }
});

test("INVOKE_CONSEQUENCE rejects matching authored prohibition and inactive context", () => {
  const prohibited = structuredClone(DEMO_SCENARIOS[0]);
  prohibited.facts.push(fact("PROHIBITED", { subject: "player", object: "marcus_broker_hill", term: "debt_250_usd" }, {
    assertionId: "player_prohibits_debt_pressure",
    contextIds: ["PRIVATE_NEGOTIATION"],
  }));
  const prohibitionEvaluation = evaluateAction(prohibited, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(prohibitionEvaluation.status, "BLOCKED");
  assert.ok(prohibitionEvaluation.blockers.some((entry) => entry.code === "PRESSURE_PROHIBITED"));

  const inactive = structuredClone(DEMO_SCENARIOS[0]);
  inactive.contexts[0].active = false;
  const inactiveEvaluation = evaluateAction(inactive, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(inactiveEvaluation.status, "BLOCKED");
  assert.ok(inactiveEvaluation.blockers.some((entry) => entry.code === "CONTEXT_NOT_ACTIVE"));
});

test("INVOKE_CONSEQUENCE requires an explicit pressure contract and preserves its failure trace", () => {
  const missingContract = structuredClone(DEMO_SCENARIOS[0]);
  missingContract.pressureContracts = [];
  const missingEvaluation = evaluateAction(missingContract, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(missingEvaluation.status, "BLOCKED");
  assert.ok(missingEvaluation.blockers.some((entry) => entry.code === "MISSING_PRESSURE_LEVERAGE"));

  const unprovenContract = structuredClone(DEMO_SCENARIOS[0]);
  delete unprovenContract.pressureContracts[0].provenance;
  const unprovenEvaluation = evaluateAction(unprovenContract, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(unprovenEvaluation.status, "BLOCKED");
  const trace = unprovenEvaluation.requiredChecks.find((entry) => entry.code === "PRESSURE_CONTRACT_PROVENANCE_MISSING");
  assert.ok(trace, "contract provenance failure was not retained in the pressure trace");
  assert.ok(trace.matchedFacts.includes("pressure_debt_exposure"));
});
