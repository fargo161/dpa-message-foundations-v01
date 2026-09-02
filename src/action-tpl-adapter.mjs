import { SPEECH_ACTS } from "./based.mjs";
import { SEMANTIC_SLOTS_BY_ACT, validateSemanticPayload } from "./tpl.mjs";

const ADAPTER_VERSION = "action-tpl-adapter@0.1";
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

function derivedRequestId(resolvedAction, contextId) {
  const scenarioId = resolvedAction.stateBefore?.scenarioId ?? "unknown-scenario";
  return ["semantic", scenarioId, resolvedAction.actionId, resolvedAction.actorId, resolvedAction.targetId, contextId].map(stablePart).join(":");
}

function addIdentityFailure(failures, payload, field, expected) {
  if (hasOwn(payload, field) && payload[field] !== expected) failures.push(failure("ACTION_PAYLOAD_IDENTITY_DRIFT", `Resolved payload field ${field} does not match the action resolution.`, { field, expected, actual: payload[field] }));
}

function mapSemanticSlots(resolvedAction, payload, failures) {
  const { macroAct } = resolvedAction;
  if (macroAct === "DEAL") {
    for (const field of ["offer", "return"]) if (!hasOwn(payload, field) || payload[field] === null || payload[field] === undefined) failures.push(failure("MISSING_DEAL_SEMANTIC_CONTENT", `A DEAL resolution must provide ${field}.`, { field }));
    if (failures.length) return null;
    return { OFFER: clone(payload.offer), RETURN: clone(payload.return) };
  }
  if (macroAct === "PRESSURE") {
    for (const field of ["demand", "consequence"]) if (!hasOwn(payload, field) || payload[field] === null || payload[field] === undefined) failures.push(failure("MISSING_PRESSURE_SEMANTIC_CONTENT", `A PRESSURE resolution must provide ${field}.`, { field }));
    if (failures.length) return null;
    return { DEMAND: clone(payload.demand), CONSEQUENCE: clone(payload.consequence) };
  }
  if (macroAct === "ASK") {
    if (hasOwn(payload, "request") && payload.request !== null && payload.request !== undefined) return { REQUEST: clone(payload.request) };
    const frame = {};
    for (const field of ["action", "object", "permission", "information", "condition", "leverage"]) if (hasOwn(payload, field)) frame[field] = clone(payload[field]);
    if (!hasOwn(frame, "action") && !hasOwn(frame, "object") && !hasOwn(frame, "permission") && !hasOwn(frame, "information")) {
      failures.push(failure("MISSING_ASK_SEMANTIC_CONTENT", "An ASK resolution must provide request content or an explicit action frame."));
      return null;
    }
    return { REQUEST: frame };
  }
  failures.push(failure("UNSUPPORTED_MACRO_ACT", `Cannot adapt unsupported macro act ${macroAct}.`));
  return null;
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
  if (resolvedAction.outcome !== "PROPOSED") return rejected([failure("BLOCKED_ACTION_NOT_RENDERABLE", "Only a PROPOSED action may cross the mechanics-to-TPL boundary.", { outcome: resolvedAction.outcome })], [{ step: "ACTION_BOUNDARY_CHECK", passed: false }]);
  if (!SPEECH_ACTS.includes(resolvedAction.macroAct)) return rejected([failure("UNSUPPORTED_MACRO_ACT", `Cannot adapt unsupported macro act ${resolvedAction.macroAct}.`)]);
  if (!isObject(resolvedAction.payload)) return rejected([failure("RESOLUTION_PAYLOAD_NOT_OBJECT", "The resolved action payload must be an object.")]);

  const contextId = resolvedAction.contextId ?? resolvedAction.emittedHistory?.[0]?.contextId;
  if (contextId === undefined || contextId === null || contextId === "") return rejected([failure("RESOLUTION_CONTEXT_MISSING", "A resolved action must carry an explicit contextId or emitted-history context.")]);

  const payload = resolvedAction.payload;
  addIdentityFailure(failures, payload, "actor", resolvedAction.actorId);
  addIdentityFailure(failures, payload, "target", resolvedAction.targetId);
  addIdentityFailure(failures, payload, "action", resolvedAction.actionId);
  const semanticSlots = mapSemanticSlots(resolvedAction, payload, failures);
  if (failures.length || !semanticSlots) return rejected(failures);

  const slots = {
    ...clone(payload),
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

  const semanticRequest = {
    schemaVersion: "dpa-keyword-foundation@0.1",
    adapterVersion: ADAPTER_VERSION,
    semanticRequestId: resolvedAction.semanticRequestId ?? derivedRequestId(resolvedAction, contextId),
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
    provenance: [{
      sourceId: "mechanics-action-resolution",
      sourceRecordId: `${resolvedAction.stateBefore?.scenarioId ?? "unknown-scenario"}:${resolvedAction.actionId}`,
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
      { step: "SEMANTIC_SLOTS_MAPPED", slots: [...SEMANTIC_SLOTS_BY_ACT[resolvedAction.macroAct]] },
      { step: "ADAPTER_OUTPUT_VALIDATED", passed: true },
    ],
  };
}
