# Adversarial Acceptance Record - Phase-2 TPL bounded repair

This record covers the bounded repair of the Phase 2 ASK/DEAL/PRESSURE TPL
preview runtime on branch `codex/phase-2-tpl-runtime-180`. The required
adversarial attack surface is implemented in `tests/adversarial.test.mjs`;
runtime-specific regressions are in `tests/tpl-runtime.test.mjs` and
`tests/schema-validation.test.mjs`. No corpus acquisition, remote mutation,
legacy-repository mutation, network runtime dependency, or player-facing
surface is part of this pass.

The acquisition manifest and historical source-verification records remain in
the repository as evidence. This checkout does not contain the separately
acquired ignored corpus cache, so corpus receipts and real-corpus retrieval
were not revalidated during this recovery pass and no corpus command was run.

## Current disposition

The review was independently reproduced before editing. The reproduced
blocking findings were:

1. PRESSURE authorization was derived from demo scenario bindings, so a valid
   non-demo contract failed with `TPL_PRESSURE_CONTRACT_UNAUTHORIZED`.
2. BALANCED PRESSURE inserted an unbound conditional phrase while reporting
   semantic invariance.
3. Persisted matrix, protocol, and style artifacts accepted contradictory
   review, lifecycle, and production-eligibility flags.
4. Runtime evidence compared cloned payloads rather than the emitted text.
5. The architecture and acceptance records contained stale readiness,
   fallback, and corpus-validation claims.

## Attack matrix

| Attack surface | Executable evidence | Disposition |
| --- | --- | --- |
| Cross-act coordinate pairing | Capacity enumeration rejects ASK/DEAL and PRESSURE/ASK pairings | FIXED |
| Derived capacity accounting | Independent mechanics enumeration reports 4,320 act-compatible theoretical, 8,640 incompatible, 600 valid, 3,720 blocked | FIXED |
| Truth scope, temporal validity, context, blockers, prohibitions | Boundary mutations block actions with deterministic trace codes | FIXED |
| Pressure grounding | Explicit contract binds actor, target, leverage, active demand, fear, consequence, scope, context, time, and provenance | FIXED |
| Unrelated fear, absent demand, secret/debt cross-contamination | Contract and source-fact mutation attacks | FIXED |
| Event and adapter identities | Repeated occurrences, replay, history drift, state snapshots, and provenance mutations | FIXED |
| Full semantic envelope and slot invariance | Top-level, nested, uppercase/lowercase, provenance, knowledge, and forbidden-addition mutations | FIXED |
| Malformed semantic slots and quantities | Empty, renamed, cross-act, and invalid-shape payloads | FIXED |
| Social Chemistry preservation | Conflicting actions, legality/pressure changes, duplicate rows, ID collisions, and reversed input order | FIXED |
| ATOMIC relation distinctions | `x*`, `o*`, event-order, obstacle, and affordance relation checks | FIXED |
| Acquisition integrity | Wrong bytes and sizes fail before import/extraction/receipt writes | FIXED |
| TPL authority integrity | Manuscript digest is checked before receipt or tracked manifest writes | FIXED |
| Cache/path portability | One `.cache/external-data` root and POSIX tracked paths | FIXED |
| Uniform acquisition counts | Every source, including authority-only, has seven count fields | FIXED |
| Schema enforcement | Representative DEAL, PRESSURE, ASK payloads pass; malformed payloads fail | FIXED |
| PRESSURE runtime authorization | Construction rules validate any self-consistent actual/context-bound contract; demo scenarios are inspection fixtures only | FIXED |
| Intensity semantic boundary | ASK, DEAL, and PRESSURE presentation atoms are marked non-semantic; unsupported conditional fragments are rejected by fragment audit | FIXED |
| Persisted readiness combinations | Matrix, protocol, template, and style-profile readiness is cross-field schema-gated; generated artifacts are validated | FIXED |
| Rendered semantic evidence | Mandatory slot fragments must survive and no residual unauthorized fragment may remain in the emitted text | FIXED |
| Generated-artifact freshness | Builder comparison and CI post-build diff gate | FIXED |
| Raw corpus Git exclusion | Git index and ignore checks find no tracked cache/corpus bytes | FIXED |
| Secrets/private paths/large files | Candidate-file scan and tracked-size audit | FIXED |
| Clean-clone portability | Portable runner contains no corpus-dependent test; real corpus is explicit | FIXED |
| Legacy repository mutation | Connected legacy repository is unchanged by this pass | FIXED |

## Exact acceptance evidence

| Command | Result |
| --- | --- |
| `npm ci` | PASS - 78 packages added, 0 vulnerabilities; no corpus acquisition |
| `npm test` | PASS - 121 passed, 0 failed |
| `node --test tests/tpl-runtime.test.mjs` | PASS - 22 passed, 0 failed |
| `node --test tests/adversarial.test.mjs` | PASS - 39 passed, 0 failed |
| `npm run lint` | PASS - ESLint static correctness rules passed |
| `npm run typecheck` | PASS - TypeScript checkJs passed |
| `npm run schema:validate` | PASS - persisted/generated artifacts and 180-coordinate inventories checked |
| `npm run build` | PASS - 180 matrix cells, 60 anchors, 9 source manifests |
| `node scripts/check-generated.mjs` | PASS - 3 tracked artifacts match the current builders |
| `npm run lorebook:check` | PASS - 14 articles, 64 relationships, 3 trails, 22 routes |
| `git diff --check` | PASS - no whitespace errors |
| Corpus acquisition commands | NOT RUN - explicitly outside this repair scope |

## Non-runtime boundary and deferments

External records remain attributed evidence priors. They cannot mutate
mechanics, define BASED, approve TPL protocols, or populate runtime dialogue.
All 180 BASED/TPL coordinates are covered by reviewed canonical-neutral
authoring-preview executions; approved runtime TPL protocols remain zero,
runtime corpus records remain zero, and dynamic dialogue production eligibility
and runtime corpus population remain explicitly deferred pending owner approval
and the supplied ZANT humor profile.

Canonical-neutral is a validation/preview profile, not final ZANT production
language. The readiness model distinguishes preview-ready, reviewed, approved,
production-eligible, and blocked artifacts. The current canonical-neutral
profile is reviewed and preview-eligible but production-ineligible; ZANT is
blocked.

The lower 600 valid-configuration result is intentional: strict contract
grounding removes the prior unauthored secret-pressure branch. The remaining
pressure path is available only when all authored links are present.
