# A4 face implementation handoff

Implemented within assigned paths; no nested agents, commits, pushes, new dependencies or art generation. Shared engine/UI/server changes remain owned by A0/A5.

## Player-facing result

Marcus has a complete portrait and thirteen deliberately composed states: original neutral, seven forward-eye revisions, five additions. Each committed turn contains a hearing snapshot followed by an answering snapshot, with observable captions. Browsing or selecting delivery has no facial prediction. Downward/cross-eyed eyes are excluded through an explicit two-asset centered-eye whitelist. The body of the portrait is fully contained by the catalog geometry; A5 owns final viewport sizing.

## Export contract

- `src/conversation/face/catalog.mjs`: frozen `FACE_CATALOG`; version `marcus-face-catalog@1.0-forward`; canvas 534.1×667.8; base at zero; 27 fixed overlay placements. URLs are `/assets/marcus/base.webp` and `/assets/marcus/<assetId>.webp`.
- `src/conversation/face/policy.mjs`: `openingFace(characterId='marcus')` and `buildFaceTurn(event,previousResponse)` exactly as frozen at launch. The latter returns `{turnRef,receiving,responding}`. Optional `event.characterId` other than `marcus` yields BASE-only fixture snapshots with catalog version `fixture-face@1.0`; UI must show an honest fixture placeholder, not Marcus.
- `src/conversation/face/presets.mjs`: fixed `FACE_PRESETS`, anatomical `FACE_SLOTS`, `FACE_LAYER_ORDER`, `SAFE_EYES`. Presets carry local-review readiness, not production approval.
- `src/conversation/face/transitions.mjs`: pure transitions and validation of prior absolute targets, asset anatomy, catalog version, and exact HOLD/CHANGE operations.
- `src/conversation/face/import-assets.mjs`: pinned-source decoder for reproducible supplied bytes. Does not change source artwork.
- `src/conversation/face/source-provenance.json`: complete source metadata, all inclusion/exclusion decisions and actual checksums. Authoring source codes never enter runtime policy.

Events require `reactionCause.turnRef` with a nonempty runId and positive safe-integer index. Declared previousTurnRef is checked for same-run adjacent continuity. A0 owns full event-log order and replay; face snapshots alone are not commit or TPL authority.

Response context uses only existing public outcome/continuity and applied deltas. Final closure specifically requires ACCEPT/AGREED, status AGREED, and transfersCommitted true; proposed approval is a different face. Reception takes only action/topic/previous snapshot, so changing future results or undelivered facts cannot change that first beat. No mechanics are mutated and no persistent meter is added.

## Evidence and integration requests

- `node --test tests/conversation-faces.test.mjs`: 9/9 passed, including all 169 preset-to-preset transition pairs, SHA-256 comparison for every served image, full geometry bounds, eye exclusions, public/hidden invariance, committed acceptance guard, clarification continuity, malformed inputs, fixture isolation, and deterministic real-event replay.
- `npm run typecheck`: passed during local A4 verification. A0 runs integrated repository gates after all handoffs.
- `docs/conversation-system-v01/marcus-forward-eyes-contact-sheet.png`: rendered and visually inspected at 220px portrait width; technical coherence passed. New compositions still await owner aesthetic/recognition review. See FACE_REVIEW.md for limitations and provenance.
- A0: register `tests/conversation-faces.test.mjs`, attach event faces after outcome/deltas resolve, route only catalog assets with image MIME and same-origin CSP, expose catalog and opening/latest response safely.
- A5: render with contain sizing, layer brows above eyes, reveal reply at responding beat, keep arithmetic and effects server-owned, and never borrow Marcus image for the unknown-character fixture.

No language packs, policies, APIs, scenario adapters, or another agent's modules were edited. Approval of new facial compositions and release remains a distinct owner decision after seeing actual review material.
