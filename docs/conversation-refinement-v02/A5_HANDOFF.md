# A5 — offer-policy consistency

## Approved bounded rule

The lead approved these exact rules before implementation. No approval thresholds, caps, reaction tables, starting resources or transfers changed.

1. A financial concession must satisfy the existing security dominance and fresh-record checks **and** have nondecreasing financial value under the existing proposal-score formula. Financial value includes cash share, principal, capped extra and credit duration; it excludes confidence, tension and information. The proposal score and concession check use the same helper. Lower fees can still qualify when the improved cash/principal terms justify them.
2. A generated counter with identical quantity, cash, principal and deadline cannot reduce the submitted extra. Its fee is floored at the submitted fee. If this makes the whole offer identical, the existing distinct-counter rule rejects it. All other counter formulas remain unchanged.

## Player effect

A one-dollar cash increase combined with removing $24 extra is no longer credited as an unqualified financial concession. A $20 cash increase with a $4 fee reduction can still earn progress. Repeating the same concession remains exhausted.

After the shared PRIORITIES / VERIFY_SOURCE / PROBE_USEFULNESS route in negative seed `conversation-coverage-6`, the two-unit/$60-cash/$60-principal/$12-extra/seven-day proposal still receives approval with SA/OVERT. BA/OVERT now receives rejection instead of buying a $3 fee discount with otherwise identical terms. This is a bounded consistency repair, not a claim that hostile delivery is globally suboptimal or that all counteroffers are optimized.

## Integration

- Changed `src/encounter/marcus-policy.mjs`.
- Added `tests/refinement-policy.test.mjs` (five targeted tests); lead must register in portable runner.
- Counter diagnostic rationale now describes revised terms and requests comparison, without claiming every revision improves security.
- A2 confirmed counter dialogue quotes exact terms. A2 owns bounded rejection language so a social-score rejection need not be narrated as exclusively financial risk.
- No new public data fields or metrics.

## Validation

`node --test tests/refinement-policy.test.mjs tests/encounter-policy.test.mjs`: 13 passed, 0 failed. Includes original counter values, credit ceiling, replay exhaustion, meaningful lower-fee progress and the complete reported hostile-counter route.

`node --test tests/encounter-information.test.mjs`: 9 passed, 0 failed. Preserves matched information benefit, conditional transfer and useful seeded information routes across all six variant/quirk combinations.

The lead owns full repository gates and final integration checks. Native-browser playability is outside this pure-policy evidence.
