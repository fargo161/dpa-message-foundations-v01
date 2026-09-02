# Phase 1 traceability

This table records what the foundation can prove now and what remains deliberately deferred.

| Requirement | Implementation | Verification |
| --- | --- | --- |
| 10–20 interconnected semantic keywords | `src/keywords.mjs` contains 14 approved definitions and 13 cross-keyword rules; every keyword has at least two rule connections. | `validateKeywordSet()` and `tests/structural.test.mjs` |
| Deal / Pressure / Ask mechanics | `src/mechanics.mjs` contains nine authored actions, three scenarios, directional facts, blockers, traces, and history emissions. | `tests/mechanics.test.mjs`, `node src/cli.mjs demo` |
| 5 cues × 20 ordered Vibes × 3 intensities | `src/based.mjs` generates 180 structural cells with no numeric cue authority. | `validateBased()`, `tests/structural.test.mjs` |
| TPL boundary | Five families, candidate atoms, reviewed constructions, candidate protocols, and face-evidence separation are in `src/tpl.mjs`. | `tests/tpl.test.mjs` |
| Mechanics-to-TPL adapter | `src/action-tpl-adapter.mjs` maps only successful resolved actions into the uppercase act slots while preserving lowercase protected fields; missing content and blocked actions are structured, quarantined failures. | `tests/tpl.test.mjs` |
| Semantic invariance | Uppercase `REQUEST`, `OFFER`, `RETURN`, `DEMAND`, and `CONSEQUENCE` plus lowercase protected/nested fields are validated for additions, removals, renames, identity drift, timing drift, and deep value changes. | `validateSemanticPayload()`, `validateSemanticInvariance()`, `tests/tpl.test.mjs` |
| TPL fallback boundary | Phase 1 exposes nine deterministic act/intensity fallback forms (3 acts × 3 intensities). Vibe changes coordinate identity and seed only; it does not yet change wording. Dynamic dialogue population and approved protocols remain deferred to Phase 2. | `TPL_FALLBACK_POLICY`, `tests/tpl.test.mjs` |
| Semantic invariance | Protected slots, speech act, unauthorized additions, unavailable knowledge, and author-only reveals are rejected by `validateSemanticInvariance()`. | `tests/tpl.test.mjs` |
| Source safety and reproducible acquisition | `src/sources.mjs` and `scripts/acquire.mjs` verify HTTPS/license/receipt gates, redirects, checksums, archive paths, and the canonical `.cache/external-data` root before real ingestion. | `tests/provenance.test.mjs`, `tests/real-acquisition.test.mjs`, `npm run ingest:real` |
| Idempotent imports | `FoundationStore` stages imports, requires a verified checksum, deduplicates exact replays, and keeps synthetic fixtures labeled and resettable. | `tests/store.test.mjs` |
| Author inspection | `inspect`, `report`, and `demo` commands expose readable action names, authored-fact counts, blockers, provenance, and deferments without a player-facing TPL picker. | `tests/cli.test.mjs`, `tests/inspection.test.mjs` |
| Action-to-render inspection trace | The demo selects an actually available action, adapts only its emitted payload into the act-required semantic slots, selects a BASED coordinate, and resolves the current `UNMAPPED` cell through the safe fallback. Missing action content is rejected rather than invented. | `buildAuthoringPipelineTrace()`, `node src/cli.mjs demo`, `tests/inspection.test.mjs` |
| Executable schema/tooling gates | Project JSON Schemas are checked by the dependency-free validator; ESLint and TypeScript `checkJs` validate source and scripts; CI runs only portable gates. | `npm run schema:validate`, `npm run lint`, `npm run typecheck`, `.github/workflows/ci.yml` |

External corpora remain evidence-only and are not runtime fixtures. The authored demo scenarios provide the facts used by the CLI trace; imported research records remain outside mechanics, BASED approval, TPL protocol approval, and runtime dialogue.

## Independent acceptance boundary

The inspection layer is an authoring/verification surface, not an approval path. It proves that authored facts can produce an available action and that a resolved action can reach a semantic request only when the action adapter can validate its emitted content. It then selects one ordered BASED Vibe and Delivery Intensity and calls the existing matrix resolver. Because every current matrix cell is `UNMAPPED`, the expected result is a deterministic safe fallback with `MATRIX_CELL_UNMAPPED`; this is not evidence of an approved TPL protocol or dynamic dialogue.

The canonical adapter carries an ASK action frame when no authored prose phrase exists—for example, `REQUEST_EXTENSION` supplies the explicit action and object fields. It does not invent dialogue. Blocked resolutions remain quarantined and cannot cross into TPL rendering.
