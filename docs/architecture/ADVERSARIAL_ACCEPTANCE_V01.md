# Adversarial Acceptance Record — v0.1

This document is the red-team acceptance record for the combined Phase 1 foundation. Agent G owns this file and `tests/adversarial.test.mjs`. The suite is intentionally adversarial: a green test is evidence for one boundary only, not approval of runtime dialogue, BASED mappings, or TPL protocols.

## Current gate condition

The initial red-team run exposed a syntax error while importing `src/tpl.mjs`. Agent E repaired the malformed `canonicalJson()` object-expression join at line 72. The post-repair suite confirmed that the module imports successfully, so this finding is `FIXED`.

Final focused run: `node --test tests/adversarial.test.mjs` — 19 passed, 0 failed. The five initial blockers—portable/real test separation, checksum validation order, Social Chemistry preservation and determinism, ATOMIC self/other classification, and executable schema validation—are now FIXED with executable evidence. The raw-bytes and candidate secret/private-path checks also passed.

## Attack matrix

| Attack | Evidence in `tests/adversarial.test.mjs` | Current disposition |
|---|---|---|
| ASK action paired with a DEAL coordinate | act-compatibility enumeration test | FIXED — post-repair attack passed |
| PRESSURE action paired with an ASK coordinate | act-compatibility enumeration test | FIXED — post-repair attack passed |
| Uppercase `REQUEST` mutation | semantic-invariance test | FIXED — post-repair attack passed |
| Nested `OFFER` quantity mutation | semantic-invariance test | FIXED — post-repair attack passed |
| `RETURN` substitution | semantic-invariance test | FIXED — post-repair attack passed |
| `CONSEQUENCE` substitution | semantic-invariance test | FIXED — post-repair attack passed |
| BELIEF-scoped debt authorizes actual action | truth-scope test | FIXED — post-repair attack passed |
| Future `validFrom` activates early | temporal-boundary test | FIXED — post-repair attack passed |
| Inactive/nonexistent context authorizes action | context test | FIXED — post-repair attack passed |
| Authored blocker is ignored | blocker test | FIXED — post-repair attack passed |
| Simultaneous permission and prohibition | authority contradiction test | FIXED — post-repair attack passed |
| Repeated resolution collides on history IDs | history identity test | FIXED — post-repair attack passed |
| Blocked action reaches renderer | adapter quarantine test | FIXED — post-repair attack passed |
| Clean clone runs `npm test` without corpora | portable-script test | FIXED — portable runner excludes cache-dependent real-corpus tests |
| Acquisition writes to the wrong directory | canonical-cache test | FIXED — both scripts reference `.cache/external-data` |
| Checksum mismatch reaches extraction | validation-order test | FIXED — digest validation precedes extraction |
| Reordered Social Chemistry annotations change output | deterministic aggregation test | FIXED — repeated `rot-id` evidence is preserved deterministically |
| Multiple Social Chemistry annotations are discarded | annotation-marker assertions | FIXED — worker annotations and distinct collisions survive normalization |
| ATOMIC self/other relations collapse | relation-distinction test | FIXED — `x*` and `o*` prior kinds remain distinct |
| Malformed schema payload passes | executable-schema test | FIXED — executable validator rejects malformed payloads |
| Generated report contradicts executable code | independent report comparison | FIXED — post-repair attack passed |
| Vibe selection falsely claims to change wording | fallback behavior and README test | FIXED — post-repair attack passed |
| Raw corpus bytes are tracked | Git index audit | FIXED — no tracked raw/cache paths observed |
| Secrets/private paths enter candidate diff | candidate-file scan | FIXED — post-repair attack passed |

The dispositions above are final for this repair pass. A future failed attack remains `BLOCKING` unless it is fixed, proven false by executable evidence, or explicitly moved behind a non-runtime boundary with the boundary named.

## Required rerun

After any repair lands in the shared worktree, run:

```text
node --test tests/adversarial.test.mjs
```

The final result is 19 passed and 0 failed. No red-team finding was reclassified merely because a test was changed to expect an observed defect.

## Non-runtime boundary

External records remain attributed evidence priors with record-level provenance. They cannot mutate mechanics, define BASED, approve TPL protocols, or populate runtime dialogue. All 180 matrix cells remain unmapped unless separate project authority changes that status. Dynamic dialogue population remains deferred to Phase 2.
