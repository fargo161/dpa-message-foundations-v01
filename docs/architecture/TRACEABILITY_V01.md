# Phase 1 traceability

This table records what the foundation can prove now and what remains deliberately deferred.

| Requirement | Implementation | Verification |
| --- | --- | --- |
| 10–20 interconnected semantic keywords | `src/keywords.mjs` contains 14 approved definitions and 13 cross-keyword rules; every keyword has at least two rule connections. | `validateKeywordSet()` and `tests/structural.test.mjs` |
| Deal / Pressure / Ask mechanics | `src/mechanics.mjs` contains nine authored actions, three scenarios, directional facts, blockers, traces, and history emissions. | `tests/mechanics.test.mjs`, `node src/cli.mjs demo` |
| 5 cues × 20 ordered Vibes × 3 intensities | `src/based.mjs` generates 180 structural cells with no numeric cue authority. | `validateBased()`, `tests/structural.test.mjs` |
| TPL boundary | Five families, candidate atoms, reviewed constructions, candidate protocols, and face-evidence separation are in `src/tpl.mjs`. | `tests/tpl.test.mjs` |
| Semantic invariance | Protected slots, speech act, unauthorized additions, unavailable knowledge, and author-only reveals are rejected by `validateSemanticInvariance()`. | `tests/tpl.test.mjs` |
| Source safety | `src/sources.mjs` keeps external corpora manifest-only or blocked, verifies HTTPS/allowlisted hosts, receipts, redirect chains, and archive paths. | `tests/provenance.test.mjs` |
| Idempotent imports | `FoundationStore` stages imports, requires a verified checksum, deduplicates exact replays, and keeps synthetic fixtures labeled and resettable. | `tests/store.test.mjs` |
| Author inspection | `inspect`, `report`, and `demo` commands expose counts, blockers, traces, provenance boundaries, and deferments without a player-facing TPL picker. | `tests/cli.test.mjs` |

No external corpus was downloaded or imported in Phase 1. The project-owned demo scenarios and role suggestions are the only runtime fixtures.
