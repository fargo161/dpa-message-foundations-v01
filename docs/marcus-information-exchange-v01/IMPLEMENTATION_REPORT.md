# Marcus R-17 information exchange — implementation and validation

## Current execution architecture — 2026-10-06

The game now calls `public/encounter/local-engine.mjs` directly in both source and standalone modes. Preview remains separate from sending a turn. `scripts/encounter-server.mjs` serves a fixed list of static files only, with browser connections forbidden by `connect-src 'none'`; it has no game routes, cookies, sessions or log ingestion. The offline builder bundles the same engine without a fake server or transport substitution.

Dev logs now use browser storage and the existing JSON/Markdown download buttons. No automatic `playtest-logs/` files are written. A saved previous log is evidence only; reloading starts fresh gameplay. The disk-log store has been removed. Record formats, private spoiler boundaries, gameplay and frozen evidence are unchanged.

The current branch is `codex/no-api-local-engine-v01`, based on `a4e366c8dc7fb5a34b901def1ea75c49dcdd259b`. See [NO_API_REFACTOR_REPORT.md](NO_API_REFACTOR_REPORT.md) for the changes, test ledger and commands. The official build's exact final commit, clean-tree metadata, byte size, SHA-256 fingerprint and reproducibility result are recorded after the documentation commit in `dist/no-api-validation/FINAL_BUILD_RECEIPT.json`; `dist/` is ignored. A tracked document cannot contain its own commit's ID without changing that ID.

All earlier sections below are historical implementation receipts. Their old branch names, server behavior, transport/disk tests and standalone hashes describe those earlier passes, not the current build. The old 758589-byte / `3043b90c…5767` bundle is superseded by the final receipt above.

Implemented the locked brief, Section 35 and user requirements A–G. All required gates pass. The public information loop is Hint → decide between Show and Trade, with independent content/interest and persistent consequences.

## Repository state

- Repository: `dpa-message-foundations-v01` (fargo161/dpa-message-foundations-v01).
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

Logs and browser evidence live in [validation](validation/). The final UI check was run after the browser-discovered percentage-placement correction. Subsequent report-generator typing and migration-rule wording corrections do not change runtime mechanics.

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

Full observations, ownership, supported knowledge, rate, exact offers, reactions and event IDs are in [GOLDEN_RUNS.json](GOLDEN_RUNS.json).

## Existing tests and frozen fixture

All 391 pre-existing tests remain represented. Tests encoding the old public ladder were adapted to Hint/Show/Trade. Tests requiring actual valuable exchange use a cares seed. Counter/settlement expectations now use 16% ceiling rounding; strong below-floor approval checks now expect floor counters. Deferred source checks, rank-sensitive denial, belief revision, old opening consumption/expiry and backlash continue to be tested through internal APIs or `legacyEdgeView`.

The historical fixture remains byte-for-byte unchanged, SHA-256 `add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46`. Its 23 routes / 127 snapshots are preserved, and a separate R-17 expected fixture replays those same routes.

**127 of 127 historical snapshots have changed expectations**, including opening projections because the public actions/availability and historical receipt copy changed. [SNAPSHOT_MIGRATION.md](SNAPSHOT_MIGRATION.md) lists every snapshot by run and turn and its governing rules. [SNAPSHOT_MIGRATION.json](SNAPSHOT_MIGRATION.json) records each changed path, original value, new value and rule IDs. A regression independently checks complete path coverage.

## Actual browser playtest and standalone delivery

The running local encounter at http://127.0.0.1:4175/ was exercised through ordinary menu, draft, preview, send and confirmation controls for all four seeds. Observed: exactly three R-17 controls; dropdown availability initially/after Hint; GOOD honest disinterest; unwanted hinted Trade 16%; failed BAD blind Trade 22% with private retained document; Show and later ordinary offer 19%; BAD valuable blind Trade 8% followed by removal to 16%; GOOD Hint 16% followed by valuable Trade 8%, then confirmed Traded.

The completed GOOD exchange showed two Contra, cash $10, new repayment $54 in seven days and total owed $304; old debt remained $250. The percentage stayed visible with the builder collapsed. See [PLAYTEST.md](PLAYTEST.md) and saved screenshots.

The historical standalone HTML was 717,949 bytes, SHA-256 `48f5047ca12248726bb01832fdc33e3234064fbcf702ec020cb1b85dc6d53cd6`. It embeds the same 44 source modules and 28 exact supplied face assets, has no network entrypoints and passed execution with network forbidden. Its inventory validates source bytes and the existing browser substitutions.

The in-app browser refused the standalone `file://` URL because only HTTP/HTTPS are allowed. Direct file-browser launch is therefore unverified in this session; no bypass was attempted. Runtime/source/asset parity, all 20 new R-17 routes in the network-forbidden embedded runtime, and the actual running UI were verified separately. Open [Marcus_Encounter.html](../../dist/marcus-information-exchange-v01/Marcus_Encounter.html) in a normal browser for direct file play.

## Changed and created files

Every implementation/test/artifact path and purpose is listed below. Validation logs and screenshot files are enumerated in the validation inventory.

| File | Purpose |
| --- | --- |
| [public/encounter/app.js](../../public/encounter/app.js) | Render Held/Hinted/Spent/Traded and retained-card notes; show the percentage beside Your Edge and in current offers. |
| [scripts/test-portable.mjs](../../scripts/test-portable.mjs) | Register both new R-17 test files in the normal portable suite. |
| [src/conversation/edge.mjs](../../src/conversation/edge.mjs) | Derive the proof card from player observations and transfer history; retain the deferred legacy edge projector. |
| [src/conversation/face/policy.mjs](../../src/conversation/face/policy.mjs) | Map resolved R-17 reactions to five distinct existing face presets. |
| [src/conversation/keyword-bank.mjs](../../src/conversation/keyword-bank.mjs) | Expose only Hint/Show/Trade for R-17, including redundant Hint and possession-based availability. |
| [src/conversation/language/frames.mjs](../../src/conversation/language/frames.mjs) | Bind Hint to category disclosure and Show to full disclosure. |
| [src/conversation/language/npc-lines.mjs](../../src/conversation/language/npc-lines.mjs) | Add six deterministic reply families; preserve exact fees and private-detail boundaries. |
| [src/encounter/constants.mjs](../../src/encounter/constants.mjs) | Centralize rate resolution and ceiling rounding for approval and counters. |
| [src/encounter/conversation.mjs](../../src/encounter/conversation.mjs) | Record the resolved R-17 reaction in committed diagnostic causes. |
| [src/encounter/engine.mjs](../../src/encounter/engine.mjs) | Pass the scalar rate into policy, bind offers to their rate, expose public percentage and debug R-17 state, filter public topics. |
| [src/encounter/history-content.mjs](../../src/encounter/history-content.mjs) | Add Hint/Show topics; describe receipt as historical acquisition so transfer does not imply continued possession. |
| [src/encounter/information-policy.mjs](../../src/encounter/information-policy.mjs) | Resolve deterministic proof actions ahead of deferred gates; persist independent consequences; grant no proof score bonus. |
| [src/encounter/knowledge.mjs](../../src/encounter/knowledge.mjs) | Make both variants tradeable while held and unspent; format new action semantics and availability. |
| [src/encounter/marcus-policy.mjs](../../src/encounter/marcus-policy.mjs) | Enforce the extra-charge floor before approval and in counters while retaining existing credit, score and hostile-discount conditions. |
| [src/encounter/marcus-world-adapter.mjs](../../src/encounter/marcus-world-adapter.mjs) | Project fixed private interest, observed player interest, independent mechanic facts and historical transfer. |
| [src/encounter/marcus-world.mjs](../../src/encounter/marcus-world.mjs) | Seed private attitudes independently; stage category replies, coherent Show reads and real acceptance transfer in existing ledger commits. |
| [scripts/capture-r17-migration.mjs](../../scripts/capture-r17-migration.mjs) | Replay the historical corpus, preserve its hash and write the new fixture plus complete snapshot differences. |
| [scripts/capture-r17-goldens.mjs](../../scripts/capture-r17-goldens.mjs) | Assert and capture 20 golden routes across the four seed combinations. |
| [tests/encounter-r17-exchange.test.mjs](../../tests/encounter-r17-exchange.test.mjs) | 28 new mechanic tests: all combinations, rates, rounding, floor, ledger support, transfer, precedence and all 60 delivery coordinates. |
| [tests/conversation-r17-exchange.test.mjs](../../tests/conversation-r17-exchange.test.mjs) | Five new public/UI tests: exact actions, availability, pure previews, distinct faces and actual renderer outputs. |
| [tests/conversation-acceptance.test.mjs](../../tests/conversation-acceptance.test.mjs) | Use public Hint in acceptance routes and select genuinely valuable information for the conditional preview. |
| [tests/conversation-keyword-bank.test.mjs](../../tests/conversation-keyword-bank.test.mjs) | Replace old surface preparation assumptions with Hint/Show/Trade; keep safe projection and resolver checks. |
| [tests/conversation-language.test.mjs](../../tests/conversation-language.test.mjs) | Validate all 37 authored NPC families and numeric equivalence. |
| [tests/encounter-adversarial.test.mjs](../../tests/encounter-adversarial.test.mjs) | Retain assessment/delivery distinctions while preventing below-floor approval after risk acknowledgment. |
| [tests/encounter-information.test.mjs](../../tests/encounter-information.test.mjs) | Compare matching terms with only extra changed; retain source/belief/backlash/window tests and respect the new floor. |
| [tests/encounter-knowledge-unit.test.mjs](../../tests/encounter-knowledge-unit.test.mjs) | Separate held-card Trade from deferred preparation and independently seeded interest; keep deeper knowledge interventions. |
| [tests/encounter-lore-adversarial.test.mjs](../../tests/encounter-lore-adversarial.test.mjs) | Use a cares seed for atomic exchange and validate settlement from exact floor-compliant offer terms. |
| [tests/encounter-policy.test.mjs](../../tests/encounter-policy.test.mjs) | Update ordinary counter expectations to 16% with ceiling rounding. |
| [tests/encounter-polish-regression.test.mjs](../../tests/encounter-polish-regression.test.mjs) | Use floor-compliant approval and exact 16% settlement; retain once-only transfers and deferred window checks. |
| [tests/marcus-world-conformance.test.mjs](../../tests/marcus-world-conformance.test.mjs) | Replay the migrated fixture, preserve original hash, verify the narrow rate scalar and genuine valuable atomic transfer. |
| [tests/marcus-world-model-baseline.test.mjs](../../tests/marcus-world-model-baseline.test.mjs) | Keep the historical fixture immutable; verify new expectations and complete per-path migration coverage (one additional test). |
| [tests/marcus-world-projection.test.mjs](../../tests/marcus-world-projection.test.mjs) | Independently derive migrated ledger projections; distinguish collection NEEDS from R-17 interest. |
| [tests/refinement-acceptance.test.mjs](../../tests/refinement-acceptance.test.mjs) | Verify new public edge fields and real Traded state; keep deferred opening tests on the legacy projector. |
| [tests/refinement-edge.test.mjs](../../tests/refinement-edge.test.mjs) | Verify proof guidance and lifecycle; retain deferred opening expiry/consumption checks internally. |
| [tests/refinement-policy.test.mjs](../../tests/refinement-policy.test.mjs) | Update the ordinary counter's whole-dollar extra expectation. |
| [tests/review-state-copy.test.mjs](../../tests/review-state-copy.test.mjs) | Verify held/Hinted/Spent copy and retain late-opening internal coverage. |
| [tests/standalone-parity.test.mjs](../../tests/standalone-parity.test.mjs) | Compare embedded runtime to the migrated oracle and all 20 new proof golden routes while asserting the historical fixture hash. |
| [tests/fixtures/marcus-r17-exchange-v01.json](../../tests/fixtures/marcus-r17-exchange-v01.json) | New expected corpus for the same 23 historical routes and 127 snapshots; original fixture untouched. |
| [docs/marcus-information-exchange-v01/IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md) | Complete implementation, scope and validation report. |
| [docs/marcus-information-exchange-v01/PLAYTEST.md](PLAYTEST.md) | Actual browser actions, observations, screenshots and file-protocol limitation. |
| [docs/marcus-information-exchange-v01/GOLDEN_RUNS.json](GOLDEN_RUNS.json) | 20 asserted deterministic routes with observed rates, cards, possession, knowledge, offers and reactions. |
| [docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.md](SNAPSHOT_MIGRATION.md) | Every changed historical snapshot and the rules changing its expectation. |
| [docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.json](SNAPSHOT_MIGRATION.json) | Every changed snapshot path, before/after value and applicable rule IDs. |
| [dist/marcus-information-exchange-v01/Marcus_Encounter.html](../../dist/marcus-information-exchange-v01/Marcus_Encounter.html) | Offline playable build from the same source runtime, with all 28 face assets embedded (ignored build output). |
| [dist/marcus-information-exchange-v01/BUILD_INVENTORY.json](../../dist/marcus-information-exchange-v01/BUILD_INVENTORY.json) | Hashes, byte counts, module graph and browser-substitution contracts for the standalone build (ignored build output). |

## Scope and problems

**Fixed in this pass:** held-card dropdown gating; BAD Trade exclusion; independent interest/knowledge separation; Show ledger coherence; fee-only modifier with approval floor and shared rounding; persistent additive 22%/19% facts; current-offer-only eight-percent value; real document transfer and historical Traded UI; unmistakable percentage display; distinct reactions. Validation caught and corrected historical assumptions, reply numeric mismatches and report-script typing/request-identity issues.

**Pre-existing / out of scope:** the old deeper source, rank, opening and backlash mechanics remain internally callable and tested. Production TPL protocols remain unapproved (zero production runtime protocols); the existing authoring-preview boundary is unchanged. Browser file-protocol restriction is recorded above.

**Follow-up candidates:** retuning the named rates or expanding the information economy requires a later authorized pass. None was implemented.

This pass does not expand authenticity workflow, belief scoring, staleness, backlash, deception/bluffing, multiple cards, NPC-to-player card exchange, BASED/TPL, another NPC or unrelated deal terms. R-17 directly changes extra only; resulting settlement totals naturally include that agreed extra. Existing debt, quantity, cash/principal limits and repayment-day rules retain their existing authority.

## Follow-up — exact extra charge and visible savings (2026-10-01)

Implemented the approved locked-extra preflight and the user's additional blind hard-limit requirement. This section supersedes the first pass's **approval floor** and **player-chosen fee** behavior. The sections above record the original pass as delivered at that time.

### Repository and delivery

- Starting commit: `e7aa831bb5237b2f6e8b0b439b4a8efd56d1bf7b` (`Marcus R-17 information exchange proof: Hint / Show / Trade`).
- Branch: `codex/r17-information-exchange-v01`, continued in place. No other branch was modified.
- Delivery is one local commit titled `Lock Marcus R-17 extra charge and show savings`. The final handoff supplies its exact ending SHA; recording a commit's own SHA inside its contents would change that SHA.
- No push. The two pre-existing line-ending-only `data/generated/*.json` changes are excluded from the commit. They remain semantically identical to HEAD.
- All nine pre-existing `Temp/` files were preserved; before/after file lengths and SHA-256 inventories match exactly.
- Standalone: `dist/marcus-information-exchange-v01/Marcus_Encounter.html`, with `BUILD_INVENTORY.json` alongside it. These are existing ignored local deliverables, rebuilt from the same source.
- New evidence lives in `docs/marcus-information-exchange-v01/validation/r17-locked-extra-pass/`; previous-pass logs and screenshots remain intact.

### Authoritative normalization and standard scoring

DEAL still carries `units, upfront, repayment, extra, days`. Identity, closed object shape and ordinary numeric inputs remain validated. A submitted extra must still be a valid whole-number field in the existing 0–10000 envelope; every such value is silently replaced with `r17ExtraFloor(principal, resolvedRate)` before financial validation, evaluation, stored proposal, event intent and approved offer. `$0`, `$20` and `$9999` cannot buy approval or change settlement. Caller inputs and the original state remain unchanged.

`resolveR17Rate` and `r17ExtraFloor` remain the single rate and whole-dollar rounding authorities. The latter retains its compatible name but now supplies the **exact** charge. Counters recalculate it on their own principal; ACCEPT binds and settles the exact already-offered amount, including a contingent 8% trade.

The policy values the extra component at `ceil(principal × 16 / 100)` for both proposal scoring and concession comparisons, retaining the existing scoring cap and thresholds. Actual exposure and obligations use the resolved charge. Repetition compares units, cash, principal and days: changing submitted extra or changing only the resolved rate cannot avoid repetition handling. The obsolete under-floor counter and unearned fee-only-discount guard are removed. Counter units, upfront share and deadline formulas are unchanged.

The new tests compare approve, counter and reject outcomes and scores at 8%, 16% and 22% on matched policy contexts. Hard-limit differences remain legitimate because they use the actual debt exposure. Social history, delivery and the existing separate legacy information systems retain their previous authority.

### Blind drafts, previews and hard limits

`play.r17RateContext` contains only player-observed facts: shown, failed blind trade, current availability, whether interest is known and the observed interest value (null until observed). The browser imports the same pure helpers as the engine through the exact `/r17-rates.mjs` route. It never reads Debug's private interest. Debug's existing diagnostic visibility remains unchanged.

`r17DraftCharges` derives known rates or both blind possibilities solely from that public context. At $50 principal, an attached unknown-interest R-17 displays `$4 · 8% if he values R-17 · $11 · 22% if he doesn't`. Its summary displays both $54/$61 totals. No single resolved outcome is shown. Removing R-17 returns to the persistent ordinary rate immediately; a previous contingent 8% offer cannot price an unattached new draft.

Preview remains pure: no information resolution, policy evaluation, event creation or state mutation. Its canonical player sentence names new credit **at your extra charge**, with no dollar extra. It validates a publicly possible amount, not Marcus's private attitude. Matched states with opposite private interest produce identical complete preview responses, including in forced affordability cases. There is no interest-dependent validation-error branch before the reply.

On send, the existing staged information resolver settles 8% or the failed-blind 22%. Blind debt-limit validation is deferred to the ordinary policy response. The policy caps allowable exposure at the lower of its authored limit and the engine's $100000 debt limit, so an unaffordable actual charge is countered or rejected, rather than thrown as a validation error. ACCEPT still checks the exact offer and hard limits before settlement. A rejected R-17 response also states that the information charge does not remove credit limits.

Two explicit tests use existing test-only state/profile interventions; no new HTTP/client override was added:

| Forced case | 8% exposure | 22% exposure | Result |
| --- | ---: | ---: | --- |
| Authored exposure limit lowered to $307; principal $50, old debt $250 | $304 | $311 | Identical previews; 8% approved, 22% rejected with Marcus's reply |
| Existing debt set to $99943 and authored exposure widened above the $100000 hard cap | $99997 | $100004 | Identical previews; 8% approved, 22% rejected with Marcus's reply |

Both retain R-17 and transfer no resources before confirmation. These are controlled semantic tests, not claims of cryptographic constant-time execution. The preview path has no private-interest resolution branch. Under the normal opening limits, defensible principal is at most $180: even 22% yields total exposure $470, below the $650 authored ceiling and $100000 hard ceiling. The interventions exercise the otherwise unreachable charge-dependent boundary explicitly.

### Visible comparison and actual golden matrix

The builder uses a read-only output and a hidden compatibility field, never an editable fee control. Known non-16% drafts and current offers display the standard 16% charge on the same principal. A blind draft displays both alternatives instead. DEAL speech omits the dollar fee; Marcus's reply, clarification and ACCEPT retain exact established amounts. TERMS dialogue no longer suggests paying extra can help approval. Minimum/floor wording is replaced by exact-charge wording.

On completion, savings/cost equal `ceil(agreed principal × 16 / 100) - agreed extra`, with the requested saved/cost sentence, or no sentence when the rounded charges are equal. The existing receipt layout is retained.

All 20 captured golden routes pass across GOOD/BAD × cares/doesn't care, using $50 principal. Every emitted proposal and offer is checked for exact rounded extra:

| Route | Actual rate | Actual extra | Standard 16% | Difference |
| --- | ---: | ---: | ---: | --- |
| Hoard | 16% | $8 | $8 | $0 |
| Show | 13% | $7 | $8 | $1 saved |
| Hint → valued Trade | 8% | $4 | $8 | $4 saved |
| Hint → unwanted Trade | 16% | $8 | $8 | $0 |
| Blind Trade, cares | 8% | $4 | $8 | $4 saved |
| Failed blind Trade | 22% | $11 | $8 | $3 cost |
| Failed blind Trade → Show | 19% | $10 | $8 | $2 cost |

Removing/readding an uncompleted valuable trade remains 8% → 16% → 8%; repeating a failed blind trade remains 22%; Show subsequently produces 19%. Those Section 35 rules and the actual ownership/knowledge ledger are unchanged.

### Regression and browser observations

Seed `88fdc2d7be9a` (BAD / cares), Boundaried / Balanced, six days: Hint → Trade 4/$60/$180 → Trade 3/$60/$120 → Trade 3/$65/$115 → confirm. The first counter remains 3 units/$72/$108/$9, demonstrating the separate counter formula was preserved. Standard-rate scoring allows the second proposal to be approved at $10 extra. The final proposal is approved at **$10 extra on $115**, even when the engine test supplies $20. Confirmation yields three units, $15 retained cash, $125 new repayment, $375 total debt and a genuine R-17 transfer. The final screen says **“R-17 saved you $9 on the extra charge.”**

Real browser checks at http://127.0.0.1:4175/ verified the known 8% builder and 16% comparison, both blind outcomes before any reply, persistent 22% after failure and its standard comparison, and the completed savings sentence with Traded visible. Four screenshots and three DOM snapshots are saved under the new validation folder. These are source-UI screenshots. The actual standalone's embedded runtime was tested with networking forbidden; direct file-protocol browser testing remains subject to the previously recorded browser restriction.

### Changed files and reasons

Paths below are relative to `dpa-message-foundations-v01`.

| Source / tooling file | Purpose |
| --- | --- |
| `src/encounter/constants.mjs` | Public possible-charge helper and shared standard-charge helper; existing resolver/rounding retained. |
| `src/encounter/engine.mjs` | Silent normalization, pure blind previews, deferred blind debt response and safe public rate context. |
| `src/encounter/marcus-policy.mjs` | Standard-16 scoring/concession comparison, exact charge, editable-term repetition and actual hard exposure checks. |
| `src/encounter/information-policy.mjs` | Exact-charge feedback wording; resolution unchanged. |
| `src/encounter/messages.mjs` | Legacy DEAL entry point uses the same fee-independent proposal wording. |
| `src/conversation/language/frames.mjs` | Separate proposal description from exact acceptance/offer descriptions. |
| `src/conversation/language/npc-lines.mjs` | Exact-charge and TERMS wording; honest rejection suffix for unaffordable R-17 proposals. |
| `public/encounter/index.html` | Read-only fee output, hidden compatible field and comparison element. |
| `public/encounter/app.js` | Live known/blind figures, conditional summaries, offer comparisons and receipt savings/cost. |
| `scripts/encounter-server.mjs` | Historical shared-rate-module route; now replaced by a fixed static module allowlist with no game routes. |
| `tools/build_standalone.py` | Fourth browser import contract and offline rate-module mapping. |
| `scripts/capture-r17-goldens.mjs` | Exact proposal/offer assertions; capture standard amounts and differences. |
| `scripts/capture-r17-migration.mjs` | Historical-to-current migration plus committed e7aa831-to-current migration, path values and snapshot hashes. |

| Changed test file | Changed expectation / new coverage and why |
| --- | --- |
| `tests/encounter-r17-exchange.test.mjs` | All route fee assertions strengthened from >= to equality; former minimum-counter test now checks exact normalized approval. Six new tests cover all-rate normalization/settlement, matched decisions, the seed regression, both forced blind limits and fee-only repetition. |
| `tests/conversation-r17-exchange.test.mjs` | Actual renderer harness receives the shared helper; 22%/19% copy assertions use exact-charge wording. |
| `tests/conversation-acceptance.test.mjs` | All-60-coordinate conditional previews require “at your extra charge” and forbid dollar extra, retaining privacy/purity assertions. |
| `tests/encounter-adversarial.test.mjs` | Stored intent/proposal preserve security with normalized extra; risk acknowledgment route now approves once score passes instead of fee-only countering. Its borderline fixture is $47 cash/$73 principal to retain threshold-crossing coverage under standard scoring. |
| `tests/encounter-policy.test.mjs` | Legacy proposal speech expects Marcus-set charge wording; acceptance remains exact. |
| `tests/encounter-history.test.mjs` | $60 principal settles with $10 normal extra, hence $320 debt instead of the player-chosen $322. |
| `tests/encounter-information.test.mjs` | Matched ordinary/valuable proposals are approved with exact $8/$4 charges instead of countered solely for submitted $0; transfer/knowledge safeguards remain. |
| `tests/refinement-policy.test.mjs` | A $1 security improvement is assessed independently of submitted extra; $0/$1000 produce identical policy results. |
| `tests/refinement-acceptance.test.mjs` | Dropping submitted extra cannot manufacture deterioration; real cash improvement is progress with normalized extra. |
| `tests/refinement-ui.test.mjs` | Shared helpers in the actual-renderer harness; normal receipt fixtures use exact fees. Three new tests cover read-only blind display, live known charges/comparisons, and saved/cost/equal receipts. |
| `tests/polish-language.test.mjs` | TERMS must state Marcus sets extra and must not say extra “can help.” |
| `tests/marcus-world-model-baseline.test.mjs` | One new test verifies all 127 follow-up records, their actual new values and reconstructed prior expectation hashes. |
| `tests/standalone-parity.test.mjs` | One new dedicated test replays the exact-extra agreement and forced blind exposure branches in the real embedded engine with networking forbidden. |

| Fixture / documentation artifact | Purpose |
| --- | --- |
| `tests/fixtures/marcus-r17-exchange-v01.json` | Regenerated 23 routes/127 expected snapshots. |
| `docs/marcus-information-exchange-v01/GOLDEN_RUNS.json` | Regenerated 20 asserted routes with actual dollars. |
| `docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.md` and `.json` | Updated original historical-to-current expectation accounting. |
| `docs/marcus-information-exchange-v01/EXTRA_CHARGE_MIGRATION.md` and `.json` | New e7aa831-to-current ledger: 127 snapshots and 1255 changed paths, before/after values and rules. |
| `docs/marcus-information-exchange-v01/PLAYTEST.md` | Follow-up browser observations and evidence links. |
| `docs/marcus-information-exchange-v01/IMPLEMENTATION_REPORT.md` | This complete follow-up report. |
| `docs/marcus-information-exchange-v01/validation/r17-locked-extra-pass/` | Fresh baseline/final gate logs, capture logs, screenshots, DOM observations, Temp hash inventories and a validation inventory. |

The historical fixture remains byte-identical, SHA-256 `add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46`. The preceding committed R-17 fixture is identified by SHA-256 `6b2e7c1e7b68df054dd9f40517395f09f99f9859366928c50828f9cc31f2a186`. The new migration names every changed snapshot and rule; its JSON records every changed field. It preserves the original historical migration separately.

### Fresh validation

| Gate | Result |
| --- | --- |
| Fresh pre-change `npm test` | 425 passed / 0 failed / 0 skipped, 228053.0451 ms |
| `npm ci --no-audit --no-fund` | Pass; 78 locked packages installed, lockfile unchanged |
| Final full `npm test` | 435 passed / 0 failed / 0 skipped / 0 cancelled, 248579.6376 ms |
| New portable coverage | 10 added tests: 6 engine, 3 UI, 1 migration |
| Lint / typecheck / schema validation | All pass |
| Build / generated freshness | Pass; 3 tracked generated artifacts match |
| Golden capture | 20 asserted routes, all four combinations |
| Fixture/migration capture | 23 routes / 127 snapshots; historical hash intact |
| Actual standalone parity | 7 passed / 0 failed, 179569.0225 ms; source/assets/inventory, 23 routes / 127 snapshots, all 20 goldens and the added follow-up regression |
| Standalone build | 44 modules, 28 embedded face assets, 721945 bytes |
| Standalone SHA-256 | `1820180c4060172958d1de6f093c3bdaf125c44d90265cfe9f8ea0e4f94d60ac` |
| Browser checks | All four requested observations verified; screenshot/DOM evidence saved |
| Temp preservation | All 9 files match before/after hashes and lengths |
| `git diff --check` | Pass; checked before staging the local commit |

Development runs caught the explicitly superseded fee, counter, debt and dialogue assumptions documented in the changed-test table. They were corrected without weakening knowledge, settlement, transport or historical-fixture assertions.

### Boundaries retained

No changes to rate values, rate precedence/persistence or Section 35; no changes to Hint/Show/Trade availability, interest seeding, Your Edge lifecycle, face policy or world ledger implementation. Show continues to establish document support without proving wrongdoing, and completed Trade genuinely transfers R-17. No counter units/cash/deadline retuning, source/belief/staleness/backlash/bluff/multiple-card expansion, BASED/TPL changes, external corpus work or push.

## Playtest run log pass — 2026-10-01

Implemented the approved observational logger on `codex/r17-information-exchange-v01`, starting from `58f018eb475c3a86d9b35e612d73cec3b99ad31f`. The single local checkpoint is titled `Add playtest run log`; its resulting SHA is supplied in the handoff. No push. The approved [preflight](PLAYTEST_LOG_PREFLIGHT.md) now contains repository-relative paths only. Earlier sections' machine-specific links were also converted to relative references.

### Delivered behavior and files

At this historical checkpoint, the dev CLI automatically started one append-only JSONL stream plus assembled JSON and Markdown per run in ignored `playtest-logs/`. The current local engine instead stores browser evidence and exports downloads; this automatic disk behavior has been removed. Shared `src/playtest/recorder.mjs` records committed engine events and assembles headers, turns, correlated browser observations and endings. Shared `src/playtest/markdown.mjs` renders local/UTC metadata, a private SPOILERS block, ordered timeline, full turns and receipt. Node-only `scripts/playtest-log-store.mjs` serializes bounded writes, syncs appends, atomically replaces assembled files, validates containment and recovers complete lines from partial streams.

At that historical checkpoint, `scripts/encounter-server.mjs` enabled logging for the real CLI and kept test servers opt-in. The current server only serves static files; the session/origin/CSRF and disk-write behavior described next is retired. It provides session/origin/CSRF-protected UI ingestion and authenticated current-run attachment exports. State assignment still precedes observation; disk writes run in a caught queue. Log retries never consume gameplay request IDs. New `public/encounter/playtest-log.js` observes delegated controls, panels, committed draft edits, allowlisted visible screens, explicit preview/send/error/face callbacks and format downloads. Queue loss has export diagnostics; closed dialog controls are excluded from visible choices.

Small hooks in `public/encounter/app.js`, `delivery-chart.js` and `index.html` connect that observer. Debug now renders an allowlist of player-observed diagnostics rather than raw private state. Private version/interest/quirk enter files directly, never the added DOM. JSON/Markdown choices are available during play and after a result. The live check found the end control inherited the terminal fieldset's disabled state; the final implementation moves that control outside the fieldset and verifies it is enabled.

The historical `tools/build_standalone.py` embedded the same recorder/renderer, a local logging API, safe build metadata and guarded localStorage. The current builder bundles the real page-local engine and has no fake local API. Previous saved partial logs remain explicitly exportable without restoring gameplay. Its classic-script/no-network audit remains intact. `.gitignore` excludes real logs. No package or dependency was added; the lockfile is unchanged.

New portable tests are `tests/playtest-recorder.test.mjs` (9), `playtest-log-server.test.mjs` (8) and `playtest-log-ui.test.mjs` (6), registered in `scripts/test-portable.mjs`. Existing standalone build/parity tests retain their behavioral assertions and add metadata contracts and actual embedded export/storage checks. The portable total rises by 23, from 435 to 458. Two additional dedicated standalone parity checks bring that suite to 9; six packaging checks run beside it.

Schema, limits, record authority, timestamps, lifecycle, privacy and recovery are documented in [PLAYTEST_LOG_SCHEMA.md](PLAYTEST_LOG_SCHEMA.md). Copied real samples, gate receipts, DOM/viewport evidence and hash inventories live in [validation/playtest-log-pass/](validation/playtest-log-pass/VALIDATION_INVENTORY.json). Every committed text file in this pass is checked for private paths; raw machine-specific console locations are omitted or converted before copying evidence.

### Validation

The first attempted baseline was 434/435: the existing private-path test correctly rejected this preflight's absolute references. Implementation stopped. After the user's approved fix, a fresh complete baseline passed 435/435, with 0 failures/skips (214663.9024 ms). The old 435-pass log was not used as the baseline.

| Gate | Result |
| --- | --- |
| Fresh corrected baseline | 435 passed, 0 failed, 0 skipped |
| `npm ci --no-audit --no-fund` | Pass; 78 locked packages; lockfile unchanged |
| Final full portable suite | 458 passed, 0 failed, 0 skipped; 215345.8832 ms |
| Lint / typecheck / schema validation | Pass |
| Build / generated freshness | Pass; freshness checked after each build |
| Dedicated packaging + actual embedded parity | 15 passed, 0 failed, 0 skipped (6 packaging + 9 parity); 167053.0273 ms |
| Logging on/off equivalence | All 23 frozen routes / 127 snapshots and all 20 golden runs unchanged |
| Offline bundle | 47 modules, 28 exact face assets, 758589 bytes; no network entrypoints |
| Historical offline SHA-256 (superseded) | `3043b90cf58b8a8bcdcaf893d28f72ab95f7b4cf67d681dbf7c2a165218d5767`; use the current final receipt above |
| Seven protected artifacts | Byte-identical; fixtures, goldens and both migration pairs untouched |
| `Temp/` | All 9 files preserved, same lengths and SHA-256 |
| Candidate private-path check / diff whitespace check | Pass |

Coverage exercises local offsets/UTC, deterministic naming, clock rollback/order, UI deduplication/injection/quotas, all private version/interest combinations, logging failures, current/late/terminal/replaced runs, partial stream recovery, traversal and symlink defenses, CSRF/origin/request caps, replay isolation, actual face phases, blind draft display, export Blob contents/filenames, offline storage failure and shared server/offline export equivalence. Automated disk tests use temporary directories and leave the repository log root alone.

The standalone was built and validated before the local checkpoint; its embedded build metadata accurately records starting SHA `58f018eb475c3a86d9b35e612d73cec3b99ad31f` with a dirty worktree. The full final source passes the gates above. Tests intentionally exercising denied storage print console diagnostics; those expected messages are not gameplay failures.

### Real browser samples

| Run | Verified result |
| --- | --- |
| `r17-proof-0`, Hint → Trade → confirm | 3 turns; AGREED; 2 Contra, $70 cash now, $50 principal + $4 extra, 7 days; $10 cash retained, $54 new repayment, $304 owed; standard extra $8; exact $4 savings line; Your edge Traded |
| `playtest-walk-away`, prepare → send | 1 turn; WITHDRAWN; $80 cash, 0 player stock, $250 owed; R-17 Held, exact detail private, interest unasked |

Both three-file sets contain actual authoritative turns, browser observations and receiving/responding face timings. Agreement has six face observations and walk-away has two. Local/UTC start values are `2026-10-01T18:25:28.228-04:00` / `2026-10-01T22:25:28.228Z` and `2026-10-01T18:33:09.250-04:00` / `2026-10-01T22:33:09.250Z`. Sample basenames use `-0400`. Neither sample reports recorder diagnostics. Reload continued the completed server run, and its later replacement preserved AGREED. JSON and Markdown export clicks are recorded without exposing file spoilers on screen. Filtered Debug was inspected before play.

Excerpt from the real agreement Markdown:

> Status: AGREED
>
> Marcus: Agreed. The stock is yours on the terms you just confirmed. The old account stays on the books.
>
> R-17 saved you $4 on the extra charge.

The underlying Markdown retains the full structured turn and end summary, not only this excerpt. Sample identities and copied file counts are in [SAMPLES.json](validation/playtest-log-pass/SAMPLES.json); byte receipts are in [VALIDATION_INVENTORY.json](validation/playtest-log-pass/VALIDATION_INVENTORY.json) and [PRESERVATION.json](validation/playtest-log-pass/PRESERVATION.json).

Copied text evidence normalizes line endings to LF and removes trailing whitespace/extra terminal blank lines. JSON values and Markdown content are otherwise retained. Inventory hashes describe these committed copies, not the ignored live files.

### Limits and retained boundaries

The in-app browser's Blob-download event timed out, although clicks reached the recorder with no console warnings and the JSON/Markdown controls worked. This pass therefore does not claim a completed browser save. Actual shared/embedded export bytes, Blob MIME/content/name behavior and protected HTTP exports pass automated checks. Direct standalone `file` navigation was blocked by the browser URL policy; it was not bypassed. Embedded classic-script execution, all frozen/golden routes and no-network exports were tested instead. Full-page screenshot capture was unavailable; saved viewport captures were visually checked.

Abrupt termination can lose unacknowledged UI observations; successfully appended complete records survive recovery. Local storage is best effort and does not restore gameplay. Limits can stop logging while the encounter continues. The existing raw developer API diagnostics and inspectable offline memory are outside the rendered-DOM privacy guarantee.

No gameplay engine, rate/floor/rounding/normalization, standard-16 scoring, blind-limit behavior, Section 35, Hint/Show/Trade eligibility, seeded attitudes, ledger events, document possession/disclosure, social mechanics, language or face selection changed. No fixture/golden/migration capture was run. Both pre-existing generated-file changes and `Temp/` remain outside this commit. No external corpus work, telemetry service or push.
