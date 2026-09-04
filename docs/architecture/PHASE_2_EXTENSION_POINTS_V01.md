# Phase 2 extension points and status boundary

This document is the handoff contract for extending the Phase 1 foundation. It describes where an authored change belongs, which validation must accompany it, and which approval boundary must remain closed. Phase 2 currently has a deterministic, reviewed, authoring-preview TPL execution; it does not authorize owner-approved production language or runtime corpus promotion.

## Current status

| Surface | Status | Boundary |
| --- | --- | --- |
| Semantic keywords | 14 `APPROVED` project-authored definitions; 13 cross-keyword rules | A new keyword needs explicit definition, non-meanings, typed arguments, truth/temporal policy, provenance, graph connections, and negative tests. |
| Mechanics actions | 9 authored actions across `DEAL`, `PRESSURE`, and `ASK` | Actions require authored facts, one macro act, deterministic effects, history identity, blockers/defeaters, and capacity coverage. |
| BASED cues and Vibes | 5 cues and 20 ordered two-cue Vibes | Cue order is authoritative; no numeric mixture or semantic 70/30 weighting may be added. |
| BASED matrix | 180 stable coordinates; 60 candidate act/Vibe anchors; 180 reviewed preview executions | Preview execution is derived neutral language with per-intensity gates; it is not production approval. |
| TPL atoms | 6 `CANDIDATE` atoms across 5 families | An atom changes written presentation only and cannot add semantic content or face evidence. |
| TPL constructions | 3 `REVIEWED` constructions | Required slots must remain aligned with the macro act. |
| TPL protocols | 3 `REVIEWED` canonical-neutral preview protocols; 0 approved runtime protocols | Mapped protocols are authoring-preview only and fail closed in production mode. |
| External research records | Acquired records are `EVIDENCE_PRIOR`, `defaultOnly: true`, `runtimeEligible: false` | Corpus evidence cannot mutate mechanics, define BASED, approve a protocol, or become dialogue automatically. |
| Runtime corpus records | 0 | Dynamic dialogue population and corpus promotion remain deferred. |
| Package license | `UNLICENSED` | License selection remains a project-owner decision. |

## Extension procedures

### Add a keyword

Add one complete definition to `src/keywords.mjs` and preserve the 14-keyword bounded graph unless the project owner approves a scope change. Update `schemas/keyword.schema.json` only when the contract itself changes. Add at least one positive, boundary, and counterexample test, then run `validateKeywordSet()`, schema validation, and the complete portable suite. A keyword must not be inferred from imported corpus language.

### Add an action

Add an authored entry to `ACTION_DEFINITIONS` in `src/mechanics.mjs`. The entry must name exactly one macro act, define directional and truth-scoped checks, identify blockers and defeaters, produce an explicit payload, and emit a deterministic history event. Add a compatible action/coordinate capacity test and a blocked-path test. `PRESSURE` actions additionally require a fully linked authored pressure contract: actor, target, leverage assertion, demand/obligation, feared consequence, consequence identity, context, scope, and temporal validity must agree.

The action definition is also the authoritative TPL presentation registry: include its reviewed `tplPresentation.label` on the same entry. TPL derives its presentation labels from `ACTION_DEFINITIONS`; a second synchronized action-label map is not an extension point. The player-facing macro act set remains ASK, DEAL, and PRESSURE.

Every supplied semantic slot must have a reviewed disposition. Context-only metadata is explicitly accounted for, realized macro content is deterministically evidenced, and unsupported semantic-bearing content is rejected before rendering. Adapted requests carry a mechanics-resolution binding and are deeply compared against a mechanics-issued resolution record before TPL realization; a caller-supplied state snapshot, hash, or matching top-level ID is not authority. Direct non-demo pressure authoring uses the explicit `AUTHORED_SEMANTIC_CONTRACT` binding and still requires the complete typed pressure contract. ASK and DEAL bindings must match the canonical action payload values. Pressure fallback uses the same authored-contract gate as mapped rendering and fails closed when that proof is absent.

Generated freshness checks build into an isolated temporary data root and compare artifact content byte-for-byte with tracked output. They do not mutate tracked files or rely on timestamps, so freshness is independent of whether `build` ran earlier in the command sequence.

### Add a semantic slot

Add the slot to the canonical act contract in `src/tpl.mjs`, its uppercase and lowercase representations, `schemas/semantic-request.schema.json`, and the adapter/invariance tests. Define its type, empty-value rejection, actor/target/context relationship, knowledge boundary, and forbidden additions. Update the relevant act construction only after the semantic contract is explicit. A renderer may not use a new slot to invent a proposition.

### Add a TPL atom

Add a project-authored atom to `TPL_ATOMS` with one of the five approved families, a bounded operation, a maximum occurrence count, provenance, and an explicit review status. Add schema and invariance tests. Keep the atom candidate-only until a separate review approves its use; it may never mutate the semantic request, mechanics outcome, actor, target, timing, leverage, condition, knowledge, or face evidence.

### Add or approve a TPL protocol

Add a protocol only with an explicit construction, act list, atom policy, intensity profile, semantic-invariance requirement, provenance, and review record. Approval is a separate human decision. The current three protocols are `REVIEWED` canonical-neutral authoring-preview protocols; they are preview-eligible, not approved for production, and do not populate runtime corpus dialogue. The legacy safe fallback remains an explicit nine-form production safety path. Vibe identity changes reviewed wording, while intensity changes presentation only.

### Populate a matrix cell

The generator must continue to produce all 180 `{ACT}_{VIBE}_{INTENSITY}` cells. A source cell starts `UNMAPPED`, may carry a candidate anchor and per-intensity fact gate, and is derived into a `REVIEWED` authoring-preview execution only through the canonical-neutral runtime transform. That preview must not be represented as `APPROVED`; owner approval remains a separate production decision. Any future production mapping requires explicit authority, act-compatible required slots, protocol review, and tests proving semantic invariance.

### Add research evidence

Acquire only from a registered official or maintainer source. Record the version, license, citation, redistribution treatment, artifact receipt, observed schema, normalization counts, and record-level provenance. Store raw and derived corpus data only in the Git-ignored `.cache/external-data/` tree. Keep imported records as evidence priors; no importer may promote them into authored facts, action availability, BASED anchors, TPL protocols, or runtime dialogue.

### Change generated artifacts

Modify the source implementation or manifest that owns the artifact, run `npm run build`, and then run `node scripts/check-generated.mjs`. The freshness check covers `data/source-manifest.json`, `data/generated/foundation-inspection.json`, and `data/generated/based-tpl-foundation.json`; it fails if any expected artifact is missing, untracked, staged-different, or different in the worktree.

## Required gates for a Phase 2 change

Run `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run schema:validate`, `npm run build`, and `node scripts/check-generated.mjs`. Use `npm run test:real` only when the separately acquired local cache is present. Re-run the adversarial suite for any change to semantic boundaries, acquisition, identity, provenance, or generated outputs. Keep CI portable: it does not contain or pretend to contain the ignored external corpora.
