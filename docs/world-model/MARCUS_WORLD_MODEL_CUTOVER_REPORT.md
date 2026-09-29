# Marcus authority cutover

The world ledger and fixed profiles now supply information projections. Encounter-local state retains social metrics, offers, progress keys and the negative opportunity window. Legacy-shaped lore is a detached Debug/test projection; it is not stored as runtime authority.

## Regression migration

The frozen expected fixture remains byte-for-byte unchanged. Its helper reads `projectMarcusLore(state)` instead of removed `state.lore` and applies the existing REMOVE_NEGATIVE_WINDOW test control to `informationLocal`. The full runtime oracle still compares all 127 snapshots from 23 runs.

Existing read-only assertions now read the same derived compatibility fields. Tests that previously edited removed lore stores use validated alternate event histories. Policy unit tests supply the narrowed NPC context and verify that policy evaluation leaves that context unchanged. The high-debt policy unit case supplies an explicit observed-debt input to the policy; it does not mutate authoritative runtime economics.

The pre-cutover shadow test is preserved in commit `7347d17e956c210bde0563ed7f6c40c08ccecd8f` and as historical validation evidence. Its 27 tests continue as `marcus-world-projection.test.mjs`, using independent world transitions with recorded encounter-local inputs. Information and economic state are derived from events. Full public runtime equality remains covered by the immutable oracle suite. No old runtime or temporary shadow authority remains in production.

Two legacy counterfactual expectations require an explicit boundary correction. Removing an unseen private activity cannot disable a player question about information the player holds. Likewise, a private change in Marcus's need after an explicit offer cannot silently revoke the player's eligibility to accept that offer. Player eligibility remains based on received information; current NPC relevance governs new concessions. These corrections concern synthetic intervention cases, not changes to accepted golden-route behavior.

## Validation status

Initial authority-switched oracle: 24/24 tests passed, including 127 exact snapshots. Lead projection/read-only/policy batch: 77/77 passed. Integration's seven converted files: 65/65 passed.

The combined cutover gate passed **381 tests, zero failures and zero skipped** (89864.0059 ms). Lint, typecheck, schema validation, build and generated freshness passed. The expected oracle hash remains unchanged. Logs are exported under `validation/cutover-*.log`.

Independent review reproduced and verified repairs for stale economic mirrors affecting history, a cancelled NPC need still granting new information value, and a negated issuer assertion incorrectly authenticating source. The policy's auxiliary argument is now restricted to its four required effect fields. The unused withdrawal helper was removed; live WALK commits closure through the engine. Independent evidence is `validation/independent-cutover-audit.md`.

This is the Phase 9 gate. Final C1–C11 certification remains a separate subsequent step.
