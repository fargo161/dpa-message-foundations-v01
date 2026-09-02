import test from "node:test";
import assert from "node:assert/strict";
import { createMarcusScenario, resolveAction } from "../src/mechanics.mjs";
import { BASED_VIBES, buildMatrixWithAnchors, generateMatrix } from "../src/based.mjs";
import { adaptResolvedActionToSemanticRequest } from "../src/action-tpl-adapter.mjs";
import { FACE_COMPATIBILITY_BOUNDARY, TPL_ATOMS, TPL_CONSTRUCTIONS, TPL_FALLBACK_POLICY, TPL_FAMILIES, TPL_PROTOCOLS, renderSafeFallback, resolveMatrixCell, validateSemanticInvariance, validateSemanticPayload } from "../src/tpl.mjs";

test("TPL scaffold covers each family while remaining unapproved", () => {
  assert.deepEqual(TPL_FAMILIES, ["VOICE_QUALITY", "VOCALIZATION", "TACTILE_KINESIC", "VISUAL_KINESIC", "ARTIFACT"]);
  for (const family of TPL_FAMILIES) assert.ok(TPL_ATOMS.some((atom) => atom.family === family));
  assert.equal(TPL_CONSTRUCTIONS.length, 3);
  assert.equal(TPL_PROTOCOLS.length, 3);
  assert.ok(TPL_PROTOCOLS.every((protocol) => protocol.reviewStatus === "CANDIDATE"));
  assert.equal(generateMatrix().filter((cell) => cell.reviewStatus === "UNMAPPED").length, 180);
  const anchored = buildMatrixWithAnchors();
  assert.equal(anchored.length, 180);
  assert.equal(new Set(anchored.flatMap((cell) => cell.candidateAnchorIds)).size, 60);
  assert.equal(anchored.filter((cell) => cell.candidateAnchorIds.length).length, 180);
  assert.ok(anchored.some((cell) => cell.requiredContextOrLoreFacts.length > 0));
  assert.ok(anchored.flatMap((cell) => cell.requiredContextOrLoreFacts).every((gate) => anchored.some((cell) => cell.candidateAnchorIds.includes(gate.sourceAnchorId))));
  assert.ok(anchored.every((cell) => cell.reviewStatus === "UNMAPPED"));
  assert.equal(BASED_VIBES.length, 20);
});

test("semantic invariance blocks drift and unsupported knowledge", () => {
  const before = { semanticRequestId: "r1", speechAct: "ASK", slots: { REQUEST: "review the ledger", deadline: "2026-09-03" } };
  assert.equal(validateSemanticInvariance(before, structuredClone(before)).passed, true);
  const changedDeadline = structuredClone(before);
  changedDeadline.slots.deadline = "2026-09-10";
  assert.equal(validateSemanticInvariance(before, changedDeadline).reasons[0].code, "REJECT_DEADLINE_DRIFT");
  assert.equal(validateSemanticInvariance(before, before, { speakerKnowledgeClaims: [{ claim: "ledger", available: false }] }).passed, false);
  assert.equal(validateSemanticInvariance(before, before, { authorOnlyReveals: ["secret"] }).passed, false);
  assert.equal(validateSemanticInvariance(before, { ...before, speechAct: "PRESSURE" }).passed, false);
  assert.equal(validateSemanticInvariance(before, { ...before, slots: { ...before.slots, UNLISTED: "new proposition" } }).reasons[0].code, "REJECT_UNAUTHORIZED_SLOT");

  const changedRequest = structuredClone(before);
  changedRequest.slots.REQUEST = "pay now";
  assert.equal(validateSemanticInvariance(before, changedRequest).reasons.some((reason) => reason.code === "REJECT_SLOT_VALUE_CHANGED" && reason.slot === "REQUEST"), true);
  const renamedRequest = { ...structuredClone(before), slots: { request: "review the ledger", deadline: "2026-09-03" } };
  assert.equal(validateSemanticInvariance(before, renamedRequest).passed, false);
  assert.ok(validateSemanticInvariance(before, renamedRequest).reasons.some((reason) => reason.code === "REJECT_REQUIRED_SLOT_REMOVED"));

  const deal = { semanticRequestId: "deal-1", speechAct: "DEAL", slots: { OFFER: { object: "cash", quantity: 80, unit: "USD" }, RETURN: { object: "extension" } } };
  const changedOffer = structuredClone(deal);
  changedOffer.slots.OFFER.quantity = 800;
  assert.equal(validateSemanticInvariance(deal, changedOffer).passed, false);
  assert.equal(validateSemanticInvariance(deal, changedOffer).reasons.some((reason) => reason.slot === "OFFER"), true);
  const changedReturn = structuredClone(deal);
  changedReturn.slots.return = { object: "ownership_transfer" };
  assert.equal(validateSemanticInvariance(deal, changedReturn).passed, false);

  const pressure = { semanticRequestId: "pressure-1", speechAct: "PRESSURE", slots: { DEMAND: "pay today", CONSEQUENCE: "report the debt", consequence: "report the debt" } };
  const inventedThreat = structuredClone(pressure);
  inventedThreat.slots.CONSEQUENCE = "destroy the building";
  assert.equal(validateSemanticInvariance(pressure, inventedThreat).passed, false);
  const lowercaseActorDrift = structuredClone(before);
  lowercaseActorDrift.slots.actor = "different-actor";
  assert.equal(validateSemanticInvariance({ ...before, slots: { ...before.slots, actor: "speaker" } }, lowercaseActorDrift).passed, false);
  assert.equal(validateSemanticPayload({ semanticRequestId: "bad", speechAct: "ASK", slots: { request: "lowercase only" } }).passed, false);
});

test("safe fallback preserves the selected act and records unmapped-cell deferment", () => {
  for (const speechAct of ["DEAL", "PRESSURE", "ASK"]) {
    const slots = speechAct === "DEAL" ? { OFFER: "80 USD", RETURN: "an extension" } : speechAct === "PRESSURE" ? { DEMAND: "pay today", CONSEQUENCE: "report the debt" } : { REQUEST: "review the ledger" };
    const result = renderSafeFallback({ semanticRequestId: `r-${speechAct}`, speechAct, slots }, "AS", "OVERT");
    assert.equal(result.semanticInvariancePassed, true);
    assert.equal(result.fallbackUsed, true);
    assert.equal(result.speechAct, speechAct);
    const resolved = resolveMatrixCell(generateMatrix(), { semanticRequestId: `r-${speechAct}`, speechAct, slots }, "AS", "OVERT");
    assert.equal(resolved.matrixKey, `${speechAct}_AS_OVERT`);
    assert.equal(resolved.rejectionReasons[0].code, "MATRIX_CELL_UNMAPPED");
  }
  assert.throws(() => renderSafeFallback({ semanticRequestId: "bad", speechAct: "UNKNOWN", slots: {} }, "AS", "OVERT"), /SPEECH_ACT_NOT_ALLOWED/);
  assert.throws(() => renderSafeFallback({ semanticRequestId: "bad", speechAct: "ASK", slots: {} }, "ZZ", "OVERT"), /VIBE_NOT_ALLOWED/);
  assert.throws(() => renderSafeFallback({ semanticRequestId: "bad", speechAct: "ASK", slots: {} }, "AS", "LOUD"), /DELIVERY_INTENSITY_NOT_ALLOWED/);
  assert.equal(FACE_COMPATIBILITY_BOUNDARY.rendererMayMutateFaceSlots, false);
  assert.equal(TPL_FALLBACK_POLICY.totalActIntensityForms, 9);
  assert.equal(TPL_FALLBACK_POLICY.vibeAffectsWording, false);
  const subtle = renderSafeFallback({ semanticRequestId: "vibe-wording", speechAct: "ASK", slots: { REQUEST: "review the ledger" } }, "AS", "SUBTLE");
  const otherVibe = renderSafeFallback({ semanticRequestId: "vibe-wording", speechAct: "ASK", slots: { REQUEST: "review the ledger" } }, "BA", "SUBTLE");
  assert.equal(subtle.renderedText, otherVibe.renderedText);
  assert.notEqual(subtle.stableSeed, otherVibe.stableSeed);
});

test("resolved actions cross the TPL boundary through a canonical adapter", () => {
  const state = createMarcusScenario();
  const resolved = resolveAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  const adapted = adaptResolvedActionToSemanticRequest(resolved);
  assert.equal(adapted.ok, true);
  assert.equal(adapted.semanticRequest.speechAct, "ASK");
  assert.deepEqual(adapted.semanticRequest.slots.REQUEST, { action: "REQUEST_EXTENSION", object: "debt_relief" });
  assert.deepEqual(adapted.semanticRequest.slots.request, adapted.semanticRequest.slots.REQUEST);
  assert.equal(validateSemanticPayload(adapted.semanticRequest).passed, true);
  assert.equal(validateSemanticInvariance(adapted.semanticRequest, structuredClone(adapted.semanticRequest)).passed, true);

  const blocked = resolveAction(state, "REQUEST_EXTENSION", "player", "apartment_305_entry", "PRIVATE_NEGOTIATION");
  const rejected = adaptResolvedActionToSemanticRequest(blocked);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.quarantined, true);
  assert.equal(rejected.semanticRequest, null);
  assert.equal(rejected.failures[0].code, "BLOCKED_ACTION_NOT_RENDERABLE");

  const incomplete = adaptResolvedActionToSemanticRequest({ ...resolved, payload: { actor: "player", target: "marcus_broker_hill", action: "REQUEST_SUPPORT" } });
  assert.equal(incomplete.ok, false);
  assert.equal(incomplete.failures[0].code, "ACTION_PAYLOAD_IDENTITY_DRIFT");
});
