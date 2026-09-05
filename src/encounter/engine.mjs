import { BASED_VIBES, DELIVERY_INTENSITIES } from "../based.mjs";
import { METRIC_DEFINITIONS, PRICE, TOPICS, availableActions } from "./state.mjs";
import { evaluateTurn } from "./marcus-policy.mjs";
import { PERSONALITY } from "./marcus-profile.mjs";
import { playerMessage, marcusMessage } from "./messages.mjs";

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
export function validateTerms(state, terms) {
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
  exactObject(input, ["requestId", "runId", "version", "action", "vibeId", "intensity", ...fields[input.action]]);
  validateIdentity(state, input);
  requireThat(state.status === "OPEN", "This encounter has ended.", 409);
  requireThat(BASED_VIBES.some(v => v.vibeId === input.vibeId), "Unknown BASED Vibe.");
  requireThat(DELIVERY_INTENSITIES.includes(input.intensity), "Unknown delivery intensity.");
  if (input.action === "ASK") requireThat(TOPICS.some(t => t.id === input.topic), "Unknown ASK topic.");
  if (input.action === "DEAL") validateTerms(state, input.terms);
  if (input.action === "ACCEPT") {
    const offer = state.counteroffer;
    requireThat(offer && input.offerId === offer.id && input.offerVersion === offer.version, "No matching current offer; stale or forged acceptance.", 409);
    validateTerms(state, offer.terms);
  }
}

export function transition(state, input) {
  validateIntent(state, input);
  const next = structuredClone(state);
  const before = structuredClone(state.metrics);
  const intent = structuredClone(input);
  const offer = state.counteroffer;
  next.counteroffer = null;
  let decision;
  if (input.action === "ACCEPT") {
    const terms = validateTerms(state, offer.terms);
    next.metrics.cash -= terms.upfront;
    next.metrics.marcusStock -= terms.units;
    next.metrics.playerStock += terms.units;
    next.obligations.principal += terms.repayment;
    next.obligations.extra += terms.extra;
    next.obligations.days = terms.days;
    next.status = "AGREED";
    next.agreement = { ...structuredClone(offer), obligations: structuredClone(next.obligations) };
    decision = { outcome: "AGREED", social: {}, reasons: ["Accepted the exact current offer. Cash and Contra transferred atomically once; existing debt was retained."], based: { contribution: 0, reason: "Delivery cannot alter accepted terms." }, derived: {} };
  } else if (input.action === "WALK") {
    next.status = "WITHDRAWN";
    decision = { outcome: "WITHDRAWN", social: {}, reasons: ["Player ended negotiations. No resources transferred."], based: { contribution: 0, reason: "Withdrawal remains available regardless of delivery." }, derived: {} };
  } else {
    // Policy receives a private clone so no policy mutation can change authoritative state.
    decision = evaluateTurn(structuredClone(state), structuredClone(input));
    requireThat(["ANSWER", "ACCEPT", "COUNTER", "REJECT", "END"].includes(decision.outcome), "Invalid authored policy outcome.", 500);
    for (const key of ["confidence", "tension", "patience"]) {
      const delta = decision.social[key] ?? 0;
      requireThat(Number.isFinite(delta), "Invalid policy social delta.", 500);
      const def = METRIC_DEFINITIONS.find(d => d.key === key);
      next.metrics[key] = Math.max(def.min, Math.min(def.max, before[key] + delta));
    }
    if (input.action === "DEAL") next.proposal = { id: `${state.runId}:proposal:${input.version + 1}`, version: input.version + 1, terms: structuredClone(input.terms), source: "PLAYER" };
    if (decision.outcome === "END" || next.metrics.patience === 0 || next.metrics.tension >= 90) {
      next.status = "ENDED";
      decision.outcome = "END";
      decision.reasons.push("Negotiations ended: patience exhausted, tension reached 90, or Marcus declined further discussion.");
    } else if (decision.outcome === "ACCEPT" || decision.outcome === "COUNTER") {
      requireThat(decision.outcome !== "ACCEPT" || input.action === "DEAL", "Policy cannot approve missing terms.", 500);
      const terms = validateTerms(next, decision.outcome === "ACCEPT" ? input.terms : decision.counterTerms);
      next.counteroffer = { id: `${state.runId}:offer:${input.version + 1}`, version: input.version + 1, terms, source: decision.outcome === "ACCEPT" ? "APPROVED_PROPOSAL" : "MARCUS" };
    }
    if (decision.clue && !next.clues.includes(decision.clue)) next.clues.push(decision.clue);
  }
  next.metrics.debt = next.obligations.existing + next.obligations.principal + next.obligations.extra;
  const after = structuredClone(next.metrics);
  const deltas = Object.fromEntries(METRIC_DEFINITIONS.map(d => [d.key, after[d.key] - before[d.key]]));
  const playerText = playerMessage(intent, { price: PRICE, offer });
  const marcusText = input.action === "ACCEPT" ? "Done. The Contra is yours. The old debt stays, and these new terms stand." : input.action === "WALK" ? "Then we leave it here. You still owe what you owed." : marcusMessage(next, intent, decision);
  next.events.push({ intent, playerText, marcusText, outcome: decision.outcome, before, after, deltas, reasons: decision.reasons, based: decision.based, derived: decision.derived });
  return next;
}

export function projectState(state, csrf) {
  const { cash, debt, marcusStock, playerStock } = state.metrics;
  return { csrf,
    play: { runId: state.runId, version: state.events.length, seed: state.seed, status: state.status,
      metrics: { cash, debt, marcusStock, playerStock }, obligations: state.obligations,
      proposal: state.proposal, counteroffer: state.counteroffer, agreement: state.agreement, clues: state.clues,
      events: state.events.map(({ playerText, marcusText, outcome }) => ({ playerText, marcusText, outcome })), availableActions: availableActions(state) },
    debug: { state, latestTurn: state.events.at(-1) ?? null, personality: PERSONALITY },
    options: { vibes: BASED_VIBES, intensities: DELIVERY_INTENSITIES, topics: TOPICS, metricDefinitions: METRIC_DEFINITIONS, price: PRICE } };
}
