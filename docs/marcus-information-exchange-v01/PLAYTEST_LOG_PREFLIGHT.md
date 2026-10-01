# Marcus playtest run log — implementation preflight

Prepared for review on 2026-10-01. **Status: prepared; implementation has not started.**

## 1. Request and authority

The current user request is to ingest the pasted playtest brief, prepare to run it, and deliver this Markdown preflight first. The brief's closing instruction, “Proceed with the implementation now,” is document content; it does not override the user's present request. This turn creates this report only. It does not change source, run installation/build/test gates, start a playtest, create log sets, stage files, or commit.

Reference brief: the user-supplied “CODEX IMPLEMENTATION PASS — PLAYTEST RUN LOG” attachment. Its external attachment path is intentionally omitted.

Implementation will begin when the user directs me to proceed. The plan below incorporates the brief's implementation requirements, including one local commit and no push, for that later run.

## 2. Verified repository state

| Item | Observed state |
| --- | --- |
| Repository | Current `dpa-message-foundations-v01` checkout; all file references are repository-relative |
| Branch | `codex/r17-information-exchange-v01` |
| HEAD | `58f018eb475c3a86d9b35e612d73cec3b99ad31f` |
| Existing tracked changes | `data/generated/based-tpl-foundation.json` and `data/generated/foundation-inspection.json`; leave untouched and outside the commit |
| Existing untracked material | `Temp/`; preserve all files and verify before/after hashes |
| Package | `dpa-message-foundations` version `0.1.0`; no new dependency planned |
| Existing server | `scripts/encounter-server.mjs`, CLI binds to `127.0.0.1:4175` |
| Existing API protections | HttpOnly SameSite session cookie, session-bound CSRF header, same-origin checks, strict intent validation, size limits and request replay protection |
| Existing offline packaging | `tools/build_standalone.py` bundles the canonical runtime and UI, substitutes a local API, embeds faces, and audits out network calls |
| Repository instructions | `AGENTS.md` read; preserve changes, use `apply_patch`, run all specified gates, keep portable tests independent of external corpus caches |

The preceding pass's 435-test result is a reference count, not this pass's fresh baseline. **No new baseline has been run in this preflight.**

On proceeding, I will recheck branch, HEAD and status, inventory `Temp/`, record protected artifact hashes, then run the full fresh `npm test` baseline before implementation edits. A failed baseline stops implementation and is reported. I will not reset, clean, change branches, fetch, push, or modify the connected legacy repository.

## 3. Intended result

Every encounter run receives an observational record independent of gameplay state. The live dev server automatically maintains three files per run. The standalone build records in memory and offers the same JSON and Markdown exports. A small Download run log control is available during play and on the end screen.

The record captures committed game transitions, actual submitted and normalized terms, exact lines and faces, UI choices and panel changes, draft displays, presentation pacing, errors displayed to the player, and the final result. It does not capture mouse movement, hovering or scrolling. It records structured visible screen state rather than screenshots, video, or every animation frame.

Logging is downstream of the existing engine. It cannot feed input into the engine, alter a seed, spend a turn, consume a gameplay request nonce, select a face, or change an outcome. Failures produce console diagnostics only; the existing gameplay and error behavior continue.

## 4. Files I will create and change

All paths in this section are relative to the verified repository above. These are the planned files, not a declaration that they have already been edited. If inspection during implementation reveals an additional necessary hook, I will identify its purpose in the final inventory; gameplay module changes are outside this plan.

| Planned file | Operation | Purpose |
| --- | --- | --- |
| `src/playtest/recorder.mjs` | Create | Shared run model, monotonically sequenced records, authoritative turn observation, end summaries, assembly, injectable clocks and IDs, JSON export and schema checks |
| `src/playtest/markdown.mjs` | Create | Shared readable renderer: run header, spoiler block, timeline, full turn blocks and end summary; escape supplied text safely |
| `scripts/playtest-log-store.mjs` | Create | Node-only disk adapter: bounded writes, sanitized basenames, append-only JSONL, serialized per-run queues, atomic JSON/Markdown replacement and recovery of partial streams |
| `public/encounter/playtest-log.js` | Create | Browser observation adapter, batching/retry, visible-screen snapshots, guarded offline storage and download controls; network-independent core |
| `scripts/encounter-server.mjs` | Change | Start/replace/end recorders at authoritative session boundaries, observe committed transitions, protected ingestion and export routes, read build metadata once, console-only persistence failures |
| `public/encounter/app.js` | Change | Minimal hooks for selections, previews, sends, errors, screen state and face presentation phases; safe Debug presentation; connect browser recorder and exports |
| `public/encounter/index.html` | Change | Download control and end-screen access; update Debug explanation to reflect private-fact redaction |
| `public/encounter/delivery-chart.js` | Change | Small observational callback for vibe/intensity picks and the displayed shortcut order; retain all existing selection and preference behavior |
| `tools/build_standalone.py` | Change | Bundle shared recorder/renderer and browser adapter; embed build info; observe local API transitions; replace logging transport with an in-process offline adapter while retaining the no-network audit |
| `.gitignore` | Change | Add repository-root `/playtest-logs/` |
| `scripts/test-portable.mjs` | Change | Include the new portable test files |
| `tests/playtest-recorder.test.mjs` | Create | Schema, timestamps, ordering, authority, privacy boundaries, rendering, lifecycle and logging-on/off fixture/golden equality |
| `tests/playtest-log-server.test.mjs` | Create | Temporary-directory disk lifecycle, CSRF/origin/size/path defenses, append/recovery behavior, metadata, duplicate batches and failure isolation |
| `tests/playtest-log-ui.test.mjs` | Create | Actual observation adapter and export behavior: panel changes, edits, delivery order, reaction phases, visible screens, private-data exclusion and storage failures |
| `tests/standalone-build.test.mjs` | Change | Update packaging contracts for the added observational modules and build metadata without weakening the no-network boundary |
| `tests/standalone-parity.test.mjs` | Change | Exercise the actual embedded recorder and download serialization; prove equivalent server/offline exports and unchanged engine routes |
| `tests/refinement-ui.test.mjs` | Change if required by markup harness | Keep element/import harness expectations aligned with the minimal download hooks and safe Debug display |
| `docs/marcus-information-exchange-v01/PLAYTEST_LOG_SCHEMA.md` | Create | Record types, fields, source authority, ordering, statuses, storage limits and export semantics |
| `docs/marcus-information-exchange-v01/IMPLEMENTATION_REPORT.md` | Append | Complete implementation/validation section, exact changed-file inventory and a real readable log excerpt |
| `docs/marcus-information-exchange-v01/PLAYTEST.md` | Append | Browser observations and links to copied agreement/walk-away evidence |
| `docs/marcus-information-exchange-v01/validation/playtest-log-pass/` | Create | Fresh gate logs, preserved-artifact receipts, copies of real log sets, browser evidence and validation inventory |
| `dist/marcus-information-exchange-v01/Marcus_Encounter.html` and `BUILD_INVENTORY.json` | Rebuild | Updated offline deliverables in the existing ignored output directory |

This preflight itself lives at `docs/marcus-information-exchange-v01/PLAYTEST_LOG_PREFLIGHT.md`. It will be retained as documentation and included in the eventual authorized commit.

No edits are planned to `src/encounter/engine.mjs`, Marcus policy, information policy, world ledger, rate helpers, face policy, language realization, seeding, or conversation runtime. Hooks sit around the existing runtime calls in the transports and presentation code.

## 5. Shared schema and source authority

Schema identifier: `marcus-playtest-log@0.1`. The assembled JSON will contain `schemaVersion`, `header`, `records`, `turns`, and `endSummary`. Source and schema versions are explicit so later tooling can distinguish observations from game events.

Every appended record contains:

| Field | Meaning |
| --- | --- |
| `type` | Record category listed below |
| `t` | ISO wall-clock timestamp with milliseconds assigned when appended by the canonical recorder |
| `ms` | Non-negative elapsed milliseconds from the run's recorder start, clamped monotonically if the system clock moves backward |
| `seq` | Increasing run-local integer assigned by the recorder, never accepted from a client as authoritative ordering |
| `source` | `ui` or `engine` |
| `runId` | Server/local-runtime run identity |
| `data` | Type-specific bounded structured payload |

UI records also carry a stable `clientEventId`, a local `clientSeq`, and `observedT`/`observedMs` captured when the action occurred. Server `seq` describes durable ingestion order; these additional fields preserve actual browser order and click timing when batches arrive after an engine transition. The Markdown renderer will distinguish an action's observed time from receipt time when they differ. It will not pretend batching gives a perfectly synchronized global clock.

| Record category | Source | Contents |
| --- | --- | --- |
| `RUN_STARTED` | engine | Header, initial state observation, opening face and private run facts |
| `RUN_METADATA` | ui | User agent, viewport, client mode and presentation metadata; authoritative build info remains server/bundle supplied |
| `UI_ACTION` | ui | Target ID/semantic identity, label, availability, selected/resulting value, action kind and correlation IDs |
| `UI_PANEL` | ui | Panel/dialog identity, title, open/closed state and whether the change was user- or program-initiated |
| `UI_DRAFT` | ui | Committed units/cash/days edits, calculated principal, information selection, exact read-only extra text, comparison and summary |
| `PREVIEW_REQUESTED` / `PREVIEW_SHOWN` | ui | Draft/request correlation, delivery, safe draft terms, exact visible preview or displayed validation error; no engine transition implied |
| `TURN_SENT` | ui | Submitted command/request correlation and chosen context; not an authoritative outcome |
| `TURN_COMMITTED` | engine | Full authoritative transition record described below |
| `FACE_PRESENTED` | ui | Actually displayed hearing/responding phase, turn correlation, preset/slots/caption and replay/skip/manual-pacing context |
| `SCREEN_OBSERVED` | ui | Structured allowlist of displayed text, controls and open panels after render/phase changes |
| `UI_ERROR` | ui | Exact error text actually displayed by the application; excludes logging failures |
| `PAGE_HIDDEN` / `PAGE_RESUMED` | ui | Best-effort page lifecycle observations; cannot claim a game-ending action |
| `RUN_ENDED` | engine | Terminal status or replacement, authoritative final terms/resources and relational result |

A download is an ordinary `UI_ACTION`. Retries deduplicate `clientEventId`/batch identities without consuming the game's request replay set. A client cannot submit an `engine` record, forge private facts or decide an end status.

### Header

`runId`, seed, scenario, start/end times, end status, build mode (`dev-server` or `standalone`), package name/version, full/short Git SHA when available, user agent and viewport. Git metadata is read once at server startup or build time; unavailable Git is reported as unavailable, never guessed. A build made before the final commit records the real SHA used during that build, with any dirty-worktree qualification available at capture time. It does not falsely claim to contain a commit not yet created.

The clearly separated private block contains actual GOOD/BAD R-17 version, Marcus's interest and quirk from authoritative state, not values supplied by the UI. A secondary conversation without R-17 uses null/not-applicable fields instead of invented Marcus facts. Browser metadata may arrive after creation; an early interruption leaves missing metadata explicitly null.

### Authoritative turn

The server takes immutable observations of the existing before/after states and newly committed event. It records turn index, request correlation, action/topic, keyword/context action, vibe/intensity, information choice, original submitted terms, normalized `event.intent` terms, exact player/NPC lines, outcome, proposal/current offer/agreement terms, resolved R-17 rate, actual extra, standard charge and signed difference, information causes/effect, reaction family, before/after metrics, feedback/reasons, and both complete face specifications with captions.

The rate/extra is obtained from the committed proposal, offer, agreement or event diagnostics as applicable. It is not guessed from rounded dollars. Turns without new financial terms use null financial values rather than carrying an unrelated fee as a new charge.

The turn includes a structured post-transition screen model drawn from the existing projection. A later `SCREEN_OBSERVED` record supplies the browser's exact displayed text and visibility, correlated to that turn. Assembly may attach that observation to the turn with explicit `authority: ui-observation`; it never rewrites the authoritative event or disguises DOM text as engine truth.

### End summary

Final agreement or null, cash retained, stock, principal, extra, new repayment, total owed, standard charge/difference, the exact savings/cost text actually displayed, relational consequence lines and end status. Public end calculations are recorded through the same observation/formatting path in both modes; browser end text is retained separately if it differs.

## 6. UI coverage and visible-state capture

I will combine delegated interaction observation with explicit semantic hooks. Delegation covers dynamically created controls; explicit hooks identify contextual actions and the actual resulting delivery/draft values. This avoids brittle dependence on a button's screen position or label alone.

- Menus, history, offer builder, all-vibes view, Debug, revisit, face descriptions, accepted terms, last-proposal comparisons, opening/evidence details, restart details and reaction-review dialogs: observe actual open/close state, including Escape/native dialog dismissal and programmatic changes. Suppress duplicate notifications of an unchanged state.
- Subject and move buttons: record semantic IDs, label, availability and selected result. Disabled choices cannot normally emit a click, so snapshots also retain availability for displayed choices; the recorder will not invent attempted disabled clicks.
- Delivery: record vibe/intensity picks, chart location, order of displayed shortcuts and resulting selection. Preference/reset controls are recorded too.
- Builder: record committed `change`/blur values, deduplicating the same committed edit, plus information dropdown changes and Use these terms. Capture the resulting calculated principal, read-only extra, comparison and summary. No per-keystroke logs.
- Sending and pacing: record preview request/result, Say it, exact confirmation, skip, hold-hearing toggle, replay, compare reactions and preparing/performing walk-away. The existing receiving/responding callbacks capture the real presentation moments without changing their delay or behavior.
- Run controls: record restart, scenario selection, committed seed edits, reload and Play/Debug switches. A new seed starts a new run only when encounter creation actually succeeds.
- Errors: record application-rendered notice/preview messages. Logging errors stay in the console and are never routed into the existing notice UI.

Visible state includes Your edge lifecycle/disclosure/observed interest/notes, extra-rate text, draft and offer tables/comparison, preview/player/NPC lines, face description, status line, notices, receipt/consequence text, active view, panel visibility, controls and selected delivery. Only allowlisted nodes and fields are captured; no whole-document HTML dump, private Debug state dump, tokens or cookie capture.

## 7. Privacy finding and planned resolution

The current `renderDebug()` serializes the full `snapshot.debug`, whose `state` and R-17 diagnostics already contain hidden version, interest, quirk and world assertions. The existing markup even says hidden state is intentionally visible. Merely avoiding a new spoiler label would not satisfy the supplied “never appears in the rendered DOM” requirement.

I will replace that Debug DOM dump with an allowlisted diagnostic view of player-observed state, current public terms, visible turn/face data and relevant public definitions. Its explanatory text will say private run facts are available in downloaded logs. This is a targeted presentation restriction, not a change to the engine's canonical projection or fixtures.

The new logger's private header is never inserted into Play, Debug, aria attributes, hidden DOM, notices or previews. Server-side facts go directly to the disk recorder. The dedicated authenticated download route is the only added browser path that returns the private assembled log, solely for exporting it as a file. Offline private data necessarily exists in the local recorder's memory, as required by the offline design; it is likewise never rendered.

This does not erase information the player legitimately sees from their own card or learns in Marcus's replies. “Never on screen” means no new private spoiler section or unobserved interest/quirk debug disclosure, not hiding existing authored gameplay evidence. I will test initial unknown-interest states and Debug explicitly, rather than trying to ban every occurrence of words such as GOOD/BAD or cares after legitimate disclosure.

The ordinary engine/projection contracts remain unchanged, preserving fixture bytes. The server already returns an explicit diagnostic payload; this pass does not redesign that transport into a production secrecy boundary. Raw developer-tools inspection of existing diagnostics and the standalone's local runtime is outside the promised rendered-UI boundary.

## 8. Dev-server persistence and transport

The real CLI enables automatic logging. `createEncounterServer()` used by existing tests will default to no disk logging; logging tests explicitly enable it with a temporary directory. Tests never create repository-root `playtest-logs/`.

Planned routes:

- `POST /api/playtest-log`: session-bound, same-origin, CSRF-protected ingestion of UI-only metadata/records for a server-known run. No client-selected output path or filename. End status and engine/private fields are rejected.
- `GET /api/playtest-log.json` and `GET /api/playtest-log.md`: session-bound, same-origin current-run export as attachments. No general log-folder listing or cross-session reads.
- Exact static module routes for the new browser adapter and shared pure modules; no general source-directory access.

Batch every approximately two seconds, and flush at turn send, restart, run end and `pagehide`. Use the existing CSRF header with a small `fetch` keepalive request rather than `sendBeacon`, whose inability to set that header makes it unsuitable here. The offline builder substitutes this transport with an in-process adapter; emitted standalone code retains no network-capable calls.

Planned limits: client records at most 8 KiB each; normal batch at most 32 KiB and 32 records; logging endpoint hard body limit 48 KiB; authoritative turn record bound 128 KiB; event stream bound 16 MiB per run; assembled JSON and Markdown individually bounded at 32 MiB. Existing gameplay endpoint limits remain unchanged. Quota/serialization failures stop or reject logging only, remain console-only in the client, and cannot block a turn. Truncation or loss is identified in export diagnostics rather than silently presented as a complete log. Tests will exercise the selected limits.

The store resolves one configured root, generates names internally, verifies containment, uses exclusive creation for new streams and avoids following output symlinks. Seed characters are sanitized and length-limited; the run ID distinguishes collisions. Client traversal strings never become filesystem paths.

Per-run writes are serialized. JSONL appends preserve authoritative sequencing. JSON/Markdown are rewritten atomically through temporary siblings at run start, after accepted batches, each turn and end. Existing JSONL records are never rewritten. Recovery can discard a torn final line and reassemble all complete records; it marks recovered partial status explicitly.

Authoritative state assignment retains its current synchronous validation/commit boundary. Recording observes clones only after commit. Persistence runs through a caught queue; an unwritable folder or failed append does not convert an already successful turn into an API error or delay reaction pacing while waiting for disk.

## 9. Lifecycle and interruption behavior

| Situation | Recorded result |
| --- | --- |
| First encounter creation | New log with initial header/private facts and default `incomplete` end status |
| Successful restart/scenario/seed replacement of an open run | Old run `REPLACED`; new run with a different run ID and log set |
| Agreement | `AGREED` plus exact final terms/resources/receipt |
| Walk-away | `WITHDRAWN` plus final resources and consequences |
| Marcus ends conversation | `ENDED` plus final result |
| Replacing an already terminal run | Preserve its terminal status; create the new log |
| Page hides/closes mid-run | Best-effort pending UI flush; persisted partial log remains `incomplete` |
| Reload resumes same live server session | Continue the same run, record resume metadata, avoid duplicate turns |
| Process/browser crashes | Recover complete persisted records; pending or unacknowledged UI observations may be absent |

Late batches are bound to their original server-known run, not silently attached to a newer run. Recorders retain a bounded set of recent run identities for a session; expiration does not fabricate an ending. Closed runs may still receive observational panel/download records without changing their game-ending status.

Append-only persistence substantially reduces the need for screen recordings, but no browser/network logger can guarantee delivery of an event still in flight at an abrupt crash. The guarantee is preservation of successfully written records and an honest incomplete status. There is no claim of zero loss before acknowledgment or a power-loss-proof database.

## 10. Standalone recorder and download behavior

The standalone local API will call the same observer at state creation, transition, replacement and closure. The same schema and Markdown renderer assemble its log. No Node filesystem code is bundled into the browser; only the pure recorder, renderer and observation adapter are embedded.

The Download run log button opens a minimal format choice with **JSON** and **Markdown** download actions. Each can be saved through an explicit click; this avoids relying on browsers allowing two automatic downloads from one gesture. End-screen access uses the same recorder, not a second copy. Logs include their private spoiler section in the downloaded files.

Offline active-run persistence in a namespaced `localStorage` key is planned, with every access wrapped in try/catch and capped to avoid filling storage. On reload, a saved partial record remains exportable; it is not fed back into the game or used to restore gameplay. If storage is unavailable/full, memory logging and download still work and gameplay continues. No saved log data influences delivery preferences or seeding.

Equivalent-run parity tests will inject the same IDs, clock and metadata to compare JSON and Markdown exactly. Real dev/offline logs correctly differ in their mode, real run IDs and wall-clock times; normalizing those declared metadata differences is not normalizing engine outcomes.

I will verify the actual bundled recorder/export code with networking forbidden and check the download controls in a browser where supported. The prior pass encountered a browser restriction on direct `file://` navigation. If that restriction remains, I will report it and distinguish embedded-code/export tests from a direct standalone browser check; I will not claim a blocked check passed or bypass the browser restriction.

## 11. Deliverables and exact locations

Automatic dev-server files live in:

`playtest-logs/`

Basename format:

`<YYYY-MM-DD_HH-MM-SS><UTC-offset>_<sanitized-seed>_<runId>`

The timestamp uses local time with its numeric UTC offset, for example `2026-10-01_18-05-12-0400`. The header retains both local time with offset and UTC time. Each basename has `.events.jsonl`, `.json`, and `.md` siblings. JSONL is the live append-only source; JSON/Markdown are assembled views. Real run files remain ignored and are never staged wholesale.

Downloads go to the browser/user-selected download destination, using the same basename for JSON and Markdown. The application cannot promise a particular OS download folder.

Implementation evidence lives at:

`docs/marcus-information-exchange-v01/validation/playtest-log-pass/`

That folder will contain copies of the three-file log set from one real short agreement run and one real walk-away run, gate logs, screenshots/observations where available, protected-artifact and Temp receipts, and `VALIDATION_INVENTORY.json`. Sample copies include developer spoiler facts by design; they are explicit validation artifacts rather than accidentally staged raw logs.

Documentation lives under the existing `docs/marcus-information-exchange-v01/` folder: this preflight, `PLAYTEST_LOG_SCHEMA.md`, appended `IMPLEMENTATION_REPORT.md` and `PLAYTEST.md` sections.

Offline deliverables remain at:

`dist/marcus-information-exchange-v01/Marcus_Encounter.html`

and the adjacent `BUILD_INVENTORY.json`. They remain ignored local build output.

The final handoff will provide starting/ending commit SHAs, fresh baseline/final test counts, exact file/test changes and reasons, schema/storage details, privacy behavior, a real Markdown excerpt, artifact links, unchanged-fixture receipts and any remaining validation limitations.

## 12. Tests and validation plan

Before source changes, run the fresh complete baseline and stop on failure. Then run `npm ci --no-audit --no-fund` with the lockfile unchanged, implement, and validate:

1. Shared recorder: scripted header/private/UI/turn/face/screen/end coverage; increasing sequence, non-decreasing elapsed time, clock rollback handling and valid ISO timestamps.
2. Authority: every committed engine field matches the actual event and before/after state; original submitted terms and normalized terms are both retained; client engine/private/status injection rejected.
3. Privacy: initial private interest/version/quirk are correct in exports and absent from recorder DOM output, safe Debug view and added player-facing fields; legitimate revealed gameplay text remains allowed.
4. Lifecycle: successful/failed restart, terminal replacement, reload, duplicate/late batches, interrupted partial streams and recovery.
5. Persistence defenses: missing/forged CSRF, wrong origin/session/run ID, traversal seeds, unknown fields, oversized batch/record/file, symlink containment and unwritable root. Failure cannot alter responses, state or outcomes.
6. UI: actual adapter records dynamic controls, committed edits, known/blind extra text, visible shortcut order, errors, native/programmatic panel closure and hearing/responding presentation, without logging movement/hover/scroll.
7. Offline exports: actual embedded recorder and Blob/filename/JSON/Markdown download behavior, storage exceptions, equal-run shared rendering and no network calls.
8. Observation-only proof: replay all 23 frozen routes/127 snapshots and all 20 goldens with logging on versus off; compare full engine results/projections, excluding only the separate recorder object and injected log metadata. No regenerated expectations.
9. Isolation: tests use temporary directories or disabled logging; repository-root `playtest-logs/` remains unchanged by automated tests.
10. Final gates: `npm test`, `npm run lint`, `npm run typecheck`, `npm run schema:validate`, `npm run build`, `node scripts/check-generated.mjs`, standalone build, standalone parity and `git diff --check`. Run generated freshness after every build as required by `AGENTS.md`.
11. Browser proof at `http://127.0.0.1:4175/`: short Hint → Trade → confirm, and walk-away. Inspect all three files for each run, readable Markdown, actual UI timing/faces/screens, spoiler exclusion in Play/Debug, and current/end-screen downloads. Copy evidence into the validation folder.

Existing tests may need packaging/DOM harness updates for new observation hooks. Those updates must retain all behavioral assertions. No existing gameplay expectation, fixture, golden or migration expectation is to be changed merely to accommodate a logger. The final report will give actual test counts; no speculative passing count is promised here.

## 13. Protected artifact receipts

These SHA-256 hashes were read from current bytes during preflight. The same files must match after implementation and validation. Capture scripts that regenerate fixtures/goldens/migrations will not be run in this pass.

| Protected file | SHA-256 |
| --- | --- |
| `tests/fixtures/marcus-world-model-baseline-v01.json` | `add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46` |
| `tests/fixtures/marcus-r17-exchange-v01.json` | `6741d86c72de15911d425263e6ffa9ed57582241f01e77bcb738d3179bfa6f39` |
| `docs/marcus-information-exchange-v01/GOLDEN_RUNS.json` | `b4cc594b732bc89e238b44cb82c62e47345afe9d5edbeaf4d996f9a1c3f79823` |
| `docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.md` | `795e04f27f4b4bfbfc6243a0cacbfb18d5846642d4351cf84ebf1cde4fe57a35` |
| `docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.json` | `f926a3dff367e854521268f07dc76a0c9245e5c61f76c7c77e4d4ba18bd3edb6` |
| `docs/marcus-information-exchange-v01/EXTRA_CHARGE_MIGRATION.md` | `e5daca19e63ce61ab6f4f9751e95d781391562bcac521babed6342741bf08215` |
| `docs/marcus-information-exchange-v01/EXTRA_CHARGE_MIGRATION.json` | `b8856fb778586976360fc678cacbbe728ca7138034ba25a8ebea951c4d3eb0bb` |

## 14. Commit and scope boundary

After successful implementation/validation, create exactly one local commit on the current branch titled **`Add playtest run log`**. Stage explicit implementation/test/documentation/evidence paths; exclude `Temp/`, both pre-existing generated-file changes, the real `playtest-logs/` folder and ignored standalone output. Do not push.

Rates, exact-extra normalization, standard-16 scoring, Section 35, counter formulas, Hint/Show/Trade eligibility, interest seeding, Your edge semantics, world ledger, language, face selection and deferred systems remain unchanged. There is no external telemetry, cloud upload, video recorder, screenshot-per-click system, gameplay restoration from logs, external-corpus work or new package dependency.

The notable interpretation choices in this preflight are: safe Debug presentation to honor the no-spoilers DOM rule; original UI timing alongside canonical append ordering; CSRF-header keepalive instead of beacon; explicit JSON/Markdown download choices; and honest incomplete/crash behavior. They are concrete implementation decisions for review, not completed work.

## 15. Approved amendments

The user approved implementation, filtered Debug, keepalive transport, format choices and one local commit without a push. They amended timestamps to local time with UTC offset in basenames/headers while retaining UTC in the header.

After the first baseline found machine-specific paths in this preflight, the user approved rewriting it to portable references and rerunning the complete baseline. Implementation proceeds only if that rerun passes all 435 tests. All new committed material, including sample logs, schema documentation and appended reports, must omit absolute machine paths or use repository-relative references. Log headers and records follow the same rule; local filenames, stack traces, browser location URLs and filesystem error paths will not be recorded verbatim.
