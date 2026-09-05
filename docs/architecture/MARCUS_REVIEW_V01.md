# Marcus encounter v0.1 independent adversarial review

Reviewed the integrated encounter engine, HTTP server, personality policy, authored messages, state projection and browser source against `MARCUS_ENCOUNTER_V01.md`, repository laws and the current Marcus agent-team mission. Acceptance evidence comes from executing real transitions and HTTP requests, independently of implementer test reports.

## Executed evidence

`node --test tests/encounter-adversarial.test.mjs`: **12 tests passed, 0 failed** on the integrated implementation. These are portable Node tests; the HTTP cases start the actual server on an ephemeral loopback port and close it after each case.

- Economic mutation matrix: negative, fractional, non-finite, string, oversized, unavailable, unaffordable, inconsistent-principal and extra-field terms fail without mutation. Maximum confidence does not bypass hard validation. Engine-only capacity fixtures also exercise depleted Marcus stock, player capacity and total debt ceilings.
- Proposals transfer nothing. Exact current-offer acceptance subtracts cash and Marcus stock, adds player stock, preserves the 250 existing debt and adds new principal and extra once. Acceptance rechecks resources. A completed encounter rejects another acceptance.
- Forged offer identities, mismatched versions and offers invalidated by an intervening turn fail. Actual HTTP cross-session acceptance fails even with the target session's valid CSRF, run identity and version.
- HTTP client state injection, invalid cash/principal/stock/extra terms, foreign runs, invalid CSRF, foreign Origin and cross-site metadata fail without gameplay mutation. Two simultaneous same-version turns produce one 200 and one 409; only one event is recorded.
- Replayed submissions and pre-restart runs fail. Restarting one session leaves another session's entire projected state unchanged. Two independently created sessions restarted with the same seed and played identically produce matching offer terms, metrics and final obligations.
- Deterministic pure replay produces identical state including history when seed, run identity and submitted choices/identities are identical.
- Repeated DEBT, RISK, PRIORITIES and FINAL_SAY probes, including Vibe changes, consume patience and cannot indefinitely raise confidence. Cycling distinct topics also cannot evade the three-turn opening benefit budget. Repetition ends the encounter within its finite patience allowance.
- Concrete contextual path: with Recognition, proposing 2 units, 60 upfront, 60 principal, 0 extra and 7 days initially yields COUNTER. First acknowledging RISK with Compassionate/BALANCED makes that same proposal yield ACCEPT. Business confidence benefits favor Boundaried over Compassionate; risk acknowledgment reverses that comparison. OVERT hostile delivery raises tension more than SUBTLE. Submitted terms remain unchanged across tested Vibes and intensities.
- A proposal for 8 units, no upfront cash, 480 principal, 10000 extra and 30 days is refused and transfers nothing. All three quirks are discoverable with a non-punitive first PRIORITIES probe that still costs patience.
- Play exposes exactly four economic metric values; each matches Debug. Proposals, offers, obligations, agreement, clues, status, seed and run identity also match. Play events omit hidden transition diagnostics and the projection omits the quirk field. Browser source renders those same projections and its toggle does not submit a mutation.
- Repository files, source files, Git configuration, architecture documents, encoded traversal and administrative/unknown routes return 404. Incorrect API methods return 405. Responses do not grant CORS access. Session cookies have HttpOnly and SameSite=Strict.

## Findings and limits

No economic, isolation, replay or reactive-policy blocker was reproduced. One minor presentation finding was fixed: the authored ACCEPT message previously exposed a raw offer/run identifier in Play, contrary to the repository's readable-name rule. The integrated message now summarizes accepted terms. An adversarial assertion checks actual acceptance output for readable units/principal and absence of the raw offer identity. No reviewer finding remains open.

This review's direct HTTP verification is loopback-only. Browser interaction and public-tunnel verification, full repository checks, generated-output freshness, and final Git status are separate lead-owned delivery gates. This report does not claim those gates passed merely because the adversarial suite passed. The prototype intentionally reveals hidden state in Debug and keeps sessions in memory; it does not provide durable saves or repayment/resale simulation.
