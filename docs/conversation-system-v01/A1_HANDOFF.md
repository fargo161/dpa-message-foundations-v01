# A1 keyword bank and contextual actions handoff

Implementation status: complete within assigned scope, ready for lead integration. No commits, pushes, dependencies, nested agents, or existing encounter-rule edits.

## Player behavior and corresponding design

| Player experience | Implementation |
| --- | --- |
| Browse subjects already known to the player | `keywordBank(state)` projects active player-known authored facts into named cards, with no lore mutation or automatic unlocking. |
| Find three immediate suggestions and the rest in the menu | Available actions sort first, retaining authored relative order; UI can take the first three available actions and expose the complete card list in its menu. |
| Choose different actions for different subjects | Stock, unpaid account, missed appointment, shared shift, document, exact private information, and reported claim each have contextual action mappings. |
| Keep access to risky choices | Unsupported guaranteed-profit claims and entitled trust challenges remain reachable, with explicit descriptions of what is being claimed. No Pressure action was added. |
| See whether private information can be traded | Existing source/relevance eligibility controls the exchange action. Browsing never discloses anything; full disclosure permanently removes private exchange eligibility. |
| Understand an offer before accepting | An actual current offer adds a card for clarification, confirmation, revision and withdrawal. Descriptions distinguish preserving terms from material discussion that closes/replaces an offer. |
| Distinguish a reported claim from a fact | The reconciliation card is `REPORTED_CLAIM`, states what Marcus said, and does not present disputed reconciliation or blame as truth. |

## Files

- `src/conversation/keyword-bank.mjs`
- `src/conversation/context-actions.mjs`
- `tests/conversation-keyword-bank.test.mjs`
- This handoff

No changes to `knowledge.mjs`, `history-content.mjs`, or `information-policy.mjs` were necessary.

## Frozen interface

`keywordBank(state)` returns `[{id,label,kind,summary,actions}]`.

Each action is `{id,label,description,available,reason,intent}`. Intents contain only `action`, optional `topic`, and optional `information`. They intentionally do not contain run/request identities, financial terms, offer IDs/versions, or delivery. The UI supplies the selected draft data; the engine validates it again.

`resolveContextAction(state, keywordId, contextActionId)` regenerates the current bank, rejects absent/unavailable subject-action pairs, and returns a detached intent. Errors are ordinary `Error`; the lead should convert them into the established API validation error form.

Card IDs: `contra-stock`, `old-account`, `missed-check-in`, `shared-shift`, `depot-counterfoil`, `collection-change`, `intake-mismatch`, `reconciled-record`, `conversation`, `current-offer`.

Action IDs are `ask-<lowercase-hyphenated-existing-topic>`, `propose-terms`, `offer-information`, `accept-offer`, `walk-away`. Examples: `ask-ack-missed`, `ask-verify-source`, `ask-probe-usefulness`, `ask-disclose-full`, `ask-clarify-offer`.

Private-variant cards and variant-specific actions only exist when their relevant player facts are actually known. NPC-only context and hidden lore IDs are never cards. `conversation` provides generic existing priorities/counterterms/withdrawal moves for the established encounter, even if a particular economic/history subject is absent. `current-offer` exists only when the server has an actual offer.

## Executed checks

- New focused suite: 9/9 passed.
- New suite plus existing knowledge-unit suite: 23/23 passed.
- ESLint on both new source modules: passed.
- `git diff --check`: passed.
- Attempted existing encounter-information regression alongside these tests: import blocked while the lead's concurrent engine integration referenced not-yet-created `src/conversation/face/policy.mjs`. This was an in-progress integration dependency, not a claim of final regression health. Lead must rerun the complete integrated suite.

Tests cover projection purity/detachment, hidden-context exclusion, missing/inactive/wrong-scope/unknown knowledge, all eligible baseline ASK topics, risky choices, subject-action forgery, positive information preparation and permanent disclosure, negative one-use opportunity preservation, exact-offer distinctions, and ended-state rejection.

## Integration ownership and limitations

- Lead: register the new test in `scripts/test-portable.mjs`; validate paired IDs at preview and commit; compare exact action/topic/information; keep existing term/offer validation authoritative.
- A5: use the projected cards rather than Debug or dialogue parsing; add draft terms for DEAL and actual offer identity for ACCEPT; surface descriptive disclosure/offer warnings.
- Non-commercial fixture: lead scenario adapter owns its authored cards and resolution. `keywordBank` returns an empty array when Marcus lore is absent, avoiding invented universal subjects or importing Marcus facts into another fixture.
- Action availability is subject/knowledge eligibility, not a precomputed financial outcome. Draft amount checks remain server-owned; reading the bank does not evaluate social response.
- This change adds no language production approval, new lore/world content, knowledge persistence mechanism, or new gameplay metric.
