import { projectMarcusInformation } from "../../encounter/marcus-world-adapter.mjs";
import { describeTerms, requireLanguage } from "./frames.mjs";

const sentence = text => /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;

// Two authored phrasings of the same resolved family. No raw lore or future
// policy is read; polishing a line never changes which reply family resolves.
export const NPC_REPLY_FAMILIES = Object.freeze({
  R17_HINT_CARES: () => ["Yes. I care about that information. Keep R-17's exact detail covered if you want to price it into the deal.", "Yes, that matters to me. You can keep the detail private and put R-17 in your offer."],
  R17_HINT_DOES_NOT_CARE: c => c.positive ? ["No. I don't need it. Depot already called me about the collection change.", "I don't care about buying that information. Depot already called me about the collection change."] : ["No. I don't need it. My clerk's count has never been wrong. I'm not worried.", "I don't care about buying that information. I trust my clerk's count. I'm not worried."],
  R17_SHOW: c => [`The header and signature check out. I accept the detail on the paper. I'll give you three points of goodwill: ${c.r17Rate}% extra now. That doesn't establish who's responsible for any discrepancy.`, `The source checks out, and I've read the detail. Three points off the extra charge: ${c.r17Rate}%. The paper doesn't establish wrongdoing.`],
  R17_TRADE_VALUABLE: () => ["That information matters to me. With R-17 included, my minimum extra is 8%. I receive the document and detail only when you confirm.", "R-17 has value to me. I'll go to 8% extra for this information offer, with the exchange completed on confirmation."],
  R17_BLIND_TRADE_FAILURE: () => ["You want me to pay for something I don't need? My minimum extra is 22% now. Keep R-17; you haven't shown me its detail.", "You priced in information I don't want. That doesn't impress me. It's 22% extra now, and you keep R-17."],
  R17_TRADE_NO_VALUE: c => [`I don't value that information. It earns no concession. My minimum extra remains ${c.r17Rate}%; keep R-17.`, `No information value in this offer. The extra-charge floor stays ${c.r17Rate}%. R-17 stays yours.`],
  WALK: () => ["Then we leave it here. The old debt still stands.", "We will leave it there, then. You still owe the old debt."],
  AGREED: () => ["Agreed. The stock is yours on the terms you just confirmed. The old account stays on the books.", "That is agreed. The stock is yours under the terms you confirmed. The old account remains unpaid."],
  END: (c = {}) => c.patience === 0
    ? c.repeatedClarification
      ? ["We've gone over these terms again and again. I'm out of patience. We're done talking. No new stock changes hands.", "You keep asking me to repeat the offer. I'm out of patience. We're done here. The stock stays put."]
      : ["I'm out of patience. We're done talking. No new stock changes hands.", "I've run out of patience. We're done here. The stock stays put."]
    : c.tension >= 90
      ? ["This has got too tense. We're done talking. No new stock changes hands.", "Things are too heated now. We're done here. The stock stays put."]
      : ["Enough. We're done talking. No new stock changes hands.", "We're done here. The stock stays put."],
  CLARIFY: c => [`The offer remains ${c.terms}.${c.exchange ? ` It also includes the agreed information exchange: ${sentence(c.exchange)}` : " No information exchange is included."} Those terms have not changed. Your old debt is still separate.`, `Here are the unchanged terms: ${c.terms}.${c.exchange ? ` The agreed information exchange is also included: ${sentence(c.exchange)}` : " There is no information exchange in this offer."} Your old debt remains separate.`],
  REPEATED_ASK: () => ["We have covered that point. Saying it again does not give me a new reason to change terms.", "We already covered that. Repeating the question gives me no new reason to change the terms."],
  APPROVED_PROPOSAL: c => [`I can do ${c.terms}. Check it over. Confirm if you want the deal; until then, the stock stays here.`, `That works: ${c.terms}. Read it over and confirm if you're in. The stock stays here until you confirm.`],
  COUNTER: c => [`Not on those terms. Here is what I will put my name to: ${c.terms}. Your existing debt is separate. Take a look before you decide.`, `I will not agree to your proposal. My counteroffer is ${c.terms}. The existing debt is separate. Review that before deciding.`],
  REJECT_FRICTION: () => ["Not with things this tense between us. Better numbers alone won't fix that.", "We're too wound up for me to take this on. Changing the numbers isn't enough."],
  REJECT_RISK: () => ["I am not agreeing to this proposal as things stand. We can discuss the terms or how we got here. Promising more money later is not the same as security.", "I am not saying yes to this. We can talk about the terms or where this conversation stands. More promised money is still a promise."],
  TERMS: () => ["Contra is $60 a unit. Cash down, not too much on credit, and pay me back soon. Offering extra can help, but it's still a promise.", "It's $60 a unit. Bring cash, keep the credit small, and don't stretch the repayment date. Extra can help, but it isn't cash in my hand."],
  DEBT: c => [`The $${c.debt} already on your account stays there. Another deal adds its own principal and any agreed extra; it does not replace what you owe.`, `You still owe the $${c.debt} on your account. New principal and any agreed extra go on top of that. Another deal does not replace the existing debt.`],
  RISK: () => ["My stock leaves today. Your earnings might come later, or might not. Cash now and a smaller request give me something solid.", "I would be handing over stock today against earnings that may never arrive. Cash up front and a smaller request give me something concrete."],
  PRIORITIES: () => ["The account, the stock, and whether the terms hold up. There is more than one way to make a bad deal. You will need to be more specific.", "I am looking at the account, the stock, and the terms. A deal can go wrong in more than one way. Ask me something more specific."],
  FINAL_SAY: () => ["You can propose. I can counter. Neither of us owes the other a yes.", "Make a proposal; I can make a counteroffer. Either of us can say no."],
  GUARANTEE: () => ["No. Calling future profit guaranteed does not make it cash. Keep the uncertainty in the open.", "No. Future profit is uncertain, whatever you call it. It is not cash. Be clear about that uncertainty."],
  ENTITLEMENT: () => ["No. The old loan is an unpaid account, not a ticket to my shelf.", "No. Having an unpaid loan does not entitle you to more of my stock."],
  OPPORTUNITY_OPENED: () => ["That count needs checking. Put a reasonable offer down while I sort it out. I'm not saying yes yet.", "I need to check that count. Give me an offer that adds up while I look into it. We don't have a deal yet."],
  DISCLOSURE_BACKLASH: () => ["You have put that discrepancy on the table. It has not made this easier. I am not extending credit just because you have challenged the record.", "The discrepancy is out in the open, and this has not become easier. Challenging the record does not make me extend credit."],
  PRIVATE_VALUE_SPENT: () => ["I have the collection detail now. That was your choice to share; it was not an agreement for stock.", "You chose to give me the collection detail. I have it now. We did not agree to exchange stock for it."],
  DISCLOSURE_REPEATED: () => ["I already have that detail. Repeating it does not make a new bargain.", "You already gave me that detail. Saying it again does not create another bargain."],
  TOPIC_EXHAUSTED: () => ["We have covered that point. It has not become a new reason to change terms.", "That point has been covered. It gives me no new reason to change the terms."],
  HISTORY_INVOKED: () => ["I remember that shift. We got the loading done. We still have an unpaid account to discuss.", "We got the loading done, all right. Still have your account to settle."],
  HISTORY_ACKNOWLEDGED: () => ["You missed it. I appreciate you naming that plainly. The money is still owed.", "You did. I appreciate you saying it. The money is still owed."],
  BELIEF_CHALLENGED: c => c.shared ? ["The intake was signed off. The mismatch you showed me can be checked against it. That does not establish who is responsible.", "There is a sign-off. I can check the mismatch you showed me against it; that still does not tell us who caused it."] : ["The intake was signed off. If there is a specific discrepancy, it can be checked. A question alone does not settle it.", "There is a sign-off. Give me a specific discrepancy to check; the question alone does not settle it."],
  SOURCE_VERIFIED: c => c.shared ? ["The header and signature check out. That backs up the source of the detail you already showed me. Not everything it means.", "The header and signature check out. Now I can place the detail you showed me. What it means is another question."] : ["The header and signature check out. I know where the paper came from. What it means is another question.", "That header and signature look right. The source checks out; that doesn't settle what the paper means."],
  RELEVANCE_UNCERTAIN: () => ["I don't see how that helps with what we're settling here.", "For the business we're talking about? I can't see a use for it."],
  RELEVANCE_PICKUP: c => c.shared ? ["The collection detail you showed me could save a wasted journey if it checks out. You have already shared it; I have not promised a concession.", "That detail you showed me could save a trip if it checks out. I have it now. I have not promised better terms."] : ["Checked collection instructions could save a wasted journey. That is a reason to listen, not a promise of a concession.", "Could save me a wasted trip, if it checks out. I am listening; I have not promised better terms."],
  RELEVANCE_COUNT: c => c.shared ? ["The mismatch you showed me needs checking against the summary. It doesn't tell us who caused it, and it isn't a deal.", "That mismatch you showed me needs checking. It doesn't name who's responsible or settle our terms." ] : ["A count that doesn't match is worth checking against the summary. It wouldn't tell us who caused it.", "Show me a specific mismatch and it's worth checking. That alone wouldn't tell me who's responsible."],
  PARTIAL_ALREADY_FULL: () => ["You already told me the detail. Keeping it vague now won't take it back.", "I already heard the exact detail. You can't make it private again by talking around it."],
  PARTIAL_WITHHELD: () => ["I hear what kind of information you've got. You haven't told me the detail yet.", "You've told me what it's about, not the exact detail."],
  GENERAL: () => ["I have heard you. Let us see what that changes in the arrangement.", "I hear you. Let us look at what that means for the arrangement."],
});

export function buildNpcFrame(state, intent, decision) {
  requireLanguage(state && intent && decision, "missing resolved NPC context");
  let family;
  // The engine passes resolved metrics and history before appending this turn.
  // Emotional wording reflects that authored state, never changes it.
  const priorClarifications = state.events?.filter(event => event.intent.topic === "CLARIFY_OFFER").length ?? 0;
  const context = { terms: "", exchange: "", debt: state.metrics?.debt, shared: (state.world && projectMarcusInformation(state).disclosure === "FULL"),
    positive: decision.informationCauses?.some(cause => cause.factIds?.includes("POSITIVE_ROUTE")), r17Rate: decision.r17Rate ?? decision.derived?.extraChargeRate ?? 16,
    patience: state.metrics?.patience, tension: state.metrics?.tension,
    repeatedClarification: intent.topic === "CLARIFY_OFFER" && priorClarifications > 0 };
  const causes = decision.informationCauses || [];
  const has = kind => causes.some(cause => cause.kind === kind);
  const evidence = id => causes.some(cause => cause.evidenceIds?.includes(id));
  if (intent.action === "WALK") family = "WALK";
  else if (intent.action === "ACCEPT") family = "AGREED";
  else if (decision.r17Reaction || decision.reactionCause?.consequences?.r17Reaction) family = `R17_${decision.r17Reaction ?? decision.reactionCause.consequences.r17Reaction}`;
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
    if (!family && has("PARTIAL_DISCLOSURE")) family = (state.world && projectMarcusInformation(state).disclosure === "FULL") ? "PARTIAL_ALREADY_FULL" : "PARTIAL_WITHHELD";
    if (!family) family = ["TERMS", "DEBT", "RISK", "PRIORITIES", "FINAL_SAY", "GUARANTEE", "ENTITLEMENT"].includes(intent.topic) ? intent.topic : "GENERAL";
  }
  const suffixes = [];
  if (family.startsWith("R17_") && state.counteroffer) suffixes.push(`Review these terms: ${describeTerms(state.counteroffer.terms)}.`);
  // Preserve the early-return behavior of the existing canonical responder.
  if (!["WALK", "AGREED", "END", "CLARIFY", "REPEATED_ASK"].includes(family)) {
    if (state.counteroffer?.informationExchange && ["ACCEPT", "COUNTER"].includes(decision.outcome)) suffixes.push("The terms include the information exchange. I receive the private detail only when you confirm.");
    const contribution = decision.based?.contribution;
    if ((contribution?.tension ?? 0) >= 5 && (decision.social?.tension ?? 0) > 0) suffixes.push("And ease off. That approach makes me less willing to listen.");
    else if ((contribution?.confidence ?? 0) >= 3 && (decision.social?.confidence ?? 0) > 0) suffixes.push("I can work with a clear approach like that.");
  }
  if (!["WALK", "AGREED", "END"].includes(family)) {
    if (context.patience <= 3) suffixes.push("I'm almost out of patience. Make your decision.");
    else if (context.patience <= 6) suffixes.push("I'm running out of patience. We need to move this along.");
    else if (family === "CLARIFY" && context.repeatedClarification && context.patience <= 12) suffixes.push("We're going in circles. I need a decision, not another reading of the offer.");
    else if (family === "CLARIFY" && context.repeatedClarification) suffixes.push("We've been through these terms already. Take a moment and decide.");
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
