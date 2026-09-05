# Knowledge and disclosure implementation

This is newly authored encounter content. The established premises are $250 owed, scarce cash and Marcus's ownership of the current Contra. An earlier Contra account as the debt's origin, a missed check-in, a shared loading shift, depot paperwork and the two private scenarios are new. Apartment and other foundation demonstration facts are not imported.

`history-content.mjs` exports a deeply frozen ten-entry `HISTORY_CONTENT`, frozen `LORE_TOPICS`, and frozen `INFORMATION_RULES`. Each catalog entry includes a proposition, scope, actors/context/validity, provenance, initial knowers/believers, player visibility, interests, preconditions, gameplay consequence, evidence, repetition/continuity, and an absence scenario. Eight entries are active per run: six common plus two belonging to the selected private scenario.

| Fact | Presence consequence | Absence comparison |
| --- | --- | --- |
| OLD_ACCOUNT | Grounds DEBT/GUARANTEE and the unpaid-account part of ACK_MISSED | DEBT and ACK_MISSED unavailable; the authoritative obligation is still $250 |
| STOCK_TITLE | Authorizes DEAL/ACCEPT and TERMS/RISK/ENTITLEMENT | No transaction or property-specific question is eligible |
| MISSED_CHECKIN | First specific acknowledgment adds confidence 3, tension -2 | ACK_MISSED unavailable |
| SHARED_LOADING_SHIFT | Optional first small talk adds confidence 1, tension -2 | SMALL_TALK unavailable; direct business remains possible |
| DIRECT_RECEIPT | VERIFY_SOURCE checks the header/signature, adds confidence 1 and source evidence | Verification and prepared information benefits unavailable |
| LEDGER_CLOSING | Supplies current context for usefulness and both information routes | PROBE_USEFULNESS unavailable; neither information bonus is grounded |
| POSITIVE_ROUTE | Player-held exact collection detail can be hinted, disclosed, or traded | Disclosure/trade unavailable |
| PICKUP_NEED | Gives checked collection detail a possible business use | Probe produces uncertainty, not useful-relevance evidence; exchange unavailable |
| NEGATIVE_DISCREPANCY | Player-held exact mismatch can be questioned and disclosed | Negative disclosure/record question unavailable |
| RECORD_ASSERTION | Grounds the pointed record question and contradiction of Marcus's reliance on reconciliation | QUESTION_RECORD unavailable; disclosure cannot open a negotiating window |

Unit test `every meaningful fact has a concrete absence consequence` executes all ten paired comparisons. `inactive, wrongly scoped or player-unknown facts` also verifies active status, expected scope and player possession. Fact removal fixtures are tests of authored-state eligibility, not client mutation features.

## Structured state

`createLore(seed)` returns an independent mutable state instance cloned from frozen content:

- `schemaVersion`, `variant`, `facts` keyed by stable ID, `privateFactId`.
- `knowledge.player`, `knowledge.marcus`, `knowledge.marcusAwarePlayerKnows`: fact-ID arrays. The player knows the private proposition at opening; Marcus initially knows neither its exact content nor that the player holds it. A category hint updates awareness without granting exact knowledge.
- `beliefs.source`: UNCHECKED/CHECKED; `relevance`: UNTESTED/POSSIBLY_USEFUL/NOT_ESTABLISHED; `content`: UNKNOWN/RECEIVED_UNVERIFIED/DOCUMENT_SUPPORTED; `record`: RECONCILED_CLAIM/CHALLENGED_UNVERIFIED/DISPUTED/NOT_APPLICABLE. The receipt's mismatch is not proof of theft or responsibility. Knowing a claim was made is distinct from adopting it as true.
- `disclosure`: NONE/PARTIAL/FULL; `evidence`: authored `{id,text,factIds}` observations; `progressKeys`: consumed factual progress records.
- `negativeWindow`: null or `{factId,openedAt,expiresAt,consumedAt,expiredAt?}`. These integers are event references, not gameplay meters. The opening expires after three subsequent turn positions and is consumed by the first subsequent DEAL even when unusable.

No new persistent numeric gameplay metric is added. Cash, debt, stocks and three social values remain the engine's seven metrics. The resolver's score bonuses and social deltas are derived turn effects, never client-provided state. Economic validation and exact-offer acceptance remain solely in the engine.

## Server boundary and disclosure ordering

`informationEligibility(state,intent)` runs for baseline ASK, new ASK, DEAL, ACCEPT and control actions; `loreOptions(state)` supplies the seven new server-gated topics. All DEAL/ACCEPT require authored stock ownership. Positive exchange requires the player's present fact, source verification, observed relevance, active business need/context, and still-private detail. Acceptance checks the current offer's fact identity and repeats that eligibility. The engine first validates closed input, run/version/offer identity and finances. Unknown request facts cannot enter the resolver.

`resolveInformation` is pure and returns `{lore,scoreBonus,social,progressKey,causes,feedback,exchange}`. Offer-time exchange metadata contains only the kind of promised detail, not its exact content. A proposal/rejection can reveal the category while leaving the detail private. Exact current-offer ACCEPT supplies the full proposition in the same candidate state as resource transfers; any validation failure discards the entire candidate. Withdrawal supplies nothing further. Clarification gives no social/information benefit and preserves the engine's exact offer while event time still advances.

Full disclosure always persists. Early positive disclosure removes the possibility of selling the information as private. Later verification can revise an already received claim to document-supported knowledge, but cannot restore exchange value or reopen a missed negative opportunity. Partial disclosure after full does not downgrade knowledge. Repeating facts, changing Vibe or rephrasing topics does not replay resolver rewards.

The positive +8 is a conditional price-negotiation input on each still-valid proposal carrying the same undelivered information obligation. It does not accumulate, produce repeated social rewards, or pay out on rejection; it is satisfied only once at acceptance. A negative +6 is instead a consumed temporal opportunity. Neither permits a proposal to bypass hard credit/stock/cash rules.

## Player-safe projection and later-team causes

`projectLore` returns only briefing, exact player knowledge, actually disclosed information, authored observations, and server eligibility explanations. Hidden business-interest propositions, variant IDs, quirk IDs, numeric thresholds, and window internals are absent from Play. Debug intentionally exposes authoritative state; this is not cryptographic secrecy. Every opening shows the player's own exact fact.

`informationPlayerText(state,intent)` supplies complete semantic ASK utterances and a standalone DEAL exchange sentence for H3 to append to financial terms. No utterance contains a demand backed by threatened exposure. Hostile delivery does not introduce a consequence or grant actual leverage.

Cause records are `{kind,factIds,evidenceIds,consequence,turn}`. Kinds distinguish history invocation/acknowledgment, evidence observation, belief challenge/revision, partial/full/repeated disclosure, information offered/exchanged, opportunity opened/used/expired/consumed, and backlash. H3's versioned reaction-cause record consumes these resolved causes. They support later personality/face interpretation without defining any face slot, emotion mapping or TPL authority. Foundation typed truth, belief and knowledge distinctions informed the design; no foundation fixture or live adapter authority was counterfeit.
