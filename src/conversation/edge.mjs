import { hasEvidence, privateInformation } from "../encounter/knowledge.mjs";
import { keywordBank } from "./keyword-bank.mjs";

const visibleEvidence = new Set(["SOURCE_VERIFIED", "RELEVANCE_OBSERVED", "RELEVANCE_UNCERTAIN", "RECORD_QUESTIONED"]);

function openingView(state) {
  const window = state.lore.negativeWindow;
  if (!window) return state.lore.variant === "NEGATIVE" && state.lore.disclosure === "FULL"
    ? { status: "NOT_OPENED", label: "No cooperative opening was offered. Checking the source cannot replay the reveal.", remainingTurns: null }
    : { status: "NONE", label: "No brief proposal opening has been offered.", remainingTurns: null };
  if (window.consumedAt !== null) return { status: "USED", label: "The first proposal after the reveal has used this opening. That does not mean a concession was earned.", remainingTurns: 0 };
  // The invitation permits subsequent turn positions through expiresAt inclusive.
  // After that final position, lazy expiry has not necessarily mutated the lore yet.
  const remainingTurns = Math.max(0, window.expiresAt - state.events.length);
  if (!remainingTurns || window.expiredAt || state.status !== "OPEN") return {
    status: "ELAPSED", label: "The brief proposal opening has passed. The mismatch remains shared.", remainingTurns: 0,
  };
  return { status: "AVAILABLE", label: `He invited a proposal while rechecking the mismatch. ${remainingTurns} turn${remainingTurns === 1 ? "" : "s"} remain, including your next move. Terms and delivery still matter.`, remainingTurns };
}

/** Working memory of player-owned information and witnessed responses, never an NPC score readout. */
export function edgeView(state) {
  const fact = privateInformation(state);
  if (!fact) return null;
  const lore = state.lore;
  const positive = fact.id === "POSITIVE_ROUTE";
  const keywordId = positive ? "collection-change" : "intake-mismatch";
  const sourceChecked = hasEvidence(state, "SOURCE_VERIFIED");
  const relevanceObserved = hasEvidence(state, "RELEVANCE_OBSERVED");
  const relevanceUncertain = hasEvidence(state, "RELEVANCE_UNCERTAIN");
  const disclosure = lore.disclosure === "FULL"
    ? { id: "FULL", label: "Exact detail shared. It cannot become private again." }
    : lore.disclosure === "PARTIAL"
      ? { id: "PARTIAL", label: "Category shared; exact detail still private." }
      : { id: "NONE", label: "Exact detail private; category not yet shared." };
  const opening = openingView(state);
  const bank = keywordBank(state);
  const candidates = bank.find(card => card.id === keywordId)?.actions ?? [];
  const preferred = [];
  if (opening.status === "AVAILABLE") preferred.push("propose-terms");
  if (!sourceChecked) preferred.push("ask-verify-source");
  if (!relevanceObserved && !relevanceUncertain) preferred.push("ask-probe-usefulness");
  if (!positive && lore.disclosure !== "FULL" && !hasEvidence(state, "RECORD_QUESTIONED")) preferred.push("ask-question-record");
  if (positive && lore.disclosure !== "FULL") preferred.push("offer-information");
  if (!positive && lore.disclosure !== "FULL") preferred.push("ask-disclose-full");
  preferred.push("propose-terms");
  const chosen = preferred.map(id => candidates.find(action => action.id === id && action.available)).find(Boolean);
  // Positive information cards do not own ordinary DEAL: link to the existing stock subject.
  const ordinary = bank.find(card => card.id === "contra-stock")?.actions.find(action => action.id === "propose-terms" && action.available);
  const clarify = bank.find(card => card.id === "current-offer")?.actions.find(action => action.id === "ask-clarify-offer" && action.available);
  const action = clarify ? { keywordId: "current-offer", contextActionId: clarify.id, label: "Clarify the current offer (uses a turn)" }
    : chosen ? { keywordId, contextActionId: chosen.id, label: chosen.label }
    : ordinary ? { keywordId: "contra-stock", contextActionId: ordinary.id, label: ordinary.label } : null;
  const observations = lore.evidence.filter(item => visibleEvidence.has(item.id)).map(item => item.text);
  if (state.counteroffer?.informationExchange?.factId === fact.id && lore.disclosure !== "FULL") {
    observations.push("The current offer promises this exact detail on confirmation. It remains private until you confirm; another proposal replaces that offer.");
  }
  if (!positive && lore.disclosure !== "FULL") {
    const missing = [!sourceChecked && "the source has not been checked", !relevanceObserved && "a current use has not been established", !hasEvidence(state, "RECORD_QUESTIONED") && "the record has not been questioned"].filter(Boolean);
    observations.push(missing.length ? `Before an irreversible reveal: ${missing.join("; ")}. Preparation does not guarantee cooperation.`
      : "Source, relevance and the record question have been addressed. Revealing the exact mismatch is irreversible and does not guarantee cooperation.");
  }
  return {
    title: positive ? "Changed collection instructions" : "The two-crate mismatch",
    detail: fact.proposition,
    disclosure,
    source: sourceChecked ? { id: "CHECKED", label: "Marcus checked the header and signature; this alone proves neither usefulness nor wrongdoing." }
      : { id: "UNCHECKED", label: "Marcus has not checked the source with you." },
    relevance: relevanceObserved ? { id: "OBSERVED", label: "He indicated a possible use; he has not promised a concession." }
      : relevanceUncertain ? { id: "UNCERTAIN", label: "He did not identify a current use for this information." }
        : { id: "UNTESTED", label: "You have not asked him whether this category matters." },
    observations,
    opening,
    action,
  };
}
