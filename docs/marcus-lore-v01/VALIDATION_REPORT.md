# Independent Marcus lore gameplay review

## Result and evidence boundary

**Independent acceptance passed: 21 tests, 0 failures** across `encounter-history.test.mjs` (7), `encounter-information.test.mjs` (9), and `encounter-lore-adversarial.test.mjs` (5). The final run used the integrated source after the concession, disclosure-order and Play projection repairs. Acceptance is based on executed authoritative transitions and real loopback HTTP requests, not implementer test names or reported outcomes.

Baseline: `72451fac5bcc857a3811fc78ace782118431e3f2`, isolated branch `codex/marcus-lore-information-v01`. The baseline's patience 12, blanket three-turn cutoff and universal offer invalidation were compared with the intended replacement. New behavior has patience 20; fact/topic progress and genuinely improved financial proposals can matter after turn three; pure clarification alone preserves an offer. Existing economy and identity invariants remain.

`SCENARIO_RESULTS.json` records executed final metrics, obligations, knowledge/beliefs, seeded routes, ten fact comparisons and selected event-level traces. Six seed/quirk/variant combinations were tested with both EA and SE at BALANCED delivery: twelve complete information-assisted credit agreements. The record is review evidence, not a save file or runtime authority.

The lead owns the single integrated repository-gate run and actual browser verification. This reviewer did not independently operate the browser, open a tunnel, or claim publicly shareable access. Browser evidence and final npm/build/generated/Git results belong in the lead's handoff. Review acceptance does not substitute for those release gates.

## Fifteen acceptance requirements

| Requirement | Independently executed evidence |
| --- | --- |
| 1. Opening and private knowledge | Every combination's Play lore includes the player's exact private proposition and 250 debt history. It omits hidden business-interest propositions and exposes only four economic values; Marcus initially lacks the private fact. |
| 2. Seed reachability/replay | All six combinations are reached by the listed seeds. Equal seeded preparation reproduces full state. Twelve useful full routes succeed across EA/SE, without a mandatory Vibe. |
| 3. Meaningful fact absence | All ten catalog entries have paired authoritative-state fixtures. Nine absent facts block the associated actual ASK transition; absent PICKUP_NEED produces uncertain relevance and blocks the information DEAL. Removal does not erase the economic debt. |
| 4. Positive value and giveaway | The matched 41-upfront proposal counters without exchange and approves with exchange. Early full disclosure permanently removes exchange eligibility. Proposal/clarification deliver no exact detail; acceptance delivers it atomically. |
| 5. Negative opportunity/backlash | A prepared mismatch changes a matched 48-upfront proposal from COUNTER to ACCEPT through a +6 bounded opportunity. Unprepared BA/OVERT disclosure raises tension, creates no opening, and cannot later replay into an opening. |
| 6. No PRESSURE | New options accept only authored ASK/DEAL semantics. HTTP PRESSURE and threatened-exposure information values fail closed. Executed authored speech contains no conditional adverse threat; hostile delivery does not change known facts. |
| 7. Knowledge continuity | Partial/category disclosure and source verification do not grant the operative detail. Full disclosure persists. Repeating it, changing Vibe, withdrawing an unaccepted exchange, or rejecting a proposal never creates a second payout. |
| 8. Ordering | Probe/verify/question before negative disclosure opens a window; disclose before preparation does not. Later verification updates an already received claim to DOCUMENT_SUPPORTED and a negative record to DISPUTED, while private value/window stay spent. |
| 9. Optional contact | A direct financial proposal can immediately reach useful credit. Optional grounded small talk improves contact but is not required. |
| 10. Longer meaningful conversation | A six-exchange route contains contact, specific missed-check-in acknowledgment, source check, relevance probe, weaker proposal and a real later concession. It ends in useful credit; later progress remains beneficial. Repeated small talk and oscillating financial terms cannot farm goodwill and finite patience ends repetition. |
| 11. Economic authority | Invalid information proposals cannot bypass cash, stock, integral/principal or term bounds even at maximum confidence. Debt stays separate. A one-unit cash purchase is valid and distinguished from two-unit credit. |
| 12. Offers and isolation | Pure clarification preserves exact offer/condition identity while request version advances. Disclosure/material discussion invalidates it. Tests reject stale/foreign/cross-session offers, duplicate disclosure/acceptance, terminal actions and old runs after restart. Two concurrent acceptances commit once. |
| 13. Play/Debug boundary | Four economic values agree with Debug. Serialized Play omits raw private fact IDs, hidden lore propositions, causes and thresholds. Debug is intentionally served to the client; no cryptographic secrecy is claimed. Source inspection confirms the toggle reads the same snapshot without posting mutations. |
| 14. Malformed inputs | Real HTTP fact/knowledge/evidence/delta injection, invalid information choices, unknown action and invalid economic terms reject with no projected state mutation. Invalid acceptance never partly discloses information. |
| 15. Reaction causes | Resolved events retain exact semantic fields, one-based turn references, previous-turn continuity, outcome/reasons, involved facts, consequences and remaining avenues. Agreement, withdrawal and exhaustion terminal records are exercised. No face slot/EMP mapping is implemented. |

## Concrete playable comparisons

Positive seed `independent-lore-2` (Recognition): VERIFY_SOURCE, PROBE_USEFULNESS, then propose 2 units / 41 upfront / 79 new principal / 0 extra / 7 days, using EA/BALANCED. The matched proposal scores 14.12 and receives COUNTER with NONE; OFFER_INFORMATION scores 22.12 and receives approval. CLARIFY_OFFER preserves the exact offer. Acceptance finishes at cash 39, debt 329, Marcus stock 6 and player stock 2, and discloses the route. Giving the full detail away before preparation removes the later exchange option.

Negative seed `independent-lore-5` (Recognition): VERIFY_SOURCE, PROBE_USEFULNESS, QUESTION_RECORD, DISCLOSE_FULL, then propose 2 units / 48 upfront / 72 new principal / 0 extra / 7 days with EA/BALANCED. The prepared window gives score 22.2 and approval; the matched clone with only its window removed gives score 16.2 and COUNTER. Acceptance finishes at cash 32, debt 322, Marcus stock 6 and player stock 2. The control isolates the opportunity's mechanical contribution; it is a reviewer fixture, not a player state-editing capability.

The first subsequent DEAL consumes the negative opening whether successful or not. Three intervening ASK turns push a following proposal beyond expiry and yield zero information bonus. Repeated disclosure cannot reset the opening date. Immediate BA/OVERT disclosure produces backlash instead.

The useful six-exchange route is SMALL_TALK, ACK_MISSED, VERIFY_SOURCE, PROBE_USEFULNESS (SE/BALANCED), a 2-unit/40-upfront/80-principal/0-extra/12-day proposal, then a 2-unit/60-upfront/60-principal/12-extra/7-day concession (EA/BALANCED), followed by acceptance. It ends at cash 20, debt 322, stock 6/2, confidence 61, tension 6 and patience 14. The social values are review/Debug evidence, not Play disclosure.

## Findings fixed and verified

- **Late verification left stale beliefs and contradictory feedback.** Full disclosure followed by verification/probing retained RECEIVED_UNVERIFIED and could say the exact detail was still withheld. The repaired transition updates document support and negative record belief without restoring exchange value; feedback acknowledges earlier disclosure. Dedicated regression passes for both variants.
- **A token cash increase rewarded a much worse proposal.** After offering 1 unit/60 cash/0 credit/1 day, asking for 8 units/61 cash/419 credit/30 days previously raised confidence 44 to 48 and lowered tension despite refusal. A genuine concession now cannot worsen quantity, upfront, principal or deadline relative to the previous proposal and must improve a historical record. The hostile-risk regression and real late-concession route both pass.
- **Incomplete causal fact references.** Baseline debt/property/proposal reactions originally omitted governing lore IDs. Integrated engine causes now include active OLD_ACCOUNT/STOCK_TITLE where relevant and structured intent/proposal/phase records. Resolved cause continuity tests pass.
- **Cookie rename mismatch during integration.** The new cookie setter initially disagreed with its parser. Both now use the isolated lore cookie; real HTTP session/restart/acceptance tests pass.
- **Play offer serialization contained diagnostic fact IDs.** The lead identified and stripped the authoritative exchange fact ID from public offer/proposal/agreement projections. Independent assertions verify no POSITIVE_ROUTE diagnostic ID appears in serialized Play before or after accepted exchange; Debug retains the required condition.

No reviewer finding remains open. Two initial test fixtures were corrected without changing product behavior: outcome quality is derived in `play.conversation.outcomeQuality`, and the first positive sample at 40 upfront remained a counter; independently finding the 41-upfront threshold established an actual matched approval difference.

## Reproduction and limits

Run from the isolated worktree:

```powershell
$reviewRepo = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Codex\2026-09-04\r\work\marcus-lore'
Set-Location -LiteralPath $reviewRepo
node --test tests/encounter-history.test.mjs tests/encounter-information.test.mjs tests/encounter-lore-adversarial.test.mjs
if ($LASTEXITCODE -ne 0) { throw "Independent lore review failed: $LASTEXITCODE" }
```

The tests start and close ephemeral loopback servers; they do not require the development server, external corpora, accounts or network publication. They are registered in the portable test runner. Absence and bounded-condition control fixtures directly alter cloned authored state for tests only; HTTP clients cannot submit those mutations.

This is a finite, in-memory prototype. Scores are derived, exact hidden state is intentionally available in Debug, and information value is a newly authored design choice. The review does not prove balance for every possible sequence or implement durable saves, profit/resale, future repayment, final voice, full TPL, or facial presentation. H4 made no Git writes, dependency changes, public publication or edits outside its three tests and two evidence reports.

Conservative incremental H4 token estimate for this lore mission: **30,000–45,000**, including scoped reads, test construction, independent execution, regression review and reporting. This is an estimate, not a measured/enforced aggregate cap.
