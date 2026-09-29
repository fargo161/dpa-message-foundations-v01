import { projectPlayerInformation } from "../encounter/marcus-world-adapter.mjs";
const playerInfo = state => state.world ? projectPlayerInformation(state) : null;
import { TOPICS } from "../encounter/state.mjs";
import { LORE_TOPICS } from "../encounter/history-content.mjs";
import { hasLoreFact, informationEligibility, privateInformation } from "../encounter/knowledge.mjs";

const topicLabels = new Map([...TOPICS, ...LORE_TOPICS].map(topic => [topic.id, topic.label]));
const knows = (state, id) => hasLoreFact(state, id) && playerInfo(state).factIds.includes(id);

// These are player-known subject instances, not additional foundation predicates.
// The private NPC context remains in the existing eligibility policy, never cards.
const subjects = [
  { id: "contra-stock", fact: "STOCK_TITLE", label: "Contra on the shelf", kind: "GOODS", actions: ["PROPOSE", "TERMS", "RISK", "FINAL_SAY", "ENTITLEMENT"] },
  { id: "old-account", fact: "OLD_ACCOUNT", label: "The old account", kind: "OBLIGATION", actions: ["DEBT", "ACK_MISSED", "GUARANTEE"] },
  { id: "missed-check-in", fact: "MISSED_CHECKIN", label: "Yesterday's missed check-in", kind: "HISTORY", actions: ["ACK_MISSED", "DEBT", "GUARANTEE"] },
  { id: "shared-shift", fact: "SHARED_LOADING_SHIFT", label: "Last week's loading shift", kind: "HISTORY", actions: ["SMALL_TALK"] },
  { id: "depot-counterfoil", fact: "DIRECT_RECEIPT", label: "Signed counterfoil R-17", kind: "DOCUMENT", actions: ["VERIFY_SOURCE", "PROBE_USEFULNESS", "DISCLOSE_PARTIAL", "QUESTION_RECORD", "DISCLOSE_FULL", "EXCHANGE"] },
  { id: "collection-change", fact: "POSITIVE_ROUTE", label: "Changed collection instructions", kind: "INFORMATION", actions: ["VERIFY_SOURCE", "PROBE_USEFULNESS", "EXCHANGE", "DISCLOSE_PARTIAL", "DISCLOSE_FULL"] },
  { id: "intake-mismatch", fact: "NEGATIVE_DISCREPANCY", label: "The two-crate mismatch", kind: "INFORMATION", actions: ["VERIFY_SOURCE", "PROBE_USEFULNESS", "QUESTION_RECORD", "DISCLOSE_PARTIAL", "DISCLOSE_FULL", "PROPOSE"] },
  { id: "reconciled-record", fact: "RECORD_ASSERTION", label: "The reconciliation claim", kind: "REPORTED_CLAIM", actions: ["QUESTION_RECORD", "VERIFY_SOURCE", "PROBE_USEFULNESS", "DISCLOSE_FULL"] },
];

const requiredKnown = {
  DEBT: ["OLD_ACCOUNT"], GUARANTEE: ["OLD_ACCOUNT"], ACK_MISSED: ["OLD_ACCOUNT", "MISSED_CHECKIN"],
  TERMS: ["STOCK_TITLE"], RISK: ["STOCK_TITLE"], ENTITLEMENT: ["STOCK_TITLE"], PROPOSE: ["STOCK_TITLE"],
  SMALL_TALK: ["SHARED_LOADING_SHIFT"], VERIFY_SOURCE: ["DIRECT_RECEIPT"],
  QUESTION_RECORD: ["RECORD_ASSERTION", "NEGATIVE_DISCREPANCY"],
};
const informationMoves = new Set(["VERIFY_SOURCE", "PROBE_USEFULNESS", "QUESTION_RECORD", "DISCLOSE_PARTIAL", "DISCLOSE_FULL", "EXCHANGE"]);
const descriptions = {
  TERMS: "Ask about possible terms before making a proposal.",
  DEBT: "Acknowledge the unpaid account without treating hoped-for profits as cash.",
  RISK: "Recognize that releasing stock on credit would put Marcus's money at risk.",
  PRIORITIES: "Ask what matters to him; his answer may leave room for interpretation.",
  FINAL_SAY: "Invite him to set counterterms; this does not promise that he will agree.",
  GUARANTEE: "Claim future profits are certain. This is an unsupported claim and may damage credibility.",
  ENTITLEMENT: "Challenge his reluctance to trust you. This can strain the conversation.",
  SMALL_TALK: "Bring up the loading shift you actually shared. Repeating it cannot renew goodwill.",
  ACK_MISSED: "Name the specific missed appointment. Acknowledgment does not repay the account.",
  VERIFY_SOURCE: "Show the dated header and signature while keeping the exact detail covered.",
  PROBE_USEFULNESS: "Mention the category and ask if it could matter; keep the exact detail private.",
  QUESTION_RECORD: "Question the signed record without alleging theft or revealing the exact mismatch.",
  DISCLOSE_PARTIAL: "Say what kind of information you have while keeping the exact detail private.",
  DISCLOSE_FULL: "Give the exact detail now without an agreement in return. Disclosure cannot be undone.",
  PROPOSE: "Build a voluntary offer in the deal table. Nothing transfers until you confirm a current agreement.",
  EXCHANGE: "Include the private detail in your proposal. It is delivered only when you confirm the agreement.",
  CLARIFY_OFFER: "Ask about the current offer without changing its identity, terms, or information condition. This still uses a turn.",
  ACCEPT: "Confirm the exact current offer. Cash, stock, and any promised information transfer together.",
  WALK: "End the conversation without accepting a transaction or sharing any promised private detail.",
};

function authoredMove(key) {
  if (key === "PROPOSE") return { id: "propose-terms", label: "Build an offer", intent: { action: "DEAL", information: "NONE" } };
  if (key === "EXCHANGE") return { id: "offer-information", label: "Trade the private detail with the offer", intent: { action: "DEAL", information: "OFFER_INFORMATION" } };
  if (key === "ACCEPT") return { id: "accept-offer", label: "Confirm the current offer", intent: { action: "ACCEPT" } };
  if (key === "WALK") return { id: "walk-away", label: "Walk away", intent: { action: "WALK" } };
  return { id: `ask-${key.toLowerCase().replaceAll("_", "-")}`, label: topicLabels.get(key) ?? "Clarify the current offer", intent: { action: "ASK", topic: key } };
}

function actionCard(state, key) {
  const action = authoredMove(key);
  let eligibility = informationEligibility(state, action.intent);
  if ((requiredKnown[key] ?? []).some(id => !knows(state, id)) || (informationMoves.has(key) && !privateInformation(state))) {
    eligibility = { allowed: false, reason: "You do not hold the relevant knowledge for this move." };
  }
  if (["ACCEPT", "CLARIFY_OFFER"].includes(key) && !state.counteroffer) eligibility = { allowed: false, reason: "No current offer is available." };
  if (state.status !== "OPEN") eligibility = { allowed: false, reason: "This encounter has ended; restart for another run." };
  let description = descriptions[key];
  if (playerInfo(state)?.disclosure === "FULL") {
    const sharedDescriptions = {
      VERIFY_SOURCE: "Show the dated header and signature to check the source of the detail Marcus already has.",
      PROBE_USEFULNESS: "Ask whether the detail you already shared is useful to him.",
      QUESTION_RECORD: "Ask him to check the record against the mismatch you already shared, without alleging theft.",
      DISCLOSE_PARTIAL: "Revisit the kind of information you shared. Marcus already has the exact detail.",
      DISCLOSE_FULL: "Repeat the exact detail Marcus already has. Repeating it creates no new bargaining value.",
    };
    if (sharedDescriptions[key]) description = sharedDescriptions[key];
    if (key === "VERIFY_SOURCE") action.label = "Check the source of the detail already shared";
  }
  if (state.counteroffer && (action.intent.action === "DEAL" || (action.intent.action === "ASK" && key !== "CLARIFY_OFFER"))) {
    description += " Sending this move replaces or closes the current offer; browsing does not.";
  }
  const completion = actionCompletion(state, key, action.intent);
  return { ...action, description, available: eligibility.allowed, reason: eligibility.reason, completion };
}

function actionCompletion(state, key, intent) {
  if (intent.action !== "ASK" || key === "CLARIFY_OFFER") return null;
  const observedKeys = {
    VERIFY_SOURCE: "evidence:DIRECT_RECEIPT", PROBE_USEFULNESS: `relevance:${playerInfo(state).privateFactId}`,
    QUESTION_RECORD: "question:RECORD_ASSERTION", SMALL_TALK: "history:SHARED_LOADING_SHIFT", ACK_MISSED: "history:MISSED_CHECKIN",
  };
  const done = key === "DISCLOSE_FULL" ? playerInfo(state).disclosure === "FULL"
    : key === "DISCLOSE_PARTIAL" ? playerInfo(state).disclosure !== "NONE"
      : observedKeys[key] ? playerInfo(state).progressKeys.includes(observedKeys[key])
        : state.events.some(event => event.intent?.action === "ASK" && event.intent.topic === key);
  const label = !done ? "Not yet discussed." : key === "DISCLOSE_FULL" ? "Exact detail already shared; repeating does not renew its value."
    : key === "DISCLOSE_PARTIAL" ? "Category already shared; another hint adds no new information."
      : observedKeys[key] ? "Already addressed; repeating cannot renew this step's progress."
        : "Asked before; repeating still uses a turn.";
  return { done, label };
}

function actionsFor(state, keys) {
  return keys
    .filter(key => (requiredKnown[key] ?? []).every(id => knows(state, id)))
    .filter(key => !informationMoves.has(key) || privateInformation(state))
    // Never reveal that another run contains a different private-information route.
    .filter(key => key !== "QUESTION_RECORD" || (knows(state, "RECORD_ASSERTION") && knows(state, "NEGATIVE_DISCREPANCY")))
    .filter(key => key !== "EXCHANGE" || (knows(state, "POSITIVE_ROUTE") && playerInfo(state).privateFactId === "POSITIVE_ROUTE"))
    .map(key => actionCard(state, key))
    .sort((left, right) => Number(right.available) - Number(left.available));
}

function subjectSummary(state, subject) {
  if (subject.fact === "RECORD_ASSERTION") return "Marcus said the signed intake summary was reconciled. Your counterfoil records a conflicting count; neither a signature nor a mismatch establishes blame.";
  let text = playerInfo(state).facts[subject.fact].proposition;
  if (subject.fact === playerInfo(state).privateFactId) {
    text += playerInfo(state).disclosure === "FULL"
      ? " You have already shared the exact detail. It cannot become private again."
      : playerInfo(state).disclosure === "PARTIAL"
        ? " You have said what kind of information it is; the exact detail remains private."
        : " You have not shared the exact detail in this encounter.";
  }
  return text;
}

/** Pure, player-safe subject projection. Term validation and resolution remain engine-owned. */
export function keywordBank(state) {
  // Scenario-specific adapters can use this same output contract without importing Marcus lore.
  if (!state?.world) return [];
  const cards = subjects.filter(subject => knows(state, subject.fact)).map(subject => ({
    id: subject.id, label: subject.label, kind: subject.kind, summary: subjectSummary(state, subject), actions: actionsFor(state, subject.actions),
  }));
  cards.push({ id: "conversation", label: "This conversation", kind: "CONVERSATION", summary: "Ask what matters, invite counterterms, or choose to leave.", actions: actionsFor(state, ["PRIORITIES", "FINAL_SAY", "WALK"]) });
  if (state.counteroffer) cards.unshift({
    id: "current-offer", label: "The current offer", kind: "PROPOSAL",
    summary: "There is an offer on the table. Review the exact terms before confirming; clarification keeps them open.",
    actions: actionsFor(state, ["CLARIFY_OFFER", "ACCEPT", "PROPOSE", "WALK"]),
  });
  const kindLabels = { GOODS: "Goods", OBLIGATION: "Debt", HISTORY: "Shared history", DOCUMENT: "Document", INFORMATION: "Information", REPORTED_CLAIM: "What Marcus said", CONVERSATION: "Conversation", PROPOSAL: "Offer" };
  return cards.map(card => ({ ...card, kindLabel: kindLabels[card.kind] ?? card.kind }));
}
