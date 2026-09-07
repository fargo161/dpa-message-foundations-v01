# Conversation implementation launch contract v1

Owner approved team execution on 2026-09-07. Baseline reverified clean at 1c4cdc9655bb6cf97e4e8dd9241263dfe4debb1e. Implementation branch: codex/conversation-keywords-two-face-v01. No commit, push, PR, public tunnel, or deployment is authorized by this launch.

The approved preflight contract is `/workspace/scratch/9c4673e29181/CONVERSATION_TEAM_PREFLIGHT_AND_CONTRACT_V01.md`. Latest UI reference is `/workspace/trapstar-deal-table-menu.html`, superseding all earlier UI passes. More things to say is the ONE entry to a separate menu with keyword-bank and BASED pages. Default menu is closed. Restore a large editable deal table. Entire Marcus face is contained in frame. EXCLUDE downward and cross-eyed eyes; initially whitelist only paired centered G13 eyes (left 2eff921f4373, right f1b2a234411e), plus BASE/closed eyes only if reviewed. Existing down-looking LEANING_IN preset must be repaired, not copied unchanged.

## Frozen integration interfaces

All functions are pure unless explicitly browser preference/UI utilities. No component invents action or knowledge authority. All paths not assigned to a specialist remain lead-owned. Agents may implement immediately against these interfaces; request amendments before changing them.

### A1 keyword/action exports

`src/conversation/keyword-bank.mjs`: `keywordBank(state)` -> array of `{id,label,kind,summary,actions}`. Actions are `{id,label,description,available,reason,intent}`; intent is the existing `{action,topic? ,information?}` without IDs/terms/delivery. Cards expose only known, player-safe subject instances, not hidden lore IDs or facts. Preserve access to all eligible existing actions, including risky authored statements. First three actions are immediate suggestions, the rest are available in the menu.

`src/conversation/context-actions.mjs`: `resolveContextAction(state, keywordId, contextActionId)` -> the matching available action's `intent`; throw on unknown/unavailable. Lead will add OPTIONAL paired keywordId/contextActionId to legacy intents and validate the action/topic/information against this map. Existing untagged API intents remain backward compatible and validated by the existing engine. Browsing and keyword projections do not mutate state.

### A2 delivery component exports

Browser module `/delivery-chart.js`: `createDeliveryChart(container, {vibes,intensities,onChange,storage?})` -> `{setSelection({vibeId,intensity}),getSelection(),recordTurn({runId,index,action,vibeId}),destroy()}`. Initial selection EA/BALANCED. onChange gets `{vibeId,intensity}`. Build chart, shortcuts, Recent/Most used selector and intensity controls inside container. No network calls; server supplies canonical options. Count once per committed ASK/DEAL only. Starter approaches EA/SA/AE labeled honestly; unavailable storage is safe. Browser module may import another same-origin helper if lead is notified. CSS `/delivery-chart.css` is component-owned and scoped. Pure preference helpers in `src/conversation/delivery-options.mjs` are testable separately. Share API and route requirements with A5.

### A3 language exports

Preserve existing `playerMessage` and `marcusMessage` signature compatibility (A3 owns messages.mjs). Add pure `buildPlayerFrame(state,intent)` -> `{id,actorId,targetId,text,semanticFacts}`; frame.text is the canonical authored player line without technical delivery prefix. Handle ASK/DEAL/ACCEPT/WALK, exact old/new debt, current offer, and disclosure boundaries. No evaluateTurn or resolveInformation in preview. Frame contains only what is safe for the SPEAKER to say. `renderPlayerFrame(frame,{vibeId,intensity,mode,variantSeed})` -> `{text,readiness,variantId}`; mode is AUTHORING_PREVIEW or PRODUCTION. PRODUCTION must retain existing authored semantic wording/fallback, never promote new protocols. AUTHORING_PREVIEW composes authored compatible language. Semantic facts must survive, unsupported frames fail closed. Put exports in `src/conversation/language/realizer.mjs` or notify lead of exact import.

NPC variants may be implemented behind existing marcusMessage using resolved decision and canonical existing reply family. Expose separate review samples and honest readiness; default existing runtime behavior must not silently promote new TPL protocols. Lead owns the trusted validation/issuance bridge and never passes forged foundation TPL envelopes. New language is a separately labeled local authoring-preview build, not owner-approved production language.

### A4 face exports

`src/conversation/face/catalog.mjs`: `FACE_CATALOG` = `{version,canvas:{width,height},base:{src,x,y,width,height},assets:[{assetId,slot,src,x,y,width,height}]}`; src are same-origin `/assets/marcus/<safe filename>.webp`. Anatomical slots: left_brow,right_brow,left_eye,right_eye,mouth. Catalog contains only allowed runtime assets. Store all supplied provenance and exclusions in review documentation; do not destroy original supplied asset file.

`src/conversation/face/policy.mjs`: `openingFace(characterId='marcus')`; `buildFaceTurn(event,previousResponse)` -> `{turnRef,receiving,responding}`. A face snapshot = `{catalogVersion,presetId,slots:[{slot,assetId,fromAssetId,operation}],visibleCaption}` with five unique slots; null assetId denotes BASE. Event has intent, outcome, applied deltas, reactionCause; turnRef from reactionCause. Pure projection: reception cannot read future outcome/counterterms/undisclosed secrets, only explicit communicated intent/category and previous continuity. Response may use whitelisted current public outcome and applied deltas. Never direct vibe-to-face. Use forward-eye revised presets plus visual review sheet. Lead will store event.faces and project only safe snapshots.

### A5 HTTP and snapshot consumption

Keep `/api/state`, `/api/turn`, `/api/restart` and existing CSRF/run/version semantics. NEW `/api/preview` POST accepts the same closed intent as `/api/turn`; it validates but neither commits nor marks requestId used. Returns `{runId,version,playerText,delivery:{vibeId,intensity},readiness}` and no NPC response/face/outcome. Include optional keywordId/contextActionId on speaking intents. Reject stale previews, prevent out-of-order UI preview results. Actual submit must use matching selected draft and current version.

Snapshot additions: `options.keywords` from A1; `options.faceCatalog`; `play.character={id,name}`; `play.scenario={id,label,kind}` with kind NEGOTIATION or CONVERSATION; `play.face` last response/opening; `play.events[]` adds `{turnRef,action,vibeId,intensity,faces}` besides legacy text/outcome/feedback. `options.scenarios` lists supported fixtures. Restart may optionally include scenarioId; default remains Marcus. `options.languageReadiness` marks preview/production boundary. During presentation hold new reply/public consequences until response beat; state already committed once.

For non-commercial fixture, metrics/obligations/offers may be empty/null and `options.price=null`; UI must not assume Contra. Same generic keyword/actions/delivery/face/message shell must render. No fake financial values. A0 supplies fixture policy and adapters. Use an honestly labeled neutral fixture portrait if no second-character art exists.

New public files must be explicitly routed by lead. A5 uses external JS/CSS (no inline scripts/styles required by CSP); script entry may become type=module. All mutations flow through server. Debug remains intentional explicit diagnostic view; UI must never derive Play choices or secrets from Debug.

### A6 independent validation

Use interfaces above and actual public HTTP. Own only new acceptance/security/portability test files and fixture/report paths listed in preflight. Notify lead when tests need registration. Do not edit implementation or weaken old tests. Baseline suite: 194 passing. Cover both lore variants, three quirks, mutable client injection, cloned/forged preview authority, two-phase independence, freshness, stale/double sends and narrow asset routes.

## Boundaries and release gates

No nested agents, no outside-file edits, no new dependencies without lead/owner decision, no commits/pushes. One implementation pass and two correction rounds before escalating unresolved design changes. Seven persistent Marcus metrics stay seven; no Pressure, LLM calls, corpus promotion, new art generation, or world expansion. Repository laws remain intact. Update notes in `docs/conversation-system-v01/` using role-specific filenames only. User approval gates for authored language production and publication remain closed. Complete integrated implementation, test it, then present actual language/expression review material before requesting these approvals.
