# DPA Message Foundations

This repository is an isolated foundation for the DPA semantic keyword system, BASED Message Builder matrix, and TPL Intake Library.

The package is intentionally marked `UNLICENSED`; no repository reuse license has been selected. License selection remains a project-owner decision. External research artifacts remain under their source licenses and the repository's `REFERENCE_ONLY` policy.

## Current milestone

Build a deterministic, inspectable core of 10–20 interconnected semantic keywords grounded in human logic, material relationships, obligations, knowledge, social context, and emotional leverage.

The core must expose hard-authored actions under `DEAL`, `PRESSURE`, and `ASK`, then connect them to the 20 ordered BASED Vibes and three Delivery Intensities without allowing surface language to change mechanical meaning.

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

## Phase 1 foundation

The repository now contains a deterministic Node ESM foundation with no runtime dependencies:

- `src/keywords.mjs`: 14 approved, interconnected semantic keywords with explicit boundaries, provenance, and cross-keyword rules.
- `src/mechanics.mjs`: nine authored actions across `DEAL`, `PRESSURE`, and `ASK`, three inspectable demo scenarios, directional preconditions, blockers, traces, and history emissions.
- `src/based.mjs`: the five ordered BASED cues, 20 ordered Vibes, three delivery intensities, and 180 structural matrix cells.
- `src/tpl.mjs`: five-family TPL boundary, candidate atoms, reviewed constructions, candidate protocols, semantic-invariance checks, face-evidence separation, and deterministic safe fallback.
- `src/sources.mjs`, `src/ingestion.mjs`, and `src/store.mjs`: HTTPS/license/receipt gates, provenance-preserving normalizers, idempotent imports, synthetic-fixture labeling, and reset behavior.
- `src/inspection.mjs` and `src/cli.mjs`: author-facing inspection, status report, and demo commands. No player-facing TPL selector is exposed.

Run:

```text
npm test
npm run lint
npm run typecheck
npm run build
node src/cli.mjs report
node src/cli.mjs inspect
node src/cli.mjs demo
```

Current verified status: 14 keywords, 13 cross-keyword rules, 9 actions, 3 scenarios, 660 valid unique act-compatible authored action/coordinate configurations from the demo fixtures, 4,320 act-compatible theoretical combinations, 8,640 act-incompatible combinations, 3,660 act-compatible blocked combinations, 60 candidate act/Vibe anchors covering all 180 cells, zero approved runtime TPL protocols, 7 real external datasets acquired and indexed, 1 TPL authority manuscript acquired but not indexed, and zero runtime corpus records. The capacity number is not a count of independently realized TPL payloads. All imported records remain `EVIDENCE_PRIOR`/default-only and are not mechanics, BASED mappings, TPL protocols, or runtime dialogue. See [`docs/architecture/TRACEABILITY_V01.md`](docs/architecture/TRACEABILITY_V01.md) and [`docs/architecture/SOURCE_VERIFICATION_V01.md`](docs/architecture/SOURCE_VERIFICATION_V01.md) for the acceptance boundary and deferments.

## Real acquisition status

The 2026-09-02 acquisition pass downloaded the actual permitted artifacts from verified primary or maintainer sources into `.cache/external-data/`, safely extracted the archives, inspected the observed schemas, normalized records, built ignored local indexes under `data/indexes/`, and ran three retrieval probes per indexed dataset. The cache and indexes are Git-ignored; no raw corpus is tracked.

| Source | Status | Raw / accepted / rejected / duplicate / aggregated annotations / normalized / indexed |
| --- | --- | ---: |
| ATOMIC 2020 | `ACQUIRED_AND_INDEXED` | 1,331,113 / 1,243,208 / 87,905 / 0 / 1,243,208 / 1,243,208 |
| Social Chemistry 101 | `ACQUIRED_AND_INDEXED` | 355,922 / 348,769 / 7,153 / 223 / 63,032 / 285,514 / 285,514 |
| Moral Stories | `ACQUIRED_AND_INDEXED` | 12,000 / 12,000 / 0 / 0 / 12,000 / 12,000 |
| Stanford Politeness — Wikipedia | `ACQUIRED_AND_INDEXED` | 4,353 / 4,353 / 0 / 0 / 4,353 / 4,353 |
| Stanford Politeness — Stack Exchange | `ACQUIRED_AND_INDEXED` | 6,603 / 6,603 / 0 / 0 / 6,603 / 6,603 |
| CaSiNo | `ACQUIRED_AND_INDEXED` | 14,297 / 14,297 / 0 / 0 / 14,297 / 14,297 |
| PersuasionForGood | `ACQUIRED_AND_INDEXED` | 20,932 / 20,932 / 0 / 0 / 20,932 / 20,932 |
| Luangrath–Peck–Barger manuscript | `ACQUIRED_NOT_INDEXED` | 0 / 0 / 0 / 0 / 0 / 0 |
| Project role core | `FIXTURE_ONLY` | not applicable |

No source is currently `MANIFEST_ONLY`, `BLOCKED`, or `EXCLUDED`. Excluded sources and materials, including GLUCOSE, EmpatheticDialogues, unlicensed lorebooks, scraped dialogue, and copyrighted franchise material, were not ingested. Dynamic dialogue population remains deferred.

To reproduce normalization and index construction from the cached artifacts:

```text
npm run ingest:real
npm test
npm run test:real
npm run schema:validate
npm run lint
npm run typecheck
npm run build
```
