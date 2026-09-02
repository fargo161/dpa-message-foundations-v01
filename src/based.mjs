import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const BASED_CUES = Object.freeze([
  { cueId: "B", name: "Belligerence", governingForce: "Oppositional force: threat, intimidation, escalation, antagonism, dominance." },
  { cueId: "A", name: "Aggression", governingForce: "Advancing force: direct pursuit, forceful action, attack, decisive movement." },
  { cueId: "S", name: "Sociability", governingForce: "Affiliative force: charm, rapport, influence, favors, networking." },
  { cueId: "E", name: "Empathy", governingForce: "Perspective-modeling force: reading, calming, helping, emotional truth." },
  { cueId: "D", name: "Deception", governingForce: "Interpretive control: lying, hiding intent, disguise, scam, misdirection." },
]);

const vibe = (vibeId, name, primary, secondary, fusionLogic) => ({ vibeId, name, primaryCue: primary, secondaryCue: secondary, fusionLogic, provenance: { source: "BASED_MESSAGE_BUILDER_180_TPL_MATRIX_V01", status: "PROJECT_AUTHORED" } });

export const BASED_VIBES = Object.freeze([
  vibe("BA", "Reckless", "B", "A", "Opposition leads; forward force makes it rash, volatile, and ready to act."),
  vibe("BS", "Instigating", "B", "S", "Opposition leads; social awareness turns it into bait, spectacle, or provocation."),
  vibe("BE", "Condemning", "B", "E", "Opposition leads; emotional reading becomes judgment, guilt, or moral accusation."),
  vibe("BD", "Extortive", "B", "D", "Opposition leads; concealed or ambiguous leverage controls the target."),
  vibe("AB", "Menacing", "A", "B", "Forward movement leads; hostility makes the advance threatening."),
  vibe("AS", "Commanding", "A", "S", "Forward movement leads; social fluency makes direction feel authoritative."),
  vibe("AE", "Urgent", "A", "E", "Forward movement leads; recognized stakes make action immediate and emotionally legible."),
  vibe("AD", "Hustled", "A", "D", "Forward movement leads; obscured terms and compressed time prevent scrutiny."),
  vibe("SB", "Irreverent", "S", "B", "Rapport leads; antagonism appears as insolence, teasing, mockery, or social trespass."),
  vibe("SA", "Charismatic", "S", "A", "Rapport leads; confidence and forward motion turn charm into momentum."),
  vibe("SE", "Compassionate", "S", "E", "Rapport leads; emotional care makes the bond supportive and sincere."),
  vibe("SD", "Coaxing", "S", "D", "Rapport leads; concealed intent gently steers the target."),
  vibe("EB", "Steadfast", "E", "B", "Understanding leads; opposition makes the speaker emotionally aware but immovable."),
  vibe("EA", "Boundaried", "E", "A", "Understanding leads; decisive force establishes a clear limit or next move."),
  vibe("ES", "Communal", "E", "S", "Understanding leads; affiliation turns shared feeling into collective action."),
  vibe("ED", "Deflecting", "E", "D", "Understanding leads; emotional recognition redirects attention or avoids the real issue."),
  vibe("DB", "Bluffing", "D", "B", "Interpretive control leads; hostility is projected through uncertain or false threat."),
  vibe("DA", "Predatory", "D", "A", "Interpretive control leads; concealed intent advances toward an exposed weakness."),
  vibe("DS", "Insinuating", "D", "S", "Interpretation leads; implication travels through friendly or social framing."),
  vibe("DE", "Feigning", "D", "E", "Interpretive control leads; simulated understanding or care conceals the real motive."),
]);

export const DELIVERY_INTENSITIES = Object.freeze(["SUBTLE", "BALANCED", "OVERT"]);
export const SPEECH_ACTS = Object.freeze(["DEAL", "PRESSURE", "ASK"]);

export const ACTION_INVARIANTS = Object.freeze({
  DEAL: Object.freeze(["OFFER", "RETURN"]),
  PRESSURE: Object.freeze(["DEMAND", "CONSEQUENCE"]),
  ASK: Object.freeze(["REQUEST"]),
});

export function generateMatrix() {
  return SPEECH_ACTS.flatMap((speechAct) => BASED_VIBES.flatMap((entry) => DELIVERY_INTENSITIES.map((deliveryIntensity) => ({
    key: `${speechAct}_${entry.vibeId}_${deliveryIntensity}`,
    vibeId: entry.vibeId,
    speechAct,
    deliveryIntensity,
    actionInvariant: [...ACTION_INVARIANTS[speechAct]],
    candidateAnchorIds: [],
    universalFallbackId: null,
    allowedProtocolIds: [],
    preferredProtocolIds: [],
    excludedProtocolIds: [],
    requiredContextOrLoreFacts: [],
    forbiddenSemanticAdditions: ["unauthored_threat", "unauthored_promise", "unauthored_deadline", "unauthored_knowledge", "unauthored_consequence"],
    reviewStatus: "UNMAPPED",
    provenance: { source: "AUTHORED_PROJECT_COMPATIBILITY", schemaVersion: "dpa-keyword-foundation@0.1" },
  }))));
}

export function parseAuthoredAnchors(markdown) {
  const anchors = [];
  let currentAct = null;
  for (const [index, rawLine] of markdown.split(/\r?\n/).entries()) {
    const heading = rawLine.match(/^##\s+\d+\.\s+(DEAL|PRESSURE|ASK) matrix/i);
    if (heading) { currentAct = heading[1].toUpperCase(); continue; }
    if (!currentAct || !rawLine.trim().startsWith(`| ${currentAct}_`)) continue;
    const fields = rawLine.trim().split("|").slice(1, -1).map((field) => field.trim().replace(/^`|`$/g, ""));
    if (fields.length !== 5 || !fields[0].startsWith(`${currentAct}_`)) continue;
    const [key, vibeName, subtle, balanced, overt] = fields;
    const vibeId = key.split("_")[1];
    anchors.push({
      anchorId: `ANCHOR_${key}`,
      matrixKeyPrefix: key,
      sourceLine: index + 1,
      projectAuthored: true,
      status: "CANDIDATE",
      speechAct: currentAct,
      vibeId,
      vibeName,
      lines: { SUBTLE: subtle, BALANCED: balanced, OVERT: overt },
      audit: auditAnchor(`${subtle} ${balanced} ${overt}`, currentAct),
      provenance: { sourceId: "project-authored-180-lines", sourceVersion: "0.1", sourceRecordId: key, transformVersion: "anchor-parser@0.1", licenseId: "PROJECT_AUTHORED" },
    });
  }
  return anchors;
}

export function auditAnchor(text, speechAct) {
  const lower = text.toLowerCase();
  const claimRequirements = [];
  const add = (requiredFact, reason) => { if (!claimRequirements.some((entry) => entry.requiredFact === requiredFact)) claimRequirements.push({ requiredFact, reason }); };
  if (/everyone|everybody|people|room|crowd|watching|audience/.test(lower)) add("AUDIENCE_OR_PUBLIC_CONTEXT", "The anchor implies an audience or public visibility.");
  if (/friend|friends|between us|real friend/.test(lower)) add("FRIENDSHIP_OR_RELATIONSHIP", "The anchor asserts friendship or a social bond.");
  if (/now|time|quick|before|already in motion|wait|tomorrow|deadline/.test(lower)) add("TIME_OR_DEADLINE", "The anchor asserts urgency, timing, or a deadline.");
  if (/know|understand|hear|feel|noticed|watching|believe|told/.test(lower)) add("SPEAKER_KNOWLEDGE_OR_PERSPECTIVE", "The anchor asserts knowledge, evidence, or perspective.");
  if (/care|protect|helping|save|harm|safe/.test(lower)) add("PROTECTION_OR_CARE", "The anchor asserts protection, care, or harm.");
  if (/consequence|alternative|other option|only option|exposed|vulnerable|trap|quiet|unmentioned|unsaid|daylight|talk about/.test(lower)) add("LEVERAGE_OR_CONSEQUENCE", "The anchor asserts leverage, vulnerability, secrecy, or consequence.");
  if (/should|right thing|decent|everyone needs|for all|prove|exactly who/.test(lower)) add("NORM_OR_JUDGMENT", "The anchor asserts a norm, judgment, or accusation.");
  if (speechAct === "ASK" && /or|unless|yes or no|don't make me|patience|liar|couldn't|what a real friend/.test(lower)) add("POSSIBLE_ASK_TO_PRESSURE_DRIFT", "The ASK wording may remove refusal space or introduce social pressure.");
  return { gated: claimRequirements.length > 0, claimRequirements, reviewNote: "Candidate anchor only; contextual claims require exact authored fact gates before approval." };
}

export function loadAuthoredAnchors() {
  const path = fileURLToPath(new URL("../docs/source-context/originals/BASED_MESSAGE_BUILDER_180_TPL_MATRIX_V01(2).md", import.meta.url));
  return parseAuthoredAnchors(readFileSync(path, "utf8"));
}

export function buildMatrixWithAnchors() {
  const matrix = generateMatrix();
  const anchors = loadAuthoredAnchors();
  const anchorByActVibe = new Map(anchors.map((anchor) => [`${anchor.speechAct}_${anchor.vibeId}`, anchor]));
  return matrix.map((cell) => {
    const anchor = anchorByActVibe.get(`${cell.speechAct}_${cell.vibeId}`);
    const requiredContextOrLoreFacts = (anchor?.audit.claimRequirements ?? []).map(({ requiredFact, reason }) => ({
      requiredFact,
      reason,
      sourceAnchorId: anchor.anchorId,
    }));
    return {
      ...cell,
      candidateAnchorIds: [anchor?.anchorId].filter(Boolean),
      requiredContextOrLoreFacts,
    };
  });
}

export function validateBased() {
  const errors = [];
  if (BASED_CUES.length !== 5 || new Set(BASED_CUES.map((entry) => entry.cueId)).size !== 5) errors.push("cue_count");
  if (BASED_VIBES.length !== 20 || new Set(BASED_VIBES.map((entry) => entry.vibeId)).size !== 20) errors.push("vibe_count");
  if (BASED_VIBES.some((entry) => entry.primaryCue === entry.secondaryCue)) errors.push("self_pair");
  const matrix = generateMatrix();
  if (matrix.length !== 180 || new Set(matrix.map((entry) => entry.key)).size !== 180) errors.push("matrix_count");
  if (matrix.some((entry) => entry.reviewStatus !== "UNMAPPED")) errors.push("matrix_not_unmapped");
  if (matrix.some((entry) => JSON.stringify(entry.actionInvariant) !== JSON.stringify(ACTION_INVARIANTS[entry.speechAct]))) errors.push("action_invariant");
  if (matrix.some((entry) => "lead_weight" in entry || "secondary_weight" in entry || "cueShare" in entry)) errors.push("numeric_cue_authority");
  if (DELIVERY_INTENSITIES.some((entry) => !["SUBTLE", "BALANCED", "OVERT"].includes(entry))) errors.push("intensity_alias");
  const anchored = buildMatrixWithAnchors();
  if (anchored.some((entry) => entry.candidateAnchorIds.length !== 1)) errors.push("anchor_coverage");
  if (anchored.some((entry) => entry.requiredContextOrLoreFacts.some((gate) => !gate.requiredFact || !gate.reason || !gate.sourceAnchorId))) errors.push("anchor_fact_gate_shape");
  return errors;
}
