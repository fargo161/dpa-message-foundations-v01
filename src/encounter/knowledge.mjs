import { HISTORY_CONTENT, LORE_TOPICS } from "./history-content.mjs";

export function createLore(seed) {
  let hash = 2166136261;
  for (const character of `marcus-information-v1:${seed}`) hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507) >>> 0;
  const variant = ((hash ^ (hash >>> 13)) >>> 0) % 2 ? "POSITIVE" : "NEGATIVE";
  const entries = Object.values(HISTORY_CONTENT).filter(fact => !fact.variant || fact.variant === variant);
  const knownBy = actor => entries.filter(fact => fact.initialKnowers.includes(actor)).map(fact => fact.id);
  return {
    schemaVersion: "marcus-lore@0.1", variant,
    facts: Object.fromEntries(entries.map(fact => [fact.id, structuredClone(fact)])),
    privateFactId: variant === "POSITIVE" ? "POSITIVE_ROUTE" : "NEGATIVE_DISCREPANCY",
    knowledge: { player: knownBy("PLAYER"), marcus: knownBy("MARCUS"), marcusAwarePlayerKnows: entries.filter(fact => fact.initialKnowers.includes("PLAYER") && fact.initialKnowers.includes("MARCUS")).map(fact => fact.id) },
    beliefs: { source: "UNCHECKED", relevance: "UNTESTED", content: "UNKNOWN", record: variant === "NEGATIVE" ? "RECONCILED_CLAIM" : "NOT_APPLICABLE" },
    disclosure: "NONE", evidence: [], progressKeys: [], negativeWindow: null,
  };
}

export function hasLoreFact(state, id) {
  const fact = state.lore?.facts?.[id];
  return fact?.id === id && fact?.status === "ACTIVE" && fact?.scope === HISTORY_CONTENT[id]?.scope;
}
const knows = (state, id) => hasLoreFact(state, id) && state.lore.knowledge.player.includes(id);
export const hasEvidence = (state, id) => state.lore?.evidence?.some(item => item.id === id) ?? false;
export function privateInformation(state) {
  const id = state.lore?.privateFactId;
  return id && knows(state, id) ? state.lore.facts[id] : null;
}

export function informationEligibility(state, intent) {
  const no = reason => ({ allowed: false, reason });
  const yes = (reason = "Available.") => ({ allowed: true, reason });
  if (state.status !== "OPEN") return no("This encounter has ended; restart for another run.");
  if (!state.lore) return no("No encounter history is available.");
  if (["DEAL", "ACCEPT"].includes(intent.action) && !hasLoreFact(state, "STOCK_TITLE")) return no("There is no established authority to transfer this stock.");
  if (intent.action === "ACCEPT" && state.counteroffer?.informationExchange) {
    if (state.counteroffer.informationExchange.factId !== state.lore.privateFactId) return no("The current information condition no longer matches your available information.");
    return informationEligibility(state, { action: "DEAL", information: "OFFER_INFORMATION" });
  }
  if (intent.action === "DEAL") {
    if (!intent.information || intent.information === "NONE") return yes();
    if (intent.information !== "OFFER_INFORMATION") return no("Unknown information option.");
    if (!privateInformation(state) || state.lore.variant !== "POSITIVE") return no("You have no suitable private collection detail to offer in exchange.");
    if (state.lore.disclosure === "FULL" || state.lore.knowledge.marcus.includes(state.lore.privateFactId)) return no("Marcus already has the exact information; it is no longer private exchange value.");
    if (!hasLoreFact(state, "DIRECT_RECEIPT") || !hasEvidence(state, "SOURCE_VERIFIED")) return no("First establish the source without giving away the detail.");
    if (!hasLoreFact(state, "LEDGER_CLOSING") || !hasLoreFact(state, "PICKUP_NEED") || !hasEvidence(state, "RELEVANCE_OBSERVED")) return no("You have not established a useful reason for him to trade for this detail.");
    return yes("Offer the exact collection detail with the terms; it is delivered only when you confirm an agreement.");
  }
  if (intent.action !== "ASK") return yes();
  const requirements = {
    DEBT: ["OLD_ACCOUNT"], GUARANTEE: ["OLD_ACCOUNT"], RISK: ["STOCK_TITLE"], ENTITLEMENT: ["STOCK_TITLE"], TERMS: ["STOCK_TITLE"],
    SMALL_TALK: ["SHARED_LOADING_SHIFT"], ACK_MISSED: ["OLD_ACCOUNT", "MISSED_CHECKIN"],
    VERIFY_SOURCE: ["DIRECT_RECEIPT"], PROBE_USEFULNESS: ["LEDGER_CLOSING"], QUESTION_RECORD: ["RECORD_ASSERTION", "NEGATIVE_DISCREPANCY"],
  };
  if ((requirements[intent.topic] ?? []).some(id => !hasLoreFact(state, id))) return no("The relevant history or context for this question is not established.");
  if (["VERIFY_SOURCE", "PROBE_USEFULNESS", "QUESTION_RECORD", "DISCLOSE_PARTIAL", "DISCLOSE_FULL"].includes(intent.topic) && !privateInformation(state)) return no("You do not hold the relevant information in this encounter.");
  if (intent.topic === "QUESTION_RECORD" && state.lore.variant !== "NEGATIVE") return no("You have no specific record discrepancy to ask about.");
  return yes();
}

export function loreOptions(state) {
  return LORE_TOPICS.map(option => { const eligibility = informationEligibility(state, { action: "ASK", topic: option.id }); return { ...option, available: eligibility.allowed, reason: eligibility.reason }; });
}

export function informationPlayerText(state, intent) {
  const positive = state.lore?.variant === "POSITIVE";
  const shared = state.lore?.disclosure === "FULL";
  if (intent.action === "DEAL" && intent.information === "OFFER_INFORMATION") return "I offer the exact collection instructions with these terms, to be shared if we both agree. You are free to decline.";
  const phrases = {
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
  const lore = state.lore;
  if (!lore) return { briefing: [], playerKnowledge: [], disclosed: [], evidence: [], informationOptions: [] };
  const briefing = ["The old account and today's proposed purchase are separate. Hoped-for earnings are not cash."];
  for (const id of ["OLD_ACCOUNT", "MISSED_CHECKIN", "SHARED_LOADING_SHIFT"]) if (knows(state, id)) briefing.push(lore.facts[id].proposition);
  if (privateInformation(state)) briefing.push("You know the exact private information below. Marcus has not received its operative detail unless you disclose it or complete an information exchange. Its usefulness and his reaction are still for you to assess.");
  const playerKnowledge = lore.knowledge.player.filter(id => hasLoreFact(state, id)).map(id => lore.facts[id].proposition);
  const disclosed = lore.disclosure === "FULL" && privateInformation(state) ? [privateInformation(state).proposition]
    : lore.disclosure === "PARTIAL" ? ["Marcus has received a category hint; the exact operative detail is still withheld."] : [];
  if (hasEvidence(state, "SOURCE_VERIFIED")) disclosed.push("Marcus has checked the document's dated header and signature.");
  const eligibility = informationEligibility(state, { action: "DEAL", information: "OFFER_INFORMATION" });
  return { briefing, playerKnowledge, disclosed, evidence: lore.evidence.map(item => item.text), informationOptions: [
    { id: "NONE", label: "Keep information outside this proposal", available: state.status === "OPEN", reason: "No information exchange is attached." },
    { id: "OFFER_INFORMATION", label: "Include the private collection detail in a voluntary exchange", available: eligibility.allowed, reason: eligibility.reason },
  ] };
}
