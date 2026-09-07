# A5 — Game UI and turn presentation handoff

Implemented 2026-09-07 against `LAUNCH_CONTRACT.md` and the approved `/workspace/trapstar-deal-table-menu.html` reference. No agents were spawned by A5. No dependencies, commits, pushes, or publication were added.

## Player experience and implementation

| Player experience | Actual implementation |
| --- | --- |
| A dark Trapstar conversation screen with paper offer sheet, cyan/pink accents, and restrained 1990s bevels | External native HTML/CSS/ES modules. No inline mock state, CDN, or generated gameplay. |
| More things to say opens a separate menu; both menus stay out of the initial screen | One native dialog entry, default closed, with Known keywords and BASED vibes pages. Close, Escape, and return restore focus to the opener. |
| Choose a known subject and an understandable action | Reads only `options.keywords`. Three available suggestions appear immediately; every authored action and its unavailability explanation remains in the menu. A selected later action is promoted into the main three. |
| Three familiar approaches are immediately available | A2 component owns canonical shortcuts, recent/frequent mode, intensity, and browser preferences. Lead-approved optional `chartContainer` places the complete 20-vibe chart in the dialog and shortcuts/intensity in the main screen. |
| The lower half is the editable deal table and the exact current offer | Table preserves all five terms and information attachment. Current offer explicitly distinguishes approved proposal from committed agreement. Acceptance and clarification select server-authored moves for preview before submission. |
| Read the actual words before sending | Every draft is previewed by `/api/preview`; only its matching run/version/exact draft can enable Send. The exact preview request body (including requestId) is then sent to `/api/turn`. |
| Watch the character hear the line and then respond | Receiving shows committed player text and receiving face while preserving the old public snapshot. Responding applies the new public state and reply together. A single stored result drives both beats. |
| Skip the presentation without changing the result | Skip finishes the response beat once. Reduced motion preserves ordered beats with a shorter hold. No animation callback submits any gameplay action. |
| See Marcus's complete face | SVG uses the complete A4 catalog canvas and `xMidYMid meet`. The canonical order is base, mouth, right eye, left eye, right brow, left brow. Only allowlisted catalog assets are rendered. |
| Ask Avery about a broken promise without seeing fake financial fields | Same shell reads the scenario kind; the full commerce workspace is hidden, inputs disabled, public resource rows absent, and a honestly labeled neutral fixture portrait replaces Marcus art. |
| Inspect the conversation or explicitly open diagnostics | Conversation log uses public event text/feedback. Debug reads debug state only after the explicit tab selection and never determines Play choices. |

## Files owned and changed

- `public/encounter/index.html`
- `public/encounter/app.js`
- `public/encounter/style.css`
- `public/encounter/face-renderer.js`
- `public/encounter/turn-player.js`
- This handoff.

Required routes are `/`, `/app.js`, `/style.css`, `/face-renderer.js`, `/turn-player.js`, A2's `/delivery-chart.js`, `/delivery-chart.css`, `/delivery-options.mjs`, and the catalog's exact `/assets/marcus/*.webp` paths. Lead owns routing and CSP. No new external network source is required.

## Safety and lifecycle behavior

Preview sequence identity, request run/version, and serialized current-draft equality all have to match before a response can replace the displayed preview. Editing immediately invalidates Send and previous previews. Rejected previews show their server error and do not submit.

Committed requests are guarded against double submission. Main and menu controls remain locked during network submission and the facial sequence. Usage history is recorded once for the newly returned committed turn, using `event.turnRef.index`; transcript rendering and state reload do not replay it. A pending returned snapshot is not applied until the responding beat.

An uncertain network result reloads authoritative state and does not retry the action. Restart is a versioned, CSRF-protected server request. Old preview sequences are invalidated on snapshot replacement; presentation can be canceled without applying any mechanics. Terminal state clears the old ready preview and leaves Send disabled.

The form explicitly uses `novalidate` and invokes native `reportValidity()` only for a selected DEAL. This lets the player edit terms while discussing something else without those draft numbers blocking ASK, ACCEPT, WALK, or the noncommercial fixture. The server always remains the term/action authority.

## Verification

- `node --check` passed for app, face renderer, and turn player.
- `npm run lint` passed after implementation; root separately reports complete repository gates.
- DOM plus actual ephemeral HTTP smoke passed using the existing scratch LinkeDOM installation and the actual `createEncounterServer()` in the same process. It exercised 20 menu vibes, three shortcuts, closed/open/BASED/return dialog flow, full SVG contain attributes, nonmutating browsing, exact preview-to-submit body identity, double-submit blocking, reception concealment of reply and new metrics, skip completion, and Avery restart plus actual ASK without commerce.
- A6 independently checked source boundaries and pure presentation lifecycle, including skip/double-skip/cancel and reduced-motion ordering. Their overlay-order finding was corrected to A4's canonical order before handoff.
- Root's post-integration report: 237/237 tests, lint, typecheck, and diff checks passed.

The DOM harness polyfilled dialog and constraint-validation methods because LinkeDOM does not implement native browser behavior. It is evidence of module wiring, DOM state, and actual HTTP interaction, not pixel-perfect rendering, native focus behavior, or native form-validation testing. Cloud browser access to localhost was blocked in this environment. No successful rendered-browser visual playtest is claimed.

## Remaining review boundaries

Authored-preview wording is visibly marked as in review; production fallback is labeled separately using the actual server readiness mode. The UI does not approve new language or facial compositions. Marcus expression assets, manifest validity, and forward-eye exclusions are supplied by A4. Avery's fixture deliberately has no second character art. Conversation history is reviewable; this pass does not add a separate facial replay control. Existing in-memory session limitations remain unchanged.
