import { projectPlayerInformation } from "./marcus-world-adapter.mjs";
import { projectLore } from "./knowledge.mjs";

function remainingAvenues(state) {
  if (state.status !== "OPEN") return ["This encounter is resolved. Restart with a seed to try another approach."];
  if (state.counteroffer) return [
    "Review the exact terms and any information exchange before accepting.",
    "Pure clarification keeps this offer unchanged unless patience runs out. Other questions or a new proposal replace it.",
    "You can decline by walking away; the existing debt remains.",
  ];
  return [
    "You can propose financial terms now, ask a question, or walk away. Small talk is optional.",
    "Check what you know and the available information options before deciding whether to disclose or retain your information.",
    "Repeated questions use up patience. A different delivery does not make the same information new.",
  ];
}

function quality(state) {
  if (state.status === "OPEN") return null;
  const terms = state.agreement?.terms;
  const acquiredUnits = terms?.units ?? 0;
  const newPrincipal = terms?.repayment ?? 0;
  const creditObjectiveMet = acquiredUnits >= 2 && newPrincipal > 0;
  const first = state.events[0]?.before;
  const relationalConsequences = [];
  if (state.status === "ENDED" && state.metrics.patience <= 0) {
    const repeatedQuestions = state.events.some((event, index, events) => event.intent?.action === "ASK" && events.slice(0, index).some(previous => previous.intent?.action === "ASK" && previous.intent.topic === event.intent.topic));
    relationalConsequences.push(repeatedQuestions ? "Marcus ran out of patience after repeated questions and ended the conversation. No new agreement was made." : "Marcus ran out of patience and ended the conversation. No new agreement was made.");
  }
  if (first) {
    for (const [key, description] of [["confidence", "Marcus's confidence in your commitment"], ["tension", "Tension in the conversation"]]) {
      const direction = Math.sign(state.metrics[key] - first[key]);
      relationalConsequences.push(`${description} ${direction > 0 ? "rose" : direction < 0 ? "fell" : "ended unchanged"} relative to the opening.`);
    }
  }
  if (state.status === "WITHDRAWN") relationalConsequences.push("You ended the negotiation voluntarily.");
  if (state.status === "ENDED" && state.metrics.patience > 0) relationalConsequences.push("Marcus would not continue the negotiation.");
  return {
    result: creditObjectiveMet ? "Intended credit objective met" : terms ? "Valid limited acquisition" : "No new agreement",
    designDefault: "Newly authored provisional target: at least two Contra units with positive new principal. This is not a hidden victory score.",
    creditObjectiveMet,
    acquiredUnits,
    cashRetained: state.metrics.cash,
    existingDebt: state.obligations.existing,
    newPrincipal,
    additionalRepayment: terms?.extra ?? 0,
    totalNewObligation: newPrincipal + (terms?.extra ?? 0),
    repaymentDays: terms?.days ?? null,
    relationalConsequences,
  };
}

/** Player-safe presentation only; phases describe progress and never gate actions. */
export function conversationView(state) {
  const lore = state.world ? projectLore(state) : null;
  return {
    phase: state.status !== "OPEN" ? "RESOLUTION" : state.phase || "CONTACT",
    opening: lore?.briefing || ["You owe Marcus money. His Contra is available only on terms he agrees to. Future profits are uncertain."],
    nextSteps: remainingAvenues(state),
    outcomeQuality: quality(state),
  };
}

/** Called with resolved state BEFORE the new event is appended. Debug-only.
 * It describes causes for later presentation, not TPL authority or facial slots.
 */
export function reactionCause(state, intent, decision, informationEffect = {}) {
  const informationCauses = informationEffect.causes || [];
  const involvedFactIds = [...new Set([
    ...(decision.factIds || []),
    ...informationCauses.flatMap((cause) => cause.factIds || []),
  ])];
  const evidenceIds = new Set(informationCauses.flatMap((cause) => cause.evidenceIds || []));
  const turn = state.events.length + 1;
  const semanticIntent = { action: intent.action, vibeId: intent.vibeId, intensity: intent.intensity };
  for (const key of ["topic", "terms", "information", "offerId", "offerVersion"]) {
    if (Object.hasOwn(intent, key)) semanticIntent[key] = structuredClone(intent[key]);
  }
  return {
    schemaVersion: "marcus-reaction-cause@0.1",
    turnRef: { runId: state.runId, index: turn },
    semanticIntent,
    involvedFactIds,
    observedEvidence: structuredClone((state.world ? projectPlayerInformation(state).evidence : []).filter((entry) => evidenceIds.has(entry.id))),
    consequences: {
      outcome: decision.outcome,
      reasons: structuredClone(decision.reasons || []),
      feedback: decision.feedback || informationEffect.feedback || "",
      r17Reaction: informationEffect.r17Reaction ?? null,
      requestedSocialChange: structuredClone(decision.social || {}),
      appliedDeltaLocation: "The same event's before, after and deltas fields are authoritative after clamping.",
      informationCauses: structuredClone(informationCauses),
      progressKey: informationEffect.progressKey || decision.progressKey || null,
      transfersCommitted: state.status === "AGREED" && intent.action === "ACCEPT",
    },
    continuity: {
      previousTurnRef: turn > 1 ? { runId: state.runId, index: turn - 1 } : null,
      phase: state.phase || (state.status === "OPEN" ? "CONTACT" : "RESOLUTION"),
      status: state.status,
      currentOffer: state.counteroffer ? { id: state.counteroffer.id, version: state.counteroffer.version } : null,
      clarificationPreservedOffer: intent.topic === "CLARIFY_OFFER" && Boolean(state.counteroffer),
      disclosure: state.world ? projectPlayerInformation(state).disclosure : null,
    },
    remainingAvenues: remainingAvenues(state),
  };
}
