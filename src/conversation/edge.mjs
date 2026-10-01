import { projectPlayerInformation } from "../encounter/marcus-world-adapter.mjs";
import { hasEvidence, privateInformation } from "../encounter/knowledge.mjs";
import { keywordBank } from "./keyword-bank.mjs";

const visibleEvidence = new Set(["SOURCE_VERIFIED", "RELEVANCE_OBSERVED", "RELEVANCE_UNCERTAIN", "RECORD_QUESTIONED"]);

function openingView(state) {
  const lore = projectPlayerInformation(state);
  const window = lore.negativeWindow;
  if (!window) return lore.privateFactId === "NEGATIVE_DISCREPANCY" && lore.disclosure === "FULL"
    ? { status: "NOT_OPENED", label: "No cooperative opening was offered. Checking the source cannot replay the reveal.", remainingTurns: null }
    : { status: "NONE", label: "No brief proposal opening has been offered.", remainingTurns: null };
  if (window.consumedAt !== null) {
    if (window.consumedAt > window.expiresAt) return { status: "ELAPSED", label: "The opening expired before your proposal. The mismatch remains shared; this proposal did not use the opening.", remainingTurns: 0 };
    return { status: "USED", label: "Your first proposal after the reveal has spent the opening. That does not mean a concession was earned.", remainingTurns: 0 };
  }
  // The invitation permits subsequent turn positions through expiresAt inclusive.
  // After that final position, lazy expiry has not necessarily mutated the lore yet.
  const remainingTurns = Math.max(0, window.expiresAt - state.events.length);
  if (!remainingTurns || window.expiredAt || state.status !== "OPEN") return {
    status: "ELAPSED", label: "The brief proposal opening has passed. The mismatch remains shared.", remainingTurns: 0,
  };
  return { status: "AVAILABLE", label: `He invited a proposal while rechecking the mismatch. ${remainingTurns} ${remainingTurns === 1 ? "turn remains" : "turns remain"}, including your next move. Terms and delivery still matter.`, remainingTurns };
}

/** Working memory of player-owned information and witnessed responses, never an NPC score readout. */
export function legacyEdgeView(state) {
  const fact = privateInformation(state);
  if (!fact) return null;
  const lore = projectPlayerInformation(state);
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
    source: sourceChecked ? { id: "CHECKED", shortLabel: "Source checked", label: positive ? "Marcus checked the header and signature. That does not guarantee he will trade for the instructions." : "Marcus checked the header and signature; this alone proves neither usefulness nor wrongdoing." }
      : { id: "UNCHECKED", label: "Marcus has not checked the source with you." },
    relevance: relevanceObserved ? { id: "OBSERVED", label: "He indicated a possible use; he has not promised a concession." }
      : relevanceUncertain ? { id: "UNCERTAIN", label: "He did not identify a current use for this information." }
        : { id: "UNTESTED", label: "You have not asked him whether this category matters." },
    observations,
    opening,
    action,
  };
}

/** Proof surface; possession and transfer history remain independent of disclosure. */
export function edgeView(state) {
  if (!state?.world) return null;
  const player = projectPlayerInformation(state), fact = player.facts[player.r17FactId];
  if (!fact) return null;
  const r17 = player.r17;
  const lifecycle = r17.traded ? "Traded" : !r17.available ? "Spent" : r17.hinted ? "Hinted" : "Held";
  const observations = [];
  if (r17.blindTradeFailed) observations.push("The failed blind Trade adds six percentage points for this encounter. Editing or removing R-17 cannot erase it.");
  if (r17.shown) observations.push("Show goodwill subtracts three percentage points for this encounter, alongside any earlier penalty.");
  if (r17.interestKnown) observations.push(r17.knownMarcusInterest ? "Marcus has told you he cares about R-17." : "Marcus has told you he does not care about R-17.");
  if (state.counteroffer?.informationExchange) observations.push("R-17 remains yours and private until you confirm this information exchange. Replacing the offer removes its temporary trade value.");
  const bank = keywordBank(state);
  const keyword = bank.find(card => card.id === (player.r17FactId === "POSITIVE_ROUTE" ? "collection-change" : "intake-mismatch"));
  const desired = !r17.interestKnown ? "ask-r17-hint" : r17.knownMarcusInterest ? "offer-information" : "ask-r17-show";
  const move = keyword?.actions.find(action => action.id === desired && action.available);
  const ordinary = bank.find(card => card.id === "contra-stock")?.actions.find(action => action.id === "propose-terms" && action.available);
  const clarify = bank.find(card => card.id === "current-offer")?.actions.find(action => action.id === "ask-clarify-offer" && action.available);
  return { title: "Counterfoil R-17", detail: fact.proposition,
    card: { id: lifecycle.toUpperCase(), label: lifecycle, physicallyHeld: r17.held },
    disclosure: { id: player.disclosure, label: player.disclosure === "FULL" ? "Exact detail shared." : player.disclosure === "PARTIAL" ? "Category shared; exact detail private." : "Exact detail private; category not shared." },
    relevance: { id: r17.interestKnown ? r17.knownMarcusInterest ? "CARES" : "DOES_NOT_CARE" : "UNTESTED", label: r17.interestKnown ? r17.knownMarcusInterest ? "Marcus cares." : "Marcus does not care." : "Interest unknown. Hint is a safe probe." },
    note: r17.blindTradeFailed ? `${r17.held ? "R-17 is still physically held. " : ""}The blind-trade penalty remains active.` : "",
    observations,
    action: state.status !== "OPEN" ? null : clarify ? { keywordId: "current-offer", contextActionId: clarify.id, label: clarify.label } : move ? { keywordId: keyword.id, contextActionId: move.id, label: move.label } : ordinary ? { keywordId: "contra-stock", contextActionId: ordinary.id, label: ordinary.label } : null };
}
