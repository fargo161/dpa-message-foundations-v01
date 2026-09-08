const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

const entry = (id, proposition, details) => ({
  id, proposition, scope: "ACTUAL", status: "ACTIVE", actor: "PLAYER", target: "MARCUS",
  context: "MARCUS_CONTRA_NEGOTIATION", validity: "This encounter; no later-world simulation.",
  provenance: { sourceId: "marcus-lore-authored-v01", sourceRecordId: id, status: "NEW_AUTHORED_ENCOUNTER_CONTENT" },
  initialKnowers: ["PLAYER", "MARCUS"], initialBelievers: ["PLAYER", "MARCUS"], playerVisible: true,
  continuity: "The fact persists; acknowledgment does not erase history.", ...details,
});

export const HISTORY_CONTENT = freeze({
  OLD_ACCOUNT: entry("OLD_ACCOUNT", "The player owes Marcus $250 on an earlier Contra account, still unpaid.", {
    provenance: { sourceId: "marcus-lore-authored-v01", sourceRecordId: "OLD_ACCOUNT", status: "NEW_AUTHORED_ENCOUNTER_CONTENT", establishedBasis: "$250 outstanding debt to Marcus", authoredExtension: "The debt originated in an earlier Contra account." },
    interest: "Outstanding liability limits further credit; the player needs new stock without pretending the old debt disappeared.",
    mechanic: "Authorizes DEBT/GUARANTEE context and, with MISSED_CHECKIN, ACK_MISSED. Absence never erases the separate economic ledger.",
    use: "Acknowledge the account or the specific missed check-in.", preconditions: ["Unpaid authoritative obligation"],
    evidence: "Both parties have the existing account amount.", repetition: "Specific acknowledgment pays once; the liability persists.",
    acceptanceScenario: "Remove OLD_ACCOUNT: DEBT and ACK_MISSED become unavailable while obligations.existing remains 250.",
  }),
  STOCK_TITLE: entry("STOCK_TITLE", "Marcus owns and controls the Contra on the shelf; only an agreed transaction transfers it.", {
    actor: "MARCUS", target: "CONTRA",
    provenance: { sourceId: "marcus-established-premise", sourceRecordId: "STOCK_TITLE", status: "ESTABLISHED_PREMISE" },
    interest: "His property grounds the financial risk and his authority to sell it.",
    mechanic: "Required for DEAL, ACCEPT, TERMS, RISK and ENTITLEMENT. No fact means no authorized transaction.",
    use: "Ask about risk or negotiate a voluntary purchase.", preconditions: ["Current stock and affordability independently checked by engine"],
    evidence: "Marcus retains the stock until acceptance.", repetition: "No mention reward; exact transfer occurs once.",
    acceptanceScenario: "Remove STOCK_TITLE: a previously valid DEAL/ACCEPT is ineligible; resources remain untouched.",
  }),
  MISSED_CHECKIN: entry("MISSED_CHECKIN", "The player missed yesterday's agreed check-in on that unpaid account.", {
    interest: "A specific failure explains why another unsupported promise is weak evidence.",
    mechanic: "With OLD_ACCOUNT, enables ACK_MISSED: first acknowledgment adds confidence 3 and lowers tension 2.",
    use: "Name the missed check-in without claiming the debt was paid.", preconditions: ["OLD_ACCOUNT"],
    evidence: "Opening briefing reminds the player of the missed appointment.", repetition: "One progress key for this historical event, independent of Vibe.",
    acceptanceScenario: "Remove MISSED_CHECKIN: ACK_MISSED cannot authorize the one-time acknowledgment benefit.",
  }),
  SHARED_LOADING_SHIFT: entry("SHARED_LOADING_SHIFT", "The player and Marcus worked a loading shift together last week and completed the count.", {
    interest: "A recent, concrete instance of cooperation gives optional contact a basis without proving future repayment.",
    mechanic: "Enables SMALL_TALK; first grounded opening adds confidence 1 and lowers tension 2.",
    use: "Ask how the loading has been since their shift.", preconditions: [],
    evidence: "Both remember the shared work, but it does not identify a hidden preference.", repetition: "One contact progress key, not renewable goodwill.",
    acceptanceScenario: "Remove SHARED_LOADING_SHIFT: SMALL_TALK is unavailable; direct business still works.",
  }),
  DIRECT_RECEIPT: entry("DIRECT_RECEIPT", "The player holds today's signed depot counterfoil R-17, received directly during collection; its header and signature can be checked without showing its exact detail.", {
    target: "DEPOT_COUNTERFOIL", initialKnowers: ["PLAYER"], initialBelievers: ["PLAYER"],
    interest: "A checkable document gives Marcus a reason to consider the information beyond the player's unpaid promises.",
    mechanic: "Required for VERIFY_SOURCE and any prepared information benefit. Verification discloses only provenance, never the secret line.",
    use: "Show the dated header and signature while covering the operative line.", preconditions: ["Player knows active private fact"],
    evidence: "Marcus recognizes the depot signature; this authenticates source, not guaranteed usefulness or guilt.",
    repetition: "SOURCE_VERIFIED evidence recorded once.",
    acceptanceScenario: "Remove DIRECT_RECEIPT: VERIFY_SOURCE unavailable and positive trade cannot become credible.",
  }),
  LEDGER_CLOSING: entry("LEDGER_CLOSING", "Marcus is closing today's short stock ledger before arranging tomorrow's collection.", {
    actor: "MARCUS", initialKnowers: ["MARCUS"], initialBelievers: ["MARCUS"], playerVisible: false,
    interest: "Collection accuracy and unresolved counts are relevant now rather than generic trivia.",
    mechanic: "Required context for PROBE_USEFULNESS, prepared positive exchange and a negative opportunity.",
    use: "Ask whether collection paperwork or an unresolved count would matter to today's decisions.", preconditions: ["Active private fact"],
    evidence: "He references collection arrangements or unfinished reconciliation when asked; that is a partial observation of business interest.",
    repetition: "Relevance probe progresses once; no inference grants a complete hidden profile.",
    acceptanceScenario: "Remove LEDGER_CLOSING: usefulness probe unavailable and neither information bonus is authorized.",
  }),
  POSITIVE_ROUTE: entry("POSITIVE_ROUTE", "Today's signed counterfoil says tomorrow's Contra collection moved to loading gate C, between 07:00 and 07:30, using docket R-17.", {
    variant: "POSITIVE", initialKnowers: ["PLAYER"], initialBelievers: ["PLAYER"],
    interest: "The exact gate, window and docket can prevent a wasted collection; the player can trade those private details for better terms.",
    mechanic: "Enables partial/full disclosure and, after verification and relevance evidence, OFFER_INFORMATION with a bounded +8 proposal score.",
    use: "Offer a voluntary exchange or disclose freely; no adverse consequence is attached to refusal.", preconditions: ["DIRECT_RECEIPT", "LEDGER_CLOSING", "PICKUP_NEED for score bonus"],
    evidence: "Category hint concerns changed collection instructions; full detail remains covered until full disclosure or accepted exchange.",
    repetition: "Partial is not full; once fully disclosed it cannot be offered as private again.",
    continuity: "Accepted exchange atomically gives Marcus the exact detail; rejected or withdrawn offers leave the detail private.",
    acceptanceScenario: "Remove POSITIVE_ROUTE: disclosure and information exchange are unavailable; early full disclosure removes later trade value.",
  }),
  PICKUP_NEED: entry("PICKUP_NEED", "Marcus has tomorrow's collection to arrange and has not received the changed pickup instructions.", {
    variant: "POSITIVE", actor: "MARCUS", initialKnowers: ["MARCUS"], initialBelievers: ["MARCUS"], playerVisible: false,
    interest: "Makes the particular route detail useful without equating the secret with cash.",
    mechanic: "Required for useful-relevance evidence and positive exchange bonus; absence makes a checked source insufficient.",
    use: "Probe usefulness without naming the exact route.", preconditions: ["LEDGER_CLOSING", "POSITIVE_ROUTE"],
    evidence: "He says collection instructions could save him a wasted journey, without promising a concession.",
    repetition: "Observation only once; no certainty about final approval.",
    acceptanceScenario: "Remove PICKUP_NEED: a probe yields no RELEVANCE_OBSERVED evidence; OFFER_INFORMATION stays unavailable.",
  }),
  NEGATIVE_DISCREPANCY: entry("NEGATIVE_DISCREPANCY", "Counterfoil R-17 records six crates returned against stock ledger entry L-42's eight: a two-crate mismatch. It does not establish theft or who caused the error.", {
    variant: "NEGATIVE", initialKnowers: ["PLAYER"], initialBelievers: ["PLAYER"],
    interest: "A documented mismatch challenges reconciliation and can redirect Marcus toward concluding a defensible deal while sorting his record.",
    mechanic: "Prepared full disclosure can open +6 on the first later DEAL within three subsequent turn positions; hostile/unprepared disclosure causes backlash.",
    use: "Ask a pointed record question, then disclose a discrepancy without a threat or demand.", preconditions: ["DIRECT_RECEIPT", "LEDGER_CLOSING", "RECORD_ASSERTION and prior record question for useful path"],
    evidence: "The receipt contradicts a count, not Marcus's character; provenance and context must be established first.",
    repetition: "Full disclosure is permanent; window is consumed once, expires, and cannot reopen.",
    acceptanceScenario: "Remove NEGATIVE_DISCREPANCY: record question and disclosure become unavailable; no opening exists.",
  }),
  RECORD_ASSERTION: entry("RECORD_ASSERTION", "Marcus has said the signed intake summary is reconciled; he believes that eight-crate entry has been checked.", {
    variant: "NEGATIVE", scope: "BELIEF", actor: "MARCUS", initialBelievers: ["MARCUS"],
    provenance: { sourceId: "marcus-lore-authored-v01", sourceRecordId: "RECORD_ASSERTION", status: "DISPUTED_BELIEF" },
    interest: "The inconsistency matters because he is currently relying on that summary, not because embarrassment guarantees compliance.",
    mechanic: "Required for QUESTION_RECORD, useful relevance and negative opportunity. Full disclosure revises the belief to DISPUTED when source is verified.",
    use: "Ask whether signed intake records can contain a counting error.", preconditions: ["NEGATIVE_DISCREPANCY"],
    evidence: "He says a signature is evidence, then concedes he would check a specific discrepancy.",
    repetition: "Question progresses once; belief revision does not erase the historic statement or create guilt.",
    acceptanceScenario: "Remove RECORD_ASSERTION: QUESTION_RECORD is unavailable and negative disclosure cannot open a bonus window.",
  }),
});

export const LORE_TOPICS = freeze([
  { id: "SMALL_TALK", label: "Ask about loading since your shared shift" },
  { id: "ACK_MISSED", label: "Acknowledge the missed debt check-in" },
  { id: "VERIFY_SOURCE", label: "Show the document's source, keeping its detail covered" },
  { id: "PROBE_USEFULNESS", label: "Ask whether this kind of information could matter" },
  { id: "DISCLOSE_PARTIAL", label: "Share a category hint; retain the exact detail" },
  { id: "DISCLOSE_FULL", label: "Disclose your exact information now" },
  { id: "QUESTION_RECORD", label: "Question the claim that the intake record is reconciled" },
]);

export const INFORMATION_RULES = freeze({ positiveScoreBonus: 8, negativeScoreBonus: 6, negativeWindowTurns: 3, maximumPreparedTension: 45 });
