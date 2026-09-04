# DPA Message Foundations

This repository is an isolated foundation for the DPA semantic keyword system, BASED Message Builder matrix, and TPL Intake Library.

The package is intentionally marked `UNLICENSED`; no repository reuse license has been selected. License selection remains a project-owner decision. External research artifacts remain under their source licenses and the repository's `REFERENCE_ONLY` policy.

## Current milestone

Build a deterministic, inspectable core of 10-20 interconnected semantic keywords grounded in human logic, material relationships, obligations, knowledge, social context, and emotional leverage.

The core exposes hard-authored actions under `DEAL`, `PRESSURE`, and `ASK`, then connects them to the 20 ordered BASED Vibes and three Delivery Intensities without allowing surface language to change mechanical meaning.

## Canonical stack

```text
Lore and live state
    -> active relationship/context/material facts
    -> semantic keyword graph
    -> available semantic actions
    -> deterministic state-transition contract
    -> ordered BASED Vibe + Delivery Intensity
    -> one of 180 performance coordinates
    -> compatible TPL realization
    -> semantic-invariance validation
    -> written message + separate expression request
```

## Handoff authority

Read `docs/source-context/CODEX_DPA_KEYWORD_FOUNDATION_AGENT_TEAM_PROMPT_V01.md` first. It defines the current assignment, agent workflow, scope, acceptance gates, and deferments.

The three original specifications in `docs/source-context/originals/` are domain evidence. If an older path or implementation instruction conflicts with the new-repository master prompt, the master prompt controls this pass.

## Phase 1 foundation plus Phase 2 TPL preview

The repository contains a deterministic Node ESM foundation:

- `src/keywords.mjs`: 14 approved, interconnected semantic keywords with explicit boundaries, provenance, and cross-keyword rules.
- `src/mechanics.mjs`: nine authored actions across `DEAL`, `PRESSURE`, and `ASK`, three inspectable demo scenarios, directional preconditions, blockers, traces, pressure contracts, and history emissions.
- `src/based.mjs`: the five ordered BASED cues, 20 ordered Vibes, three delivery intensities, and 180 structural matrix cells.
- `src/tpl.mjs`: five-family TPL boundary, candidate atoms, reviewed constructions, reviewed canonical-neutral preview protocols, deterministic fragment evidence, face-evidence separation, and explicit safety fallback.
- `src/sources.mjs`, `src/ingestion.mjs`, and `src/store.mjs`: HTTPS/license/receipt gates, provenance-preserving normalizers, idempotent imports, synthetic-fixture labeling, and reset behavior.
- `src/inspection.mjs` and `src/cli.mjs`: author-facing inspection, status report, and demo commands. No player-facing TPL selector is exposed.

Run the portable gates:

```text
npm ci
npm test
npm run lint
npm run typecheck
npm run schema:validate
npm run build
node scripts/check-generated.mjs
node src/cli.mjs report
node src/cli.mjs inspect
node src/cli.mjs demo
```

Current verified status: 14 keywords, 13 cross-keyword rules, 9 actions, 3 scenarios, 600 valid unique act-compatible authored action/coordinate configurations from the demo fixtures, 4,320 act-compatible theoretical combinations, 8,640 act-incompatible combinations, 3,720 act-compatible blocked combinations, 60 candidate act/Vibe anchors covering all 180 cells, 180 reviewed authoring-preview template executions, zero approved runtime TPL protocols, 7 real external datasets acquired and indexed, 1 TPL authority manuscript acquired but not indexed, and zero runtime corpus records. The capacity reduction from the earlier 660 figure is the deliberate result of removing an unauthored secret-pressure branch; the remaining pressure action requires an explicit linked authored contract. The capacity number is not a count of independently realized TPL payloads. All imported records remain `EVIDENCE_PRIOR`/default-only and are not mechanics, BASED mappings, TPL protocols, or runtime dialogue. Canonical-neutral is a deterministic validation/preview profile, not final ZANT production language. See `docs/architecture/TPL_RUNTIME_PHASE_2_V01.md`, `docs/architecture/TRACEABILITY_V01.md`, and `docs/architecture/SOURCE_VERIFICATION_V01.md` for the acceptance boundary and deferments.

## Recorded real acquisition status

The 2026-09-02 acquisition pass downloaded the actual permitted artifacts from verified primary or maintainer sources into `.cache/external-data/`, safely extracted the archives, inspected the observed schemas, normalized records, built ignored local indexes under `data/indexes/`, and ran three retrieval probes per indexed dataset. The cache and indexes are Git-ignored; no raw corpus is tracked.

Counts use the same seven columns for every source: raw / accepted / rejected / duplicate / aggregated annotations / normalized / indexed.

| Source | Status | Counts |
| --- | --- | --- |
| ATOMIC 2020 | `ACQUIRED_AND_INDEXED` | 1,331,113 / 1,243,208 / 87,905 / 0 / 0 / 1,243,208 / 1,243,208 |
| Social Chemistry 101 | `ACQUIRED_AND_INDEXED` | 355,922 / 348,769 / 7,153 / 0 / 63,255 / 285,514 / 285,514 |
| Moral Stories | `ACQUIRED_AND_INDEXED` | 12,000 / 12,000 / 0 / 0 / 0 / 12,000 / 12,000 |
| Stanford Politeness - Wikipedia | `ACQUIRED_AND_INDEXED` | 4,353 / 4,353 / 0 / 0 / 0 / 4,353 / 4,353 |
| Stanford Politeness - Stack Exchange | `ACQUIRED_AND_INDEXED` | 6,603 / 6,603 / 0 / 0 / 0 / 6,603 / 6,603 |
| CaSiNo | `ACQUIRED_AND_INDEXED` | 14,297 / 14,297 / 0 / 0 / 0 / 14,297 / 14,297 |
| PersuasionForGood | `ACQUIRED_AND_INDEXED` | 20,932 / 20,932 / 0 / 0 / 0 / 20,932 / 20,932 |
| Luangrath-Peck-Barger manuscript | `ACQUIRED_NOT_INDEXED` | 0 / 0 / 0 / 0 / 0 / 0 / 0 |
| Project role core | `FIXTURE_ONLY` | not applicable |

No source is currently `MANIFEST_ONLY`, `BLOCKED`, or `EXCLUDED`. Excluded sources and materials, including GLUCOSE, EmpatheticDialogues, unlicensed lorebooks, scraped dialogue, and copyrighted franchise material, were not ingested. Dynamic dialogue population remains deferred; the TPL preview does not promote corpus records into runtime dialogue.

To reproduce normalization and index construction from the cached artifacts:

```text
npm run ingest:real
npm test
npm run test:real
npm run schema:validate
npm run lint
npm run typecheck
npm run build
node scripts/check-generated.mjs
```

`npm test` is the clean-clone portable suite. `npm run test:real` requires the separately acquired, Git-ignored cache and is never represented as a CI corpus. `node scripts/check-generated.mjs` must pass after `npm run build`; it fails when a tracked generated artifact is missing, untracked, staged-different, or different in the worktree.

The acquisition table is a recorded manifest and receipt history. The ignored
corpus cache is not part of this checkout; this recovery pass did not download,
ingest, or revalidate external corpus bytes.

## Trapstar keyword lorebook

The repository also builds **THE TRAPSTAR FIELD GUIDE TO HUMAN LOGIC**, a static nonlinear document over the 14 canonical keyword IDs. Its structured source is `src/lorebook/content.mjs`; the relationship graph, backlinks, search index, reading trails, route manifest, and 14 original accessible SVG illustrations are derived from that source and the canonical keyword implementation. External records remain visibly labeled evidence priors, not runtime facts or dialogue. Commentary is separated from canonical definitions.

From a fresh Windows PowerShell window in the repository root:

```powershell
npm ci
npm run lorebook:check
npm run lorebook:dev
```

The development command builds `dist/lorebook` and serves it at `http://127.0.0.1:4173/`. Press `Ctrl+C` to stop it. For a one-shot static build, run `npm run lorebook:build`; direct article routes are physical directory indexes and `404.html` supplies a static-host fallback. See `docs/architecture/TRAPSTAR_LOREBOOK_V01.md` before adding content.

## Phase-2 extension points and current statuses

The exact extension procedure is documented in `docs/architecture/PHASE_2_EXTENSION_POINTS_V01.md`. The current boundary is:

| Surface | Current status |
| --- | --- |
| Keyword definitions and cross-keyword graph | 14 `APPROVED` project definitions; 13 authored rules |
| Mechanics actions | 9 authored actions; facts and transitions remain authored-state driven |
| BASED | 5 cues, 20 ordered Vibes, 180 stable coordinates; runtime mapping preserves the structural matrix |
| TPL | 5 families, 6 candidate atoms, 3 reviewed constructions, 3 reviewed preview protocols, 180 reviewed preview templates, 0 approved protocols; canonical readiness state is `REVIEWED` for the preview and `BLOCKED` for unsupplied ZANT |
| External research records | Evidence priors, default-only, runtime-ineligible |
| Runtime corpus records | 0 |
| Dynamic dialogue population | `AUTHORING_PREVIEW_ONLY`; runtime corpus promotion remains deferred |
| Repository license | `UNLICENSED`; project-owner decision pending |
