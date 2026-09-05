import { ACTION_INVARIANTS, BASED_VIBES, DELIVERY_INTENSITIES, SPEECH_ACTS, buildMatrixWithAnchors } from "./based.mjs";
import { ACTION_DEFINITIONS, getRecordedResolutionPayload } from "./mechanics.mjs";

export const TPL_FAMILIES = Object.freeze(["VOICE_QUALITY", "VOCALIZATION", "TACTILE_KINESIC", "VISUAL_KINESIC", "ARTIFACT"]);
export const TPL_STATUSES = Object.freeze(["UNMAPPED", "CANDIDATE", "REVIEWED", "APPROVED", "BLOCKED"]);
export const TPL_READINESS_STATES = Object.freeze(["PREVIEW_READY", "REVIEWED", "APPROVED", "PRODUCTION_ELIGIBLE", "BLOCKED"]);
export const SEMANTIC_SCHEMA_VERSION = "dpa-keyword-foundation@0.1";
export const SEMANTIC_ADAPTER_VERSION = "action-tpl-adapter@0.1";
export const SEMANTIC_BINDING_VERSION = "mechanics-tpl-binding@0.1";
export const SEMANTIC_BINDING_SOURCES = Object.freeze(["MECHANICS_RESOLUTION", "AUTHORED_SEMANTIC_CONTRACT"]);
export const SEMANTIC_OUTCOME = "PROPOSED";

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

export const FALLBACK_CONSTRUCTION_BY_ACT = Object.freeze({
  ASK: "CONSTRUCTION_ASK_REQUEST",
  DEAL: "CONSTRUCTION_DEAL_EXCHANGE",
  PRESSURE: "CONSTRUCTION_PRESSURE_CONSEQUENCE",
});

export const TPL_PROTOCOLS = Object.freeze([
  { tplProtocolId: "PROTOCOL_ASK_CANONICAL_NEUTRAL_V01", speechActs: ["ASK"], constructionIds: ["CONSTRUCTION_ASK_REQUEST"], requiredAtomIds: [], optionalAtomIds: ["ATOM_VQ_ELLIPSIS", "ATOM_ARTIFACT_BREAK"], excludedAtomIds: [], intensityProfiles: ["SUBTLE", "BALANCED", "OVERT"], semanticInvarianceRequired: true, reviewStatus: "REVIEWED", readiness: { state: "REVIEWED" }, provenance: ["PROJECT_AUTHORED", "DERIVED_CANONICAL_NEUTRAL_V01"] },
  { tplProtocolId: "PROTOCOL_DEAL_CANONICAL_NEUTRAL_V01", speechActs: ["DEAL"], constructionIds: ["CONSTRUCTION_DEAL_EXCHANGE"], requiredAtomIds: [], optionalAtomIds: ["ATOM_VQ_FRAGMENT", "ATOM_ARTIFACT_BREAK"], excludedAtomIds: [], intensityProfiles: ["SUBTLE", "BALANCED", "OVERT"], semanticInvarianceRequired: true, reviewStatus: "REVIEWED", readiness: { state: "REVIEWED" }, provenance: ["PROJECT_AUTHORED", "DERIVED_CANONICAL_NEUTRAL_V01"] },
  { tplProtocolId: "PROTOCOL_PRESSURE_CANONICAL_NEUTRAL_V01", speechActs: ["PRESSURE"], constructionIds: ["CONSTRUCTION_PRESSURE_CONSEQUENCE"], requiredAtomIds: [], optionalAtomIds: ["ATOM_VQ_FRAGMENT", "ATOM_ARTIFACT_BREAK"], excludedAtomIds: [], intensityProfiles: ["SUBTLE", "BALANCED", "OVERT"], semanticInvarianceRequired: true, reviewStatus: "REVIEWED", readiness: { state: "REVIEWED" }, provenance: ["PROJECT_AUTHORED", "DERIVED_CANONICAL_NEUTRAL_V01"] },
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
  status: "PHASE_2_AUTHORING_PREVIEW",
  formsPerAct: DELIVERY_INTENSITIES.length,
  totalActIntensityForms: SPEECH_ACTS.length * DELIVERY_INTENSITIES.length,
  vibeAffectsWording: true,
  vibeAffects: ["reviewed written wording", "coordinate identity", "deterministic selection"],
  dynamicDialoguePopulation: "PHASE_2_AUTHORING_PREVIEW",
  approvedProtocolCount: 0,
  productionBoundary: "FAIL_CLOSED_UNTIL_OWNER_APPROVAL",
  legacyFallback: "EXPLICIT_PRODUCTION_SAFETY_PATH_ONLY",
});

export const STYLE_PROFILE_IDS = Object.freeze(["CANONICAL_NEUTRAL_V01", "ZANT_HUMOR_V01"]);
export const TPL_STYLE_PROFILES = Object.freeze([
  {
    profileId: "CANONICAL_NEUTRAL_V01",
    version: "1.0",
    name: "Canonical neutral review language",
    reviewStatus: "REVIEWED",
    readiness: { state: "REVIEWED" },
    previewEligible: true,
    productionEligible: false,
    provenance: ["PROJECT_AUTHORED", "DERIVED_CANONICAL_NEUTRAL_V01"],
    description: "Deterministic review language for authoring preview; it is not final ZANT language.",
  },
  {
    profileId: "ZANT_HUMOR_V01",
    version: "UNSUPPLIED",
    name: "Future ZANT humor language",
    reviewStatus: "BLOCKED",
    readiness: { state: "BLOCKED" },
    previewEligible: false,
    productionEligible: false,
    provenance: ["FUTURE_OWNER_SUPPLIED_TEMPLATE_REQUIRED"],
    description: "Reserved extension point. No ZANT wording is supplied or approved in this mission.",
  },
]);

const RUNTIME_PROTOCOL_BY_ACT = Object.freeze({
  ASK: "PROTOCOL_ASK_CANONICAL_NEUTRAL_V01",
  DEAL: "PROTOCOL_DEAL_CANONICAL_NEUTRAL_V01",
  PRESSURE: "PROTOCOL_PRESSURE_CANONICAL_NEUTRAL_V01",
});

const CUE_REALIZATION_SIGNALS = Object.freeze({
  B: "keep the edge visible",
  A: "move this forward",
  S: "keep the exchange open",
  E: "acknowledge the position",
  D: "leave room for implication",
});

export const VIBE_REALIZATION_RECIPES = Object.freeze({
  BA: { primary: "Let's keep the edge visible and move this forward", modifier: "The wording stays ready to act" },
  BS: { primary: "Let's keep the edge visible and keep the exchange open", modifier: "The wording stays pointed but open" },
  BE: { primary: "Let's keep the edge visible and acknowledge the position", modifier: "The wording stays firm and attentive" },
  BD: { primary: "Let's keep the edge visible and leave room for implication", modifier: "The wording stays guarded" },
  AB: { primary: "Let's move this forward and keep the edge visible", modifier: "The direction stays firm" },
  AS: { primary: "Let's move this forward and keep the exchange open", modifier: "The direction stays clear" },
  AE: { primary: "Let's move this forward and acknowledge the position", modifier: "The direction stays attentive" },
  AD: { primary: "Let's move this forward and leave room for implication", modifier: "The wording stays tight" },
  SB: { primary: "Let's keep the exchange open and keep the edge visible", modifier: "The tone stays teasing" },
  SA: { primary: "Let's keep the exchange open and move this forward", modifier: "The tone stays assured" },
  SE: { primary: "Let's keep the exchange open and acknowledge the position", modifier: "The tone stays considerate" },
  SD: { primary: "Let's keep the exchange open and leave room for implication", modifier: "The tone stays coaxing" },
  EB: { primary: "Let's acknowledge the position and keep the edge visible", modifier: "The wording stays steady" },
  EA: { primary: "Let's acknowledge the position and move this forward", modifier: "The limit stays clear" },
  ES: { primary: "Let's acknowledge the position and keep the exchange open", modifier: "The wording stays communal" },
  ED: { primary: "Let's acknowledge the position and leave room for implication", modifier: "The wording stays redirecting" },
  DB: { primary: "Let's leave room for implication and keep the edge visible", modifier: "The wording stays bluff-aware" },
  DA: { primary: "Let's leave room for implication and move this forward", modifier: "The wording stays watchful" },
  DS: { primary: "Let's leave room for implication and keep the exchange open", modifier: "The wording stays socially fluent" },
  DE: { primary: "Let's leave room for implication and acknowledge the position", modifier: "The wording stays measured" },
});

export const VIBE_REALIZATION_RULES = Object.freeze(Object.fromEntries(BASED_VIBES.map((vibe) => [vibe.vibeId, Object.freeze({
  primaryCue: vibe.primaryCue,
  secondaryCue: vibe.secondaryCue,
  primaryCueSignal: CUE_REALIZATION_SIGNALS[vibe.primaryCue],
  secondaryCueSignal: CUE_REALIZATION_SIGNALS[vibe.secondaryCue],
  primary: VIBE_REALIZATION_RECIPES[vibe.vibeId].primary,
  modifier: VIBE_REALIZATION_RECIPES[vibe.vibeId].modifier,
})])));

const protectedSlots = [
  "actor", "target", "recipient", "action", "object", "quantity", "price", "deadline", "location", "ownership",
  "permission", "prohibition", "condition", "leverage", "consequence", "speechAct", "outcome", "offer", "return",
  "demand", "request", "information", "knowledge", "authorOnlyReveal", "stateDelta", "contextId", "actorId", "targetId", "actionId",
];
const semanticSlots = ["OFFER", "RETURN", "DEMAND", "CONSEQUENCE", "REQUEST"];
const allowedSlotNames = new Set([...protectedSlots, ...semanticSlots]);
const contextOnlySlots = new Set(["actor", "target", "action", "contextId", "actorId", "targetId", "actionId", "speechAct", "outcome"]);
const renderedMacroSlots = new Set([...semanticSlots, ...semanticSlots.map((slot) => slot.toLowerCase())]);
const unsupportedSemanticSlots = new Set(["recipient", "object", "quantity", "price", "deadline", "location", "ownership", "permission", "prohibition", "condition", "information", "knowledge", "authorOnlyReveal", "stateDelta"]);

/**
 * Every accepted slot has a declared disposition. Context-only fields are
 * carried as reviewed metadata; macro slots are realized and evidenced;
 * unsupported semantic-bearing fields fail before any renderer is called.
 */
export const SEMANTIC_SLOT_DISPOSITIONS = Object.freeze(Object.fromEntries([
  ...[...contextOnlySlots].map((slot) => [slot, "CONTEXT_ONLY"]),
  ...[...renderedMacroSlots].map((slot) => [slot, "REALIZED_MACRO_SLOT"]),
  ["leverage", "REALIZED_OPTIONAL_SLOT"],
  ...[...unsupportedSemanticSlots].map((slot) => [slot, "UNSUPPORTED"]),
]));
const canonicalEnvelopeFields = [
  "schemaVersion", "adapterVersion", "semanticRequestId", "actionId", "actorId", "targetId", "contextId",
  "actor", "target", "action", "speechAct", "outcome", "slots", "mandatorySemanticFacts", "forbiddenSemanticAdditions", "provenance",
  "semanticBinding",
];
const canonicalEnvelopeFieldSet = new Set(canonicalEnvelopeFields);
const identityFields = ["actor", "target", "action", "contextId", "actorId", "targetId", "actionId"];
const requiredCanonicalFields = canonicalEnvelopeFields;
const ACTION_MACRO_ACT_BY_ID = Object.freeze(Object.fromEntries(ACTION_DEFINITIONS.map(({ actionId, macroAct }) => [actionId, macroAct])));

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value ?? {}, key);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9_.:%-]*$/;
const AUTHORED_SEMANTIC_CONTRACT_RECORDS = new WeakMap();
const freezeDeep = (value) => {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeDeep(child);
  return Object.freeze(value);
};

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
    for (const field of Object.keys(reference)) {
      if (!["sourceId", "sourceRecordId", "transformVersion", "licenseId"].includes(field)) {
        reasons.push(rejection("REJECT_UNAUTHORIZED_PROVENANCE_FIELD", `provenance[${index}].${field} is not permitted.`, { index, field }));
      }
    }
    for (const field of ["sourceId", "sourceRecordId", "transformVersion", "licenseId"]) {
      const reason = nonEmptyString(reference[field], "REJECT_PROVENANCE_FIELD_INVALID", `provenance[${index}].${field}`);
      if (reason) reasons.push(reason);
    }
  }
  return reasons;
}

function semanticProjectionFromPayload(boundPayload, speechAct) {
  if (speechAct === "ASK") {
    const request = {};
    for (const field of ["action", "object", "permission", "information", "condition", "leverage", "request"]) {
      if (hasOwn(boundPayload, field)) request[field] = structuredClone(boundPayload[field]);
    }
    return Object.keys(request).length ? { REQUEST: request } : null;
  }
  if (speechAct === "DEAL") {
    const offer = boundPayload.offer ?? boundPayload.OFFER;
    const returned = boundPayload.return ?? boundPayload.RETURN;
    return isObject(offer) && isObject(returned)
      ? { OFFER: structuredClone(offer), RETURN: structuredClone(returned) }
      : null;
  }
  const demand = boundPayload.demand ?? boundPayload.DEMAND;
  const consequence = boundPayload.consequence ?? boundPayload.CONSEQUENCE;
  return isObject(demand) && isObject(consequence) && isObject(boundPayload.leverage)
    ? { DEMAND: structuredClone(demand), CONSEQUENCE: structuredClone(consequence), leverage: structuredClone(boundPayload.leverage) }
    : null;
}

function canonicalActionSemanticProjection(payload) {
  if (payload.speechAct === "PRESSURE") return null;
  const action = ACTION_DEFINITIONS.find((entry) => entry.actionId === payload.actionId && entry.macroAct === payload.speechAct);
  if (!action) return null;
  try {
    return semanticProjectionFromPayload(action.payload(payload.actorId, payload.targetId), payload.speechAct);
  } catch {
    return null;
  }
}

function validateSemanticBinding(payload, reasons, { allowUnboundAuthored = false } = {}) {
  const binding = payload.semanticBinding;
  if (!isObject(binding)) {
    reasons.push(rejection("REJECT_SEMANTIC_BINDING_MISSING", "semanticBinding must identify the trusted mechanics resolution."));
    return;
  }
  for (const field of ["bindingVersion", "source", "sourceRecordId", "actionId", "actorId", "targetId", "contextId", "payload", "semanticSlots"]) {
    if (!hasOwn(binding, field)) reasons.push(rejection("REJECT_SEMANTIC_BINDING_FIELD_MISSING", `semanticBinding.${field} is required.`, { field }));
  }
  if (binding.bindingVersion !== SEMANTIC_BINDING_VERSION) reasons.push(rejection("REJECT_SEMANTIC_BINDING_VERSION_INVALID", "semanticBinding.bindingVersion is not the registered mechanics binding version."));
  if (!SEMANTIC_BINDING_SOURCES.includes(binding.source)) reasons.push(rejection("REJECT_SEMANTIC_BINDING_SOURCE_INVALID", "semanticBinding.source must identify a registered mechanics resolution or an authored semantic contract."));
  for (const field of ["sourceRecordId", "actionId", "actorId", "targetId", "contextId"]) {
    if (typeof binding[field] !== "string" || !binding[field].trim()) reasons.push(rejection("REJECT_SEMANTIC_BINDING_FIELD_INVALID", `semanticBinding.${field} must be a non-empty string.`, { field }));
  }
  if (binding.actionId !== payload.actionId || binding.actorId !== payload.actorId || binding.targetId !== payload.targetId || binding.contextId !== payload.contextId) {
    reasons.push(rejection("REJECT_SEMANTIC_BINDING_IDENTITY_DRIFT", "semanticBinding identity must match the canonical semantic envelope."));
  }
  if (binding.source === "AUTHORED_SEMANTIC_CONTRACT" && typeof binding.sourceRecordId === "string" && payload.provenance?.[0]?.sourceRecordId !== binding.sourceRecordId) {
    reasons.push(rejection("REJECT_SEMANTIC_BINDING_PROVENANCE_DRIFT", "semanticBinding.sourceRecordId must match the primary semantic provenance record."));
  }
  if (!isObject(binding.payload)) reasons.push(rejection("REJECT_SEMANTIC_BINDING_PAYLOAD_INVALID", "semanticBinding.payload must be the structured mechanics payload."));
  if (!isObject(binding.semanticSlots)) reasons.push(rejection("REJECT_SEMANTIC_BINDING_SLOTS_INVALID", "semanticBinding.semanticSlots must be the canonical semantic projection."));
  if (!isObject(binding.payload) || !isObject(binding.semanticSlots)) return;
  if (binding.source === "MECHANICS_RESOLUTION") {
    const record = typeof binding.resolutionRecordId === "string" ? getRecordedResolutionPayload(binding.resolutionRecordId) : null;
    if (typeof binding.resolutionRecordId !== "string" || !binding.resolutionRecordId.trim()) reasons.push(rejection("REJECT_SEMANTIC_BINDING_RECORD_ID_MISSING", "MECHANICS_RESOLUTION bindings must carry the mechanics-issued authority-record identity."));
    if (!record) reasons.push(rejection("REJECT_SEMANTIC_BINDING_RECORD_UNAVAILABLE", "The mechanics resolution record is not available for semantic binding verification."));
    else {
      if (record.resolutionRecordId !== binding.resolutionRecordId || record.historyId !== binding.sourceRecordId || payload.provenance?.[0]?.sourceRecordId !== record.historyId) reasons.push(rejection("REJECT_SEMANTIC_BINDING_RECORD_HISTORY_DRIFT", "The mechanics authority record does not match the emitted history provenance."));
      if (record.actionId !== payload.actionId || record.actorId !== payload.actorId || record.targetId !== payload.targetId || record.contextId !== payload.contextId) reasons.push(rejection("REJECT_SEMANTIC_BINDING_RECORD_IDENTITY_DRIFT", "The mechanics resolution record identity does not match the semantic envelope."));
      if (!valuesEqual(binding.payload, record.payload)) reasons.push(rejection("REJECT_SEMANTIC_BINDING_RECORD_PAYLOAD_DRIFT", "The semantic binding payload does not match the mechanics resolution record."));
      const recordedProjection = semanticProjectionFromPayload(record.payload, payload.speechAct);
      if (!recordedProjection || !valuesEqual(binding.semanticSlots, recordedProjection)) reasons.push(rejection("REJECT_SEMANTIC_BINDING_RECORD_SLOTS_DRIFT", "The semantic binding slots do not match the mechanics resolution record."));
    }
  } else if (payload.speechAct === "PRESSURE" && binding.source === "AUTHORED_SEMANTIC_CONTRACT") {
    const authorizedPayload = AUTHORED_SEMANTIC_CONTRACT_RECORDS.get(payload);
    if (!authorizedPayload) {
      if (!allowUnboundAuthored) reasons.push(rejection("REJECT_SEMANTIC_BINDING_AUTHORITY_UNAVAILABLE", "AUTHORED_SEMANTIC_CONTRACT content must be issued through the trusted authoring boundary."));
    } else if (!valuesEqual(payload, authorizedPayload)) {
      reasons.push(rejection("REJECT_SEMANTIC_BINDING_AUTHORITY_DRIFT", "The authored semantic contract changed after trusted authoring."));
    }
  }
  if (binding.payload.action !== payload.actionId || binding.payload.actor !== payload.actorId || binding.payload.target !== payload.targetId) {
    reasons.push(rejection("REJECT_SEMANTIC_BINDING_PAYLOAD_IDENTITY_DRIFT", "semanticBinding.payload does not agree with the canonical action identity."));
  }
  const expectedSlots = SEMANTIC_SLOTS_BY_ACT[payload.speechAct] ?? [];
  const allowedProjection = new Set([...expectedSlots, "leverage"]);
  for (const key of Object.keys(binding.semanticSlots)) if (!allowedProjection.has(key)) reasons.push(rejection("REJECT_SEMANTIC_BINDING_SLOT_UNSUPPORTED", `semanticBinding.semanticSlots.${key} is not authorized for ${payload.speechAct}.`, { key }));
  for (const upperSlot of expectedSlots) {
    if (!hasOwn(binding.semanticSlots, upperSlot)) reasons.push(rejection("REJECT_SEMANTIC_BINDING_SLOT_MISSING", `semanticBinding.semanticSlots.${upperSlot} is required.`, { slot: upperSlot }));
    const lowerSlot = upperSlot.toLowerCase();
    for (const slot of [upperSlot, lowerSlot]) if (hasOwn(payload.slots ?? {}, slot) && (!hasOwn(binding.semanticSlots, upperSlot) || !valuesEqual(payload.slots[slot], binding.semanticSlots[upperSlot]))) {
      reasons.push(rejection("REJECT_SEMANTIC_BINDING_SLOT_DRIFT", `slots.${slot} does not match the trusted semantic projection.`, { slot }));
    }
  }
  const expectedActionProjection = canonicalActionSemanticProjection(payload);
  if (expectedActionProjection && !valuesEqual(binding.semanticSlots, expectedActionProjection)) {
    reasons.push(rejection("REJECT_ACTION_SEMANTIC_VALUE_UNAUTHORIZED", "The semantic slot values do not match the canonical authored action payload."));
  }
  if (payload.speechAct === "PRESSURE") {
    if (!hasOwn(binding.semanticSlots, "leverage")) reasons.push(rejection("REJECT_SEMANTIC_BINDING_SLOT_MISSING", "semanticBinding.semanticSlots.leverage is required for PRESSURE.", { slot: "leverage" }));
    if (hasOwn(payload.slots ?? {}, "leverage") && (!hasOwn(binding.semanticSlots, "leverage") || !valuesEqual(payload.slots.leverage, binding.semanticSlots.leverage))) reasons.push(rejection("REJECT_SEMANTIC_BINDING_SLOT_DRIFT", "slots.leverage does not match the trusted semantic projection.", { slot: "leverage" }));
  }
}

function validateCanonicalEnvelope(payload, reasons, options = {}) {
  for (const field of requiredCanonicalFields) {
    if (!hasOwn(payload, field)) reasons.push(rejection("REJECT_ENVELOPE_FIELD_MISSING", `Canonical semantic field ${field} is required.`, { field }));
  }
  for (const field of Object.keys(payload)) {
    if (!canonicalEnvelopeFieldSet.has(field)) reasons.push(rejection("REJECT_UNAUTHORIZED_SEMANTIC_FIELD", `Top-level semantic field ${field} is not in the canonical envelope.`, { field }));
  }
  if (payload.schemaVersion !== SEMANTIC_SCHEMA_VERSION) reasons.push(rejection("REJECT_SCHEMA_VERSION_INVALID", "schemaVersion does not identify the canonical semantic contract."));
  if (payload.adapterVersion !== SEMANTIC_ADAPTER_VERSION) reasons.push(rejection("REJECT_ADAPTER_VERSION_INVALID", "adapterVersion does not identify the registered mechanics adapter."));
  for (const field of ["semanticRequestId", "actionId", "actorId", "targetId", "contextId", "actor", "target", "action"]) {
    const reason = nonEmptyString(payload[field], "REJECT_ENVELOPE_FIELD_INVALID", field);
    if (reason) reasons.push(reason);
  }
  for (const field of ["semanticRequestId", "actorId", "targetId", "contextId"]) {
    if (typeof payload[field] === "string" && !identifierPattern.test(payload[field])) reasons.push(rejection("REJECT_IDENTIFIER_INVALID", `${field} must use the canonical identifier format.`, { field }));
  }
  if (typeof payload.actionId === "string" && !/^[A-Z][A-Z0-9_]+$/.test(payload.actionId)) reasons.push(rejection("REJECT_ACTION_ID_INVALID", "actionId must be a stable uppercase action identifier."));
  if (typeof payload.actionId === "string" && !ACTION_PRESENTATION_LABELS[payload.actionId]) reasons.push(rejection("REJECT_ACTION_LABEL_UNAVAILABLE", "actionId does not have a reviewed authored action label.", { actionId: payload.actionId }));
  if (ACTION_MACRO_ACT_BY_ID[payload.actionId] && payload.speechAct !== ACTION_MACRO_ACT_BY_ID[payload.actionId]) reasons.push(rejection("REJECT_ACTION_MACRO_ACT_MISMATCH", "The action is not registered for the declared macro speech act.", { actionId: payload.actionId, speechAct: payload.speechAct, registeredSpeechAct: ACTION_MACRO_ACT_BY_ID[payload.actionId] }));
  if (payload.actor !== payload.actorId) reasons.push(rejection("REJECT_ACTOR_ID_MISMATCH", "actor must equal actorId."));
  if (payload.target !== payload.targetId) reasons.push(rejection("REJECT_TARGET_ID_MISMATCH", "target must equal targetId."));
  if (payload.action !== payload.actionId) reasons.push(rejection("REJECT_ACTION_ID_MISMATCH", "action must equal actionId."));
  if (!SPEECH_ACTS.includes(payload.speechAct)) reasons.push(rejection("REJECT_SPEECH_ACT_INVALID", `Unsupported macro speech act: ${payload.speechAct}.`));
  if (payload.outcome !== SEMANTIC_OUTCOME) reasons.push(rejection("REJECT_OUTCOME_INVALID", "Only PROPOSED semantic requests may cross the TPL boundary."));
  for (const field of ["mandatorySemanticFacts", "forbiddenSemanticAdditions"]) {
    if (!Array.isArray(payload[field]) || !payload[field].length) reasons.push(rejection("REJECT_POLICY_ARRAY_INVALID", `${field} must be a non-empty array.`, { field }));
    else {
      const seen = new Set();
      for (const [index, value] of payload[field].entries()) {
        const reason = nonEmptyString(value, "REJECT_POLICY_ARRAY_ENTRY_INVALID", `${field}[${index}]`);
        if (reason) reasons.push(reason);
        else if (seen.has(value)) reasons.push(rejection("REJECT_POLICY_ARRAY_DUPLICATE", `${field} must not contain duplicate values.`, { field, value }));
        else seen.add(value);
      }
    }
  }
  reasons.push(...validateCanonicalProvenance(payload.provenance));
  validateSemanticBinding(payload, reasons, options);
}

function validateSlotPairs(payload, reasons, strictCanonical) {
  const slots = payload.slots;
  for (const field of ["actor", "target", "action", "contextId"]) {
    if (!hasOwn(slots, field)) reasons.push(rejection("REJECT_SLOT_FIELD_MISSING", `Canonical slots.${field} is required.`, { field }));
  }
  const stringSlots = ["actor", "target", "recipient", "object", "deadline", "location", "permission", "prohibition"];
  for (const field of stringSlots) {
    if (hasOwn(slots, field)) {
      const reason = nonEmptyString(slots[field], "REJECT_SLOT_TYPE_INVALID", `slots.${field}`);
      if (reason) reasons.push(reason);
    }
  }
  if (hasOwn(slots, "quantity") && (typeof slots.quantity !== "number" || !Number.isFinite(slots.quantity) || slots.quantity <= 0)) reasons.push(rejection("REJECT_QUANTITY_INVALID", "slots.quantity must be a finite positive number.", { path: "slots.quantity" }));
  for (const field of ["contextId", "actorId", "targetId"]) {
    if (hasOwn(slots, field) && (typeof slots[field] !== "string" || !identifierPattern.test(slots[field]))) reasons.push(rejection("REJECT_IDENTIFIER_INVALID", `slots.${field} must use the canonical identifier format.`, { field }));
  }
  for (const field of ["action", "actionId"]) {
    if (hasOwn(slots, field) && (typeof slots[field] !== "string" || !/^[A-Z][A-Z0-9_]+$/.test(slots[field]))) reasons.push(rejection("REJECT_ACTION_ID_INVALID", `slots.${field} must be a stable uppercase action identifier.`, { field }));
  }
  if (hasOwn(slots, "speechAct") && !SPEECH_ACTS.includes(slots.speechAct)) reasons.push(rejection("REJECT_SPEECH_ACT_INVALID", `slots.speechAct is not a supported macro speech act.`, { field: "speechAct" }));
  if (hasOwn(slots, "outcome") && slots.outcome !== SEMANTIC_OUTCOME) reasons.push(rejection("REJECT_OUTCOME_INVALID", "slots.outcome must be PROPOSED.", { field: "outcome" }));
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
      const requiresObject = upperSlot === "OFFER" || upperSlot === "RETURN";
      const validShape = requiresObject ? isObject(slots[slot]) : typeof slots[slot] === "string" || isObject(slots[slot]);
      if (validShape === false) reasons.push(rejection("REJECT_SLOT_TYPE_INVALID", `slots.${slot} has an invalid semantic slot shape.`, { slot }));
      const reason = meaningfulValue(slots[slot], `slots.${slot}`);
      if (reason) reasons.push(reason);
    }
    if (upperPresent) validateTypedSemanticSlot(payload, upperSlot, slots[upperSlot], reasons);
  }
  for (const [slot, value] of Object.entries(slots)) {
    if (!allowedSlotNames.has(slot)) reasons.push(rejection("REJECT_UNAUTHORIZED_SLOT", `Slot ${slot} is not in the semantic payload contract.`, { slot }));
    const disposition = SEMANTIC_SLOT_DISPOSITIONS[slot];
    if (!disposition && allowedSlotNames.has(slot)) reasons.push(rejection("REJECT_SLOT_DISPOSITION_MISSING", `Slot ${slot} has no reviewed semantic disposition.`, { slot }));
    if (disposition === "UNSUPPORTED") reasons.push(rejection("REJECT_SEMANTIC_SLOT_UNSUPPORTED", `Semantic slot ${slot} is unsupported by the current reviewed protocol.`, { slot }));
    if (disposition === "REALIZED_OPTIONAL_SLOT" && payload.speechAct !== "PRESSURE") reasons.push(rejection("REJECT_CROSS_ACT_SEMANTIC_SLOT", `Semantic slot ${slot} is only authorized for PRESSURE.`, { slot, speechAct: payload.speechAct }));
    if (semanticSlots.includes(slot)) continue;
    const reason = meaningfulValue(value, `slots.${slot}`);
    if (reason) reasons.push(reason);
  }
  for (const field of identityFields) {
    if (hasOwn(slots, field) && hasOwn(payload, field) && !valuesEqual(slots[field], payload[field])) reasons.push(rejection("REJECT_SLOT_IDENTITY_MISMATCH", `slots.${field} does not agree with the top-level identity.`, { field }));
  }
}

function validateTypedSemanticSlot(payload, slotName, value, reasons) {
  if (typeof value === "string") {
    reasons.push(rejection("REJECT_UNTRUSTED_FREEFORM_SLOT", `slots.${slotName} must be a structured, trusted semantic value.`, { slot: slotName }));
    return;
  }
  if (!isObject(value)) return;
  const allowed = slotName === "REQUEST"
    ? ["action", "object", "permission", "information", "condition", "leverage", "request"]
    : slotName === "OFFER" || slotName === "RETURN"
      ? ["object", "quantity", "unit", "status", "change", "information"]
      : slotName === "DEMAND"
        ? ["kind", "demandId", "subject", "object", "term", "amount", "unit", "due", "sourceAssertionId", "scope", "contextId", "validFrom", "validUntil", "pressureContractId", "authoredDemand"]
        : ["consequenceId", "text", "fearedBy", "fearedConsequenceSourceAssertionId", "leverageBasis", "demandId", "scope", "contextId", "validFrom", "validUntil", "validity", "pressureContractId"];
  for (const key of Object.keys(value)) if (!allowed.includes(key)) reasons.push(rejection("REJECT_TYPED_SLOT_FIELD_UNSUPPORTED", `slots.${slotName}.${key} is not supported by the typed semantic contract.`, { slot: slotName, key }));
  if (slotName === "REQUEST") {
    const authorizedFields = authoredRequestFieldsForAction(payload.actionId);
    for (const key of Object.keys(value)) if (!authorizedFields.has(key)) reasons.push(rejection("REJECT_ACTION_SEMANTIC_FIELD_UNAUTHORIZED", `slots.${slotName}.${key} is not authorized by the authored action contract.`, { slot: slotName, key, actionId: payload.actionId }));
    if (value.action !== undefined) {
      if (!ACTION_PRESENTATION_LABELS[value.action]) reasons.push(rejection("REJECT_ACTION_LABEL_UNAVAILABLE", `slots.${slotName}.action has no reviewed action label.`, { actionId: value.action }));
      if (value.action !== payload.actionId) reasons.push(rejection("REJECT_REQUEST_ACTION_MISMATCH", `slots.${slotName}.action must match the canonical envelope action.`, { expected: payload.actionId, actual: value.action }));
    }
    for (const key of ["object", "permission", "information", "request"]) if (typeof value[key] === "string" && !identifierPattern.test(value[key])) reasons.push(rejection("REJECT_UNTRUSTED_FREEFORM_SLOT", `slots.${slotName}.${key} must be a canonical identifier.`, { slot: slotName, key }));
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

function validateSemanticPayloadInternal(payload, options = {}) {
  const reasons = [];
  if (!isObject(payload)) return { passed: false, reasons: [rejection("REJECT_PAYLOAD_NOT_OBJECT", "The semantic request must be an object.")] };
  validateCanonicalEnvelope(payload, reasons, options);
  if (!isObject(payload.slots)) {
    reasons.push(rejection("REJECT_SLOTS_NOT_OBJECT", "The semantic request slots must be an object."));
    return { passed: reasons.length === 0, reasons };
  }
  validateSlotPairs(payload, reasons, true);
  return { passed: reasons.length === 0, reasons };
}

export function validateSemanticPayload(payload) {
  return validateSemanticPayloadInternal(payload);
}

export function authorizeAuthoredSemanticContract(payload) {
  const candidate = structuredClone(payload);
  if (!isObject(candidate) || candidate.speechAct !== "PRESSURE" || candidate.semanticBinding?.source !== "AUTHORED_SEMANTIC_CONTRACT") renderFailure("TPL_PRESSURE_CONTRACT_UNAUTHORIZED", "Only a complete PRESSURE request with an explicit authored-contract binding may cross the trusted authoring boundary.");
  const validation = validateSemanticPayloadInternal(candidate, { allowUnboundAuthored: true });
  if (!validation.passed) failForPayloadValidation(validation);
  AUTHORED_SEMANTIC_CONTRACT_RECORDS.set(candidate, freezeDeep(structuredClone(candidate)));
  return candidate;
}

export function validateSemanticInvariance(payloadBefore, payloadAfter, evidence = {}) {
  const reasons = [];
  if (!isObject(payloadBefore) || !isObject(payloadAfter)) return { passed: false, reasons: [rejection("REJECT_PAYLOAD_NOT_OBJECT", "Both semantic payloads must be objects.")] };
  if (payloadBefore.semanticRequestId !== payloadAfter.semanticRequestId) reasons.push(rejection("REJECT_REQUEST_ID_CHANGED", "The semantic request identity changed."));
  if (payloadBefore.speechAct !== payloadAfter.speechAct) reasons.push(rejection("REJECT_SPEECH_ACT_DRIFT", "The macro speech act changed."));
  reasons.push(...validateSemanticPayload(payloadBefore).reasons, ...validateSemanticPayload(payloadAfter).reasons);
  const topLevelNames = new Set([...canonicalEnvelopeFields, ...Object.keys(payloadBefore), ...Object.keys(payloadAfter)]);
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

const REVIEWED_LABELS = Object.freeze({
  cash_80_usd: "cash",
  debt_250_usd: "the 250 USD debt",
  debt_relief: "debt relief",
  archive_door: "the archive door",
  archive_room: "the records archive",
  repayment_deadline: "the repayment deadline",
  scoped_secret: "the scoped information",
  confidentiality_or_action: "the agreed confidentiality or action",
  extension: "an extension",
  partial_satisfaction: "partial satisfaction",
  cash: "cash",
  debt: "the debt",
  report_the_debt: "the authored debt report",
  review_authored_ledger: "a review of the authored ledger",
  show_knowledge_evidence: "evidence for the knowledge claim",
  provide_dependency_support: "the depended-on support",
});

export function deriveActionPresentationLabels(actionDefinitions = ACTION_DEFINITIONS) {
  const labels = {};
  for (const entry of actionDefinitions) {
    if (!entry || typeof entry.actionId !== "string" || !entry.actionId.trim()) throw new Error("ACTION_PRESENTATION_ACTION_ID_INVALID");
    if (Object.hasOwn(labels, entry.actionId)) throw new Error(`ACTION_PRESENTATION_ACTION_DUPLICATE:${entry.actionId}`);
    const label = entry.tplPresentation?.label ?? entry.displayName;
    if (typeof label !== "string" || !label.trim()) throw new Error(`ACTION_PRESENTATION_LABEL_MISSING:${entry.actionId}`);
    labels[entry.actionId] = label;
  }
  return Object.freeze(labels);
}

export const ACTION_PRESENTATION_LABELS = deriveActionPresentationLabels();

const RUNTIME_LABEL_PATTERN = /\b[A-Za-z][A-Za-z0-9]*(?:(?:_[A-Za-z0-9]+)+|:[A-Za-z0-9][A-Za-z0-9_-]*)\b/;
const ASK_PRESSURE_INDICATOR_PATTERN = /\b(?:or else|otherwise|if you refuse|if you do not|if you don't|punish|expose|threat|no choice|cannot refuse|can't refuse|must|have to|unless)\b/i;
const ALLOWED_EXECUTION_MODES = new Set(["AUTHORING_PREVIEW"]);
const PRESSURE_DEMAND_KINDS = new Set(["FULFILL_OBLIGATION", "HONOR_PROMISE"]);
const DEFAULT_EVALUATION_TIME = "2026-09-02T12:00:00.000Z";

function renderFailure(code, message, details = {}) {
  const renderedMessage = `${code}:${message}`;
  throw Object.assign(new Error(renderedMessage), { ...details, code, message: renderedMessage });
}

function failForPayloadValidation(validation) {
  const actionFailure = validation.reasons.find((reason) => reason.code === "REJECT_ACTION_LABEL_UNAVAILABLE");
  if (actionFailure) renderFailure("TPL_ACTION_LABEL_UNAVAILABLE", actionFailure.message, actionFailure);
  const pressureActionFailure = validation.reasons.find((reason) => reason.code === "REJECT_ACTION_MACRO_ACT_MISMATCH" && reason.speechAct === "PRESSURE");
  if (pressureActionFailure) renderFailure("TPL_PRESSURE_ACTION_UNAUTHORIZED", pressureActionFailure.message, pressureActionFailure);
  const pressureAuthorityFailure = validation.reasons.find((reason) => ["REJECT_SEMANTIC_BINDING_AUTHORITY_UNAVAILABLE", "REJECT_SEMANTIC_BINDING_AUTHORITY_DRIFT"].includes(reason.code));
  if (pressureAuthorityFailure) renderFailure("TPL_PRESSURE_CONTRACT_UNAUTHORIZED", pressureAuthorityFailure.message, pressureAuthorityFailure);
  renderFailure("SEMANTIC_PAYLOAD_INVALID", validation.reasons.map((reason) => reason.code).join(","), { reasons: validation.reasons });
}

function requireNonEmptyText(value, path) {
  if (typeof value !== "string" || !value.trim()) renderFailure("TPL_SLOT_REALIZATION_INVALID", `${path} must be a non-empty string.`, { path });
  return value.trim();
}

function canonicalIdentifier(value, path) {
  const identifier = requireNonEmptyText(value, path);
  if (!identifierPattern.test(identifier)) renderFailure("TPL_SLOT_IDENTIFIER_INVALID", `${path} must be a canonical identifier, not free-form prose.`, { path });
  return identifier;
}

function lexicalizeText(value, path) {
  const text = requireNonEmptyText(value, path);
  const result = text.replace(RUNTIME_LABEL_PATTERN, (identifier) => REVIEWED_LABELS[identifier] ?? identifier);
  const unknownIdentifier = result.match(RUNTIME_LABEL_PATTERN);
  if (unknownIdentifier) renderFailure("TPL_SLOT_LABEL_UNAVAILABLE", `${path} contains an internal identifier without a reviewed label.`, { path, identifier: unknownIdentifier[0] });
  return result;
}

function reviewedActionLabel(value, path) {
  const actionId = requireNonEmptyText(value, path);
  if (!ACTION_PRESENTATION_LABELS[actionId]) renderFailure("TPL_ACTION_LABEL_UNAVAILABLE", `${path} has no reviewed action label.`, { path, actionId });
  return ACTION_PRESENTATION_LABELS[actionId];
}

function assertAllowedKeys(value, allowed, path) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) renderFailure("TPL_SLOT_FIELD_UNSUPPORTED", `${path}.${key} is not supported by the typed realization contract.`, { path, key });
}

function assertRequiredFields(value, fields, path, code = "TPL_PRESSURE_CONTRACT_INCOMPLETE") {
  const missing = fields.filter((field) => value[field] === undefined || value[field] === null || (typeof value[field] === "string" && !value[field].trim()));
  if (missing.length) renderFailure(code, `${path} is missing required authored fields: ${missing.join(", ")}.`, { path, missing });
}

function assertAskSafeText(value, path) {
  const text = lexicalizeText(value, path);
  if (ASK_PRESSURE_INDICATOR_PATTERN.test(text)) renderFailure("TPL_ASK_PRESSURE_CONTENT", `${path} contains pressure, coercion, or refusal-removing language.`, { path });
  return text;
}

function authoredRequestFieldsForAction(actionId) {
  const action = ACTION_DEFINITIONS.find((entry) => entry.actionId === actionId);
  if (!action || action.macroAct !== "ASK") return new Set(["action"]);
  let authoredPayload;
  try { authoredPayload = action.payload("actor", "target", "PRIVATE_CONTEXT"); } catch { authoredPayload = {}; }
  return new Set(["action", ...Object.keys(authoredPayload).filter((field) => ["object", "permission", "information", "condition", "leverage", "request"].includes(field))]);
}

function assertAuthorizedRequestFields(value, payload, path) {
  const authorized = authoredRequestFieldsForAction(payload.actionId);
  for (const key of Object.keys(value)) if (!authorized.has(key)) renderFailure("TPL_ACTION_SEMANTIC_FIELD_UNAUTHORIZED", `${path}.${key} is not authorized by the authored action contract.`, { path, key, actionId: payload.actionId });
}

function formatRequest(value, path = "slots.REQUEST", payload = null) {
  if (typeof value === "string") return assertAskSafeText(value, path);
  if (!isObject(value)) renderFailure("TPL_REQUEST_REALIZATION_INVALID", `${path} must be a string or typed request frame.`, { path });
  assertAllowedKeys(value, ["action", "object", "permission", "information", "condition", "leverage", "request"], path);
  if (payload) assertAuthorizedRequestFields(value, payload, path);
  const parts = [];
  if (value.action !== undefined) {
    const action = reviewedActionLabel(value.action, `${path}.action`);
    if (payload && value.action !== payload.actionId) renderFailure("TPL_REQUEST_ACTION_MISMATCH", `${path}.action must match the canonical envelope action.`, { path, expected: payload.actionId, actual: value.action });
    parts.push(`request ${action}`);
  }
  else parts.push("make the stated request");
  if (value.request !== undefined) parts.push(`to ${lexicalizeText(canonicalIdentifier(value.request, `${path}.request`), `${path}.request`)}`);
  if (value.object !== undefined) parts.push(`concerning ${lexicalizeText(canonicalIdentifier(value.object, `${path}.object`), `${path}.object`)}`);
  if (value.information !== undefined) parts.push(`about ${lexicalizeText(canonicalIdentifier(value.information, `${path}.information`), `${path}.information`)}`);
  if (value.permission !== undefined) parts.push(`with ${lexicalizeText(canonicalIdentifier(value.permission, `${path}.permission`), `${path}.permission`)} permission`);
  if (value.condition !== undefined) parts.push(`under ${assertAskSafeText(value.condition, `${path}.condition`)}`);
  if (value.leverage !== undefined) parts.push("on the stated basis");
  return parts.join(" ");
}

function formatExchange(value, path) {
  if (typeof value === "string") return lexicalizeText(value, path);
  if (!isObject(value)) renderFailure("TPL_EXCHANGE_REALIZATION_INVALID", `${path} must be a typed exchange slot.`, { path });
  assertAllowedKeys(value, ["object", "quantity", "unit", "status", "change", "information"], path);
  if (value.information !== undefined) {
    const label = lexicalizeText(canonicalIdentifier(value.information, `${path}.information`), `${path}.information`);
    return /^the /i.test(label) ? label : `the ${label}`;
  }
  if (value.change !== undefined) {
    if (value.change === "extension") return "an extension to the repayment deadline";
    return `the stated ${lexicalizeText(canonicalIdentifier(value.change, `${path}.change`), `${path}.change`)}`;
  }
  if (value.object === undefined) renderFailure("TPL_EXCHANGE_OBJECT_MISSING", `${path}.object or ${path}.information is required.`, { path });
  const objectLabel = lexicalizeText(canonicalIdentifier(value.object, `${path}.object`), `${path}.object`);
  let text = objectLabel;
  if (value.quantity !== undefined) {
    if (typeof value.quantity !== "number" || !Number.isFinite(value.quantity) || value.quantity <= 0) renderFailure("TPL_EXCHANGE_QUANTITY_INVALID", `${path}.quantity must be a positive finite number.`, { path });
    const unit = value.unit === undefined ? "units" : lexicalizeText(canonicalIdentifier(value.unit, `${path}.unit`), `${path}.unit`);
    text = `${value.quantity} ${unit} of ${objectLabel.replace(/^the /, "")}`;
  }
  if (value.status !== undefined) text = `${lexicalizeText(canonicalIdentifier(value.status, `${path}.status`), `${path}.status`)} of ${text}`;
  return text;
}

function assertPressureTemporalValidity(value, path, evaluationTime = DEFAULT_EVALUATION_TIME) {
  const evaluationTimestamp = Date.parse(evaluationTime);
  if (!Number.isFinite(evaluationTimestamp)) renderFailure("TPL_PRESSURE_TIME_INVALID", "The evaluation time must be a valid timestamp.", { evaluationTime });
  for (const field of ["validFrom", "validUntil"]) {
    if (value[field] === undefined) continue;
    const timestamp = Date.parse(value[field]);
    if (!Number.isFinite(timestamp)) renderFailure("TPL_PRESSURE_TIME_INVALID", `${path}.${field} must be a valid timestamp.`, { path: `${path}.${field}` });
    if (field === "validFrom" && timestamp > evaluationTimestamp) renderFailure("TPL_PRESSURE_NOT_ACTIVE", `${path} is not active yet.`, { path, evaluationTime });
    if (field === "validUntil" && timestamp <= evaluationTimestamp) renderFailure("TPL_PRESSURE_EXPIRED", `${path} is no longer time-valid.`, { path, evaluationTime });
  }
}

function formatDemand(value, path, payload, requireAuthoredPressure = false, evaluationTime = DEFAULT_EVALUATION_TIME) {
  if (typeof value === "string") {
    if (requireAuthoredPressure) renderFailure("TPL_PRESSURE_CONTRACT_REQUIRED", `${path} must carry a complete authored pressure contract.`, { path });
    return lexicalizeText(value, path);
  }
  if (!isObject(value)) renderFailure("TPL_PRESSURE_DEMAND_INVALID", `${path} must be an authored demand object.`, { path });
  assertAllowedKeys(value, ["kind", "demandId", "subject", "object", "term", "amount", "unit", "due", "sourceAssertionId", "scope", "contextId", "validFrom", "validUntil", "pressureContractId", "authoredDemand"], path);
  if (requireAuthoredPressure) assertRequiredFields(value, ["kind", "demandId", "subject", "object", "term", "amount", "unit", "due", "sourceAssertionId", "scope", "contextId", "validFrom", "pressureContractId", "authoredDemand"], path);
  if (requireAuthoredPressure && !PRESSURE_DEMAND_KINDS.has(value.kind)) renderFailure("TPL_PRESSURE_DEMAND_KIND_INVALID", `${path}.kind is not a registered authored pressure demand kind.`, { path: `${path}.kind`, kind: value.kind });
  if (value.scope !== "ACTUAL") renderFailure("TPL_PRESSURE_SCOPE_INVALID", `${path}.scope must be ACTUAL.`, { path });
  if (value.contextId !== payload.contextId) renderFailure("TPL_PRESSURE_CONTEXT_INVALID", `${path}.contextId must match the semantic context.`, { path });
  if (!value.pressureContractId || !value.sourceAssertionId || !value.demandId) renderFailure("TPL_PRESSURE_PROVENANCE_INCOMPLETE", `${path} must identify its authored pressure contract, demand, and source assertion.`, { path });
  assertPressureTemporalValidity(value, path, evaluationTime);
  if (value.authoredDemand !== undefined) {
    const authoredText = lexicalizeText(value.authoredDemand, `${path}.authoredDemand`);
    if (value.amount === undefined || value.unit === undefined) return authoredText;
    const amountText = `${value.amount} ${lexicalizeText(value.unit, `${path}.unit`)}`;
    return authoredText.toLocaleLowerCase().includes(amountText.toLocaleLowerCase()) ? authoredText : `${authoredText} (${amountText})`;
  }
  if (value.term !== undefined) {
    return `fulfill ${lexicalizeText(value.term, `${path}.term`)}`;
  }
  renderFailure("TPL_PRESSURE_DEMAND_TEXT_MISSING", `${path}.authoredDemand or ${path}.term is required.`, { path });
}

function formatConsequence(value, path, payload, requireAuthoredPressure = false, evaluationTime = DEFAULT_EVALUATION_TIME) {
  if (typeof value === "string") {
    if (requireAuthoredPressure) renderFailure("TPL_PRESSURE_CONTRACT_REQUIRED", `${path} must carry a complete authored pressure contract.`, { path });
    return lexicalizeText(value, path);
  }
  if (!isObject(value)) renderFailure("TPL_PRESSURE_CONSEQUENCE_INVALID", `${path} must be an authored consequence object.`, { path });
  assertAllowedKeys(value, ["consequenceId", "text", "fearedBy", "fearedConsequenceSourceAssertionId", "leverageBasis", "demandId", "scope", "contextId", "validFrom", "validUntil", "validity", "pressureContractId"], path);
  if (requireAuthoredPressure) assertRequiredFields(value, ["consequenceId", "text", "fearedBy", "fearedConsequenceSourceAssertionId", "leverageBasis", "demandId", "scope", "contextId", "validFrom", "validity", "pressureContractId"], path);
  if (!value.consequenceId || !value.text || !value.pressureContractId || !value.demandId || !value.leverageBasis || !value.fearedConsequenceSourceAssertionId) renderFailure("TPL_PRESSURE_CONTRACT_INCOMPLETE", `${path} must retain consequence, demand, leverage, source, and contract identity.`, { path });
  if (value.scope !== "ACTUAL" || value.contextId !== payload.contextId) renderFailure("TPL_PRESSURE_CONTEXT_INVALID", `${path} is not actual and context-bound.`, { path });
  if (!isObject(value.validity) || value.validity.scope !== "ACTUAL" || value.validity.contextId !== payload.contextId) renderFailure("TPL_PRESSURE_VALIDITY_INVALID", `${path}.validity must be an actual, context-bound validity record.`, { path });
  assertAllowedKeys(value.validity, ["scope", "contextId", "validFrom", "validUntil", "validUntilIsUnbounded"], `${path}.validity`);
  if (typeof value.validity.validUntilIsUnbounded !== "boolean" || (value.validity.validUntilIsUnbounded && value.validity.validUntil !== undefined)) renderFailure("TPL_PRESSURE_VALIDITY_INVALID", `${path}.validity cannot be both bounded and unbounded.`, { path: `${path}.validity` });
  assertPressureTemporalValidity(value, path, evaluationTime);
  assertPressureTemporalValidity(value.validity, `${path}.validity`, evaluationTime);
  return lexicalizeText(value.text, `${path}.text`);
}

function formatLeverage(value, path, payload, requireAuthoredPressure = false, evaluationTime = DEFAULT_EVALUATION_TIME) {
  if (!isObject(value)) {
    if (requireAuthoredPressure) renderFailure("TPL_PRESSURE_LEVERAGE_INVALID", `${path} must be an authored leverage record.`, { path });
    return null;
  }
  assertAllowedKeys(value, ["actor", "target", "basis", "sourceAssertionId", "scope", "contextId", "validFrom", "validUntil", "pressureContractId"], path);
  if (requireAuthoredPressure) assertRequiredFields(value, ["actor", "target", "basis", "sourceAssertionId", "scope", "contextId", "validFrom", "pressureContractId"], path, "TPL_PRESSURE_LEVERAGE_INVALID");
  if (value.scope !== "ACTUAL" || value.contextId !== payload.contextId || !value.pressureContractId || !value.sourceAssertionId || !value.basis) renderFailure("TPL_PRESSURE_LEVERAGE_INVALID", `${path} must be actual, context-bound, and contract-linked.`, { path });
  assertPressureTemporalValidity(value, path, evaluationTime);
  return `leverage based on ${lexicalizeText(value.basis, `${path}.basis`)}`;
}

/** @type {ReadonlyArray<[string, (payload: any, leverage: any, demand: any, consequence: any) => boolean, string]>} */
const PRESSURE_CONTRACT_RULES = Object.freeze([
  ["leverage.actor", (payload, leverage) => leverage.actor === payload.actorId, "TPL_PRESSURE_ACTOR_MISMATCH"],
  ["leverage.target", (payload, leverage) => leverage.target === payload.targetId, "TPL_PRESSURE_TARGET_MISMATCH"],
  ["demand.subject", (payload, leverage, demand) => demand.subject === payload.targetId, "TPL_PRESSURE_DEMAND_SUBJECT_MISMATCH"],
  ["demand.object", (payload, leverage, demand) => demand.object === payload.actorId, "TPL_PRESSURE_DEMAND_OBJECT_MISMATCH"],
  ["demand.term", (payload, leverage, demand) => demand.term === leverage.basis, "TPL_PRESSURE_DEMAND_TERM_MISMATCH"],
  ["consequence.fearedBy", (payload, leverage, demand, consequence) => consequence.fearedBy === payload.targetId, "TPL_PRESSURE_FEAR_SUBJECT_MISMATCH"],
  ["consequence.leverageBasis", (payload, leverage, demand, consequence) => consequence.leverageBasis === leverage.basis, "TPL_PRESSURE_LEVERAGE_MISMATCH"],
  ["demand/consequence contract", (payload, leverage, demand, consequence) => demand.pressureContractId === leverage.pressureContractId && consequence.pressureContractId === leverage.pressureContractId, "TPL_PRESSURE_CONTRACT_MISMATCH"],
  ["demand/consequence identity", (payload, leverage, demand, consequence) => consequence.demandId === demand.demandId, "TPL_PRESSURE_DEMAND_MISMATCH"],
  ["context gate", (payload, leverage, demand, consequence) => [leverage, demand, consequence, consequence.validity].every((entry) => entry.contextId === payload.contextId), "TPL_PRESSURE_CONTEXT_INVALID"],
  ["actual scope gate", (payload, leverage, demand, consequence) => [leverage, demand, consequence, consequence.validity].every((entry) => entry.scope === "ACTUAL"), "TPL_PRESSURE_SCOPE_INVALID"],
  ["validity start", (payload, leverage, demand, consequence) => consequence.validity.validFrom === consequence.validFrom, "TPL_PRESSURE_VALIDITY_TIME_MISMATCH"],
  ["validity end", (payload, leverage, demand, consequence) => consequence.validity.validUntil === undefined || consequence.validUntil === consequence.validity.validUntil, "TPL_PRESSURE_VALIDITY_TIME_MISMATCH"],
  ["validity bound", (payload, leverage, demand, consequence) => consequence.validity.validUntilIsUnbounded === (consequence.validUntil === undefined), "TPL_PRESSURE_VALIDITY_TIME_MISMATCH"],
]);

function assertAuthoredPressureBinding(payload, leverage, demand, consequence) {
  if (payload.actionId !== "INVOKE_CONSEQUENCE") renderFailure("TPL_PRESSURE_ACTION_UNAUTHORIZED", "PRESSURE requires the registered consequence action.");
  for (const [, predicate, code] of PRESSURE_CONTRACT_RULES) if (!predicate(payload, leverage, demand, consequence)) renderFailure(code, "PRESSURE payload does not satisfy the registered authored contract rules.", { code });
  if (leverage.actor !== payload.actor || leverage.target !== payload.target || demand.subject !== payload.target || demand.object !== payload.actor) renderFailure("TPL_PRESSURE_ENVELOPE_IDENTITY_MISMATCH", "PRESSURE contract identities do not match the semantic envelope.");
}

/** @returns {Record<string, string>} */
export function realizeSemanticSlots(payload, options = {}) {
  const validation = validateSemanticPayload(payload);
  if (!validation.passed) failForPayloadValidation(validation);
  const slots = payload.slots;
  if (payload.speechAct === "ASK") return { REQUEST: formatRequest(slots.REQUEST, "slots.REQUEST", payload) };
  if (payload.speechAct === "DEAL") return { OFFER: formatExchange(slots.OFFER, "slots.OFFER"), RETURN: formatExchange(slots.RETURN, "slots.RETURN") };
  const leverage = slots.leverage;
  const evaluationTime = options.evaluationTime ?? DEFAULT_EVALUATION_TIME;
  const realizedLeverage = formatLeverage(leverage, "slots.leverage", payload, options.requireAuthoredPressure === true, evaluationTime);
  const demand = formatDemand(slots.DEMAND, "slots.DEMAND", payload, options.requireAuthoredPressure === true, evaluationTime);
  const consequence = formatConsequence(slots.CONSEQUENCE, "slots.CONSEQUENCE", payload, options.requireAuthoredPressure === true, evaluationTime);
  if (options.requireAuthoredPressure === true) {
    assertAuthoredPressureBinding(payload, leverage, slots.DEMAND, slots.CONSEQUENCE);
  }
  return { ...(realizedLeverage ? { LEVERAGE: realizedLeverage } : {}), DEMAND: demand, CONSEQUENCE: consequence };
}

function assertCleanRenderedText(text) {
  if (typeof text !== "string" || !text.trim()) renderFailure("TPL_RENDERED_TEXT_EMPTY", "The style profile produced no written message.");
  if (/\{\s*(?:["']|[A-Za-z_$][A-Za-z0-9_$]*\s*:)|\[\s*(?:["'\d-]|\{|\[|true\b|false\b|null\b)|\[[A-Z][A-Z_]+\]|\b(?:undefined|null)\b/i.test(text)) renderFailure("TPL_RENDERED_TEXT_LEAK", "Rendered text contains serialized data, a placeholder, or nullish leakage.", { text });
  if (RUNTIME_LABEL_PATTERN.test(text)) renderFailure("TPL_RENDERED_TEXT_INTERNAL_ID", "Rendered text contains an internal identifier without a reviewed label.", { text });
  return text;
}

function vibeFor(vibeId) {
  const vibe = BASED_VIBES.find((entry) => entry.vibeId === vibeId);
  if (!vibe) renderFailure("VIBE_NOT_ALLOWED", `Unknown ordered Vibe ${vibeId}.`, { vibeId });
  if (!VIBE_REALIZATION_RECIPES[vibeId]) renderFailure("VIBE_RECIPE_MISSING", `No reviewed realization recipe exists for ${vibeId}.`, { vibeId });
  const rule = VIBE_REALIZATION_RULES[vibeId];
  if (rule.primaryCue !== vibe.primaryCue || rule.secondaryCue !== vibe.secondaryCue) renderFailure("VIBE_RECIPE_ORDER_INVALID", `The realization rule for ${vibeId} does not preserve primary Cue order.`, { vibeId });
  if (!rule.primary.includes(rule.primaryCueSignal) || !rule.primary.includes(rule.secondaryCueSignal)) renderFailure("VIBE_RECIPE_SIGNAL_MISSING", `The realization text for ${vibeId} does not expose both ordered Cue signals.`, { vibeId });
  return vibe;
}

function validateDeliveryIntensity(deliveryIntensity) {
  if (!DELIVERY_INTENSITIES.includes(deliveryIntensity)) renderFailure("DELIVERY_INTENSITY_NOT_ALLOWED", `Unknown delivery intensity ${deliveryIntensity}.`, { deliveryIntensity });
}

function presentationAtom(atomId, text) {
  return { atomId, text, semanticEffect: "NONE" };
}

function canonicalNeutralPresentationAtoms({ speechAct, deliveryIntensity, vibe }) {
  const recipe = VIBE_REALIZATION_RULES[vibe.vibeId];
  const atoms = [
    presentationAtom("ATOM_CANONICAL_NEUTRAL_VIBE_PRIMARY", recipe.primary),
    presentationAtom("ATOM_CANONICAL_NEUTRAL_VIBE_MODIFIER", recipe.modifier),
  ];
  if (speechAct === "ASK") atoms.push(presentationAtom(
    `ATOM_CANONICAL_NEUTRAL_ASK_${deliveryIntensity}`,
    deliveryIntensity === "SUBTLE" ? "Could you" : deliveryIntensity === "BALANCED" ? "Please" : "I am asking directly",
  ));
  if (speechAct === "DEAL") {
    if (deliveryIntensity === "SUBTLE") atoms.push(presentationAtom("ATOM_CANONICAL_NEUTRAL_DEAL_FRAME", "The exchange is"));
    if (deliveryIntensity === "OVERT") atoms.push(presentationAtom("ATOM_CANONICAL_NEUTRAL_DEAL_RETURN", "in return,"));
    atoms.push(presentationAtom("ATOM_CANONICAL_NEUTRAL_DEAL_CONNECTOR", "for"));
  }
  if (speechAct === "PRESSURE") atoms.push(presentationAtom(
    `ATOM_CANONICAL_NEUTRAL_PRESSURE_CONSEQUENCE_${deliveryIntensity}`,
    deliveryIntensity === "OVERT" ? "The authored consequence remains" : "the authored consequence is",
  ));
  return atoms;
}

const PRESENTATION_ATOM_TEXTS = new Map([
  ["ATOM_CANONICAL_NEUTRAL_VIBE_PRIMARY", new Set(Object.values(VIBE_REALIZATION_RECIPES).map((recipe) => recipe.primary))],
  ["ATOM_CANONICAL_NEUTRAL_VIBE_MODIFIER", new Set(Object.values(VIBE_REALIZATION_RECIPES).map((recipe) => recipe.modifier))],
  ["ATOM_CANONICAL_NEUTRAL_ASK_SUBTLE", new Set(["Could you"])],
  ["ATOM_CANONICAL_NEUTRAL_ASK_BALANCED", new Set(["Please"])],
  ["ATOM_CANONICAL_NEUTRAL_ASK_OVERT", new Set(["I am asking directly"])],
  ["ATOM_CANONICAL_NEUTRAL_DEAL_FRAME", new Set(["The exchange is"])],
  ["ATOM_CANONICAL_NEUTRAL_DEAL_RETURN", new Set(["in return,"])],
  ["ATOM_CANONICAL_NEUTRAL_DEAL_CONNECTOR", new Set(["for"])],
  ["ATOM_CANONICAL_NEUTRAL_PRESSURE_CONSEQUENCE_SUBTLE", new Set(["the authored consequence is"])],
  ["ATOM_CANONICAL_NEUTRAL_PRESSURE_CONSEQUENCE_BALANCED", new Set(["the authored consequence is"])],
  ["ATOM_CANONICAL_NEUTRAL_PRESSURE_CONSEQUENCE_OVERT", new Set(["The authored consequence remains"])],
  ["ATOM_LEGACY_DEAL_FRAME", new Set(["Here is the exchange"])],
]);

function canonicalNeutralText({ speechAct, deliveryIntensity, vibe, realizedSlots }) {
  const recipe = VIBE_REALIZATION_RULES[vibe.vibeId];
  const slot = (value) => value.replace(/[.!?]+$/u, "");
  if (speechAct === "ASK") {
    const intensityLead = deliveryIntensity === "SUBTLE" ? "Could you" : deliveryIntensity === "BALANCED" ? "Please" : "I am asking directly";
    return `${recipe.primary}: ${intensityLead} ${slot(realizedSlots.REQUEST)}. ${recipe.modifier}.`;
  }
  if (speechAct === "DEAL") {
    if (deliveryIntensity === "SUBTLE") return `${recipe.primary}: The exchange is ${slot(realizedSlots.OFFER)} for ${slot(realizedSlots.RETURN)}. ${recipe.modifier}.`;
    if (deliveryIntensity === "BALANCED") return `${recipe.primary}: ${slot(realizedSlots.OFFER)} for ${slot(realizedSlots.RETURN)}. ${recipe.modifier}.`;
    return `${recipe.primary}: ${slot(realizedSlots.OFFER)}; in return, ${slot(realizedSlots.RETURN)}. ${recipe.modifier}.`;
  }
  if (deliveryIntensity === "SUBTLE") return `${recipe.primary}: ${slot(realizedSlots.LEVERAGE)}; ${slot(realizedSlots.DEMAND)}; the authored consequence is ${slot(realizedSlots.CONSEQUENCE)}. ${recipe.modifier}.`;
  if (deliveryIntensity === "BALANCED") return `${recipe.primary}: ${slot(realizedSlots.LEVERAGE)}; ${slot(realizedSlots.DEMAND)}. The authored consequence is ${slot(realizedSlots.CONSEQUENCE)}. ${recipe.modifier}.`;
  return `${recipe.primary}: ${slot(realizedSlots.LEVERAGE)}; ${slot(realizedSlots.DEMAND)}. The authored consequence remains ${slot(realizedSlots.CONSEQUENCE)}. ${recipe.modifier}.`;
}

export function renderStyleProfile({ payload, styleProfileId = "CANONICAL_NEUTRAL_V01", speechAct, deliveryIntensity, vibeId, coordinateKey, semanticRequestId, actionId, actionDisplayName, realizedSlots, availableContextFacts = [], evaluationTime = DEFAULT_EVALUATION_TIME }) {
  if (!isObject(payload)) renderFailure("TPL_SEMANTIC_PAYLOAD_REQUIRED", "The style profile requires the complete canonical semantic payload.");
  const payloadValidation = validateSemanticPayload(payload);
  if (!payloadValidation.passed) failForPayloadValidation(payloadValidation);
  if (speechAct !== undefined && speechAct !== payload.speechAct) renderFailure("TPL_SPEECH_ACT_DRIFT", "The style profile input speech act does not match the semantic payload.");
  if (actionId !== undefined && actionId !== payload.actionId) renderFailure("TPL_ACTION_ID_DRIFT", "The style profile input action does not match the semantic payload.");
  if (semanticRequestId !== undefined && semanticRequestId !== payload.semanticRequestId) renderFailure("TPL_REQUEST_ID_DRIFT", "The style profile input request identity does not match the semantic payload.");
  speechAct = payload.speechAct;
  actionId = payload.actionId;
  semanticRequestId = payload.semanticRequestId;
  const expectedActionDisplayName = ACTION_PRESENTATION_LABELS[actionId];
  if (actionDisplayName !== undefined && actionDisplayName !== expectedActionDisplayName) renderFailure("TPL_ACTION_LABEL_DRIFT", "The style profile input action label does not match the reviewed action label.");
  actionDisplayName = expectedActionDisplayName;
  const expectedRealizedSlots = realizeSemanticSlots(payload, { requireAuthoredPressure: speechAct === "PRESSURE", evaluationTime });
  if (!isObject(realizedSlots) || !valuesEqual(realizedSlots, expectedRealizedSlots)) renderFailure("TPL_REALIZED_SLOTS_DRIFT", "The style profile requires the deterministic realization of the semantic payload.");
  realizedSlots = expectedRealizedSlots;
  const profile = TPL_STYLE_PROFILES.find((entry) => entry.profileId === styleProfileId);
  if (!profile) renderFailure("TPL_STYLE_PROFILE_UNKNOWN", `Unknown style profile ${styleProfileId}.`, { styleProfileId });
  if (styleProfileId !== "CANONICAL_NEUTRAL_V01") renderFailure("TPL_STYLE_PROFILE_UNAVAILABLE", `${styleProfileId} is reserved until its owner-supplied language template exists.`, { styleProfileId });
  const vibe = vibeFor(vibeId);
  validateDeliveryIntensity(deliveryIntensity);
  if (!isObject(realizedSlots)) renderFailure("TPL_REALIZED_SLOTS_INVALID", "The style profile requires safe realized slots.");
  const presentationOnlyAtoms = canonicalNeutralPresentationAtoms({ speechAct, deliveryIntensity, vibe });
  const renderedText = assertCleanRenderedText(canonicalNeutralText({ speechAct, deliveryIntensity, vibe, realizedSlots }));
  return {
    renderedText,
    templateVariantId: `TPL_TEMPLATE_${coordinateKey}_CANONICAL_NEUTRAL_V01`,
    styleProfile: profile,
    styleProfileInput: {
      semanticRequestId,
      action: { actionId: requireNonEmptyText(actionId, "action.actionId"), displayName: requireNonEmptyText(actionDisplayName, "action.displayName"), macroAct: speechAct },
      orderedVibe: { vibeId: vibe.vibeId, name: vibe.name, primaryCue: vibe.primaryCue, secondaryCue: vibe.secondaryCue },
      deliveryIntensity,
      coordinateKey,
      realizedSlots: structuredClone(realizedSlots),
      availableContextFacts: structuredClone(availableContextFacts),
    },
    presentationOnlyAtoms,
  };
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim()))];
}

function normalizeAvailableFacts(facts) {
  return (facts ?? []).map((fact) => {
    if (typeof fact === "string") return { requiredFact: fact, authorized: false, sourceAssertionId: null };
    if (!isObject(fact)) return null;
    return {
      requiredFact: fact.requiredFact ?? fact.factId ?? fact.type ?? null,
      authorized: fact.authorized === true,
      sourceAssertionId: fact.sourceAssertionId ?? fact.assertionId ?? null,
    };
  }).filter((fact) => fact?.requiredFact);
}

function gateResultFor(cell, availableContextFacts) {
  const required = cell.requiredContextOrLoreFacts.map((gate) => gate.requiredFact);
  const normalized = normalizeAvailableFacts(availableContextFacts);
  const available = uniqueStrings(normalized.map((fact) => fact.requiredFact));
  const authorized = uniqueStrings(normalized.filter((fact) => fact.authorized).map((fact) => fact.requiredFact));
  return {
    requiredFacts: uniqueStrings(required),
    availableFacts: available,
    authorizedFacts: authorized,
    exactFactsSatisfied: required.every((fact) => authorized.includes(fact)),
    disposition: required.length ? "NEUTRAL_SAME_COORDINATE_REWRITE" : "NO_CONTEXT_CLAIM",
    candidateClaimsExecuted: false,
  };
}

function assertRuntimeCell(cell) {
  const expectedKey = `${cell.speechAct}_${cell.vibeId}_${cell.deliveryIntensity}`;
  const expectedConstructionId = FALLBACK_CONSTRUCTION_BY_ACT[cell.speechAct];
  const expectedProtocolId = RUNTIME_PROTOCOL_BY_ACT[cell.speechAct];
  if (cell.key !== expectedKey) renderFailure("TPL_COORDINATE_IDENTITY_INVALID", `${cell.key} does not agree with its act, Vibe, and intensity fields.`, { key: cell.key });
  if (JSON.stringify(cell.actionInvariant) !== JSON.stringify(ACTION_INVARIANTS[cell.speechAct])) renderFailure("TPL_ACTION_INVARIANT_LINK_INVALID", `${cell.key} does not preserve the registered action invariant.`, { key: cell.key });
  if (cell.reviewStatus !== "REVIEWED" || cell.readiness?.state !== "REVIEWED" || cell.executionMode !== "AUTHORING_PREVIEW" || cell.previewEligible !== true || cell.productionEligible !== false) renderFailure("TPL_READINESS_PROJECTION_INVALID", `${cell.key} is not a reviewed, preview-only runtime cell.`, { key: cell.key });
  if (cell.constructionId !== expectedConstructionId || cell.tplProtocolId !== expectedProtocolId || cell.styleProfileId !== "CANONICAL_NEUTRAL_V01") renderFailure("TPL_RUNTIME_CELL_LINK_INVALID", `${cell.key} is not linked to the registered act construction, protocol, and neutral style profile.`, { key: cell.key });
  return cell;
}

function runtimeCell(cell) {
  const protocolId = RUNTIME_PROTOCOL_BY_ACT[cell.speechAct];
  const construction = TPL_CONSTRUCTIONS.find((entry) => entry.constructionId === FALLBACK_CONSTRUCTION_BY_ACT[cell.speechAct]);
  const protocol = TPL_PROTOCOLS.find((entry) => entry.tplProtocolId === protocolId);
  const styleProfile = TPL_STYLE_PROFILES.find((entry) => entry.profileId === "CANONICAL_NEUTRAL_V01");
  if (!construction || !construction.speechActs.includes(cell.speechAct) || JSON.stringify(construction.requiredSlots) !== JSON.stringify(ACTION_INVARIANTS[cell.speechAct])) renderFailure("TPL_CONSTRUCTION_LINK_INVALID", `${cell.key} does not link to the correct semantic construction.`, { key: cell.key });
  if (!protocol || !protocol.speechActs.includes(cell.speechAct) || !protocol.constructionIds.includes(construction.constructionId) || !protocol.intensityProfiles.includes(cell.deliveryIntensity)) renderFailure("TPL_PROTOCOL_LINK_INVALID", `${cell.key} does not link to the correct protocol.`, { key: cell.key });
  if (!styleProfile || styleProfile.productionEligible) renderFailure("TPL_STYLE_PROFILE_LINK_INVALID", `${cell.key} does not link to the preview-only neutral style profile.`, { key: cell.key });
  return assertRuntimeCell({
    ...cell,
    reviewStatus: "REVIEWED",
    readiness: { state: "REVIEWED" },
    allowedProtocolIds: [protocolId],
    preferredProtocolIds: [protocolId],
    universalFallbackId: `LEGACY_SAFE_FALLBACK_${cell.speechAct}`,
    templateVariantId: `TPL_TEMPLATE_${cell.key}_CANONICAL_NEUTRAL_V01`,
    constructionId: FALLBACK_CONSTRUCTION_BY_ACT[cell.speechAct],
    tplProtocolId: protocolId,
    styleProfileId: "CANONICAL_NEUTRAL_V01",
    executionMode: "AUTHORING_PREVIEW",
    gateDisposition: cell.requiredContextOrLoreFacts.length ? "NEUTRAL_SAME_COORDINATE_REWRITE" : "NO_CONTEXT_CLAIM",
    previewEligible: true,
    productionEligible: false,
    provenance: {
      source: "DERIVED_CANONICAL_NEUTRAL_V01",
      schemaVersion: SEMANTIC_SCHEMA_VERSION,
      sourceAnchorIds: [...cell.candidateAnchorIds],
      transformVersion: "tpl-runtime-neutral-review@0.1",
      reviewNote: "Source candidate retained as evidence; this reviewed-neutral text is not final ZANT language.",
    },
  });
}

export const TPL_TEMPLATES = Object.freeze(buildMatrixWithAnchors().map((cell) => ({
  templateVariantId: `TPL_TEMPLATE_${cell.key}_CANONICAL_NEUTRAL_V01`,
  coordinateKey: cell.key,
  speechAct: cell.speechAct,
  vibeId: cell.vibeId,
  deliveryIntensity: cell.deliveryIntensity,
  constructionId: FALLBACK_CONSTRUCTION_BY_ACT[cell.speechAct],
  tplProtocolId: RUNTIME_PROTOCOL_BY_ACT[cell.speechAct],
  styleProfileId: "CANONICAL_NEUTRAL_V01",
  sourceLine: cell.sourceLine,
  gateDisposition: cell.requiredContextOrLoreFacts.length ? "NEUTRAL_SAME_COORDINATE_REWRITE" : "NO_CONTEXT_CLAIM",
  candidateAnchorIds: [...cell.candidateAnchorIds],
  requiredContextOrLoreFacts: structuredClone(cell.requiredContextOrLoreFacts),
  reviewStatus: "REVIEWED",
  readiness: { state: "REVIEWED" },
  previewEligible: true,
  productionEligible: false,
  provenance: {
    source: "DERIVED_CANONICAL_NEUTRAL_V01",
    schemaVersion: SEMANTIC_SCHEMA_VERSION,
    sourceAnchorIds: [...cell.candidateAnchorIds],
    transformVersion: "tpl-runtime-neutral-review@0.1",
    reviewNote: "Source candidate retained as evidence; not final ZANT language.",
  },
})));

export function buildRuntimeMatrix() {
  return buildMatrixWithAnchors().map(runtimeCell);
}

function readinessMatchesStatus(record, label, errors) {
  const state = record?.readiness?.state;
  const expectedStatus = {
    PREVIEW_READY: "CANDIDATE",
    REVIEWED: "REVIEWED",
    APPROVED: "APPROVED",
    PRODUCTION_ELIGIBLE: "APPROVED",
    BLOCKED: "BLOCKED",
  }[state];
  if (!expectedStatus || record.reviewStatus !== expectedStatus) errors.push(`${label}:READINESS_STATUS_MISMATCH`);
}

/**
 * Checks the cross-record invariants that JSON Schema cannot express across
 * the matrix, template, protocol, construction, and style-profile arrays.
 */
export function validateTplArtifactIntegrity(artifact) {
  const errors = [];
  if (!isObject(artifact)) return ["ARTIFACT_NOT_OBJECT"];
  const matrix = Array.isArray(artifact.matrix) ? artifact.matrix : [];
  const templates = Array.isArray(artifact.templates) ? artifact.templates : [];
  const protocols = Array.isArray(artifact.protocols) ? artifact.protocols : [];
  const constructions = Array.isArray(artifact.constructions) ? artifact.constructions : [];
  const styles = Array.isArray(artifact.styleProfiles) ? artifact.styleProfiles : [];
  const expectedKeys = SPEECH_ACTS.flatMap((speechAct) => BASED_VIBES.flatMap((vibe) => DELIVERY_INTENSITIES.map((intensity) => `${speechAct}_${vibe.vibeId}_${intensity}`)));
  const expectedKeySet = new Set(expectedKeys);
  const matrixByKey = new Map();
  const templateByCoordinate = new Map();
  const protocolById = new Map();
  const constructionById = new Map();
  const styleById = new Map();

  if (matrix.length !== expectedKeys.length) errors.push("MATRIX_COUNT_INVALID");
  if (templates.length !== expectedKeys.length) errors.push("TEMPLATE_COUNT_INVALID");
  for (const cell of matrix) {
    if (!isObject(cell)) { errors.push("MATRIX_CELL_NOT_OBJECT"); continue; }
    if (matrixByKey.has(cell.key)) errors.push(`MATRIX_KEY_DUPLICATE:${cell.key}`);
    matrixByKey.set(cell.key, cell);
    const expectedKey = `${cell.speechAct}_${cell.vibeId}_${cell.deliveryIntensity}`;
    if (cell.key !== expectedKey || !expectedKeySet.has(cell.key)) errors.push(`MATRIX_IDENTITY_INVALID:${cell.key}`);
    if (JSON.stringify(cell.actionInvariant) !== JSON.stringify(ACTION_INVARIANTS[cell.speechAct])) errors.push(`MATRIX_ACTION_INVARIANT_INVALID:${cell.key}`);
    readinessMatchesStatus(cell, `MATRIX:${cell.key}`, errors);
    if (cell.reviewStatus !== "REVIEWED" || cell.readiness?.state !== "REVIEWED" || cell.executionMode !== "AUTHORING_PREVIEW" || cell.previewEligible !== true || cell.productionEligible !== false) errors.push(`MATRIX_RUNTIME_READINESS_INVALID:${cell.key}`);
  }
  for (const key of expectedKeys) if (!matrixByKey.has(key)) errors.push(`MATRIX_KEY_MISSING:${key}`);

  for (const entry of protocols) {
    if (!isObject(entry)) { errors.push("PROTOCOL_NOT_OBJECT"); continue; }
    if (protocolById.has(entry.tplProtocolId)) errors.push(`PROTOCOL_ID_DUPLICATE:${entry.tplProtocolId}`);
    protocolById.set(entry.tplProtocolId, entry);
    readinessMatchesStatus(entry, `PROTOCOL:${entry.tplProtocolId}`, errors);
  }
  for (const entry of constructions) {
    if (!isObject(entry)) { errors.push("CONSTRUCTION_NOT_OBJECT"); continue; }
    if (constructionById.has(entry.constructionId)) errors.push(`CONSTRUCTION_ID_DUPLICATE:${entry.constructionId}`);
    constructionById.set(entry.constructionId, entry);
  }
  for (const entry of styles) {
    if (!isObject(entry)) { errors.push("STYLE_PROFILE_NOT_OBJECT"); continue; }
    if (styleById.has(entry.profileId)) errors.push(`STYLE_PROFILE_ID_DUPLICATE:${entry.profileId}`);
    styleById.set(entry.profileId, entry);
    readinessMatchesStatus(entry, `STYLE:${entry.profileId}`, errors);
  }
  for (const template of templates) {
    if (!isObject(template)) { errors.push("TEMPLATE_NOT_OBJECT"); continue; }
    if (templateByCoordinate.has(template.coordinateKey)) errors.push(`TEMPLATE_COORDINATE_DUPLICATE:${template.coordinateKey}`);
    templateByCoordinate.set(template.coordinateKey, template);
    const expectedTemplateId = `TPL_TEMPLATE_${template.coordinateKey}_CANONICAL_NEUTRAL_V01`;
    if (template.templateVariantId !== expectedTemplateId) errors.push(`TEMPLATE_IDENTITY_INVALID:${template.coordinateKey}`);
    if (template.reviewStatus !== "REVIEWED" || template.readiness?.state !== "REVIEWED" || template.previewEligible !== true || template.productionEligible !== false) errors.push(`TEMPLATE_READINESS_INVALID:${template.coordinateKey}`);
  }

  for (const cell of matrix) {
    if (!isObject(cell)) continue;
    const construction = constructionById.get(cell.constructionId);
    const protocol = protocolById.get(cell.tplProtocolId);
    const style = styleById.get(cell.styleProfileId);
    if (!construction) errors.push(`MATRIX_CONSTRUCTION_MISSING:${cell.key}`);
    else if (!construction.speechActs.includes(cell.speechAct) || JSON.stringify(construction.requiredSlots) !== JSON.stringify(ACTION_INVARIANTS[cell.speechAct])) errors.push(`MATRIX_CONSTRUCTION_LINK_INVALID:${cell.key}`);
    if (!protocol) errors.push(`MATRIX_PROTOCOL_MISSING:${cell.key}`);
    else if (!protocol.speechActs.includes(cell.speechAct) || !protocol.constructionIds.includes(cell.constructionId) || !protocol.intensityProfiles.includes(cell.deliveryIntensity)) errors.push(`MATRIX_PROTOCOL_LINK_INVALID:${cell.key}`);
    if (!style) errors.push(`MATRIX_STYLE_PROFILE_MISSING:${cell.key}`);
    else if (style.reviewStatus !== "REVIEWED" || style.readiness?.state !== "REVIEWED" || style.previewEligible !== true || style.productionEligible !== false) errors.push(`MATRIX_STYLE_READINESS_INVALID:${cell.key}`);
    if (cell.productionEligible === true) {
      if (cell.reviewStatus !== "APPROVED" || cell.readiness?.state !== "PRODUCTION_ELIGIBLE" || !["PRODUCTION", "PRODUCTION_RUNTIME"].includes(cell.executionMode)) errors.push(`MATRIX_PRODUCTION_READINESS_INVALID:${cell.key}`);
      if (!protocol || protocol.reviewStatus !== "APPROVED" || !["APPROVED", "PRODUCTION_ELIGIBLE"].includes(protocol.readiness?.state)) errors.push(`MATRIX_PRODUCTION_PROTOCOL_INVALID:${cell.key}`);
      if (!style || style.productionEligible !== true || style.reviewStatus !== "APPROVED") errors.push(`MATRIX_PRODUCTION_STYLE_INVALID:${cell.key}`);
    } else if (["PRODUCTION", "PRODUCTION_RUNTIME"].includes(cell.executionMode) || cell.readiness?.state === "PRODUCTION_ELIGIBLE") {
      errors.push(`MATRIX_PRODUCTION_FLAG_CONTRADICTION:${cell.key}`);
    }
    const template = templateByCoordinate.get(cell.key);
    if (!template) errors.push(`MATRIX_TEMPLATE_MISSING:${cell.key}`);
    else if (template.speechAct !== cell.speechAct || template.vibeId !== cell.vibeId || template.deliveryIntensity !== cell.deliveryIntensity || template.constructionId !== cell.constructionId || template.tplProtocolId !== cell.tplProtocolId || template.styleProfileId !== cell.styleProfileId) errors.push(`MATRIX_TEMPLATE_LINK_INVALID:${cell.key}`);
  }
  if (artifact.fallbackPolicy?.approvedProtocolCount !== protocols.filter((protocol) => protocol?.reviewStatus === "APPROVED").length) errors.push("FALLBACK_APPROVED_PROTOCOL_COUNT_INVALID");
  return errors;
}

function removeAllLiteral(text, fragment) {
  if (!fragment) return text;
  const escaped = String(fragment).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "giu"), " ");
}

function semanticSlotDispositionEvidence(payload, evidenceSlots, reasons) {
  const entries = [];
  for (const [slot, value] of Object.entries(payload?.slots ?? {})) {
    const disposition = SEMANTIC_SLOT_DISPOSITIONS[slot];
    if (!disposition) {
      reasons.push(rejection("REJECT_SLOT_DISPOSITION_MISSING", `Slot ${slot} has no reviewed semantic disposition.`, { slot }));
      continue;
    }
    if (disposition === "CONTEXT_ONLY") {
      entries.push({ slot, disposition, accounted: true, basis: "validated-semantic-envelope" });
      continue;
    }
    if (disposition === "REALIZED_OPTIONAL_SLOT" || disposition === "REALIZED_MACRO_SLOT") {
      const upperSlot = disposition === "REALIZED_OPTIONAL_SLOT" ? "LEVERAGE" : slot.toUpperCase();
      const realized = evidenceSlots?.[upperSlot];
      const accounted = typeof realized === "string" && realized.trim().length > 0;
      if (!accounted) reasons.push(rejection("REJECT_SEMANTIC_SLOT_UNACCOUNTED", `Semantic slot ${slot} has no deterministic realization or reviewed disposition.`, { slot }));
      entries.push({ slot, disposition, accounted, basis: accounted ? `realizedSlots.${upperSlot}` : null });
      continue;
    }
    reasons.push(rejection("REJECT_SEMANTIC_SLOT_UNSUPPORTED", `Semantic slot ${slot} is unsupported by the current reviewed protocol.`, { slot, value }));
    entries.push({ slot, disposition, accounted: false, basis: null });
  }
  return entries;
}

export function validateRenderedTextSemanticEvidence({ payload, renderedText, realizedSlots, presentationOnlyAtoms = [], requireAuthoredPressure = payload?.speechAct === "PRESSURE", evaluationTime = DEFAULT_EVALUATION_TIME, vibeId, deliveryIntensity, allowLegacyDealFrame = false }) {
  const reasons = [];
  const payloadValidation = validateSemanticPayload(payload);
  reasons.push(...payloadValidation.reasons);
  if (typeof renderedText !== "string" || !renderedText.trim()) reasons.push(rejection("REJECT_RENDERED_TEXT_EMPTY", "Rendered text must be a non-empty string."));
  if (!isObject(realizedSlots)) reasons.push(rejection("REJECT_REALIZED_SLOTS_INVALID", "Realized slots must be an object."));
  let expectedRealizedSlots = null;
  try {
    expectedRealizedSlots = realizeSemanticSlots(payload, { requireAuthoredPressure, evaluationTime });
  } catch (error) {
    reasons.push(rejection("REJECT_SLOT_REALIZATION_INVALID", error?.code ?? error?.message ?? "The semantic slots could not be realized."));
  }
  if (expectedRealizedSlots && (!isObject(realizedSlots) || !valuesEqual(realizedSlots, expectedRealizedSlots))) reasons.push(rejection("REJECT_REALIZED_SLOTS_DRIFT", "Evidence must use the deterministic realization of the supplied semantic payload."));
  const evidenceSlots = expectedRealizedSlots ?? (isObject(realizedSlots) ? realizedSlots : {});
  const slotDispositions = semanticSlotDispositionEvidence(payload, evidenceSlots, reasons);
  const requiredSlots = SEMANTIC_SLOTS_BY_ACT[payload?.speechAct] ?? [];
  const requiredFragments = requiredSlots.map((slot) => {
    const text = evidenceSlots?.[slot];
    const preserved = typeof text === "string" && text.trim().length > 0 && typeof renderedText === "string" && renderedText.toLocaleLowerCase().includes(text.trim().toLocaleLowerCase());
    if (!preserved) reasons.push(rejection("REJECT_MANDATORY_SEMANTIC_FRAGMENT_DROPPED", `Rendered text does not preserve the required semantic slot ${slot}.`, { slot, text: text ?? null }));
    return { slot, text: text ?? null, preserved, source: `slots.${slot}` };
  });
  const semanticFragments = Object.entries(evidenceSlots).map(([slot, text]) => ({ slot, text: typeof text === "string" ? text : String(text), source: `slots.${slot}` }));
  const suppliedPresentationOnlyAtoms = Array.isArray(presentationOnlyAtoms) ? presentationOnlyAtoms : [];
  if (!Array.isArray(presentationOnlyAtoms)) reasons.push(rejection("REJECT_PRESENTATION_ATOMS_INVALID", "Presentation-only evidence must be an array."));
  const selectedVibe = BASED_VIBES.find((entry) => entry.vibeId === vibeId);
  const expectedPresentationOnlyAtoms = selectedVibe && DELIVERY_INTENSITIES.includes(deliveryIntensity) && VIBE_REALIZATION_RECIPES[selectedVibe.vibeId]
    ? [...canonicalNeutralPresentationAtoms({ speechAct: payload?.speechAct, deliveryIntensity, vibe: selectedVibe }), ...(allowLegacyDealFrame && payload?.speechAct === "DEAL" && deliveryIntensity === "BALANCED" ? [presentationAtom("ATOM_LEGACY_DEAL_FRAME", "Here is the exchange")] : [])]
    : null;
  const expectedPresentationAtomKeys = expectedPresentationOnlyAtoms ? new Set(expectedPresentationOnlyAtoms.map((atom) => `${atom.atomId}\u0000${atom.text}`)) : null;
  const safePresentationOnlyAtoms = [];
  const seenAtomIds = new Set();
  for (const atom of suppliedPresentationOnlyAtoms) {
    const validShape = isObject(atom) && typeof atom.atomId === "string" && typeof atom.text === "string" && atom.semanticEffect === "NONE";
    if (!validShape) reasons.push(rejection("REJECT_PRESENTATION_ATOM_SEMANTIC_EFFECT", "A presentation-only atom was not explicitly marked as semantic-free."));
    else if (seenAtomIds.has(atom.atomId)) reasons.push(rejection("REJECT_PRESENTATION_ATOM_DUPLICATE", "A presentation-only atom may be declared only once.", { atomId: atom.atomId }));
    else if (!PRESENTATION_ATOM_TEXTS.get(atom.atomId)?.has(atom.text)) reasons.push(rejection("REJECT_UNREGISTERED_PRESENTATION_ATOM", "A rendered presentation atom is not registered by the deterministic neutral profile.", { atomId: atom.atomId }));
    else if (expectedPresentationAtomKeys && !expectedPresentationAtomKeys.has(`${atom.atomId}\u0000${atom.text}`)) reasons.push(rejection("REJECT_UNEXPECTED_PRESENTATION_ATOM", "A presentation atom is not authorized for the selected Vibe, act, and intensity.", { atomId: atom.atomId }));
    else {
      seenAtomIds.add(atom.atomId);
      safePresentationOnlyAtoms.push(atom);
    }
  }
  let residual = typeof renderedText === "string" ? renderedText : "";
  for (const fragment of [...semanticFragments, ...safePresentationOnlyAtoms].sort((left, right) => String(right.text).length - String(left.text).length)) residual = removeAllLiteral(residual, fragment.text);
  const unauthorizedText = residual.replace(/[^\p{L}\p{N}']+/gu, " ").replace(/\s+/gu, " ").trim();
  if (unauthorizedText) reasons.push(rejection("REJECT_UNAUTHORIZED_RENDERED_FRAGMENT", "Rendered text contains words not accounted for by semantic slots or semantic-free presentation atoms.", { fragment: unauthorizedText }));
  const mandatoryFacts = (payload?.mandatorySemanticFacts ?? []).map((fact) => {
    const slot = requiredSlots.includes(String(fact).toUpperCase()) ? String(fact).toUpperCase() : null;
    const fragment = requiredFragments.find((entry) => entry.slot === slot);
    return {
      fact,
      source: slot ? `slots.${slot}` : "semantic-envelope",
      preserved: slot ? fragment.preserved : true,
      basis: slot ? "rendered-fragment" : "validated-semantic-envelope",
    };
  });
  return {
    passed: reasons.length === 0,
    method: "DETERMINISTIC_RENDERED_FRAGMENT_AUDIT_V01",
    requiredFragments,
    semanticFragments,
    mandatoryFacts,
    slotDispositions,
    presentationOnlyAtoms: structuredClone(suppliedPresentationOnlyAtoms),
    unauthorizedFragments: unauthorizedText ? [unauthorizedText] : [],
    reasons,
  };
}

function renderResult({ payload, vibeId, deliveryIntensity, matrixKey, cell, realizedSlots, rendered, gateResult, executionMode, evaluationTime = DEFAULT_EVALUATION_TIME, fallbackUsed = false, rejectionReasons = [], faceRequest = { reactionFaceId: null, replyFaceId: null }, presentationOnlyAtoms = rendered.presentationOnlyAtoms ?? [] }) {
  const renderedText = assertCleanRenderedText(rendered.renderedText);
  const semanticEvidence = validateRenderedTextSemanticEvidence({ payload, renderedText, realizedSlots, presentationOnlyAtoms, requireAuthoredPressure: payload.speechAct === "PRESSURE", evaluationTime, vibeId, deliveryIntensity, allowLegacyDealFrame: fallbackUsed });
  if (!semanticEvidence.passed) renderFailure("TPL_SEMANTIC_INVARIANCE_FAILED", semanticEvidence.reasons.map((reason) => reason.code).join(","), { reasons: semanticEvidence.reasons });
  return {
    semanticRequestId: payload.semanticRequestId,
    matrixKey,
    speechAct: payload.speechAct,
    vibeId,
    deliveryIntensity,
    constructionId: cell.constructionId ?? FALLBACK_CONSTRUCTION_BY_ACT[payload.speechAct],
    tplProtocolId: cell.tplProtocolId ?? null,
    templateVariantId: rendered.templateVariantId ?? cell.templateVariantId ?? null,
    appliedAtomIds: [],
    styleProfileId: rendered.styleProfile?.profileId ?? null,
    styleProfile: rendered.styleProfile ?? null,
    styleProfileInput: rendered.styleProfileInput ?? null,
    executionMode,
    evaluationTime,
    readiness: cell.readiness ?? { state: "BLOCKED" },
    matrixReviewStatus: cell.reviewStatus,
    candidateAnchorIds: [...(cell.candidateAnchorIds ?? [])],
    sourceLine: cell.sourceLine ?? null,
    requiredContextOrLoreFacts: structuredClone(cell.requiredContextOrLoreFacts ?? []),
    gateResult,
    semanticInvariancePassed: semanticEvidence.passed,
    semanticInvariance: semanticEvidence,
    semanticEvidence,
    realizedSlots: structuredClone(realizedSlots),
    renderedText,
    stableSeed: `${payload.semanticRequestId}|${matrixKey}|${rendered.styleProfile?.profileId ?? "LEGACY"}`,
    provenance: [
      ...(Array.isArray(cell.provenance) ? cell.provenance : [cell.provenance]).filter(Boolean),
      { sourceId: "tpl-runtime-neutral-review", sourceRecordId: cell.templateVariantId ?? `fallback_${payload.speechAct}`, transformVersion: "tpl-runtime@0.1", licenseId: "PROJECT_AUTHORED" },
    ],
    rejectionReasons,
    fallbackUsed,
    previewEligible: cell.previewEligible === true,
    productionEligible: cell.productionEligible === true,
    fallbackPolicy: TPL_FALLBACK_POLICY,
    faceRequest,
  };
}

export function renderSafeFallback(payload, vibeId, deliveryIntensity) {
  const payloadValidation = validateSemanticPayload(payload);
  if (!payloadValidation.passed) failForPayloadValidation(payloadValidation);
  if (!SPEECH_ACTS.includes(payload.speechAct)) renderFailure("SPEECH_ACT_NOT_ALLOWED", `Unknown speech act ${payload.speechAct}.`);
  validateDeliveryIntensity(deliveryIntensity);
  const vibe = vibeFor(vibeId);
  const realizedSlots = realizeSemanticSlots(payload, { requireAuthoredPressure: payload.speechAct === "PRESSURE" });
  const pressurePrefix = realizedSlots.LEVERAGE ? `${realizedSlots.LEVERAGE}; ` : "";
  const text = payload.speechAct === "ASK"
    ? deliveryIntensity === "SUBTLE" ? `Could you ${realizedSlots.REQUEST}?` : deliveryIntensity === "BALANCED" ? `Please ${realizedSlots.REQUEST}.` : `I am asking directly: ${realizedSlots.REQUEST}.`
    : payload.speechAct === "DEAL"
      ? deliveryIntensity === "SUBTLE" ? `${realizedSlots.OFFER} for ${realizedSlots.RETURN}.` : deliveryIntensity === "BALANCED" ? `Here is the exchange: ${realizedSlots.OFFER} for ${realizedSlots.RETURN}.` : `${realizedSlots.OFFER}; in return, ${realizedSlots.RETURN}.`
      : deliveryIntensity === "SUBTLE" ? `${pressurePrefix}${realizedSlots.DEMAND}; the authored consequence is ${realizedSlots.CONSEQUENCE}.` : deliveryIntensity === "BALANCED" ? `${pressurePrefix}${realizedSlots.DEMAND}. The authored consequence is ${realizedSlots.CONSEQUENCE}.` : `${pressurePrefix}${realizedSlots.DEMAND}. The authored consequence remains ${realizedSlots.CONSEQUENCE}.`;
  const cell = {
    key: `${payload.speechAct}_${vibeId}_${deliveryIntensity}`,
    speechAct: payload.speechAct,
    reviewStatus: "UNMAPPED",
    readiness: { state: "BLOCKED" },
    candidateAnchorIds: [],
    requiredContextOrLoreFacts: [],
    constructionId: FALLBACK_CONSTRUCTION_BY_ACT[payload.speechAct],
    tplProtocolId: null,
    templateVariantId: null,
    previewEligible: false,
    productionEligible: false,
    provenance: { source: "project-safe-fallback", schemaVersion: SEMANTIC_SCHEMA_VERSION },
  };
  return renderResult({
    payload, vibeId, deliveryIntensity, matrixKey: cell.key, cell, realizedSlots,
    rendered: { renderedText: assertCleanRenderedText(text), templateVariantId: null, styleProfile: null },
    presentationOnlyAtoms: [
      ...canonicalNeutralPresentationAtoms({ speechAct: payload.speechAct, deliveryIntensity, vibe }),
      ...(payload.speechAct === "DEAL" && deliveryIntensity === "BALANCED" ? [presentationAtom("ATOM_LEGACY_DEAL_FRAME", "Here is the exchange")] : []),
    ],
    gateResult: { requiredFacts: [], availableFacts: [], exactFactsSatisfied: false, disposition: "LEGACY_PRODUCTION_SAFETY_PATH", candidateClaimsExecuted: false },
    executionMode: "PRODUCTION_SAFETY_FALLBACK",
    fallbackUsed: true,
    rejectionReasons: [{ code: "LEGACY_FALLBACK_ONLY", message: "The nine-form fallback is retained only as an explicit production safety path and is not a mapped coordinate execution." }],
  });
}

export function resolveMatrixCell(matrix, payload, vibeId, deliveryIntensity, options = {}) {
  const payloadValidation = validateSemanticPayload(payload);
  if (!payloadValidation.passed) failForPayloadValidation(payloadValidation);
  if (!SPEECH_ACTS.includes(payload.speechAct)) renderFailure("SPEECH_ACT_NOT_ALLOWED", `Unknown speech act ${payload.speechAct}.`);
  validateDeliveryIntensity(deliveryIntensity);
  vibeFor(vibeId);
  const key = `${payload.speechAct}_${vibeId}_${deliveryIntensity}`;
  const sourceCell = matrix.find((entry) => entry.key === key);
  if (!sourceCell) renderFailure("MATRIX_CELL_NOT_FOUND", `No matrix cell exists for ${key}.`, { key });
  const cell = sourceCell.reviewStatus === "UNMAPPED" ? runtimeCell(sourceCell) : sourceCell;
  assertRuntimeCell(cell);
  const executionMode = options.executionMode ?? "AUTHORING_PREVIEW";
  if (!ALLOWED_EXECUTION_MODES.has(executionMode)) {
    if (String(executionMode).toUpperCase().startsWith("PRODUCTION")) renderFailure("TPL_PRODUCTION_NOT_ELIGIBLE", `${key} is reviewed preview language and awaits owner approval.`, { key, productionEligible: cell.productionEligible });
    renderFailure("TPL_EXECUTION_MODE_UNSUPPORTED", `${executionMode} is not an executable authoring mode.`, { executionMode });
  }
  const styleProfileId = options.styleProfileId ?? "CANONICAL_NEUTRAL_V01";
  const evaluationTime = options.evaluationTime ?? DEFAULT_EVALUATION_TIME;
  const realizedSlots = realizeSemanticSlots(payload, { requireAuthoredPressure: payload.speechAct === "PRESSURE", evaluationTime });
  const availableContextFacts = options.availableContextFacts ?? options.contextFacts ?? [];
  const gateResult = gateResultFor(cell, availableContextFacts);
  if (options.requireExactContext === true && !gateResult.exactFactsSatisfied) renderFailure("TPL_CONTEXT_GATE_UNSATISFIED", `${key} has unavailable candidate context facts; neutral rewrite was disabled by the caller.`, { key, requiredFacts: gateResult.requiredFacts });
  const rendered = renderStyleProfile({ payload, styleProfileId, speechAct: payload.speechAct, deliveryIntensity, vibeId, coordinateKey: key, semanticRequestId: payload.semanticRequestId, actionId: payload.actionId, actionDisplayName: ACTION_PRESENTATION_LABELS[payload.actionId] ?? payload.actionId, realizedSlots, availableContextFacts: gateResult.authorizedFacts, evaluationTime });
  return renderResult({ payload, vibeId, deliveryIntensity, matrixKey: key, cell, realizedSlots, rendered, gateResult, executionMode, evaluationTime, faceRequest: { reactionFaceId: options.reactionFaceId ?? null, replyFaceId: options.replyFaceId ?? null } });
}

export function buildTplScaffold() {
  const matrix = buildRuntimeMatrix();
  const anchors = matrix.flatMap((cell) => cell.candidateAnchorIds);
  return {
    families: [...TPL_FAMILIES],
    atoms: [...TPL_ATOMS],
    constructions: [...TPL_CONSTRUCTIONS],
    protocols: [...TPL_PROTOCOLS],
    templates: [...TPL_TEMPLATES],
    styleProfiles: [...TPL_STYLE_PROFILES],
    matrix,
    anchorCount: new Set(anchors).size,
    matrixStatusCounts: Object.fromEntries(TPL_STATUSES.map((status) => [status, matrix.filter((cell) => cell.reviewStatus === status).length])),
    faceBoundary: FACE_COMPATIBILITY_BOUNDARY,
    fallbackPolicy: TPL_FALLBACK_POLICY,
  };
}

export function tplStatusSummary() {
  const byStatus = (items, key = "status") => Object.fromEntries(TPL_STATUSES.map((status) => [status, items.filter((item) => (item[key] ?? item.reviewStatus) === status).length]));
  return { atoms: byStatus(TPL_ATOMS), constructions: byStatus(TPL_CONSTRUCTIONS), protocols: byStatus(TPL_PROTOCOLS, "reviewStatus"), templates: byStatus(TPL_TEMPLATES, "reviewStatus"), matrix: byStatus(buildRuntimeMatrix(), "reviewStatus"), styleProfiles: byStatus(TPL_STYLE_PROFILES, "reviewStatus") };
}
