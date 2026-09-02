# Phase 1 contract freeze

**Frozen:** 2026-09-02
**Schema:** `dpa-keyword-foundation@0.1`
**Integration owner:** lead agent in this repository

## Discovery checkpoint

The required six read-only agents were spawned before implementation. All six returned Phase 0 reports. Their reports agree that the new repository was a specification shell with no package, executable stack, tests, or build, and that the legacy source was already dirty and must remain read-only.

The connected legacy repository was inspected at the machine-local path recorded in the ignored connection manifest:

```text
handoff/REPOSITORY_CONNECTIONS.local.json
origin: https://github.com/fargo161/one-room-behavior-lab.git
branch: codex/authoring-foundations-v0.1
revision: 601f19304fa1775605dbcf9acb09ac659ad199de
```

No legacy file was edited. The exact legacy duplicate cause is the combination of random IDs/timestamps in `src/authoring-foundations/tpl-library/model.ts:ingestText` and append-only persistence in `app/authoring/tpl-library/page.tsx:importText`; the fake rule is in `page.tsx:addRule` and is asserted by the legacy TPL model test.

## Decisions

| Contract | Decision |
|---|---|
| Runtime | Node ESM with built-in runtime APIs. Development gates use the locked AJV, ESLint, TypeScript, and Node type packages; `npm ci` is required for reproducible verification. |
| Persistence | JSON-compatible deterministic `FoundationStore` with content fingerprints and synchronous uniqueness checks. A file/database adapter is a Phase 2 integration point. |
| Authoring surface | CLI commands `inspect`, `demo`, and `report`. It exposes keywords, graph traces, actions, matrix coverage, source states, and render results without raw TPL/player controls. |
| Stable IDs | Upper-snake semantic IDs for keywords/actions/acts; `{ACT}_{VIBE}_{INTENSITY}` for matrix cells; SHA-256 fingerprints for imports and receipts. |
| Schema | `dpa-keyword-foundation@0.1`; all exported objects carry schema/version or provenance metadata. |
| Source authority | Supplied authored BASED matrix is authoritative for Cue/Vibe names and anchor text. Live official repositories/papers verify source authority and reuse boundaries only. |
| Corpus policy | Human-logic and pragmatic datasets are acquired only after bytes, checksum, exact license text, and attribution are captured; validated raw artifacts remain ignored and all imported records are evidence/prior-only. Small local fixtures test importer behavior and count as fixture-only. |
| Semantic boundary | `src/mechanics.mjs` owns facts/rules/actions/transitions. `src/based.mjs` owns Cues/Vibes/matrix/anchor audit. `src/tpl.mjs` owns written families/protocol boundary/renderer/invariance. No module infers a Vibe from text. |
| Inspection | `src/inspection.mjs` and `src/cli.mjs` own human-readable inspection and coverage reports. |
| Tests | Node built-in test runner; structural, keyword, mechanics, provenance/acquisition safety, store idempotency, anchor import, TPL invariance, CLI smoke, schema, adversarial, and generated-freshness tests. `npm test` is portable; `npm run test:real` is explicitly cache-dependent. |

## Exclusive ownership map

| Agent | Current cleanup responsibility in this repository |
|---|---|
| A | Mechanics and semantic grounding |
| B | Semantic request and TPL invariance |
| C | Stable identities and adapter correctness |
| D | Social Chemistry preservation and normalization |
| E | Acquisition integrity and portability |
| F | Schemas, CI, documentation, and generated-artifact freshness |
| G | Independent adversarial acceptance |

The lead owns shared exports, this freeze, integration, conflict resolution, package scripts, and final verification. All production source edits are being integrated sequentially in the lead workspace after the freeze.

## Integration order

1. Source manifest and safe acquisition boundaries.
2. Keyword definitions and assertion model.
3. Mechanics graph/rule evaluator and three scenario fixtures.
4. BASED matrix and authored-anchor audit.
5. TPL schemas, invariance validator, deterministic safe fallback, and idempotent store.
6. CLI inspection and reports.
7. Tests, lint/typecheck/build, demo, and independent acceptance review.
