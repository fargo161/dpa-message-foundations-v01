# Independent conversation validation

Date: 2026-09-07. Role: A6. Baseline: `1c4cdc9655bb6cf97e4e8dd9241263dfe4debb1e` (194 tests). This report distinguishes executed checks from pending visual approval and unavailable browser evidence.

## Executed HTTP and pure-policy acceptance

Command: `node --test tests/conversation-acceptance.test.mjs tests/conversation-portability.test.mjs tests/conversation-security.test.mjs`.

Result: 8 initial scenario tests passed, 0 failed. Two focused presentation-timer tests were subsequently added and passed with the six-test acceptance file. The registered independent set now contains 10 tests. These are scenario tests with assertions across complete routes, not ten single-click checks.

| Player-facing requirement | Independent evidence |
| --- | --- |
| Browsing and preview cannot spend a turn or disclose information | Repeated public `/api/preview` with the same request ID returns only player line, delivery, readiness and identity; complete before/after state including knowledge and events remains identical. The same request can then commit once. |
| Every committed Marcus turn has two coherent faces | Six lore/quirk combinations complete six turns each. Every event carries receiving/responding snapshots with five unique anatomical slots, matching catalog assets and its own turn reference. Current face equals the latest response. |
| Hearing cannot reveal a future outcome or mirror selected vibe | Pure reception projection is unchanged when future outcome, applied deltas, hidden consequence material and selected vibe change while the communicated action and previous face stay fixed. |
| Offers and information retain exact meaning across delivery choices | All 20 vibes × 3 intensities preview a conditional information offer with $41 upfront, $79 principal, $0 extra and seven days. Exact detail is absent from the proposal; it is present in the acceptance preview without yet becoming NPC knowledge. Actual acceptance transfers it and resources once. |
| Invalid client claims have no authority | Both preview and turn endpoints reject fabricated keyword/action IDs, semantic substitution, one-sided context IDs, injected state/text/facts, fabricated readiness/approval/envelope and Pressure. Rejected requests leave complete state unchanged. |
| Repeated input cannot spend twice | Simultaneous submissions at one version return one success and one conflict; stale previews conflict; event count increases exactly once. |
| New images do not create arbitrary file access | Every catalogued asset is retrievable as WebP. Unknown images, traversal, query variants, source files, `.git` and package metadata remain inaccessible. CSP keeps scripts/styles same-origin and enables only same-origin images. |
| The shell contract is not tied to a stock purchase | Avery fixture uses the same session/restart/preview/turn endpoints and shared keyword/action/face snapshot contract. Explanation, acknowledgment and leaving require no price, stock, debt or obligations. |
| Claims remain claims; repetition creates no evidence | Avery's explanation enters a `REPORTED_CLAIM` card explicitly marked unverified. Repeated questions create no additional claim/evidence; six turns close the fixture. Commerce, Marcus keywords and injected knowledge are rejected without mutation. |

Both private-information variants and all three quirks were exercised through `PRIORITIES → VERIFY_SOURCE → PROBE_USEFULNESS → DEAL → CLARIFY_OFFER → ACCEPT`. Exact seeds appear in `SCENARIO_RESULTS.json`. Each route preserves a current offer during clarification and verifies final cash, debt and acquired units against accepted terms.

## Independent asset review

Viewed `marcus-forward-eyes-contact-sheet.png` at full sheet resolution. All 13 composed states show complete hair, ears and chin; the reviewed centered G13 eyes appear forward and coherent. The broad agreement smile, concerned face and questioning face are visibly distinct. Catalog eye IDs are independently checked against the explicit two-ID whitelist, with BASE allowed.

This establishes asset containment and the requested gaze exclusion. It does not establish that every facial label will be interpreted consistently by players. New compositions still require the owner's aesthetic approval.

## Language coverage and approval boundary

Player wording preserves the complete semantic core. The current authoring-preview delivery layer uses five discourse atoms and punctuation/line-break variation; many BASED coordinates intentionally share wording. It is not deep, uniquely recognizable language realization for every vibe. NPC reply families add paired authored alternatives. Production language approval and corpus promotion remain closed; no test pass grants them.

Avery is a bounded portability fixture with neutral portrait fallback and no social scoring. It proves the common transport/snapshot/UI contract can support non-commercial conversation; it is not proof of a fully configurable personality engine or a second production character.

## Browser and UI evidence

Supported Chrome/browser-client setup succeeded. Navigation to the local preview at `http://127.0.0.1:4175/` failed with `net::ERR_BLOCKED_BY_CLIENT`. This is an environment access block, not evidence of an application rendering failure. No public tunnel, deployment, alternate browser automation path, or network-policy bypass was attempted.

Live browser interaction, responsive screenshots and native focus behavior have **not** been independently certified by this HTTP run.

Independent source inspection of the landed UI confirms:

- The native dialog starts closed; `More things to say` opens the separate keyword/BASED pages, with three delivery shortcuts in the main read zone.
- The editable deal table remains the commercial workspace; non-commercial snapshots hide it and render `BUILD YOUR MESSAGE` with no synthetic resources.
- Preview results are gated by sequence, exact serialized draft, run and version. Sending uses the same preview-bound payload, and busy guards prevent overlapping submits.
- The committed response snapshot stays pending during reception. Reply, offer and public metric changes are applied only by the response callback; debug cannot supply play choices.
- Portrait SVG uses the entire catalog viewBox and `xMidYMid meet`, with a contained full portrait frame and an honestly labeled fixture fallback.
- Input is disabled during presentation, the dialog has explicit close/return controls, and focus is returned to its opener in code. Actual native focus behavior remains a browser-test limitation.

Two independently executed mocked-timer tests exercise the actual `turn-player.js`: reception happens first; repeated skip triggers response/finish once; cancellation cannot replay a pending response; reduced motion preserves both ordered beats. These validate controller sequencing, not browser paint timing.

One cross-owner defect was identified: renderer layering put mouth overlays above eye overlays despite overlapping geometry. A5 corrected the renderer to A4's canonical `mouth → right eye → left eye → right brow → left brow` order; A6 independently re-read the corrected source and verified it. Browser visual verification remains unavailable.

A5 reports a passing DOM-emulation smoke connected to a real ephemeral HTTP server: 20 chart choices and three shortcuts; closed/open/BASED/return menu flow; contained SVG; browsing without turns; exact preview-bound submit; duplicate-send lock; reception holding reply/metrics; skip; Avery restart and ASK. This is attributed implementer evidence, not an independently executed native-browser test. No unresolved implementation defect was identified by A6's completed HTTP, pure-policy, timer-controller, asset-sheet and source reviews.

## Corrections during independent testing

Initial failures concerned test assumptions, not weakened implementation requirements: legacy closed ACCEPT/WALK payloads require delivery fields, and the non-commercial character name explicitly includes `(conversation fixture)`. Test inputs/expected fixture labeling were corrected accordingly. No implementation or old tests were edited by A6.

## Ownership

A6 owns only the three new acceptance/security/portability test files, independent fixture JSON and this report/results pair. The lead registers tests and owns existing tests and shared implementation. The integration lead reports final 237/237 tests plus lint/type/schema/build/freshness and lorebook gates passing; this is explicitly attributed lead evidence, not an A6 rerun.
