# Marcus world-model baseline

## Accepted source and package reconciliation

Baseline commit: `838b075081d0b97de468d4e84984ce1e57908e76`, current `codex/conversation-refinement-v02` repository source. The lead verified the remote branch advertises this same SHA. The mission branch starts at this commit; original checkout is preserved with its existing `package-lock.json` modification and untracked `Temp/`.

Standalone ZIP: `C:/Users/mcdon/Downloads/Marcus_Encounter_Standalone_V01_FIXED.zip`.

- ZIP SHA-256: `9fbb0e20632a7154d3416d58bf00d9c3fc0ef58980ccb48ed0210de9981c48a5`.
- Packaged HTML SHA-256: `c898c0c0ac18e91c164e8bc28ce0e2ed4d2546f46fb655edc0208a343a5ba250`.
- Every one of the 199 Git-tracked HEAD paths is present in packaged `source/` and text-equivalent after CRLF→LF normalization. 49 are identical as bytes; the other 150 differ only by newline representation. No material source difference or missing tracked file was found. Binary assets were also compared by hashes.
- Three-way execution compared repository source, packaged source, and the module runtime extracted from the actual packaged HTML: 18 routes, 84 transitions, 102 complete state/projection points passed. All historical final metrics and statuses for these routes matched. The later oracle expands recovery to all 23 existing scenarios.
- Scratch evidence: `C:/Users/mcdon/Documents/Codex/2026-09-29/in/work/baseline-review/reconciliation-evidence.json`; reproducible probe `reconcile.mjs` in the same directory; individual HEAD/package hashes in `head-file-comparison.json`.

Packaging substitutions are transport/presentation: CommonJS-style inline module registry; in-page API instead of HTTP and cookies; fixed local CSRF marker; page-local session state; different initial random seed/run-ID generation; embedded face asset data URLs and compatible image-path checks; inline CSS/UI; offline badge; Node-only filesystem/URL stubs and a synthetic base for an unused `import.meta.url` authored-anchor loader. Standalone restart omits the HTTP transport's identity/seed checks and HTTP anti-replay/session rules. These API-wrapper differences are recorded, not claimed identical. Explicit-seed ordinary engine transitions and projections match. Standalone and `scripts/encounter-server.mjs` both use `AUTHORING_PREVIEW`; the frozen oracle uses that same mode. No persistence or native executable is introduced here.

## Baseline gates

Lead executed in the isolated mission worktree before fixture capture:

| Command | Result |
| --- | --- |
| `npm ci` | PASS, 78 packages installed |
| `npm test` | PASS, 290 passed / 0 failed / 0 skipped |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run schema:validate` | PASS |
| `npm run build` | PASS |
| `node scripts/check-generated.mjs` | PASS |

Gate logs are delivered under `outputs/marcus-world-model/validation/baseline-*.log` in the task workspace. No pre-existing baseline failure was repaired. Node version during capture: v24.18.0.

## Frozen corpus and provenance

Fixture: `tests/fixtures/marcus-world-model-baseline-v01.json`.

SHA-256: `add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46`.

The handoff's 17-run count was an estimate. The actual historical JSON contains 11 named scenarios and **12** combination routes: six variant/quirk pairs exercised at both EA and SE. The fixture includes all **23 runs**, **104 transitions**, and **127 snapshots** (opening plus every resolved turn). Every captured final status, seven metrics, obligations, disclosure, beliefs, and negative opportunity window matches the historical result, whose sourceBaseline is older `72451fac5bcc857a3811fc78ace782118431e3f2`. Historical source labels were not treated as current executable authority.

Six named scenarios provide full `events` in the JSON. Five omitted sequences were recovered from tests and matched against the historical final records:

| Scenario | Authoritative sequence evidence |
| --- | --- |
| positiveEarlyGiveaway | information test: DISCLOSE_FULL → VERIFY_SOURCE → PROBE_USEFULNESS |
| negativeWithoutOpening | historical controlNote plus information paired-control test: normal negative preparation/disclosure; clone and remove only encounter-local negativeWindow; matched historical proposal |
| negativeExpired | information expiry test: normal negative preparation/disclosure; SMALL_TALK → ACK_MISSED → DEBT → expired DEAL |
| directCredit | history cash/credit test: `goodTerms` → ACCEPT |
| limitedCashPurchase | history cash/credit test: one-unit cash terms → ACCEPT |

The paired negative control is explicitly marked `REMOVE_NEGATIVE_WINDOW` before its fifth action; it is a test intervention on an encounter opportunity, not an achievable player action or a knowledge mutation. It must remain distinguishable from ordinary player routes. Combination routes recover exact proposal terms from the information test, use each historical record's vibe for questions/proposal, and the test's EA ACCEPT helper. All evidence labels and exact executed inputs are retained per run.

Two prior 8–9-turn patience-ending review playthroughs lack exact authoritative sequences in the supplied records. They are not invented or counted.

## Capture and immutability

Historical capture command (only on baseline HEAD):

```text
node scripts/capture-marcus-world-model-baseline.mjs --capture-baseline
```

The command refuses any HEAD other than the recorded baseline. It also rejects staged or unstaged tracked changes against HEAD in src/, public/, schemas/, package.json, package-lock.json, the encounter server, historical scenario JSON, and the history/information tests used to recover routes. A matching HEAD with edited runtime input cannot generate an oracle. An existing fixture requires the additional explicit flag `--overwrite-frozen-baseline`; normal tests never call capture. The baseline test pins the exact SHA-256, so changing expected data cannot silently make a migration pass. The lead must commit this checkpoint before production edits.

Before the initial checkpoint, independent review requested explicit reply-family capture. The final fixture adds `outcome.replyFamily`, selected by the existing `buildNpcFrame` from npc-lines.mjs using resolved state with the current turn removed from prior history and the recorded decision fields (including current counteroffer terms). This captures the authored family directly; it does not infer family from text. All previously captured fields were checked unchanged against the first pre-checkpoint capture.

Replay command:

```text
node --test tests/marcus-world-model-baseline.test.mjs
```

Snapshot contract: complete player-facing `play` and `options`, C1 legacy knowledge/exposure/disclosure/belief/source/content/record/relevance/evidence fields, private information ID, opportunity/progress state, C2 seven metrics/status/obligations/offers/agreement, seed-selected quirk/variant, and explicit pre-existing latest-turn fields including exact reply text, reaction family/cause, face presets and slot operations. Internal Debug state is excluded so future ledger/perception implementation can change representation. New event-link fields are not inserted into the baseline's explicit existing turn-field list.

Exact normalizations:

1. Construct deterministic inputs with runId `frozen-marcus-oracle`, requestId `frozen_oracle_<zero-based-step>`, and projection CSRF `frozen-oracle-csrf`.
2. JSON serialization omits undefined properties, as the HTTP transport does. No numeric rounding, text rewriting, key/value deletion from Play, sorting of arrays, or relaxed face/reply comparisons occurs.
3. Debug implementation internals are excluded by the declared projection contract. Offer IDs remain exact, generated deterministically from the fixed run identity. The complete semantic input sequence is also frozen and compared.

## Baseline authority and reader map

| Source surface | Current authority/read to remove or redirect |
| --- | --- |
| `src/encounter/history-content.mjs` | Authored initialKnowers/initialBelievers, private variant facts and hidden Marcus facts |
| `src/encounter/knowledge.mjs:createLore` | Hash selects variant, writes facts/knowledge arrays/beliefs/disclosure/evidence |
| `src/encounter/knowledge.mjs:informationEligibility` | Player choices read hidden variant, Marcus knowledge, and objective fact presence (including PICKUP_NEED); redirect to authorized perceptions/holdings and perceived replies |
| `src/encounter/knowledge.mjs:informationPlayerText/projectLore/privateInformation` | Visible phrases and inventory use variant, mutable disclosure, player knowledge and facts |
| `src/encounter/information-policy.mjs:resolveInformation` | Clones lore then writes knowledge/exposure arrays, belief source/content/record/relevance, evidence and disclosure; reads private variant and hidden facts to choose social consequences |
| `src/encounter/state.mjs` | Initializes legacy lore and seed profile |
| `src/encounter/engine.mjs` | Validates via legacy eligibility, installs information result, includes legacy reads in situation text, integrates ACCEPT disclosure with economic settlement |
| `src/encounter/marcus-policy.mjs` | Consumes information-derived scores/feedback and encounter metrics; the upstream information result must obey Marcus subjective access |
| `src/conversation/keyword-bank.mjs` | Player topic/menu gating reads knowledge.player, facts, privateFactId, disclosure and progress keys |
| `src/conversation/edge.mjs` | Player edge/opening view reads variant and mutable opportunity/information projection |
| `src/conversation/language/realizer.mjs` | Language helpers consume privateInformation; retain player-authorized information boundary |

Encounter-local progress keys, opening-window timing, turn IDs and patience remain local mechanics. The migration must remove mutable knowledge/belief authority while retaining read-only compatibility observations for this fixed oracle. This checkpoint establishes equivalence evidence; it does not claim C3–C11 have already been implemented.
