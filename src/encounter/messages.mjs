import { BASED_VIBES } from "../based.mjs";
import { informationPlayerText } from "./knowledge.mjs";
import { QUESTIONS as questions, describeTerms } from "../conversation/language/frames.mjs";
import { buildPlayerFrame, renderPlayerFrame, buildNpcFrame, renderNpcFrame } from "../conversation/language/realizer.mjs";

export function playerMessage(intent, options = {}) {
  if (options.mode === "AUTHORING_PREVIEW") {
    const frame = buildPlayerFrame(options.state, intent);
    return renderPlayerFrame(frame, { ...options, vibeId: intent.vibeId, intensity: intent.intensity }).text;
  }
  const vibe = BASED_VIBES.find((entry) => entry.vibeId === intent.vibeId);
  const label = `[${vibe?.name ?? intent.vibeId} / ${intent.intensity}]`;
  const informationText = options.state?.world ? informationPlayerText(options.state, intent) : "";
  if (intent.action === "ASK") return `${label} ${informationText || questions[intent.topic] || "Can we discuss this point?"}`;
  if (intent.action === "DEAL") return `${label} I propose ${describeTerms(intent.terms)}. This is in addition to my existing debt.${informationText ? ` ${informationText}` : ""}`;
  if (intent.action === "ACCEPT") return `${label} I accept the current offer${options.offer?.terms ? `: ${describeTerms(options.offer.terms)}` : ""}. My existing debt remains separate.${options.offer?.informationExchange ? ` I deliver the agreed information: ${options.offer.informationExchange.summary.replace(/[.!?]+$/, "")}.` : ""}`;
  return `${label} I am walking away from this negotiation.`;
}

export function marcusMessage(state, intent, decision, options = {}) {
  return renderNpcFrame(buildNpcFrame(state, intent, decision), options).text;
}
