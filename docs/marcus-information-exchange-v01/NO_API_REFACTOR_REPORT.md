# Marcus no-API refactor — 2026-10-06

The game screen now resolves turns and previews through one module inside the page in both running modes. The dev server only hands the browser a fixed list of files, and the offline builder bundles the real engine instead of pasting in a fake server. Gameplay rules, authored dialogue, faces, numbers and frozen evidence were preserved.

An API call here means the game asking a server program for an answer. A commit is a recorded Git checkpoint. An assertion is one check inside a test. SHA-256 is a fingerprint of exact file bytes; a clean tree means Git reports no pending changes.

## Safety and setup

Commands: `git status`, `git branch --show-current`, `git log --oneline -3`, `git fetch origin`, `git rev-parse origin/codex/r17-information-exchange-v01`, `git switch -c codex/no-api-local-engine-v01 a4e366c8dc7fb5a34b901def1ea75c49dcdd259b`, `node --version`, `python --version`.

The workspace was the requested repository. The initial branch was `codex/r17-information-exchange-v01`; fresh fetch confirmed its remote tip at `a4e366c8dc7fb5a34b901def1ea75c49dcdd259b`. No main/r17 branch was changed and nothing was pushed. PowerShell was used, with Node v24.18.0, npm 11.16.0 and Python 3.12.0 through `python`.

The initial status listed the two generated JSON files plus untracked `Temp/`. Work stopped until the owner instructed cleanup. Both generated files were backed up outside the repository at the exact location reported in chat, then restored only on those two paths. `Temp/` was left in place and locally excluded through `.git/info/exclude`; empty Logs/UserSettings needed no exclusion. The resulting status was clean before fetching/branching.

Builds exposed a Git line-ending/stat-cache mismatch: system `core.autocrlf=true`, index LF, generated working files LF, but cached index sizes matched CRLF. Actual HEAD/index/working normalized bytes matched exactly; `git diff --stat` was empty. Refresh did not clear the flags. The owner's narrow restore returned working files to CRLF and cleared status. No generated content was staged or committed. The final check repeats this byte proof before any narrow restore, and stops if content differs.

Commands for that diagnosis: `git config --show-origin core.autocrlf`, `git diff --stat`, `git ls-files --eol -- data/generated/based-tpl-foundation.json data/generated/foundation-inspection.json`, byte comparison against `git show HEAD:<path>`, `git -c core.autocrlf=false update-index --refresh`, `git restore -- data/generated/based-tpl-foundation.json data/generated/foundation-inspection.json`, `git status --short`.

## Files

| Action | File | Purpose |
| --- | --- | --- |
| Changed | `eslint.config.mjs` | Include page modules in lint checks. |
| Changed | `jsconfig.json` | Include page modules in type checks. |
| Changed | `public/encounter/app.js` | Call the engine directly; retain preview timing, guards and presentation. |
| Added | `public/encounter/browser-node-fs.mjs` | Explicit browser stub refuses unused filesystem research loading. |
| Added | `public/encounter/browser-node-url.mjs` | Browser URL stub for the existing source graph. |
| Added | `public/encounter/browser-options.mjs` | Inject browser storage, IDs, clock, metadata and face sources. |
| Changed | `public/encounter/index.html` | Load reviewed browser import mapping and static build metadata. |
| Added | `public/encounter/local-engine.mjs` | One synchronous page-owned engine and observational log lifecycle. |
| Changed | `public/encounter/playtest-log.js` | Direct log ingestion/exports with the same UI and filenames. |
| Changed | `scripts/encounter-server.mjs` | Serve static files only with restrictive security headers. |
| Added | `scripts/encounter-static-files.mjs` | Explicit source-module allowlist. |
| Deleted | `scripts/playtest-log-store.mjs` | Remove obsolete server-side disk writer. |
| Changed | `scripts/test-portable.mjs` | Register engine and source-network checks; replace disk logging suite. |
| Changed | `tests/conversation-acceptance.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Changed | `tests/conversation-portability.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Changed | `tests/conversation-security.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Changed | `tests/encounter-adversarial.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Changed | `tests/encounter-api.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Changed | `tests/encounter-lore-adversarial.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Added | `tests/encounter-no-network.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Added | `tests/helpers/local-engine-client.mjs` | Shared direct engine harness; real HTTP only for static files. |
| Added | `tests/local-engine.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Added | `tests/playtest-log-engine.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Deleted | `tests/playtest-log-server.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Changed | `tests/playtest-log-ui.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Changed | `tests/standalone-build.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Changed | `tests/standalone-parity.test.mjs` | Adapt the named checks to direct engine execution; see test ledger. |
| Changed | `tools/build_standalone.py` | Bundle real engine; remove fake server and retain strict network audit. |
| Changed | `AGENTS.md` | Add exactly the canonical no-network rule. |
| Changed | `docs/marcus-information-exchange-v01/IMPLEMENTATION_REPORT.md` | Supersede historical server and build descriptions. |
| Changed | `docs/marcus-information-exchange-v01/PLAYTEST_LOG_SCHEMA.md` | State current browser persistence and retired disk behavior. |
| Added | `docs/marcus-information-exchange-v01/NO_API_REFACTOR_REPORT.md` | This reviewable handoff and complete test accounting. |

## Checks before and after

All outputs are saved under ignored `dist/no-api-validation/`. The table's after results were actually run on the implementation before documentation commit; final-commit reruns and official build details are in `FINAL_BUILD_RECEIPT.json` in that folder, produced after committing this report. That avoids claiming an unrun check or a self-referential commit/hash.

| Command | Before at a4e366c | After implementation |
| --- | --- | --- |
| `npm ci --no-audit --no-fund` | Pass, 78 packages | Final-commit rerun in receipt |
| `npm test` | 458 passed, 0 failed | Commit 1: 458/458; commit 2: 458/458; commit 3: 464/464 |
| `npm run lint` | Pass | Pass, expanded to page modules |
| `npm run typecheck` | Pass | Pass, expanded to page modules |
| `npm run schema:validate` | Pass | Final-commit rerun in receipt |
| `npm run build` | Pass: 180 cells, 60 anchors, 9 manifests | Final-commit rerun in receipt |
| `node scripts/check-generated.mjs` | Pass: 3 generated files | Final-commit rerun immediately after build in receipt |
| `python tools/build_standalone.py --source . --output dist/marcus-information-exchange-v01` | Pass: 47 modules, 28 face assets, 758590 bytes | Development build: 49 modules, 28 assets, 760059 bytes; official clean build in receipt |
| `node --test tests/standalone-build.test.mjs tests/standalone-parity.test.mjs` | Not separately repeated at baseline | 15/15 passed (6 packaging + 9 parity) |
| `node --test tests/local-engine.test.mjs tests/local-engine-equivalence.test.mjs` | New temporary proof | 7/7 passed before removing server routes |

Baseline standalone SHA-256 from the actual command: `9da3edef36170363a538efd29ea7287bc1b24efdd8174bd8107157567feb0cba`. The brief's older 758589-byte / `3043b90c…5767` bundle was a different recorded build; it was not substituted for this fresh baseline.

Environment failures were recorded, then rerun with appropriate execution permissions: restricted npm install could not reach the registry; restricted baseline tests had 22 connection/temp-permission failures (436 passing), while the unrestricted baseline passed all 458. A step-2 packaging run had one asset-rename permission failure; unrestricted retry passed 6/6. Three migration assertions initially retained success code 200 instead of direct-engine code 0, and type checking found Map pair inference; both were corrected before commit 3. No remaining test failure was accepted as gameplay evidence.

Protected-file command: `git diff --stat a4e366c -- src tests/fixtures docs/marcus-information-exchange-v01/GOLDEN_RUNS.json docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.json docs/marcus-information-exchange-v01/EXTRA_CHARGE_MIGRATION.json`. Output was empty: no existing or new src files and no frozen evidence changed.

The equivalence test is preserved at commit `29805873a50c6b0a0b33f52be5b45b4056ce3ba6`. It replayed all 20 golden runs against the old HTTP server and new engine, including separate preview, restart, agreement, walk-away and complete logs, comparing snapshots with only CSRF removed. Commit 2 is `76edf62eda36bfe4864ff4aa4bc4a8d8e80fb971`; commit 3 is `02a16bf711dc120079661a9089d1f7519c5ee41f`. `git log --format='%H %s' a4e366c..HEAD` identifies the fourth documentation commit after it exists.

## Test ledger

Portable accounting is exactly **458 + 6 engine tests + 1 source-network test - 1 obsolete disk-symlink test = 464**. Seven browser-log tests replace seven of the eight server-log tests. Other rewritten tests retain their counts. The temporary equivalence test was a separate targeted check, never part of `npm test`. Dedicated standalone suites remain 6 + 9 = 15, outside the portable count. Unchanged bodies in an adapted test harness are included below for complete accounting; their frozen gameplay expectations were not rewritten.

| File | Action | Exact test name / proof | Why |
| --- | --- | --- | --- |
| `tests/conversation-acceptance.test.mjs` | Rewritten / harness adapted | conversation: preview has no effects and its request can still commit exactly once | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/conversation-acceptance.test.mjs` | Rewritten / harness adapted | conversation: both knowledge variants and all three quirks complete contextual engine routes | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/conversation-acceptance.test.mjs` | Rewritten / harness adapted | conversation: reception expression does not use future outcome, hidden reasons, or direct vibe | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/conversation-acceptance.test.mjs` | Rewritten / harness adapted | conversation: delivery previews preserve conditional information and exact terms across all 60 coordinates | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/conversation-acceptance.test.mjs` | Rewritten / harness adapted | conversation presentation: skip shows the response once; cancellation cannot replay a pending beat | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/conversation-acceptance.test.mjs` | Rewritten / harness adapted | conversation presentation: reduced motion preserves both ordered beats | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/conversation-portability.test.mjs` | Rewritten / harness adapted | conversation portability: Avery uses the common engine, keywords, preview, two-face turn and restart | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/conversation-security.test.mjs` | Rewritten / harness adapted | conversation security: preview rejects fabricated contexts, semantic substitution and fake language authority | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/conversation-security.test.mjs` | Rewritten / harness adapted | conversation security: stale previews and simultaneous duplicate sends have no extra effects | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/conversation-security.test.mjs` | Rewritten / harness adapted | conversation security: only catalogued same-origin images and explicit static modules are served | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial: economics reject fabricated credit even at maximal confidence | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial: closed intent and semantic shapes forbid client authority | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial: offers move nothing, acceptance accounts once and rechecks resources | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial: forged, mismatched and intervening-turn offers fail | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial: repeated probes have finite benefit and always consume a finite encounter | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial: seeded replay reproduces transitions and delivery preserves security with normalized extra | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial: projection has four Play metrics and every displayed fact agrees with Debug | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial local engine: stale/replay, simultaneous turns and restart isolate authority | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial HTTP: only prototype assets/routes are served | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial: context and risk acknowledgment improve assessment with exact normalized charges | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial: generic and repeated topics cannot farm benefits after specific acknowledgments | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-adversarial.test.mjs` | Rewritten / harness adapted | adversarial local engine: foreign offers fail and complete replayed agreements match | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-api.test.mjs` | Rewritten / harness adapted | local engines reject replay, foreign runs and state injection and isolate restarts | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-lore-adversarial.test.mjs` | Rewritten / harness adapted | lore local engine: new malformed semantic shapes cannot mutate knowledge, history or resources | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-lore-adversarial.test.mjs` | Rewritten / harness adapted | lore local engine: disclosure replay, foreign runs, sessions and restart isolate knowledge | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-lore-adversarial.test.mjs` | Rewritten / harness adapted | lore local engine: clarification retains offer but disclosure invalidates it and accept stays atomic | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-lore-adversarial.test.mjs` | Rewritten / harness adapted | lore: information cannot authorize unavailable stock, fake cash or inconsistent obligation | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-lore-adversarial.test.mjs` | Rewritten / harness adapted | lore local engine: conditional information is delivered atomically only by current exact acceptance | Keep the same gameplay/presentation assertions using the direct engine; no expected outcome weakened. |
| `tests/encounter-no-network.test.mjs` | Added | encounter source forbids every transport call checked by the standalone audit | Fail on every network-capable source call; reject game routes and fake builder transport. |
| `tests/local-engine.test.mjs` | Added | local engine: preview is pure, commit is exact and duplicate identity survives restart | Add isolated coverage of the named engine guarantee. |
| `tests/local-engine.test.mjs` | Added | local engine: restart validates exact fields, identity, version, seed and scenario before mutation | Add isolated coverage of the named engine guarantee. |
| `tests/local-engine.test.mjs` | Added | local engine: returned snapshots cannot mutate live state and stale parallel commands have one effect | Add isolated coverage of the named engine guarantee. |
| `tests/local-engine.test.mjs` | Added | local engine: storage failure and throwing warnings cannot block authoritative gameplay | Add isolated coverage of the named engine guarantee. |
| `tests/local-engine.test.mjs` | Added | local engine: previous saved log is downloadable evidence and never restores gameplay | Add isolated coverage of the named engine guarantee. |
| `tests/local-engine.test.mjs` | Added | local engine: face source injection changes image sources only | Add isolated coverage of the named engine guarantee. |
| `tests/playtest-log-engine.test.mjs` | Replaces server test | local engine exports complete agreement logs from authoritative events and bounded UI batches | Preserve the named logging guarantee using browser storage/direct functions instead of disk/HTTP. |
| `tests/playtest-log-engine.test.mjs` | Replaces server test | restart replaces an open run, retains old UI identity, and does not overwrite a final walk-away | Preserve the named logging guarantee using browser storage/direct functions instead of disk/HTTP. |
| `tests/playtest-log-engine.test.mjs` | Replaces server test | interrupted log snapshots stay readable and incomplete; corrupt saved evidence never restores state | Replace torn JSONL recovery with complete saved snapshot/incomplete status and corrupt browser evidence checks. |
| `tests/playtest-log-engine.test.mjs` | Replaces server test | log intake rejects wrong runs, forged authority and oversized or path-bearing envelopes without changing gameplay | Retain wrong-run, forged-authority and payload limits; retire cookies, origin and CSRF assertions. |
| `tests/playtest-log-engine.test.mjs` | Replaces server test | UI retries are idempotent and do not spend a gameplay request or turn | Preserve the named logging guarantee using browser storage/direct functions instead of disk/HTTP. |
| `tests/playtest-log-engine.test.mjs` | Replaces server test | unwritable browser storage never changes a gameplay result or projection | Preserve the named logging guarantee using browser storage/direct functions instead of disk/HTTP. |
| `tests/playtest-log-engine.test.mjs` | Replaces server test | automated logging tests write nothing into the repository log folder | Preserve the named logging guarantee using browser storage/direct functions instead of disk/HTTP. |
| `tests/playtest-log-ui.test.mjs` | Rewritten / harness adapted | filtered Debug excludes raw private state while retaining observed diagnostics | Inject direct engine logging instead of HTTP; retain UI timing, privacy, retry and actual Blob download assertions. |
| `tests/playtest-log-ui.test.mjs` | Rewritten / harness adapted | browser observer records panel clicks, committed edits and both blind extra outcomes | Inject direct engine logging instead of HTTP; retain UI timing, privacy, retry and actual Blob download assertions. |
| `tests/playtest-log-ui.test.mjs` | Rewritten / harness adapted | face phases, preview/error text and pagehide flush retain UI timing and structure | Inject direct engine logging instead of HTTP; retain UI timing, privacy, retry and actual Blob download assertions. |
| `tests/playtest-log-ui.test.mjs` | Rewritten / harness adapted | download creates JSON/Markdown files without putting their private content into DOM | Inject direct engine logging instead of HTTP; retain UI timing, privacy, retry and actual Blob download assertions. |
| `tests/playtest-log-ui.test.mjs` | Rewritten / harness adapted | engine observation failures are console-only and queued observations can retry | Inject direct engine logging instead of HTTP; retain UI timing, privacy, retry and actual Blob download assertions. |
| `tests/playtest-log-ui.test.mjs` | Rewritten / harness adapted | source hooks observe real delivery order, transitions and errors without copying Debug | Inject direct engine logging instead of HTTP; retain UI timing, privacy, retry and actual Blob download assertions. |
| `tests/standalone-build.test.mjs` | Rewritten / harness adapted | standalone packaging is byte-reproducible and parses with the same world engine | Keep packaging checks; use real bundled runtime and replace obsolete substitution failure with network-audit rejection. |
| `tests/standalone-build.test.mjs` | Rewritten / harness adapted | packaged source/ plus thin rebuild wrapper defaults are independent of host paths | Keep packaging checks; use real bundled runtime and replace obsolete substitution failure with network-audit rejection. |
| `tests/standalone-build.test.mjs` | Rewritten / harness adapted | a missing required asset fails without replacing a previous deliverable | Keep packaging checks; use real bundled runtime and replace obsolete substitution failure with network-audit rejection. |
| `tests/standalone-build.test.mjs` | Rewritten / harness adapted | a network-capable UI call fails loudly | Keep packaging checks; use real bundled runtime and replace obsolete substitution failure with network-audit rejection. |
| `tests/standalone-build.test.mjs` | Rewritten / harness adapted | unresolved reexports and unknown named bindings are rejected | Keep packaging checks; use real bundled runtime and replace obsolete substitution failure with network-audit rejection. |
| `tests/standalone-build.test.mjs` | Rewritten / harness adapted | unapproved Node dependencies and residual network calls are rejected | Keep packaging checks; use real bundled runtime and replace obsolete substitution failure with network-audit rejection. |
| `tests/standalone-parity.test.mjs` | Rewritten / harness adapted | standalone is classic-script parseable with all 28 exact source face assets and no network entrypoints | Use real engine functions in the harness; keep frozen-route/golden/face/term assertions and NETWORK_FORBIDDEN sandbox. |
| `tests/standalone-parity.test.mjs` | Rewritten / harness adapted | standalone module graph and non-import source bodies match the migrated source with only browser substitutions | Use real engine functions in the harness; keep frozen-route/golden/face/term assertions and NETWORK_FORBIDDEN sandbox. |
| `tests/standalone-parity.test.mjs` | Rewritten / harness adapted | standalone inventory independently matches output bytes, normalized source inputs and substitution contracts | Use real engine functions in the harness; keep frozen-route/golden/face/term assertions and NETWORK_FORBIDDEN sandbox. |
| `tests/standalone-parity.test.mjs` | Rewritten / harness adapted | actual embedded runtime equals migrated source and frozen oracle over all 23 routes/127 snapshots | Use real engine functions in the harness; keep frozen-route/golden/face/term assertions and NETWORK_FORBIDDEN sandbox. |
| `tests/standalone-parity.test.mjs` | Rewritten / harness adapted | actual local engine restarts deterministic seeds, previews without mutation, commits and resets both variants | Use real engine functions in the harness; keep frozen-route/golden/face/term assertions and NETWORK_FORBIDDEN sandbox. |
| `tests/standalone-parity.test.mjs` | Rewritten / harness adapted | actual offline recorder and download exports match the shared server model with fixed metadata and clock | Use real engine functions in the harness; keep frozen-route/golden/face/term assertions and NETWORK_FORBIDDEN sandbox. |
| `tests/standalone-parity.test.mjs` | Rewritten / harness adapted | offline storage failures preserve gameplay and do not restore state from a saved log | Use real engine functions in the harness; keep frozen-route/golden/face/term assertions and NETWORK_FORBIDDEN sandbox. |
| `tests/standalone-parity.test.mjs` | Rewritten / harness adapted | actual embedded R-17 proof matches all 20 golden routes, including Show and Hint | Use real engine functions in the harness; keep frozen-route/golden/face/term assertions and NETWORK_FORBIDDEN sandbox. |
| `tests/standalone-parity.test.mjs` | Rewritten / harness adapted | embedded exact-extra regression and blind exposure preview match source with networking forbidden | Use real engine functions in the harness; keep frozen-route/golden/face/term assertions and NETWORK_FORBIDDEN sandbox. |
| `tests/playtest-log-server.test.mjs` | Deleted without replacement | disk adapter refuses symlink roots instead of writing through them | The disk adapter was deleted; browser storage has no filesystem symlink root. Sole portable count reduction. |
| `tests/local-engine-equivalence.test.mjs` | Added in commit 1, retired in commit 3 | Old HTTP/new engine equivalence replay | Temporary migration proof passed while both paths existed; never registered in the portable total. |

The seven replaced server names, in corresponding order, were: “live server writes complete agreement log sets from authoritative events and bounded UI batches”; “restart replaces an open run, retains old UI identity, and does not overwrite a final walk-away”; “interrupted streams stay readable and incomplete; a torn last line is recoverable”; “log endpoint rejects missing CSRF, wrong origin/session/run, forged authority and oversized/path-bearing envelopes”; “UI retries are idempotent and do not spend a gameplay request or turn”; “an unwritable logging root never changes a gameplay result or API projection”; “automated logging tests write nothing into the repository log folder”. Their replacement rows above name and explain each corresponding check. Renamed HTTP test rows retain the same subject and all game assertions while replacing transport success/status checks with direct returns or unchanged game-error classifications.

## Removed network machinery and log consequence

Removed CSRF tokens (protection against other websites sending requests), session cookies, HTTP Content-Type checks, request-body byte limits, cross-site Origin/Fetch-Site header checks, the 512-request session cap, response status/header plumbing, credentials and the playtest basename response header. These had no role in page-local gameplay. Log-record validation and bounded evidence payloads remain. Duplicate request IDs, exact restart fields, identity/version/seed/scenario checks and synchronous state assignment remain, with the same game-error messages. Logging and even a throwing warning callback cannot block a valid turn.

Dev logs now live in browser storage and use the same existing download buttons as standalone. **They are no longer automatically written to `playtest-logs/`.** Reload starts fresh gameplay; the saved prior log is separately downloadable evidence. The fixed static allowlist now includes the source modules the engine requires and two explicit browser stubs for otherwise-unused Node-only research dependencies. The server prepares an ignored static build-metadata file once at startup; it does not resolve game requests.

The builder retains the face guard replacement because dev accepts only reviewed `/assets/marcus/*.webp` paths while standalone supplies embedded WEBP data. The replacement is count-checked and independently tested. It does not change the image bytes or face choice. CSS/script embedding and removal of dev import-map/metadata tags also have explicit count receipts. Network auditing remains strict; no fake server or fetch rewriting remains.

## Official build and browser evidence

The official build must be made after commit 4 with `MARCUS_BUILD_INFO` unset and clean `git status --porcelain`. Commands:

```powershell
git rev-parse HEAD
git status --porcelain
python tools/build_standalone.py --source . --output dist/marcus-information-exchange-v01
python tools/build_standalone.py --source . --output dist/no-api-rebuild
node --test tests/standalone-build.test.mjs tests/standalone-parity.test.mjs
```

The final receipt compares both HTML files byte for byte, hashes their actual bytes, reads inventory module/asset counts, and confirms both inventory and embedded `commitFull` equal final HEAD with `dirty:false`. See `dist/no-api-validation/FINAL_BUILD_RECEIPT.json` for exact final ID, bytes, SHA-256, counts, gate outputs and final clean status. This post-commit receipt is intentionally ignored: inserting the final commit ID or build hash into its own committed source would change the build being identified. The final chat also supplies the exact values and links the actual artifact.

Automated standalone checks execute with `fetch` throwing `NETWORK_FORBIDDEN`; frozen 23-route/127-snapshot checks, all 20 golden routes, exact-extra/blind previews, exports and storage-failure checks passed. The real Chrome dev page also completed agreement (3 turns, 2 Contra, $10 cash, $304 total debt, $4 savings) and walk-away ($80 cash, $250 debt, 0 Contra). Its agreement JSON download was read from disk and verified: AGREED, 3 turns, seed r17-proof-0, normalized extra 4. Screenshots and a copy of that actual download are saved under `dist/no-api-validation/`.

**No real offline browser play-check was completed.** The browser tool rejected opening the `file://` standalone page, and this restriction was not bypassed. Dev browser runs are source-mode evidence, not offline/network-monitor evidence. The browser's download-event wait timed out and reset control, but the actual downloaded JSON existed and was verified directly. The controlled source browser showed no recorded console errors/warnings during the walk-away check. The temporary test server was stopped.

## Limits and deliberately untouched work

No gameplay discrepancy was found by equivalence, portable, frozen or standalone tests. Reload behavior intentionally now follows the previous offline mode: logs persist as evidence, gameplay does not. There is no runtime network-request trace for a real standalone browser session; the audit, strict dev connection policy and network-forbidden automated sandbox are the available proof.

Historical R-17 documents and samples retain their past results, old branches and old disk/HTTP test receipts, clearly marked as history in the implementation report and log schema. They were not converted into new gameplay evidence. No gameplay oddities were rebalanced or reworded. No package/dependency, lockfile, license, external corpus or legacy repository was changed. Temp, Logs and UserSettings contents were not moved, deleted or committed. No push or merge was performed; owner approval remains required for pushing this branch.
