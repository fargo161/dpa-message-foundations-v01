import { BASED_VIBES } from "../based.mjs";
import { informationPlayerText } from "./knowledge.mjs";

const questions = Object.freeze({
  TERMS: "What terms would make more Contra on credit workable?",
  DEBT: "I still owe you money, and future profits are uncertain. How does that affect another deal?",
  RISK: "You would be putting more stock and money at risk. What would make that acceptable?",
  PRIORITIES: "What matters most to you in this negotiation?",
  FINAL_SAY: "Would you rather set the counterterms yourself?",
  GUARANTEE: "My future profits are guaranteed. Does that reassure you?",
  ENTITLEMENT: "Why won't you simply trust me with more stock?",
  CLARIFY_OFFER: "Please restate the current offer, including any information exchange. I am not changing its terms.",
});

const describeTerms = (terms) => `${terms.units} Contra unit(s), $${terms.upfront} upfront, $${terms.repayment} new principal plus $${terms.extra} extra due in ${terms.days} day(s)`;

function informationReply(state, decision) {
  const causes = decision.informationCauses || [];
  const has = (kind) => causes.some((cause) => cause.kind === kind);
  const evidence = (id) => causes.some((cause) => cause.evidenceIds?.includes(id));
  if (has("OPPORTUNITY_OPENED")) return "That count needs checking. Put a defensible proposal down while I sort this out. I have not agreed to a deal yet.";
  if (has("DISCLOSURE_BACKLASH")) return "You have put that discrepancy on the table. It has not made this easier. I am not extending credit just because you have challenged the record.";
  if (has("PRIVATE_VALUE_SPENT")) return "I have the collection detail now. That was your choice to share; it was not an agreement for stock.";
  if (has("DISCLOSURE_REPEATED")) return "I already have that detail. Repeating it does not make a new bargain.";
  if (has("TOPIC_EXHAUSTED")) return "We have covered that point. It has not become a new reason to change terms.";
  if (has("HISTORY_INVOKED")) return "I remember that shift. We got the loading done. We still have an unpaid account to discuss.";
  if (has("HISTORY_ACKNOWLEDGED")) return "You missed it. I appreciate you naming that plainly. The money is still owed.";
  if (has("BELIEF_CHALLENGED")) return "The intake was signed off. If there is a specific discrepancy, it can be checked. A question alone does not settle it.";
  if (evidence("SOURCE_VERIFIED")) return "The header and signature check out. That tells me where the document came from; it does not settle everything the document might mean.";
  if (evidence("RELEVANCE_UNCERTAIN")) return "I cannot name a use for that in the business we are settling here.";
  if (evidence("RELEVANCE_OBSERVED")) return causes.some((cause) => cause.factIds?.includes("PICKUP_NEED"))
    ? "Checked collection instructions could save a wasted journey. That is a reason to listen, not a promise of a concession."
    : "A concrete count discrepancy would warrant rechecking the intake summary. That does not establish who is responsible.";
  if (has("PARTIAL_DISCLOSURE")) return state.lore?.disclosure === "FULL" ? "I already have the exact detail. Describing its category now does not take it back." : "I hear what kind of information you say you have. You have not given me the exact detail yet.";
  return "";
}

export function playerMessage(intent, options = {}) {
  const vibe = BASED_VIBES.find((entry) => entry.vibeId === intent.vibeId);
  const label = `[${vibe?.name ?? intent.vibeId} / ${intent.intensity}]`;
  const informationText = options.state?.lore ? informationPlayerText(options.state, intent) : "";
  if (intent.action === "ASK") return `${label} ${informationText || questions[intent.topic] || "Can we discuss this point?"}`;
  if (intent.action === "DEAL") return `${label} I propose ${describeTerms(intent.terms)}. This is in addition to my existing debt.${informationText ? ` ${informationText}` : ""}`;
  if (intent.action === "ACCEPT") return `${label} I accept the current offer${options.offer?.terms ? `: ${describeTerms(options.offer.terms)}` : ""}. My existing debt remains separate.${options.offer?.informationExchange ? ` I deliver the agreed information: ${options.offer.informationExchange.summary}.` : ""}`;
  return `${label} I am walking away from this negotiation.`;
}

export function marcusMessage(state, intent, decision) {
  if (intent.action === "WALK") return "Then we leave it here. The old debt still stands.";
  if (intent.action === "ACCEPT") return "Agreed. The stock is yours on the terms you just confirmed. The old account stays on the books.";
  if (decision.outcome === "END") return "Enough. I am closing this conversation. No new stock changes hands.";
  if (intent.topic === "CLARIFY_OFFER" && state.counteroffer) return `The offer remains ${describeTerms(state.counteroffer.terms)}.${state.counteroffer.informationExchange ? ` It also includes the agreed information exchange: ${state.counteroffer.informationExchange.summary}.` : " No information exchange is included."} Those terms have not changed. Your old debt is still separate.`;
  if (decision.derived?.repetition > 0 && intent.action === "ASK") return "We have covered that point. Saying it again does not give me a new reason to change terms.";
  let response;
  if (decision.outcome === "ACCEPT") response = `I can agree to ${describeTerms(intent.terms)}. Review it and confirm if you want the deal. Until then, the stock stays here.`;
  else if (decision.outcome === "COUNTER") response = `Not on those terms. Here is what I will put my name to: ${describeTerms(decision.counterTerms)}. Your existing debt is separate. Take a look before you decide.`;
  else if (decision.outcome === "REJECT") response = decision.derived?.projectedTension >= 65
    ? "With this much friction, I am not extending myself. Better numbers alone will not settle this conversation."
    : "That leaves too much riding on money you do not have yet. Bring more cash, ask for less stock, or shorten the wait. A bigger promise is not security.";
  else {
    const answers = {
      TERMS: "Contra is $60 a unit. Put real cash down, keep the new credit modest, and give me a short repayment date. Extra repayment can help, but it is still only a promise.",
      DEBT: `The $${state.metrics.debt} already on your account stays there. Another deal adds its own principal and any agreed extra; it does not replace what you owe.`,
      RISK: "My stock leaves today. Your earnings might come later, or might not. Cash now and a smaller request give me something solid.",
      PRIORITIES: "The account, the stock, and whether the terms hold up. There is more than one way to make a bad deal. You will need to be more specific.",
      FINAL_SAY: "You can propose. I can counter. Neither of us owes the other a yes.",
      GUARANTEE: "No. Calling future profit guaranteed does not make it cash. Keep the uncertainty in the open.",
      ENTITLEMENT: "No. The old loan is an unpaid account, not a ticket to my shelf.",
    };
    response = informationReply(state, decision) || answers[intent.topic] || "I have heard you. Let us see what that changes in the arrangement.";
  }
  if (state.counteroffer?.informationExchange && ["ACCEPT", "COUNTER"].includes(decision.outcome)) response += " The terms include the information exchange. I receive the private detail only when you confirm.";
  const contribution = decision.based?.contribution;
  if ((contribution?.tension ?? 0) >= 5 && (decision.social?.tension ?? 0) > 0) response += " And ease off. That approach makes me less willing to listen.";
  else if ((contribution?.confidence ?? 0) >= 3 && (decision.social?.confidence ?? 0) > 0) response += " I can work with a clear approach like that.";
  return response;
}
