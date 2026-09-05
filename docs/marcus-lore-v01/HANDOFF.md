# Marcus HISTORY / LORE handoff

Implemented and verified the first planned expansion team only. This is a playable local ASK/DEAL encounter with debt history, player-held private information, persistent disclosure, imperfect probes, optional contact, meaningful later progress, and observational Debug. It is not the completed three-team overhaul.

## Build identity and access

Source: `codex/marcus-encounter-v01` at `72451fac5bcc857a3811fc78ace782118431e3f2`. Isolated implementation branch: `codex/marcus-lore-information-v01`. The source checkout was clean and unchanged. Final commit/status is recorded in the accompanying user-facing handoff after the local commit. No push, merge, deployment or public tunnel was performed for this mission.

Local verified URL: **http://127.0.0.1:4175/**. It is not publicly shareable. The separate historical prototype on 4174 is not this build. The current lore server is a hidden Node process, PID **31676**. It must remain running and in-memory sessions are lost on restart. Its console logs are in the task workspace's `work/marcus-lore-server.log` and `work/marcus-lore-server-error.log`.

## Reproducible playthroughs

All actions below use EA (Boundaried) / BALANCED. Independent tests also completed all six combinations using SE (Compassionate), so no one Vibe is compulsory.

| Information | Final say | Plain dealing | Recognition |
| --- | --- | --- | --- |
| Positive pickup detail | independent-lore-6 | independent-lore-4 | independent-lore-2 |
| Negative record discrepancy | independent-lore-0 | independent-lore-1 | independent-lore-5 |

**Positive:** restart with `independent-lore-2`. VERIFY_SOURCE, then PROBE_USEFULNESS. Propose 2 units, 41 upfront, 79 principal, 0 extra, 7 days, with OFFER_INFORMATION. In a matched independent comparison, the same prepared state and financial terms counter without information (score 14.12) but approve with it (22.12). Review/clarify and accept: only acceptance delivers the exact private instructions and transfers the goods/cash. Full disclosure before bargaining permanently removes that exchange option; later verification cannot restore it.

**Negative:** restart with `independent-lore-0`. VERIFY_SOURCE, PROBE_USEFULNESS, QUESTION_RECORD, DISCLOSE_FULL, then promptly propose defensible terms. The next DEAL within three subsequent turn positions receives at most +6 to its evaluation, subject to all economic and credit rules. The opening is consumed on that proposal even if it fails; it cannot reopen. The independent matched tests show a useful approval change and an unprepared/hostile backlash path. Early full disclosure before preparation raises tension and cannot be replayed after learning the better approach. No demand is backed by threatened exposure or punishment.

**Longer useful route:** `lore-3`, SMALL_TALK, ACK_MISSED, VERIFY_SOURCE, PROBE_USEFULNESS; then offer information with 2 units / 30 upfront / 90 principal / 0 extra / 10 days (counter), followed by a real improvement to 2 / 40 / 80 / 4 / 7 (approval). Six ASK/DEAL exchanges plus confirmation finish at cash 40, debt 334, Marcus stock 6, player stock 2. The second proposal is meaningful progress beyond turn three. A redundant partial hint after a usefulness probe is not new progress.

Direct business remains viable. A one-unit cash purchase is valid but a limited outcome. The newly authored provisional credit objective is at least two units with positive new principal. Outcome quality reports quantity, retained cash, new obligations and qualitative relationship changes, with no hidden victory score.

## Authored history and fact consequences

The established premise is $250 outstanding debt, $80 cash, and Marcus's ownership of stock. Newly authored additions are its earlier Contra-account origin, yesterday's missed check-in, last week's shared loading shift, a signed depot counterfoil, and the current business context. Positive private content is tomorrow's changed pickup gate/time/docket. Negative private content is a two-crate record mismatch; it establishes neither theft nor blame.

There are ten catalog entries, eight active per run. Every one has a paired absent-fact gameplay test. See [GAMEPLAY_TRACEABILITY.md](GAMEPLAY_TRACEABILITY.md) for the complete mapping, [KNOWLEDGE_AND_DISCLOSURE.md](KNOWLEDGE_AND_DISCLOSURE.md) for epistemic state, and [SCENARIO_RESULTS.json](SCENARIO_RESULTS.json) for actual independent traces. Fact absence blocks the corresponding use/condition; it never silently deletes an economic obligation.

## State and behavior changes

Seven metrics remain: cash **80**, debt **250**, Marcus stock **8**, player stock **0**, confidence **40**, tension **20**, patience **20**. Only patience changed from the baseline 12. Price remains 60 per unit. No numerical reputation, trust, emotion or manipulation-strength meter was added.

New structured state: `lore` holds active facts, player/Marcus knowledge, awareness, beliefs, NONE/PARTIAL/FULL disclosure, observed evidence, consumed progress keys, and an event-indexed negative opportunity. `phase` describes contact/business/negotiation/resolution without enforcing a corridor. Offers optionally bind an information exchange. Events retain semantic intent and before/after/deltas, adding feedback, progress, typed information causes and a versioned reaction cause. Outcome quality is derived in the conversation projection, not a persistent victory score.

The global three-turn goodwill cutoff is replaced by first specific acknowledgments, genuinely new evidence/information and financial concessions. A concession must not worsen units, upfront cash, principal or days relative to the previous proposal, and must set a new beneficial record relative to earlier proposals. An extra dollar on a much larger risky request does not earn goodwill. Repetition ignores tone, gives no repeat benefit and costs escalating patience. Every nonterminal ASK/DEAL spends finite patience; clarification also spends it.

CLARIFY_OFFER preserves the current offer's exact identity, terms and information condition while the request version advances. All other ASK/DEAL turns replace/invalidate it. Running out of patience invalidates it. The same authoritative acceptance path rechecks resources and knowledge conditions, atomically commits cash/stock/obligations and any promised information once, then ends the encounter. Stale, foreign, duplicated and malformed inputs do not mutate state.

Play contains known facts, observations and readable exchange summaries; it omits hidden facts, exact social values, lore binding IDs and rule diagnostics. Debug deliberately contains them and is observational. This is presentation separation, not cryptographic secrecy from a client receiving Debug data.

## Actual verification and findings

- Locked `npm ci` passed; no dependency upgrades or new framework.
- `npm test`: **194 passed, 0 failed, 0 skipped**. Baseline 159 plus 35 new tests: 14 H2 unit tests and 21 H4 independent tests.
- Lint (including browser JS), TypeScript, schema validation, build and generated freshness all passed. Existing adapter/TPL regressions remain in the suite. Browser JS syntax checks passed.
- H4 independently executed real transitions and HTTP requests, all ten fact-absence pairs, all six variants/quirks with two Vibes, matched benefits/backlash, source/disclosure ordering, finite progress, offer lifetime, malformed inputs and session/replay isolation. See [VALIDATION_REPORT.md](VALIDATION_REPORT.md).
- Browser interaction verified opening and both variants; optional small talk; evidence, probes, partial/full disclosure; proposal, counteroffer, late revision, clarification, acceptance, withdrawal, restart and Play/Debug. Positive revised agreement ended with cash39/debt329/stock6+2; negative browser agreement with cash20/debt314/stock6+2. Final server reload also verified full disclosure followed by source checking and usefulness probing does not restore privacy. The local page is left at a fresh positive seed.
- Fixed findings: cookie-name consistency; baseline fact references in causes; late source-check belief/feedback; false financial concession goodwill; duplicate category-hint progress; internal lore IDs in Play exchange data; and portable tracked documentation. No known unresolved functional findings.
- External-cache tests were not run and no corpus was acquired. No screenshot evidence is claimed; browser evidence is actual DOM interaction and displayed outcomes. State remains in memory and finite session limits remain.

## Launch and stop from an arbitrary directory

The following block locates this exact local worktree under Documents, checks repository identity and branch, and opens it before launch. Stop the existing lore process first to free port 4175. Run from a fresh PowerShell window; leave it open while playing and press Ctrl+C to stop its foreground server.

```powershell
$ErrorActionPreference = 'Stop'
$repo = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Codex\2026-09-04\r\work\marcus-lore'
if (-not (Test-Path -LiteralPath (Join-Path $repo 'scripts\encounter-server.mjs'))) { throw 'Lore worktree missing.' }
Set-Location -LiteralPath $repo
$remote = & git remote get-url origin
if ($LASTEXITCODE -ne 0 -or $remote -ne 'https://github.com/fargo161/dpa-message-foundations-v01.git') { throw 'Repository identity mismatch.' }
$branch = & git branch --show-current
if ($LASTEXITCODE -ne 0 -or $branch -ne 'codex/marcus-lore-information-v01') { throw 'Unexpected branch.' }
$nodeExe = (Get-Command node -ErrorAction Stop).Source
$env:MARCUS_PORT = '4175'
& $nodeExe (Join-Path $repo 'scripts\encounter-server.mjs')
if ($LASTEXITCODE -ne 0) { throw "Server exited with code $LASTEXITCODE" }
```

To stop the currently delivered hidden server, this block checks its identity before stopping the recorded PID. If it is no longer running, it does nothing. It does not stop the old public prototype or any tunnel.

```powershell
$ErrorActionPreference = 'Stop'
$running = Get-CimInstance Win32_Process -Filter 'ProcessId = 31676'
if ($null -ne $running) {
  if ($running.Name -ne 'node.exe' -or $running.CommandLine -notlike '*scripts/encounter-server.mjs*') { throw 'PID now belongs to a different process.' }
  Stop-Process -Id 31676 -ErrorAction Stop
}
```

## Later-team contracts and token accounting

The next BASED/personality team receives the same structured semantic intent, active fact references, evidence, progress, resolved consequences and remaining avenues. Preserve these facts and transaction authority when replacing interim voice or interpretation. The current canonical 20-Vibe reaction table/intensity behavior was retained.

The later face team receives `marcus-reaction-cause@0.1` referencing the resolved turn and previous turn, causal fact/evidence IDs, outcome, requested social change, authoritative delta location, disclosure and offer continuity, and remaining avenues. It covers terminal turns too. That team must later define changes/holds for anatomical left brow, right brow, left eye, right eye and mouth. This team supplies no final facial slots, emotional mappings or asset identifiers, and claims no full TPL authorization.

Four agents worked without nested delegation. Estimates, not measured totals: H1 40k–80k; H2 35k–50k; H3 about30k; H4 30k–45k; aggregate roughly **135k–205k**, below the 500k mission ceiling by estimate. Exact aggregate metering was unavailable; no enforceable cap is claimed. See TOKEN_LEDGER.md.

Stop for the user's lore-team playtest. Later teams have not started.
