import test from "node:test";
import assert from "node:assert/strict";
import { BASED_VIBES, buildMatrixWithAnchors, generateMatrix } from "../src/based.mjs";
import { FACE_COMPATIBILITY_BOUNDARY, TPL_ATOMS, TPL_CONSTRUCTIONS, TPL_FAMILIES, TPL_PROTOCOLS, renderSafeFallback, resolveMatrixCell, validateSemanticInvariance } from "../src/tpl.mjs";

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
});
