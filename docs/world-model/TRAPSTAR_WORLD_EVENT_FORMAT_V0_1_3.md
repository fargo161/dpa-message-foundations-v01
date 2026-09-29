# Trapstar World Event Format v0.1.3

Sep 29, 2026 · @Teddy

Three records carry all world knowledge: the **world event** (what happened), the **perception record** (who took in which part of it) and the **derived belief** (what each NPC now believes). The player has perception records only: no beliefs, stances, trust or attitudes, because the human decides what to believe. The Marcus encounter is the conformance test: the new model must reproduce all 17 recorded golden runs with no hand-maintained knowledge lists. Version 0.1.3 completes the schema and is frozen for the Marcus conformance build; all three rounds of changes are listed under Changes. No code yet.

## Decisions

Two owner decisions were settled on 2026-09-29: the foundation's vocabulary becomes the world's grammar, and the vocabulary grows by two keywords.

### D1 · Share the vocabulary, not the authority

Replace the `AGENTS.md` sentence that begins "The separate live Marcus ASK/DEAL encounter" with:

> The world event ledger uses the foundation keyword vocabulary as its grammar: every proposition in an event, claim, attitude or belief must be a valid keyword assertion. This grants vocabulary and validation only. Foundation actions, capacity rules and TPL rendering do not govern encounter resolution; the encounter's own mechanics remain authoritative for outcomes.

| Now shared | Still separate |
| --- | --- |
| Every proposition in an event, claim, attitude or belief must pass keyword assertion validation. | Foundation actions and capacity rules do not decide encounter outcomes. |
| Foundation contradiction rules may flag conflicting claims. | TPL rendering stays preview-only and does not voice encounter lines. |
| The lorebook may present world facts. | PRESSURE stays unavailable in the encounter. |

Keyword definitions now shape world data, so they are versioned: changing a keyword needs a migration check against existing ledgers. The design lock's sentence that the foundation "does not automatically govern Marcus runtime resolution" stays true as written.

### D2 · Two new keywords; everything else is event structure

The keyword graph grows from 14 to 16. This is the owner-approved scope change that `PHASE_2_EXTENSION_POINTS_V01.md` requires.

| Keyword | Arguments | Explicit non-meanings | Marcus use |
| --- | --- | --- | --- |
| `ISSUED_BY` | document; issuer | Does not mean the contents are true. Does not mean the holder obtained it legitimately. | The source check: Marcus believes `ISSUED_BY(R-17, depot)`. |
| `HAS_ATTRIBUTE` | subject; registered attribute; typed value | Not a free-text fact: only registered attributes are valid. Does not say who asserted it; that is the claim's carrier. | R-17's body: `HAS_ATTRIBUTE(return R-17, crates, 6)`; the changed collection place, window and docket. |

**Registered attributes, v1:** crates (count), collection place, collection window (time range), docket (identifier). A new attribute goes through review, like a keyword.

**Structure, not keywords:** presence is the envelope's `presentIds` (and `attendance` in commitment payloads); who carries a claim is `claim.carrier`; ongoing activities are `ACTIVITY_STARTED` and `ACTIVITY_ENDED` events.

Both keywords still follow the full extension procedure: definition, non-meanings, typed arguments, time rules, provenance, and positive, boundary and counterexample tests.

## Changes

### v0.1.3

A schema-completion patch; the model itself is unchanged. With it, the spec is frozen for the conformance build.

| Change | Why |
| --- | --- |
| Every event is a shared envelope plus a payload typed by its kind. The envelope keeps `presentIds`. | The perception rules used speaker, audience, earshot, sightline and actor, which no field defined. |
| `hardEffects` exists only in the `TRANSACTION` payload; `happened` only in `OCCURRENCE`. | The one-source rule becomes a schema rule, not only a validator check. |
| `MARCUS_QUIRK` leaves the world open truths and becomes a seeded NPC profile variant. | A quirk sets policy; it is not something that happened. |
| New Profiles section: player and NPC profiles, including `recognizes`. | Mark recognition affects reasoning but is neither truth nor belief. |

### v0.1.2

Four corrections from the second review. The Marcus conformance targets are unchanged.

| Change | Why |
| --- | --- |
| Source checking is its own rule, V1: an NPC who reads all of a document's authenticating parts and recognizes the issuer's marks believes `ISSUED_BY` at rank 3. NPCs gain a `recognizes` list. | Rank 3 depended on authenticity, and authenticity on rank 3. |
| BACKSTORY is no longer a perception channel, and rule P9 is removed. The shortcut compiles into the ordinary event that would have taught the character. | A BACKSTORY channel lost how the character actually learned it. |
| Law 7 names four readers; the world engine acts on truth only by producing events. | "Only the engine reads truth" contradicted Debug and would block a world engine. |
| Other minds are exposure only: who heard, read or was told a claim, built from the NPC's own perceptions. Law 8 rewritten; the belief `order` field is removed. | "Marcus believes the player knows X" implied a player belief. |

### v0.1.1

Six corrections from the first review. The Marcus conformance targets are unchanged.

| Change | Why |
| --- | --- |
| Attitudes come from `ATTITUDE_SET` events; a newer one replaces an older one. | Attitudes authored directly on a character contradicted Law 1. |
| `DOCUMENT_TRANSFERRED` sets possession only; the new `DOCUMENT_READ` produces READ perceptions. | Holding a sealed envelope or a locked phone must not reveal what is inside. |
| `ACTIVITY_STARTED` and `ACTIVITY_ENDED` replace an `ACTIVITY` with an open end. | Ending an activity must not edit an old event. |
| `hardEffects` is the only source of hard state; `OWNS` and `OWES` are derived from it and rejected in `happened`. | Two copies of the same debt could disagree. |
| A claim's question is derived from its proposition using the keyword's value slot. | Hand-named questions would split one question into several. |
| Law 12: perceiving an act never reveals the contents of the objects involved. | "ALL" under P2 must not let bystanders read documents. |

**Next step.** Build only what Marcus conformance needs: the world ledger, the perception generator, the NPC belief projector and a Marcus adapter. News passes, a world clock, Room Creator integration and offscreen life wait until C1–C11 pass.

## Laws

Every record in this spec obeys these twelve rules. A design that breaks one is out of scope for v0.1.

1. **The world event ledger is the only truth.** Hard facts (cash, stock, ownership, debt) come only from events' `hardEffects`. Attitudes, activities and possession are projections of the ledger too.
2. **Only NPCs believe.** The player has no beliefs, stances, ranks, trust or attitudes. The player's side of the model is what they perceived and what they hold; the human decides what to make of it.
3. **NPC beliefs are derived, never edited.** They are rebuilt from events and perceptions. No code may push a fact into anyone's knowledge directly.
4. **Turns are not events.** An encounter turn is a player choice. It may cause zero or more world events, which point back to it.
5. **Truth is never an output of source ranking.** Ranking decides what an NPC comes to believe. Whether that belief is true is computed separately and never shown in Play.
6. **Authenticity is not accuracy.** A document can be genuine and still wrong. Checking the source proves who issued it, not that its contents are true.
7. **Four readers.** Player move eligibility reads only the player's perception records and holdings. An NPC's decisions and reactions read only that NPC's beliefs, attitudes, exposure view and policy. The world engine reads authoritative state and acts on it only by producing events, which people then perceive normally. Debug and validation may read authoritative state; nothing they read reaches Play.
8. **Other minds are exposure only.** An NPC may know who else heard, read or was told a claim, from its own perceptions. It never holds what someone else believes. Nesting stops at one level by construction.
9. **Seeds resolve before play.** Open truths become ordinary events at world creation. Nothing changes truth mid-play.
10. **A field exists only if a rule reads it.** Reserved fields are named in the spec but not implemented until a rule consumes them.
11. **Determinism.** The same seed and the same ordered inputs produce byte-identical events, perceptions, NPC beliefs and encounter state.
12. **Perceiving an act is not reading its contents.** Perceiving an event gives the act: who did what, where, with which objects. It never gives what those objects contain. Contents arrive only through `DOCUMENT_READ`, `DOCUMENT_PRESENTED` or a `STATEMENT`.

## How the records fit

&#91;embedded content: knowledge flow · events to perceptions, then player notebook or NPC beliefs\]

Everything starts as an event. Perception rules decide who took in what; the player's records go straight to the notebook, while each NPC's records become derived beliefs that drive its reply, which is itself a new event.

## World event

A world event records one thing that happened, where, to whom, and what it changed. Events are append-only and totally ordered. Every event is a shared **envelope** plus a **payload** whose shape is fixed by its kind.

| Envelope field | Shape | Meaning |
| --- | --- | --- |
| `eventId` | stable string | Deterministic id; the same seed and inputs give the same id. |
| `kind` | enum | One of the 13 v1 kinds below. It selects the payload shape. |
| `seq` | integer | Total order across the whole ledger. |
| `time` | `{at}` or `{windowFrom, windowUntil}` | A moment, or a commitment window. States that span time use a start event and an end event. |
| `placeId` | entity id | Where it happened. Backstory events may use a named place without a map. |
| `presentIds` | entity ids | Everyone at the place when it happened. Rules P2, P5 and P6b read it for "others present". Authored in v1; later supplied by the Room Creator. |
| `observability` | PARTICIPANTS, PRESENT or PRIVATE | Who can perceive it: its participants (default), anyone present, or only the kind's actor. |
| `provenance` | AUTHORED, BACKSTORY, SEED or ENCOUNTER\_TURN, plus a source ref | Where the event came from. |
| `causedBy` | turn ref or event id | The encounter turn or earlier event that produced it. |
| `commitGroup` | id or null | Events sharing a group commit together or not at all. |
| `payload` | object, typed by `kind` | The kind-specific fields below. |

### v1 event kinds

| Kind | What it records | Marcus example |
| --- | --- | --- |
| `OCCURRENCE` | Something happened at a place. | The shared loading shift; the depot moving tomorrow's collection. |
| `TRANSACTION` | Hard resources move or an obligation is created, through `hardEffects`. | The old $250 credit sale; an accepted deal. |
| `DOCUMENT_ISSUED` | An issuer creates a document that carries claims. | The depot issues counterfoil R-17; the clerk signs intake summary L-42. |
| `DOCUMENT_TRANSFERRED` | Possession of a document changes. Possession only: nothing is read. | The player receives R-17 at collection. |
| `DOCUMENT_READ` | A holder examines some parts of a document they have. | The player reads all of R-17 right after receiving it. |
| `DOCUMENT_PRESENTED` | A holder shows some parts of a document to an audience. | Showing R-17's header and signature; later its body. |
| `STATEMENT` | A speaker tells an audience a claim, at EXACT or CATEGORY resolution. | A hint about the tip; Marcus saying the intake is reconciled. |
| `COMMITMENT_MADE` | Someone promises to do something within a window. | Agreeing to yesterday's check-in. |
| `COMMITMENT_WINDOW_CLOSED` | The window passes; records who attended and whether it was kept. | The missed check-in. |
| `ACTIVITY_STARTED` | An ongoing activity begins, with an `activityId`. | Marcus starts closing today's ledger; he starts arranging tomorrow's collection. |
| `ACTIVITY_ENDED` | The activity with that `activityId` stops. | Not reached in v1 Marcus. |
| `ATTITUDE_SET` | A holder's NEEDS, FEARS, TRUSTS or RESENTS is set. A newer one replaces an older one. | Marcus needs tomorrow's collection details. |
| `ENCOUNTER_CLOSED` | A conversation ended, with its outcome. | Walking away, an agreement, or Marcus ending the talk. |

### Payloads by kind

Each kind names one **actor**, used by PRIVATE observability. "Participants" in rule P1 means the entities named in the payload's role fields. In the schema this is one definition with a variant per kind, validated like the repo's other JSON Schemas.

| Kind | Actor | Payload fields |
| --- | --- | --- |
| `OCCURRENCE` | `actorId` | `actorId`; `participants` as `{entityId, access}`; `objectIds`; `happened`: non-hard propositions only |
| `TRANSACTION` | `fromId` | `fromId`; `toId`; `hardEffects`, the only place hard state changes |
| `DOCUMENT_ISSUED` | `issuerId` | `issuerId`; `documentId`; `parts` as `{partId, claimIds, authenticating}` |
| `DOCUMENT_TRANSFERRED` | `fromId` | `documentId`; `fromId`; `toId` |
| `DOCUMENT_READ` | `readerId` | `readerId`; `documentId`; `parts` |
| `DOCUMENT_PRESENTED` | `holderId` | `holderId`; `documentId`; `parts`; `audienceIds`; `sightlineIds` |
| `STATEMENT` | `speakerId` | `speakerId`; `audienceIds`; `earshotIds`; `claimIds`; `resolution` (EXACT or CATEGORY); `delivery` as `{vibeId, intensity, landed}` |
| `COMMITMENT_MADE` | `promisorId` | `commitmentId`; `promisorId`; `promiseeId`; `assertion` (a `PROMISED_TO` assertion); the window is in `time` |
| `COMMITMENT_WINDOW_CLOSED` | `promisorId` | `commitmentId`; `parties` as `{entityId, attendance}`; `kept` (true or false) |
| `ACTIVITY_STARTED` | `actorId` | `activityId`; `actorId`; `label`; `holds`: propositions true while it runs |
| `ACTIVITY_ENDED` | `actorId` | `activityId`; `actorId` |
| `ATTITUDE_SET` | `holderId` | `holderId`; `assertion` (a NEEDS, FEARS, TRUSTS or RESENTS assertion). Always PRIVATE: others learn of it only through statements or behaviour. |
| `ENCOUNTER_CLOSED` | none | `encounterId`; `participantIds`; `outcome` (AGREED, WITHDRAWN or ENDED) |

Because `hardEffects` exists only on `TRANSACTION` and `happened` only on `OCCURRENCE`, a hard fact has nowhere else to be written.

**Absence** is recorded by `COMMITMENT_WINDOW_CLOSED`. Its payload lists every party to the commitment with `attendance`, and `kept` says whether the commitment held. Those present perceive who was absent.

**Ongoing states** use `ACTIVITY_STARTED` and `ACTIVITY_ENDED`, linked by `activityId`. What is going on now is a projection of the ledger, so ending an activity never edits an old event. Any state that spans time follows this start-and-end pattern, as commitments already do. `observability` decides whether people in the room can tell an activity is going on.

## Claims and documents

A claim is a proposition someone or something asserts. Statements and documents carry claims; perceiving them is how claims reach people.

| Field | Shape | Meaning |
| --- | --- | --- |
| `claimId` | stable string | Deterministic id. |
| `proposition` | typed assertion | What is asserted, such as `HAS_ATTRIBUTE(return R-17, crates, 6)`. Scope is ACTUAL, or HYPOTHETICAL for predictions. |
| `category` | category id + label | The coarse description passed at CATEGORY resolution, such as "changed collection instructions". |
| `carrier` | actor or document part | Who said it, or which part of which document holds it. |
| `originEventId` | event id | The statement or issuing event that created it. |
| `question` | question key | Derived, never authored: the proposition with its value slot left open (see Canonical questions). Claims with the same question and different values conflict. |

**Truth is not a field.** A claim's truth is computed by checking its proposition against the ledger. It is available to the engine and Debug only, never to Play, the face policy or NPC responses.

**Hypothetical claims are never truth-checked.** "Future profits are guaranteed" has no truth value until an event settles it.

### Documents

A document is an object entity made of **parts**. Each part carries its own claims, so a holder can show some parts and cover others.

| Document | Part | Claim it carries |
| --- | --- | --- |
| Counterfoil R-17 | header | Issued by the depot, today. |
| Counterfoil R-17 | signature | Signed by the depot clerk. |
| Counterfoil R-17 | body | Positive seed: tomorrow's collection moved to gate C, 07:00–07:30, docket R-17. Negative seed: six crates returned. |
| Intake summary L-42 | body | Eight crates; the intake is reconciled. |
| Intake summary L-42 | signature | Signed off by the clerk. |

Reading a document's **authenticating parts** (header, signature) produces a belief about who issued it: the source check. It produces nothing about the body. Reading the **body** produces beliefs about its claims. This is Law 6 in data form: R-17 can be genuine and still conflict with a genuine L-42.

### Canonical questions

A claim's question is derived from its proposition, never typed by an author. Each keyword declares a **value slot**: the argument that differs between conflicting claims. The question is the proposition with that slot left open.

| Keyword | Question | Conflict when |
| --- | --- | --- |
| `HAS_ATTRIBUTE(subject, attribute, value)` | `HAS_ATTRIBUTE(subject, attribute, ?)` | The values differ under that attribute's conflict rule. |
| `OWES(debtor, creditor, amount)` | `OWES(debtor, creditor, ?)` | The amounts differ. |
| `ISSUED_BY(document, issuer)` | `ISSUED_BY(document, ?)` | The issuers differ. |
| `TRUSTS(a, b)` and other keywords with no value slot | The whole assertion | One claim asserts it and the other negates it. |

Conflicts between different keywords, such as `PERMITTED` against `PROHIBITED`, stay in the foundation's contradiction rules.

Each registered attribute declares when two values conflict. In v1 any difference conflicts, including time windows ("07:00–07:30" against "07:00–08:00"); rules for one value refining another can come later.

The value slot is a new field on every keyword definition, so it is a keyword contract change under the extension procedure.

## Perception record

A perception record says one person took in some part of one event. Perception rules create these records from events; nothing else may. For the player, these records are the end of the chain: the notebook shows them directly, and no belief is derived.

| Field | Shape | Meaning |
| --- | --- | --- |
| `perceptionId` | stable string | Deterministic id. |
| `eventId` | event id | The event perceived. |
| `holder` | entity id | Who perceived it. |
| `channel` | SEEN, TOLD, HEARD, READ or INFERRED | How. TOLD means addressed; HEARD means overheard. |
| `portion` | parts list or ALL | Which parts they took in, such as `[R-17.header, R-17.signature]`. |
| `resolution` | EXACT or CATEGORY | Whether they got the exact claim or only what kind of claim it is. |
| `claimsReceived` | list of claim id + resolution | The claims this perception delivers. |
| `rule` | rule id | Which perception rule produced it (for Debug and tests). |

Reserved, not in v1: `clarity` (partial sight or sound) and `sourceReliability`. They are added when a rule needs them.

### v1 perception rules

**No perception, no belief.** Anyone not given a record by these rules learns nothing from the event.

| Rule | Event | Who perceives | Channel | What they get |
| --- | --- | --- | --- | --- |
| P1 Participant | observability PARTICIPANTS | Each PRESENT participant | SEEN | Their `access` parts, or ALL. |
| P2 Room | observability PRESENT | Everyone present at the place and time | SEEN | ALL. |
| P3 Private | observability PRIVATE | The actor only | SEEN | ALL. |
| P4 Addressed | `STATEMENT` | Each PRESENT audience member | TOLD | The claim at the statement's resolution. An NPC speaker also gains an exposure record: this audience was told this claim. |
| P5 Overheard | `STATEMENT` | Others present within earshot | HEARD | The claim at the statement's resolution. The speaker gains nothing about them. |
| P6 Shown | `DOCUMENT_PRESENTED` | Each audience member with sightline | READ | Only the presented parts. |
| P6b Act seen | `DOCUMENT_PRESENTED` | Others present without sightline to the document | SEEN | That a document was shown, and to whom. No parts, no claims. Found by the group scene below. |
| P7 Read | `DOCUMENT_READ` | The reader | READ | Only the parts read. Receiving a document gives no perception of its contents. |
| P8 Absence | `COMMITMENT_WINDOW_CLOSED` | PRESENT parties; ABSENT parties who perceived the commitment | SEEN / INFERRED | Who attended, and whether the commitment was kept. |

In v1, `earshotIds` and `sightlineIds` are authored payload lists, and `presentIds` is authored on the envelope. Later, the Room Creator's visibility and proximity data supplies them.

**ALL means the act, never the contents.** Under P1–P3, ALL is every perceptible aspect of the event: who did what, where, with which objects. It never includes what those objects contain (Law 12); contents arrive only through P4–P7.

### Source check (rule V1)

An NPC checks a document's source by recognizing the issuer's marks, not by trusting the document. This breaks the loop where a document's rank depended on its own authenticity.

1. The NPC READs every authenticating part of the document (via P6 or P7).
2. If the issuer's marks are in that NPC's `recognizes` list (part of the NPC profile), the NPC believes `ISSUED_BY(document, issuer)` at rank 3, and the document is CHECKED for that NPC.
3. The document's other claims then reach that NPC at rank 3.
4. Marks the NPC does not recognize leave authenticity UNKNOWN, and the claims stay at rank 1.

No truth is read. A forged mark that an NPC recognizes gives a false belief that the document is genuine, which is how forgery should work.

**Marcus needs** `recognizes = [depot mark, clerk signature]`: the depot's for R-17, and the clerk's for his own L-42. L-42 must reach rank 3 through this rule, or the negative seed's DISPUTED result will not reproduce.

## Derived belief

A derived belief is what one NPC holds about one question, rebuilt from that NPC's perception records by the revision rules below. It is a view: NPC responses, Debug and tests read it; nothing writes it. **The player has no derived beliefs.** Where two claims conflict, the player's notebook shows both sources side by side.

| Field | Shape | Meaning |
| --- | --- | --- |
| `holder` | entity id | Whose belief. |
| `question` | question key | Derived, never authored (see Canonical questions), such as `ISSUED_BY(R-17, ?)` or `HAS_ATTRIBUTE(intake, crates, ?)`. |
| `stance` | BELIEVED, DISBELIEVED, DISPUTED or UNKNOWN | UNKNOWN is the default and is never stored. |
| `heldClaim` | claim id or null | The claim they accept when BELIEVED. |
| `competing` | claim ids | Both sides when DISPUTED; the challenger when `challenged`. |
| `challenged` | boolean | A weaker conflicting claim arrived but did not change the stance. |
| `resolution` | EXACT or CATEGORY | CATEGORY means they know what kind of claim exists, not its content. |
| `rank` | 0–4 | Strength of the best support (see ranking). |
| `supportedBy` | perception ids | The records that produced it. |

### Channel ranking

Ranking decides what an NPC comes to believe. It never decides what is true.

| Rank | Support |
| --- | --- |
| 4 | SEEN directly |
| 3 | READ from a document the holder has source-checked (rule V1) |
| 2 | TOLD by someone the holder TRUSTS |
| 1 | TOLD, HEARD, or READ from an unchecked document |
| 0 | INFERRED |

Backstory needs no rank rule of its own: it compiles into ordinary events, so its perceptions carry ordinary channels.

### Revision rules (first match wins)

| Rule | Situation | Result | Marcus case |
| --- | --- | --- | --- |
| R1 New | No belief on this question yet. | BELIEVED at the received resolution and rank. | Marcus reads L-42 in his backstory. |
| R2 Repeat | Same claim again. | Add support; raise rank if higher. | A repeated disclosure changes nothing. |
| R3 Stronger | Conflicting claim with a higher rank than the current support. | Switch to the new claim; the old one becomes DISBELIEVED. | Not reached in v1 Marcus. |
| R4 Equal | Conflicting claim with the same rank. | DISPUTED, both claims in `competing`. | R-17 (checked) against L-42: `record = DISPUTED`. |
| R5 Weaker | Conflicting claim with a lower rank. | Keep the stance; set `challenged`. | R-17 body shown before the source check: `CHALLENGED_UNVERIFIED`. |
| R6 Recheck | The holder's belief about a carrier's authenticity changes. | Re-run R2–R5 for that carrier's claims at the new rank. | A late source check upgrades `challenged` to DISPUTED. |

The truth of a claim is never an input to any rule.

### Exposure: the only view of other minds

An NPC's knowledge of other minds is limited to **exposure**: who heard, read or was told which claim, at which resolution. It is a view over that NPC's own perception records. Marcus knows the player heard something because he perceived a `STATEMENT` whose audience included the player.

Exposure never says what the other person believes. That keeps the player correct (the player has no beliefs), keeps lying honest ("he heard it" is not "he accepts it") and stops nesting at one level. Exposure is a view, not a keyword, so it needs no 17th keyword. `marcusAwarePlayerKnows` becomes a projection of Marcus's exposure view.

## Attitudes, backstory and seeded open truths

These three are how authors write a world quickly without breaking the event-log rule.

### Attitudes

An attitude is an NPC's own state (the player has none; their aims come from the scenario objective): `NEEDS`, `FEARS`, `TRUSTS` or `RESENTS` from the foundation keywords. **The holder owns its truth.** Only an ATTITUDE\_SET event about the holder can set it; nobody else's claim can make Marcus need or fear anything. The attitude store is a projection of those events.

| Field | Shape | Meaning |
| --- | --- | --- |
| `holder` | entity id | Whose attitude. |
| `keyword` | NEEDS, FEARS, TRUSTS or RESENTS | Which attitude. |
| `args` | typed arguments | Its object, such as `NEEDS(marcus, collection instructions for tomorrow)`. |
| `since` | event id | The ATTITUDE\_SET event that set it. A newer one replaces it. |

Other NPCs know an attitude only through beliefs about it, on the question `ATTITUDE(holder, keyword, args)`. They get those beliefs the ordinary way: being told, or seeing behaviour. The player only perceives what was said or shown. An NPC's reply may reveal its own attitude, because its response rule reads its own state (Law 7).

**Changes use the same event.** A newer `ATTITUDE_SET` replaces the older one, and the history stays in the ledger. Which encounter results emit one is still open. Attitudes have no levels in v1: `TRUSTS` is a plain relationship, and adding levels would be a keyword change.

### Backstory shortcut

Authors write knowledge the fast way. The compiler turns it into events and perceptions.

```text
KNOWS(holder, proposition, via = SEEN | TOLD | READ, from = speaker?, when = time?)
```

- `via = TOLD` compiles to a backstory `STATEMENT` from the named speaker, with the holder in the audience.
- `via = READ` compiles to a backstory `DOCUMENT_READ`.
- `via = SEEN` makes the holder a PRESENT participant in the event that makes the proposition true, or a new backstory `OCCURRENCE` if none exists. It never adds a second copy of the fact.
- The ordinary perception rules then produce the records. Backstory has no perception path of its own.
- A backstory entry may not create hard state that contradicts the ledger; the compiler rejects it. Authored attitudes compile to `ATTITUDE_SET` events the same way.
- Provenance BACKSTORY records where an event came from, never how anyone learned it.

### Seeded open truths

An open truth is a question the author leaves unsettled, with two or more authored variants. At world creation the seed picks one variant, and its events enter the ledger with provenance SEED. The other variants are discarded, so nothing can leak them.

| Field | Shape | Meaning |
| --- | --- | --- |
| `openTruthId` | string | Name of the question. |
| `salt` | string | Hash salt, so each open truth varies independently. |
| `when` | condition or null | Resolve only if another open truth took a given variant. |
| `variants` | list of `{variantId, events}` | The authored alternatives. |

Marcus's world needs two. His quirk is not an open truth: it is a seeded variant of his NPC profile (see Profiles).

| Open truth | Variants | Notes |
| --- | --- | --- |
| `R17_CONTENT` | POSITIVE (changed collection), NEGATIVE (six crates) | Must reuse the existing `marcus-information-v1:` hash exactly, so every recorded seed gets the same variant. |
| `R17_COUNT_CAUSE` | clerical error, runner shorted, depot miscount | `when` R17\_CONTENT = NEGATIVE. No v1 rule reads it; it exists so the ledger has one truth and a future investigation has a hook. |

Every combination of world variants and profile variants must pass validation: no contradictory hard facts, and at least one successful two-Contra route per information variant and quirk (the design lock's existing requirement). Marcus has 12: four world variants (positive, or negative with each of three causes) times three quirks.

## Profiles

A profile is fixed data about a character: how well they speak, how they react, and what they can recognize. It is neither world truth nor belief, and in v1 it never changes.

| Domain | Holds | Read by |
| --- | --- | --- |
| World | Events and everything projected from them: hard state, attitudes, activities, possession | The world engine; Debug and validation |
| NPC subjective state | That NPC's derived beliefs, its attitudes and its exposure view | That NPC's decisions and reactions |
| NPC profile | BASED reception, mark recognition, encounter policy, seeded variant | That NPC's decisions and reactions; rule V1 |
| Encounter | Confidence, tension, patience, offers and bargaining state | The encounter mechanics |

| Profile part | Player | NPC |
| --- | --- | --- |
| BASED | Effectiveness: how strongly each cue lands | Reception: how it reacts to each vibe in each context |
| Mark recognition | None | `recognizes`: the issuer marks it can verify (Marcus: depot mark, clerk signature) |
| Encounter policy | None | Thresholds, credit limits and reactions (Marcus's current `PERSONALITY`) |
| Seeded variant | None | Chosen by the character seed (Marcus: final\_say, plain\_dealing or recognition) |

**Two seed domains.** The world seed resolves open truths into events. The character seed picks profile variants. Both are deterministic, and Marcus's quirk keeps the existing `selectQuirk` hash exactly, so every recorded seed behaves as it does today.

If a character later gains a profile change, such as Marcus learning a new signature, it will arrive as an event. That is deferred past v1.

## Encounter and world boundary

An encounter keeps its own turn log and its own bargaining state. It reads beliefs from the world and writes back only through world events.

| Stays in the encounter | Becomes world events |
| --- | --- |
| Confidence, tension, patience | Every `STATEMENT` the player or NPC makes |
| Progress keys (the anti-repetition rule) | Every `DOCUMENT_PRESENTED` |
| The negative-variant opening window | The `TRANSACTION` when an offer is accepted |
| Proposals and counteroffers until accepted | The information delivery bundled with that acceptance, in the same `commitGroup` |
| Score bonuses, reply-family choice, face state | `ENCOUNTER_CLOSED` when the conversation ends |

Each encounter turn record gains `worldEventIds`: the events it caused. Encounter mechanics such as the +8 information bonus keep working, but they read derived beliefs instead of lore lists.

### Four readers: where today's code breaks the rule

These reads are harmless today, because every seed contains the same background facts. They become leaks the moment two worlds differ, so v1 must remove them.

| Current read | Problem | v1 replacement |
| --- | --- | --- |
| `PROBE_USEFULNESS` is gated on `LEDGER_CLOSING` existing | The player's menu reads a fact only Marcus knows. | Gate on the player holding a private claim. `LEDGER_CLOSING` moves into Marcus's response rule. |
| `OFFER_INFORMATION` eligibility reads `PICKUP_NEED` | The player's menu reads Marcus's hidden attitude. | Gate on the player having heard Marcus's reply about it (today's `RELEVANCE_OBSERVED`). |
| `QUESTION_RECORD` is gated on `variant === "NEGATIVE"` | The player's menu reads the seed. | Gate on the player having heard Marcus claim the intake is reconciled, and having read a conflicting claim. |
| `PROBE_USEFULNESS` resolution reads the variant flag | Marcus's reply reads the seed. | Marcus's reply reads his own `NEEDS` attitude or his own reliance on L-42. |
| One shared `lore.beliefs` object | It mixes Marcus's beliefs (source, content, record) with the player's (relevance). | Split by holder: Marcus's slots project his derived beliefs; relevance projects the player's perception records. |
| The opening window's `grounded` check reads world facts | An encounter mechanic reads truth. | Read Marcus's derived beliefs instead. |

### BASED profiles: the player delivers, NPCs react

Both sides have a BASED profile, but it answers different questions. The player is the one reacting in real life, so the player's profile only affects how well their words land.

|  | Player | NPC |
| --- | --- | --- |
| BASED profile | **Effectiveness**: how well each cue lands when they speak | **Reception**: how they react to each vibe in each context (Marcus's 20 × 3 table) |
| Beliefs | None: perception records and holdings only | Derived beliefs |
| Attitudes | None: aims come from the scenario objective | NEEDS, FEARS, TRUSTS, RESENTS |

1. The player picks a vibe and an intensity.
2. Their effectiveness profile sets how strongly it lands. The result is written onto the `STATEMENT` event as `delivery.landed`.
3. Everyone who perceives the statement perceives the landed delivery.
4. The NPC's reaction reads the landed delivery through its own reception table. It never reads the player's profile (Law 7).

Today's build has no player profile, which equals a neutral profile: every cue lands at full strength. The conformance runs use that neutral profile.

## Marcus conformance: the 10 lore facts

All 10 authored facts map onto the three records without special cases. Each run uses 8: the 6 shared facts plus one variant pair.

| Fact | Seed | Becomes | Who knows, and why (derived) |
| --- | --- | --- | --- |
| `OLD_ACCOUNT` | both | Backstory `TRANSACTION`: an earlier credit sale whose `hardEffects` create the $250 obligation; `OWES(player, marcus, 250)` is derived | Both, via P1 as participants. |
| `STOCK_TITLE` | both | Backstory acquisition whose `hardEffects` give Marcus 8 Contra; `OWNS(marcus, contra, 8)` is derived | Marcus via P1; the player via a backstory `KNOWS`. |
| `MISSED_CHECKIN` | both | `COMMITMENT_MADE` for yesterday's check-in, then `COMMITMENT_WINDOW_CLOSED`: Marcus PRESENT, player ABSENT, broken | Both, via P8: Marcus SEEN, the player INFERRED. |
| `SHARED_LOADING_SHIFT` | both | `OCCURRENCE` last week; both participants; the count was completed | Both, via P1. |
| `DIRECT_RECEIPT` | both | `DOCUMENT_ISSUED` (depot issues R-17 today), then `DOCUMENT_TRANSFERRED` to the player at collection, then `DOCUMENT_READ` by the player, all parts | The player via P7. Marcus has no record until R-17 is shown. |
| `LEDGER_CLOSING` | both | `ACTIVITY_STARTED`: Marcus closing today's short ledger, with no `ACTIVITY_ENDED` yet; observability PRIVATE | Marcus only, via P3. Matches today's `playerVisible: false`. |
| `POSITIVE_ROUTE` | positive | `OCCURRENCE` at the depot moving tomorrow's collection; R-17's body carries the claim | The player, via R-17's body (P7). |
| `PICKUP_NEED` | positive | Backstory `ATTITUDE_SET`: `NEEDS(marcus, tomorrow's collection details)`, plus `ACTIVITY_STARTED`: arranging tomorrow's collection | Marcus owns the need. **"Has not received the changed instructions" is not authored**: Marcus perceived neither the depot event nor R-17. |
| `NEGATIVE_DISCREPANCY` | negative | Two claims on one question: R-17's body says 6 crates; L-42's body says 8. The actual count comes from `R17_COUNT_CAUSE` | The player has read both claims. The notebook shows them side by side; the player takes no stance. |
| `RECORD_ASSERTION` | negative | Marcus READ L-42 (backstory, rank 3); later a backstory `STATEMENT`, Marcus to the player: "the intake is reconciled" | Marcus BELIEVES 8 via R1. The player has a TOLD perception of Marcus saying it. |

### The headline assertion

In the positive seed, Marcus's belief about tomorrow's collection must come out UNKNOWN, **with no line anywhere saying so**. It follows only from the fact that he was not present at the depot event and has not been shown R-17's body. If this passes, the model is deriving knowledge rather than storing it.

## Marcus conformance: moves and current state

Every move becomes world events, and today's lore fields become projections of derived beliefs. The right-hand column is what the new model must reproduce exactly.

### Moves

| Move | World events | Resulting beliefs | Must reproduce |
| --- | --- | --- | --- |
| `VERIFY_SOURCE` | `DOCUMENT_PRESENTED` R-17 \[header, signature\] to Marcus | Marcus: `ISSUED_BY(R-17, depot)` BELIEVED, rank 3, by rule V1; from seeing it shown, that the player holds R-17. If the body was already shown, R6 re-ranks it. | `source = CHECKED`; evidence `SOURCE_VERIFIED`; Marcus knows `DIRECT_RECEIPT`; late check sets `content = DOCUMENT_SUPPORTED` and, negative, `record = DISPUTED`. |
| `PROBE_USEFULNESS` | `STATEMENT` player to Marcus, private claim at CATEGORY; `STATEMENT` Marcus to player, his reply | Marcus: an exposure record that the player told him a claim of this category. Player: a TOLD perception of his reply about his need (positive) or his reliance on L-42 (negative). | `disclosure` NONE → PARTIAL; `relevance = POSSIBLY_USEFUL` or `NOT_ESTABLISHED`; evidence `RELEVANCE_OBSERVED` or `RELEVANCE_UNCERTAIN`. |
| `QUESTION_RECORD` | `STATEMENT` pair: the challenge at CATEGORY; Marcus's "signed off, but a specific discrepancy can be checked" | Marcus: exposure record at CATEGORY. Player: a TOLD perception of that reply. | Hint effects; evidence `RECORD_QUESTIONED`. |
| `DISCLOSE_PARTIAL` | `STATEMENT` at CATEGORY | Marcus: exposure record at CATEGORY. | `disclosure = PARTIAL`. |
| `DISCLOSE_FULL` | `DOCUMENT_PRESENTED` R-17 \[body\] | Marcus READ the body, EXACT: rank 3 if he believes R-17 authentic, else rank 1. Positive: R1. Negative: conflicts with L-42, so R4 (DISPUTED) or R5 (`challenged`). | `disclosure = FULL`; `content = DOCUMENT_SUPPORTED` or `RECEIVED_UNVERIFIED`; negative `record = DISPUTED` or `CHALLENGED_UNVERIFIED`. |
| `DEAL` | `STATEMENT` of the proposal; with `OFFER_INFORMATION`, the private claim at CATEGORY | With information: Marcus exposure record at CATEGORY. The offer itself stays encounter state. | Hint effects when information is attached. |
| `ACCEPT` | `TRANSACTION` (cash, Contra, new principal); with an exchange, `DOCUMENT_PRESENTED` R-17 \[body\]; both in one `commitGroup`; then `ENCOUNTER_CLOSED` | With an exchange: Marcus READ the body, rank 3. | `status = AGREED`; metrics and obligations; `disclosure = FULL`; `content = DOCUMENT_SUPPORTED`. |
| `SMALL_TALK`, `ACK_MISSED`, `TERMS`, `DEBT`, `RISK`, `PRIORITIES`, `FINAL_SAY`, `GUARANTEE`, `ENTITLEMENT`, `CLARIFY_OFFER` | `STATEMENT` pair | Only the statements' own claims. `GUARANTEE` is HYPOTHETICAL. | No lore change; social effects stay in the encounter. |
| `WALK`, or Marcus ending the talk | `ENCOUNTER_CLOSED` | None. | Final status and metrics. |

`DISCLOSE_FULL` is modelled as showing R-17's body, not saying it aloud. That is what makes the current `DOCUMENT_SUPPORTED` versus `RECEIVED_UNVERIFIED` split fall out of the ranking: a checked document is rank 3, an unchecked one rank 1.

### Today's fields as projections

| Current field | Values | Projection of |
| --- | --- | --- |
| `knowledge.player` | fact ids | Claims in the player's perception records, at EXACT. |
| `knowledge.marcus` | fact ids | Marcus's first-order EXACT beliefs. |
| `knowledge.marcusAwarePlayerKnows` | fact ids | Marcus's exposure view of the player, at any resolution. |
| `disclosure` | NONE, PARTIAL, FULL | Marcus on the private claim: nothing; exposure at CATEGORY only; Marcus holds it at EXACT. |
| `beliefs.source` | UNCHECKED, CHECKED | Marcus's stance on `ISSUED_BY(R-17, ?)`. |
| `beliefs.content` | UNKNOWN, RECEIVED\_UNVERIFIED, DOCUMENT\_SUPPORTED | Marcus on R-17's body question: none; rank 1; rank 3. |
| `beliefs.record` | NOT\_APPLICABLE, RECONCILED\_CLAIM, CHALLENGED\_UNVERIFIED, DISPUTED | Marcus on `the intake crate count`: question absent; BELIEVED from L-42; `challenged`; DISPUTED. |
| `beliefs.relevance` | UNTESTED, POSSIBLY\_USEFUL, NOT\_ESTABLISHED | **The player's** perception of Marcus's reply: none; a reply showing a use; a reply showing none. |
| `evidence` | SOURCE\_VERIFIED, RELEVANCE\_OBSERVED, RELEVANCE\_UNCERTAIN, RECORD\_QUESTIONED | Specific perception records: Marcus's READ of R-17's authenticating parts; the player's TOLD records of Marcus's replies. |
| `progressKeys` | strings | Not a projection. Stays encounter-local. |

## Pass criteria

The model passes when all eleven checks hold on every golden run and all 290 existing tests stay green.

**Golden runs (17)**, from `docs/marcus-lore-v01/SCENARIO_RESULTS.json`:

- 11 named scenarios: `positiveWithoutExchange`, `positiveWithExchange`, `positiveEarlyGiveaway`, `negativeWithOpening`, `negativeWithoutOpening`, `negativeBacklash`, `negativeExpired`, `sixExchangeLateConcession`, `directCredit`, `limitedCashPurchase`, `worsenedRiskRegression`.
- 6 `allCombinationRoutes`: each information variant with each quirk.

The two 8–9-turn playthroughs recorded during the 2026-09-29 review should be added as fixtures too; today they exist only in that session.

| Check | Passes when |
| --- | --- |
| C1 Projection | At every turn of every golden run, each field in "Today's fields as projections" equals the recorded value. |
| C2 Outcome | Status, metrics, obligations, reply family, face preset and slot operations are byte-identical to today, using a neutral player BASED profile. |
| C3 Headline | In every positive seed, Marcus is UNKNOWN on tomorrow's collection until R-17's body is shown, and no authored record states his ignorance. |
| C4 No plumbing | No code writes to a knowledge list; `lore.beliefs` is no longer stored. |
| C5 No leaks | Changing any event nobody in the encounter perceived (such as the `R17_COUNT_CAUSE` variant) changes no projection, menu, reply or face. |
| C6 Four readers | Player-eligibility code reads only the player's perception records and holdings; NPC response code reads only that NPC's beliefs, attitudes, exposure view and policy; the world engine affects play only by emitting events. |
| C7 Replay | Rebuilding all beliefs from the ledger alone equals the live state, byte for byte. |
| C8 Seed compatibility | Every golden seed gets the same information variant and quirk as today. |
| C9 Worlds | All 12 combinations of world variants and profile variants validate, each with at least one successful two-Contra route. |
| C10 No player beliefs | No stance, rank, trust or attitude exists for the player. The player's BASED profile is read only when a statement's landed delivery is computed. |
| C11 Single source | No hard keyword appears in any event's happened list; every conflict question is derived from a keyword's value slot; every attitude, activity and possession comes from an event; no perception record has a BACKSTORY channel. |

## Paper group scene: a third person at the counter

The format handles three people without changes, and the walkthrough found one missing rule (P6b, now added). This scene is a paper test only; it is not part of the Marcus build.

**Setup (negative seed).** Dee, a hypothetical runner, waits at Marcus's counter. Dee is within earshot but has no sightline to the counter top where R-17 is shown.

| Step | Event | Marcus | Dee |
| --- | --- | --- | --- |
| 1. Player probes usefulness | `STATEMENT` at CATEGORY: "a count mismatch on paper" | TOLD (P4): the player holds a count-mismatch claim | HEARD (P5): the same, at CATEGORY |
| 2. Player checks the source | `DOCUMENT_PRESENTED` R-17 \[header, signature\]; sightline: Marcus | READ (P6): R-17 is genuine, rank 3 | SEEN (P6b): the player showed Marcus a paper. Nothing about its contents. |
| 3. Player shows the exact line | `DOCUMENT_PRESENTED` R-17 \[body\]; sightline: Marcus | READ: 6 crates, against L-42's 8, so DISPUTED (R4) | SEEN (P6b) only |
| 4. Marcus replies | `STATEMENT`: "That count needs checking" | Speaker | HEARD: Marcus's count is in question, rank 1 |

**Where everyone ends up**

| Question | Player | Marcus | Dee |
| --- | --- | --- | --- |
| Crates on this intake | Has read both; no stance | DISPUTED | BELIEVED "Marcus's count is in question", rank 1, CATEGORY |
| Is R-17 genuine? | Has seen its header and signature | BELIEVED | UNKNOWN; saw a paper, not its header |
| Exposure | None; the human can see Dee in the room | The player holds the exact claim | The player holds some count claim |

**What the paper test found**

- Audience, earshot and sightline must be separate per-event lists. The v1 format already has them.
- Seeing the act of showing a document is different from reading it. That gap is now rule P6b.
- The player has no beliefs to update: the human sees Dee in the room and decides what that means. Whether NPC speakers should infer who overheard them is an open question below.
- Dee now holds a rank-1 belief that could travel. That is the first real input for news passes, designed once the Marcus conformance build passes.

## Open questions and deferred items

None of these block the Marcus conformance build. The vocabulary and `AGENTS.md` questions are settled under Decisions.

| Question | Why it matters | Needed by |
| --- | --- | --- |
| Should an NPC speaker infer who may have overheard them? | An inferred "may have heard" exposure record would let characters guard what they say. | Group scenes |
| Which encounter results leave a lasting mark? | Confidence and tension are encounter-local. `An ATTITUDE_SET` at close would let "Marcus trusts you less" carry forward. | Persistent world |
| News passes: when, between whom, and what spreads? | Dee's rank-1 belief has nowhere to go yet. | After the Marcus conformance build passes |
| When do `clarity` and `sourceReliability` become real fields? | Reserved by Law 10 until a rule reads them. | Partial perception; unreliable sources |
| World clock | v1 orders events by `seq` with labels such as "yesterday" and "last week". A real clock is deferred. | Time and news passes |
| Multi-party encounter mechanics | The ledger and perception already handle groups; bargaining stays one-on-one in v1. | Trapstar group scenes |
| Settling hypothetical claims | "Profits are guaranteed" could later be proved or broken by events. | Consequences across encounters |
| Saving the ledger | The standalone build keeps state only in page memory. A save format is undecided. | Persistent world |
| Player effectiveness: 5 cue dials or 20 vibe values? | Five dials are quick to author, and each vibe derives from its two cues. Twenty values allow exceptions. | Player profile |
| Can low effectiveness misfire, or only weaken? | A clumsy Deception attempt could land as a different vibe. That changes what listeners perceive, not just how strongly. | Player profile |
| Is the player's profile fixed, or does it grow? | Growth makes BASED a progression system; fixed makes it a character choice. | Player profile |
