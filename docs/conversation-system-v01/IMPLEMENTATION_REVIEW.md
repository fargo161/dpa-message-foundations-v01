# Conversation team implementation review

Implementation branch: `codex/conversation-keywords-two-face-v01`.
Baseline: `1c4cdc9655bb6cf97e4e8dd9241263dfe4debb1e` on `codex/marcus-lore-information-v01`.
Owner authorized implementation on 2026-09-07. This is a local, uncommitted review build; nothing has been pushed or deployed.

## Player experience and actual design

| What the player experiences | What implements it |
| --- | --- |
| Open **More things to say** to browse known subjects or the full BASED chart. Return to a clear main conversation screen. | One closed-by-default dialog with separate keyword and BASED pages. The server projects knowledge-eligible cards and validates their contextual action bindings. |
| Select a subject, then choose **What do you want to do next?** | Familiar action sentences map to existing validated ASK/DEAL/ACCEPT/WALK intents. The prototype does not add Pressure actions or new world facts. |
| Choose a familiar delivery immediately, or explore all 20 ordered vibes and three intensities. | Three recent/most-used shortcuts, honest starter labels, local preferences, and canonical server-provided BASED options. Only committed speaking turns count toward use. |
| Edit a large deal table, see what is currently on offer, and read the exact words before speaking. | Preview uses the same validated action and deterministic player-language frame as commit, without resolving policy or spending a turn. Acceptance remains a separate confirmation of a specific current offer. |
| See Marcus hear the move, then see him respond. | Every committed event carries two immutable five-slot face snapshots. Reception depends on communicated intent and previous expression; response uses resolved public consequences. The UI delays reply/consequence presentation until the response beat and provides a skip control. |
| Read a full forward-looking face. | The original full portrait canvas is preserved, with 27 supplied overlays plus the base. Downward/cross-eyed slots are absent from the runtime catalog. Thirteen authored compositions are available for visual review. |
| Hear varied but consistent dialogue. | Authoring preview includes 62 NPC review lines across 31 handled reply families. Player variation is deliberately modest: an immutable semantic core with discourse/pacing changes and context-neutral fallbacks. TPL does not create facts, change terms, or choose faces. |
| Try a conversation without buying anything. | The same transport and interface support Avery's bounded missed-meeting fixture. Reported explanations stay attributed claims; it has no financial metrics or supplied character art. This proves adapter portability, not a complete second character. |

## Run the local build

The downloadable `CONVERSATION_TEAM_V01.patch` contains the code, supplied face assets, tests and review material. Apply it to a clean checkout at the baseline SHA above, on a new local branch. Run `git apply --check <patch-path>` first, then `git apply <patch-path>` only if that check succeeds. The patch does not create a commit or push a branch.

From the repository root, using Node 22.13 or newer:

```powershell
npm ci
npm run encounter:dev
```

Open `http://127.0.0.1:4175/`. This command starts the explicitly labeled authoring-preview mode. Use **Restart / choose test conversation** to select Marcus or Avery and replay a seed. Ordinary engine calls still default to canonical production wording; the server factory also accepts an explicit `languageMode: "PRODUCTION"` for testing the fallback.

## Team and enforcement

The six specialists owned keyword actions, BASED preferences, language realization, facial performance, UI presentation, and independent validation. The lead owned shared engine/server integration and the scenario adapter. The launch contract fixed file ownership and export shapes; agents requested interface amendments before changing them. Tests check knowledge boundaries, closed request schemas, stale/double submissions, preview isolation, deterministic face continuity, and unchanged deal accounting. No runtime LLM, corpus promotion, extra metric system, dependencies, or new generated character art was introduced.

See `LAUNCH_CONTRACT.md`, each `A*_HANDOFF.md`, and `VALIDATION_REPORT.md` for detailed responsibilities and evidence. Earlier specialist notes about concurrent incomplete modules are historical; the lead's final gate results govern integrated status.

## Review boundaries

- `LANGUAGE_REVIEW.md` and `src/conversation/language/review-manifest.json` contain the actual language candidates. Production protocol approvals remain **zero**.
- `FACE_REVIEW.md` and `marcus-forward-eyes-contact-sheet.png` expose the actual assembled expressions. New/revised compositions await owner visual review.
- Live cloud-browser navigation to the local server was blocked with `ERR_BLOCKED_BY_CLIENT`. Local HTTP and DOM evidence must not be described as a completed visual browser test. Responsive appearance, animation feel, and native focus interaction still require an owner's browser pass.
- Avery is a deliberately small newly authored test fixture. Rich per-vibe player prose, a complete second NPC personality/art set, world-network expansion, and deployment are outside this implementation.

## Integrated verification

The final portable suite passed **237/237 tests**, with zero failures, skips or cancellations. This includes the original 194 tests and 43 new checks across keyword, delivery, language, faces, scenario acceptance, portability, security and presentation timing. `npm ci`, lint, typecheck, schema validation, build, generated freshness, lorebook check and lorebook build all passed. Generated freshness also passed after the lorebook build; the final diff has no whitespace errors. Independent scenario seeds and routes are in `SCENARIO_RESULTS.json`. UI interaction evidence appears in `A5_HANDOFF.md` and `VALIDATION_REPORT.md`. No external real-corpus test is claimed.

A5's DOM smoke test used an actual ephemeral HTTP server and passed menu navigation, the 20-vibe chart/three shortcuts, unchanged state while browsing, exact preview-to-submit payload matching, duplicate-send locking, withheld reply/metrics during reception, skip-to-response, and Avery restart/questioning without commerce. SVG containment was checked structurally. Native dialog/validity methods were polyfilled for this test, so it does not certify browser rendering or focus behavior.
