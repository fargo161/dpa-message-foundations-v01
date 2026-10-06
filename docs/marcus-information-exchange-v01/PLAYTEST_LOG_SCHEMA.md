# Marcus playtest log schema

Version: `marcus-playtest-log@0.1`. This observational format is implemented by `src/playtest/recorder.mjs` and rendered by `src/playtest/markdown.mjs`. It never restores or resolves gameplay.

## Files and timestamps

Both dev and standalone modes keep the current assembled log in browser storage (`marcus-playtest-current@0.1`, existing 2 MB character limit) and provide JSON/Markdown downloads. Dev no longer automatically writes `playtest-logs/` or an events JSONL file. References below to disk queues, JSONL recovery or server protection describe the retired adapter, not current execution. Example basename: `2026-10-01_18-05-12-0400_example_run`. The folder is ignored. Reviewed sample copies live in `docs/marcus-information-exchange-v01/validation/playtest-log-pass/`.

Local timestamps include the UTC offset; UTC ISO timestamps are retained separately. Offset is calculated at each timestamp, allowing an ending across a daylight-saving transition. Basenames use the start offset. Seeds and run IDs are sanitized and capped to 80 characters each for filenames. Build metadata contains package/version, mode, Git SHA and dirty state, never a checkout path.

## Assembled JSON

| Field | Meaning |
| --- | --- |
| `schemaVersion` | Version above |
| `header` | Run/seed/scenario, local and UTC start/end, numeric offset, status, basename, build/browser/viewport, private facts, diagnostics |
| `records` | Canonical append order of engine and UI observations |
| `turns` | Complete authoritative turn records, with explicitly attributed matching browser screen observations |
| `endSummary` | Final terms/resources/consequences, or null before an ending |

`header.private` contains actual R-17 GOOD/BAD, Marcus's interest and the quirk. These appear in downloaded files and the Markdown SPOILERS block; they are never inserted into the Play or Debug DOM. The raw existing developer API diagnostics remain outside this rendered-UI privacy boundary.

End status begins `incomplete`; engine transitions can set `AGREED`, `WITHDRAWN`, `ENDED`, or `REPLACED`. Restarting a terminal run preserves its result. Browser observations cannot set status or private facts.

## Record envelope and authority

Every JSONL line is one JSON record with `type`, `source` (`engine` or `ui`), `runId`, `t` (UTC ISO), `ms` (elapsed milliseconds, clamped against clock rollback), `seq` (1-based increasing), and `data`. UI records also retain `clientEventId`, `clientSeq`, `observedT` and `observedMs`. Recorder time orders appends; observed time preserves the browser's earlier action despite batching. Client time is observational, not trusted engine authority.

Engine types are `RUN_STARTED`, `TURN_COMMITTED`, and `RUN_ENDED`. UI types are `RUN_METADATA`, `UI_ACTION`, `UI_PANEL`, `UI_DRAFT`, `PREVIEW_REQUESTED`, `PREVIEW_SHOWN`, `TURN_SENT`, `FACE_PRESENTED`, `SCREEN_OBSERVED`, `UI_ERROR`, `PAGE_HIDDEN`, and `PAGE_RESUMED`. Identical retried client event IDs are accepted once. Gameplay request IDs and deduplication remain separate.

`TURN_COMMITTED.data` contains turn/request/action/topic/keyword/context IDs; delivery vibe/intensity; information mode; submitted and normalized terms; exact player and Marcus lines; outcome, proposal, offer and agreement; resolved rate and actual/standard/difference charge; information effects/reaction family; metrics before/after; feedback/reasons; receiving/responding face structures; the unchanged full engine event; and a public projected screen model. All details come from the committed transition. Browser observation cannot replace them.

`FACE_PRESENTED` records real receiving/responding callback times, including replay. `SCREEN_OBSERVED` captures allowlisted text with visibility, visible controls/availability/selection, panels and active view. Long captures are split into numbered parts; text segments have their own part counts. Matching observations in `turns[].screenObservations` have `authority: ui-observation`. Hidden dialogs do not count as visible controls. Screen capture is structured text, not screenshots or video.

`UI_DRAFT` retains committed field values and displayed calculated principal/extra/comparison/summary. Change and blur duplicates are suppressed; keystrokes, hover, pointer movement and scrolling are not recorded. `UI_ERROR` records only application-visible messages. Logger failures stay console-only.

`endSummary` records status/terms, cash retained, stock, new repayment, total owed, standard extra, difference, savings/cost line and relational consequences. Its browser receipt text remains separately available in screen observations.

## Ingestion, persistence and bounds

`POST /api/playtest-log` takes exactly `{runId,batchId,records}` for a session-known run, with same-origin/session/CSRF checks. Accepted records have exactly `{type,clientEventId,clientSeq,observedT,observedMs,data}`. Engine types and reserved top-level data keys (`source`, `private`, `engine`, `endStatus`, `header`, `filename`, `path`) are rejected. Nested UI text retains UI attribution. Current-run JSON/Markdown exports are authenticated attachments; there is no directory listing or client-selected filesystem path.

| Bound | Limit |
| --- | --- |
| UI record | 8 KiB |
| Accepted batch | 32 KiB / 32 records |
| Endpoint request body | 48 KiB |
| Browser queued records | 1 MiB per run |
| Authoritative record | 128 KiB |
| Event stream | 16 MiB per run |
| Each assembled file | 32 MiB |
| Recent run identities | 64 per session/browser observer |
| Offline localStorage snapshot | 2 MiB |

Queue drops and recorder limits are identified by diagnostics; failed writes are console-reported. Abrupt crashes may lose unacknowledged browser observations. A bounded recorder can stop accepting observations without stopping the encounter.

The Node adapter serializes each run's writes, exclusively creates streams, appends and syncs JSONL, and atomically replaces JSON/Markdown through exclusive temporary siblings. It rejects output-root/target symlinks and verifies containment. Complete JSONL records can be recovered with `recoverPlaytestStream`; only a torn final line is discarded with a diagnostic. Recovery does not create a game session.

The standalone uses the same recorder/renderer through an in-process API and has no network entrypoints. Guarded localStorage retains a prior partial log for explicit export, without restoring gameplay. Denied/full storage leaves memory recording and download usable.

## Portable-path rule

Headers, records, assembled exports and reviewed samples omit absolute machine paths. Known local path forms in values and keys become `[local-path omitted]`; filesystem diagnostics export codes rather than raw paths/stacks. Source references in documentation and validation inventories are repository-relative. No cookies, CSRF values, browser history or whole-page HTML are logged. Ignored local files are never staged wholesale.

## Format choice

Download run log opens JSON/Markdown choices during play and on the end screen. Export uses a Blob and a hidden download anchor; file contents never enter the DOM. The browser chooses the save location. The Markdown includes local/UTC metadata, spoilers, append/observed-time timeline, full turn JSON, final summary and diagnostics.
