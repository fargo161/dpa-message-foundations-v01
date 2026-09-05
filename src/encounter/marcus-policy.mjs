import { BASED_VIBES } from "../based.mjs";
import { PERSONALITY } from "./marcus-profile.mjs";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const sameTerms = (a, b) => ["units", "upfront", "repayment", "extra", "days"].every((key) => a?.[key] === b?.[key]);

// Pure interpretation of validated intent. The engine owns hard validation and transfers.
export function evaluateTurn(state, intent) {
  const config = PERSONALITY.policy;
  const quirk = PERSONALITY.quirks[state.quirk];
  const context = intent.action === "DEAL" || intent.topic === "TERMS" ? "business"
    : ["DEBT", "RISK", "GUARANTEE", "ENTITLEMENT"].includes(intent.topic) ? "accountability" : "probing";
  const reaction = PERSONALITY.reactions[intent.vibeId];
  const canonical = BASED_VIBES.find(({ vibeId }) => vibeId === intent.vibeId);
  if (!reaction || !canonical || !quirk || !Object.hasOwn(config.intensitySalience, intent.intensity)) throw new Error("Invalid policy metadata");
  const history = state.events.map((event) => event.intent).filter(Boolean);
  const repetition = history.filter((old) => old.action === intent.action && (intent.action === "ASK" ? old.topic === intent.topic : sameTerms(old.terms, intent.terms))).length;
  const priorSocialTurns = history.filter((old) => ["ASK", "DEAL"].includes(old.action)).length;
  const salience = config.intensitySalience[intent.intensity];
  const signal = { confidence: Math.round(reaction[context][0] * salience), tension: Math.round(reaction[context][1] * salience) };
  const social = { ...signal, patience: -1 - Math.min(repetition, 2) };
  const reasons = [`${canonical.name}: ${reaction.reading}`, `${intent.intensity} changes signal salience only; proposal facts stay fixed.`];
  const based = { vibeId: canonical.vibeId, name: canonical.name, primaryCue: canonical.primaryCue, secondaryCue: canonical.secondaryCue, fusionLogic: canonical.fusionLogic, intensity: intent.intensity, context, salience, contribution: signal, interpretationApplied: true };
  const derived = { repetition, priorSocialTurns, acceptThreshold: config.acceptThreshold, counterThreshold: config.counterThreshold };
  /** @type {{outcome: string, social: typeof social, reasons: string[], based: typeof based, derived: Record<string, number | boolean>, counterTerms?: {units:number, upfront:number,repayment:number,extra:number,days:number}, clue?:string}} */
  const result = { outcome: "ANSWER", social, reasons, based, derived };
  if (intent.action === "WALK" || intent.action === "ACCEPT") {
    result.outcome = intent.action === "WALK" ? "END" : "ACCEPT";
    result.social = { confidence: 0, tension: 0, patience: 0 };
    result.based = { ...based, contribution: { confidence: 0, tension: 0 }, interpretationApplied: false };
    result.reasons = [intent.action === "WALK" ? "Player ends the negotiation." : "Confirmation of the exact current offer; the engine rechecks identity and resources."];
    return result;
  }
  if (intent.action === "ASK") {
    if (intent.topic === quirk.welcomeTopic) {
      social.confidence += 3; social.tension -= 2;
      reasons.push("This question addresses his particular concern.");
      result.clue = quirk.clue;
    }
    if (intent.topic === "PRIORITIES") result.clue = quirk.clue;
    if (intent.topic === quirk.unwelcomeTopic) {
      social.confidence -= 4; social.tension += 5;
      reasons.push("This framing strikes his particular sore point.");
      result.clue = quirk.clue;
    }
    if (intent.topic === "GUARANTEE") {
      social.confidence -= 2; social.tension += 2;
      reasons.push("Hypothetical profits cannot be guaranteed or counted as available cash.");
    }
    if (intent.topic === "ENTITLEMENT") {
      social.confidence -= 2; social.tension += 3;
      reasons.push("Past borrowing does not entitle the player to more stock.");
    }
  }
  if (state.quirk === "final_say" && ["AS", "EB"].includes(intent.vibeId)) {
    social.tension += Math.round(2 * salience);
    reasons.push("An imposed direction or immovable position leaves him little room for his own terms.");
  }
  if (repetition > 0 || priorSocialTurns >= config.positiveTurnBudget) {
    social.confidence = Math.min(0, social.confidence);
    social.tension = Math.max(0, social.tension);
    reasons.push("Repeated requests or an exhausted opening goodwill budget cannot farm confidence or calm.");
  }
  if (repetition > 0) {
    social.tension += Math.min(6, repetition * 2);
    reasons.push(`This request has already appeared ${repetition} time(s), regardless of Vibe; repetition costs extra patience.`);
  }
  const confidence = clamp(state.metrics.confidence + social.confidence, 0, 100);
  const tension = clamp(state.metrics.tension + social.tension, 0, 100);
  if (state.metrics.patience + social.patience <= 0 || tension >= config.maximumTension) {
    result.outcome = "END";
    reasons.push(tension >= config.maximumTension ? "Tension reached his walk-away limit." : "His patience is exhausted.");
    return result;
  }
  if (intent.action !== "DEAL") return result;
  const { units, upfront, repayment, extra, days } = intent.terms;
  const price = units * config.price;
  const cashShare = upfront / price;
  const exposure = state.metrics.debt + repayment + extra;
  const score = Math.round((cashShare * 35 - repayment * 0.045 + Math.min(extra, repayment * 0.2, 24) * 0.5 - (repayment > 0 ? days * 0.5 : 0) + confidence * 0.2 - tension * 0.22 + 4) * 100) / 100;
  const creditDefensible = repayment === 0 || (cashShare >= config.minimumUpfrontShare && repayment <= config.maximumNewPrincipal && exposure <= config.maximumExposure && days <= config.maximumCreditDays);
  Object.assign(derived, { score, cashShare, exposure, creditDefensible, maximumNewPrincipal: config.maximumNewPrincipal, maximumExposure: config.maximumExposure, maximumCreditDays: config.maximumCreditDays, projectedConfidence: confidence, projectedTension: tension });
  reasons.push(`Derived proposal score ${score}; approval needs ${config.acceptThreshold} and defensible credit.`, "Extra repayment receives limited credit: a large promise cannot replace cash or erase the old debt.");
  if (creditDefensible && score >= config.acceptThreshold) {
    result.outcome = "ACCEPT";
    reasons.push("Marcus approves these terms; no transfer occurs until the player confirms the current offer.");
    return result;
  }
  const counterUnits = Math.min(units, state.metrics.marcusStock, 3);
  const counterPrice = counterUnits * config.price;
  const counterUpfront = Math.min(state.metrics.cash, counterPrice, Math.max(upfront, Math.ceil(counterPrice * config.counterUpfrontShare)));
  const counterRepayment = counterPrice - counterUpfront;
  const counterExtra = Math.ceil(counterRepayment * 0.15);
  const counterTerms = { units: counterUnits, upfront: counterUpfront, repayment: counterRepayment, extra: counterExtra, days: Math.min(days, 10) };
  const counterPossible = counterUnits > 0 && counterUpfront / counterPrice >= config.minimumUpfrontShare && counterRepayment <= config.maximumNewPrincipal && state.metrics.debt + counterRepayment + counterExtra <= config.maximumExposure;
  if (counterPossible && tension < 65 && score >= config.counterThreshold && !sameTerms(counterTerms, intent.terms)) {
    result.outcome = "COUNTER";
    result.counterTerms = counterTerms;
    reasons.push("He offers a smaller or better secured arrangement: limited stock, meaningful cash now, and at most ten days.");
    if (state.quirk === "final_say") result.clue = quirk.clue;
  } else {
    result.outcome = "REJECT";
    reasons.push("The proposed risk or current tension is too high for an arrangement he can defend.");
  }
  return result;
}
