# Adversarial Acceptance Record - Phase-2 readiness cleanup

This record covers the combined cleanup working tree based on `a043096`. The
required adversarial attack surface is implemented in `tests/adversarial.test.mjs`.
Agent G completed the independent acceptance pass and did not edit production
code, Git history, remotes, external-data bytes, or the connected legacy repository.

## Current disposition

Command:

```text
node --test tests/adversarial.test.mjs
```

Result: **34 passed, 0 failed, 0 skipped**. Every attack listed below is fixed
at the executable boundary or remains explicitly outside runtime scope.

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
| Generated-artifact freshness | Builder comparison and CI post-build diff gate | FIXED |
| Raw corpus Git exclusion | Git index and ignore checks find no tracked cache/corpus bytes | FIXED |
| Secrets/private paths/large files | Candidate-file scan and tracked-size audit | FIXED |
| Clean-clone portability | Portable runner contains no corpus-dependent test; real corpus is explicit | FIXED |
| Legacy repository mutation | Connected legacy repository is unchanged by this pass | FIXED |

## Exact acceptance evidence

| Command | Result |
| --- | --- |
| `node --test tests/adversarial.test.mjs` | PASS - 34 passed, 0 failed |
| `npm test` | PASS - 80 passed, 0 failed |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run schema:validate` | PASS |
| `npm run build` | PASS |
| `node scripts/check-generated.mjs` | PASS - 3 tracked artifacts match the current builders |
| `npm run ingest:real` | PASS - 7 datasets indexed and 1 authority artifact registered |
| `npm run test:real` | PASS - 2 passed, 0 failed |
| `git diff --check` | PASS |

## Non-runtime boundary and deferments

External records remain attributed evidence priors. They cannot mutate
mechanics, define BASED, approve TPL protocols, or populate runtime dialogue.
All 180 BASED/TPL cells remain `UNMAPPED`, approved runtime TPL protocols
remain zero, runtime corpus records remain zero, and dynamic dialogue
population remains explicitly deferred to Phase 2.

The lower 600 valid-configuration result is intentional: strict contract
grounding removes the prior unauthored secret-pressure branch. The remaining
pressure path is available only when all authored links are present.
