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
const topLevelProtectedFields = [
  "actor", "target", "recipient", "action", "object", "quantity", "price", "deadline", "location", "ownership", "permission",
  "prohibition", "condition", "leverage", "consequence", "outcome", "knowledge", "authorOnlyReveal", "stateDelta", "contextId",
  "actorId", "targetId", "actionId",
];

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value ?? {}, key);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isPresent = (value) => value !== undefined && value !== null && (!(typeof value === "string") || value.trim().length > 0);

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
  if (!isPresent(payload.semanticRequestId)) reasons.push(rejection("REJECT_REQUEST_ID_MISSING", "The semantic request identity is required."));
  if (!SPEECH_ACTS.includes(payload.speechAct)) reasons.push(rejection("REJECT_SPEECH_ACT_INVALID", `Unsupported macro speech act: ${payload.speechAct}.`));
  if (!isObject(payload.slots)) {
    reasons.push(rejection("REJECT_SLOTS_NOT_OBJECT", "The semantic request slots must be an object."));
    return { passed: reasons.length === 0, reasons };
  }
  for (const slot of Object.keys(payload.slots)) {
    if (!allowedSlotNames.has(slot)) reasons.push(rejection("REJECT_UNAUTHORIZED_SLOT", `Slot ${slot} is not in the semantic payload contract.`, { slot }));
  }
  const requiredSlots = SEMANTIC_SLOTS_BY_ACT[payload.speechAct] ?? [];
  for (const slot of requiredSlots) {
    if (!isPresent(payload.slots[slot])) reasons.push(rejection("REJECT_REQUIRED_SLOT_MISSING", `Required ${payload.speechAct} slot ${slot} is missing.`, { slot }));
  }
  for (const slot of semanticSlots) {
    if (hasOwn(payload.slots, slot) && !requiredSlots.includes(slot)) reasons.push(rejection("REJECT_CROSS_ACT_SLOT", `Slot ${slot} is not valid for ${payload.speechAct}.`, { slot }));
  }
  return { passed: reasons.length === 0, reasons };
}

export function validateSemanticInvariance(payloadBefore, payloadAfter, evidence = {}) {
  const reasons = [];
  if (payloadBefore.semanticRequestId !== payloadAfter.semanticRequestId) reasons.push({ code: "REJECT_REQUEST_ID_CHANGED", message: "The semantic request identity changed." });
  if (payloadBefore.speechAct !== payloadAfter.speechAct) reasons.push({ code: "REJECT_SPEECH_ACT_DRIFT", message: "The macro speech act changed." });
  reasons.push(...validateSemanticPayload(payloadBefore).reasons, ...validateSemanticPayload(payloadAfter).reasons);
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
  for (const field of topLevelProtectedFields) {
    const beforePresent = hasOwn(payloadBefore, field);
    const afterPresent = hasOwn(payloadAfter, field);
    if (!beforePresent && afterPresent) reasons.push(rejection("REJECT_SEMANTIC_FIELD_ADDED", `Protected semantic field ${field} was added by realization.`, { field }));
    else if (beforePresent && !afterPresent) reasons.push(rejection("REJECT_SEMANTIC_FIELD_REMOVED", `Protected semantic field ${field} was removed by realization.`, { field }));
    else if (beforePresent && !valuesEqual(payloadBefore[field], payloadAfter[field])) reasons.push(rejection(field === "deadline" ? "REJECT_DEADLINE_DRIFT" : "REJECT_SEMANTIC_FIELD_CHANGED", `Protected semantic field ${field} changed.`, { field }));
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
