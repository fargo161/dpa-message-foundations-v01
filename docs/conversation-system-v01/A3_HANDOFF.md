# A3 — authored language handoff

Implemented against LAUNCH_CONTRACT v1. No commits, pushes, dependency changes, external calls, corpus acquisition or foundation protocol changes. All edits stay in assigned ownership.

## Player-visible behavior

- Pure draft speech for ASK/DEAL/ACCEPT/WALK, preserving exact accepted/proposed terms and disclosure boundaries.
- All 20 canonical vibes × three canonical intensities have deterministic preview presentation. Context-sensitive threatening/deceptive flavors deliberately use labeled neutral recipes rather than invented claims.
- Marcus has 31 handled reply families, each with two authored compatible phrasings. Three entries are defensive/general/context-removal coverage, not proof of ordinary seeded reachability.
- Same turn seed reproduces preview/commit; turn-index scheduling alternates variants without mutable usage or random state.
- Actual known information is spoken only on explicit full disclosure or confirmed information exchange.

## Files and APIs

`src/encounter/messages.mjs` keeps `playerMessage(intent, options)` and `marcusMessage(state, intent, decision, options = {})` compatible. Default legacy player formatting remains; `AUTHORING_PREVIEW` routes through new frame realization. Default NPC wording remains canonical variant 0.

`src/conversation/language/realizer.mjs` exports:

- `buildPlayerFrame(state, intent)` → frozen-contract shape `{id,actorId,targetId,text,semanticFacts}`. Caller uses pre-turn state.
- `renderPlayerFrame(frame, {vibeId,intensity,mode,variantSeed})` → `{text,readiness,variantId}`.
- `buildNpcFrame(state, intent, decision)` and `renderNpcFrame(frame, options)` for resolved reply family rendering/review.
- `renderAuthoredFixtureLine(text, options)` supports only the three exact Avery fixture lines requested by A0; the same delivery transformer is shared.
- `LANGUAGE_READINESS` explicitly reports preview-only and zero foundation protocols/corpus additions.

Other files: `frames.mjs`, `player-lines.mjs`, `npc-lines.mjs`, `review-manifest.json`, `tests/conversation-language.test.mjs`, and `LANGUAGE_REVIEW.md`.

## Validation completed by A3

- `node --test tests/conversation-language.test.mjs`: 9/9 passed (all delivery coordinates, exact numeric/semantic core, preview purity, knowledge safety, confirmation, malformed frames, all NPC pairs, determinism, portability registration).
- Existing encounter-engine and encounter-information tests: 13/13 passed after correcting confirmation to use the actual known proposition rather than treating category summary as the proposition.
- `npm run lint`: passed at handoff check.
- `npm run typecheck`: passed at handoff check.

Full repository gates are integration-owned; these focused results do not claim final integrated acceptance. A0 was asked to register the new test file in the portable runner.

## Limits and review state

Player prose enrichment is currently presentation-only and modest. Delivery-coordinate coverage is not a claim of 60 distinct natural sentences or fully authored threatening/deceptive semantics. NPC alternative wording is new review material, not owner-approved production language. Acceptance confirmation's exact-information wording is a separately documented semantic repair authorized by A0. No other production promotion is made.

All frames are data, not authority credentials. A0 owns current-run validation, trusted binding, stale rejection and preview/commit consistency. No unresolved shared-interface requests remain as of this handoff.
