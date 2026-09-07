# A2 — BASED delivery chart and preferences

Implemented against the launch contract with lead-approved optional `chartContainer` extension. Canonical cue/vibe definitions and mechanics are unchanged.

## Player behavior

- All 20 ordered vibes appear in five color-coded cue rows in the separate menu; names and written fusion explanations come from server options. Cue labels and two-cue accessible names supplement color.
- The main delivery section presents three shortcuts, Recent / Most used, and Subtle / Balanced / Overt. EA / BALANCED is the initial selection.
- Cold history explicitly says Starter approaches; unused spaces retain a Starter badge. Selection and previews do not count as use.
- Only successful committed ASK/DEAL notifications count. Most used breaks equal counts by latest use, then canonical option order. Recent shows distinct vibes.
- Preferences persist in this browser when allowed. Blocked/full storage falls back to in-memory use. Reset removes usage and mode preferences but preserves replay cursors, so old events cannot immediately repopulate usage.

## Integration API and ownership

`createDeliveryChart(container, {vibes,intensities,onChange,storage?,chartContainer?})` returns the frozen `setSelection`, `getSelection`, `recordTurn`, `destroy` API. When `chartContainer` is supplied, all 20 buttons go there; the main container retains shortcut and intensity controls. Without it, one container holds the complete component. Neither component opens the menu.

- `setSelection({vibeId,intensity})` is silent and rejects invalid selections.
- `onChange({vibeId,intensity})` fires only for an actual user selection change.
- `recordTurn({runId,index,action,vibeId})` must be called for newly committed server events in order. It is a UI convenience notification, not proof of engine authority. Never call it on preview/rejected HTTP/transcript replay.
- A per-run high-water index rejects duplicate and earlier notifications across reload. This expects chronological delivery, not backfilling old events out of order.
- `destroy()` removes listeners and both mounted roots.

Lead routes `/delivery-chart.js`, `/delivery-chart.css`, and `/delivery-options.mjs` (the latter serves `src/conversation/delivery-options.mjs`). No dependencies, network calls, inline styles, or corpus imports. Pure helper imports no Node APIs and receives allowed vibe IDs from the caller.

Owned files: `src/conversation/delivery-options.mjs`, `public/encounter/delivery-chart.js`, `public/encounter/delivery-chart.css`, `tests/conversation-delivery.test.mjs`, this handoff.

## Verification and limitations

Focused tests cover canonical coverage, cold/partial history, distinct ordering and ties, speaking-only deduplication, serialization/reset, corrupt records and storage failure. `node --test tests/conversation-delivery.test.mjs`: 6 passed, 0 failed. Browser module syntax and ESLint for both owned JS modules pass. The first whole-project typecheck encountered a concurrent integration error in lead-owned `src/encounter/engine.mjs` at line 91 (string assigned to number); no A2 errors were reported. Lead owns full integrated gates, registration in the portable runner and integrated browser acceptance. Browser preferences are convenience data; users may clear or edit their local storage, which never changes game outcomes. Concurrent-tab usage merging is not implemented; the component uses last writer wins.
