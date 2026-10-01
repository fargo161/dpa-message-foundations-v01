# Marcus R-17 information exchange — implementation and validation

Implemented the locked brief, Section 35 and user requirements A–G. All required gates pass. The public information loop is Hint → decide between Show and Trade, with independent content/interest and persistent consequences.

## Repository state

- Repository: `C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01` (fargo161/dpa-message-foundations-v01).
- Current branch: `codex/r17-information-exchange-v01`, newly created from `bdecd96` after successful `git fetch --all --prune`.
- Starting HEAD: `bdecd96eb310deebc15cb231a305c45f4569831e`.
- Ending HEAD: `bdecd96eb310deebc15cb231a305c45f4569831e`. Implementation and deliverables remain local, uncommitted on the new branch. No push.
- Pre-existing tracked changes: none. Pre-existing untracked `Temp/` preserved: UnityLockfile and eight post-merge-gate logs. No commands wrote to that directory.
- No checkout, commit, push or branch update was made to any `codex/marcus-encounter-v01` branch.
- The unrelated Quest Player / As Above So Below document was excluded. The user's new branch instruction supersedes the attached brief's old expected branch.

## Fresh baseline and final validation

The pre-change baseline was run afresh on the new branch before edits. It passed 391 tests, zero failures, skips or cancellations (192259.9911 ms). No pre-existing failures. The previous 391-pass log was not used as the baseline.

| Check | Actual result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Pass; 78 packages installed; lockfile unchanged |
| Fresh pre-change `npm test` | 391 passed / 0 failed |
| Final `npm test` | 425 passed / 0 failed / 0 skipped (141228.7927 ms) |
| New mechanic/public tests | 28 + 5 tests; included in the 425 |
| New migration coverage test | 1; included in the 425 |
| Final UI checks after visible-rate placement fix | 17 passed / 0 failed |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run schema:validate` | Pass; authoritative world grammar unchanged |
| `npm run build` | Pass; 180 matrix cells, 60 anchors, nine source manifests |
| `node scripts/check-generated.mjs` | Pass; three tracked artifacts match the build |
| Standalone builder | Pass; 44 modules, 28 embedded WebP face assets |
| Standalone parity | Six passed / 0 failed; exact source/asset inventory, all 23 routes / 127 snapshots and all 20 new R-17 golden routes |
| Golden capture | 20 asserted routes across all four combinations |
| `git diff --check` | Pass |

Build-generated foundation reports remain semantically identical to HEAD. Git may show their refreshed working-tree files because of Windows line-ending/stat normalization; no foundation content was changed.

Logs and browser evidence live in [validation](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/docs/marcus-information-exchange-v01/validation/). The final UI check was run after the browser-discovered percentage-placement correction. Subsequent report-generator typing and migration-rule wording corrections do not change runtime mechanics.

## Mechanics and precedence

`resolveR17Rate` is the single rate resolver. It uses percentage points: 16 base, minus three if Show occurred, plus six if a blind unwanted Trade failed. It returns eight only when the current proposal includes available R-17, Marcus cares, and no prior failure poisons that exchange. `r17ExtraFloor` applies `Math.ceil(newPrincipal * percentage / 100)`, consistently for counters and approval.

Marcus may approve only when both his existing approval conditions and that minimum extra pass. An otherwise strong under-floor proposal receives a counter preserving the submitted units, upfront cash, principal and days and raising only extra. Exposure limits are rechecked at the raised floor. Existing scoring and credit limits remain operative. No R-17 proof score bonus is granted.

Content uses the existing deterministic version hash. Interest uses a separate `marcus-r17-interest-v1:` namespace with the same seeded hashing convention. Both resolve once. A 2,000-seed test requires each content version's care fraction to lie between 45% and 55%. Observed GOOD: 537 care / 481 do not; BAD: 500 care / 482 do not.

Hint sends category only, honestly reports interest, retains ownership/private detail and changes no fee. The GOOD disinterest line is “Depot already called me about the collection change.” The BAD line trusts the clerk's count. These are Marcus's private attitudes, not prior receipt of R-17 body claims. All four initial states have disclosure NONE and zero Marcus R-17 body claims.

Show stages header, signature and body presentation in one existing ledger commit. Existing perception, mark recognition and belief projection supply checked source and DOCUMENT_SUPPORTED content. No shadow acceptance override is used. Show records its own persistent goodwill fact and spends leverage while leaving the physical document with the player. The discrepancy remains documentary support for conflicting counts, not proof of theft or responsibility.

Trade selection in the draft has no authoritative effect. Sending exposes the category, records whether the attempt was blind and reveals Marcus's interest. A valuable proposal carries an information exchange condition in the existing counteroffer. The exact detail and ownership remain with the player until confirmation. ACCEPT commits stock/cash/obligation settlement, supported document presentation, PLAYER→MARCUS document transfer and encounter closure atomically.

A first unwanted blind Trade records one persistent failure, keeps the card and protected body, and yields 22%. Removing, readding or repeating the card cannot reset or compound it. Redundant Hint repeats disinterest without another economic effect. Show remains available and combines with the penalty for 19%, including later offers. Hint and Trade are unavailable after Show or completed transfer.

The temporary eight-percent offer value ends when the next proposal omits R-17; a later proposal can reattach still-held valuable R-17. A withdrawn, rejected or uncompleted offer never transfers it.

## Authoritative state model

- **Possession:** existing world-ledger document transfers; player holdings determine physical ownership. Transfer history independently preserves the public Traded label after the player no longer holds R-17.
- **Detail knowledge:** ledger READ/SEEN/TOLD records and claim/belief projections. Disclosure, authentication and substantive acceptance remain distinct.
- **Interest:** Marcus's fixed private NEEDS/R17 attitude. Player `interestKnown` and `knownMarcusInterest` derive from witnessed exact Marcus interest replies.
- **Proof consequences:** independent encounter progress facts `r17:shown` and `r17:blind-failure`; neither overwrites the other. They are committed alongside the corresponding world transition. Trade-attempt facts preserve the original blind/known history.
- **UI:** `r17.available` derives from current physical holdings and unspent disclosure. Your Edge shows Held, Hinted, Spent or Traded, observed interest and a retained-card penalty note. It exposes no private interest before a reply. Debug additionally exposes the private care value and exact active percentage.
- **Offer rate:** the resolved percentage is bound to the current counteroffer/agreement. Ordinary projections resolve from persistent facts when no contingent offer exists.

The dropdown offers R-17 for both versions immediately, after Hint and after a failed blind Trade. After Show or transfer it is unavailable. The old source/probe/question/detail ladder is filtered from the public surface; generic negotiation and history actions remain.

Five existing face presets distinguish interested Hint, uninterested Hint, Show goodwill, valuable Trade and blind failure. Six authored reply families cover those results plus repeated/unwanted Trade without a new penalty. BASED and intensity retain presentation/social interpretation, but cannot alter interest, document action or rate; tests exercise all 20 Vibes × three intensities.

## Observed golden matrix

All rates below were asserted in both versions, with the appropriate interest seed. The matched proposal uses two units, $70 upfront, $50 principal, $0 proposed extra and seven days. Existing approval conditions determine whether a counter is needed.

| Route | Rate | Whole-dollar extra on $50 principal | Card/detail |
| --- | ---: | ---: | --- |
| Hoard | 16% | $8 | Held, private |
| Show | 13% | $7 | Spent leverage; still physically held; detail supported |
| Hint → Trade / cares | 8% | $4 | Private/held until confirmation; Traded afterward |
| Hint → Trade / does not care | 16% | $8 | Held, private; no exchange |
| Blind Trade / cares | 8% | $4 | Private/held until confirmation |
| Blind Trade / does not care | 22% | $11 | Held, private; interest known; failure persists |
| Failed blind Trade → Show | 19% | $10 | Spent leverage; failure persists |
| Remove uncompleted valuable R-17 | 8% → 16% | $4 → $8 | Held, still private |
| Reattach valuable R-17 | 16% → 8% | $8 → $4 | Current-offer value only |
| Repeat failed Trade | 22% → 22% | $11 → $11 | No second penalty; no eight-percent bonus |

The strong-approval regression explicitly verifies a proposal with extra $10 after failure is countered at $11, and that $11 can be approved only when the existing conditions pass. Boundary tests exercise whole-dollar ceiling rounding for all five percentages.

| Content | Interest | Reproducible seed |
| --- | --- | --- |
| GOOD | Cares | `r17-proof-0` |
| GOOD | Does not care | `r17-proof-1` |
| BAD | Does not care | `r17-proof-2` |
| BAD | Cares | `r17-proof-19` |

Full observations, ownership, supported knowledge, rate, exact offers, reactions and event IDs are in [GOLDEN_RUNS.json](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/docs/marcus-information-exchange-v01/GOLDEN_RUNS.json).

## Existing tests and frozen fixture

All 391 pre-existing tests remain represented. Tests encoding the old public ladder were adapted to Hint/Show/Trade. Tests requiring actual valuable exchange use a cares seed. Counter/settlement expectations now use 16% ceiling rounding; strong below-floor approval checks now expect floor counters. Deferred source checks, rank-sensitive denial, belief revision, old opening consumption/expiry and backlash continue to be tested through internal APIs or `legacyEdgeView`.

The historical fixture remains byte-for-byte unchanged, SHA-256 `add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46`. Its 23 routes / 127 snapshots are preserved, and a separate R-17 expected fixture replays those same routes.

**127 of 127 historical snapshots have changed expectations**, including opening projections because the public actions/availability and historical receipt copy changed. [SNAPSHOT_MIGRATION.md](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.md) lists every snapshot by run and turn and its governing rules. [SNAPSHOT_MIGRATION.json](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.json) records each changed path, original value, new value and rule IDs. A regression independently checks complete path coverage.

## Actual browser playtest and standalone delivery

The running local encounter at http://127.0.0.1:4175/ was exercised through ordinary menu, draft, preview, send and confirmation controls for all four seeds. Observed: exactly three R-17 controls; dropdown availability initially/after Hint; GOOD honest disinterest; unwanted hinted Trade 16%; failed BAD blind Trade 22% with private retained document; Show and later ordinary offer 19%; BAD valuable blind Trade 8% followed by removal to 16%; GOOD Hint 16% followed by valuable Trade 8%, then confirmed Traded.

The completed GOOD exchange showed two Contra, cash $10, new repayment $54 in seven days and total owed $304; old debt remained $250. The percentage stayed visible with the builder collapsed. See [PLAYTEST.md](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/docs/marcus-information-exchange-v01/PLAYTEST.md) and saved screenshots.

The standalone HTML is 717,949 bytes, SHA-256 `48f5047ca12248726bb01832fdc33e3234064fbcf702ec020cb1b85dc6d53cd6`. It embeds the same 44 source modules and 28 exact supplied face assets, has no network entrypoints and passed execution with network forbidden. Its inventory validates source bytes and the existing browser substitutions.

The in-app browser refused the standalone `file://` URL because only HTTP/HTTPS are allowed. Direct file-browser launch is therefore unverified in this session; no bypass was attempted. Runtime/source/asset parity, all 20 new R-17 routes in the network-forbidden embedded runtime, and the actual running UI were verified separately. Open [Marcus_Encounter.html](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/dist/marcus-information-exchange-v01/Marcus_Encounter.html) in a normal browser for direct file play.

## Changed and created files

Every implementation/test/artifact path and purpose is listed below. Validation logs and screenshot files are enumerated in the validation inventory.

| File | Purpose |
| --- | --- |
| [public/encounter/app.js](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/public/encounter/app.js) | Render Held/Hinted/Spent/Traded and retained-card notes; show the percentage beside Your Edge and in current offers. |
| [scripts/test-portable.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/scripts/test-portable.mjs) | Register both new R-17 test files in the normal portable suite. |
| [src/conversation/edge.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/conversation/edge.mjs) | Derive the proof card from player observations and transfer history; retain the deferred legacy edge projector. |
| [src/conversation/face/policy.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/conversation/face/policy.mjs) | Map resolved R-17 reactions to five distinct existing face presets. |
| [src/conversation/keyword-bank.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/conversation/keyword-bank.mjs) | Expose only Hint/Show/Trade for R-17, including redundant Hint and possession-based availability. |
| [src/conversation/language/frames.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/conversation/language/frames.mjs) | Bind Hint to category disclosure and Show to full disclosure. |
| [src/conversation/language/npc-lines.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/conversation/language/npc-lines.mjs) | Add six deterministic reply families; preserve exact fees and private-detail boundaries. |
| [src/encounter/constants.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/encounter/constants.mjs) | Centralize rate resolution and ceiling rounding for approval and counters. |
| [src/encounter/conversation.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/encounter/conversation.mjs) | Record the resolved R-17 reaction in committed diagnostic causes. |
| [src/encounter/engine.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/encounter/engine.mjs) | Pass the scalar rate into policy, bind offers to their rate, expose public percentage and debug R-17 state, filter public topics. |
| [src/encounter/history-content.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/encounter/history-content.mjs) | Add Hint/Show topics; describe receipt as historical acquisition so transfer does not imply continued possession. |
| [src/encounter/information-policy.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/encounter/information-policy.mjs) | Resolve deterministic proof actions ahead of deferred gates; persist independent consequences; grant no proof score bonus. |
| [src/encounter/knowledge.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/encounter/knowledge.mjs) | Make both variants tradeable while held and unspent; format new action semantics and availability. |
| [src/encounter/marcus-policy.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/encounter/marcus-policy.mjs) | Enforce the extra-charge floor before approval and in counters while retaining existing credit, score and hostile-discount conditions. |
| [src/encounter/marcus-world-adapter.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/encounter/marcus-world-adapter.mjs) | Project fixed private interest, observed player interest, independent mechanic facts and historical transfer. |
| [src/encounter/marcus-world.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/src/encounter/marcus-world.mjs) | Seed private attitudes independently; stage category replies, coherent Show reads and real acceptance transfer in existing ledger commits. |
| [scripts/capture-r17-migration.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/scripts/capture-r17-migration.mjs) | Replay the historical corpus, preserve its hash and write the new fixture plus complete snapshot differences. |
| [scripts/capture-r17-goldens.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/scripts/capture-r17-goldens.mjs) | Assert and capture 20 golden routes across the four seed combinations. |
| [tests/encounter-r17-exchange.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/encounter-r17-exchange.test.mjs) | 28 new mechanic tests: all combinations, rates, rounding, floor, ledger support, transfer, precedence and all 60 delivery coordinates. |
| [tests/conversation-r17-exchange.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/conversation-r17-exchange.test.mjs) | Five new public/UI tests: exact actions, availability, pure previews, distinct faces and actual renderer outputs. |
| [tests/conversation-acceptance.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/conversation-acceptance.test.mjs) | Use public Hint in acceptance routes and select genuinely valuable information for the conditional preview. |
| [tests/conversation-keyword-bank.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/conversation-keyword-bank.test.mjs) | Replace old surface preparation assumptions with Hint/Show/Trade; keep safe projection and resolver checks. |
| [tests/conversation-language.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/conversation-language.test.mjs) | Validate all 37 authored NPC families and numeric equivalence. |
| [tests/encounter-adversarial.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/encounter-adversarial.test.mjs) | Retain assessment/delivery distinctions while preventing below-floor approval after risk acknowledgment. |
| [tests/encounter-information.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/encounter-information.test.mjs) | Compare matching terms with only extra changed; retain source/belief/backlash/window tests and respect the new floor. |
| [tests/encounter-knowledge-unit.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/encounter-knowledge-unit.test.mjs) | Separate held-card Trade from deferred preparation and independently seeded interest; keep deeper knowledge interventions. |
| [tests/encounter-lore-adversarial.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/encounter-lore-adversarial.test.mjs) | Use a cares seed for atomic exchange and validate settlement from exact floor-compliant offer terms. |
| [tests/encounter-policy.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/encounter-policy.test.mjs) | Update ordinary counter expectations to 16% with ceiling rounding. |
| [tests/encounter-polish-regression.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/encounter-polish-regression.test.mjs) | Use floor-compliant approval and exact 16% settlement; retain once-only transfers and deferred window checks. |
| [tests/marcus-world-conformance.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/marcus-world-conformance.test.mjs) | Replay the migrated fixture, preserve original hash, verify the narrow rate scalar and genuine valuable atomic transfer. |
| [tests/marcus-world-model-baseline.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/marcus-world-model-baseline.test.mjs) | Keep the historical fixture immutable; verify new expectations and complete per-path migration coverage (one additional test). |
| [tests/marcus-world-projection.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/marcus-world-projection.test.mjs) | Independently derive migrated ledger projections; distinguish collection NEEDS from R-17 interest. |
| [tests/refinement-acceptance.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/refinement-acceptance.test.mjs) | Verify new public edge fields and real Traded state; keep deferred opening tests on the legacy projector. |
| [tests/refinement-edge.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/refinement-edge.test.mjs) | Verify proof guidance and lifecycle; retain deferred opening expiry/consumption checks internally. |
| [tests/refinement-policy.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/refinement-policy.test.mjs) | Update the ordinary counter's whole-dollar extra expectation. |
| [tests/review-state-copy.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/review-state-copy.test.mjs) | Verify held/Hinted/Spent copy and retain late-opening internal coverage. |
| [tests/standalone-parity.test.mjs](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/standalone-parity.test.mjs) | Compare embedded runtime to the migrated oracle and all 20 new proof golden routes while asserting the historical fixture hash. |
| [tests/fixtures/marcus-r17-exchange-v01.json](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/tests/fixtures/marcus-r17-exchange-v01.json) | New expected corpus for the same 23 historical routes and 127 snapshots; original fixture untouched. |
| [docs/marcus-information-exchange-v01/IMPLEMENTATION_REPORT.md](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/docs/marcus-information-exchange-v01/IMPLEMENTATION_REPORT.md) | Complete implementation, scope and validation report. |
| [docs/marcus-information-exchange-v01/PLAYTEST.md](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/docs/marcus-information-exchange-v01/PLAYTEST.md) | Actual browser actions, observations, screenshots and file-protocol limitation. |
| [docs/marcus-information-exchange-v01/GOLDEN_RUNS.json](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/docs/marcus-information-exchange-v01/GOLDEN_RUNS.json) | 20 asserted deterministic routes with observed rates, cards, possession, knowledge, offers and reactions. |
| [docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.md](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.md) | Every changed historical snapshot and the rules changing its expectation. |
| [docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.json](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.json) | Every changed snapshot path, before/after value and applicable rule IDs. |
| [dist/marcus-information-exchange-v01/Marcus_Encounter.html](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/dist/marcus-information-exchange-v01/Marcus_Encounter.html) | Offline playable build from the same source runtime, with all 28 face assets embedded (ignored build output). |
| [dist/marcus-information-exchange-v01/BUILD_INVENTORY.json](C:/Users/mcdon/Documents/ChatGPT/dpa-message-foundations-v01/dist/marcus-information-exchange-v01/BUILD_INVENTORY.json) | Hashes, byte counts, module graph and browser-substitution contracts for the standalone build (ignored build output). |

## Scope and problems

**Fixed in this pass:** held-card dropdown gating; BAD Trade exclusion; independent interest/knowledge separation; Show ledger coherence; fee-only modifier with approval floor and shared rounding; persistent additive 22%/19% facts; current-offer-only eight-percent value; real document transfer and historical Traded UI; unmistakable percentage display; distinct reactions. Validation caught and corrected historical assumptions, reply numeric mismatches and report-script typing/request-identity issues.

**Pre-existing / out of scope:** the old deeper source, rank, opening and backlash mechanics remain internally callable and tested. Production TPL protocols remain unapproved (zero production runtime protocols); the existing authoring-preview boundary is unchanged. Browser file-protocol restriction is recorded above.

**Follow-up candidates:** retuning the named rates or expanding the information economy requires a later authorized pass. None was implemented.

This pass does not expand authenticity workflow, belief scoring, staleness, backlash, deception/bluffing, multiple cards, NPC-to-player card exchange, BASED/TPL, another NPC or unrelated deal terms. R-17 directly changes extra only; resulting settlement totals naturally include that agreed extra. Existing debt, quantity, cash/principal limits and repayment-day rules retain their existing authority.
