import { informationEligibility, informationPlayerText, privateInformation } from "../../encounter/knowledge.mjs";
import { LORE_TOPICS } from "../../encounter/history-content.mjs";

export const QUESTIONS = Object.freeze({
  TERMS: "What would it take to get more Contra on credit?",
  DEBT: "I still owe you money, and future profits are uncertain. How does that affect another deal?",
  RISK: "It's your stock and money on the line. What would make the risk worth it?",
  PRIORITIES: "What matters most to you in this negotiation?",
  FINAL_SAY: "Would you rather set the counterterms yourself?",
  GUARANTEE: "My future profits are guaranteed. Does that reassure you?",
  ENTITLEMENT: "Why won't you simply trust me with more stock?",
  CLARIFY_OFFER: "Run through the offer again, including any information we're trading. I'm not changing the terms.",
});

export const describeTerms = terms => `${terms.units} Contra ${terms.units === 1 ? "unit" : "units"}, $${terms.upfront} upfront, $${terms.repayment} in new credit plus $${terms.extra} extra due in ${terms.days} ${terms.days === 1 ? "day" : "days"}`;
export const describeProposal = terms => `${terms.units} Contra ${terms.units === 1 ? "unit" : "units"}, $${terms.upfront} upfront, $${terms.repayment} in new credit at your extra charge, due in ${terms.days} ${terms.days === 1 ? "day" : "days"}`;
export const requireLanguage = (value, message) => { if (!value) throw new Error(`Language frame: ${message}`); };
const exactKeys = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === [...keys].sort().join();
const whole = value => Number.isSafeInteger(value) && value >= 0;

export function validateLanguageTerms(terms) {
  requireLanguage(exactKeys(terms, ["units", "upfront", "repayment", "extra", "days"]), "invalid terms fields");
  requireLanguage(Object.values(terms).every(whole) && terms.units > 0 && terms.days > 0, "invalid terms values");
  return terms;
}

/** Pure speech draft: never calls the social policy or information resolver. */
export function buildPlayerFrame(state, intent) {
  requireLanguage(state && intent && ["ASK", "DEAL", "ACCEPT", "WALK"].includes(intent.action), "unsupported action");
  requireLanguage(state.status === "OPEN", "conversation is closed");
  const action = intent.action;
  const topic = action === "ASK" ? intent.topic : null;
  const oldDebt = state.obligations?.existing ?? state.metrics?.debt;
  requireLanguage(whole(oldDebt), "missing existing debt");
  if (state.world) {
    const eligibility = informationEligibility(state, intent);
    requireLanguage(eligibility.allowed, eligibility.reason);
  }
  let terms = null;
  let offerId = null;
  let offerVersion = null;
  let informationText = "";
  let disclosure = "NONE";
  if (action === "ASK") {
    informationText = state.world ? informationPlayerText(state, intent) : "";
    requireLanguage(!!QUESTIONS[topic] || !!informationText, "unsupported question");
    if (topic === "CLARIFY_OFFER") requireLanguage(state.counteroffer?.terms, "no current offer to clarify");
    if (["R17_SHOW", "DISCLOSE_FULL"].includes(topic)) {
      requireLanguage(privateInformation(state), "speaker does not know the private detail");
      disclosure = "FULL";
    } else if (["R17_HINT", "DISCLOSE_PARTIAL"].includes(topic)) disclosure = "CATEGORY";
    else if (topic === "VERIFY_SOURCE") disclosure = "SOURCE_ONLY";
  }
  if (action === "DEAL") {
    terms = structuredClone(validateLanguageTerms(intent.terms));
    requireLanguage(!intent.information || ["NONE", "OFFER_INFORMATION"].includes(intent.information), "unknown information selection");
    if (intent.information === "OFFER_INFORMATION") {
      requireLanguage(state.world && privateInformation(state), "speaker has no information to offer");
      informationText = informationPlayerText(state, intent);
      disclosure = "CONDITIONAL_ONLY";
    }
  }
  if (action === "ACCEPT" || topic === "CLARIFY_OFFER") {
    const offer = state.counteroffer;
    requireLanguage(offer && typeof offer.id === "string" && whole(offer.version), "no current identified offer");
    terms = structuredClone(validateLanguageTerms(offer.terms));
    offerId = offer.id;
    offerVersion = offer.version;
    if (action === "ACCEPT" && offer.informationExchange) {
      const fact = privateInformation(state);
      requireLanguage(fact && offer.informationExchange.factId === fact.id, "information exchange does not match speaker knowledge");
      informationText = `I deliver the agreed information: ${fact.proposition}`;
      disclosure = "FULL_ON_CONFIRMATION";
    }
  }
  const semanticFacts = { schemaVersion: "encounter-speech@1", action, topic, oldDebt, terms, offerId, offerVersion, informationText, disclosure };
  const frame = { id: `player:${action}:${topic ?? "NONE"}`, actorId: "PLAYER", targetId: "MARCUS", text: playerCore(semanticFacts), semanticFacts };
  validatePlayerFrame(frame);
  return frame;
}

function playerCore(facts) {
  if (facts.action === "ASK") return facts.informationText || QUESTIONS[facts.topic];
  if (facts.action === "DEAL") return `I propose ${describeProposal(facts.terms)}. This is in addition to my existing debt.${facts.informationText ? ` ${facts.informationText}` : ""}`;
  if (facts.action === "ACCEPT") return `I accept the current offer: ${describeTerms(facts.terms)}. My existing debt remains separate.${facts.informationText ? ` ${facts.informationText}` : ""}`;
  return "I am walking away from this negotiation.";
}

export function validatePlayerFrame(frame) {
  requireLanguage(exactKeys(frame, ["id", "actorId", "targetId", "text", "semanticFacts"]), "invalid frame fields");
  const facts = frame.semanticFacts;
  requireLanguage(exactKeys(facts, ["schemaVersion", "action", "topic", "oldDebt", "terms", "offerId", "offerVersion", "informationText", "disclosure"]), "invalid semantic fields");
  requireLanguage(facts.schemaVersion === "encounter-speech@1" && ["ASK", "DEAL", "ACCEPT", "WALK"].includes(facts.action), "unsupported semantic frame");
  requireLanguage(frame.actorId === "PLAYER" && frame.targetId === "MARCUS" && frame.id === `player:${facts.action}:${facts.topic ?? "NONE"}`, "invalid actor, target or identity");
  requireLanguage(whole(facts.oldDebt) && typeof facts.informationText === "string", "invalid factual values");
  requireLanguage(["NONE", "CATEGORY", "SOURCE_ONLY", "FULL", "CONDITIONAL_ONLY", "FULL_ON_CONFIRMATION"].includes(facts.disclosure), "unknown disclosure boundary");
  if (["DEAL", "ACCEPT"].includes(facts.action) || facts.topic === "CLARIFY_OFFER") validateLanguageTerms(facts.terms);
  else requireLanguage(facts.terms === null, "unexpected terms");
  if (facts.action === "ASK") requireLanguage(typeof facts.topic === "string" && (!!QUESTIONS[facts.topic] || LORE_TOPICS.some(topic => topic.id === facts.topic)), "unsupported question");
  else requireLanguage(facts.topic === null, "unexpected topic");
  if (facts.action === "ACCEPT" || facts.topic === "CLARIFY_OFFER") requireLanguage(typeof facts.offerId === "string" && facts.offerId.length > 0 && whole(facts.offerVersion), "missing offer identity");
  else requireLanguage(facts.offerId === null && facts.offerVersion === null, "unexpected offer identity");
  requireLanguage(typeof frame.text === "string" && frame.text.length > 0 && frame.text === playerCore(facts), "text differs from semantic frame");
  return frame;
}
