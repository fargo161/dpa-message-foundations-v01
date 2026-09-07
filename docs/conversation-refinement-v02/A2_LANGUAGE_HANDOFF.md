# A2 — dialogue truth and bounded voice refinement

Player benefit: information dialogue now acknowledges the detail Marcus already received. Checking a source, asking about usefulness or challenging a record after disclosure cannot suggest restoring secrecy or replaying the reveal. Repeated factual inquiries explicitly report no new progress. These repairs occur in semantic wording before presentation.

## Implemented boundaries

- `knowledge.mjs`: only `informationPlayerText` changed. Late source/probe/category/record questions acknowledge shared information, without repeating the operative detail in a source-only or category frame.
- `information-policy.mjs`: feedback strings and the lead-approved BELIEF_CHALLENGED diagnostic consequence only. No eligibility, bonus, belief, disclosure, opening, resource or progress logic changed.
- NPC families retain 31 identifiers, two alternatives each and unchanged exports. Four existing families add already-shared contextual wording. Seven families have reviewed refinements; selected preview alternatives are shorter and more conversational.
- General rejection wording now acknowledges the current proposal/conversation rather than asserting that financial risk alone caused every rejection. Coordinated with A5's corrected counter behavior.
- Production pair 0 remains canonical except semantic truth repairs (shared information and general rejection). New stylistic wording lives in preview pair 1 only.
- Avery's fixture renderer now reports the same context-neutral fallback status as Marcus for the ten conservative delivery coordinates. No new production approvals or runtime corpus records.
- `review-manifest.json` samples updated; separately listed already-shared samples avoid treating conditional variants as newly created base families.

## Representative review candidates

| Situation | Player-visible wording | Design meaning |
| --- | --- | --- |
| Source check after full disclosure | “Do they establish the source of the detail I already showed you?” | Source verification remains available; disclosure is irreversible. |
| Late record challenge | “The record can still be checked and ordinary terms discussed, but further preparation cannot replay the reveal or create a fresh opening.” | Feedback describes the existing one-shot information policy. |
| Repeat acknowledgement | “You already acknowledged the missed check-in. Repeating the acknowledgment supplies no new progress…” | Keeps deliberate repetition while accurately explaining its lack of fresh benefit. |
| Shared history, preview alternative | “We got the loading done, all right. Still have your account to settle.” | Existing shared history and unpaid debt, with less tutorial-like speech. |
| Checked source, preview alternative | “That header and signature check out. I know where it came from. What it means is another question.” | Source authenticity stays distinct from truth, usefulness and blame. |

## Verification and limits

New tests reproduce both information variants through full disclosure → source → usefulness, then the negative record challenge; preview remains pure and equals committed words. Repeated small talk, acknowledgment, verification, usefulness and record inquiries retain progress state and explain no fresh progress. Generic fallback status is checked.

Targeted run: refinement language + existing conversation language + knowledge unit tests. TypeScript checkJs passed. Lead owns final repository gates and registration of `tests/refinement-language.test.mjs`.

No claim of 60 unique prose realizations or full authored Marcus personality expansion. Existing two-variant deterministic schedule retained to avoid changing preview/commit identity or unreviewed delivery semantics. Native-browser readability and human playability remain separate review evidence.
