# Marcus encounter v0.1 contract

This isolated ASK/DEAL encounter is authoritative on the Node server. Existing mechanics/TPL authority registries remain unchanged. A future adapter must issue trusted resolutions for these live obligations before TPL rendering; encounter events are not existing TPL authority.

## State and accounting

State has `schemaVersion`, `runId`, `seed`, `quirk`, `status` (OPEN/AGREED/WITHDRAWN/ENDED), `metrics`, `obligations`, `proposal`, `counteroffer`, `agreement`, `events`, `clues`. Metrics are exactly `cash`, `debt`, `marcusStock`, `playerStock`, `confidence`, `tension`, `patience`. Starting values: 80, 250, 8, 0, 40, 20, 12. Social ranges 0..100 except patience 0..12; cash/debt 0..100000 and stock 0..100. Contra price is 60 per unit. Cash cannot buy the default two units outright. Existing debt is 250; new principal is units*60-upfront; extra is separate. Debt is derived from the obligation components, never independently edited. No profit or repayment simulation.

Proposal terms: `{units, upfront, repayment, extra, days}`. Integer units 1..8, money 0..10000, days 1..30. Repayment must equal units*60-upfront; upfront cannot exceed price or available cash. Total new obligation is repayment+extra. Existing debt remains unchanged. Offers have `{id, version, terms, source}`; ids are bound to run and event index. Acceptance names the exact current offer id/version, rechecks resources, transfers once, and ends the encounter. An accepted player proposal is recorded as a Marcus-approved offer for explicit player confirmation. Every intervening turn invalidates prior offers.

## Input/API

`GET /api/state` creates/reads a cookie-isolated session and returns `{csrf, play, debug, options}`. `POST /api/turn` accepts only `{requestId,runId,version,action,vibeId,intensity,topic?,terms?,offerId?,offerVersion?}` with `X-CSRF-Token`. Version is events.length. Actions ASK (topic), DEAL (terms), ACCEPT (offer identity), WALK. ASK topics: TERMS, DEBT, RISK, PRIORITIES, FINAL_SAY, GUARANTEE, ENTITLEMENT. All input is closed-shape validated; no client state is accepted. `POST /api/restart` accepts only `{requestId,runId,version,seed}` and the same CSRF protection, invalidates old run identities and preserves other sessions. Seeds are bounded strings. Replays and stale versions fail without mutation. API errors `{error}` with non-2xx status. Cookie HttpOnly/SameSite=Strict. No CORS. Restricted static allowlist only.

Options: canonical `vibes`, `intensities`, `topics` ({id,label}), `metricDefinitions` ({key,label,min,max,meaning}), `price`. Play projection contains public metrics, status, seed, runId, version, offers, agreement, obligation breakdown, clues, events (playerText, marcusText, outcome), availableActions ({action,available,reason}). Debug includes full state, latest turn (before/after/deltas, reasons, based contribution, derived scores/thresholds/repetition), personality. Toggle is observational.

## Policy boundary

`marcus-profile.mjs` exports `PERSONALITY`, `selectQuirk(seed)`. `marcus-policy.mjs` exports `evaluateTurn(state, intent)` returning `{outcome, social:{confidence,tension,patience}, reasons:string[], based:object, derived:object, counterTerms?:object, clue?:string}`. Outcome ANSWER/ACCEPT/COUNTER/REJECT/END. Social values are deltas, clamped by engine. Policy reads state but never mutates it. Engine validates any policy offer. Repetition derives from events' intent fields. `messages.mjs` exports `playerMessage(intent, options?)` and `marcusMessage(state,intent,decision)`. All dialogue is authored text; semantics and delivery metadata are retained in events. Quirk names stay in Debug, clues in Play.

Policy must remain context-sensitive, deterministic, and prevent social farming; hard validity is engine-owned. Seven metrics only. Browser owns public/encounter; behavior owns three policy files and tests/encounter-policy.test.mjs; lead owns state/engine/server/API tests and integration. Reviewer owns tests/encounter-adversarial.test.mjs and review report. No nested delegation.
