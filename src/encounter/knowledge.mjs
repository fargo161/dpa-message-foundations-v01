import { LORE_TOPICS } from "./history-content.mjs";

import { projectPlayerInformation } from "./marcus-world-adapter.mjs";

export function hasLoreFact(state, id) {
  return !!state.world && projectPlayerInformation(state).factIds.includes(id);
}
const knows = hasLoreFact;
export const hasEvidence = (state, id) => !!state.world && projectPlayerInformation(state).evidence.some(item => item.id === id);
export function privateInformation(state) {
  if (!state.world) return null;
  const player = projectPlayerInformation(state);
  return player.privateFactId ? player.facts[player.privateFactId] : null;
}

export function informationEligibility(state, intent) {
  const lore = state.world ? projectPlayerInformation(state) : null;
  const no = reason => ({ allowed: false, reason });
  const yes = (reason = "Available.") => ({ allowed: true, reason });
  if (state.status !== "OPEN") return no("This encounter has ended; restart for another run.");
  if (!lore) return no("No encounter history is available.");
  if (["DEAL", "ACCEPT"].includes(intent.action) && !hasLoreFact(state, "STOCK_TITLE")) return no("There is no established authority to transfer this stock.");
  if (intent.action === "ACCEPT" && state.counteroffer?.informationExchange) {
    if (state.counteroffer.informationExchange.factId !== lore.privateFactId) return no("The current information condition no longer matches your available information.");
    return informationEligibility(state, { action: "DEAL", information: "OFFER_INFORMATION" });
  }
  if (intent.action === "DEAL") {
    if (!intent.information || intent.information === "NONE") return yes();
    if (intent.information !== "OFFER_INFORMATION") return no("Unknown information option.");
    if (!privateInformation(state) || !lore.r17.held) return no("You do not hold R-17 to trade.");
    if (lore.disclosure === "FULL") return no("Marcus already has the exact information; it is no longer private exchange value.");
    return yes("Attach counterfoil R-17; it stays yours until you confirm the exchange. Hint first to learn whether Marcus cares.");
  }
  if (intent.action !== "ASK") return yes();
  if (["R17_HINT", "R17_SHOW"].includes(intent.topic)) {
    if (!privateInformation(state) || !lore.r17.available) return no("R-17 is no longer available: it has been spent or traded.");
    return yes(intent.topic === "R17_HINT" ? "Learn whether Marcus cares, keeping the detail private. No fee change." : "Show the source and detail together; spend R-17's leverage for three percentage points of goodwill.");
  }
  const requirements = {
    DEBT: ["OLD_ACCOUNT"], GUARANTEE: ["OLD_ACCOUNT"], RISK: ["STOCK_TITLE"], ENTITLEMENT: ["STOCK_TITLE"], TERMS: ["STOCK_TITLE"],
    SMALL_TALK: ["SHARED_LOADING_SHIFT"], ACK_MISSED: ["OLD_ACCOUNT", "MISSED_CHECKIN"],
    VERIFY_SOURCE: ["DIRECT_RECEIPT"], PROBE_USEFULNESS: [], QUESTION_RECORD: ["RECORD_ASSERTION", "NEGATIVE_DISCREPANCY"],
  };
  if ((requirements[intent.topic] ?? []).some(id => !hasLoreFact(state, id))) return no("The relevant history or context for this question is not established.");
  if (["VERIFY_SOURCE", "PROBE_USEFULNESS", "QUESTION_RECORD", "DISCLOSE_PARTIAL", "DISCLOSE_FULL"].includes(intent.topic) && !privateInformation(state)) return no("You do not hold the relevant information in this encounter.");
  if (intent.topic === "QUESTION_RECORD" && lore.privateFactId !== "NEGATIVE_DISCREPANCY") return no("You have no specific record discrepancy to ask about.");
  return yes();
}

export function loreOptions(state) {
  const lore = state.world ? projectPlayerInformation(state) : null;
  return LORE_TOPICS.map(option => { const eligibility = informationEligibility(state, { action: "ASK", topic: option.id }); return { ...option, ...(option.id === "VERIFY_SOURCE" && lore?.disclosure === "FULL" ? { label: "Check the source of the detail already shared" } : {}), available: eligibility.allowed, reason: eligibility.reason }; });
}

export function informationPlayerText(state, intent) {
  const lore = state.world ? projectPlayerInformation(state) : null;
  const positive = lore?.privateFactId === "POSITIVE_ROUTE";
  const shared = lore?.disclosure === "FULL";
  if (intent.action === "DEAL" && intent.information === "OFFER_INFORMATION") return "I offer counterfoil R-17 and its exact detail with these terms, to be transferred only if we both agree. You are free to decline.";
  const phrases = {
    R17_HINT: positive ? "I have a document about a collection change. Do you care about that information? I'm keeping the detail covered." : "I have a document about an intake-count mismatch. Do you care about that information? I'm keeping the detail covered.",
    R17_SHOW: `Here is counterfoil R-17, its header and signature, and the exact detail: ${privateInformation(state)?.proposition ?? "No private detail is available."}`,
    SMALL_TALK: "How has the loading been since that shift we worked together last week?",
    ACK_MISSED: "I missed yesterday's check-in about the unpaid account. I should have shown up. Can we discuss what comes next?",
    VERIFY_SOURCE: shared ? "Here's today's depot header and signature on my counterfoil. Do they check out as the source of the detail I already showed you?" : "Here's today's depot header and signature on my counterfoil. I'm keeping the detail covered. Does the source check out?",
    PROBE_USEFULNESS: shared ? (positive ? "Do the collection instructions I showed you help with your arrangements?" : "Does the count mismatch I showed you matter for the stock record?") : positive ? "Would a change to the collection instructions matter to you?" : "Would a count mismatch on paper matter for the stock record?",
    DISCLOSE_PARTIAL: shared ? "You already have the exact detail from my counterfoil. Can we discuss what that kind of information means for your business?" : positive ? "I have a depot notice that changes the collection arrangements. Would details like that be useful?" : "My counterfoil points to a mismatch in an intake count. Would you look at that kind of discrepancy?",
    DISCLOSE_FULL: `Here is the exact detail I have: ${privateInformation(state)?.proposition ?? "No private detail is available."} What do you make of it?`,
    QUESTION_RECORD: shared ? "You said the signed intake summary was reconciled. Can you check the mismatch I showed you against it?" : "You said the signed intake summary was reconciled. Could the count still be wrong?",
  };
  return phrases[intent.topic] ?? "";
}

export function projectLore(state) {
  const lore = state.world ? projectPlayerInformation(state) : null;
  if (!lore) return { briefing: [], playerKnowledge: [], disclosed: [], evidence: [], informationOptions: [] };
  const briefing = ["The old account and today's proposed purchase are separate. Hoped-for earnings are not cash."];
  for (const id of ["OLD_ACCOUNT", "MISSED_CHECKIN", "SHARED_LOADING_SHIFT"]) if (knows(state, id)) briefing.push(lore.facts[id].proposition);
  if (privateInformation(state)) briefing.push(lore.disclosure === "FULL" ? "Marcus now has the exact information below. Sharing it did not erase your debt or promise a deal." : `You know the exact information below. Marcus does not have the detail yet. ${lore.privateFactId === "POSITIVE_ROUTE" ? "You can keep it private, share it, or offer it with terms if it is useful to him." : "You can keep it private or decide when to reveal it. His reaction is still for you to assess."}`);
  const playerKnowledge = lore.factIds.filter(id => hasLoreFact(state, id)).map(id => lore.facts[id].proposition);
  const disclosed = lore.disclosure === "FULL" && privateInformation(state) ? [privateInformation(state).proposition]
    : lore.disclosure === "PARTIAL" ? ["Marcus knows what kind of information you hold; the exact detail is still private."] : [];
  if (hasEvidence(state, "SOURCE_VERIFIED")) disclosed.push("Marcus has checked the document's dated header and signature.");
  const eligibility = informationEligibility(state, { action: "DEAL", information: "OFFER_INFORMATION" });
  return { briefing, playerKnowledge, disclosed, evidence: lore.evidence.map(item => item.text), informationOptions: [
    { id: "NONE", label: "Keep information outside this proposal", available: state.status === "OPEN", reason: "No information exchange is attached." },
    { id: "OFFER_INFORMATION", label: "Trade counterfoil R-17 with these terms", available: eligibility.allowed, reason: eligibility.reason },
  ] };
}
