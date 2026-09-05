import test from "node:test";
import assert from "node:assert/strict";
import { adaptResolvedActionToSemanticRequest } from "../src/action-tpl-adapter.mjs";
import { DEMO_SCENARIOS, createMarcusScenario, evaluateAvailableActions, resolveAction } from "../src/mechanics.mjs";
import { renderSafeFallback } from "../src/tpl.mjs";

const actionArgs = ["REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION"];

function resolveFirst() {
  return resolveAction(createMarcusScenario(), ...actionArgs);
}

test("semantic request and provenance identities follow the emitted history occurrence", () => {
  const first = resolveFirst();
  const second = resolveAction(first.stateAfter, ...actionArgs);
  const firstAdapted = adaptResolvedActionToSemanticRequest(first);
  const secondAdapted = adaptResolvedActionToSemanticRequest(second);

  assert.equal(firstAdapted.ok, true);
  assert.equal(secondAdapted.ok, true);
  assert.notEqual(first.emittedHistory[0].historyId, second.emittedHistory[0].historyId);
  assert.notEqual(firstAdapted.semanticRequest.semanticRequestId, secondAdapted.semanticRequest.semanticRequestId);
  assert.equal(firstAdapted.semanticRequest.semanticRequestId, `semantic:${encodeURIComponent(first.emittedHistory[0].historyId)}`);
  assert.equal(secondAdapted.semanticRequest.semanticRequestId, `semantic:${encodeURIComponent(second.emittedHistory[0].historyId)}`);
  assert.equal(firstAdapted.semanticRequest.provenance[0].sourceRecordId, first.emittedHistory[0].historyId);
  assert.equal(secondAdapted.semanticRequest.provenance[0].sourceRecordId, second.emittedHistory[0].historyId);
});

test("replaying the same immutable resolution is idempotent", () => {
  const resolved = resolveFirst();
  const adapted = adaptResolvedActionToSemanticRequest(resolved);
  const replayed = adaptResolvedActionToSemanticRequest(structuredClone(resolved));
  const carriedIdentity = adaptResolvedActionToSemanticRequest({
    ...structuredClone(resolved),
    semanticRequestId: adapted.semanticRequest.semanticRequestId,
  });

  assert.equal(adapted.ok, true);
  assert.deepEqual(replayed.semanticRequest, adapted.semanticRequest);
  assert.deepEqual(carriedIdentity.semanticRequest, adapted.semanticRequest);
});

test("independent PRESSURE resolutions retain immutable authority and reject substitution", () => {
  const startingState = createMarcusScenario();
  const first = resolveAction(startingState, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  const firstAdapted = adaptResolvedActionToSemanticRequest(first);

  const secondState = structuredClone(startingState);
  secondState.consequences.public_debt_exposure = "The broker records a different consequence.";
  const second = resolveAction(secondState, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  const secondAdapted = adaptResolvedActionToSemanticRequest(second);
  const firstReplay = adaptResolvedActionToSemanticRequest(structuredClone(first));

  assert.equal(firstAdapted.ok, true);
  assert.equal(secondAdapted.ok, true);
  assert.equal(first.emittedHistory[0].historyId, second.emittedHistory[0].historyId, "the deterministic gameplay history identity changed");
  assert.notEqual(first.resolutionRecordId, second.resolutionRecordId, "independent resolutions share one authority record identity");
  assert.deepEqual(firstReplay.semanticRequest, firstAdapted.semanticRequest, "the first resolution was not replayable after the second resolution");
  assert.notEqual(firstAdapted.semanticRequest.slots.CONSEQUENCE.text, secondAdapted.semanticRequest.slots.CONSEQUENCE.text);

  const substituted = structuredClone(first);
  substituted.payload = structuredClone(second.payload);
  const rejected = adaptResolvedActionToSemanticRequest(substituted);
  assert.equal(rejected.ok, false, "a payload from another resolution crossed the adapter boundary");
  assert.ok(rejected.failures.some((entry) => entry.code === "RESOLUTION_PAYLOAD_PROVENANCE_MISMATCH"));
});

test("nested mechanics payload mutation is rejected before TPL adaptation", () => {
  const mutations = [
    ["offer object", (resolution) => { resolution.payload.offer.object = "debt_250_usd"; }],
    ["offer quantity", (resolution) => { resolution.payload.offer.quantity = 999; }],
    ["offer unit", (resolution) => { resolution.payload.offer.unit = "EUR"; }],
    ["return object", (resolution) => { resolution.payload.return.object = "cash_80_usd"; }],
    ["nested alias record", (resolution) => { resolution.payload.offer.alias = { object: "cash_80_usd" }; }],
    ["nested array", (resolution) => { resolution.payload.offer.auditTrail = ["unauthorized promise"]; }],
    ["payload actor", (resolution) => { resolution.payload.actor = "other_actor"; }],
    ["payload target", (resolution) => { resolution.payload.target = "other_target"; }],
  ];
  for (const [label, mutate] of mutations) {
    const resolution = resolveAction(createMarcusScenario(), "OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
    mutate(resolution);
    const adapted = adaptResolvedActionToSemanticRequest(resolution);
    assert.equal(adapted.ok, false, `${label} mutation crossed the adapter boundary`);
    assert.ok(adapted.failures.some((entry) => entry.code === "RESOLUTION_PAYLOAD_PROVENANCE_MISMATCH"), `${label} did not report authoritative payload drift`);
  }

  const originalResolution = resolveAction(createMarcusScenario(), "OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  const first = adaptResolvedActionToSemanticRequest(originalResolution);
  assert.equal(first.ok, true);
  originalResolution.payload.offer.quantity = 1;
  const mutatedOriginal = adaptResolvedActionToSemanticRequest(originalResolution);
  assert.equal(mutatedOriginal.ok, false);
  assert.ok(mutatedOriginal.failures.some((entry) => entry.code === "RESOLUTION_PAYLOAD_PROVENANCE_MISMATCH"));

  const outcomeMutation = resolveAction(createMarcusScenario(), "OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  outcomeMutation.outcome = "BLOCKED";
  const rejectedOutcome = adaptResolvedActionToSemanticRequest(outcomeMutation);
  assert.equal(rejectedOutcome.ok, false);
  assert.ok(rejectedOutcome.failures.some((entry) => entry.code === "BLOCKED_ACTION_NOT_RENDERABLE"));
});

test("adapter does not reconstruct authority from a caller-supplied state snapshot", () => {
  const resolved = resolveAction(createMarcusScenario(), "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  const forged = structuredClone(resolved);
  forged.emittedHistory[0].historyId = "forged:pressure:1";
  forged.stateAfter.history[forged.stateAfter.history.length - 1].historyId = "forged:pressure:1";
  forged.deterministicEffects[0].historyId = "forged:pressure:1";
  forged.payload.demand.amount = 999;
  const rejected = adaptResolvedActionToSemanticRequest(forged);
  assert.equal(rejected.ok, false);
  assert.ok(rejected.failures.some((entry) => entry.code === "RESOLUTION_PAYLOAD_RECONSTRUCTION_FAILED"));
});

test("missing or malformed history identity is rejected before semantic adaptation", () => {
  const resolved = resolveFirst();

  const missingHistory = adaptResolvedActionToSemanticRequest({ ...resolved, emittedHistory: [] });
  assert.equal(missingHistory.ok, false);
  assert.equal(missingHistory.quarantined, true);
  assert.ok(missingHistory.failures.some((entry) => entry.code === "RESOLUTION_HISTORY_CARDINALITY_INVALID"));

  const missingEffect = adaptResolvedActionToSemanticRequest({ ...resolved, deterministicEffects: undefined });
  assert.equal(missingEffect.ok, false);
  assert.ok(missingEffect.failures.some((entry) => entry.code === "RESOLUTION_EFFECTS_MISSING"));

  const missingHistoryId = structuredClone(resolved);
  delete missingHistoryId.emittedHistory[0].historyId;
  const rejectedMissingId = adaptResolvedActionToSemanticRequest(missingHistoryId);
  assert.equal(rejectedMissingId.ok, false);
  assert.ok(rejectedMissingId.failures.some((entry) => entry.code === "RESOLUTION_HISTORY_ID_MISSING"));
});

test("history and supplied semantic identities reject drift", () => {
  const resolved = resolveFirst();

  const suppliedIdDrift = adaptResolvedActionToSemanticRequest({ ...resolved, semanticRequestId: "semantic:wrong-occurrence" });
  assert.equal(suppliedIdDrift.ok, false);
  assert.ok(suppliedIdDrift.failures.some((entry) => entry.code === "RESOLUTION_SEMANTIC_REQUEST_ID_DRIFT"));

  const historyActionDrift = structuredClone(resolved);
  historyActionDrift.emittedHistory[0].actionId = "OTHER_ACTION";
  const rejectedActionDrift = adaptResolvedActionToSemanticRequest(historyActionDrift);
  assert.equal(rejectedActionDrift.ok, false);
  assert.ok(rejectedActionDrift.failures.some((entry) => entry.code === "RESOLUTION_HISTORY_IDENTITY_DRIFT"));

  const historyStateDrift = structuredClone(resolved);
  historyStateDrift.stateAfter.history[historyStateDrift.stateAfter.history.length - 1] = {
    ...historyStateDrift.stateAfter.history[historyStateDrift.stateAfter.history.length - 1],
    targetId: "other-target",
  };
  const rejectedStateDrift = adaptResolvedActionToSemanticRequest(historyStateDrift);
  assert.equal(rejectedStateDrift.ok, false);
  assert.ok(rejectedStateDrift.failures.some((entry) => entry.code === "RESOLUTION_HISTORY_EVENT_DRIFT"));

  const duplicateStateHistory = structuredClone(resolved);
  duplicateStateHistory.stateAfter.history.push(structuredClone(duplicateStateHistory.emittedHistory[0]));
  const rejectedDuplicate = adaptResolvedActionToSemanticRequest(duplicateStateHistory);
  assert.equal(rejectedDuplicate.ok, false);
  assert.ok(rejectedDuplicate.failures.some((entry) => entry.code === "RESOLUTION_HISTORY_ID_NOT_UNIQUE"));

  const contextDrift = adaptResolvedActionToSemanticRequest({ ...resolved, contextId: "OTHER_CONTEXT" });
  assert.equal(contextDrift.ok, false);
  assert.ok(contextDrift.failures.some((entry) => entry.code === "RESOLUTION_HISTORY_IDENTITY_DRIFT"));
});

test("blocked resolutions remain quarantined and cannot produce a semantic request", () => {
  const blocked = resolveAction(createMarcusScenario(), "REQUEST_EXTENSION", "player", "apartment_305_entry", "PRIVATE_NEGOTIATION");
  const adapted = adaptResolvedActionToSemanticRequest(blocked);

  assert.equal(blocked.outcome, "BLOCKED");
  assert.equal(adapted.ok, false);
  assert.equal(adapted.quarantined, true);
  assert.equal(adapted.semanticRequest, null);
  assert.ok(adapted.failures.some((entry) => entry.code === "BLOCKED_ACTION_NOT_RENDERABLE"));
});

function recommendedResolutions() {
  return DEMO_SCENARIOS.flatMap((scenario) => scenario.recommendedPairs.flatMap((pair) => evaluateAvailableActions(scenario, pair.actorId, pair.targetId, pair.contextId)
    .filter((evaluation) => evaluation.status === "AVAILABLE")
    .map((evaluation) => ({ scenario, pair, resolution: resolveAction(scenario, evaluation.actionId, pair.actorId, pair.targetId, pair.contextId) }))));
}

test("every proposed demo action adapts and renders safely without inventing dialogue", () => {
  const proposed = recommendedResolutions();
  assert.equal(proposed.length, 10);
  assert.ok(proposed.some(({ resolution }) => resolution.actionId === "TRADE_INFORMATION"));

  for (const { resolution } of proposed) {
    const adapted = adaptResolvedActionToSemanticRequest(resolution);
    assert.equal(adapted.ok, true, `${resolution.actionId} should adapt`);
    assert.equal(adapted.semanticRequest.outcome, "PROPOSED");
    assert.equal(adapted.semanticRequest.provenance[0].sourceRecordId, resolution.emittedHistory[0].historyId);

    for (const deliveryIntensity of ["SUBTLE", "BALANCED", "OVERT"]) {
      const rendered = renderSafeFallback(adapted.semanticRequest, "BA", deliveryIntensity);
      assert.equal(rendered.semanticInvariancePassed, true, `${resolution.actionId} ${deliveryIntensity} fallback drifted`);
      assert.equal(rendered.semanticRequestId, adapted.semanticRequest.semanticRequestId);
    }
  }
});

test("TRADE_INFORMATION carries an authored DEAL offer and return through the adapter", () => {
  const scenario = DEMO_SCENARIOS.find((entry) => entry.scenarioId === "fixture-secret-leverage");
  const first = resolveAction(scenario, "TRADE_INFORMATION", "imani_intermediary", "player", "PRIVATE_DISCLOSURE");
  const second = resolveAction(first.stateAfter, "TRADE_INFORMATION", "imani_intermediary", "player", "PRIVATE_DISCLOSURE");
  const firstAdapted = adaptResolvedActionToSemanticRequest(first);
  const secondAdapted = adaptResolvedActionToSemanticRequest(second);

  assert.equal(first.outcome, "PROPOSED");
  assert.deepEqual(first.payload.offer, { information: "scoped_secret" });
  assert.deepEqual(first.payload.return, { object: "confidentiality_or_action" });
  assert.equal(firstAdapted.ok, true);
  assert.equal(firstAdapted.semanticRequest.speechAct, "DEAL");
  assert.deepEqual(firstAdapted.semanticRequest.slots.OFFER, { information: "scoped_secret" });
  assert.deepEqual(firstAdapted.semanticRequest.slots.offer, firstAdapted.semanticRequest.slots.OFFER);
  assert.deepEqual(firstAdapted.semanticRequest.slots.RETURN, { object: "confidentiality_or_action" });
  assert.deepEqual(firstAdapted.semanticRequest.slots.return, firstAdapted.semanticRequest.slots.RETURN);
  assert.equal(firstAdapted.semanticRequest.provenance[0].sourceRecordId, first.emittedHistory[0].historyId);
  assert.equal(secondAdapted.ok, true);
  assert.notEqual(firstAdapted.semanticRequest.semanticRequestId, secondAdapted.semanticRequest.semanticRequestId);
  assert.equal(secondAdapted.semanticRequest.provenance[0].sourceRecordId, second.emittedHistory[0].historyId);
});

test("every blocked recommended action remains quarantined at the adapter boundary", () => {
  let blockedCount = 0;
  for (const scenario of DEMO_SCENARIOS) {
    for (const pair of scenario.recommendedPairs) {
      for (const evaluation of evaluateAvailableActions(scenario, pair.actorId, pair.targetId, pair.contextId)) {
        if (evaluation.status !== "BLOCKED") continue;
        blockedCount += 1;
        const blocked = resolveAction(scenario, evaluation.actionId, pair.actorId, pair.targetId, pair.contextId);
        const adapted = adaptResolvedActionToSemanticRequest(blocked);
        assert.equal(blocked.outcome, "BLOCKED");
        assert.equal(blocked.payload, null);
        assert.equal(blocked.emittedHistory.length, 0);
        assert.equal(adapted.ok, false, `${blocked.actionId} crossed the adapter boundary`);
        assert.equal(adapted.quarantined, true);
        assert.equal(adapted.semanticRequest, null);
        assert.ok(adapted.failures.some((entry) => entry.code === "BLOCKED_ACTION_NOT_RENDERABLE"));
      }
    }
  }
  assert.ok(blockedCount > 0);
});
