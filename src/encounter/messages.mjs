import { BASED_VIBES } from "../based.mjs";

const questions = Object.freeze({
  TERMS: "What terms would make more Contra on credit workable?",
  DEBT: "I still owe you money, and future profits are uncertain. How does that affect another deal?",
  RISK: "You would be putting more stock and money at risk. What would make that acceptable?",
  PRIORITIES: "What matters most to you in this negotiation?",
  FINAL_SAY: "Would you rather set the counterterms yourself?",
  GUARANTEE: "My future profits are guaranteed. Does that reassure you?",
  ENTITLEMENT: "Why won't you simply trust me with more stock?",
});

const describeTerms = (terms) => `${terms.units} Contra unit(s), $${terms.upfront} upfront, $${terms.repayment} new principal plus $${terms.extra} extra due in ${terms.days} day(s)`;

export function playerMessage(intent, options = {}) {
  const vibe = BASED_VIBES.find((entry) => entry.vibeId === intent.vibeId);
  const label = `[${vibe?.name ?? intent.vibeId} / ${intent.intensity}]`;
  if (intent.action === "ASK") return `${label} ${questions[intent.topic]}`;
  if (intent.action === "DEAL") return `${label} I propose ${describeTerms(intent.terms)}. This is in addition to my existing debt.`;
  if (intent.action === "ACCEPT") return `${label} I accept the current offer${options.offer?.terms ? `: ${describeTerms(options.offer.terms)}` : ""}. My existing debt remains separate.`;
  return `${label} I am walking away from this negotiation.`;
}

export function marcusMessage(state, intent, decision) {
  if (intent.action === "WALK") return "Then we leave it here. The old debt still stands.";
  if (intent.action === "ACCEPT") return "Agreed. The stock is yours on the terms you just confirmed. The old account stays on the books.";
  if (decision.outcome === "END") return "Enough. I am closing this conversation. No new stock changes hands.";
  if (decision.derived.repetition > 0 && intent.action === "ASK") return "I have answered that. Changing the delivery does not change the account. Bring me terms, or leave it.";
  let response;
  if (decision.outcome === "ACCEPT") response = `I can agree to ${describeTerms(intent.terms)}. Review it and confirm if you want the deal. Until then, the stock stays here.`;
  else if (decision.outcome === "COUNTER") response = `Not on those terms. Here is what I will put my name to: ${describeTerms(decision.counterTerms)}. Your existing debt is separate. Take a look before you decide.`;
  else if (decision.outcome === "REJECT") response = decision.derived.projectedTension >= 65
    ? "With this much friction, I am not extending myself. Better numbers alone will not settle this conversation."
    : "That leaves too much riding on money you do not have yet. Bring more cash, ask for less stock, or shorten the wait. A bigger promise is not security.";
  else {
    const answers = {
      TERMS: "Contra is $60 a unit. Put real cash down, keep the new credit modest, and give me a short repayment date. Extra repayment can help, but it is still only a promise.",
      DEBT: `The $${state.metrics.debt} already on your account stays there. Another deal adds its own principal and any agreed extra; it does not replace what you owe.`,
      RISK: "My stock leaves today. Your earnings might come later, or might not. Cash now and a smaller request give me something solid.",
      PRIORITIES: state.quirk === "final_say" ? "Give me room to decide what I can live with. I can name terms of my own."
        : state.quirk === "plain_dealing" ? "Tell me what is owed and what is uncertain. I can price a risk; I cannot work with a story that hides it."
          : "Remember whose stock leaves the shelf and whose money is waiting. Start there, and we can talk.",
      FINAL_SAY: state.quirk === "final_say" ? "Yes. Bring your proposal, then let me name my terms. I do not like being boxed in." : "You can propose. I can counter. Neither of us owes the other a yes.",
      GUARANTEE: "No. Calling future profit guaranteed does not make it cash. Keep the uncertainty in the open.",
      ENTITLEMENT: "No. The old loan is an unpaid account, not a ticket to my shelf.",
    };
    response = answers[intent.topic];
  }
  const contribution = decision.based.contribution;
  if (contribution.tension >= 5) response += " And ease off. That approach makes me less willing to listen.";
  else if (contribution.confidence >= 3) response += " I can work with a clear approach like that.";
  return response;
}
