import { ACTION_INVARIANTS, BASED_VIBES, DELIVERY_INTENSITIES, SPEECH_ACTS, buildMatrixWithAnchors, generateMatrix } from "./based.mjs";

export const TPL_FAMILIES = Object.freeze(["VOICE_QUALITY", "VOCALIZATION", "TACTILE_KINESIC", "VISUAL_KINESIC", "ARTIFACT"]);
export const TPL_STATUSES = Object.freeze(["UNMAPPED", "CANDIDATE", "REVIEWED", "APPROVED", "BLOCKED"]);

export const TPL_ATOMS = Object.freeze([
  { atomId: "ATOM_VQ_ELLIPSIS", family: "VOICE_QUALITY", subtype: "silence", operation: "bounded_ellipsis", maxOccurrences: 1, status: "CANDIDATE", provenance: "PROJECT_AUTHORED" },
  { atomId: "ATOM_VQ_FRAGMENT", family: "VOICE_QUALITY", subtype: "rhythm", operation: "bounded_fragment", maxOccurrences: 1, status: "CANDIDATE", provenance: "PROJECT_AUTHORED" },
  { atomId: "ATOM_VOCAL_ACK", family: "VOCALIZATION", subtype: "acknowledgment", operation: "authored_acknowledgment", maxOccurrences: 1, status: "CANDIDATE", provenance: "PROJECT_AUTHORED" },
  { atomId: "ATOM_TACTILE_PAUSE", family: "TACTILE_KINESIC", subtype: "contact", operation: "context_gated_contact_reference", maxOccurrences: 1, status: "CANDIDATE", statusReason: "Reference-only scaffold; no renderer mutation or physical action is implied.", provenance: "PROJECT_AUTHORED" },
  { atomId: "ATOM_VISUAL_GESTURE", family: "VISUAL_KINESIC", subtype: "gesture", operation: "written_gesture", maxOccurrences: 1, status: "CANDIDATE", statusReason: "Requires context gate and remains separate from face evidence.", provenance: "PROJECT_AUTHORED" },
  { atomId: "ATOM_ARTIFACT_BREAK", family: "ARTIFACT", subtype: "segmentation", operation: "line_break", maxOccurrences: 2, status: "CANDIDATE", provenance: "PROJECT_AUTHORED" },
]);

export const TPL_CONSTRUCTIONS = Object.freeze([
  { constructionId: "CONSTRUCTION_ASK_REQUEST", speechActs: ["ASK"], requiredSlots: ["REQUEST"], status: "REVIEWED", provenance: "PROJECT_AUTHORED" },
  { constructionId: "CONSTRUCTION_DEAL_EXCHANGE", speechActs: ["DEAL"], requiredSlots: ["OFFER", "RETURN"], status: "REVIEWED", provenance: "PROJECT_AUTHORED" },
  { constructionId: "CONSTRUCTION_PRESSURE_CONSEQUENCE", speechActs: ["PRESSURE"], requiredSlots: ["DEMAND", "CONSEQUENCE"], status: "REVIEWED", provenance: "PROJECT_AUTHORED" },
]);

export const TPL_PROTOCOLS = Object.freeze([
  { tplProtocolId: "PROTOCOL_ASK_SAFE_FALLBACK", speechActs: ["ASK"], constructionIds: ["CONSTRUCTION_ASK_REQUEST"], requiredAtomIds: [], optionalAtomIds: ["ATOM_VQ_ELLIPSIS", "ATOM_ARTIFACT_BREAK"], excludedAtomIds: [], intensityProfiles: ["SUBTLE", "BALANCED", "OVERT"], semanticInvarianceRequired: true, reviewStatus: "CANDIDATE", provenance: ["PROJECT_AUTHORED"] },
  { tplProtocolId: "PROTOCOL_DEAL_SAFE_FALLBACK", speechActs: ["DEAL"], constructionIds: ["CONSTRUCTION_DEAL_EXCHANGE"], requiredAtomIds: [], optionalAtomIds: ["ATOM_VQ_FRAGMENT", "ATOM_ARTIFACT_BREAK"], excludedAtomIds: [], intensityProfiles: ["SUBTLE", "BALANCED", "OVERT"], semanticInvarianceRequired: true, reviewStatus: "CANDIDATE", provenance: ["PROJECT_AUTHORED"] },
  { tplProtocolId: "PROTOCOL_PRESSURE_SAFE_FALLBACK", speechActs: ["PRESSURE"], constructionIds: ["CONSTRUCTION_PRESSURE_CONSEQUENCE"], requiredAtomIds: [], optionalAtomIds: ["ATOM_VQ_FRAGMENT", "ATOM_ARTIFACT_BREAK"], excludedAtomIds: [], intensityProfiles: ["SUBTLE", "BALANCED", "OVERT"], semanticInvarianceRequired: true, reviewStatus: "CANDIDATE", provenance: ["PROJECT_AUTHORED"] },
]);

export const FACE_COMPATIBILITY_BOUNDARY = Object.freeze({
  system: "SEPARATE_FACE_EVIDENCE",
  relation: "MANY_TO_MANY",
  reactionFaceField: "reactionFaceId",
  replyFaceField: "replyFaceId",
  rendererMayMutateFaceSlots: false,
});

export const SEMANTIC_SLOTS_BY_ACT = Object.freeze({
  DEAL: Object.freeze([...ACTION_INVARIANTS.DEAL]),
  PRESSURE: Object.freeze([...ACTION_INVARIANTS.PRESSURE]),
  ASK: Object.freeze([...ACTION_INVARIANTS.ASK]),
});

export const TPL_FALLBACK_POLICY = Object.freeze({
  status: "FOUNDATION_ONLY",
  formsPerAct: DELIVERY_INTENSITIES.length,
  totalActIntensityForms: SPEECH_ACTS.length * DELIVERY_INTENSITIES.length,
  vibeAffectsWording: false,
  vibeAffects: ["coordinate identity", "deterministic seed", "future protocol selection"],
  dynamicDialoguePopulation: "DEFERRED_TO_PHASE_2",
  approvedProtocolCount: 0,
});

const protectedSlots = [
  "actor", "target", "recipient", "action", "object", "quantity", "price", "deadline", "location", "ownership",
  "permission", "prohibition", "condition", "leverage", "consequence", "speechAct", "outcome", "offer", "return",
  "demand", "request", "information", "knowledge", "authorOnlyReveal", "stateDelta", "contextId", "actorId", "targetId", "actionId",
];
const semanticSlots = ["OFFER", "RETURN", "DEMAND", "CONSEQUENCE", "REQUEST"];
const allowedSlotNames = new Set([...protectedSlots, ...semanticSlots]);
const canonicalEnvelopeFields = [
  "schemaVersion", "adapterVersion", "semanticRequestId", "actionId", "actorId", "targetId", "contextId",
  "actor", "target", "action", "speechAct", "outcome", "slots", "mandatorySemanticFacts", "forbiddenSemanticAdditions", "provenance",
];
const canonicalEnvelopeFieldSet = new Set(canonicalEnvelopeFields);
const legacyEnvelopeFields = new Set(["semanticRequestId", "speechAct", "slots", "actorId", "targetId"]);
const identityFields = ["actor", "target", "action", "contextId", "actorId", "targetId", "actionId"];
const requiredCanonicalFields = canonicalEnvelopeFields;

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value ?? {}, key);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isPresent = (value) => value !== undefined && value !== null && (!(typeof value === "string") || value.trim().length > 0);

function hasCanonicalEnvelope(payload) {
  return isObject(payload) && hasOwn(payload, "schemaVersion");
}

function meaningfulValue(value, path = "value") {
  if (value === undefined || value === null) return rejection("REJECT_MEANINGLESS_VALUE", `${path} must not be null or undefined.`, { path });
  if (typeof value === "string") return value.trim().length ? null : rejection("REJECT_MEANINGLESS_VALUE", `${path} must not be empty.`, { path });
  if (typeof value === "number") return Number.isFinite(value) ? null : rejection("REJECT_MEANINGLESS_VALUE", `${path} must be finite.`, { path });
  if (typeof value === "boolean") return null;
  if (Array.isArray(value)) {
    if (!value.length) return rejection("REJECT_EMPTY_ARRAY", `${path} must not be empty.`, { path });
    for (const [index, entry] of value.entries()) {
      const reason = meaningfulValue(entry, `${path}[${index}]`);
      if (reason) return reason;
    }
    return null;
  }
  if (isObject(value)) {
    const keys = Object.keys(value);
    if (!keys.length) return rejection("REJECT_EMPTY_OBJECT", `${path} must not be empty.`, { path });
    for (const key of keys) {
      if (!key.trim()) return rejection("REJECT_MEANINGLESS_KEY", `${path} contains an empty key.`, { path });
      const reason = meaningfulValue(value[key], `${path}.${key}`);
      if (reason) return reason;
    }
    if (hasOwn(value, "quantity") && (typeof value.quantity !== "number" || !Number.isFinite(value.quantity) || value.quantity <= 0)) {
      return rejection("REJECT_QUANTITY_INVALID", `${path}.quantity must be a finite positive number.`, { path: `${path}.quantity` });
    }
    if (hasOwn(value, "price") && (typeof value.price !== "number" || !Number.isFinite(value.price) || value.price < 0)) {
      return rejection("REJECT_PRICE_INVALID", `${path}.price must be a finite non-negative number.`, { path: `${path}.price` });
    }
    return null;
  }
  return rejection("REJECT_MEANINGLESS_VALUE", `${path} has an unsupported value type.`, { path });
}

function nonEmptyString(value, code, field) {
  return typeof value === "string" && value.trim().length
    ? null
    : rejection(code, `${field} must be a non-empty string.`, { field });
}

function validateCanonicalProvenance(provenance) {
  const reasons = [];
  if (!Array.isArray(provenance) || !provenance.length) {
    reasons.push(rejection("REJECT_PROVENANCE_EMPTY", "provenance must be a non-empty array."));
    return reasons;
  }
  for (const [index, reference] of provenance.entries()) {
    if (!isObject(reference)) {
      reasons.push(rejection("REJECT_PROVENANCE_ENTRY_INVALID", `provenance[${index}] must be an object.`, { index }));
      continue;
    }
    for (const field of ["sourceId", "sourceRecordId", "transformVersion", "licenseId"]) {
      const reason = nonEmptyString(reference[field], "REJECT_PROVENANCE_FIELD_INVALID", `provenance[${index}].${field}`);
      if (reason) reasons.push(reason);
    }
  }
  return reasons;
}

function validateCanonicalEnvelope(payload, reasons) {
  for (const field of requiredCanonicalFields) {
    if (!hasOwn(payload, field)) reasons.push(rejection("REJECT_ENVELOPE_FIELD_MISSING", `Canonical semantic field ${field} is required.`, { field }));
  }
  for (const field of Object.keys(payload)) {
    if (!canonicalEnvelopeFieldSet.has(field)) reasons.push(rejection("REJECT_UNAUTHORIZED_SEMANTIC_FIELD", `Top-level semantic field ${field} is not in the canonical envelope.`, { field }));
  }
  if (payload.schemaVersion !== "dpa-keyword-foundation@0.1") reasons.push(rejection("REJECT_SCHEMA_VERSION_INVALID", "schemaVersion does not identify the canonical semantic contract."));
  for (const field of ["adapterVersion", "semanticRequestId", "actionId", "actorId", "targetId", "contextId", "actor", "target", "action"]) {
    const reason = nonEmptyString(payload[field], "REJECT_ENVELOPE_FIELD_INVALID", field);
    if (reason) reasons.push(reason);
  }
  if (typeof payload.actionId === "string" && !/^[A-Z][A-Z0-9_]+$/.test(payload.actionId)) reasons.push(rejection("REJECT_ACTION_ID_INVALID", "actionId must be a stable uppercase action identifier."));
  if (payload.actor !== payload.actorId) reasons.push(rejection("REJECT_ACTOR_ID_MISMATCH", "actor must equal actorId."));
  if (payload.target !== payload.targetId) reasons.push(rejection("REJECT_TARGET_ID_MISMATCH", "target must equal targetId."));
  if (payload.action !== payload.actionId) reasons.push(rejection("REJECT_ACTION_ID_MISMATCH", "action must equal actionId."));
  if (!SPEECH_ACTS.includes(payload.speechAct)) reasons.push(rejection("REJECT_SPEECH_ACT_INVALID", `Unsupported macro speech act: ${payload.speechAct}.`));
  if (payload.outcome !== "PROPOSED") reasons.push(rejection("REJECT_OUTCOME_INVALID", "Only PROPOSED semantic requests may cross the TPL boundary."));
  for (const field of ["mandatorySemanticFacts", "forbiddenSemanticAdditions"]) {
    if (!Array.isArray(payload[field]) || !payload[field].length) reasons.push(rejection("REJECT_POLICY_ARRAY_INVALID", `${field} must be a non-empty array.`, { field }));
    else for (const [index, value] of payload[field].entries()) {
      const reason = meaningfulValue(value, `${field}[${index}]`);
      if (reason) reasons.push(reason);
    }
  }
  reasons.push(...validateCanonicalProvenance(payload.provenance));
}

function validateSlotPairs(payload, reasons, strictCanonical) {
  const slots = payload.slots;
  const requiredSlots = SEMANTIC_SLOTS_BY_ACT[payload.speechAct] ?? [];
  for (const upperSlot of semanticSlots) {
    const lowerSlot = upperSlot.toLowerCase();
    const upperPresent = hasOwn(slots, upperSlot);
    const lowerPresent = hasOwn(slots, lowerSlot);
    const required = requiredSlots.includes(upperSlot);
    if (required && !upperPresent) reasons.push(rejection("REJECT_REQUIRED_SLOT_MISSING", `Required ${payload.speechAct} slot ${upperSlot} is missing.`, { slot: upperSlot }));
    if (required && strictCanonical && !lowerPresent) reasons.push(rejection("REJECT_LOWERCASE_SLOT_MISSING", `Canonical lowercase slot ${lowerSlot} is required alongside ${upperSlot}.`, { slot: lowerSlot }));
    if (!required && (upperPresent || lowerPresent)) reasons.push(rejection("REJECT_CROSS_ACT_SLOT", `Slot ${upperSlot}/${lowerSlot} is not valid for ${payload.speechAct}.`, { slot: upperSlot }));
    if (upperPresent && lowerPresent && !valuesEqual(slots[upperSlot], slots[lowerSlot])) reasons.push(rejection("REJECT_UPPERCASE_LOWERCASE_MISMATCH", `Slots ${upperSlot} and ${lowerSlot} must carry identical values.`, { upperSlot, lowerSlot }));
    for (const slot of [upperSlot, lowerSlot]) if (hasOwn(slots, slot)) {
      const reason = meaningfulValue(slots[slot], `slots.${slot}`);
      if (reason) reasons.push(reason);
    }
  }
  for (const [slot, value] of Object.entries(slots)) {
    if (!allowedSlotNames.has(slot)) reasons.push(rejection("REJECT_UNAUTHORIZED_SLOT", `Slot ${slot} is not in the semantic payload contract.`, { slot }));
    if (semanticSlots.includes(slot)) continue;
    const reason = meaningfulValue(value, `slots.${slot}`);
    if (reason) reasons.push(reason);
  }
  for (const field of identityFields) {
    if (hasOwn(slots, field) && hasOwn(payload, field) && !valuesEqual(slots[field], payload[field])) reasons.push(rejection("REJECT_SLOT_IDENTITY_MISMATCH", `slots.${field} does not agree with the top-level identity.`, { field }));
  }
}

function canonicalJson(value) {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

function valuesEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function rejection(code, message, extra = {}) {
  return { code, message, ...extra };
}

export function validateSemanticPayload(payload) {
  const reasons = [];
  if (!isObject(payload)) return { passed: false, reasons: [rejection("REJECT_PAYLOAD_NOT_OBJECT", "The semantic request must be an object.")] };
  const strictCanonical = hasCanonicalEnvelope(payload);
  if (strictCanonical) validateCanonicalEnvelope(payload, reasons);
  else {
    if (!isPresent(payload.semanticRequestId)) reasons.push(rejection("REJECT_REQUEST_ID_MISSING", "The semantic request identity is required."));
    if (!SPEECH_ACTS.includes(payload.speechAct)) reasons.push(rejection("REJECT_SPEECH_ACT_INVALID", `Unsupported macro speech act: ${payload.speechAct}.`));
    for (const field of Object.keys(payload)) if (!legacyEnvelopeFields.has(field)) reasons.push(rejection("REJECT_UNAUTHORIZED_SEMANTIC_FIELD", `Top-level semantic field ${field} requires the canonical envelope.`, { field }));
  }
  if (!isObject(payload.slots)) {
    reasons.push(rejection("REJECT_SLOTS_NOT_OBJECT", "The semantic request slots must be an object."));
    return { passed: reasons.length === 0, reasons };
  }
  validateSlotPairs(payload, reasons, strictCanonical);
  return { passed: reasons.length === 0, reasons };
}

export function validateSemanticInvariance(payloadBefore, payloadAfter, evidence = {}) {
  const reasons = [];
  if (!isObject(payloadBefore) || !isObject(payloadAfter)) return { passed: false, reasons: [rejection("REJECT_PAYLOAD_NOT_OBJECT", "Both semantic payloads must be objects.")] };
  const strictCanonical = hasCanonicalEnvelope(payloadBefore) || hasCanonicalEnvelope(payloadAfter);
  if (payloadBefore.semanticRequestId !== payloadAfter.semanticRequestId) reasons.push(rejection("REJECT_REQUEST_ID_CHANGED", "The semantic request identity changed."));
  if (payloadBefore.speechAct !== payloadAfter.speechAct) reasons.push(rejection("REJECT_SPEECH_ACT_DRIFT", "The macro speech act changed."));
  reasons.push(...validateSemanticPayload(payloadBefore).reasons, ...validateSemanticPayload(payloadAfter).reasons);
  const topLevelNames = strictCanonical
    ? new Set([...canonicalEnvelopeFields, ...Object.keys(payloadBefore), ...Object.keys(payloadAfter)])
    : new Set([...Object.keys(payloadBefore), ...Object.keys(payloadAfter)]);
  for (const field of topLevelNames) {
    const beforePresent = hasOwn(payloadBefore, field);
    const afterPresent = hasOwn(payloadAfter, field);
    if (!beforePresent && afterPresent) reasons.push(rejection("REJECT_SEMANTIC_FIELD_ADDED", `Protected semantic field ${field} was added by realization.`, { field }));
    else if (beforePresent && !afterPresent) reasons.push(rejection("REJECT_SEMANTIC_FIELD_REMOVED", `Protected semantic field ${field} was removed by realization.`, { field }));
    else if (field === "slots") continue;
    else if (beforePresent && !valuesEqual(payloadBefore[field], payloadAfter[field])) {
      const code = field === "semanticRequestId" ? "REJECT_REQUEST_ID_CHANGED"
        : field === "schemaVersion" ? "REJECT_SCHEMA_VERSION_CHANGED"
          : field === "adapterVersion" ? "REJECT_ADAPTER_VERSION_CHANGED"
            : field === "mandatorySemanticFacts" ? "REJECT_MANDATORY_FACTS_CHANGED"
              : field === "forbiddenSemanticAdditions" ? "REJECT_FORBIDDEN_ADDITIONS_CHANGED"
                : field === "provenance" ? "REJECT_PROVENANCE_CHANGED"
                  : field === "speechAct" ? "REJECT_SPEECH_ACT_DRIFT"
                    : field === "deadline" ? "REJECT_DEADLINE_DRIFT" : "REJECT_SEMANTIC_FIELD_CHANGED";
      reasons.push(rejection(code, `Protected semantic field ${field} changed.`, { field }));
    }
  }
  const beforeSlots = payloadBefore.slots ?? {};
  const afterSlots = payloadAfter.slots ?? {};
  const slotNames = new Set([...Object.keys(beforeSlots), ...Object.keys(afterSlots)]);
  for (const slot of slotNames) {
    if (!allowedSlotNames.has(slot)) {
      reasons.push(rejection("REJECT_UNAUTHORIZED_SLOT", `Slot ${slot} is not in the semantic payload contract.`, { slot }));
      continue;
    }
    const beforePresent = hasOwn(beforeSlots, slot);
    const afterPresent = hasOwn(afterSlots, slot);
    if (!beforePresent && afterPresent) {
      reasons.push(rejection("REJECT_SLOT_ADDED", `Protected semantic slot ${slot} was added by realization.`, { slot }));
    } else if (beforePresent && !afterPresent) {
      const code = SEMANTIC_SLOTS_BY_ACT[payloadBefore.speechAct]?.includes(slot) ? "REJECT_REQUIRED_SLOT_REMOVED" : "REJECT_SLOT_REMOVED";
      reasons.push(rejection(code, `Protected semantic slot ${slot} was removed by realization.`, { slot }));
    } else if (beforePresent && !valuesEqual(beforeSlots[slot], afterSlots[slot])) {
      reasons.push(rejection(slot === "deadline" ? "REJECT_DEADLINE_DRIFT" : "REJECT_SLOT_VALUE_CHANGED", `Protected slot ${slot} changed.`, { slot }));
    }
  }
  for (const addition of evidence.unauthorizedAdditions ?? []) reasons.push(rejection(addition.code ?? "REJECT_ADDED_PROPOSITION", addition.message ?? "An unauthorized semantic addition was detected."));
  if ((evidence.speakerKnowledgeClaims ?? []).some((claim) => claim.available === false)) reasons.push(rejection("REJECT_UNAVAILABLE_SPEAKER_KNOWLEDGE", "The realization asserts knowledge unavailable to the speaker."));
  if ((evidence.authorOnlyReveals ?? []).length) reasons.push(rejection("REJECT_AUTHOR_ONLY_REVEAL", "The realization reveals author-only information."));
  return { passed: reasons.length === 0, reasons };
}

const slotText = (payload, name, fallback) => {
  const value = payload.slots?.[name];
  if (value === undefined || value === null) return fallback;
  return typeof value === "object" ? canonicalJson(value) : String(value);
};

export function renderSafeFallback(payload, vibeId, deliveryIntensity) {
  const speechAct = payload.speechAct;
  if (!SPEECH_ACTS.includes(speechAct)) throw new Error(`SPEECH_ACT_NOT_ALLOWED:${speechAct}`);
  if (!DELIVERY_INTENSITIES.includes(deliveryIntensity)) throw new Error(`DELIVERY_INTENSITY_NOT_ALLOWED:${deliveryIntensity}`);
  if (!BASED_VIBES.some((entry) => entry.vibeId === vibeId)) throw new Error(`VIBE_NOT_ALLOWED:${vibeId}`);
  const payloadValidation = validateSemanticPayload(payload);
  if (!payloadValidation.passed) throw new Error(`SEMANTIC_PAYLOAD_INVALID:${payloadValidation.reasons.map((reason) => reason.code).join(",")}`);
  const text = speechAct === "DEAL"
    ? deliveryIntensity === "SUBTLE" ? `${slotText(payload, "OFFER", "[OFFER]")} for ${slotText(payload, "RETURN", "[RETURN]")}.`
      : deliveryIntensity === "BALANCED" ? `Here is the exchange: ${slotText(payload, "OFFER", "[OFFER]")} for ${slotText(payload, "RETURN", "[RETURN]")}.`
        : `${slotText(payload, "OFFER", "[OFFER]")}. I receive ${slotText(payload, "RETURN", "[RETURN]")}.`
    : speechAct === "PRESSURE"
      ? deliveryIntensity === "SUBTLE" ? `You could ${slotText(payload, "DEMAND", "[DEMAND]")}… otherwise ${slotText(payload, "CONSEQUENCE", "[CONSEQUENCE]")}.`
        : deliveryIntensity === "BALANCED" ? `${slotText(payload, "DEMAND", "[DEMAND]")}; otherwise, ${slotText(payload, "CONSEQUENCE", "[CONSEQUENCE]")}.`
          : `${slotText(payload, "DEMAND", "[DEMAND]")}. Otherwise: ${slotText(payload, "CONSEQUENCE", "[CONSEQUENCE]")}.`
      : deliveryIntensity === "SUBTLE" ? `Could you ${slotText(payload, "REQUEST", "[REQUEST]")}?`
        : deliveryIntensity === "BALANCED" ? `I am asking you to ${slotText(payload, "REQUEST", "[REQUEST]")}.`
          : `I need a clear answer: ${slotText(payload, "REQUEST", "[REQUEST]")}.`;
  const payloadAfter = structuredClone(payload);
  const invariant = validateSemanticInvariance(payload, payloadAfter);
  return {
    semanticRequestId: payload.semanticRequestId,
    speechAct,
    vibeId,
    deliveryIntensity,
    constructionId: `CONSTRUCTION_${speechAct}_SAFE_FALLBACK`,
    tplProtocolId: null,
    appliedAtomIds: [],
    payloadBefore: structuredClone(payload),
    payloadAfter,
    semanticInvariancePassed: invariant.passed,
    renderedText: text,
    stableSeed: `${payload.semanticRequestId}|${vibeId}|${deliveryIntensity}`,
    provenance: [{ sourceId: "project-safe-fallback", sourceRecordId: `fallback_${speechAct}`, licenseId: "PROJECT_AUTHORED" }],
    rejectionReasons: invariant.reasons,
    fallbackUsed: true,
    fallbackPolicy: TPL_FALLBACK_POLICY,
  };
}

export function resolveMatrixCell(matrix, payload, vibeId, deliveryIntensity) {
  const key = `${payload.speechAct}_${vibeId}_${deliveryIntensity}`;
  const cell = matrix.find((entry) => entry.key === key);
  if (!cell) throw new Error(`MATRIX_CELL_NOT_FOUND:${key}`);
  if (cell.reviewStatus !== "APPROVED" || !cell.preferredProtocolIds.length) {
    const result = renderSafeFallback(payload, vibeId, deliveryIntensity);
    return { ...result, matrixKey: key, rejectionReasons: [{ code: "MATRIX_CELL_UNMAPPED", message: "The canonical cell has no approved protocol mapping; deterministic safe fallback used." }, ...result.rejectionReasons] };
  }
  throw new Error("APPROVED_PROTOCOL_RENDERER_DEFERRED");
}

export function buildTplScaffold() {
  const matrix = buildMatrixWithAnchors();
  const anchors = matrix.flatMap((cell) => cell.candidateAnchorIds);
  return {
    families: [...TPL_FAMILIES],
    atoms: [...TPL_ATOMS],
    constructions: [...TPL_CONSTRUCTIONS],
    protocols: [...TPL_PROTOCOLS],
    matrix,
    anchorCount: new Set(anchors).size,
    matrixStatusCounts: Object.fromEntries(TPL_STATUSES.map((status) => [status, matrix.filter((cell) => cell.reviewStatus === status).length])),
    faceBoundary: FACE_COMPATIBILITY_BOUNDARY,
    fallbackPolicy: TPL_FALLBACK_POLICY,
  };
}

export function tplStatusSummary() {
  const byStatus = (items, key = "status") => Object.fromEntries(TPL_STATUSES.map((status) => [status, items.filter((item) => (item[key] ?? item.reviewStatus) === status).length]));
  return { atoms: byStatus(TPL_ATOMS), constructions: byStatus(TPL_CONSTRUCTIONS), protocols: byStatus(TPL_PROTOCOLS, "reviewStatus"), matrix: byStatus(generateMatrix(), "reviewStatus") };
}
