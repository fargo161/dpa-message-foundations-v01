import { INFORMATION_RULES } from "./history-content.mjs";
import { hasEvidence, hasLoreFact, informationEligibility } from "./knowledge.mjs";

const addOnce = (list, value) => { if (!list.includes(value)) list.push(value); };
const hostile = intent => ["BA", "BS", "BE", "BD", "AB", "AD", "DB", "DA", "DS", "DE"].includes(intent.vibeId);

/**
 * A pure knowledge transition. Identity, closed input shape and economics are
 * validated by the engine before this runs. Bonuses never transfer resources.
 */
export function resolveInformation(state, intent) {
  const eligibility = informationEligibility(state, intent);
  if (!eligibility.allowed) throw new Error(eligibility.reason);
  const lore = structuredClone(state.lore);
  const turn = state.events.length + 1;
  /** @type {{lore:any,scoreBonus:number,social:{confidence:number,tension:number},progressKey:string|null,causes:any[],feedback:string,exchange:null|{factId:string,summary:string}}} */
  const result = { lore, scoreBonus: 0, social: { confidence: 0, tension: 0 }, progressKey: null, causes: [], feedback: "", exchange: null };
  const cause = (kind, factIds, consequence, evidenceIds = []) => result.causes.push({ kind, factIds, evidenceIds, consequence, turn });
  const progress = key => {
    if (lore.progressKeys.includes(key)) { cause("TOPIC_EXHAUSTED", [], "This fact or topic already supplied its one-time progress."); return false; }
    lore.progressKeys.push(key); result.progressKey = key; return true;
  };
  const evidence = (id, text, factIds) => {
    if (!lore.evidence.some(item => item.id === id)) lore.evidence.push({ id, text, factIds });
    cause("EVIDENCE_OBSERVED", factIds, text, [id]);
  };
  const hint = () => {
    const newlyShared = lore.disclosure === "NONE";
    if (lore.disclosure === "NONE") lore.disclosure = "PARTIAL";
    addOnce(lore.knowledge.marcusAwarePlayerKnows, lore.privateFactId);
    addOnce(lore.progressKeys, `hint:${lore.privateFactId}`);
    return newlyShared;
  };
  const disclose = () => {
    lore.disclosure = "FULL";
    addOnce(lore.knowledge.marcus, lore.privateFactId);
    addOnce(lore.knowledge.marcusAwarePlayerKnows, lore.privateFactId);
    lore.beliefs.content = hasEvidence(state, "SOURCE_VERIFIED") ? "DOCUMENT_SUPPORTED" : "RECEIVED_UNVERIFIED";
    cause("FULL_DISCLOSURE", [lore.privateFactId], "Marcus has received the exact operative detail; private exchange value is spent.");
  };
  if (lore.negativeWindow && lore.negativeWindow.consumedAt === null && !lore.negativeWindow.expiredAt && turn > lore.negativeWindow.expiresAt) {
    lore.negativeWindow.expiredAt = turn;
    cause("OPPORTUNITY_EXPIRED", [lore.negativeWindow.factId], "The brief negotiating opening expired without a proposal.");
    result.feedback = "The moment to follow the record discrepancy with terms has passed. The information remains disclosed.";
  }
  if (intent.action === "ACCEPT") {
    if (state.counteroffer?.informationExchange) {
      disclose();
      addOnce(lore.progressKeys, `exchange:${lore.privateFactId}`);
      cause("INFORMATION_EXCHANGE_COMPLETED", [lore.privateFactId, "DIRECT_RECEIPT", "PICKUP_NEED"], "The agreed information is delivered in the same authoritative acceptance as cash and stock.");
      result.feedback = "The agreed collection detail has now been delivered to Marcus with the completed transaction.";
    }
    return result;
  }
  if (intent.action === "WALK" || intent.topic === "CLARIFY_OFFER") return result;
  if (intent.action === "DEAL") {
    if (intent.information === "OFFER_INFORMATION") {
      hint();
      result.scoreBonus = INFORMATION_RULES.positiveScoreBonus;
      result.exchange = { factId: lore.privateFactId, summary: "Exact depot collection instructions: gate, time window and docket; delivered on acceptance." };
      cause("INFORMATION_OFFERED", [lore.privateFactId, "DIRECT_RECEIPT", "LEDGER_CLOSING", "PICKUP_NEED"], "A conditional information exchange improves this proposal's score by 8, subject to all hard credit limits.", ["SOURCE_VERIFIED", "RELEVANCE_OBSERVED"]);
      result.feedback = "The checked source and collection context give the private detail bargaining value. Marcus receives only its category until an agreement is confirmed; a refusal does not disclose it.";
    }
    const window = lore.negativeWindow;
    if (window && window.consumedAt === null) {
      window.consumedAt = turn;
      const grounded = ["NEGATIVE_DISCREPANCY", "DIRECT_RECEIPT", "LEDGER_CLOSING", "RECORD_ASSERTION"].every(id => hasLoreFact(state, id));
      if (turn <= window.expiresAt && grounded && !hostile(intent) && state.metrics.tension <= INFORMATION_RULES.maximumPreparedTension) {
        result.scoreBonus = INFORMATION_RULES.negativeScoreBonus;
        result.feedback = "He is willing to settle a defensible proposal while rechecking that discrepancy. This is the one proposal that can use the opening; it still needs real cash and credible terms.";
        cause("OPPORTUNITY_USED", [window.factId, "RECORD_ASSERTION", "LEDGER_CLOSING"], "The first subsequent DEAL receives a bounded +6 score, then consumes the opening.", ["SOURCE_VERIFIED", "RELEVANCE_OBSERVED"]);
      } else {
        result.feedback = "That brief opening does not support this proposal now. It is spent; the discrepancy and existing debt both remain.";
        cause("OPPORTUNITY_CONSUMED_WITHOUT_BONUS", [window.factId], "The first subsequent DEAL consumes the opening even when late, hostile, strained or no longer grounded.");
      }
    }
    return result;
  }
  if (intent.action !== "ASK") return result;
  if (intent.topic === "SMALL_TALK") {
    if (progress("history:SHARED_LOADING_SHIFT")) { result.social = { confidence: 1, tension: -2 }; cause("HISTORY_INVOKED", ["SHARED_LOADING_SHIFT"], "A grounded cooperative memory makes initial contact easier."); }
    result.feedback = result.progressKey ? "The shared shift is a real point of contact. It does not settle the unpaid account, and repeating it will not add goodwill." : "You already discussed the shared shift. Repeating it adds no new goodwill; the unpaid account remains.";
  } else if (intent.topic === "ACK_MISSED") {
    if (progress("history:MISSED_CHECKIN")) { result.social = { confidence: 3, tension: -2 }; cause("HISTORY_ACKNOWLEDGED", ["MISSED_CHECKIN", "OLD_ACCOUNT"], "A specific acknowledgment helps confidence without modifying any obligation."); }
    result.feedback = result.progressKey ? "Naming the missed check-in addresses something concrete. The old debt still stands; promises about future profit are still uncertain." : "You already acknowledged the missed check-in. Repeating the acknowledgment supplies no new progress; the old debt still stands.";
  } else if (intent.topic === "VERIFY_SOURCE") {
    if (progress("evidence:DIRECT_RECEIPT")) {
      lore.beliefs.source = "CHECKED";
      if (lore.disclosure === "FULL") {
        lore.beliefs.content = "DOCUMENT_SUPPORTED";
        if (lore.variant === "NEGATIVE") lore.beliefs.record = "DISPUTED";
        cause("BELIEF_REVISED", ["DIRECT_RECEIPT", lore.privateFactId], "Late source verification supports an already disclosed detail; it creates no fresh private value or opening.");
      }
      addOnce(lore.knowledge.marcus, "DIRECT_RECEIPT"); addOnce(lore.knowledge.marcusAwarePlayerKnows, "DIRECT_RECEIPT");
      evidence("SOURCE_VERIFIED", lore.disclosure === "FULL" ? "Marcus recognizes the depot header and signature; the already disclosed detail now has a checked source." : "Marcus recognizes the depot header and signature. He has checked the source, not the covered detail.", ["DIRECT_RECEIPT"]);
      result.social.confidence = 1;
    }
    result.feedback = `${result.progressKey ? "The document's source checks out." : "The source was already checked; asking again supplies no new verification."} ${lore.disclosure === "FULL" ? "Marcus already has the exact detail. Checking its source cannot restore private exchange value or reopen a reveal opportunity." : "The exact detail remains private."} ${lore.variant === "POSITIVE" ? "A checked source does not guarantee that he will trade for the instructions." : "A genuine document does not by itself prove a useful deal or wrongdoing."}`;
  } else if (intent.topic === "PROBE_USEFULNESS") {
    hint();
    if (progress(`relevance:${lore.privateFactId}`)) {
      const relevant = lore.variant === "POSITIVE" ? hasLoreFact(state, "PICKUP_NEED") : hasLoreFact(state, "RECORD_ASSERTION");
      lore.beliefs.relevance = relevant ? "POSSIBLY_USEFUL" : "NOT_ESTABLISHED";
      if (relevant) evidence("RELEVANCE_OBSERVED", lore.variant === "POSITIVE"
        ? "He says checked collection instructions could save a wasted journey. That suggests interest, not a promised concession."
        : "He says a concrete discrepancy would warrant rechecking the intake summary. That does not establish blame or guarantee concessions.", ["LEDGER_CLOSING", lore.variant === "POSITIVE" ? "PICKUP_NEED" : "RECORD_ASSERTION"]);
      else evidence("RELEVANCE_UNCERTAIN", "He does not identify a current use for that category of information.", ["LEDGER_CLOSING"]);
    }
    result.feedback = `${result.progressKey ? "" : "You already asked about usefulness; repeating it supplies no new evidence. "}${lore.beliefs.relevance === "POSSIBLY_USEFUL" ? `You have an indication that this category matters to his current business, not a complete read of what he values. ${lore.disclosure === "FULL" ? "The exact detail has already been disclosed; discovering relevance now does not restore its private value or reopen a reveal opportunity." : "The exact detail is still yours to disclose or retain."}` : "The source may be genuine, but a current use for this information has not been established."}`;
  } else if (intent.topic === "QUESTION_RECORD") {
    hint();
    if (progress("question:RECORD_ASSERTION")) {
      result.social.tension = 2;
      evidence("RECORD_QUESTIONED", "He maintains that the intake was signed off, but says a specific discrepancy can be checked. You have questioned a record, not proved misconduct.", ["RECORD_ASSERTION"]);
      cause("BELIEF_CHALLENGED", ["RECORD_ASSERTION"], lore.disclosure === "FULL" ? "The asserted reconciliation has been questioned against an already disclosed mismatch; no fresh reveal opportunity is created." : "The asserted reconciliation has been questioned; the hidden receipt detail has not yet been supplied.");
    }
    result.feedback = `${result.progressKey ? "You questioned the intake record; that does not establish blame." : "You already questioned the record. Repeating the question supplies no new progress."} ${lore.disclosure === "FULL" ? "Marcus already has the mismatch. The record can still be checked and ordinary terms discussed, but further preparation cannot replay the reveal or create a fresh opening." : "Checking the source and its relevance can help you decide how to handle the detail you still hold. No concession is promised."}`;
  } else if (intent.topic === "DISCLOSE_PARTIAL") {
    const newlyShared = hint();
    if (newlyShared) {
      result.progressKey = `hint:${lore.privateFactId}`;
      cause("PARTIAL_DISCLOSURE", [lore.privateFactId], "The player disclosed only the information category, not the exact proposition.");
    } else cause("TOPIC_EXHAUSTED", [lore.privateFactId], "The category was already shared by a probe, question, offer or disclosure; it supplies no new progress.");
    result.feedback = lore.disclosure === "FULL" ? "Marcus already has the exact detail. A category hint cannot make it private again." : newlyShared ? "Marcus now knows what kind of information you hold. He does not yet have the exact detail; a hint is not proof or a completed exchange." : "Marcus already knows that category from what you said before. The exact detail is still private, but repeating the hint supplies no new progress.";
  } else if (intent.topic === "DISCLOSE_FULL") {
    if (lore.disclosure === "FULL" || lore.knowledge.marcus.includes(lore.privateFactId)) {
      cause("DISCLOSURE_REPEATED", [lore.privateFactId], "No new knowledge or negotiating benefit is created by repeating the detail.");
      result.feedback = "He already has that detail. Repeating it creates no fresh exchange value or opening.";
      return result;
    }
    disclose(); progress(`disclosure:${lore.privateFactId}`);
    if (lore.variant === "POSITIVE") {
      result.feedback = "The exact collection instructions are now in Marcus's hands. You gave up their private exchange value; he has not agreed to any stock or credit in return.";
      cause("PRIVATE_VALUE_SPENT", [lore.privateFactId], "Early full disclosure gives the information away rather than attaching it to a transaction.");
    } else {
      const prepared = ["DIRECT_RECEIPT", "LEDGER_CLOSING", "RECORD_ASSERTION"].every(id => hasLoreFact(state, id)) && hasEvidence(state, "SOURCE_VERIFIED") && hasEvidence(state, "RELEVANCE_OBSERVED") && hasEvidence(state, "RECORD_QUESTIONED");
      lore.beliefs.record = hasEvidence(state, "SOURCE_VERIFIED") ? "DISPUTED" : "CHALLENGED_UNVERIFIED";
      cause("BELIEF_REVISED", ["RECORD_ASSERTION", lore.privateFactId], "Reconciled certainty becomes a disputed or unverified count; no theft or blame is established.");
      if (prepared && !hostile(intent) && state.metrics.tension <= INFORMATION_RULES.maximumPreparedTension) {
        lore.negativeWindow = { factId: lore.privateFactId, openedAt: turn, expiresAt: turn + INFORMATION_RULES.negativeWindowTurns, consumedAt: null };
        result.social = { confidence: 1, tension: 2 };
        result.feedback = "The checked mismatch unsettles his reliance on the summary. He is open to a defensible proposal while he sorts it out. Use the next DEAL within the next three turns; it is a brief opportunity, not agreement.";
        cause("OPPORTUNITY_OPENED", [lore.privateFactId, "RECORD_ASSERTION", "LEDGER_CLOSING"], "A prepared, non-coercive disclosure opens one next-DEAL opportunity, expiring after three subsequent turn positions.", ["SOURCE_VERIFIED", "RELEVANCE_OBSERVED", "RECORD_QUESTIONED"]);
      } else {
        result.social = { confidence: -4, tension: 9 };
        result.feedback = "The mismatch is now disclosed, but this delivery and preparation give him no reason to cooperate over it. He becomes more guarded. You cannot replay the reveal after repairing the approach.";
        cause("DISCLOSURE_BACKLASH", [lore.privateFactId], "Missing preparation, hostile approach or high existing tension prevents an opening and causes confidence -4, tension +9.");
      }
    }
  }
  return result;
}
