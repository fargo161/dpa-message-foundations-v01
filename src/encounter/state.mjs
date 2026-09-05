export const METRIC_DEFINITIONS = [
  { key: "cash", label: "Player cash", min: 0, max: 100000, meaning: "Money available now; hoped-for profits are excluded." },
  { key: "debt", label: "Outstanding debt", min: 0, max: 100000, meaning: "Existing debt plus accepted new principal and extra repayment." },
  { key: "marcusStock", label: "Marcus Contra", min: 0, max: 100, meaning: "Units Marcus can transfer." },
  { key: "playerStock", label: "Player Contra", min: 0, max: 100, meaning: "Units already transferred to you." },
  { key: "confidence", label: "Marcus confidence", min: 0, max: 100, meaning: "How credible he finds your commitment." },
  { key: "tension", label: "Marcus tension", min: 0, max: 100, meaning: "How strained this conversation has become." },
  { key: "patience", label: "Marcus patience", min: 0, max: 12, meaning: "Remaining willingness to keep negotiating." },
];
export const PRICE = 60;
export const TOPICS = [
  { id: "TERMS", label: "Ask what terms are possible" },
  { id: "DEBT", label: "Acknowledge the unpaid debt and uncertain profits" },
  { id: "RISK", label: "Acknowledge the financial risk he would take" },
  { id: "PRIORITIES", label: "Ask what matters most to him" },
  { id: "FINAL_SAY", label: "Invite him to set counterterms" },
  { id: "GUARANTEE", label: "Claim that future profits are guaranteed" },
  { id: "ENTITLEMENT", label: "Ask why he will not simply trust you" },
];
export function createState(seed, runId, quirk = "final_say") {
  return { schemaVersion: "marcus-encounter@0.1", runId, seed, quirk, status: "OPEN",
    metrics: { cash: 80, debt: 250, marcusStock: 8, playerStock: 0, confidence: 40, tension: 20, patience: 12 },
    obligations: { existing: 250, principal: 0, extra: 0, days: null },
    proposal: null, counteroffer: null, agreement: null, events: [], clues: [] };
}
export function availableActions(state) {
  return ["ASK", "DEAL", "ACCEPT", "WALK"].map(action => ({ action,
    available: state.status === "OPEN" && (action !== "ACCEPT" || !!state.counteroffer),
    reason: state.status !== "OPEN" ? "This encounter has ended; restart for another run." : action === "ACCEPT" && !state.counteroffer ? "No current offer to accept." : "Available" }));
}
export function withdraw(state) {
  if (state.status !== "OPEN") throw new Error("Encounter has ended.");
  return { ...structuredClone(state), status: "WITHDRAWN", counteroffer: null };
}
