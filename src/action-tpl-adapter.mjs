import { SPEECH_ACTS } from "./based.mjs";
import { ACTION_BY_ID, getAuthoritativeResolvedPayload } from "./mechanics.mjs";
import { SEMANTIC_ADAPTER_VERSION, SEMANTIC_BINDING_VERSION, SEMANTIC_OUTCOME, SEMANTIC_SCHEMA_VERSION, SEMANTIC_SLOTS_BY_ACT, validateSemanticPayload } from "./tpl.mjs";

export const ADAPTER_VERSION = SEMANTIC_ADAPTER_VERSION;
const REQUIRED_RESOLUTION_FIELDS = ["actionId", "actorId", "targetId", "macroAct", "outcome", "payload"];

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value ?? {}, key);
const clone = (value) => structuredClone(value);

function failure(code, message, details = {}) {
  return { code, message, ...details };
}

function rejected(failures, trace = []) {
  return {
    ok: false,
    status: "REJECTED",
    quarantined: true,
    semanticRequest: null,
    failures,
    trace: [...trace, { step: "ADAPTER_REJECTED", codes: failures.map((entry) => entry.code) }],
  };
}

function stablePart(value) {
  return encodeURIComponent(String(value));
}

function derivedRequestId(historyId) {
  return ["semantic", historyId].map(stablePart).join(":");
}

function canonicalJson(value) {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

const valuesEqual = (left, right) => canonicalJson(left) === canonicalJson(right);

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateResolutionIdentity(resolvedAction) {
  const failures = [];
  const emittedHistory = resolvedAction.emittedHistory;
  if (!Array.isArray(emittedHistory)) return { failures: [failure("RESOLUTION_HISTORY_MISSING", "A successful resolution must include emitted history identity evidence.")] };
  if (emittedHistory.length !== 1) {
    return { failures: [failure("RESOLUTION_HISTORY_CARDINALITY_INVALID", "A successful resolution must emit exactly one history event for adapter identity.", { count: emittedHistory.length })] };
  }

  const historyEvent = emittedHistory[0];
  if (!isObject(historyEvent)) return { failures: [failure("RESOLUTION_HISTORY_NOT_OBJECT", "The emitted history identity evidence must be an object.")] };
  if (!nonEmptyString(historyEvent.historyId)) failures.push(failure("RESOLUTION_HISTORY_ID_MISSING", "The emitted history event must carry a non-empty historyId."));
  if (!nonEmptyString(historyEvent.eventType)) failures.push(failure("RESOLUTION_HISTORY_EVENT_TYPE_MISSING", "The emitted history event must carry a non-empty eventType."));
  if (!nonEmptyString(resolvedAction.resolutionRecordId)) failures.push(failure("RESOLUTION_RECORD_ID_MISSING", "A successful resolution must carry mechanics-issued authority-record identity."));

  const identityFields = ["actionId", "actorId", "targetId"];
  for (const field of identityFields) {
    if (historyEvent[field] !== resolvedAction[field]) {
      failures.push(failure("RESOLUTION_HISTORY_IDENTITY_DRIFT", `Emitted history field ${field} does not match the resolved action.`, { field, expected: resolvedAction[field], actual: historyEvent[field] }));
    }
  }
  if (hasOwn(resolvedAction, "contextId") && historyEvent.contextId !== resolvedAction.contextId) {
    failures.push(failure("RESOLUTION_HISTORY_IDENTITY_DRIFT", "Emitted history contextId does not match the resolved action.", { field: "contextId", expected: resolvedAction.contextId, actual: historyEvent.contextId }));
  }

  if (Array.isArray(resolvedAction.deterministicEffects)) {
    const matchingEffect = resolvedAction.deterministicEffects.some((effect) => isObject(effect) && effect.kind === "EMIT_HISTORY" && effect.historyId === historyEvent.historyId);
    if (!matchingEffect) failures.push(failure("RESOLUTION_EFFECT_HISTORY_MISMATCH", "The deterministic history effect does not identify the emitted history event.", { historyId: historyEvent.historyId }));
  } else {
    failures.push(failure("RESOLUTION_EFFECTS_MISSING", "A successful resolution must include deterministic history effects."));
  }

  const stateBeforeHistory = resolvedAction.stateBefore?.history;
  if (!Array.isArray(stateBeforeHistory)) failures.push(failure("RESOLUTION_STATE_BEFORE_MISSING", "A successful resolution must include the stateBefore history snapshot."));
  if (Array.isArray(stateBeforeHistory) && stateBeforeHistory.some((event) => isObject(event) && event.historyId === historyEvent.historyId)) {
    failures.push(failure("RESOLUTION_HISTORY_ALREADY_PRESENT", "The emitted history identity already exists in stateBefore; the resolution occurrence is not distinct."));
  }

  const stateAfterHistory = resolvedAction.stateAfter?.history;
  if (!Array.isArray(stateAfterHistory)) failures.push(failure("RESOLUTION_STATE_AFTER_MISSING", "A successful resolution must include the stateAfter history snapshot."));
  if (Array.isArray(stateAfterHistory)) {
    const matchingAfterEvents = stateAfterHistory.filter((event) => isObject(event) && event.historyId === historyEvent.historyId);
    if (!matchingAfterEvents.length) {
      failures.push(failure("RESOLUTION_HISTORY_NOT_IN_STATE_AFTER", "The emitted history identity is absent from stateAfter.", { historyId: historyEvent.historyId }));
    } else if (matchingAfterEvents.length !== 1) {
      failures.push(failure("RESOLUTION_HISTORY_ID_NOT_UNIQUE", "The emitted history identity occurs more than once in stateAfter.", { historyId: historyEvent.historyId, count: matchingAfterEvents.length }));
    } else if (canonicalJson(matchingAfterEvents[0]) !== canonicalJson(historyEvent)) {
      failures.push(failure("RESOLUTION_HISTORY_EVENT_DRIFT", "The emitted history event differs from the event persisted in stateAfter.", { historyId: historyEvent.historyId }));
    }
  }

  const contextId = resolvedAction.contextId ?? historyEvent.contextId;
  if (!nonEmptyString(contextId)) failures.push(failure("RESOLUTION_CONTEXT_MISSING", "A resolved action must carry a non-empty contextId or emitted-history context."));
  return { failures, historyEvent, contextId };
}

function addIdentityFailure(failures, payload, field, expected) {
  if (hasOwn(payload, field) && payload[field] !== expected) failures.push(failure("ACTION_PAYLOAD_IDENTITY_DRIFT", `Resolved payload field ${field} does not match the action resolution.`, { field, expected, actual: payload[field] }));
}

function mapSemanticSlots(resolvedAction, payload, failures) {
  const { macroAct } = resolvedAction;
  for (const upperSlot of ["OFFER", "RETURN", "DEMAND", "CONSEQUENCE", "REQUEST"]) {
    const lowerSlot = upperSlot.toLowerCase();
    if (hasOwn(payload, upperSlot) && hasOwn(payload, lowerSlot) && !valuesEqual(payload[upperSlot], payload[lowerSlot])) {
      failures.push(failure("RESOLUTION_UPPERCASE_LOWERCASE_MISMATCH", `Resolved payload slots ${upperSlot} and ${lowerSlot} disagree.`, { upperSlot, lowerSlot }));
    }
  }
  if (failures.length) return null;
  if (macroAct === "DEAL") {
    for (const field of ["offer", "return"]) if ((!hasOwn(payload, field) && !hasOwn(payload, field.toUpperCase())) || (hasOwn(payload, field) && (payload[field] === null || payload[field] === undefined))) failures.push(failure("MISSING_DEAL_SEMANTIC_CONTENT", `A DEAL resolution must provide ${field}.`, { field }));
    if (failures.length) return null;
    return { OFFER: clone(payload.offer ?? payload.OFFER), RETURN: clone(payload.return ?? payload.RETURN) };
  }
  if (macroAct === "PRESSURE") {
    for (const field of ["demand", "consequence"]) if ((!hasOwn(payload, field) && !hasOwn(payload, field.toUpperCase())) || (hasOwn(payload, field) && (payload[field] === null || payload[field] === undefined))) failures.push(failure("MISSING_PRESSURE_SEMANTIC_CONTENT", `A PRESSURE resolution must provide ${field}.`, { field }));
    if (failures.length) return null;
    return { DEMAND: clone(payload.demand ?? payload.DEMAND), CONSEQUENCE: clone(payload.consequence ?? payload.CONSEQUENCE) };
  }
  if (macroAct === "ASK") {
    const frame = {};
    for (const field of ["action", "object", "permission", "information", "condition", "leverage", "request"]) if (hasOwn(payload, field)) frame[field] = clone(payload[field]);
    if (!hasOwn(frame, "action") && !hasOwn(frame, "object") && !hasOwn(frame, "permission") && !hasOwn(frame, "information") && !hasOwn(frame, "request")) {
      failures.push(failure("MISSING_ASK_SEMANTIC_CONTENT", "An ASK resolution must provide request content or an explicit action frame."));
      return null;
    }
    return { REQUEST: frame };
  }
  failures.push(failure("UNSUPPORTED_MACRO_ACT", `Cannot adapt unsupported macro act ${macroAct}.`));
  return null;
}

function reconstructAuthoritativePayload(resolvedAction, contextId, failures) {
  const action = ACTION_BY_ID.get(resolvedAction.actionId);
  if (!action || action.macroAct !== resolvedAction.macroAct) {
    failures.push(failure("RESOLUTION_ACTION_REGISTRY_MISMATCH", "The resolved action does not match the canonical action registry."));
    return null;
  }
  if (!isObject(resolvedAction.stateBefore)) {
    failures.push(failure("RESOLUTION_STATE_BEFORE_MISSING", "A proposed resolution must carry the authoritative state used for payload construction."));
    return null;
  }
  let authoritativePayload;
  try {
    authoritativePayload = getAuthoritativeResolvedPayload(resolvedAction, contextId);
  } catch (error) {
    failures.push(failure("RESOLUTION_PAYLOAD_RECONSTRUCTION_FAILED", "The canonical action payload could not be reconstructed from the authoritative resolution state.", { cause: error?.message ?? String(error) }));
    return null;
  }
  if (!isObject(authoritativePayload) || !valuesEqual(authoritativePayload, resolvedAction.payload)) {
    failures.push(failure("RESOLUTION_PAYLOAD_PROVENANCE_MISMATCH", "Resolved payload values do not match the canonical action payload reconstructed from mechanics state."));
    return null;
  }
  return authoritativePayload;
}

/**
 * Converts only a successful mechanics resolution into the canonical TPL request.
 * No dialogue text, missing proposition, quantity, deadline, or consequence is invented here.
 */
export function adaptResolvedActionToSemanticRequest(resolvedAction) {
  const failures = [];
  if (!isObject(resolvedAction)) return rejected([failure("RESOLUTION_NOT_OBJECT", "The resolved action must be an object.")]);
  for (const field of REQUIRED_RESOLUTION_FIELDS) {
    if (!hasOwn(resolvedAction, field)) failures.push(failure("RESOLUTION_FIELD_MISSING", `Resolved action field ${field} is required.`, { field }));
  }
  if (failures.length) return rejected(failures);
  if (resolvedAction.outcome !== SEMANTIC_OUTCOME) return rejected([failure("BLOCKED_ACTION_NOT_RENDERABLE", "Only a PROPOSED action may cross the mechanics-to-TPL boundary.", { outcome: resolvedAction.outcome })], [{ step: "ACTION_BOUNDARY_CHECK", passed: false }]);
  if (resolvedAction.quarantine !== null) return rejected([failure("RESOLUTION_QUARANTINED", "A quarantined mechanics resolution cannot cross the TPL boundary.")], [{ step: "ACTION_BOUNDARY_CHECK", passed: false }]);
  const preconditionEvaluations = resolvedAction.preconditionEvaluations;
  if (!isObject(preconditionEvaluations) || !Array.isArray(preconditionEvaluations.required) || !Array.isArray(preconditionEvaluations.forbidden)) {
    return rejected([failure("RESOLUTION_PRECONDITION_EVIDENCE_MISSING", "A proposed resolution must carry required and forbidden precondition evaluations.")], [{ step: "ACTION_BOUNDARY_CHECK", passed: false }]);
  }
  const failedPreconditions = [...preconditionEvaluations.required, ...preconditionEvaluations.forbidden].filter((entry) => !isObject(entry) || entry.passed !== true);
  if (failedPreconditions.length) return rejected([failure("RESOLUTION_PRECONDITION_FAILED", "A proposed resolution contains a failed or malformed precondition evaluation.", { count: failedPreconditions.length })], [{ step: "ACTION_BOUNDARY_CHECK", passed: false }]);
  if (!SPEECH_ACTS.includes(resolvedAction.macroAct)) return rejected([failure("UNSUPPORTED_MACRO_ACT", `Cannot adapt unsupported macro act ${resolvedAction.macroAct}.`)]);
  if (!isObject(resolvedAction.payload)) return rejected([failure("RESOLUTION_PAYLOAD_NOT_OBJECT", "The resolved action payload must be an object.")]);

  const identity = validateResolutionIdentity(resolvedAction);
  if (identity.failures.length) return rejected(identity.failures, [{ step: "RESOLUTION_IDENTITY_VALIDATED", passed: false }]);
  const { contextId, historyEvent } = identity;
  const expectedSemanticRequestId = derivedRequestId(historyEvent.historyId);
  if (hasOwn(resolvedAction, "semanticRequestId") && resolvedAction.semanticRequestId !== expectedSemanticRequestId) {
    return rejected([failure("RESOLUTION_SEMANTIC_REQUEST_ID_DRIFT", "The supplied semantic request identity does not match the emitted history occurrence.", { expected: expectedSemanticRequestId, actual: resolvedAction.semanticRequestId })], [{ step: "RESOLUTION_IDENTITY_VALIDATED", passed: false }]);
  }

  const authoritativePayload = reconstructAuthoritativePayload(resolvedAction, contextId, failures);
  if (!authoritativePayload) return rejected(failures, [{ step: "RESOLUTION_PAYLOAD_BOUND", passed: false }]);
  /** @type {any} */
  const payload = authoritativePayload;
  addIdentityFailure(failures, payload, "actor", resolvedAction.actorId);
  addIdentityFailure(failures, payload, "target", resolvedAction.targetId);
  addIdentityFailure(failures, payload, "action", resolvedAction.actionId);
  const semanticSlots = mapSemanticSlots(resolvedAction, payload, failures);
  if (failures.length || !semanticSlots) return rejected(failures);

  /** @type {any} */
  const slots = {
    actor: resolvedAction.actorId,
    target: resolvedAction.targetId,
    action: resolvedAction.actionId,
    contextId,
    ...semanticSlots,
  };
  for (const [upperSlot, value] of Object.entries(semanticSlots)) {
    const lowerSlot = upperSlot.toLowerCase();
    slots[lowerSlot] = clone(value);
  }
  if (resolvedAction.macroAct === "PRESSURE") slots.leverage = clone(payload.leverage);

  const semanticProjection = {
    ...clone(semanticSlots),
    ...(resolvedAction.macroAct === "PRESSURE" ? { leverage: clone(payload.leverage) } : {}),
  };

  const semanticRequest = {
    schemaVersion: SEMANTIC_SCHEMA_VERSION,
    adapterVersion: ADAPTER_VERSION,
    semanticRequestId: expectedSemanticRequestId,
    actionId: resolvedAction.actionId,
    actorId: resolvedAction.actorId,
    targetId: resolvedAction.targetId,
    contextId,
    actor: resolvedAction.actorId,
    target: resolvedAction.targetId,
    action: resolvedAction.actionId,
    speechAct: resolvedAction.macroAct,
    outcome: resolvedAction.outcome,
    slots,
    mandatorySemanticFacts: clone(resolvedAction.mandatorySemanticFacts ?? []),
    forbiddenSemanticAdditions: clone(resolvedAction.forbiddenSemanticAdditions ?? []),
    semanticBinding: {
      bindingVersion: SEMANTIC_BINDING_VERSION,
      source: "MECHANICS_RESOLUTION",
      sourceRecordId: historyEvent.historyId,
      resolutionRecordId: resolvedAction.resolutionRecordId,
      actionId: resolvedAction.actionId,
      actorId: resolvedAction.actorId,
      targetId: resolvedAction.targetId,
      contextId,
      payload: clone(payload),
      semanticSlots: semanticProjection,
    },
    provenance: [{
      sourceId: "mechanics-action-resolution",
      sourceRecordId: historyEvent.historyId,
      transformVersion: ADAPTER_VERSION,
      licenseId: "PROJECT_AUTHORED",
    }],
  };
  const validation = validateSemanticPayload(semanticRequest);
  if (!validation.passed) return rejected(validation.reasons.map((reason) => failure("ADAPTER_OUTPUT_INVALID", reason.message, { reason })), [{ step: "ADAPTER_OUTPUT_VALIDATED", passed: false }]);
  return {
    ok: true,
    status: "ADAPTED",
    quarantined: false,
    semanticRequest,
    failures: [],
    trace: [
      { step: "ACTION_BOUNDARY_CHECK", passed: true, actionId: resolvedAction.actionId, macroAct: resolvedAction.macroAct },
      { step: "RESOLUTION_IDENTITY_VALIDATED", passed: true, historyId: historyEvent.historyId, semanticRequestId: expectedSemanticRequestId },
      { step: "SEMANTIC_SLOTS_MAPPED", slots: [...SEMANTIC_SLOTS_BY_ACT[resolvedAction.macroAct]] },
      { step: "ADAPTER_OUTPUT_VALIDATED", passed: true },
    ],
  };
}
