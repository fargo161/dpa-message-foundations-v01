import test from "node:test";
import assert from "node:assert/strict";
import { adaptResolvedActionToSemanticRequest } from "../src/action-tpl-adapter.mjs";
import { createMarcusScenario, resolveAction } from "../src/mechanics.mjs";

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
