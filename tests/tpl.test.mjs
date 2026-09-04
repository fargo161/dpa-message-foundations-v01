import test from "node:test";
import assert from "node:assert/strict";
import { ACTION_DEFINITIONS, createMarcusScenario, resolveAction } from "../src/mechanics.mjs";
import { BASED_VIBES, buildMatrixWithAnchors, generateMatrix } from "../src/based.mjs";
import { adaptResolvedActionToSemanticRequest } from "../src/action-tpl-adapter.mjs";
import { ACTION_PRESENTATION_LABELS, FACE_COMPATIBILITY_BOUNDARY, FALLBACK_CONSTRUCTION_BY_ACT, TPL_ATOMS, TPL_CONSTRUCTIONS, TPL_FALLBACK_POLICY, TPL_FAMILIES, TPL_PROTOCOLS, TPL_TEMPLATES, TPL_STYLE_PROFILES, buildRuntimeMatrix, deriveActionPresentationLabels, renderSafeFallback, resolveMatrixCell, validateSemanticInvariance, validateSemanticPayload } from "../src/tpl.mjs";

const makeSemanticRequest = (speechAct, semanticSlots, overrides = {}) => {
  const slots = {
    actor: "player",
    target: "marcus_broker_hill",
    action: speechAct === "ASK" ? "REQUEST_EXTENSION" : speechAct === "DEAL" ? "OFFER_PARTIAL_PAYMENT" : "INVOKE_CONSEQUENCE",
    contextId: "PRIVATE_NEGOTIATION",
    ...semanticSlots,
  };
  const request = {
    schemaVersion: "dpa-keyword-foundation@0.1",
    adapterVersion: "action-tpl-adapter@0.1",
    semanticRequestId: `semantic:test:${speechAct.toLowerCase()}`,
    actionId: slots.action,
    actorId: "player",
    targetId: "marcus_broker_hill",
    contextId: "PRIVATE_NEGOTIATION",
    actor: "player",
    target: "marcus_broker_hill",
    action: slots.action,
    speechAct,
    outcome: "PROPOSED",
    slots,
    mandatorySemanticFacts: ["actor", "target", "action", "contextId"],
    forbiddenSemanticAdditions: ["unauthored_deadline", "unauthored_threat"],
    provenance: [{ sourceId: "project-authored-test", sourceRecordId: "history:test:1", transformVersion: "tpl-test@1", licenseId: "PROJECT_AUTHORED" }],
    ...overrides,
  };
  const projection = speechAct === "PRESSURE"
    ? { DEMAND: request.slots.DEMAND, CONSEQUENCE: request.slots.CONSEQUENCE, leverage: request.slots.leverage }
    : speechAct === "DEAL"
      ? { OFFER: request.slots.OFFER, RETURN: request.slots.RETURN }
      : { REQUEST: request.slots.REQUEST };
  request.semanticBinding = {
    bindingVersion: "mechanics-tpl-binding@0.1",
    source: "AUTHORED_SEMANTIC_CONTRACT",
    sourceRecordId: request.provenance[0].sourceRecordId,
    actionId: request.actionId,
    actorId: request.actorId,
    targetId: request.targetId,
    contextId: request.contextId,
    payload: { actor: request.actorId, target: request.targetId, action: request.actionId, ...projection },
    semanticSlots: projection,
  };
  return request;
};

const canonicalAsk = () => makeSemanticRequest("ASK", {
  REQUEST: { action: "REQUEST_EXTENSION", object: "debt_relief" },
  request: { action: "REQUEST_EXTENSION", object: "debt_relief" },
});

const completePressure = () => {
  const demand = {
    kind: "FULFILL_OBLIGATION",
    demandId: "OWES:player_owes_marcus_250",
    subject: "player",
    object: "marcus_broker_hill",
    term: "debt_250_usd",
    amount: 250,
    unit: "USD",
    due: "2026-09-03T09:00:00.000Z",
    sourceAssertionId: "player_owes_marcus_250",
    scope: "ACTUAL",
    contextId: "PRIVATE_NEGOTIATION",
    validFrom: "2026-01-01T00:00:00.000Z",
    pressureContractId: "pressure_debt_exposure",
    authoredDemand: "pay debt_250_usd",
  };
  const consequence = {
    consequenceId: "public_debt_exposure",
    text: "Marcus reports the active debt to the building owner.",
    fearedBy: "player",
    fearedConsequenceSourceAssertionId: "player_fears_exposure",
    leverageBasis: "debt_250_usd",
    demandId: demand.demandId,
    scope: "ACTUAL",
    contextId: "PRIVATE_NEGOTIATION",
    validFrom: "2026-01-01T00:00:00.000Z",
    validity: { scope: "ACTUAL", contextId: "PRIVATE_NEGOTIATION", validFrom: "2026-01-01T00:00:00.000Z", validUntilIsUnbounded: true },
    pressureContractId: "pressure_debt_exposure",
  };
  return makeSemanticRequest("PRESSURE", {
    actor: "marcus_broker_hill",
    target: "player",
    leverage: { actor: "marcus_broker_hill", target: "player", basis: "debt_250_usd", sourceAssertionId: "marcus_leverage_debt", scope: "ACTUAL", contextId: "PRIVATE_NEGOTIATION", validFrom: "2026-01-01T00:00:00.000Z", pressureContractId: "pressure_debt_exposure" },
    DEMAND: demand,
    demand,
    CONSEQUENCE: consequence,
    consequence,
  }, { actorId: "marcus_broker_hill", targetId: "player", actor: "marcus_broker_hill", target: "player" });
};

test("TPL scaffold covers each family with reviewed preview mappings", () => {
  assert.deepEqual(TPL_FAMILIES, ["VOICE_QUALITY", "VOCALIZATION", "TACTILE_KINESIC", "VISUAL_KINESIC", "ARTIFACT"]);
  for (const family of TPL_FAMILIES) assert.ok(TPL_ATOMS.some((atom) => atom.family === family));
  assert.equal(TPL_CONSTRUCTIONS.length, 3);
  assert.equal(TPL_PROTOCOLS.length, 3);
  assert.ok(TPL_PROTOCOLS.every((protocol) => protocol.reviewStatus === "REVIEWED"));
  assert.equal(generateMatrix().filter((cell) => cell.reviewStatus === "UNMAPPED").length, 180);
  const anchored = buildMatrixWithAnchors();
  assert.equal(anchored.length, 180);
  assert.equal(new Set(anchored.flatMap((cell) => cell.candidateAnchorIds)).size, 60);
  assert.equal(anchored.filter((cell) => cell.candidateAnchorIds.length).length, 180);
  assert.ok(anchored.some((cell) => cell.requiredContextOrLoreFacts.length > 0));
  assert.ok(anchored.flatMap((cell) => cell.requiredContextOrLoreFacts).every((gate) => anchored.some((cell) => cell.candidateAnchorIds.includes(gate.sourceAnchorId))));
  assert.ok(anchored.every((cell) => cell.reviewStatus === "UNMAPPED"));
  const runtime = buildRuntimeMatrix();
  assert.equal(runtime.filter((cell) => cell.reviewStatus === "REVIEWED").length, 180);
  assert.equal(TPL_TEMPLATES.length, 180);
  assert.equal(TPL_STYLE_PROFILES.find((profile) => profile.profileId === "CANONICAL_NEUTRAL_V01").previewEligible, true);
  assert.equal(TPL_STYLE_PROFILES.find((profile) => profile.profileId === "CANONICAL_NEUTRAL_V01").productionEligible, false);
  assert.equal(BASED_VIBES.length, 20);
});

test("semantic invariance blocks drift and unsupported knowledge", () => {
  const before = canonicalAsk();
  assert.equal(validateSemanticInvariance(before, structuredClone(before)).passed, true);
  const changedDeadline = structuredClone(before);
  changedDeadline.slots.deadline = "2026-09-10";
  assert.equal(validateSemanticInvariance(before, changedDeadline).passed, false);
  assert.equal(validateSemanticInvariance(before, before, { speakerKnowledgeClaims: [{ claim: "ledger", available: false }] }).passed, false);
  assert.equal(validateSemanticInvariance(before, before, { authorOnlyReveals: ["secret"] }).passed, false);
  assert.equal(validateSemanticInvariance(before, { ...before, speechAct: "PRESSURE" }).passed, false);
  assert.equal(validateSemanticInvariance(before, { ...before, slots: { ...before.slots, UNLISTED: "new proposition" } }).reasons[0].code, "REJECT_UNAUTHORIZED_SLOT");

  const changedRequest = structuredClone(before);
  changedRequest.slots.REQUEST.object = "different_object";
  assert.equal(validateSemanticInvariance(before, changedRequest).reasons.some((reason) => reason.code === "REJECT_SLOT_VALUE_CHANGED" && reason.slot === "REQUEST"), true);
  const renamedRequest = { ...structuredClone(before), slots: { request: "review the ledger", deadline: "2026-09-03" } };
  assert.equal(validateSemanticInvariance(before, renamedRequest).passed, false);
  assert.ok(validateSemanticInvariance(before, renamedRequest).reasons.some((reason) => reason.code === "REJECT_REQUIRED_SLOT_REMOVED"));

  const deal = makeSemanticRequest("DEAL", {
    OFFER: { object: "cash_80_usd", quantity: 80, unit: "USD" },
    offer: { object: "cash_80_usd", quantity: 80, unit: "USD" },
    RETURN: { object: "debt_250_usd", status: "partial_satisfaction" },
    return: { object: "debt_250_usd", status: "partial_satisfaction" },
  });
  const changedOffer = structuredClone(deal);
  changedOffer.slots.OFFER.quantity = 800;
  assert.equal(validateSemanticInvariance(deal, changedOffer).passed, false);
  assert.equal(validateSemanticInvariance(deal, changedOffer).reasons.some((reason) => reason.slot === "OFFER"), true);
  const changedReturn = structuredClone(deal);
  changedReturn.slots.RETURN = { object: "ownership_transfer" };
  assert.equal(validateSemanticInvariance(deal, changedReturn).passed, false);

  const pressure = completePressure();
  const inventedThreat = structuredClone(pressure);
  inventedThreat.slots.CONSEQUENCE.text = "destroy the building";
  inventedThreat.slots.consequence = structuredClone(inventedThreat.slots.CONSEQUENCE);
  assert.equal(validateSemanticInvariance(pressure, inventedThreat).passed, false);
  const lowercaseActorDrift = structuredClone(before);
  lowercaseActorDrift.slots.actor = "different-actor";
  assert.equal(validateSemanticInvariance(before, lowercaseActorDrift).passed, false);
  assert.equal(validateSemanticPayload({ ...canonicalAsk(), slots: { request: { action: "REQUEST_EXTENSION" } } }).passed, false);
});

test("canonical envelope protects every top-level field and preserves nested types", () => {
  const before = canonicalAsk();
  const mutations = {
    schemaVersion: "dpa-keyword-foundation@9.9",
    adapterVersion: "other-adapter@9",
    semanticRequestId: "semantic:test:other-occurrence",
    actionId: "REQUEST_ACCESS",
    actorId: "other-actor",
    targetId: "other-target",
    contextId: "OTHER_CONTEXT",
    actor: "other-actor",
    target: "other-target",
    action: "REQUEST_ACCESS",
    speechAct: "DEAL",
    outcome: "BLOCKED",
    slots: { ...before.slots, REQUEST: { action: "REQUEST_EXTENSION", object: "debt_relief", quantity: "1" }, request: { action: "REQUEST_EXTENSION", object: "debt_relief", quantity: "1" } },
    mandatorySemanticFacts: [...before.mandatorySemanticFacts, "invented_fact"],
    forbiddenSemanticAdditions: [...before.forbiddenSemanticAdditions, "unauthorized_policy_change"],
    provenance: [{ ...before.provenance[0], sourceRecordId: "different-history" }],
  };
  for (const [field, value] of Object.entries(mutations)) {
    const after = structuredClone(before);
    after[field] = value;
    const result = validateSemanticInvariance(before, after);
    assert.equal(result.passed, false, `mutation of ${field} was accepted`);
  }
  const nestedTypeChange = structuredClone(before);
  nestedTypeChange.slots.REQUEST.object = ["debt_relief"];
  nestedTypeChange.slots.request.object = ["debt_relief"];
  assert.equal(validateSemanticInvariance(before, nestedTypeChange).passed, false);
  const addedProposition = structuredClone(before);
  addedProposition.slots.inventedThreat = "pay or else";
  assert.equal(validateSemanticInvariance(before, addedProposition).passed, false);
});

test("macro acts require exact uppercase/lowercase semantic slot pairs", () => {
  for (const payload of [
    makeSemanticRequest("ASK", { REQUEST: { action: "REQUEST_EXTENSION", object: "debt_relief" }, request: { action: "REQUEST_EXTENSION", object: "debt_relief" } }),
    makeSemanticRequest("DEAL", { OFFER: { object: "cash_80_usd", quantity: 80, unit: "USD" }, offer: { object: "cash_80_usd", quantity: 80, unit: "USD" }, RETURN: { object: "debt_250_usd", status: "partial_satisfaction" }, return: { object: "debt_250_usd", status: "partial_satisfaction" } }),
    completePressure(),
  ]) assert.equal(validateSemanticPayload(payload).passed, true);

  const contradictory = canonicalAsk();
  contradictory.slots.request = { action: "PAY_NOW", object: "debt_relief" };
  assert.equal(validateSemanticPayload(contradictory).passed, false);

  const missingLowercase = canonicalAsk();
  delete missingLowercase.slots.request;
  assert.equal(validateSemanticPayload(missingLowercase).passed, false);

  const crossAct = canonicalAsk();
  crossAct.slots.OFFER = { object: "cash", quantity: 80 };
  crossAct.slots.offer = { object: "cash", quantity: 80 };
  assert.equal(validateSemanticPayload(crossAct).passed, false);
});

test("required semantic slots reject empty and malformed shapes", () => {
  for (const [field, value] of [["REQUEST", ""], ["REQUEST", {}], ["REQUEST", []], ["REQUEST", { action: "" }]]) {
    const payload = canonicalAsk();
    payload.slots[field] = value;
    payload.slots[field.toLowerCase()] = structuredClone(value);
    assert.equal(validateSemanticPayload(payload).passed, false, `${field} malformed value was accepted`);
  }
  const malformedQuantity = makeSemanticRequest("DEAL", {
    OFFER: { object: "cash", quantity: 0 },
    offer: { object: "cash", quantity: 0 },
    RETURN: { object: "extension" },
    return: { object: "extension" },
  });
  assert.equal(validateSemanticPayload(malformedQuantity).passed, false);
  const emptyPolicy = canonicalAsk();
  emptyPolicy.forbiddenSemanticAdditions = [];
  assert.equal(validateSemanticPayload(emptyPolicy).passed, false);
});

test("the runtime boundary rejects incomplete and contradictory semantic envelopes", () => {
  const canonical = canonicalAsk();
  const invalidCases = [
    ["missing schemaVersion", (payload) => delete payload.schemaVersion],
    ["wrong schemaVersion", (payload) => { payload.schemaVersion = "dpa-keyword-foundation@9.9"; }],
    ["missing adapterVersion", (payload) => delete payload.adapterVersion],
    ["wrong adapterVersion", (payload) => { payload.adapterVersion = "other-adapter@9"; }],
    ["missing outcome", (payload) => delete payload.outcome],
    ["blocked outcome", (payload) => { payload.outcome = "BLOCKED"; }],
    ["missing provenance", (payload) => delete payload.provenance],
    ["empty provenance", (payload) => { payload.provenance = []; }],
    ["extra provenance property", (payload) => { payload.provenance[0].privatePath = "C:\\private"; }],
    ["missing mandatory facts", (payload) => delete payload.mandatorySemanticFacts],
    ["empty mandatory facts", (payload) => { payload.mandatorySemanticFacts = []; }],
    ["duplicate mandatory facts", (payload) => { payload.mandatorySemanticFacts = ["actor", "actor"]; }],
    ["missing forbidden additions", (payload) => delete payload.forbiddenSemanticAdditions],
    ["empty forbidden additions", (payload) => { payload.forbiddenSemanticAdditions = []; }],
    ["duplicate forbidden additions", (payload) => { payload.forbiddenSemanticAdditions = ["unauthored_threat", "unauthored_threat"]; }],
    ["unauthorized top-level field", (payload) => { payload.privateNote = "not semantic"; }],
    ["uppercase/lowercase contradiction", (payload) => { payload.slots.request = { action: "PAY_NOW" }; }],
    ["identity disagreement", (payload) => { payload.slots.actor = "other-actor"; }],
  ];
  for (const [label, mutate] of invalidCases) {
    const payload = structuredClone(canonical);
    mutate(payload);
    assert.equal(validateSemanticPayload(payload).passed, false, `${label} was accepted`);
    assert.throws(() => renderSafeFallback(payload, "AS", "OVERT"), /SEMANTIC_PAYLOAD_INVALID/, `${label} reached rendering`);
    assert.throws(() => resolveMatrixCell(generateMatrix(), payload, "AS", "OVERT"), /SEMANTIC_PAYLOAD_INVALID/, `${label} reached matrix resolution`);
  }
  for (const speechAct of ["ASK", "DEAL", "PRESSURE"]) {
    const minimal = { semanticRequestId: `legacy-${speechAct}`, speechAct, slots: {} };
    assert.equal(validateSemanticPayload(minimal).passed, false, `legacy ${speechAct} payload was accepted`);
    assert.throws(() => renderSafeFallback(minimal, "AS", "OVERT"), /SEMANTIC_PAYLOAD_INVALID/);
    assert.throws(() => resolveMatrixCell(generateMatrix(), minimal, "AS", "OVERT"), /SEMANTIC_PAYLOAD_INVALID/);
  }
});

test("legacy fallback remains safe while mapped preview preserves the selected act", () => {
  for (const speechAct of ["DEAL", "PRESSURE", "ASK"]) {
    const slots = speechAct === "DEAL" ? { OFFER: { object: "cash_80_usd", quantity: 80, unit: "USD" }, offer: { object: "cash_80_usd", quantity: 80, unit: "USD" }, RETURN: { object: "debt_250_usd", status: "partial_satisfaction" }, return: { object: "debt_250_usd", status: "partial_satisfaction" } } : { REQUEST: { action: "REQUEST_EXTENSION", object: "debt_relief" }, request: { action: "REQUEST_EXTENSION", object: "debt_relief" } };
    const payload = speechAct === "PRESSURE" ? completePressure() : makeSemanticRequest(speechAct, slots, { semanticRequestId: `r-${speechAct}` });
    const result = renderSafeFallback(payload, "AS", "OVERT");
    assert.equal(result.semanticInvariancePassed, true);
    assert.equal(result.fallbackUsed, true);
    assert.equal(result.speechAct, speechAct);
    assert.equal(result.constructionId, FALLBACK_CONSTRUCTION_BY_ACT[speechAct]);
    const construction = TPL_CONSTRUCTIONS.find((entry) => entry.constructionId === result.constructionId);
    assert.ok(construction, `${speechAct} fallback references an unregistered construction`);
    assert.ok(construction.speechActs.includes(speechAct), `${speechAct} fallback references an incompatible construction`);
    for (const requiredSlot of construction.requiredSlots) assert.ok(Object.hasOwn(payload.slots, requiredSlot), `${speechAct} fallback lacks ${requiredSlot}`);
    assert.equal(result.tplProtocolId, null);
    assert.deepEqual(result.appliedAtomIds, []);
    const resolved = resolveMatrixCell(generateMatrix(), speechAct === "PRESSURE" ? completePressure() : payload, "AS", "OVERT");
    assert.equal(resolved.matrixKey, `${speechAct}_AS_OVERT`);
    assert.equal(resolved.matrixReviewStatus, "REVIEWED");
    assert.equal(resolved.fallbackUsed, false);
    assert.equal(resolved.tplProtocolId, TPL_PROTOCOLS.find((protocol) => protocol.speechActs.includes(speechAct)).tplProtocolId);
    assert.equal(resolved.constructionId, result.constructionId);
  }
  assert.throws(() => renderSafeFallback({ semanticRequestId: "bad", speechAct: "UNKNOWN", slots: {} }, "AS", "OVERT"), /SEMANTIC_PAYLOAD_INVALID/);
  assert.throws(() => renderSafeFallback(canonicalAsk(), "ZZ", "OVERT"), /VIBE_NOT_ALLOWED/);
  assert.throws(() => renderSafeFallback(canonicalAsk(), "AS", "LOUD"), /DELIVERY_INTENSITY_NOT_ALLOWED/);
  assert.equal(FACE_COMPATIBILITY_BOUNDARY.rendererMayMutateFaceSlots, false);
  assert.equal(TPL_FALLBACK_POLICY.totalActIntensityForms, 9);
  assert.equal(TPL_FALLBACK_POLICY.vibeAffectsWording, true);
  const wordingPayload = makeSemanticRequest("ASK", { REQUEST: { action: "REQUEST_EXTENSION", object: "debt_relief" }, request: { action: "REQUEST_EXTENSION", object: "debt_relief" } }, { semanticRequestId: "vibe-wording" });
  const subtle = renderSafeFallback(wordingPayload, "AS", "SUBTLE");
  const otherVibe = renderSafeFallback(wordingPayload, "BA", "SUBTLE");
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

  const contradictoryPayload = structuredClone(resolved);
  contradictoryPayload.payload = {
    ...contradictoryPayload.payload,
    REQUEST: { action: "REQUEST_EXTENSION", object: "debt_relief" },
    request: "pay now",
  };
  const contradictory = adaptResolvedActionToSemanticRequest(contradictoryPayload);
  assert.equal(contradictory.ok, false);
  assert.ok(contradictory.failures.some((failure) => failure.code === "RESOLUTION_PAYLOAD_PROVENANCE_MISMATCH"));

  const blocked = resolveAction(state, "REQUEST_EXTENSION", "player", "apartment_305_entry", "PRIVATE_NEGOTIATION");
  const rejected = adaptResolvedActionToSemanticRequest(blocked);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.quarantined, true);
  assert.equal(rejected.semanticRequest, null);
  assert.equal(rejected.failures[0].code, "BLOCKED_ACTION_NOT_RENDERABLE");

  const incomplete = adaptResolvedActionToSemanticRequest({ ...resolved, payload: { actor: "player", target: "marcus_broker_hill", action: "REQUEST_SUPPORT" } });
  assert.equal(incomplete.ok, false);
  assert.equal(incomplete.failures[0].code, "RESOLUTION_PAYLOAD_PROVENANCE_MISMATCH");
});

test("TPL action presentation metadata is derived from the canonical action registry", () => {
  const registryIds = ACTION_DEFINITIONS.map((entry) => entry.actionId).sort();
  assert.deepEqual(Object.keys(ACTION_PRESENTATION_LABELS).sort(), registryIds);
  for (const entry of ACTION_DEFINITIONS) {
    assert.equal(typeof entry.tplPresentation?.label, "string", `${entry.actionId} lacks reviewed TPL presentation metadata`);
    assert.equal(ACTION_PRESENTATION_LABELS[entry.actionId], entry.tplPresentation.label, `${entry.actionId} has a duplicated or divergent label registry`);
  }
  assert.deepEqual(new Set(ACTION_DEFINITIONS.map((entry) => entry.macroAct)), new Set(["ASK", "DEAL", "PRESSURE"]));
});

test("documented action extension derives a label without a second registry", () => {
  const extension = {
    actionId: "REQUEST_ARCHIVE_REVIEW",
    displayName: "Request an archive review",
    tplPresentation: { label: "an archive review" },
    macroAct: "ASK",
    requiredChecks: [],
    forbiddenChecks: [],
    payload: (actorId, targetId) => ({ actor: actorId, target: targetId, action: "REQUEST_ARCHIVE_REVIEW", object: "archive_review" }),
    history: "ARCHIVE_REVIEW_REQUESTED",
  };
  const labels = deriveActionPresentationLabels([...ACTION_DEFINITIONS, extension]);
  assert.equal(labels.REQUEST_ARCHIVE_REVIEW, "an archive review");
  assert.throws(() => deriveActionPresentationLabels([...ACTION_DEFINITIONS, extension, extension]), /ACTION_PRESENTATION_ACTION_DUPLICATE/);
});
