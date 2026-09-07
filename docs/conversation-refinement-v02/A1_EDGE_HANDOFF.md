# Information and Your edge handoff

The player now has a persistent account of their owned detail, its disclosure, the source Marcus checked, the relevance he acknowledged, and any brief invitation to propose. It does not depend on the currently browsed keyword. A live conditional offer is remembered explicitly and its clarification takes priority over building a replacement.

## Changes and ownership

- `src/conversation/edge.mjs`: pure `edgeView(state)` with the frozen contract. No lore returns null. Source and relevance use witnessed evidence, not private belief values. Negative preparation reminders describe observed missing steps without predicting cooperation. Ordinary proposal links use existing contextual actions.
- `src/conversation/keyword-bank.mjs`: adds completion status to inquiries without changing intent, eligibility, or ordering. Covered categories count as already disclosed even if they were shared by a probe or proposal. Clarification and non-ASK actions do not claim to be exhausted.
- `tests/refinement-edge.test.mjs`: six targeted cases.

## Semantic boundaries

The deadline derives the invitation the player already received. At a reveal on turn 4, three subsequent turn positions remain; after turn 7 the UI projects ELAPSED even before the backend lazily writes expiry. USED means the first subsequent proposal consumed the opening, not that it earned a bonus or acceptance. An early unprepared full reveal remains NOT_OPENED after later repairs. No metrics, quirk, private need, reaction prediction, or score is projected.

The contextual edge action only navigates to an existing action. It must not submit, override a selected move silently, or imply the proposal will succeed. The current-offer clarification label explicitly says it uses a turn. Exact evidence is expandable UI content; the compact status lines are the primary view.

## Validation

`node --test tests/refinement-edge.test.mjs tests/conversation-keyword-bank.test.mjs`: 15 passed. Covers purity/privacy, positive source/relevance/exchange lifecycle, conditional offer, exact next-turn deadline, consumed-without-bonus wording, early reveal irreversibility, completed yet selectable topics, and ended actions. `npm run typecheck`: passed. Integration lead owns full repository gates and browser/DOM testing.

No mechanics, information-policy, reward, resource, or language authority was changed. No commit or push performed.
