# A4 interface refinement handoff

## Player changes and design contract

- The opening purpose and suggested objective are visible above the conversation. They use `play.situation`; the UI invents no objective or profit forecast.
- Your edge remains pinned while the conversational subject changes. It presents disclosure, source, relevance and observed opening status, expandable exact evidence/observations, and one server-projected contextual action. No Debug values inform these controls.
- Completed actions carry their server-authored completion label. The three main suggestions prefer unfinished actions but retain the player's selected available action; no action is automatically sent or silently substituted.
- Principal is read-only and recalculated from quantity × price minus upfront cash. The draft explains the arithmetic, cash retained, new repayment and deadline; old debt remains separate. Negative principal gets a cash-field validity message and server validation remains authoritative.
- The actual open offer retains its own terms and explicit acceptance summary. Counteroffers provide expandable comparison with the last spoken proposal rather than hypothetical savings or predicted approval.
- The exact preview carries the server's selected delivery description, applicability and honest rendering note. Changing the draft clears stale preview descriptions.
- Current committed feedback appears beneath the workspace. The actual NPC reply, responding face caption and feedback are announced in a dedicated polite atomic live region at the responding beat.
- A post-turn button and each transcript entry open both saved faces with captions and their associated words. Portraits keep the full existing face catalog canvas and centered eyes. Generic fixture portraits remain explicitly labeled.

## Isolation and timing

Face inspection only reads committed `snapshot.play.events`. It does not use playback, request another preview, POST, increment delivery use, or resolve policy. The modal is available after completed/withdrawn encounters. Busy controls and the inspection guard prevent access during new turn playback. Committed incoming state is still applied only in `onResponding`; prior edge/offer/log state is retained during hearing. Skip/cancel timing is unchanged.

## Files

`public/encounter/app.js`, `index.html`, `style.css`; `tests/refinement-ui.test.mjs`. Existing renderer and player modules remain unchanged. No new project dependencies or browser imports.

## Verification

- Two portable tests pass: hearing/response ordering with exactly-once skip; replacement/cancellation never exposes a stale response. Lead registers this test file in the portable runner.
- Executed LinkeDOM + actual encounter HTTP server smoke, with real API cookies/CSRF and browser modules evaluated in one process. Verified automatic principal; visible goal; edge stays pinned across subjects; delivery description; hearing hides incoming log/edge/reply announcement; actual response announcement; two saved SVG portraits; repeated inspection produces zero POSTs and identical authoritative play state.
- Restarted the same session into Avery: commercial fields hidden; generic context and actual response; two honestly labeled fixture portraits.
- Receipt harness: `/workspace/scratch/9c4673e29181/refinement-ui-smoke.mjs`, run with `node --experimental-vm-modules`. LinkeDOM is isolated scratch tooling, not a repository dependency. A6 can independently rerun it.

This is DOM and HTTP evidence, not native visual, keyboard, screen-reader or human playability testing. Native review remains necessary for modal focus, live announcement behavior, text density and responsive layout. Lead runs complete repository gates after all agents integrate.
