# Marcus world-model interface contract v0.1

Frozen after baseline checkpoint `d8f11f950e4bf6050319563a93406938484483d7`. Baseline source is `838b075081d0b97de468d4e84984ce1e57908e76`. Expected fixture SHA-256 is `add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46`; no production work may regenerate it. Architecture v0.1.3 remains the semantic authority; this document closes representation/API details, not game design.

## Ownership and order

- Lead owns this contract, AGENTS.md, shared registration/build entry points, integration commits, final reports and packaging.
- B owns keywords/keyword schema, world event/claim schemas, event-contract, event-validator, ledger, claims, projections and focused kernel tests. Related structural keyword expectations may change from 14 to 16; report any shared-file needs first.
- C owns perception, beliefs, exposure, backstory, open-truths, profiles, profile schema and focused subjective tests.
- D owns Marcus world/adapter and existing encounter runtime, keyword-bank/edge and narrow language/conversation readers. Existing tests requiring legacy-state intervention migration need explicit lead handoff. D cannot edit the expected oracle.
- A owns historical capture and the baseline report. Capture is finished; the oracle is frozen.
- E owns independent conformance/adversarial tests and verification evidence, never production or expected oracle edits.

Kernel implementation/gates precede subjective implementation/gates. Marcus construction and shadow comparison precede authority switch. Interface clarifications go through lead; no silent API forks or overlapping edits.

## Serialization and authority

All core modules are pure synchronous ES modules using JSON-safe data and no Node, browser DOM, filesystem, random, clock, network or server dependencies. Calls return detached data; append never mutates caller input. Recompute projections for this milestone. Do not persist caches or mutable compatibility information stores.

The ledger is an object, not merely the event array:

```text
{schemaVersion, seed, entities: Entity[], events: WorldEvent[], claims: Claim[]}
Entity = {entityId, type, role?}
role = PLAYER | NPC (for actor entities)
```

The fixed entity registry supplies IDs/types, not mutable resources or beliefs. Claims are immutable records inside the ledger, atomically committed with their origin events; they assert propositions and never establish truth. This closes replay over event claim-ID references without adding fields to the v0.1.3 event payloads or relying on an external mutable claim catalog. Replay input is this entire ledger plus versioned fixed profiles. Objective authority remains the events.

New claims must originate in a STATEMENT or DOCUMENT_ISSUED event in the same append group, with exact actor or document-part carrier linkage. Reject orphan definitions, duplicate IDs, rewrites, dangling IDs and mismatched origin/carrier/part references. A statement may relay an existing document claim while preserving that claim's origin/carrier; its recipient gets TOLD/HEARD support from the current speaker, never READ support merely from the original carrier. Empty statement claimIds are valid for speech with no asserted proposition. Neither relaying nor receiving changes the original claim record, and validation must not require an assertion to be objectively true (lying is representable).

## Kernel API (B)

```text
createLedger({seed, entities}) -> empty ledger
createEvent(ledger, kind, payload, options = {}) -> WorldEvent
appendCommit(ledger, events, newClaims = []) -> new ledger or throw
validateEvent(ledger, event, newClaims = []) -> throws on invalid input
validateLedger(ledger) -> success or throw
projectWorld(ledger) -> WorldProjection
createClaim({claimId, proposition, category, carrier, originEventId}) -> Claim
canonicalQuestion(assertion) -> stable string
assertionsConflict(a, b) -> boolean
validateWorldAssertion(assertion, entities) -> throws on invalid input
deriveClaimRegistry(ledger) -> claimId-keyed records with derived questions
```

`createEvent` options contain the approved envelope fields (`time`, `placeId`, `presentIds`, `observability`, `provenance`, `causedBy`, `commitGroup`) and optional `offset` for a staged group. Sequence is `ledger.events.length + 1 + offset`. IDs derive only from ledger seed and sequence by a deterministic collision-free encoding of the seed, not process randomness. Explicit event objects must satisfy the same ID/sequence rules. Time uses authored labels/window labels, not a new clock. All compound groups carry one non-null commitGroup and contiguous ordering. Validate all candidate state before returning any append; a failing final event applies nothing.

Event payloads remain the 13 v0.1.3 kinds with closed fields. Document authenticating parts additionally use the implementation plan's stable `markId`. COMMITMENT_WINDOW_CLOSED resolves its actor from its referenced COMMITMENT_MADE, so an absent actor field is not invented in that payload.

```text
RESOURCE_DELTA = {kind:"RESOURCE_DELTA", holderId, resourceId, delta}
OBLIGATION_SET = {kind:"OBLIGATION_SET", obligationId,
                  debtorId, creditorId, principal, extra, days, status}
TRANSACTION.hardEffects = array of these records
```

Amounts are finite bounded integers. Reject negative resulting resource balances and invalid obligations. Initial authored resources use genesis transactions; live settlement uses balanced cash/stock transfers and a new obligation. Only transaction effects affect hard state. `OCCURRENCE.happened` rejects hard keywords. Temporary activity holds cannot establish hard balances, possession or attitudes; attitudes require ATTITUDE_SET, and player ATTITUDE_SET is rejected.

```text
WorldProjection = {
 resources: {[holderId]: {[resourceId]: quantity}},
 obligations: {[obligationId]: {debtorId,creditorId,principal,extra,days,status}},
 possession: {[documentId]: holderId},
 documents: {[documentId]: {issuerId,parts}},
 activities: {[activityId]: active-start-record},
 attitudes: {[holderId]: current-assertions}
}
```

Possession follows issuance/transfer; transfer requires current possession, read and present require possession, and all part references must resolve. Participant-role fields and presence/earshot/sightline constraints are validated. Activity end must reference an active start. ATTITUDE_SET holder must match assertion subject and later values replace current values without rewriting history.

## Assertions and canonical questions

Use the existing complete foundation assertion shape, including assertionId, keywordId, args, scope, polarity, status, contextIds, validFrom/validUntil and provenance. Do not create a second keyword vocabulary. World-level typed/reference validation strengthens the foundation's existing structural checks.

New HAS_ATTRIBUTE args are `{subject, attribute, value}`; ISSUED_BY uses `{subject, object}` (document, apparent issuer). Value slots are `value` and `object` respectively. Registered attributes are crates (integer count), collection_place (location ID), collection_window (from/until time-label object), docket (identifier). Both R-17 and L-42 crate claims use the same underlying intake entity and `crates` attribute, never the document as count subject.

Every keyword declares valueSlot, null where there is no value argument. Existing OWES obligation identity stays in `term`; optional `amount` is its numeric value slot. Existing OWNS keeps owner/resource bindings with optional `quantity` value slot. Separate obligations remain separately identified; the Marcus adapter sums outstanding balances. These metadata/optional-argument extensions must preserve all existing foundation assertion behavior and get positive/boundary/counterexample tests. HYPOTHETICAL support is explicit for claims needing it; hypothetical propositions never establish actual world facts or undergo truth checking.

Canonical keys contain keyword and non-value semantic bindings plus relevant scope, excluding occurrence identity, provenance and polarity. Null-value-slot assertions conflict on opposite polarity with the same full bindings. Attribute values differ by exact typed value in v1; cross-keyword contradictions retain existing foundation rules. `question` is computed, never an author override; reject a supplied conflicting key.

## Subjective API (C)

```text
projectPerceptions(ledger) -> Perception[]
projectNpcBeliefs(ledger, perceptions, npcProfile, ownAttitudes) -> Belief[]
projectExposure(ledger, perceptions, holderId) -> Exposure[]
selectOpenTruth(seed, definition, resolved) -> selected variant/events
compileBackstory(ledger, entries) -> new ledger
validateProfiles(profiles) -> success or throw
```

Perceptions have the v0.1.3 fields and an explicit act observation for directly perceived roles/propositions/effects. P1–P3 observe acts, not statement/document contents. Direct event propositions and transaction-derived OWNS/OWES become deterministic observed belief candidates (e.g. eventId plus observed index), not extra authored copies of hard state. Only P4–P7 deliver statement/document `claimsReceived`; P8 observes attendance or infers it for a party who previously perceived the commitment. No BACKSTORY channel exists.

P8 attendance and kept/broken outcome remain explicit act observations. A broken commitment does not negate the historical PROMISED_TO assertion or change its status merely to manufacture an outcome keyword. Rank-0 belief revision can be tested with a legitimate exact INFERRED proposition independently of P8's act record; UNKNOWN must remain absence of a candidate.

Perceptible acts are projected before exposure/belief derivation; those projectors must not recover hidden content through a raw event. Direct synthetic claim references are derived internally and need not pollute the ledger's statement/document claim catalog.

EXACT records may deliver the proposition and canonical question. CATEGORY records deliver category identity/label only: no exact value, no exact-content belief or exact-question inference via an opaque claim ID. An NPC's exposure represents who it perceived being told/shown a claim at a resolution; it does not infer that person's belief, or an unobserved overhearer. Speaker exposure covers addressed audience only.

Exposure of a presenter uses `direction: PROVIDED` and `channel: SHOWN` to describe observed disclosure, never to assert that the presenter previously READ the document. These are exposure annotations, not additional perception channels. Transaction observations record visible resource deltas; exact subjective totals accumulate only from an observed initial baseline. The first ledger transaction (`seq: 1`, sourceRef `genesis`) may initialize observed totals from the ledger's defined empty starting balances. A later transfer without a known baseline does not reveal an exact total.

For outgoing NPC presentation, the holder's act includes `outgoingPresentation: {documentId, partIds, audienceIds}` with actual addressed recipients in sightline. Exposure joins this observation only with that holder's prior READ records for those parts; it cannot recover unread or covered claims from the ledger. R6 recheck candidates occur at the authentication observation's position, so intervening stronger evidence is respected. V1 requires an ACTUAL apparent-issuer assertion, not a hypothetical one.

Beliefs use first-match R1–R6, ranks 4/3/2/1/0 and the frozen stance/support fields. UNKNOWN is absence of belief; rank-0 INFERRED is a real candidate and is not collapsed to UNKNOWN. Repeated equivalent claims add support without artificial conflicts. Late V1 authentication recomputes affected carrier support. Ledger truth never decides belief ranking, authenticity or a response.

Observed hard-state snapshots are temporal: a later observed transaction-derived OWNS/OWES value supersedes that holder's earlier observed snapshot on the same question. History remains intact; this narrow current-state projection prevents a witnessed balance change from becoming an R4 dispute. Arbitrary statement/document claims still follow R1–R6, and unseen transactions do not update the holder's snapshot. Authenticating header ISSUED_BY claims remain available in READ perceptions but do not establish the V1 authenticity belief before its conditions are satisfied.

Fixed NPC profiles are `{version:"world-profile@0.1",entityId,role:"NPC",recognizes:markId[],reception,policy,variant}`. Player profiles are `{version:"world-profile@0.1",entityId,role:"PLAYER",effectiveness:{B:1,A:1,S:1,E:1,D:1}}` in conformance. Effectiveness is read only to compute STATEMENT.delivery.landed, a scalar neutral 1; the original intensity remains a separate field. No player beliefs, trust, stance/rank or attitudes are projected. C supplies `landDelivery(profile, {vibeId,intensity})` using neutral delivery unchanged; no new progression or reception policy.

V1 uses only actually READ authenticating parts, stable recognized marks and the apparent issuer asserted by those read parts. It never checks DOCUMENT_ISSUED.issuerId to discover forgery. Union prior READs, require all authenticating parts and recognized marks, then derive ISSUED_BY support rank 3 and rerank that document's received body. A forged recognized mark can mislead, an unrecognized mark cannot authenticate, and verified issuer is not verified content. Player holdings and perceptions remain available without any player belief projection.

Recognized source evidence and ordinary document-content support are separate. Conflicting recognized issuer evidence can be DISPUTED at rank 3 without granting rank 3 to the body. Later source disputes revoke that carrier's enhanced content support and trigger R6 at the new observation; independent statement or other-carrier support remains intact.

Backstory expands to ordinary validated events; SEEN reuses an existing event/perception or augments an uncommitted event before append. Never edit a committed event or duplicate hard facts to teach someone. READ requires lawful possession/transfer history. Open truths resolve before play. C's generic selection helper must not replace Marcus's two existing seed algorithms.

## Marcus adapter/integration (D)

Concrete exported entry points are `createMarcusWorld(seed, quirk, options?)`, `projectMarcusLore(state)`, `projectPlayerInformation(state)`, and `projectMarcusInformation(state)`. Extra pure helper names may be added without changing these boundaries.

Persist `state.world` as the ledger and versioned fixed `state.worldProfiles`, plus `state.informationLocal` for progressKeys/negativeWindow only. Other encounter-local metrics/offers/history stay in their current roles. `projectMarcusLore` returns a detached legacy-shaped observation for compatibility tests/debug; it is never stored back as information authority. Caller compatibility changes cannot alter the next result. Player/NPC readers must use their own view, not the combined debug view as a hidden truth shortcut.

Player view uses perceived facts/documents and holdings, and replies the player actually received. Marcus view uses his derived beliefs, own attitudes/activity observations, exposure and fixed profile/policy. Player private category can be identified from actually read document claims, not a hidden seed branch. Negative usefulness from Marcus's reliance on L-42 legitimately yields the baseline's POSSIBLY_USEFUL/RELEVANCE_OBSERVED; the spec's NOT_ESTABLISHED is an alternative for no perceived usefulness, not mandatory for every negative seed.

Keep the exact existing information/quirk hash implementations. Negative count cause is independently deterministic and invisible until perceived. All ten lore mappings follow the architecture. Do not author a PICKUP_NEED assertion saying Marcus lacks information; ignorance follows from no perception. Render unchanged public facts/text from derived access; history strings are presentation, never authority.

Resolve an encounter action by staging its statements/presentations and local effects; append the validated group before deriving the output. ACCEPT includes resource/obligation transaction and any information delivery in one commitGroup, with closure coherently recorded. Rejecting any group event leaves all input state unchanged. Reconstruct economic metrics/obligations from the hard-state projection; no competing mutable economic authority remains. Existing social metrics and offer policy remain encounter-local.

All actual speaking turns emit STATEMENT events (with only their actual claims, GUARANTEE hypothetical), showing source/body emits DOCUMENT_PRESENTED, and terminal transitions emit ENCOUNTER_CLOSED. Each encounter history turn gains worldEventIds. Preserve all original reply/face/cause/evidence array order and text under the oracle projection. Evidence text must derive from qualifying perceived events and their chronology, not a stored evidence list.

Shadow validation first compares the derived model against every immutable oracle snapshot while the baseline runtime still runs. Remove temporary shadow scaffolding from production at cutover. The oracle helper may change only to read the equivalent derived compatibility projection and apply the documented REMOVE_NEGATIVE_WINDOW control to `informationLocal`; expected fixture and hash stay fixed. Old tests manipulating removed information stores must become equally strong ledger/perception interventions, not be deleted or relaxed.

## Gate evidence

Kernel: all 13 kinds, typed/ref validation, atomic failure, deterministic append, hard-state/possession/activity/attitude projection and canonical questions.

Subjective: P1–P8/P6b, V1 forged/unrecognized/late verification, content firewall, exact/category, trust ranks, conflicts/replay, absence, UNKNOWN versus INFERRED, backstory and no player beliefs.

Integration: shadow comparison then immutable oracle replay, all 12 world/profile combinations, hidden-event mutation invariance, C1–C11, complete existing regression/gates, and independent E verification before packaging. No scope expansion or baseline rewrite may substitute for a passing gate.
