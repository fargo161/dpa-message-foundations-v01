import test from "node:test";
import assert from "node:assert/strict";
import { buildAuthoringPipelineTrace } from "../src/inspection.mjs";
import { adaptResolvedActionToSemanticRequest } from "../src/action-tpl-adapter.mjs";
import { DEMO_SCENARIOS, resolveAction } from "../src/mechanics.mjs";

test("strict action adapter preserves authored semantic content and provenance", () => {
  const state = DEMO_SCENARIOS[0];
  const resolved = resolveAction(state, "OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  const adapted = adaptResolvedActionToSemanticRequest({ ...resolved, contextId: "PRIVATE_NEGOTIATION" });

  assert.equal(adapted.ok, true);
  assert.equal(adapted.semanticRequest.speechAct, "DEAL");
  assert.deepEqual(adapted.semanticRequest.slots.OFFER, { object: "cash_80_usd", quantity: 80, unit: "USD" });
  assert.deepEqual(adapted.semanticRequest.slots.RETURN, { object: "debt_250_usd", status: "partial_satisfaction" });
  assert.equal(adapted.semanticRequest.actor, "player");
  assert.equal(adapted.semanticRequest.target, "marcus_broker_hill");
  assert.equal(adapted.semanticRequest.action, "OFFER_PARTIAL_PAYMENT");
  assert.equal(adapted.semanticRequest.provenance[0].sourceId, "mechanics-action-resolution");
});

test("action adapter carries an explicit ASK action frame without inventing dialogue", () => {
  const state = DEMO_SCENARIOS[0];
  const resolved = resolveAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  const adapted = adaptResolvedActionToSemanticRequest({ ...resolved, contextId: "PRIVATE_NEGOTIATION" });

  assert.equal(adapted.ok, true);
  assert.deepEqual(adapted.semanticRequest.slots.REQUEST, { action: "REQUEST_EXTENSION", object: "debt_relief" });
  assert.equal(adapted.semanticRequest.slots.request.action, "REQUEST_EXTENSION");
  assert.equal(adapted.semanticRequest.slots.request.object, "debt_relief");
});

test("blocked resolutions are rejected before the TPL boundary", () => {
  const state = DEMO_SCENARIOS[0];
  const resolved = resolveAction(state, "REQUEST_EXTENSION", "player", "apartment_305_entry", "PRIVATE_NEGOTIATION");
  const adapted = adaptResolvedActionToSemanticRequest({ ...resolved, contextId: "PRIVATE_NEGOTIATION" });

  assert.equal(adapted.ok, false);
  assert.equal(adapted.quarantined, true);
  assert.equal(adapted.failures[0].code, "BLOCKED_ACTION_NOT_RENDERABLE");
});

test("authoring pipeline is independently traceable through a reviewed neutral execution", () => {
  const trace = buildAuthoringPipelineTrace();

  assert.equal(trace.authoredFacts.count, 16);
  assert.ok(trace.availableActions.some((action) => action.displayName === "Offer a partial payment"));
  assert.deepEqual(trace.adapterAttempts[0], {
    actionId: "REQUEST_EXTENSION",
    displayName: "Request a repayment extension",
    status: "ADAPTED",
    failureCodes: [],
  });
  assert.equal(trace.resolvedAction.displayName, "Request a repayment extension");
  assert.deepEqual(trace.semanticRequest.slots.REQUEST, { action: "REQUEST_EXTENSION", object: "debt_relief" });
  assert.equal(trace.based.matrixKey, "ASK_AS_BALANCED");
  assert.equal(trace.safeRender.matrixReviewStatus, "REVIEWED");
  assert.equal(trace.safeRender.templateVariantId, "TPL_TEMPLATE_ASK_AS_BALANCED_CANONICAL_NEUTRAL_V01");
  assert.equal(trace.safeRender.rejectionReasons.length, 0);
  assert.equal(trace.safeRender.semanticInvariancePassed, true);
  assert.equal(trace.safeRender.fallbackUsed, false);
});
