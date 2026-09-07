import { describeTerms, requireLanguage } from "./frames.mjs";

// Pair 0 preserves the existing authored reply. Pair 1 is NEW, review-only
// wording of the same resolved family. No raw lore or future policy is read.
export const NPC_REPLY_FAMILIES = Object.freeze({
  WALK: () => ["Then we leave it here. The old debt still stands.", "We will leave it there, then. You still owe the old debt."],
  AGREED: () => ["Agreed. The stock is yours on the terms you just confirmed. The old account stays on the books.", "That is agreed. The stock is yours under the terms you confirmed. The old account remains unpaid."],
  END: () => ["Enough. I am closing this conversation. No new stock changes hands.", "We are done talking. I am ending this conversation, and no new stock changes hands."],
  CLARIFY: c => [`The offer remains ${c.terms}.${c.exchange ? ` It also includes the agreed information exchange: ${c.exchange}.` : " No information exchange is included."} Those terms have not changed. Your old debt is still separate.`, `Here are the unchanged terms: ${c.terms}.${c.exchange ? ` The agreed information exchange is also included: ${c.exchange}.` : " There is no information exchange in this offer."} Your old debt remains separate.`],
  REPEATED_ASK: () => ["We have covered that point. Saying it again does not give me a new reason to change terms.", "We already covered that. Repeating the question gives me no new reason to change the terms."],
  APPROVED_PROPOSAL: c => [`I can agree to ${c.terms}. Review it and confirm if you want the deal. Until then, the stock stays here.`, `These terms are workable: ${c.terms}. Read them over and confirm if you want to proceed. The stock stays here until you confirm.`],
  COUNTER: c => [`Not on those terms. Here is what I will put my name to: ${c.terms}. Your existing debt is separate. Take a look before you decide.`, `I will not agree to your proposal. My counteroffer is ${c.terms}. The existing debt is separate. Review that before deciding.`],
  REJECT_FRICTION: () => ["With this much friction, I am not extending myself. Better numbers alone will not settle this conversation.", "There is too much friction for me to extend myself. Changing the numbers alone will not settle this."],
  REJECT_RISK: () => ["That leaves too much riding on money you do not have yet. Bring more cash, ask for less stock, or shorten the wait. A bigger promise is not security.", "Too much of that depends on money you do not have. Put down more cash, reduce the stock, or shorten the repayment time. Promising more does not make it secure."],
  TERMS: () => ["Contra is $60 a unit. Put real cash down, keep the new credit modest, and give me a short repayment date. Extra repayment can help, but it is still only a promise.", "It is $60 for each Contra unit. I want cash down, modest new credit, and a short repayment date. Offering extra can help, but that extra remains a promise."],
  DEBT: c => [`The $${c.debt} already on your account stays there. Another deal adds its own principal and any agreed extra; it does not replace what you owe.`, `You still owe the $${c.debt} on your account. New principal and any agreed extra go on top of that. Another deal does not replace the existing debt.`],
  RISK: () => ["My stock leaves today. Your earnings might come later, or might not. Cash now and a smaller request give me something solid.", "I would be handing over stock today against earnings that may never arrive. Cash up front and a smaller request give me something concrete."],
  PRIORITIES: () => ["The account, the stock, and whether the terms hold up. There is more than one way to make a bad deal. You will need to be more specific.", "I am looking at the account, the stock, and the terms. A deal can go wrong in more than one way. Ask me something more specific."],
  FINAL_SAY: () => ["You can propose. I can counter. Neither of us owes the other a yes.", "Make a proposal; I can make a counteroffer. Either of us can say no."],
  GUARANTEE: () => ["No. Calling future profit guaranteed does not make it cash. Keep the uncertainty in the open.", "No. Future profit is uncertain, whatever you call it. It is not cash. Be clear about that uncertainty."],
  ENTITLEMENT: () => ["No. The old loan is an unpaid account, not a ticket to my shelf.", "No. Having an unpaid loan does not entitle you to more of my stock."],
  OPPORTUNITY_OPENED: () => ["That count needs checking. Put a defensible proposal down while I sort this out. I have not agreed to a deal yet.", "I need to check that count. You can put forward a defensible proposal while I sort it out. That is not an agreement to a deal."],
  DISCLOSURE_BACKLASH: () => ["You have put that discrepancy on the table. It has not made this easier. I am not extending credit just because you have challenged the record.", "The discrepancy is out in the open, and this has not become easier. Challenging the record does not make me extend credit."],
  PRIVATE_VALUE_SPENT: () => ["I have the collection detail now. That was your choice to share; it was not an agreement for stock.", "You chose to give me the collection detail. I have it now. We did not agree to exchange stock for it."],
  DISCLOSURE_REPEATED: () => ["I already have that detail. Repeating it does not make a new bargain.", "You already gave me that detail. Saying it again does not create another bargain."],
  TOPIC_EXHAUSTED: () => ["We have covered that point. It has not become a new reason to change terms.", "That point has been covered. It gives me no new reason to change the terms."],
  HISTORY_INVOKED: () => ["I remember that shift. We got the loading done. We still have an unpaid account to discuss.", "Yes, I remember getting that loading done with you. The unpaid account still needs discussing."],
  HISTORY_ACKNOWLEDGED: () => ["You missed it. I appreciate you naming that plainly. The money is still owed.", "You did miss the check-in. I appreciate the plain acknowledgment. It does not clear the debt."],
  BELIEF_CHALLENGED: () => ["The intake was signed off. If there is a specific discrepancy, it can be checked. A question alone does not settle it.", "That intake has a sign-off. A specific discrepancy can be checked, but asking the question does not settle the matter."],
  SOURCE_VERIFIED: () => ["The header and signature check out. That tells me where the document came from; it does not settle everything the document might mean.", "The header and signature are valid. That establishes the document's source. It does not establish everything its contents might imply."],
  RELEVANCE_UNCERTAIN: () => ["I cannot name a use for that in the business we are settling here.", "I cannot identify how that would be useful to the business we are discussing."],
  RELEVANCE_PICKUP: () => ["Checked collection instructions could save a wasted journey. That is a reason to listen, not a promise of a concession.", "Verified collection instructions might save a wasted trip. I have reason to hear you out; I have not promised better terms."],
  RELEVANCE_COUNT: () => ["A concrete count discrepancy would warrant rechecking the intake summary. That does not establish who is responsible.", "A specific mismatch in the count would justify checking the intake summary again. It would not tell us who caused it."],
  PARTIAL_ALREADY_FULL: () => ["I already have the exact detail. Describing its category now does not take it back.", "You already gave me the exact detail. Talking about its category cannot make me unhear it."],
  PARTIAL_WITHHELD: () => ["I hear what kind of information you say you have. You have not given me the exact detail yet.", "You have told me the kind of information you hold. The exact detail has not been shared with me."],
  GENERAL: () => ["I have heard you. Let us see what that changes in the arrangement.", "I hear you. Let us look at what that means for the arrangement."],
});

export function buildNpcFrame(state, intent, decision) {
  requireLanguage(state && intent && decision, "missing resolved NPC context");
  let family;
  const context = { terms: "", exchange: "", debt: state.metrics?.debt };
  const causes = decision.informationCauses || [];
  const has = kind => causes.some(cause => cause.kind === kind);
  const evidence = id => causes.some(cause => cause.evidenceIds?.includes(id));
  if (intent.action === "WALK") family = "WALK";
  else if (intent.action === "ACCEPT") family = "AGREED";
  else if (decision.outcome === "END") family = "END";
  else if (intent.topic === "CLARIFY_OFFER" && state.counteroffer) {
    family = "CLARIFY";
    context.terms = describeTerms(state.counteroffer.terms);
    context.exchange = state.counteroffer.informationExchange?.summary ?? "";
  } else if (decision.derived?.repetition > 0 && intent.action === "ASK") family = "REPEATED_ASK";
  else if (decision.outcome === "ACCEPT") { family = "APPROVED_PROPOSAL"; context.terms = describeTerms(intent.terms); }
  else if (decision.outcome === "COUNTER") { family = "COUNTER"; context.terms = describeTerms(decision.counterTerms); }
  else if (decision.outcome === "REJECT") family = decision.derived?.projectedTension >= 65 ? "REJECT_FRICTION" : "REJECT_RISK";
  else {
    family = ["OPPORTUNITY_OPENED", "DISCLOSURE_BACKLASH", "PRIVATE_VALUE_SPENT", "DISCLOSURE_REPEATED", "TOPIC_EXHAUSTED", "HISTORY_INVOKED", "HISTORY_ACKNOWLEDGED", "BELIEF_CHALLENGED"].find(has);
    if (!family && evidence("SOURCE_VERIFIED")) family = "SOURCE_VERIFIED";
    if (!family && evidence("RELEVANCE_UNCERTAIN")) family = "RELEVANCE_UNCERTAIN";
    if (!family && evidence("RELEVANCE_OBSERVED")) family = causes.some(cause => cause.factIds?.includes("PICKUP_NEED")) ? "RELEVANCE_PICKUP" : "RELEVANCE_COUNT";
    if (!family && has("PARTIAL_DISCLOSURE")) family = state.lore?.disclosure === "FULL" ? "PARTIAL_ALREADY_FULL" : "PARTIAL_WITHHELD";
    if (!family) family = ["TERMS", "DEBT", "RISK", "PRIORITIES", "FINAL_SAY", "GUARANTEE", "ENTITLEMENT"].includes(intent.topic) ? intent.topic : "GENERAL";
  }
  const suffixes = [];
  // Preserve the early-return behavior of the existing canonical responder.
  if (!["WALK", "AGREED", "END", "CLARIFY", "REPEATED_ASK"].includes(family)) {
    if (state.counteroffer?.informationExchange && ["ACCEPT", "COUNTER"].includes(decision.outcome)) suffixes.push("The terms include the information exchange. I receive the private detail only when you confirm.");
    const contribution = decision.based?.contribution;
    if ((contribution?.tension ?? 0) >= 5 && (decision.social?.tension ?? 0) > 0) suffixes.push("And ease off. That approach makes me less willing to listen.");
    else if ((contribution?.confidence ?? 0) >= 3 && (decision.social?.confidence ?? 0) > 0) suffixes.push("I can work with a clear approach like that.");
  }
  const alternatives = NPC_REPLY_FAMILIES[family](context).map(text => `${text}${suffixes.length ? ` ${suffixes.join(" ")}` : ""}`);
  return { id: `marcus:${family}`, actorId: "MARCUS", targetId: "PLAYER", family, context, suffixes, text: alternatives[0], alternatives };
}

export function validateNpcFrame(frame) {
  requireLanguage(frame?.actorId === "MARCUS" && frame.targetId === "PLAYER" && Object.hasOwn(NPC_REPLY_FAMILIES, frame.family), "unsupported NPC frame");
  requireLanguage(frame.id === `marcus:${frame.family}` && frame.context && Array.isArray(frame.suffixes), "invalid NPC frame fields");
  const expected = NPC_REPLY_FAMILIES[frame.family](frame.context).map(text => `${text}${frame.suffixes.length ? ` ${frame.suffixes.join(" ")}` : ""}`);
  requireLanguage(frame.text === expected[0] && JSON.stringify(frame.alternatives) === JSON.stringify(expected), "NPC text differs from authored family");
  return frame;
}
