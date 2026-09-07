# A3 delivery clarity handoff

The selected BASED manner now remains readable inside the separate menu, including the current intensity and a short explanation of that intensity. Both menu and main controls update the same selection. Selection alone never records usage; committed-turn recording remains unchanged.

The server helper `describeDelivery({vibeId,intensity,action,topic,renderingStatus})` returns four strings: `label`, `description`, `note`, `applicability`. Descriptions directly use the canonical authored vibe fusion logic and distinguish all 60 selections without claiming 60 unique spoken lines. Notes distinguish authored preview, context-neutral wording, production canonical fallback, and an unverified preview state. Accepting, leaving, offer clarification and the Avery questions have bounded applicability explanations. The helper reads no state, score, quirk, counterfactual or outcome. Canonical vibe definitions and mechanics are unchanged.

Ownership: new `src/conversation/delivery-description.mjs`; updated `public/encounter/delivery-chart.js` and `.css`; new `tests/refinement-delivery.test.mjs`. No added browser imports, routes or dependencies. Chart API unchanged. Lead integrates helper and per-line readiness in previews; UI displays the returned strings.

Verification: 10 targeted tests pass (six existing preference/usage tests plus four new delivery tests). New tests cover all 60 descriptions, input validity, hidden-state access traps, deterministic results, readiness distinctions and action applicability. A separate LinkeDOM interaction check iterated all 60 selections, compared menu/main description synchronization, clicked menu intensity and verified one onChange notification, synchronized pressed state and cleanup of both roots. This is DOM evidence, not native-browser visual validation. Lead owns full repository gates and combined UI checks.

Remaining limitation: descriptions explain selected intent, not Marcus's predicted response. Neutral wording is explicitly labeled; richer dialogue remains an authored-preview task. Both menu and main controls must participate in UI playback locking.
