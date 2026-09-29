# Independent Marcus conformance evidence

Independent focused verification **PASS: 10 tests, 0 failures, 172.455 seconds**. All C1–C11 proof groups and atomic settlement assertions passed. The lead's final combined repository gates remain a separate handoff requirement.

Verifier E owns `tests/marcus-world-conformance.test.mjs`; production runtime, existing expected fixtures and shared gate registration are owned separately. This evidence concerns the world-model migration, not standalone packaging or browser verification.

Baseline fixture: `tests/fixtures/marcus-world-model-baseline-v01.json`, SHA-256 `add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46`. Captured baseline source `838b075081d0b97de468d4e84984ce1e57908e76`. Implementation entering independent verification: Phase 9 checkpoint `f66c74a`.

## Executable proof coverage

| Criterion (all PASS) | Independent proof |
|---|---|
| C1 Projection | Replays all 23 frozen routes and compares complete exact validated inputs and all 127 oracle snapshots, including legacy information fields. Fixture hash asserted before use. |
| C2 Outcome | Same complete snapshots include public/options projection, status, seven metrics, obligations, offers/accepted terms, exact player/NPC text, reply family, face operations, and terminal result. No new normalization or expected-byte edits. |
| C3 Headline | For each positive golden route and every turn, all three collection questions are UNKNOWN exactly until Marcus READs the body. Ledger contains no authored negated Marcus BELIEVES ignorance proposition. |
| C4 No plumbing | State has no lore field; informationLocal contains only progressKeys/negativeWindow; mutating a detached compatibility view cannot change the next result; runtime source scan rejects state.lore/next.lore references. |
| C5 No leaks | Replays all 10 negative golden routes (56 transitions, 66 observation positions) under all three hidden count causes: 168 transitions and 198 observation positions. Exact serialized full Play/options, player/NPC information, and compatibility projections must match across causes despite distinct objective events. |
| C6 Four readers | NPC policy context has only profile/quirk/metrics/intent-progress history. Poison objective/player properties cannot affect direct policy evaluation. Auxiliary argument is explicitly restricted. Private need cancellation leaves player perceptions/options unchanged while changing Marcus relevance. |
| C7 Replay | At all 127 golden observation points, reconstructs ledger through validated append groups and copied versioned profiles; serialized ledger, world projection, perceptions, NPC/player information and compatibility views must be byte-identical. |
| C8 Seeds | Every frozen run independently compares informationVariant and selectQuirk against captured expectations. |
| C9 Worlds | All 12 world/profile combinations validate and complete a two-Contra agreement with positive credit principal; matrix below. |
| C10 No player beliefs | Player profile permits identity/version/effectiveness only; player view contains no beliefs/stance/rank/trust/attitudes; NPC belief projection and ATTITUDE_SET reject player holder. Neutral delivery stays 1 for all intensities. |
| C11 Single source | Corrupt economic mirrors cannot affect complete transition output; no authoritative OWNS/OWES duplication in OCCURRENCE.happened or activity holds; resources/obligations derive from TRANSACTION hard effects; claim questions recomputed; clearing events clears objective projections; possession/activity/attitudes derive from events; no BACKSTORY perception channel. Claims/statements may legitimately report or lie about OWNS/OWES without changing truth. |

## Twelve-combination route matrix

All twelve rows independently passed with AGREED, exactly two Contra and positive credit principal. All use existing EA combination routes from the frozen corpus. Positive route: VERIFY_SOURCE → PROBE_USEFULNESS → information DEAL → ACCEPT. Negative route adds QUESTION_RECORD → DISCLOSE_FULL before ordinary DEAL → ACCEPT. Terms: two units, upfront 50, principal 70, extra 4, seven days.

| World | Quirk | Seed | Observed result |
|---|---|---|---|
| Positive | final_say | independent-lore-6 | AGREED, 2 Contra |
| Positive | plain_dealing | independent-lore-4 | AGREED, 2 Contra |
| Positive | recognition | independent-lore-2 | AGREED, 2 Contra |
| Negative / clerical error | final_say | independent-lore-0 | AGREED, 2 Contra |
| Negative / clerical error | plain_dealing | independent-lore-1 | AGREED, 2 Contra |
| Negative / clerical error | recognition | independent-lore-5 | AGREED, 2 Contra |
| Negative / runner shorted | final_say | independent-lore-0 | AGREED, 2 Contra |
| Negative / runner shorted | plain_dealing | independent-lore-1 | AGREED, 2 Contra |
| Negative / runner shorted | recognition | independent-lore-5 | AGREED, 2 Contra |
| Negative / depot miscount | final_say | independent-lore-0 | AGREED, 2 Contra |
| Negative / depot miscount | plain_dealing | independent-lore-1 | AGREED, 2 Contra |
| Negative / depot miscount | recognition | independent-lore-5 | AGREED, 2 Contra |

## Atomic settlement and adversarial evidence

Successful information acceptance must put transaction, body presentation and terminal closure in one non-null commit group referenced by the encounter turn's worldEventIds. A stale ACCEPT leaves input byte-identical. A deliberately empty runId with matching input identity reaches the terminal event's nonempty encounterId validation after transaction/body staging; failure must preserve input, economy and disclosure exactly. A final invalid closure passed directly to appendCommit must also apply none of the otherwise valid batch.

Existing focused suites retain additional P1–P8/P6b, V1 forgery/unrecognized/hypothetical/conflicting issuer, R1–R6 chronology/downgrade, rank-0, nested/player belief, partial-content and superseded-attitude regression proofs. Earlier independent audits recorded defects and verified repairs rather than accepting test counts alone.

## Verification commands and status

`node --test tests/marcus-world-conformance.test.mjs`

Final focused run: **10/10 PASS**, zero failures/cancellations/skips, 172454.5072 ms total. C1/C2 took 56516.5374 ms; C5 took 99681.2557 ms; C7 took 9245.3497 ms. All twelve world/profile matrix rows produced AGREED/two Contra. The suite is read-only against the fixture and does not rewrite expected outputs. The broad C5 proof deliberately tests every negative corpus turn, so it costs more than the narrow regression probes.

Independent C1–C11 assertions and atomic settlement now pass. No unresolved production defect was found by this final focused suite. The lead must still complete combined tests/lint/typecheck/schema/build/generated checks before final migration handoff and required Phase 11 standalone work.

Limitations: the two historical 8–9-turn patience-ending review sequences were not recoverable from authoritative supplied logs and were not invented. Offline standalone HTML packaging and browser/UI smoke verification are required Phase 11 deliverables and gates. A native executable is deferred and outside this migration's scope; no native wrapper is promised here.
