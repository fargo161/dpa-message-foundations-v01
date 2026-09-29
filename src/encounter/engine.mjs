import { BASED_VIBES, DELIVERY_INTENSITIES } from "../based.mjs";
import { METRIC_DEFINITIONS, PRICE, TOPICS, availableActions } from "./state.mjs";
import { evaluateTurn } from "./marcus-policy.mjs";
import { PERSONALITY } from "./marcus-profile.mjs";
import { marcusMessage } from "./messages.mjs";
import { hasLoreFact, informationEligibility, loreOptions, projectLore } from "./knowledge.mjs";
import { resolveInformation } from "./information-policy.mjs";
import { advanceMarcusWorld, projectMarcusEconomy } from "./marcus-world.mjs";
import { projectPlayerInformation, marcusDecisionContext } from "./marcus-world-adapter.mjs";
import { conversationView, reactionCause } from "./conversation.mjs";
import { keywordBank } from "../conversation/keyword-bank.mjs";
import { resolveContextAction } from "../conversation/context-actions.mjs";
import { FACE_CATALOG } from "../conversation/face/catalog.mjs";
import { openingFace, buildFaceTurn } from "../conversation/face/policy.mjs";
import { buildPlayerFrame, renderPlayerFrame } from "../conversation/language/realizer.mjs";
import { createLanguageAuthority } from "../conversation/encounter-language-authority.mjs";
import { SCENARIO_OPTIONS, languageReadiness } from "../conversation/contracts.mjs";
import { edgeView } from "../conversation/edge.mjs";
import { describeDelivery } from "../conversation/delivery-description.mjs";

// Only this adapter issues its bindings, after the ordinary engine validators.
const languageAuthority = createLanguageAuthority();

export class EncounterError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function requireThat(condition, message, status = 400) {
  if (!condition) throw new EncounterError(message, status);
}
export function exactObject(value, keys) {
  requireThat(value && typeof value === "object" && !Array.isArray(value), "Expected an object.");
  requireThat(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)), "Unexpected or missing fields.");
}
export function validateIdentity(state, input) {
  requireThat(typeof input.requestId === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(input.requestId), "Invalid request identity.");
  requireThat(input.runId === state.runId, "This request belongs to another or expired run.", 409);
  requireThat(Number.isSafeInteger(input.version) && input.version === state.events.length, "Stale encounter version; refresh before acting.", 409);
}
export function validateSeed(seed) {
  requireThat(typeof seed === "string" && seed.length > 0 && seed.length <= 80 && !/[\u0000-\u001f\u007f]/.test(seed), "Seed must contain 1–80 printable characters.");
  return seed;
}
function withWorldEconomy(state) {
  const economy = projectMarcusEconomy(state.world);
  return { ...state, metrics: { ...state.metrics, ...economy.metrics }, obligations: economy.obligations };
}
export function validateTerms(state, terms) {
  state = withWorldEconomy(state);
  exactObject(terms, ["units", "upfront", "repayment", "extra", "days"]);
  for (const key of ["units", "upfront", "repayment", "extra", "days"]) {
    requireThat(Number.isSafeInteger(terms[key]), `${key} must be a finite whole number.`);
  }
  requireThat(terms.units >= 1 && terms.units <= 8, "Contra units must be between 1 and 8.");
  requireThat(terms.days >= 1 && terms.days <= 30, "Repayment term must be 1–30 days.");
  for (const key of ["upfront", "repayment", "extra"]) requireThat(terms[key] >= 0 && terms[key] <= 10000, `${key} must be between 0 and 10000.`);
  requireThat(terms.units <= state.metrics.marcusStock, "Marcus does not have that much Contra.");
  requireThat(state.metrics.playerStock + terms.units <= 100, "Player Contra capacity would be exceeded.");
  requireThat(terms.upfront <= state.metrics.cash, "You do not have that much cash. Future profits are not cash.");
  requireThat(terms.upfront <= terms.units * PRICE, "Upfront cash cannot exceed the Contra price.");
  requireThat(terms.repayment === terms.units * PRICE - terms.upfront, "Remaining repayment must equal Contra price minus upfront cash.");
  requireThat(state.obligations.existing + state.obligations.principal + state.obligations.extra + terms.repayment + terms.extra <= 100000, "Outstanding debt limit would be exceeded.");
  return structuredClone(terms);
}
function validateIntent(state, input) {
  const fields = { ASK: ["topic"], DEAL: ["terms"], ACCEPT: ["offerId", "offerVersion"], WALK: [] };
  requireThat(typeof input?.action === "string" && Object.hasOwn(fields, input.action), "Unknown encounter action.");
  const optional = input.action === "DEAL" && Object.hasOwn(input, "information") ? ["information"] : [];
  const contextFields = Object.hasOwn(input, "keywordId") || Object.hasOwn(input, "contextActionId") ? ["keywordId", "contextActionId"] : [];
  exactObject(input, ["requestId", "runId", "version", "action", "vibeId", "intensity", ...fields[input.action], ...optional, ...contextFields]);
  if (optional.length) requireThat(["NONE", "OFFER_INFORMATION"].includes(input.information), "Unknown information exchange choice.");
  validateIdentity(state, input);
  requireThat(state.status === "OPEN", "This encounter has ended.", 409);
  requireThat(BASED_VIBES.some(v => v.vibeId === input.vibeId), "Unknown BASED Vibe.");
  requireThat(DELIVERY_INTENSITIES.includes(input.intensity), "Unknown delivery intensity.");
  if (input.action === "ASK") {
    requireThat([...TOPICS, ...loreOptions(state), { id: "CLARIFY_OFFER" }].some(t => t.id === input.topic), "Unknown ASK topic.");
    if (input.topic === "CLARIFY_OFFER") requireThat(!!state.counteroffer, "No current offer to clarify.", 409);
  }
  if (input.action === "DEAL") validateTerms(state, input.terms);
  if (input.action === "ACCEPT") {
    const offer = state.counteroffer;
    requireThat(offer && input.offerId === offer.id && input.offerVersion === offer.version, "No matching current offer; stale or forged acceptance.", 409);
    validateTerms(state, offer.terms);
  }
  const eligibility = informationEligibility(state, input);
  requireThat(eligibility.allowed, eligibility.reason);
  if (contextFields.length) {
    let expected;
    try { expected = resolveContextAction(state, input.keywordId, input.contextActionId); }
    catch (error) { throw new EncounterError(error.message); }
    requireThat(Object.entries(expected).every(([key, value]) => (key === "information" ? input.information ?? "NONE" : input[key]) === value), "Selected subject/action does not match the submitted intent.");
  }
}

function authorizedPlayerLine(state, input, mode) {
  languageReadiness(mode);
  const frame = buildPlayerFrame(state, input);
  const binding = languageAuthority.issue(frame, { runId: state.runId, version: state.events.length });
  const authorized = languageAuthority.read(binding);
  return renderPlayerFrame(authorized.frame, { vibeId: input.vibeId, intensity: input.intensity, mode, variantSeed: `${state.seed}:${state.events.length}` });
}

/** Pure preview: no evaluation, information resolution, event, or nonce consumption. */
export function previewIntent(state, input, { languageMode = "PRODUCTION" } = {}) {
  state = withWorldEconomy(state);
  validateIntent(state, input);
  const line = authorizedPlayerLine(state, input, languageMode);
  return { runId: state.runId, version: state.events.length, playerText: line.text,
    delivery: { vibeId: input.vibeId, intensity: input.intensity }, readiness: languageReadiness(languageMode),
    renderingStatus: line.readiness,
    deliveryDescription: describeDelivery({ vibeId: input.vibeId, intensity: input.intensity, action: input.action, topic: input.topic, renderingStatus: line.readiness }) };
}

export function transition(state, input, { languageMode = "PRODUCTION" } = {}) {
  state = withWorldEconomy(state);
  validateIntent(state, input);
  const line = authorizedPlayerLine(state, input, languageMode);
  const next = structuredClone(state);
  const before = structuredClone(state.metrics);
  const intent = structuredClone(input);
  const offer = state.counteroffer;
  const clarification = intent.action === "ASK" && intent.topic === "CLARIFY_OFFER";
  const informationEffect = resolveInformation(structuredClone(state), structuredClone(input));
  next.world = informationEffect.world;
  next.informationLocal = informationEffect.informationLocal;
  if (!clarification) next.counteroffer = null;
  let decision;
  if (input.action === "ACCEPT") {
    validateTerms(state, offer.terms);
    const economy = projectMarcusEconomy(next.world);
    Object.assign(next.metrics, economy.metrics);
    next.obligations = economy.obligations;
    next.status = "AGREED";
    next.agreement = { ...structuredClone(offer), obligations: structuredClone(next.obligations) };
    decision = { outcome: "AGREED", social: {}, reasons: ["Accepted the exact current offer. Cash and Contra transferred atomically once; existing debt was retained."], based: { contribution: 0, reason: "Delivery cannot alter accepted terms." }, derived: {} };
  } else if (input.action === "WALK") {
    next.status = "WITHDRAWN";
    decision = { outcome: "WITHDRAWN", social: {}, reasons: ["Player ended negotiations. No resources transferred."], based: { contribution: 0, reason: "Withdrawal remains available regardless of delivery." }, derived: {} };
  } else {
    // Policy receives a private clone so no policy mutation can change authoritative state.
    decision = clarification
      ? { outcome: "ANSWER", social: { confidence: 0, tension: 0, patience: -1 - Math.min(2, state.events.filter(e => e.intent.topic === "CLARIFY_OFFER").length) }, reasons: ["Pure clarification preserves the current offer's identity, terms and information exchange. It consumes patience and gives no social reward."], based: { contribution: { confidence: 0, tension: 0 }, reason: "Clarification cannot alter terms." }, derived: { progressKey: "NONE", meaningfulProgress: false } }
      : evaluateTurn(marcusDecisionContext(state), structuredClone(input), structuredClone({ social: informationEffect.social, progressKey: informationEffect.progressKey, scoreBonus: informationEffect.scoreBonus, exchange: informationEffect.exchange }));
    requireThat(["ANSWER", "ACCEPT", "COUNTER", "REJECT", "END"].includes(decision.outcome), "Invalid authored policy outcome.", 500);
    for (const key of ["confidence", "tension", "patience"]) {
      const delta = decision.social[key] ?? 0;
      requireThat(Number.isFinite(delta), "Invalid policy social delta.", 500);
      const def = METRIC_DEFINITIONS.find(d => d.key === key);
      next.metrics[key] = Math.max(def.min, Math.min(def.max, before[key] + delta));
    }
    if (input.action === "DEAL") next.proposal = { id: `${state.runId}:proposal:${input.version + 1}`, version: input.version + 1, terms: structuredClone(input.terms), source: "PLAYER", informationExchange: informationEffect.exchange };
    if (decision.outcome === "END" || next.metrics.patience === 0 || next.metrics.tension >= 90) {
      next.status = "ENDED";
      next.counteroffer = null;
      decision.outcome = "END";
      decision.reasons.push("Negotiations ended: patience exhausted, tension reached 90, or Marcus declined further discussion.");
    } else if (decision.outcome === "ACCEPT" || decision.outcome === "COUNTER") {
      requireThat(decision.outcome !== "ACCEPT" || input.action === "DEAL", "Policy cannot approve missing terms.", 500);
      const terms = validateTerms(next, decision.outcome === "ACCEPT" ? input.terms : decision.counterTerms);
      next.counteroffer = { id: `${state.runId}:offer:${input.version + 1}`, version: input.version + 1, terms, source: decision.outcome === "ACCEPT" ? "APPROVED_PROPOSAL" : "MARCUS", informationExchange: informationEffect.exchange };
    }
    if (decision.clue && !next.clues.includes(decision.clue)) next.clues.push(decision.clue);
  }
  const committed = ["AGREED", "WITHDRAWN", "ENDED"].includes(next.status) ? advanceMarcusWorld(state, input, { status: next.status }) : informationEffect;
  next.world = committed.world;
  next.informationLocal = committed.informationLocal;
  const economy = projectMarcusEconomy(next.world);
  Object.assign(next.metrics, economy.metrics);
  next.obligations = economy.obligations;
  next.phase = next.status !== "OPEN" ? "RESOLUTION" : input.action === "DEAL" || state.phase === "NEGOTIATION" ? "NEGOTIATION" : input.topic === "SMALL_TALK" && state.phase === "CONTACT" ? "CONTACT" : "BUSINESS";
  const after = structuredClone(next.metrics);
  const deltas = Object.fromEntries(METRIC_DEFINITIONS.map(d => [d.key, after[d.key] - before[d.key]]));
  decision.feedback = informationEffect.feedback;
  const baseFacts = input.action === "DEAL" || input.action === "ACCEPT" ? ["STOCK_TITLE", "OLD_ACCOUNT"]
    : ({ DEBT: ["OLD_ACCOUNT"], RISK: ["STOCK_TITLE"], TERMS: ["STOCK_TITLE"], GUARANTEE: ["OLD_ACCOUNT"], ENTITLEMENT: ["STOCK_TITLE"], CLARIFY_OFFER: ["STOCK_TITLE", "OLD_ACCOUNT"] }[input.topic] ?? []);
  const facts = baseFacts.filter(id => hasLoreFact(state, id));
  informationEffect.causes.push({ kind: clarification ? "OFFER_CLARIFIED" : input.action === "DEAL" ? "PROPOSAL_EVALUATED" : "INTENT_RESOLVED", factIds: facts, consequence: decision.outcome, turn: input.version + 1 });
  if (decision.derived.meaningfulProgress === false) informationEffect.causes.push({ kind: "NO_NEW_PROGRESS", factIds: facts, consequence: "No repeat positive social benefit was authorized.", turn: input.version + 1 });
  if (next.phase !== state.phase) informationEffect.causes.push({ kind: "PHASE_ADVANCED", factIds: [], consequence: `${state.phase} -> ${next.phase}`, turn: input.version + 1 });
  decision.factIds = [...new Set(informationEffect.causes.flatMap(c => c.factIds ?? []))];
  decision.informationCauses = informationEffect.causes;
  decision.reasons.push(...informationEffect.causes.filter(c => c.kind !== "INTENT_RESOLVED").map(c => c.consequence));
  const playerText = line.text;
  const marcusText = marcusMessage(next, intent, decision, { mode: languageMode, variantSeed: `${state.seed}:${state.events.length}` });
  const progressKey = decision.derived.progressKey === "NONE" ? null : decision.derived.progressKey ?? informationEffect.progressKey;
  decision.progressKey = progressKey;
  const cause = reactionCause(next, intent, decision, informationEffect);
  const event = { worldEventIds: committed.worldEventIds, intent, playerText, marcusText, outcome: decision.outcome, before, after, deltas, reasons: decision.reasons, based: decision.based, derived: decision.derived, progressKey, informationCauses: informationEffect.causes, feedback: informationEffect.feedback, reactionCause: cause, characterId: "marcus", faces: null };
  event.faces = buildFaceTurn(event, state.events.at(-1)?.faces?.responding ?? openingFace());
  next.events.push(event);
  return next;
}

export function projectState(state, csrf, { languageMode = "PRODUCTION" } = {}) {
  state = withWorldEconomy(state);
  const player = projectPlayerInformation(state);
  const { cash, debt, marcusStock, playerStock } = state.metrics;
  // Offer identity is needed for confirmation; internal lore bindings are Debug-only.
  const publicOffer = offer => {
    if (!offer) return null;
    const projected = structuredClone(offer);
    if (projected.informationExchange) projected.informationExchange = { summary: projected.informationExchange.summary };
    return projected;
  };
  const lore = projectLore(state);
  const topics = [...TOPICS.map(t => {
    const eligibility = informationEligibility(state, { action: "ASK", topic: t.id });
    return { ...t, available: state.status === "OPEN" && eligibility.allowed, reason: eligibility.reason };
  }), ...loreOptions(state), { id: "CLARIFY_OFFER", label: "Clarify the current offer (keeps its terms open)", available: state.status === "OPEN" && !!state.counteroffer, reason: state.counteroffer ? "Ask about the current terms without changing them." : "No current offer." }];
  const actions = availableActions(state).map(a => {
    if (!a.available) return a;
    const eligibility = informationEligibility(state, { action: a.action });
    return { ...a, available: eligibility.allowed, reason: eligibility.reason };
  });
  return { csrf,
    play: { runId: state.runId, version: state.events.length, seed: state.seed, status: state.status,
      character: { id: "marcus", name: "Marcus ‘Broker’ Hill" }, scenario: SCENARIO_OPTIONS[0],
      situation: { summary: `You owe Marcus $${state.obligations.existing} on the old account. You want more Contra.${hasLoreFact(state, "MISSED_CHECKIN") ? " You missed yesterday's check-in." : ""}${!!player.privateFactId ? " Information you hold may affect this conversation; track what has been shared in Your edge." : ""}`, objective: "Suggested challenge: acquire at least two Contra units using some new credit. Compare cash retained, new debt and repayment time; you can choose a smaller deal or walk away." },
      edge: edgeView(state),
      face: structuredClone(state.events.at(-1)?.faces?.responding ?? openingFace()),
      metrics: { cash, debt, marcusStock, playerStock }, obligations: state.obligations,
      proposal: publicOffer(state.proposal), counteroffer: publicOffer(state.counteroffer), agreement: publicOffer(state.agreement), clues: state.clues,
      lore, conversation: conversationView(state),
      events: state.events.map(({ playerText, marcusText, outcome, feedback, intent, reactionCause: cause, faces }) => ({ playerText, marcusText, outcome, feedback,
        turnRef: cause.turnRef, action: intent.action, vibeId: intent.vibeId, intensity: intent.intensity, faces: structuredClone(faces) })), availableActions: actions },
    debug: { state, latestTurn: state.events.at(-1) ?? null, personality: PERSONALITY },
    options: { vibes: BASED_VIBES, intensities: DELIVERY_INTENSITIES, topics, informationOptions: lore.informationOptions, metricDefinitions: METRIC_DEFINITIONS, price: PRICE,
      keywords: keywordBank(state), faceCatalog: FACE_CATALOG, scenarios: SCENARIO_OPTIONS, languageReadiness: languageReadiness(languageMode) } };
}
