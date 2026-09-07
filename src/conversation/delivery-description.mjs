import { BASED_VIBES, DELIVERY_INTENSITIES } from "../based.mjs";

const INTENSITY = Object.freeze({
  SUBTLE: { label: "Subtle", summary: "Keep the selected manner understated." },
  BALANCED: { label: "Balanced", summary: "Make the selected manner clear without emphasizing it heavily." },
  OVERT: { label: "Overt", summary: "Make the selected manner strongly apparent." },
});

/** Describes the player's public selection, never a predicted response or hidden state. */
export function describeDelivery({ vibeId, intensity, action, topic, renderingStatus }) {
  const vibe = BASED_VIBES.find(entry => entry.vibeId === vibeId);
  if (!vibe || !DELIVERY_INTENSITIES.includes(intensity)) throw new Error("Invalid delivery selection.");
  const selectedIntensity = INTENSITY[intensity];
  let applicability = "This describes your selected manner. It does not predict the response or add facts to your words.";
  if (action === "ACCEPT") {
    applicability = "You are confirming the exact current offer. Delivery does not change these terms.";
  } else if (action === "WALK") {
    applicability = "You are ending the conversation. Delivery does not change your decision to leave.";
  } else if (action === "ASK" && topic === "CLARIFY_OFFER") {
    applicability = "You are asking to restate the current offer. Delivery does not improve its terms; asking again still takes a turn and tests patience.";
  } else if (action === "ASK" && ["EXPLANATION", "ACCOUNTABILITY"].includes(topic)) {
    applicability = "Here, delivery changes the wording, not the explanation or acknowledgment.";
  }
  let note = "Preview wording has not been checked for this selection yet.";
  if (renderingStatus === "AUTHORING_PREVIEW_CONTEXT_NEUTRAL") {
    note = "Neutral wording for this delivery; the selected manner still applies where this action uses it.";
  } else if (renderingStatus === "PRODUCTION_SAFETY_FALLBACK") {
    note = "Canonical wording is shown. Authored delivery wording is not approved for production.";
  } else if (renderingStatus === "AUTHORING_PREVIEW") {
    note = "Authored preview wording. Different deliveries can share a sentence.";
  }
  return {
    label: `${vibe.name} · ${selectedIntensity.label}`,
    description: `Selected manner: ${vibe.fusionLogic} ${selectedIntensity.summary}`,
    note,
    applicability,
  };
}
