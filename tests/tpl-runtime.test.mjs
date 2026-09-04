import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { adaptResolvedActionToSemanticRequest } from "../src/action-tpl-adapter.mjs";
import { BASED_VIBES, buildMatrixWithAnchors } from "../src/based.mjs";
import { buildTplCoverage } from "../src/inspection.mjs";
import { DEMO_SCENARIOS, createMarcusScenario, resolveAction } from "../src/mechanics.mjs";
import {
  TPL_PROTOCOLS,
  TPL_TEMPLATES,
  TPL_STYLE_PROFILES,
  VIBE_REALIZATION_RULES,
  buildRuntimeMatrix,
  renderSafeFallback,
  resolveMatrixCell,
  validateRenderedTextSemanticEvidence,
  validateSemanticPayload,
  validateSemanticInvariance,
} from "../src/tpl.mjs";

const matrix = buildRuntimeMatrix();

function adapted(actionId, actorId, targetId) {
  const state = createMarcusScenario();
  const contextId = "PRIVATE_NEGOTIATION";
  const resolved = resolveAction(state, actionId, actorId, targetId, contextId);
  const result = adaptResolvedActionToSemanticRequest(resolved);
  assert.equal(result.ok, true, `${actionId} did not adapt: ${JSON.stringify(result.failures)}`);
  return result.semanticRequest;
}

function noLeakage(text) {
  assert.doesNotMatch(text, /\{\s*["']/);
  assert.doesNotMatch(text, /\[[A-Z][A-Z_]+\]/);
  assert.doesNotMatch(text, /\b(?:undefined|null)\b/i);
  assert.doesNotMatch(text, /(?:REQUEST_EXTENSION|debt_relief|cash_80_usd|debt_250_usd|pressure_debt_exposure)/);
}

function nonDemoPressurePayload() {
  const demand = {
    kind: "FULFILL_OBLIGATION",
    demandId: "OWES:alt_obligation",
    subject: "alt_resident",
    object: "alt_broker",
    term: "debt_250_usd",
    amount: 125,
    unit: "USD",
    due: "2026-09-03T09:00:00.000Z",
    sourceAssertionId: "alt_obligation",
    scope: "ACTUAL",
    contextId: "ALT_NEGOTIATION",
    validFrom: "2026-01-01T00:00:00.000Z",
    pressureContractId: "alt_pressure_contract",
    authoredDemand: "pay debt_250_usd",
  };
  const consequence = {
    consequenceId: "alt_consequence",
    text: "The broker records the active obligation.",
    fearedBy: "alt_resident",
    fearedConsequenceSourceAssertionId: "alt_fear",
    leverageBasis: "debt_250_usd",
    demandId: demand.demandId,
    scope: "ACTUAL",
    contextId: "ALT_NEGOTIATION",
    validFrom: "2026-01-01T00:00:00.000Z",
    validity: { scope: "ACTUAL", contextId: "ALT_NEGOTIATION", validFrom: "2026-01-01T00:00:00.000Z", validUntilIsUnbounded: true },
    pressureContractId: "alt_pressure_contract",
  };
  const slots = {
    actor: "alt_broker",
    target: "alt_resident",
    action: "INVOKE_CONSEQUENCE",
    contextId: "ALT_NEGOTIATION",
    leverage: { actor: "alt_broker", target: "alt_resident", basis: "debt_250_usd", sourceAssertionId: "alt_leverage", scope: "ACTUAL", contextId: "ALT_NEGOTIATION", validFrom: "2026-01-01T00:00:00.000Z", pressureContractId: "alt_pressure_contract" },
    DEMAND: demand,
    demand,
    CONSEQUENCE: consequence,
    consequence,
  };
  const request = {
    schemaVersion: "dpa-keyword-foundation@0.1",
    adapterVersion: "action-tpl-adapter@0.1",
    semanticRequestId: "semantic:alt-pressure-occurrence",
    actionId: "INVOKE_CONSEQUENCE",
    actorId: "alt_broker",
    targetId: "alt_resident",
    contextId: "ALT_NEGOTIATION",
    actor: "alt_broker",
    target: "alt_resident",
    action: "INVOKE_CONSEQUENCE",
    speechAct: "PRESSURE",
    outcome: "PROPOSED",
    slots,
    mandatorySemanticFacts: ["actor", "target", "action", "contextId", "leverage", "demand", "consequence"],
    forbiddenSemanticAdditions: ["unauthored_deadline", "unauthored_threat", "unauthored_promise", "unauthored_knowledge"],
    provenance: [{ sourceId: "project-authored-test", sourceRecordId: "alt-pressure-history", transformVersion: "tpl-runtime-test@1", licenseId: "PROJECT_AUTHORED" }],
  };
  request.semanticBinding = {
    bindingVersion: "mechanics-tpl-binding@0.1",
    source: "AUTHORED_SEMANTIC_CONTRACT",
    sourceRecordId: request.provenance[0].sourceRecordId,
    actionId: request.actionId,
    actorId: request.actorId,
    targetId: request.targetId,
    contextId: request.contextId,
    payload: { actor: request.actorId, target: request.targetId, action: request.actionId, leverage: request.slots.leverage, demand: request.slots.demand, consequence: request.slots.consequence },
    semanticSlots: { DEMAND: request.slots.DEMAND, CONSEQUENCE: request.slots.CONSEQUENCE, leverage: request.slots.leverage },
  };
  return request;
}

test("semantic-bearing slots are either realized, accounted for, or rejected", () => {
  const ask = adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill");
  const askResult = resolveMatrixCell(matrix, ask, "AS", "BALANCED");
  const askDispositions = Object.fromEntries(askResult.semanticEvidence.slotDispositions.map((entry) => [entry.slot, entry]));
  assert.equal(askDispositions.actor.disposition, "CONTEXT_ONLY");
  assert.equal(askDispositions.target.disposition, "CONTEXT_ONLY");
  assert.equal(askDispositions.REQUEST.accounted, true);
  assert.match(askResult.realizedSlots.REQUEST, /debt relief/i);

  const deal = adapted("OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill");
  const dealResult = resolveMatrixCell(matrix, deal, "AS", "BALANCED");
  assert.equal(dealResult.semanticEvidence.slotDispositions.find((entry) => entry.slot === "OFFER").accounted, true);
  assert.match(dealResult.realizedSlots.OFFER, /80 USD.*cash/i);
  assert.match(dealResult.realizedSlots.RETURN, /250 USD debt/i);
  assert.equal(deal.slots.OFFER.quantity, 80);
  assert.equal(deal.slots.OFFER.object, "cash_80_usd");

  const pressure = adapted("INVOKE_CONSEQUENCE", "marcus_broker_hill", "player");
  const pressureResult = resolveMatrixCell(matrix, pressure, "AS", "BALANCED");
  assert.equal(pressureResult.semanticEvidence.slotDispositions.find((entry) => entry.slot === "DEMAND").accounted, true);
  assert.equal(pressureResult.semanticEvidence.slotDispositions.find((entry) => entry.slot === "CONSEQUENCE").accounted, true);
  assert.ok(pressure.slots.DEMAND.due, "the authoritative deadline remains bound in the pressure demand record");
  assert.equal(pressure.slots.CONSEQUENCE.text, "Marcus reports the active debt to the building owner.");

  const unsupported = [
    ["deadline", "2026-09-10T00:00:00.000Z"],
    ["condition", { conditionId: "if_refused" }],
    ["knowledge", "sealed_bid_secret"],
    ["urgency", "urgent"],
    ["relationship", "trusted_partner"],
    ["promise", "deliver_tomorrow"],
  ];
  for (const [slot, value] of unsupported) {
    const candidate = structuredClone(ask);
    candidate.slots[slot] = value;
    const validation = validateSemanticPayload(candidate);
    assert.equal(validation.passed, false, `${slot} was accepted without a reviewed disposition`);
    assert.ok(validation.reasons.some((reason) => ["REJECT_SEMANTIC_SLOT_UNSUPPORTED", "REJECT_UNAUTHORIZED_SLOT"].includes(reason.code)), `${slot} lacked an explicit rejection reason`);
    assert.throws(() => renderSafeFallback(candidate, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/);
  }

  const quantityMutation = structuredClone(deal);
  quantityMutation.slots.OFFER.quantity = 0;
  quantityMutation.slots.offer = structuredClone(quantityMutation.slots.OFFER);
  assert.equal(validateSemanticPayload(quantityMutation).passed, false);
  assert.throws(() => renderSafeFallback(quantityMutation, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/);

  const actorMutation = structuredClone(ask);
  actorMutation.slots.actor = "other_actor";
  assert.equal(validateSemanticPayload(actorMutation).passed, false);
  assert.throws(() => renderSafeFallback(actorMutation, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/);
  const targetMutation = structuredClone(ask);
  targetMutation.targetId = "other_target";
  assert.equal(validateSemanticPayload(targetMutation).passed, false);
  assert.throws(() => renderSafeFallback(targetMutation, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/);
});

test("free-form claims, delimiter tricks, casing changes, and nested binding mutation fail closed", () => {
  const askAttacks = [
    "I will harm you",
    "PROMISE delivery by tomorrow; otherwise comply",
    "request: [threat]",
    "If You Refuse, I will expose you",
  ];
  for (const attack of askAttacks) {
    const candidate = structuredClone(adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill"));
    candidate.slots.REQUEST = attack;
    candidate.slots.request = attack;
    assert.throws(() => renderSafeFallback(candidate, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/);
  }

  const deal = structuredClone(adapted("OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill"));
  deal.slots.OFFER.object = "cash, and I promise delivery by tomorrow";
  deal.slots.offer = structuredClone(deal.slots.OFFER);
  assert.throws(() => renderSafeFallback(deal, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/);

  const pressure = structuredClone(adapted("INVOKE_CONSEQUENCE", "marcus_broker_hill", "player"));
  const unsafeDemand = "pay today; otherwise I will harm you";
  const unsafeConsequence = "I promise delivery by tomorrow [CONSEQUENCE]";
  pressure.slots.DEMAND.authoredDemand = unsafeDemand;
  pressure.slots.demand = structuredClone(pressure.slots.DEMAND);
  pressure.slots.CONSEQUENCE.text = unsafeConsequence;
  pressure.slots.consequence = structuredClone(pressure.slots.CONSEQUENCE);
  assert.throws(() => renderSafeFallback(pressure, "AS", "OVERT"), /SEMANTIC_PAYLOAD_INVALID/);
  assert.throws(() => renderSafeFallback(pressure, "AS", "OVERT"), (error) => !String(error.message).includes(unsafeDemand) && !String(error.message).includes(unsafeConsequence));
});

test("canonical action values cannot be replaced by a matching forged semantic binding", () => {
  const ask = structuredClone(adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill"));
  ask.slots.REQUEST.object = "gold";
  ask.slots.request = structuredClone(ask.slots.REQUEST);
  ask.semanticBinding.semanticSlots.REQUEST = structuredClone(ask.slots.REQUEST);
  const askValidation = validateSemanticPayload(ask);
  assert.equal(askValidation.passed, false);
  assert.ok(askValidation.reasons.some((reason) => reason.code === "REJECT_ACTION_SEMANTIC_VALUE_UNAUTHORIZED"));
  assert.throws(() => renderSafeFallback(ask, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/);

  const deal = structuredClone(adapted("OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill"));
  deal.slots.OFFER.quantity = 999;
  deal.slots.offer = structuredClone(deal.slots.OFFER);
  deal.semanticBinding.semanticSlots.OFFER = structuredClone(deal.slots.OFFER);
  const dealValidation = validateSemanticPayload(deal);
  assert.equal(dealValidation.passed, false);
  assert.ok(dealValidation.reasons.some((reason) => reason.code === "REJECT_ACTION_SEMANTIC_VALUE_UNAUTHORIZED"));
  assert.throws(() => renderSafeFallback(deal, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/);

  const pressure = structuredClone(adapted("INVOKE_CONSEQUENCE", "marcus_broker_hill", "player"));
  pressure.slots.DEMAND.amount = 999;
  pressure.slots.demand = structuredClone(pressure.slots.DEMAND);
  pressure.semanticBinding.semanticSlots.DEMAND = structuredClone(pressure.slots.DEMAND);
  const pressureValidation = validateSemanticPayload(pressure);
  assert.equal(pressureValidation.passed, false);
  assert.ok(pressureValidation.reasons.some((reason) => reason.code === "REJECT_SEMANTIC_BINDING_RECORD_SLOTS_DRIFT"));
  assert.throws(() => renderSafeFallback(pressure, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/);
});

test("authored PRESSURE threats remain valid when the full contract is bound", () => {
  const payload = nonDemoPressurePayload();
  payload.slots.CONSEQUENCE.text = "The broker will expose the sealed record.";
  payload.slots.consequence = structuredClone(payload.slots.CONSEQUENCE);
  payload.semanticBinding.semanticSlots.CONSEQUENCE = structuredClone(payload.slots.CONSEQUENCE);
  const result = resolveMatrixCell(matrix, payload, "AS", "BALANCED");
  assert.match(result.renderedText, /expose the sealed record/i);
});

test("safe PRESSURE fallback cannot bypass authored authorization", () => {
  const candidate = structuredClone(adapted("INVOKE_CONSEQUENCE", "marcus_broker_hill", "player"));
  const unsafeDemand = "demand anything; or else";
  const unsafeConsequence = "unreviewed consequence; promise tomorrow";
  candidate.slots.DEMAND.authoredDemand = unsafeDemand;
  candidate.slots.demand = structuredClone(candidate.slots.DEMAND);
  candidate.slots.CONSEQUENCE.text = unsafeConsequence;
  candidate.slots.consequence = structuredClone(candidate.slots.CONSEQUENCE);
  assert.throws(() => renderSafeFallback(candidate, "BA", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/);
  try { renderSafeFallback(candidate, "BA", "BALANCED"); } catch (error) {
    assert.doesNotMatch(String(error.message), /demand anything|unreviewed consequence/i);
  }
});

function invalidPressureActionPayload() {
  const payload = nonDemoPressurePayload();
  payload.actionId = "REQUEST_SUPPORT";
  payload.action = "REQUEST_SUPPORT";
  payload.slots.action = "REQUEST_SUPPORT";
  return payload;
}

test("ASK phase gate maps all 60 coordinates to distinct voluntary neutral previews", () => {
  const payload = adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill");
  const askCells = matrix.filter((cell) => cell.speechAct === "ASK");
  const results = askCells.map((cell) => resolveMatrixCell(matrix, payload, cell.vibeId, cell.deliveryIntensity));
  assert.equal(askCells.length, 60);
  assert.equal(new Set(askCells.map((cell) => cell.key)).size, 60);
  assert.equal(new Set(results.map((result) => result.renderedText)).size, 60);
  assert.ok(results.every((result) => result.matrixReviewStatus === "REVIEWED"));
  assert.ok(results.every((result) => result.previewEligible === true));
  assert.ok(results.every((result) => result.productionEligible === false));
  assert.ok(results.every((result) => result.semanticInvariancePassed === true));
  assert.ok(results.every((result) => /asking directly|could you|please/i.test(result.renderedText)));
  assert.ok(results.every((result) => result.tplProtocolId === "PROTOCOL_ASK_CANONICAL_NEUTRAL_V01"));
  assert.ok(results.every((result) => result.candidateAnchorIds.length === 1));
  assert.ok(results.every((result) => result.provenance.some((entry) => entry.sourceAnchorIds?.length === 1)));
  results.forEach((result) => {
    noLeakage(result.renderedText);
    const rule = VIBE_REALIZATION_RULES[result.vibeId];
    assert.match(result.renderedText, new RegExp(rule.primaryCueSignal));
    assert.match(result.renderedText, new RegExp(rule.secondaryCueSignal));
  });
});

test("ASK Vibe changes wording and intensity changes presentation only", () => {
  const payload = adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill");
  const subtle = resolveMatrixCell(matrix, payload, "BA", "SUBTLE");
  const balanced = resolveMatrixCell(matrix, payload, "BA", "BALANCED");
  const overt = resolveMatrixCell(matrix, payload, "BA", "OVERT");
  const otherVibe = resolveMatrixCell(matrix, payload, "AS", "BALANCED");
  assert.notEqual(subtle.renderedText, balanced.renderedText);
  assert.notEqual(balanced.renderedText, overt.renderedText);
  assert.notEqual(balanced.renderedText, otherVibe.renderedText);
  assert.deepEqual(subtle.realizedSlots, balanced.realizedSlots);
  assert.deepEqual(balanced.realizedSlots, overt.realizedSlots);
  assert.match(subtle.renderedText, /could you/i);
  assert.match(balanced.renderedText, /please/i);
  assert.match(overt.renderedText, /asking directly/i);
  assert.equal(subtle.styleProfileId, "CANONICAL_NEUTRAL_V01");
  assert.equal(otherVibe.styleProfileId, "CANONICAL_NEUTRAL_V01");
  assert.deepEqual(subtle.semanticEvidence.reasons, []);
});

test("ASK context and style boundaries fail closed without inventing candidate claims", () => {
  const payload = adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill");
  const gated = resolveMatrixCell(matrix, payload, "BA", "BALANCED", { availableContextFacts: [] });
  assert.deepEqual(gated.gateResult.requiredFacts, ["POSSIBLE_ASK_TO_PRESSURE_DRIFT"]);
  assert.equal(gated.gateResult.exactFactsSatisfied, false);
  assert.equal(gated.gateResult.disposition, "NEUTRAL_SAME_COORDINATE_REWRITE");
  assert.equal(gated.gateResult.candidateClaimsExecuted, false);
  assert.doesNotMatch(gated.renderedText, /deadline|threat|friend|audience|everyone|punish|or else/i);
  assert.throws(() => resolveMatrixCell(matrix, payload, "BA", "BALANCED", { requireExactContext: true }), /TPL_CONTEXT_GATE_UNSATISFIED/);
  assert.throws(() => resolveMatrixCell(matrix, payload, "BA", "BALANCED", { executionMode: "PRODUCTION" }), /TPL_PRODUCTION_NOT_ELIGIBLE/);
  assert.throws(() => resolveMatrixCell(matrix, payload, "BA", "BALANCED", { styleProfileId: "ZANT_HUMOR_V01" }), /TPL_STYLE_PROFILE_UNAVAILABLE/);
});

test("ASK rendering is deterministic, typed, and keeps face requests separate", () => {
  const payload = adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill");
  const options = { reactionFaceId: "FACE_REACTION_NEUTRAL", replyFaceId: "FACE_REPLY_ATTENTIVE" };
  const first = resolveMatrixCell(matrix, payload, "AS", "BALANCED", options);
  const second = resolveMatrixCell(matrix, payload, "AS", "BALANCED", options);
  assert.deepEqual(first, second);
  assert.deepEqual(first.faceRequest, options);
  assert.equal(first.semanticEvidence.method, "DETERMINISTIC_RENDERED_FRAGMENT_AUDIT_V01");
  assert.deepEqual(first.realizedSlots, { REQUEST: "request a repayment extension concerning debt relief" });
  assert.deepEqual(first.styleProfileInput.orderedVibe, { vibeId: "AS", name: "Commanding", primaryCue: "A", secondaryCue: "S" });
  assert.equal(first.styleProfileInput.coordinateKey, first.matrixKey);
});

test("ASK malformed or unlabeled semantic objects fail closed", () => {
  const payload = adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill");
  const unknown = structuredClone(payload);
  unknown.slots.REQUEST = { action: "UNKNOWN_INTERNAL_ACTION", object: "debt_relief" };
  unknown.slots.request = structuredClone(unknown.slots.REQUEST);
  assert.throws(() => resolveMatrixCell(matrix, unknown, "AS", "BALANCED"), /TPL_ACTION_LABEL_UNAVAILABLE/);
  const legacy = renderSafeFallback(payload, "AS", "BALANCED");
  assert.equal(legacy.executionMode, "PRODUCTION_SAFETY_FALLBACK");
  assert.equal(legacy.fallbackUsed, true);
  noLeakage(legacy.renderedText);
});

test("ASK gates, payload safety, and execution modes fail closed", () => {
  const payload = adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill");
  const gated = resolveMatrixCell(matrix, payload, "BA", "BALANCED", { availableContextFacts: [{ requiredFact: "POSSIBLE_ASK_TO_PRESSURE_DRIFT", authorized: false }] });
  assert.equal(gated.gateResult.exactFactsSatisfied, false);
  assert.deepEqual(gated.gateResult.authorizedFacts, []);
  const authorized = resolveMatrixCell(matrix, payload, "BA", "BALANCED", { availableContextFacts: [{ requiredFact: "POSSIBLE_ASK_TO_PRESSURE_DRIFT", authorized: true, sourceAssertionId: "anchor-review-1" }] });
  assert.equal(authorized.gateResult.exactFactsSatisfied, true);
  assert.deepEqual(authorized.styleProfileInput.availableContextFacts, ["POSSIBLE_ASK_TO_PRESSURE_DRIFT"]);

  for (const executionMode of ["production", "UNKNOWN_MODE", "", "PRODUCTION_SAFETY_FALLBACK"]) {
    assert.throws(() => resolveMatrixCell(matrix, payload, "BA", "BALANCED", { executionMode }), executionMode.toUpperCase().startsWith("PRODUCTION") ? /TPL_PRODUCTION_NOT_ELIGIBLE/ : /TPL_EXECUTION_MODE_UNSUPPORTED/);
  }

  const coercive = structuredClone(payload);
  coercive.slots.REQUEST = "pay now or else I will report you";
  coercive.slots.request = coercive.slots.REQUEST;
  assert.throws(() => resolveMatrixCell(matrix, coercive, "BA", "BALANCED"), /REJECT_UNTRUSTED_FREEFORM_SLOT/);

  const mismatched = structuredClone(payload);
  mismatched.slots.REQUEST = { action: "REQUEST_ACCESS", object: "debt_relief" };
  mismatched.slots.request = structuredClone(mismatched.slots.REQUEST);
  assert.throws(() => resolveMatrixCell(matrix, mismatched, "BA", "BALANCED"), /REJECT_REQUEST_ACTION_MISMATCH/);

  const unsupported = structuredClone(payload);
  unsupported.slots.REQUEST = { action: "REQUEST_EXTENSION", object: "debt_relief", consequence: "report the debt" };
  unsupported.slots.request = structuredClone(unsupported.slots.REQUEST);
  assert.throws(() => resolveMatrixCell(matrix, unsupported, "BA", "BALANCED"), /REJECT_TYPED_SLOT_FIELD_UNSUPPORTED/);

  const unknownTopLevel = structuredClone(payload);
  unknownTopLevel.actionId = "UNKNOWN";
  unknownTopLevel.action = "UNKNOWN";
  unknownTopLevel.slots.action = "UNKNOWN";
  assert.throws(() => resolveMatrixCell(matrix, unknownTopLevel, "BA", "BALANCED"), /TPL_ACTION_LABEL_UNAVAILABLE/);
});

test("per-intensity anchor gates and Vibe cue order are machine-verifiable", () => {
  const anchored = buildMatrixWithAnchors();
  const subtle = anchored.find((cell) => cell.key === "ASK_BA_SUBTLE");
  const balanced = anchored.find((cell) => cell.key === "ASK_BA_BALANCED");
  assert.deepEqual(subtle.requiredContextOrLoreFacts.map((entry) => entry.requiredFact), ["TIME_OR_DEADLINE", "POSSIBLE_ASK_TO_PRESSURE_DRIFT"]);
  assert.deepEqual(balanced.requiredContextOrLoreFacts.map((entry) => entry.requiredFact), ["POSSIBLE_ASK_TO_PRESSURE_DRIFT"]);
  for (const vibe of BASED_VIBES) {
    const rule = VIBE_REALIZATION_RULES[vibe.vibeId];
    assert.equal(rule.primaryCue, vibe.primaryCue);
    assert.equal(rule.secondaryCue, vibe.secondaryCue);
  }
  assert.ok(TPL_TEMPLATES.every((template) => Number.isInteger(template.sourceLine) && template.sourceLine > 0 && template.gateDisposition));
});

test("DEAL phase gate preserves OFFER and RETURN across all 60 coordinates", () => {
  const payload = adapted("OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill");
  const cells = matrix.filter((cell) => cell.speechAct === "DEAL");
  const results = cells.map((cell) => resolveMatrixCell(matrix, payload, cell.vibeId, cell.deliveryIntensity));
  assert.equal(cells.length, 60);
  assert.equal(new Set(results.map((result) => result.renderedText)).size, 60);
  assert.ok(results.every((result) => result.matrixReviewStatus === "REVIEWED" && result.previewEligible && !result.productionEligible));
  assert.ok(results.every((result) => result.semanticInvariancePassed && result.fallbackUsed === false));
  assert.ok(results.every((result) => result.realizedSlots.OFFER === "80 USD of cash" && result.realizedSlots.RETURN === "partial satisfaction of the 250 USD debt"));
  assert.ok(results.every((result) => result.sourceLine > 0 && result.gateResult && result.tplProtocolId === "PROTOCOL_DEAL_CANONICAL_NEUTRAL_V01" && result.styleProfileId === "CANONICAL_NEUTRAL_V01"));
  assert.ok(results.every((result) => !/if that works|scarcity|competitor|deadline|walk[- ]away|consequence|threat|friend|audience/i.test(result.renderedText)));
  results.forEach((result) => {
    noLeakage(result.renderedText);
    const rule = VIBE_REALIZATION_RULES[result.vibeId];
    assert.match(result.renderedText, new RegExp(rule.primaryCueSignal));
    assert.match(result.renderedText, new RegExp(rule.secondaryCueSignal));
  });
  assert.notEqual(results.find((result) => result.matrixKey === "DEAL_BA_SUBTLE")?.renderedText, results.find((result) => result.matrixKey === "DEAL_BA_BALANCED")?.renderedText);
  assert.notEqual(results.find((result) => result.matrixKey === "DEAL_BA_BALANCED")?.renderedText, results.find((result) => result.matrixKey === "DEAL_BA_OVERT")?.renderedText);
});

test("DEAL realizes the alternate authored information exchange and rejects malformed slots", () => {
  const state = DEMO_SCENARIOS.find((entry) => entry.scenarioId === "fixture-secret-leverage");
  const resolved = resolveAction(state, "TRADE_INFORMATION", "imani_intermediary", "player", "PRIVATE_DISCLOSURE");
  const adaptedTrade = adaptResolvedActionToSemanticRequest(resolved);
  assert.equal(adaptedTrade.ok, true);
  const results = matrix.filter((cell) => cell.speechAct === "DEAL").map((cell) => resolveMatrixCell(matrix, adaptedTrade.semanticRequest, cell.vibeId, cell.deliveryIntensity));
  assert.equal(new Set(results.map((result) => result.renderedText)).size, 60);
  assert.ok(results.every((result) => result.realizedSlots.OFFER === "the scoped information" && result.realizedSlots.RETURN === "the agreed confidentiality or action"));

  const malformed = structuredClone(adaptedTrade.semanticRequest);
  malformed.slots.OFFER = { information: "scoped_secret", unexpected: "new fact" };
  malformed.slots.offer = structuredClone(malformed.slots.OFFER);
  assert.throws(() => resolveMatrixCell(matrix, malformed, "AS", "BALANCED"), /REJECT_TYPED_SLOT_FIELD_UNSUPPORTED/);
  const badQuantity = structuredClone(adaptedTrade.semanticRequest);
  badQuantity.slots.OFFER = { object: "cash_80_usd", quantity: 0, unit: "USD" };
  badQuantity.slots.offer = structuredClone(badQuantity.slots.OFFER);
  assert.throws(() => resolveMatrixCell(matrix, badQuantity, "AS", "BALANCED"), /REJECT_QUANTITY_INVALID/);
  const unknownLabel = structuredClone(adaptedTrade.semanticRequest);
  unknownLabel.slots.OFFER = { information: "unreviewed_information" };
  unknownLabel.slots.offer = structuredClone(unknownLabel.slots.OFFER);
  assert.throws(() => resolveMatrixCell(matrix, unknownLabel, "AS", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
});

test("PRESSURE phase gate requires and preserves the complete authored pressure contract", () => {
  const payload = adapted("INVOKE_CONSEQUENCE", "marcus_broker_hill", "player");
  const cells = matrix.filter((cell) => cell.speechAct === "PRESSURE");
  const results = cells.map((cell) => resolveMatrixCell(matrix, payload, cell.vibeId, cell.deliveryIntensity));
  assert.equal(cells.length, 60);
  assert.equal(new Set(results.map((result) => result.renderedText)).size, 60);
  assert.ok(results.every((result) => result.matrixReviewStatus === "REVIEWED" && result.previewEligible && !result.productionEligible));
  assert.ok(results.every((result) => result.semanticInvariancePassed && result.fallbackUsed === false));
  const expectedSlots = results[0].realizedSlots;
  assert.ok(results.every((result) => JSON.stringify(result.realizedSlots) === JSON.stringify(expectedSlots)));
  assert.match(expectedSlots.DEMAND, /250 USD debt/i);
  assert.match(expectedSlots.CONSEQUENCE, /reports the active debt/i);
  results.forEach((result) => noLeakage(result.renderedText));

  const incomplete = structuredClone(payload);
  incomplete.slots.DEMAND = "pay today";
  incomplete.slots.demand = incomplete.slots.DEMAND;
  assert.throws(() => resolveMatrixCell(matrix, incomplete, "BA", "BALANCED"), /REJECT_UNTRUSTED_FREEFORM_SLOT/);
  const mismatched = structuredClone(payload);
  mismatched.slots.CONSEQUENCE.pressureContractId = "other_contract";
  mismatched.slots.consequence = structuredClone(mismatched.slots.CONSEQUENCE);
  assert.throws(() => resolveMatrixCell(matrix, mismatched, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const coupledContractMismatch = structuredClone(payload);
  coupledContractMismatch.slots.DEMAND.pressureContractId = "other_contract";
  coupledContractMismatch.slots.CONSEQUENCE.pressureContractId = "other_contract";
  coupledContractMismatch.slots.demand = structuredClone(coupledContractMismatch.slots.DEMAND);
  coupledContractMismatch.slots.consequence = structuredClone(coupledContractMismatch.slots.CONSEQUENCE);
  assert.throws(() => resolveMatrixCell(matrix, coupledContractMismatch, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const demandIdentityMismatch = structuredClone(payload);
  demandIdentityMismatch.slots.DEMAND.subject = "marcus_broker_hill";
  demandIdentityMismatch.slots.demand = structuredClone(demandIdentityMismatch.slots.DEMAND);
  assert.throws(() => resolveMatrixCell(matrix, demandIdentityMismatch, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const demandAmountMismatch = structuredClone(payload);
  demandAmountMismatch.slots.DEMAND.amount = 999;
  demandAmountMismatch.slots.demand = structuredClone(demandAmountMismatch.slots.DEMAND);
  assert.throws(() => resolveMatrixCell(matrix, demandAmountMismatch, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const leverageIdentityMismatch = structuredClone(payload);
  leverageIdentityMismatch.slots.leverage.actor = "player";
  assert.throws(() => resolveMatrixCell(matrix, leverageIdentityMismatch, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const fearIdentityMismatch = structuredClone(payload);
  fearIdentityMismatch.slots.CONSEQUENCE.fearedBy = "marcus_broker_hill";
  fearIdentityMismatch.slots.consequence = structuredClone(fearIdentityMismatch.slots.CONSEQUENCE);
  assert.throws(() => resolveMatrixCell(matrix, fearIdentityMismatch, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const validityMismatch = structuredClone(payload);
  validityMismatch.slots.CONSEQUENCE.validity.validFrom = "2026-01-02T00:00:00.000Z";
  validityMismatch.slots.consequence = structuredClone(validityMismatch.slots.CONSEQUENCE);
  assert.throws(() => resolveMatrixCell(matrix, validityMismatch, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const malformedValidity = structuredClone(payload);
  malformedValidity.slots.CONSEQUENCE.validity.status = "DISPUTED";
  malformedValidity.slots.consequence = structuredClone(malformedValidity.slots.CONSEQUENCE);
  assert.throws(() => resolveMatrixCell(matrix, malformedValidity, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const contradictoryValidity = structuredClone(payload);
  contradictoryValidity.slots.CONSEQUENCE.validity.validUntil = "2027-01-01T00:00:00.000Z";
  contradictoryValidity.slots.consequence = structuredClone(contradictoryValidity.slots.CONSEQUENCE);
  assert.throws(() => resolveMatrixCell(matrix, contradictoryValidity, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const beliefOnly = structuredClone(payload);
  beliefOnly.slots.DEMAND.scope = "BELIEF";
  beliefOnly.slots.demand = structuredClone(beliefOnly.slots.DEMAND);
  assert.throws(() => resolveMatrixCell(matrix, beliefOnly, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const disputed = structuredClone(payload);
  disputed.slots.DEMAND.status = "DISPUTED";
  disputed.slots.demand = structuredClone(disputed.slots.DEMAND);
  assert.throws(() => resolveMatrixCell(matrix, disputed, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const future = structuredClone(payload);
  future.slots.DEMAND.validFrom = "2099-01-01T00:00:00.000Z";
  future.slots.demand = structuredClone(future.slots.DEMAND);
  assert.throws(() => resolveMatrixCell(matrix, future, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const expired = structuredClone(payload);
  expired.slots.CONSEQUENCE.validUntil = "2026-01-02T00:00:00.000Z";
  expired.slots.consequence = structuredClone(expired.slots.CONSEQUENCE);
  assert.throws(() => resolveMatrixCell(matrix, expired, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
  const wrongContext = structuredClone(payload);
  wrongContext.slots.CONSEQUENCE.contextId = "OTHER_CONTEXT";
  wrongContext.slots.consequence = structuredClone(wrongContext.slots.CONSEQUENCE);
  assert.throws(() => resolveMatrixCell(matrix, wrongContext, "BA", "BALANCED"), /REJECT_SEMANTIC_BINDING_SLOT_DRIFT/);
});

test("PRESSURE accepts a valid non-demo authored semantic contract", () => {
  const payload = nonDemoPressurePayload();
  const result = resolveMatrixCell(matrix, payload, "AS", "BALANCED");
  assert.equal(result.fallbackUsed, false);
  assert.equal(result.matrixReviewStatus, "REVIEWED");
  assert.match(result.renderedText, /125 USD/);
  assert.match(result.renderedText, /active obligation/i);
});

test("PRESSURE temporal evaluation is explicit and deterministic", () => {
  const payload = nonDemoPressurePayload();
  const boundedUntil = "2026-09-03T00:00:00.000Z";
  payload.slots.leverage.validUntil = boundedUntil;
  payload.slots.DEMAND.validUntil = boundedUntil;
  payload.slots.demand = structuredClone(payload.slots.DEMAND);
  payload.slots.CONSEQUENCE.validUntil = boundedUntil;
  payload.slots.CONSEQUENCE.validity.validUntil = boundedUntil;
  payload.slots.CONSEQUENCE.validity.validUntilIsUnbounded = false;
  payload.slots.consequence = structuredClone(payload.slots.CONSEQUENCE);
  const first = resolveMatrixCell(matrix, payload, "AS", "BALANCED");
  const second = resolveMatrixCell(matrix, payload, "AS", "BALANCED");
  assert.deepEqual(first, second);
  assert.equal(first.evaluationTime, "2026-09-02T12:00:00.000Z");
  assert.throws(() => resolveMatrixCell(matrix, payload, "AS", "BALANCED", { evaluationTime: "2026-09-04T00:00:00.000Z" }), /TPL_PRESSURE_EXPIRED/);
});

test("unauthorized PRESSURE actions fail safely at the runtime boundary", () => {
  assert.throws(() => resolveMatrixCell(matrix, invalidPressureActionPayload(), "AS", "BALANCED"), /TPL_PRESSURE_ACTION_UNAUTHORIZED/);
});

test("intensity cannot introduce an unauthorized PRESSURE condition", () => {
  const payload = adapted("INVOKE_CONSEQUENCE", "marcus_broker_hill", "player");
  for (const deliveryIntensity of ["SUBTLE", "BALANCED", "OVERT"]) {
    const result = resolveMatrixCell(matrix, payload, "BA", deliveryIntensity);
    assert.doesNotMatch(result.renderedText, /if the demand is not met|otherwise|unless/i);
  }
});

test("typed semantic additions are authorized by the action contract", () => {
  const payload = adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill");
  const unauthorized = structuredClone(payload);
  unauthorized.slots.REQUEST = { action: "REQUEST_EXTENSION", object: "debt_relief", condition: "if the demand is not met" };
  unauthorized.slots.request = structuredClone(unauthorized.slots.REQUEST);
  assert.throws(() => resolveMatrixCell(matrix, unauthorized, "AS", "BALANCED"), /REJECT_ACTION_SEMANTIC_FIELD_UNAUTHORIZED/);
});

test("rendered semantic evidence rejects additions and dropped mandatory fragments", () => {
  const payload = adapted("INVOKE_CONSEQUENCE", "marcus_broker_hill", "player");
  const result = resolveMatrixCell(matrix, payload, "BA", "BALANCED");
  assert.equal(result.semanticInvariancePassed, true);
  assert.ok(result.semanticEvidence.requiredFragments.every((fragment) => fragment.preserved));

  const dropped = result.renderedText.replace(result.semanticEvidence.requiredFragments.find((fragment) => fragment.slot === "DEMAND").text, "");
  const droppedEvidence = validateRenderedTextSemanticEvidence({
    payload,
    renderedText: dropped,
    realizedSlots: result.realizedSlots,
    presentationOnlyAtoms: result.semanticEvidence.presentationOnlyAtoms,
  });
  assert.equal(droppedEvidence.passed, false);
  assert.ok(droppedEvidence.reasons.some((reason) => reason.code === "REJECT_MANDATORY_SEMANTIC_FRAGMENT_DROPPED"));

  const injected = `${result.renderedText} If the demand is not met, act now.`;
  const injectedEvidence = validateRenderedTextSemanticEvidence({
    payload,
    renderedText: injected,
    realizedSlots: result.realizedSlots,
    presentationOnlyAtoms: result.semanticEvidence.presentationOnlyAtoms,
  });
  assert.equal(injectedEvidence.passed, false);
  assert.ok(injectedEvidence.reasons.some((reason) => reason.code === "REJECT_UNAUTHORIZED_RENDERED_FRAGMENT"));
  assert.ok(result.semanticEvidence.presentationOnlyAtoms.every((atom) => atom.semanticEffect === "NONE"));

  const semanticAtom = structuredClone(result.semanticEvidence.presentationOnlyAtoms);
  semanticAtom[0].semanticEffect = "SEMANTIC";
  const mislabeledAtomEvidence = validateRenderedTextSemanticEvidence({
    payload,
    renderedText: result.renderedText,
    realizedSlots: result.realizedSlots,
    presentationOnlyAtoms: semanticAtom,
  });
  assert.equal(mislabeledAtomEvidence.passed, false);
  assert.ok(mislabeledAtomEvidence.reasons.some((reason) => reason.code === "REJECT_PRESENTATION_ATOM_SEMANTIC_EFFECT"));

  const forgedSlots = structuredClone(result.realizedSlots);
  forgedSlots.DEMAND = "pay an unrelated amount";
  const forgedEvidence = validateRenderedTextSemanticEvidence({
    payload,
    renderedText: result.renderedText,
    realizedSlots: forgedSlots,
    presentationOnlyAtoms: result.semanticEvidence.presentationOnlyAtoms,
  });
  assert.equal(forgedEvidence.passed, false);
  assert.ok(forgedEvidence.reasons.some((reason) => reason.code === "REJECT_REALIZED_SLOTS_DRIFT"));

  const unregisteredAtomEvidence = validateRenderedTextSemanticEvidence({
    payload,
    renderedText: result.renderedText,
    realizedSlots: result.realizedSlots,
    presentationOnlyAtoms: [...result.semanticEvidence.presentationOnlyAtoms, { atomId: "ATOM_UNREGISTERED", text: "if the demand is not met", semanticEffect: "NONE" }],
  });
  assert.equal(unregisteredAtomEvidence.passed, false);
  assert.ok(unregisteredAtomEvidence.reasons.some((reason) => reason.code === "REJECT_UNREGISTERED_PRESENTATION_ATOM"));
});

test("rendered dialogue rejects raw object and array serialization", () => {
  const payload = adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill");
  for (const rawRequest of ["{action: review}", "[\"REQUEST_EXTENSION\"]"]) {
    const candidate = structuredClone(payload);
    candidate.slots.REQUEST = rawRequest;
    candidate.slots.request = rawRequest;
    assert.throws(() => resolveMatrixCell(matrix, candidate, "AS", "BALANCED"), /REJECT_UNTRUSTED_FREEFORM_SLOT/);
  }
});

test("ASK and DEAL evidence rejects unauthorized conditional additions", () => {
  const cases = [
    ["ASK", adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill"), "AS", "please add a deadline if you refuse"],
    ["DEAL", adapted("OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill"), "AS", "if that works"],
  ];
  for (const [speechAct, payload, vibeId, addition] of cases) {
    const result = resolveMatrixCell(matrix, payload, vibeId, "BALANCED");
    const evidence = validateRenderedTextSemanticEvidence({
      payload,
      renderedText: `${result.renderedText} ${addition}`,
      realizedSlots: result.realizedSlots,
      presentationOnlyAtoms: result.semanticEvidence.presentationOnlyAtoms,
    });
    assert.equal(evidence.passed, false, `${speechAct} accepted an unauthorized conditional addition`);
    assert.ok(evidence.reasons.some((reason) => reason.code === "REJECT_UNAUTHORIZED_RENDERED_FRAGMENT"));
  }
});

test("all intensities preserve the same mandatory semantic fragments", () => {
  const payload = adapted("INVOKE_CONSEQUENCE", "marcus_broker_hill", "player");
  const results = ["SUBTLE", "BALANCED", "OVERT"].map((deliveryIntensity) => resolveMatrixCell(matrix, payload, "BA", deliveryIntensity));
  const required = results[0].semanticEvidence.requiredFragments.map((fragment) => fragment.slot);
  assert.deepEqual(results.map((result) => result.semanticEvidence.requiredFragments.map((fragment) => fragment.slot)), [required, required, required]);
  for (const result of results) assert.ok(result.semanticEvidence.requiredFragments.every((fragment) => fragment.preserved));
});

test("all three acts preserve mandatory semantic facts across every intensity", () => {
  const cases = [
    ["ASK", adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill")],
    ["DEAL", adapted("OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill")],
    ["PRESSURE", adapted("INVOKE_CONSEQUENCE", "marcus_broker_hill", "player")],
  ];
  for (const [speechAct, payload] of cases) {
    const results = ["SUBTLE", "BALANCED", "OVERT"].map((deliveryIntensity) => resolveMatrixCell(matrix, payload, "BA", deliveryIntensity));
    const baseline = results[0].semanticEvidence.requiredFragments.map((fragment) => [fragment.slot, fragment.text]);
  for (const result of results) {
      assert.equal(result.speechAct, speechAct);
      assert.equal(result.fallbackUsed, false);
      assert.deepEqual(result.semanticEvidence.requiredFragments.map((fragment) => [fragment.slot, fragment.text]), baseline);
      assert.deepEqual(result.semanticEvidence.mandatoryFacts, results[0].semanticEvidence.mandatoryFacts);
      assert.ok(result.semanticEvidence.requiredFragments.every((fragment) => fragment.preserved));
    }
  }
});

test("TPL runtime source has no network or generation dependency", () => {
  const source = readFileSync(fileURLToPath(new URL("../src/tpl.mjs", import.meta.url)), "utf8");
  assert.doesNotMatch(source, /\b(?:fetch|WebSocket|XMLHttpRequest)\b|openai|llm|remote[-_ ]generation/i);
});

test("all act coverage is exhaustive and status/provenance are honest", () => {
  const representatives = new Map([
    ["ASK", adapted("REQUEST_EXTENSION", "player", "marcus_broker_hill")],
    ["DEAL", adapted("OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill")],
    ["PRESSURE", adapted("INVOKE_CONSEQUENCE", "marcus_broker_hill", "player")],
  ]);
  const coverage = buildTplCoverage({ matrix, representatives });
  assert.equal(coverage.length, 180);
  assert.deepEqual(Object.fromEntries(["ASK", "DEAL", "PRESSURE"].map((act) => [act, coverage.filter((row) => row.speechAct === act).length])), { ASK: 60, DEAL: 60, PRESSURE: 60 });
  assert.equal(new Set(coverage.map((row) => row.coordinateKey)).size, 180);
  assert.equal(new Set(coverage.map((row) => row.templateVariantId)).size, 180);
  assert.ok(coverage.every((row) => row.matrixReviewStatus === "REVIEWED" && row.previewEligible && !row.productionEligible));
  assert.ok(coverage.every((row) => row.semanticInvariancePassed && row.deterministic));
  assert.equal(TPL_TEMPLATES.length, 180);
  assert.equal(TPL_PROTOCOLS.filter((protocol) => protocol.reviewStatus === "APPROVED").length, 0);
  assert.equal(TPL_STYLE_PROFILES.find((profile) => profile.profileId === "ZANT_HUMOR_V01").productionEligible, false);
  for (const vibe of BASED_VIBES) assert.equal(coverage.filter((row) => row.vibeId === vibe.vibeId).length, 9);
});
