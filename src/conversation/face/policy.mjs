import { faceTransition, validateSnapshot } from "./transitions.mjs";
import { FACE_SLOTS } from "./presets.mjs";

function fixtureFace() {
  return {
    catalogVersion: "fixture-face@1.0",
    presetId: "FIXTURE_NEUTRAL",
    slots: FACE_SLOTS.map(slot => ({ slot, assetId: null, fromAssetId: null, operation: "HOLD" })),
    visibleCaption: "Neutral fixture portrait; no expression artwork is supplied for this character.",
  };
}

export function openingFace(characterId = "marcus") {
  return characterId === "marcus" ? faceTransition("COMPOSED_BASE") : fixtureFace();
}

/** Reception reads ONLY the communicated action/topic and previous snapshot.
 * No terms, promised information detail, outcome, deltas, Vibe or hidden policy.
 */
export function receptionPreset(intent, previousResponse) {
  const { action, topic } = intent;
  if (action === "WALK" || action === "ACCEPT" || (action === "ASK" && topic === "CLARIFY_OFFER")) {
    return previousResponse.presetId;
  }
  if (action === "DEAL") return "HEARING_TERMS";
  if (action === "ASK") {
    if (["R17_SHOW", "R17_HINT", "DISCLOSE_FULL", "DISCLOSE_PARTIAL", "VERIFY_SOURCE", "ACK_MISSED", "DEBT"].includes(topic)) return "DETAIL_RECEIVED";
    if (["QUESTION_RECORD", "ENTITLEMENT", "GUARANTEE"].includes(topic)) return "QUESTIONING";
    return "HEARING_TERMS";
  }
  return previousResponse.presetId;
}

/** Only these public resolved fields cross into the response selector.
 * No raw levels, cause facts, beliefs, score, threshold, quirk or selected Vibe.
 */
function responseContext(event) {
  const continuity = event.reactionCause?.continuity;
  const consequences = event.reactionCause?.consequences;
  return {
    action: event.intent.action,
    topic: event.intent.topic,
    outcome: event.outcome,
    status: continuity?.status,
    transfersCommitted: consequences?.transfersCommitted === true,
    currentOffer: Boolean(continuity?.currentOffer),
    clarificationPreservedOffer: continuity?.clarificationPreservedOffer === true,
    r17Reaction: consequences?.r17Reaction ?? null,
    confidenceDelta: Number.isFinite(event.deltas?.confidence) ? event.deltas.confidence : 0,
    tensionDelta: Number.isFinite(event.deltas?.tension) ? event.deltas.tension : 0,
  };
}

function responsePreset(context, previousResponse) {
  const { action, topic, outcome, status, confidenceDelta, tensionDelta } = context;
  if (action === "ACCEPT" && outcome === "AGREED" && status === "AGREED" && context.transfersCommitted) return "AGREEMENT_CLOSURE";
  const informationFaces = { HINT_CARES: "LEANING_IN", HINT_DOES_NOT_CARE: "ATTENTIVE", SHOW: "WARM_ACKNOWLEDGMENT", TRADE_VALUABLE: "READY_TO_AGREE", BLIND_TRADE_FAILURE: "GUARDED", TRADE_NO_VALUE: "ATTENTIVE" };
  if (context.r17Reaction && informationFaces[context.r17Reaction]) return informationFaces[context.r17Reaction];
  if (["WITHDRAWN", "END"].includes(outcome) || ["WITHDRAWN", "ENDED"].includes(status)) return "DRAWING_BOUNDARY";
  if (action === "ASK" && topic === "CLARIFY_OFFER" && outcome === "ANSWER" && context.clarificationPreservedOffer && context.currentOffer) {
    return previousResponse.presetId;
  }
  if (action === "DEAL") {
    if (outcome === "ACCEPT" && status === "OPEN" && context.currentOffer) return "READY_TO_AGREE";
    if (outcome === "COUNTER" && status === "OPEN" && context.currentOffer) return "WEIGHING_IT";
    if (outcome === "REJECT") return "DRAWING_BOUNDARY";
  }
  if (confidenceDelta < 0 || tensionDelta > 0) {
    return ["ACK_MISSED", "DEBT"].includes(topic) ? "CONCERNED" : "GUARDED";
  }
  if (confidenceDelta > 0 || tensionDelta < 0) return topic === "SMALL_TALK" ? "WARM_ACKNOWLEDGMENT" : "LEANING_IN";
  if (outcome === "ANSWER") return topic === "PRIORITIES" ? "QUESTIONING" : "ATTENTIVE";
  return previousResponse.presetId;
}

/** Called only with an authoritative committed event. Pure presentation output. */
export function buildFaceTurn(event, previousResponse = null) {
  const ref = event?.reactionCause?.turnRef;
  if (!ref || typeof ref.runId !== "string" || !ref.runId || !Number.isSafeInteger(ref.index) || ref.index < 1) {
    throw new Error("Face turn requires a valid committed turn reference.");
  }
  const previousRef = event.reactionCause.continuity?.previousTurnRef;
  if (previousRef && (previousRef.runId !== ref.runId || previousRef.index !== ref.index - 1)) {
    throw new Error("Broken face turn continuity.");
  }
  const turnRef = { runId: ref.runId, index: ref.index };
  if (event.characterId && event.characterId !== "marcus") {
    return { turnRef, receiving: fixtureFace(), responding: fixtureFace() };
  }
  if (!event.intent || typeof event.intent.action !== "string") throw new Error("Missing committed face intent.");
  const previous = previousResponse ?? openingFace();
  validateSnapshot(previous);
  const receiving = faceTransition(receptionPreset({ action: event.intent.action, topic: event.intent.topic }, previous), previous);
  const responding = faceTransition(responsePreset(responseContext(event), previous), receiving);
  return { turnRef, receiving, responding };
}
