# Conversation and opening — lore v0.1

This is newly authored encounter content and interim plain dialogue. It does not activate TPL, final Marcus voice, a new BASED personality, or facial presentation.

## Opening and knowledge boundaries

`conversationView(state)` uses the player-safe `projectLore(state).briefing`. The browser separately displays player-known facts, information already disclosed to Marcus, and observable evidence. A factual receipt is not conflated with a clue about Marcus's preferences. Exact private content is shown to its owner at the opening, even while Marcus has not received it. The canonical history, availability rules, knowledge changes, and fact absence behavior belong to `history-content.mjs`, `knowledge.mjs`, and the authoritative engine.

Generic PRIORITIES and FINAL_SAY dialogue is shared across quirks. A broad question does not identify a hidden profile or optimal move. Information utterances come from `informationPlayerText`, with exact content reserved for full disclosure and acceptance of a represented exchange. DEAL explicitly offers a voluntary exchange; it contains no conditional exposure threat. Delivery labels preserve the existing canonical Vibe name and intensity, and financial sentences keep their exact quantities and deadlines.

## Flow and controls

CONTACT, BUSINESS, NEGOTIATION, and RESOLUTION describe the encounter's progress. The engine sets phase; presentation never uses it as an action gate. The player can go directly to business, optionally make small talk, probe, disclose, retain information, propose, clarify, accept, or leave. There is no mandatory dialogue corridor. The finite patience allowance and meaningful-progress policy are engine-owned; Play explains repetition costs without printing exact social values.

ASK topics and DEAL information choices, including availability and reasons, come from server options. The browser prevents accidental selection of unavailable choices and includes readable availability tables. These are usability affordances, never authorization. The server still validates every request and computes all effects.

Pure CLARIFY_OFFER has both an ASK option and a dedicated current-offer button. It submits the current request version while preserving the server's exact offer identity/version. Clarification consumes patience, and exhaustion ends negotiation. Other questions, disclosures, and new proposals invalidate an offer. The UI explains that distinction before acceptance. A bundled information offer shows its information condition alongside the financial terms; the agreement retains that condition after acceptance.

Each turn shows authored player speech, Marcus's response, and the resolved player-safe feedback under “What changed.” Play/Debug is a local observational toggle over the same snapshot. Failed or uncertain submissions are not automatically replayed: the client reloads authoritative state, preserves the draft, and disables mutation controls if resynchronization fails.

## Outcome quality

The provisional, newly authored intended objective is **at least two Contra units with positive accepted new principal**. A one-unit cash purchase is valid and reported as a limited acquisition; it is not mechanically prohibited. Resolution reports acquired units, cash retained, existing debt, new principal, extra repayment, total new obligation, repayment days, and qualitative relational changes relative to the opening. No extra persistent numerical metric or hidden victory score is added. No future resale or profit is simulated.

## Versioned reaction-cause handoff

`reactionCause(state, intent, decision, informationEffect)` runs after resolution and before the engine appends the event. `schemaVersion` is `marcus-reaction-cause@0.1`; `turnRef` contains the run identity and one-based event index.

| Field | Meaning |
| --- | --- |
| `semanticIntent` | Resolved structured action, topic or exact terms/offer identity, optional information choice, and unchanged delivery metadata. |
| `involvedFactIds` | Fact references supplied by resolved policy and information causes. |
| `observedEvidence` | Evidence records referenced by the current information causes. These remain separate from all private knowledge. |
| `consequences` | Outcome, rules, feedback, requested social change, information causes, progress reference, and whether an acceptance committed transfers. |
| `continuity` | Previous turn, phase/status, current offer identity, clarification preservation, and disclosure state. |
| `remainingAvenues` | Player-safe continuation or terminal directions. |

Requested social changes are explicitly labeled **requested**. The enclosing event's `before`, `after`, and `deltas` are authoritative for applied changes after clamping. Reaction causes are Debug-only. They do not grant foundation/TPL authority and do not map causes to emotions, facial assets, or anatomical slots. Later BASED/face work should consume this same resolved-turn reference, including terminal events, without recomputing transactions or inventing knowledge.

## Validation ownership

H3 verifies syntax for its JavaScript modules and checks message/source compatibility against existing contracts. H1 owns integrated repository validation and browser verification; H4 owns independent history, information, adversarial, and knowledge-boundary scenarios. Their reports distinguish actual execution evidence from these design descriptions.
