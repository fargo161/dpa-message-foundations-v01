# Phase 1 traceability

This table records what the foundation can prove now and what remains deliberately deferred.

| Requirement | Implementation | Verification |
| --- | --- | --- |
| 10–20 interconnected semantic keywords | `src/keywords.mjs` contains 14 approved definitions and 13 cross-keyword rules; every keyword has at least two rule connections. | `validateKeywordSet()` and `tests/structural.test.mjs` |
| Deal / Pressure / Ask mechanics | `src/mechanics.mjs` contains nine authored actions, three scenarios, directional facts, blockers, traces, and history emissions. | `tests/mechanics.test.mjs`, `node src/cli.mjs demo` |
| 5 cues × 20 ordered Vibes × 3 intensities | `src/based.mjs` generates 180 structural cells with no numeric cue authority. | `validateBased()`, `tests/structural.test.mjs` |
| TPL boundary | Five families, presentation-only atoms, reviewed constructions, reviewed canonical-neutral preview protocols, one canonical readiness model, and face-evidence separation are in `src/tpl.mjs`. | `tests/tpl.test.mjs`, `tests/tpl-runtime.test.mjs`, `tests/schema-validation.test.mjs` |
| Mechanics-to-TPL adapter | `src/action-tpl-adapter.mjs` maps only successful resolved actions into the uppercase act slots while preserving lowercase protected fields; missing content and blocked actions are structured, quarantined failures. | `tests/tpl.test.mjs` |
| Semantic invariance | Uppercase `REQUEST`, `OFFER`, `RETURN`, `DEMAND`, and `CONSEQUENCE` plus lowercase protected/nested fields are validated for additions, removals, renames, identity drift, timing drift, and deep value changes. | `validateSemanticPayload()`, `validateSemanticInvariance()`, `tests/tpl.test.mjs` |
| TPL runtime boundary | Phase 2 exposes 180 deterministic canonical-neutral authoring-preview executions (3 acts × 20 ordered Vibes × 3 intensities). Vibe changes reviewed wording and coordinate identity; intensity changes presentation only. Production approval and corpus promotion remain deferred. | `TPL_FALLBACK_POLICY`, `TPL_STYLE_PROFILES`, `tests/tpl-runtime.test.mjs` |
| Semantic invariance evidence | The renderer independently audits every emitted semantic fragment against the authorized action slot and rejects dropped mandatory fragments, residual unauthorized fragments, and presentation atoms mislabeled as semantic. The payload-level validator remains the structural boundary. | `validateRenderedTextSemanticEvidence()`, `validateSemanticInvariance()`, `tests/tpl-runtime.test.mjs` |
| Source safety and reproducible acquisition | `src/sources.mjs` and `scripts/acquire.mjs` verify HTTPS/license/receipt gates, redirects, checksums, archive paths, and the canonical `.cache/external-data` root before real ingestion. | `tests/provenance.test.mjs`, `tests/real-acquisition.test.mjs`, `npm run ingest:real` |
| Idempotent imports | `FoundationStore` stages imports, requires a verified checksum, deduplicates exact replays, and keeps synthetic fixtures labeled and resettable. | `tests/store.test.mjs` |
| Author inspection | `inspect`, `report`, and `demo` commands expose readable action names, authored-fact counts, blockers, provenance, and deferments without a player-facing TPL picker. | `tests/cli.test.mjs`, `tests/inspection.test.mjs` |
| Action-to-render inspection trace | The demo selects an actually available action, adapts only its emitted payload into the act-required semantic slots, selects a BASED coordinate, and resolves a reviewed authoring-preview execution. Missing action content is rejected rather than invented. | `buildAuthoringPipelineTrace()`, `node src/cli.mjs demo`, `tests/inspection.test.mjs` |
| Act-specific semantic schemas | Mechanics schemas describe linked pressure leverage, demand, and consequence payloads; semantic-request schemas require the complete envelope, act-required uppercase/lowercase slots, nonempty values, and strict provenance. Representative `DEAL`, `PRESSURE`, and `ASK` adapter outputs are validated. | `schemas/mechanics.schema.json`, `schemas/semantic-request.schema.json`, `scripts/validate-schemas.mjs`, `tests/schema-validation.test.mjs` |
| Executable schema/tooling gates | Project JSON Schemas are checked by the dependency-free validator against the persisted generated artifact, including cross-field readiness combinations; ESLint and TypeScript `checkJs` validate source and scripts; CI runs only portable gates with `contents: read`. | `npm run schema:validate`, `npm run lint`, `npm run typecheck`, `.github/workflows/ci.yml`, `tests/schema-validation.test.mjs` |
| Generated-artifact freshness | The build writes three tracked reports and a post-build checker fails when any is missing, untracked, staged-different, or different in the worktree. | `scripts/check-generated.mjs`, `tests/generated-freshness.test.mjs`, `.github/workflows/ci.yml` |

External corpora remain evidence-only and are not runtime fixtures. The authored demo scenarios provide the facts used by the CLI trace; imported research records remain outside mechanics, BASED approval, TPL protocol approval, and runtime dialogue.

## Independent acceptance boundary

The inspection layer is an authoring/verification surface, not an approval path. It proves that authored facts can produce an available action and that a resolved action can reach a semantic request only when the action adapter can validate its emitted content. It then selects one ordered BASED Vibe and Delivery Intensity and calls the reviewed canonical-neutral matrix resolver. The result is deterministic preview language with explicit provenance and independently auditable fragment evidence; it is not evidence of an approved production TPL protocol or dynamic dialogue corpus.

The canonical adapter carries an ASK action frame when no authored prose phrase exists—for example, `REQUEST_EXTENSION` supplies the explicit action and object fields. It does not invent dialogue. Blocked resolutions remain quarantined and cannot cross into TPL rendering.

## Current status register

- Acquisition: seven external datasets are `ACQUIRED_AND_INDEXED`; the Luangrath-Peck-Barger manuscript is `ACQUIRED_NOT_INDEXED`; the project role core is `FIXTURE_ONLY`. No source is `MANIFEST_ONLY`, `BLOCKED`, or `EXCLUDED` in the verified local manifest.
- Runtime boundary: imported research records are `EVIDENCE_PRIOR`, `defaultOnly`, and `runtimeEligible: false`; runtime corpus records remain 0.
- TPL boundary: five families, six candidate atoms, three reviewed constructions, three reviewed canonical-neutral preview protocols, 180 reviewed preview templates, and 0 approved runtime protocols. Runtime corpus records remain zero.
- Licensing: the package remains `UNLICENSED`; no repository reuse license has been selected.
- Extension procedures: see `docs/architecture/PHASE_2_EXTENSION_POINTS_V01.md`.
