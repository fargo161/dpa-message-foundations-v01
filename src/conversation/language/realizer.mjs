import { BASED_VIBES, DELIVERY_INTENSITIES } from "../../based.mjs";
import { requireLanguage, validatePlayerFrame } from "./frames.mjs";
import { CONTEXT_NEUTRAL_VIBES, deterministicVariant, presentPlayerText } from "./player-lines.mjs";
import { validateNpcFrame } from "./npc-lines.mjs";

export { buildPlayerFrame } from "./frames.mjs";
export { buildNpcFrame } from "./npc-lines.mjs";

export const LANGUAGE_READINESS = Object.freeze({
  packId: "encounter-authored-language-preview@1",
  state: "AUTHORING_PREVIEW",
  label: "Local authored language preview — production approval pending",
  productionEligible: false,
  foundationRuntimeProtocolsAdded: 0,
  runtimeCorpusRecordsAdded: 0,
});

function requireMode(mode) {
  requireLanguage(["AUTHORING_PREVIEW", "PRODUCTION"].includes(mode), "unknown language mode");
}

/** This pure realizer accepts a frame, not foundation authority. The caller must
 * bind the frame to a validated current draft; cloning a frame grants no rights. */
export function renderPlayerFrame(frame, { vibeId = "EA", intensity = "BALANCED", mode = "PRODUCTION", variantSeed = /** @type {string | number} */ (0) } = {}) {
  validatePlayerFrame(frame);
  requireMode(mode);
  requireLanguage(BASED_VIBES.some(vibe => vibe.vibeId === vibeId) && DELIVERY_INTENSITIES.includes(intensity), "unknown delivery coordinate");
  if (mode === "PRODUCTION") return { text: frame.text, readiness: "PRODUCTION_SAFETY_FALLBACK", variantId: `${frame.id}:canonical` };
  const variant = deterministicVariant(variantSeed);
  const text = presentPlayerText(frame.text, vibeId, intensity, variant);
  requireLanguage(text.includes(frame.text), "semantic core was altered");
  return { text, readiness: CONTEXT_NEUTRAL_VIBES.includes(vibeId) ? "AUTHORING_PREVIEW_CONTEXT_NEUTRAL" : "AUTHORING_PREVIEW", variantId: `${frame.id}:${vibeId}:${intensity}:${variant}` };
}

export function renderNpcFrame(frame, { mode = "PRODUCTION", variantSeed = /** @type {string | number} */ (0) } = {}) {
  validateNpcFrame(frame);
  requireMode(mode);
  const variant = mode === "AUTHORING_PREVIEW" ? deterministicVariant(variantSeed) : 0;
  return { text: frame.alternatives[variant], readiness: mode === "PRODUCTION" ? "PRODUCTION_SAFETY_FALLBACK" : "AUTHORING_PREVIEW", variantId: `${frame.id}:${variant}` };
}

const FIXTURE_LINES = Object.freeze([
  "You said you would meet me, but you did not arrive. What happened?",
  "You missed the meeting. Can you acknowledge that?",
  "I am leaving this conversation.",
]);

/** Registered Avery fixture wording only. The scenario adapter owns eligibility. */
export function renderAuthoredFixtureLine(text, { vibeId = "EA", intensity = "BALANCED", mode = "PRODUCTION", variantSeed = /** @type {string | number} */ (0) } = {}) {
  requireLanguage(FIXTURE_LINES.includes(text), "unregistered fixture line");
  requireMode(mode);
  requireLanguage(BASED_VIBES.some(vibe => vibe.vibeId === vibeId) && DELIVERY_INTENSITIES.includes(intensity), "unknown delivery coordinate");
  const variant = deterministicVariant(variantSeed);
  return {
    text: mode === "PRODUCTION" ? text : presentPlayerText(text, vibeId, intensity, variant),
    readiness: mode === "PRODUCTION" ? "PRODUCTION_SAFETY_FALLBACK" : CONTEXT_NEUTRAL_VIBES.includes(vibeId) ? "AUTHORING_PREVIEW_CONTEXT_NEUTRAL" : "AUTHORING_PREVIEW",
    variantId: `avery-fixture:${FIXTURE_LINES.indexOf(text)}:${mode === "PRODUCTION" ? "canonical" : `${vibeId}:${intensity}:${variant}`}`,
  };
}
