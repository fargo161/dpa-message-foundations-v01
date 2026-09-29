# Marcus World-Model Conformance Implementation Plan

**Codex agentic-team execution contract**  
**Target:** current Marcus Encounter source repository  
**Architecture:** Trapstar World Event Format v0.1.3  
**Primary objective:** migrate Marcus from hand-maintained lore/knowledge state to the general Trapstar world-event model **without changing current player-facing encounter behavior**.

---

## 0. Executive directive to Codex

This is an implementation mission, not another architecture-design pass.

Use the **existing current Marcus repository** as the source of truth. Do **not** create a fresh independent repository. Work in a new branch/worktree from the verified current Marcus HEAD so the present encounter remains the regression oracle.

The mission succeeds only when both statements are true:

1. **Marcus behaves exactly as the current accepted build behaves on the conformance corpus.**
2. **That behavior is now produced from the world ledger → perceptions → NPC beliefs/exposure architecture, not from mutable knowledge/belief lists or hidden seed reads.**

The implementation must satisfy the v0.1.3 World Event Format and pass conformance checks **C1–C11**. Do not expand the scope into news passes, a world clock, Room Creator visibility, offscreen simulation, persistent world saves, group bargaining, general NPC AI, or a new dialogue-generation system.

### Absolute boundaries

- No fresh standalone repo.
- No destructive Git reset/clean/checkout of unrelated work.
- No push, merge, deployment, or public tunnel unless the owner separately requests it.
- No new gameplay meters.
- No new player belief/stance/trust/attitude model.
- No change to TPL authority: TPL remains presentation-only and does not resolve Marcus mechanics.
- No redesign of the Marcus economy, offer rules, patience, dialogue families, face policy, BASED reaction table, or current quirk behavior unless necessary to restore proven regression equivalence.
- No hand-maintained `knowledge.player`, `knowledge.marcus`, `marcusAwarePlayerKnows`, or `lore.beliefs` authority after migration.
- No runtime decision may branch on hidden world truth when the relevant reader is the player or Marcus.
- Do not weaken tests merely to make the migration pass.

---

# 1. Canonical inputs and authority order

Use these in descending authority:

1. **Owner-approved architecture:** `Trapstar World Event Format v0.1.3`.
2. **Verified current Marcus source at mission start:** the actual repository HEAD after preflight.
3. **Current executed regression behavior:** existing tests plus a new frozen baseline oracle captured before migration.
4. **Current architecture contracts and lore documents:** especially:
   - `AGENTS.md`
   - `docs/marcus-lore-v01/CURRENT_BUILD_FILE_MAP.md`
   - `docs/marcus-lore-v01/INTEGRATION_CONTRACT.md`
   - `docs/marcus-lore-v01/SCENARIO_RESULTS.json`
   - `docs/architecture/PHASE_2_EXTENSION_POINTS_V01.md`
5. Historical notes and prior reports are evidence, not permission to override current executable behavior.

The reviewed standalone package showed the important current seams:

- `src/encounter/history-content.mjs` — authored lore entries and initial knowers/believers.
- `src/encounter/knowledge.mjs` — seeded information variant, current knowledge/belief inventory, eligibility, player-safe projection.
- `src/encounter/information-policy.mjs` — directly mutates lore knowledge/belief/disclosure/evidence state today.
- `src/encounter/state.mjs` — initializes lore.
- `src/encounter/engine.mjs` — authoritative transition and settlement integration.
- `src/encounter/marcus-profile.mjs` — current seeded quirk and Marcus personality/profile.
- `src/encounter/marcus-policy.mjs` — Marcus deterministic response policy.
- `src/conversation/keyword-bank.mjs` — player-visible topic gating that currently consumes lore facts.
- `tests/encounter-knowledge-unit.test.mjs`, `encounter-information.test.mjs`, `encounter-lore-adversarial.test.mjs`, and related conversation tests — current behavioral evidence.

Do not assume the packaged copy is newer than the actual repo. Preflight must establish that.

---

# 2. Repository and worktree strategy

## 2.1 Use the current repository, not a fresh repo

The conformance test depends on comparing the migrated engine to the exact current Marcus implementation. A clean-room repository would weaken that guarantee and encourage accidental reimplementation.

Create an isolated branch/worktree from the verified current Marcus HEAD, recommended name:

`codex/marcus-world-model-conformance-v01`

Recommended worktree label:

`work/marcus-world-model-conformance`

If Codex supports independent agent worktrees, specialists may use child branches/worktrees and merge into the mission branch. If not, use one worktree with strict file ownership and serialize overlapping edits.

## 2.2 Preflight commands

The lead must record, before changing anything:

```text
git remote -v
git branch --show-current
git rev-parse HEAD
git status --short
git log -n 8 --oneline --decorate
node --version
npm --version
```

Then run the existing repository gates exactly as currently defined:

```text
npm ci
npm test
npm run lint
npm run typecheck
npm run schema:validate
npm run build
node scripts/check-generated.mjs
```

If any gate fails at baseline, do not silently repair it inside the world-model migration. Record whether it is:

- an existing baseline failure,
- an environment/setup failure,
- a real blocker to conformance.

Only continue if the baseline is sufficiently reproducible to build a trustworthy oracle.

## 2.3 Baseline checkpoint

Before product migration edits, create a clean checkpoint commit containing only:

- the frozen v0.1.3 architecture document under the new world-model docs directory;
- the conformance plan;
- the baseline oracle fixtures/harness described below;
- documentation of the verified baseline SHA and gate results.

No production behavior changes belong in this checkpoint.

---

# 3. Frozen scope

## 3.1 In scope

Implement only what Marcus conformance needs:

1. World event envelope + typed payloads.
2. Append-only event ledger and atomic commit groups.
3. World projections needed by Marcus:
   - hard state,
   - possession,
   - activities,
   - NPC attitudes.
4. Claims and canonical questions.
5. Document parts and source authentication rule V1.
6. Perception rules P1–P8.
7. NPC derived beliefs R1–R6.
8. NPC exposure view.
9. Backstory compilation into ordinary events/perceptions.
10. World open truths required by Marcus.
11. NPC profile support required by Marcus, including `recognizes` and the existing seeded quirk.
12. Marcus world fixture/history compilation.
13. Marcus adapter that projects current legacy concepts from the new model.
14. Rewiring player eligibility and Marcus responses to obey the four-reader rule.
15. Full C1–C11 conformance suite.
16. Existing build/test/schema/generated-artifact compliance.

## 3.2 Explicitly deferred

Do not implement:

- news/gossip passes;
- real calendar/world clock;
- Room Creator sightline/proximity import;
- automatic offscreen NPC life;
- persistent save-file format;
- dynamic profile growth;
- multi-party bargaining mechanics;
- generic city/world simulation;
- `clarity` or `sourceReliability` unless a conformance rule actually needs them;
- player belief inference;
- deeper beliefs-about-beliefs;
- new TPL runtime authority;
- new Marcus lines or encounter redesign;
- additional open truths not required for R-17 conformance.

---

# 4. Success contract: C1–C11

The team must implement the owner-approved checks as executable tests, not prose claims.

| ID | Required proof |
| --- | --- |
| **C1 Projection** | At every turn of every frozen golden run, the migrated projections equal the pre-migration oracle for the legacy knowledge/disclosure/source/content/record/relevance/evidence fields. |
| **C2 Outcome** | Status, seven metrics, obligations, reply family, face preset/slot operations, accepted terms, and terminal result are byte-identical or normalized-byte-identical where transport-only IDs are excluded. |
| **C3 Headline** | In every positive R-17 seed, Marcus is UNKNOWN on the changed collection detail until he perceives the body. No authored `Marcus does not know X` record exists. |
| **C4 No plumbing** | Runtime code does not write knowledge lists or `lore.beliefs`; the old mutable authority is removed. |
| **C5 No leaks** | Changing a world event that no encounter participant perceived changes no player menu, Marcus reply, face, eligibility, or subjective projection. |
| **C6 Four readers** | Player eligibility reads only player perceptions/holdings. Marcus reads only his beliefs, attitudes, exposure, profile/policy. World engine reads authoritative world state and acts by emitting events. Debug/validation may inspect truth but cannot leak it into Play. |
| **C7 Replay** | Rebuilding projections from ledger + fixed profiles produces the same derived state as the live runtime, byte for byte. |
| **C8 Seed compatibility** | Every existing golden seed selects the same R-17 information variant and Marcus quirk as before. Reuse the legacy hashes; do not introduce seed splitting during migration. |
| **C9 Worlds** | All 12 Marcus world/profile combinations validate and each has at least one successful two-Contra route. |
| **C10 No player beliefs** | No player stance/rank/trust/attitude structure exists. Player BASED effectiveness is read only to compute statement delivery. |
| **C11 Single source** | Hard state exists only through transaction hard effects; conflict questions are derived from keyword value slots; attitudes, activities and possession come from events; no BACKSTORY perception channel exists. |

No agent may redefine these criteria to fit its implementation.

---

# 5. Baseline oracle: build before migration

This is the most important procedural protection in the mission.

## 5.1 Freeze current behavior first

Before changing runtime source, replay every current golden scenario from:

`docs/marcus-lore-v01/SCENARIO_RESULTS.json`

The current corpus identifies 17 golden runs:

- 11 named scenarios;
- 6 information-variant × quirk combination routes.

Create a deterministic baseline fixture, recommended path:

`tests/fixtures/marcus-world-model-baseline-v01.json`

Each run should record:

- verified baseline SHA;
- seed;
- current information variant;
- current quirk;
- ordered intent sequence;
- each turn's normalized player-facing projection;
- each turn's required legacy lore projection fields;
- status;
- seven metrics;
- obligations;
- current/counteroffer identity and terms where applicable;
- reply family;
- face preset and slot operations;
- disclosure/source/content/record/relevance/evidence;
- final terminal result.

Exclude only values proven to be transport noise, such as random request IDs. Document every normalization.

## 5.2 Freeze the oracle against self-rewriting

After the baseline fixture is generated:

- hash it;
- commit it before migration;
- migration code must never regenerate/overwrite it during normal test runs;
- the migrated implementation reads it only as an expected result.

The baseline capture script may remain as a historical/repro tool but must require an explicit command to overwrite the oracle.

## 5.3 Two review playthroughs

The Sept. 29 review mentions two 8–9-turn patience-ending runs but the supplied review summary does not contain their full turn sequences. Do **not invent them**.

If exact sequences can be recovered from an authoritative log, add them as fixtures. Otherwise write a one-line blocked note in the conformance report and proceed with the 17 reproducible golden runs.

---

# 6. Target runtime shape

The final runtime should conceptually look like this:

```text
Encounter intent
     │
     ├─────────────── encounter-local mechanics
     │                confidence / tension / patience
     │                proposals / counters / progress keys / opening window
     │
     ▼
World event(s)
     │
     ▼
Append-only ledger
     │
     ├──► world projections
     │     hard state / possession / activities / attitudes
     │
     └──► perception generator P1–P8
              │
              ├──► player perception + holdings view
              │
              └──► NPC belief projector R1–R6
                       │
                       ├──► Marcus beliefs
                       └──► Marcus exposure view

Marcus adapter
     │
     ├──► current player-safe lore projection
     ├──► current Marcus information policy inputs
     └──► current face/language/policy behavior
```

## 6.1 Authoritative state

Prefer authoritative runtime state shaped around:

```text
state.world.events          # authority
state.informationLocal      # encounter-only progress/opening data
state.metrics               # existing encounter metrics
state.offer/counteroffer    # existing bargaining state
state.profileVariant        # fixed profile selection or profile reference
```

Perceptions, beliefs, exposure, possession, activity and attitudes may be cached for performance only if replay tests prove they are derived and disposable. For Marcus v1, recomputation is preferred over introducing cache invalidation complexity.

## 6.2 Legacy compatibility

Do not keep old mutable lore authority merely to preserve field names.

Instead provide projections/adapters for existing consumers. It is acceptable for a compatibility function to return legacy-shaped fields such as:

- source = CHECKED/UNCHECKED;
- content = UNKNOWN/RECEIVED_UNVERIFIED/DOCUMENT_SUPPORTED;
- record = RECONCILED_CLAIM/CHALLENGED_UNVERIFIED/DISPUTED;
- relevance = UNTESTED/POSSIBLY_USEFUL/NOT_ESTABLISHED;
- disclosure = NONE/PARTIAL/FULL;
- evidence labels.

Those values must be recomputed from the world model every time.

---

# 7. Recommended module layout

Use existing repository conventions. The exact filenames may be adjusted by the lead before coding, but ownership and responsibilities must remain separated.

Recommended new area:

```text
src/world/
  event-contract.mjs
  event-validator.mjs
  ledger.mjs
  claims.mjs
  projections.mjs
  perception.mjs
  beliefs.mjs
  exposure.mjs
  backstory.mjs
  open-truths.mjs
  profiles.mjs
```

Marcus-specific authored world setup should remain out of the generic core, recommended:

```text
src/encounter/marcus-world.mjs
src/encounter/marcus-world-adapter.mjs
```

Recommended schemas:

```text
schemas/world-event.schema.json
schemas/world-claim.schema.json
schemas/world-profile.schema.json
schemas/world-open-truth.schema.json   # only if represented as data in v1
```

Recommended new docs:

```text
docs/world-model/TRAPSTAR_WORLD_EVENT_FORMAT_V0_1_3.md
docs/world-model/MARCUS_WORLD_MODEL_CONFORMANCE_IMPLEMENTATION_PLAN.md
docs/world-model/MARCUS_WORLD_MODEL_INTERFACE_CONTRACT_V01.md
docs/world-model/MARCUS_WORLD_MODEL_BASELINE.md
docs/world-model/MARCUS_WORLD_MODEL_IMPLEMENTATION_REPORT.md
docs/world-model/MARCUS_WORLD_MODEL_CONFORMANCE_REPORT.md
```

Historical `docs/marcus-lore-v01/` records should not be rewritten as though they always described the new system. Add forward links if necessary; preserve history.

---

# 8. Codex agentic team

Use one lead and five specialists. No nested delegation by specialists.

## Lead — Integration authority

### Mission
Own repository verification, interface freeze, task ordering, shared-file edits, merges, final validation and owner-facing report.

### Exclusive files/surfaces

- `AGENTS.md`
- shared package/build/test registration files such as `scripts/test-portable.mjs` when multiple agents need registration;
- `docs/world-model/MARCUS_WORLD_MODEL_INTERFACE_CONTRACT_V01.md`;
- final implementation and conformance reports;
- merge conflict resolution.

### Contract

- Establish the baseline SHA and branch/worktree.
- Keep the v0.1.3 architecture frozen unless an implementation contradiction truly blocks C1–C11.
- Freeze interfaces between specialists before parallel coding.
- Reject out-of-scope improvements.
- Never solve a failing conformance test by altering the oracle unless baseline capture is proven wrong.
- Preserve unrelated current changes.

### Lead completion evidence

- baseline/preflight record;
- ownership map;
- integrated commit list;
- final C1–C11 matrix;
- final Git status and unpushed/pushed state.

---

## Agent A — Baseline Oracle & Regression Cartographer

### Mission
Capture the current Marcus implementation as an executable oracle **before migration** and map every old lore field/read/write to its required new source.

### May edit

- `tests/fixtures/marcus-world-model-baseline-v01.json`
- new baseline capture/test files;
- `docs/world-model/MARCUS_WORLD_MODEL_BASELINE.md`
- no production runtime source.

### Must inspect

- `docs/marcus-lore-v01/SCENARIO_RESULTS.json`
- current scenario-driving tests;
- `src/encounter/knowledge.mjs`
- `src/encounter/information-policy.mjs`
- `src/encounter/engine.mjs`
- `src/encounter/state.mjs`
- current face/reply-family outputs.

### Required deliverables

1. Frozen per-turn oracle for all reproducible golden runs.
2. Table mapping every current mutable field and every hidden truth read to the v0.1.3 replacement.
3. Search report for:
   - `lore.knowledge`
   - `lore.beliefs`
   - `initialKnowers`
   - `initialBelievers`
   - direct `lore.variant` reads
   - `LEDGER_CLOSING`, `PICKUP_NEED`, `QUESTION_RECORD`, `grounded` gates.
4. Baseline gate results and exact SHA.

### Forbidden

- no behavior changes;
- no world-model implementation;
- no rewriting expected outputs after migration.

---

## Agent B — World Contract, Ledger & Objective Projections

### Mission
Implement the generic objective world kernel and schema boundary without touching Marcus encounter behavior.

### Owns

- `src/keywords.mjs` changes required by v0.1.3;
- `schemas/keyword.schema.json` value-slot contract change;
- new world event/claim schemas;
- `src/world/event-contract.mjs`;
- `src/world/event-validator.mjs`;
- `src/world/ledger.mjs`;
- `src/world/claims.mjs`;
- `src/world/projections.mjs`;
- related unit/schema tests.

### Required implementation

1. Add approved keywords:
   - `ISSUED_BY(document, issuer)`
   - `HAS_ATTRIBUTE(subject, registeredAttribute, typedValue)`
2. Expand the keyword graph from 14 to 16 under the repo's extension procedure.
3. Add keyword `valueSlot` metadata and canonical question derivation.
4. Define the v0.1.3 event envelope and 13 typed payloads.
5. Make hard-state placement structurally impossible outside `TRANSACTION.hardEffects`.
6. Make occurrence propositions structurally limited to `OCCURRENCE.happened`.
7. Implement deterministic event IDs and total `seq` ordering.
8. Implement atomic `commitGroup` append behavior.
9. Implement objective projections for:
   - hard resources/obligations;
   - document possession;
   - active activities;
   - current NPC attitudes.
10. Implement validators including at minimum:
   - `DOCUMENT_READ`: reader possesses document;
   - `DOCUMENT_PRESENTED`: holder possesses document;
   - audience/sightline/earshot IDs must be present where required;
   - statement speaker is present;
   - activity end references an active start;
   - attitude assertion holder matches payload holder;
   - deterministic duplicate/event-ID protections.

### Authentication schema detail

Authenticating document parts require machine-readable identifiers. Use a stable field such as `markId`; profiles must compare stable IDs, never display labels.

Example concept:

```text
partId: "r17_signature"
authenticating: true
markId: "DEPOT_CLERK_SIGNATURE"
```

### Forbidden

- do not edit `src/encounter/information-policy.mjs`, `knowledge.mjs`, `state.mjs`, or `engine.mjs`;
- do not introduce NPC belief logic;
- do not change Marcus quirk selection.

### Handoff gate

Agent B must provide a small API/interface handoff to the lead and Agent C before subjective-state integration begins.

---

## Agent C — Perception, Belief, Exposure & Profile Projector

### Mission
Implement the generic subjective-state layer that consumes the world kernel and fixed profiles.

### Owns

- `src/world/perception.mjs`
- `src/world/beliefs.mjs`
- `src/world/exposure.mjs`
- `src/world/backstory.mjs`
- `src/world/open-truths.mjs`
- `src/world/profiles.mjs`
- related focused tests.

### Required implementation

1. Implement P1–P8 exactly.
2. Formalize P1 participant semantics:
   - participant = entity named by a payload participant-role field and present in `presentIds`;
   - explicit access if supplied, otherwise all perceptible aspects of the act;
   - `ALL` never reveals object contents.
3. Implement statement audience versus earshot separately.
4. Implement shown-document READ versus P6b act-seen distinction.
5. Implement document transfer as possession only; no content perception.
6. Implement source check rule V1 using:
   - all authenticating parts read;
   - stable `markId` recognition in fixed NPC profile;
   - no truth lookup;
   - rank 3 for checked-document claims.
7. Implement ranking:
   - 4 SEEN directly;
   - 3 READ checked document;
   - 2 TOLD by trusted NPC;
   - 1 ordinary TOLD/HEARD/unchecked document;
   - 0 INFERRED.
8. Implement R1–R6 first-match revision rules.
9. Implement exposure as who the NPC knows was told/heard/read a claim—not what that other person believes.
10. Ensure no player derived-belief structure exists.
11. Compile backstory shortcuts into ordinary events and ordinary perception channels; no BACKSTORY perception channel.
12. Implement open-truth resolution needed by Marcus.
13. Implement fixed profile support, including `recognizes`.

### Mandatory adversarial unit tests

- genuine but unrecognized document stays rank 1/UNKNOWN authenticity;
- forged mark that an NPC recognizes can create a false authenticity belief without altering truth;
- reading authenticating parts does not expose body claims;
- P6b observer sees presentation but receives no document claim;
- holder can possess a document without reading it;
- same ledger replay recreates identical beliefs;
- player receives perceptions only;
- exposure never becomes another person's belief.

### Forbidden

- no Marcus encounter-policy edits;
- no player belief model;
- no news propagation;
- no world clock;
- no weighted trust math beyond v0.1.3 ranks.

---

## Agent D — Marcus World Fixture, Adapter & Encounter Migration

### Mission
Replace the old Marcus lore authority with world-model events/projections while preserving the existing encounter's externally observable behavior.

### Exclusive authority over existing behavior files

This agent is the **only specialist** permitted to edit the main encounter behavior surfaces unless the lead approves a narrow handoff:

- `src/encounter/history-content.mjs`
- `src/encounter/knowledge.mjs`
- `src/encounter/information-policy.mjs`
- `src/encounter/state.mjs`
- `src/encounter/engine.mjs`
- `src/encounter/marcus-profile.mjs`
- `src/encounter/marcus-policy.mjs` only if required for reader-boundary rewiring
- `src/conversation/keyword-bank.mjs` only for player-safe eligibility rewiring
- new `src/encounter/marcus-world.mjs`
- new `src/encounter/marcus-world-adapter.mjs`

### Required migration

#### A. Compile the 10 current lore facts into world history

Map them exactly as v0.1.3 specifies:

- `OLD_ACCOUNT` → backstory `TRANSACTION` hard effects.
- `STOCK_TITLE` → backstory acquisition hard effects.
- `MISSED_CHECKIN` → `COMMITMENT_MADE` + `COMMITMENT_WINDOW_CLOSED`.
- `SHARED_LOADING_SHIFT` → backstory `OCCURRENCE`.
- `DIRECT_RECEIPT` → `DOCUMENT_ISSUED` + `DOCUMENT_TRANSFERRED` + player `DOCUMENT_READ`.
- `LEDGER_CLOSING` → private `ACTIVITY_STARTED`.
- `POSITIVE_ROUTE` → seeded depot occurrence + R-17 body claim.
- `PICKUP_NEED` → backstory `ATTITUDE_SET` + activity as specified.
- `NEGATIVE_DISCREPANCY` → conflicting R-17/L-42 claims; world count comes from seeded cause.
- `RECORD_ASSERTION` → Marcus reads checked L-42 and makes the prior statement to the player.

Do not author Marcus's ignorance. It must emerge from missing perception.

#### B. Preserve legacy seed behavior

Do not invent new seed splitting.

Use the existing encounter seed through the existing algorithms:

```text
existing marcus-information-v1 hash → world R-17 information variant
existing selectQuirk hash            → Marcus profile variant
```

Add `R17_COUNT_CAUSE` deterministically in the world open-truth domain without changing any current visible behavior.

`MARCUS_QUIRK` is profile configuration, not a world event.

#### C. Replace current stored lore authority

Remove runtime authority from:

- `knowledge.player`;
- `knowledge.marcus`;
- `knowledge.marcusAwarePlayerKnows`;
- `lore.beliefs`;
- stored `disclosure` where it can be derived;
- stored `evidence` where it can be derived.

Keep public/helper APIs stable where useful, but make them project from the world model.

Recommended strategy:

- introduce the new world-backed state alongside old code only temporarily;
- compare old/new projections in tests during migration;
- once parity is proven, remove the old mutable authority;
- retain a `projectLore(state)` compatibility surface for UI/tests if useful.

#### D. Rewire the four known hidden-information leaks

Player menu/eligibility must not read:

- `LEDGER_CLOSING` as private Marcus knowledge;
- `PICKUP_NEED` directly;
- `variant === NEGATIVE`;
- authoritative world facts for the negative opening.

Spec-required replacements:

- probe eligibility from player-held private information;
- information-offer eligibility from the player's observed Marcus reply/evidence;
- `QUESTION_RECORD` from player perceptions of Marcus's reconciled claim plus the conflicting document claim;
- Marcus response from Marcus's own need/belief state;
- negative opening groundedness from Marcus's derived beliefs, not truth.

#### E. Convert encounter actions to world events

At minimum:

- every player/NPC statement → `STATEMENT`;
- source/body reveal → `DOCUMENT_PRESENTED`;
- accepted settlement → `TRANSACTION`;
- accepted information exchange → `DOCUMENT_PRESENTED` in the same `commitGroup` as settlement;
- terminal exit/agreement → `ENCOUNTER_CLOSED`.

Each encounter turn record gains `worldEventIds`.

#### F. Preserve encounter-local mechanics

Do not migrate these into world truth during this mission:

- confidence;
- tension;
- patience;
- proposal/counter lifecycle;
- progress keys;
- negative opening window;
- score contribution;
- reply-family selection;
- face state.

They may read the permitted subjective projections but remain encounter-local.

### Forbidden

- no language polish;
- no economy rebalance;
- no new quirk;
- no general world features;
- no retained hidden compatibility write to old lore authority after final gate.

---

## Agent E — Independent Conformance & Adversarial Verifier

### Mission
Prove the integrated implementation satisfies C1–C11 and that equivalence was not achieved by retaining the old architecture underneath.

### May edit

- new conformance/adversarial test files;
- conformance report;
- test-only helpers/fixtures.

### Must not edit

- production runtime source;
- golden baseline oracle expected values.

### Required test families

#### Behavioral oracle

- replay every frozen baseline run;
- compare every turn;
- compare final states;
- compare reply family and face state;
- compare exact obligations and settlement.

#### Architecture enforcement

Static and dynamic checks for:

- no writes to `lore.knowledge`;
- no stored `lore.beliefs` authority;
- no BACKSTORY perception channel;
- no player belief/stance/rank/trust/attitude;
- no `variant` branch in player eligibility;
- no hidden world-truth read by Marcus policy where a belief should be used;
- no hard-state mutation outside transactions;
- replay equality.

#### Hidden-event mutation

Modify only `R17_COUNT_CAUSE` or another imperceptible event while preserving all perceived events. Assert player menus, Marcus responses, faces and subjective projections remain identical.

#### 12-combination matrix

Validate:

- positive world × 3 quirks;
- negative/clerical × 3 quirks;
- negative/runner-shorted × 3 quirks;
- negative/depot-miscount × 3 quirks.

Each combination requires at least one successful two-Contra route, but the verifier must not invent a new victory score.

#### Atomic settlement

Prove a failed event in an ACCEPT commit group applies neither the hard transaction nor the information presentation.

#### Perception boundary

Prove:

- possession ≠ reading;
- presentation act ≠ document contents;
- player menu cannot gain options from unperceived facts;
- Marcus cannot respond to R-17 body before perception;
- source verification upgrades support but does not change truth.

### Deliverable

`docs/world-model/MARCUS_WORLD_MODEL_CONFORMANCE_REPORT.md`

For every C1–C11 mark:

- PASS / FAIL / BLOCKED;
- command/test evidence;
- relevant files;
- unresolved risk.

No specialist may self-certify its own implementation in place of Agent E.

---

# 9. File ownership matrix

The lead should freeze this before parallel execution.

| Surface | Owner | Others |
| --- | --- | --- |
| `AGENTS.md` | Lead | read-only |
| `src/keywords.mjs`, keyword schema | B | C/D read |
| event/ledger/claims/objective projections | B | C/D consume |
| perception/beliefs/exposure/backstory/profiles | C | D consumes |
| existing encounter behavior files | D | A/E read-only |
| baseline oracle fixture | A | everyone read-only after freeze |
| conformance tests/report | E | everyone read-only except lead merge fixes |
| shared test registration/build docs | Lead | specialists request changes |
| historical `docs/marcus-lore-v01/` | preserve | no retroactive rewrite |

If a specialist needs a file owned by another specialist, it submits a handoff request to the lead rather than editing around the boundary.

---

# 10. Implementation phases and gates

## Phase 0 — Verify source and create mission worktree

Lead only.

**Gate 0:** exact SHA, clean/understood status, baseline test commands recorded.

If the working source differs materially from the supplied standalone source, document the difference and use the actual current repo as authority.

---

## Phase 1 — Freeze architecture docs and baseline oracle

Lead + Agent A.

Actions:

1. Add v0.1.3 to `docs/world-model/` unchanged.
2. Add this plan.
3. Capture baseline oracle.
4. Record legacy read/write map.
5. Commit checkpoint.

**Gate 1:** oracle is reproducible, committed, and no production behavior changed.

---

## Phase 2 — Freeze world-model interfaces

Lead with B/C/D review.

Write:

`docs/world-model/MARCUS_WORLD_MODEL_INTERFACE_CONTRACT_V01.md`

It must define the minimal callable contracts between:

- event validation/append;
- world projections;
- perception derivation;
- belief/exposure derivation;
- backstory/world construction;
- Marcus adapter;
- encounter event emission.

The interface contract should prefer pure functions and immutable inputs.

**Gate 2:** B, C and D can work without editing each other's owned files.

---

## Phase 3 — Keyword/schema/world kernel

Agent B.

Parallelizable with Agent C only after the event/perception input shape is frozen.

**Gate 3:** new world-kernel unit tests + schema tests pass; existing suite still passes or any expected temporary integration failure is isolated and documented.

---

## Phase 4 — Perception/belief/profile kernel

Agent C.

**Gate 4:** all P1–P8, V1, R1–R6, exposure and backstory tests pass using synthetic fixtures independent of Marcus.

No encounter files changed yet.

---

## Phase 5 — Marcus world fixture and shadow projection

Agent D.

First create the Marcus world-event history and adapter **without deleting the old system**. Run a temporary shadow comparison:

```text
old projection == new world-backed projection
```

across the baseline corpus.

This shadow comparison is temporary migration scaffolding and must be removed from production path after parity.

**Gate 5:** new model can reconstruct all C1 legacy projection values on the golden corpus while old behavior remains authoritative.

---

## Phase 6 — Cut authority over to the world model

Agent D.

Actions:

1. Make the new world ledger authoritative.
2. Replace player eligibility hidden reads.
3. Replace Marcus truth reads with beliefs/attitudes/exposure/profile as required.
4. Emit world events from encounter actions.
5. Remove old mutable knowledge/belief authority.
6. Remove migration-only shadow writes.

**Gate 6:** baseline oracle tests pass with the old authority disabled/removed.

---

## Phase 7 — Independent C1–C11 conformance

Agent E.

Run independent architecture and behavior suites.

Any failure returns to the owning agent through the lead. Agent E does not patch production code.

**Gate 7:** C1–C11 all PASS, or the mission does not proceed to packaging.

---

## Phase 8 — Full repository regression and generated artifacts

Lead.

Run, from clean installed dependencies:

```text
npm test
npm run lint
npm run typecheck
npm run schema:validate
npm run build
node scripts/check-generated.mjs
```

Also run any new explicit conformance command if added.

Review:

```text
git status --short
git diff --check
git diff <baseline-sha>...HEAD --stat
```

Search for architectural leftovers:

```text
rg -n "lore\\.knowledge|lore\\.beliefs|initialKnowers|initialBelievers|BACKSTORY" src tests
rg -n "lore\\.variant|variant ===|variant !==" src/encounter src/conversation
```

Matches are allowed only when demonstrably historical, test fixture metadata, or debug-only and consistent with C1–C11. Explain every retained match.

**Gate 8:** full current suite and new conformance suite pass; generated files are fresh; diff contains no unexplained unrelated edits.

---

## Phase 9 — Standalone/package parity, only after source conformance

The source repository migration is primary. If the project still distributes the standalone HTML package, update/rebuild it only after Gate 8.

Packaging must verify:

- the standalone uses the migrated engine;
- offline startup still works;
- no required network calls;
- representative golden runs match the server/source engine;
- rebuild tooling fails loudly if required source substitutions/mappings do not apply;
- package hashes/inventory are refreshed rather than copied from old output.

Do not let standalone-build peculiarities drive the world-model design.

---

# 11. Required world/event invariants

These should become validator tests, not just comments.

## 11.1 Event envelope

Every event has:

- stable deterministic `eventId`;
- `kind`;
- monotonically ordered `seq`;
- valid time shape;
- `placeId` where applicable;
- `presentIds`;
- `observability`;
- provenance;
- optional `causedBy`;
- optional `commitGroup`;
- payload matching exactly one kind schema.

Reject unexpected payload fields.

## 11.2 Reader/presence subsets

At minimum:

```text
STATEMENT.speakerId ∈ presentIds
STATEMENT.audienceIds ⊆ presentIds
STATEMENT.earshotIds ⊆ presentIds
DOCUMENT_PRESENTED.holderId ∈ presentIds
DOCUMENT_PRESENTED.audienceIds ⊆ presentIds
DOCUMENT_PRESENTED.sightlineIds ⊆ presentIds
DOCUMENT_READ.readerId ∈ presentIds when the read is a live-place event
```

Backstory may use historical placement rules but must still create internally coherent events.

## 11.3 Object access

- Transfer changes possession only.
- Read requires possession or another explicitly authored lawful access rule; v1 Marcus should use possession.
- Present requires possession.
- Seeing an object used in an event never exposes its contents.

## 11.4 Hard state

- Only `TRANSACTION.hardEffects` mutates money, stock, ownership or obligation.
- Hard semantic propositions are derived from projected state, not separately authored into occurrence history.
- Atomic commit group rollback is mandatory.

## 11.5 Activities/attitudes

- Activity end must reference a started, not-yet-ended activity.
- Current activity is projected.
- Attitude state is projected from `ATTITUDE_SET` history.
- A later attitude event replaces current value without erasing history.

---

# 12. Marcus-specific seed contract

The migration must preserve existing deterministic behavior.

## World domain

- `R17_CONTENT`: use exact existing `marcus-information-v1:` hash behavior.
- `R17_COUNT_CAUSE`: add an independently salted deterministic choice only when negative; it must not affect current visible encounter behavior.

## Profile domain

- Marcus quirk: preserve existing `selectQuirk(seed)` behavior exactly.

Do not replace these with a generalized hierarchical-seed API during this mission unless the generalized API is mathematically proven to reproduce every legacy seed result exactly. The simpler path is preferred.

---

# 13. Marcus adapter projections

The adapter must derive, not store, today's concepts.

| Legacy concept | New source |
| --- | --- |
| `knowledge.player` | player's EXACT perceptions/holdings |
| `knowledge.marcus` | Marcus first-order EXACT derived beliefs |
| `marcusAwarePlayerKnows` | Marcus exposure view of player |
| `disclosure = NONE` | no relevant Marcus exposure or exact belief |
| `disclosure = PARTIAL` | Marcus exposure at CATEGORY only |
| `disclosure = FULL` | Marcus holds exact private claim |
| source UNCHECKED/CHECKED | Marcus stance on canonical `ISSUED_BY(R-17, ?)` question |
| content UNKNOWN/RECEIVED_UNVERIFIED/DOCUMENT_SUPPORTED | Marcus exact body-claim support rank 0/1/3 mapping as specified |
| record RECONCILED/CHALLENGED/DISPUTED | Marcus belief revision state on canonical crate-count question |
| relevance states | player's TOLD perception of Marcus's usefulness reply |
| evidence labels | specific qualifying perception records |
| private info | player possession + perception of the relevant R-17 body claim |

The UI may keep receiving familiar strings while the architecture underneath changes completely.

---

# 14. Four-reader enforcement checklist

## Player eligibility may read

- player perception records;
- player holdings/possession projected from events;
- encounter-local state the player obviously owns, such as their drafted terms;
- previously surfaced Marcus statements.

It may not read:

- hidden open-truth variant IDs;
- Marcus private attitudes;
- Marcus private activities;
- objective cause of the crate discrepancy;
- Marcus beliefs except through statements already perceived by the player.

## Marcus decisions/reactions may read

- Marcus derived beliefs;
- Marcus own projected attitudes;
- Marcus exposure view;
- Marcus fixed profile/policy including quirk and recognition;
- encounter-local metrics/policy inputs intentionally available to him.

They may not read:

- the objective truth of a disputed claim merely to choose a response;
- unperceived R-17 contents;
- player internal beliefs.

## World engine may read

- authoritative ledger and objective projections;
- validation rules;
- hard-state availability/ownership required for transactions.

It affects the social world by emitting events, not by directly writing NPC beliefs.

## Debug/validation may read

- everything needed to inspect truth and compare projections.

Nothing learned only through Debug can alter Play.

---

# 15. Test plan beyond C1–C11

These are required regression safeguards.

## Core ledger

- deterministic IDs;
- deterministic event ordering;
- duplicate rejection;
- atomic commit groups;
- replay from serialized ledger;
- invalid payload rejection;
- no hard-state field in wrong event type.

## Claims/questions

- `HAS_ATTRIBUTE(intake, crates, 6)` conflicts with `...8` automatically;
- registered attributes reject unregistered free-text attributes;
- no author-supplied question key can override canonical derivation;
- foundation contradiction rules still handle cross-keyword contradictions.

## Documents/authentication

- source check uses mark recognition only;
- verified issuer ≠ verified content;
- forged recognized mark can mislead an NPC;
- unchecked document remains rank 1;
- later source check triggers R6 rerank;
- body-only read cannot prove issuer if authenticating parts were not perceived.

## Perception

- participant versus present-room observer distinction;
- addressed versus overheard statement;
- shown versus observed presentation act;
- no contents through P1–P3 `ALL`;
- absence inference P8;
- no perception → no belief.

## Backstory

- TOLD compiles to statement;
- READ compiles to document read;
- SEEN compiles to participant occurrence or reuses existing event;
- no BACKSTORY perception channel;
- cannot create contradictory hard state.

## Player

- no derived beliefs structure;
- conflicting sources appear side-by-side in player-facing knowledge/notebook projection;
- player action options do not change when only an unperceived hidden cause changes.

## Marcus encounter

- verify source before body;
- body before source then late source check;
- positive usefulness probe;
- negative usefulness probe;
- question record eligibility from perceptions, not variant;
- attached information exchange commits only on ACCEPT;
- rejected/countered deal does not leak exact detail;
- repeated disclosure remains idempotent;
- exhausted/patience terminal state preserved;
- face/reply family parity.

---

# 16. Commit strategy and rollback points

Prefer small reviewable commits. Suggested order:

1. `test: freeze Marcus world-model baseline oracle`
2. `docs: freeze world-event v0.1.3 and interface contract`
3. `feat: add world-event keywords and schemas`
4. `feat: add world ledger and objective projections`
5. `feat: add perception belief exposure and profile projection`
6. `feat: compile Marcus history into world events`
7. `refactor: project Marcus lore from world model`
8. `refactor: route encounter information through world events`
9. `test: enforce C1-C11 conformance`
10. `docs: add implementation and conformance reports`

Do not squash away the baseline/oracle checkpoint before acceptance. It is the clean rollback boundary.

If a migration step breaks current behavior and the cause is unclear, restore authority to the last passing commit and diagnose there. Do not pile fixes on top of an unverified state.

---

# 17. Completion artifacts

The Codex mission is complete only when it produces:

1. migrated source code;
2. `docs/world-model/TRAPSTAR_WORLD_EVENT_FORMAT_V0_1_3.md`;
3. `docs/world-model/MARCUS_WORLD_MODEL_INTERFACE_CONTRACT_V01.md`;
4. `docs/world-model/MARCUS_WORLD_MODEL_BASELINE.md`;
5. `tests/fixtures/marcus-world-model-baseline-v01.json`;
6. explicit C1–C11 automated tests;
7. `docs/world-model/MARCUS_WORLD_MODEL_IMPLEMENTATION_REPORT.md`;
8. `docs/world-model/MARCUS_WORLD_MODEL_CONFORMANCE_REPORT.md`;
9. full repository validation results;
10. final Git status and commit list.

The implementation report must include:

- what old authority was removed;
- new module map;
- any compatibility adapter retained and why;
- every existing source file materially changed;
- known deferred items;
- exact test commands/results.

The conformance report must contain a C1–C11 table and independent verifier signoff.

---

# 18. Stop/escalation conditions

Stop and report to the lead instead of improvising if any of these occur:

1. Current repo HEAD cannot reproduce the accepted Marcus build well enough to freeze an oracle.
2. A C1–C2 difference appears to require intentional game-design change rather than architectural migration.
3. The current seed algorithm in the actual repo differs from the reviewed source.
4. The keyword extension would break an owner-frozen semantic contract not covered by v0.1.3.
5. A world-model requirement would require giving the player machine-authored beliefs.
6. A proposed fix requires letting Marcus inspect objective truth he could not perceive.
7. An agent would have to modify another agent's owned files without interface coordination.
8. Existing unrelated dirty changes would be overwritten.

The correct response to these is a bounded blocker report, not a speculative redesign.

---

# 19. Final validation checklist

Before declaring success, the lead must answer **yes** to every item:

- [ ] Correct existing Marcus repo verified.
- [ ] Mission branch/worktree created from recorded SHA.
- [ ] Baseline repo checks recorded.
- [ ] Golden oracle frozen before behavior edits.
- [ ] v0.1.3 copied into repo unchanged.
- [ ] `AGENTS.md` updated to share keyword vocabulary, not foundation authority.
- [ ] Keyword count is 16 with value-slot contract.
- [ ] Event schemas validate all 13 event kinds.
- [ ] Stable mark IDs support V1 authentication.
- [ ] Ledger is append-only and commit groups atomic.
- [ ] Player has no derived beliefs.
- [ ] Marcus beliefs rebuild from perceptions.
- [ ] Exposure contains access information only, not another person's belief.
- [ ] No BACKSTORY perception channel exists.
- [ ] No runtime mutation of old knowledge/belief lists exists.
- [ ] Player eligibility no longer reads hidden variant/private Marcus facts.
- [ ] Marcus no longer reads unperceived truth for the affected information mechanics.
- [ ] Existing information and quirk seeds are compatible.
- [ ] C1 PASS.
- [ ] C2 PASS.
- [ ] C3 PASS.
- [ ] C4 PASS.
- [ ] C5 PASS.
- [ ] C6 PASS.
- [ ] C7 PASS.
- [ ] C8 PASS.
- [ ] C9 PASS.
- [ ] C10 PASS.
- [ ] C11 PASS.
- [ ] Full `npm test` passes.
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Schema validation passes.
- [ ] Build passes.
- [ ] Generated freshness check passes.
- [ ] No unrelated source edits remain unexplained.
- [ ] No push/merge/deployment occurred unless separately authorized.

---

# 20. Codex lead final-response format

The lead's user-facing completion report should be short and evidence-led:

### 1. Result

State whether world-model conformance passed C1–C11.

### 2. What changed

Describe the new ledger → perception → belief/exposure → Marcus adapter path and confirm the old mutable lore authority was removed.

### 3. Behavioral parity

State the number of frozen golden runs replayed and whether player-facing outputs/outcomes matched.

### 4. Validation

List the exact repository commands run and results.

### 5. Git state

Give current branch, HEAD, uncommitted status, and whether anything was pushed.

### 6. Deferred work

List only the intentionally deferred v0.1 items: news passes, clock, Room Creator integration, persistence, group bargaining, profile growth, etc.

Do not claim the general Trapstar world simulation is complete. The successful milestone is narrower and important:

> **Marcus is the first existing encounter whose current behavior is reproduced from the general Trapstar world-event, perception and NPC-belief model rather than hand-maintained lore knowledge state.**

---

# Appendix A — Existing source seams identified in the reviewed package

These are navigation aids, not substitutes for preflight against current HEAD.

| Current file | Current role | Migration direction |
| --- | --- | --- |
| `src/encounter/history-content.mjs` | ten lore facts with initial knowers/believers | compile authored world/backstory events; remove initial knower/believer authority |
| `src/encounter/knowledge.mjs` | `createLore`, hidden variant, knowledge lists, beliefs, eligibility, `projectLore` | retain/query adapter surfaces but source from world/perceptions/beliefs |
| `src/encounter/information-policy.mjs` | directly writes knowledge/belief/disclosure/evidence and opening state | emit events + encounter-local effects; derive subjective state |
| `src/encounter/state.mjs` | creates lore in initial state | create Marcus world ledger/profile reference instead |
| `src/encounter/engine.mjs` | authoritative transition/settlement | append validated world events atomically and attach `worldEventIds` to turns |
| `src/encounter/marcus-profile.mjs` | BASED/personality + `selectQuirk` | preserve quirk hash; add fixed profile fields such as `recognizes` |
| `src/encounter/marcus-policy.mjs` | Marcus response scoring/policy | consume allowed beliefs/attitudes/exposure/profile only |
| `src/conversation/keyword-bank.mjs` | UI topic/action gating | gate only from player-permitted perception/holding view |
| `tests/encounter-knowledge-unit.test.mjs` | focused lore tests | adapt to world-model projection tests |
| `tests/encounter-information.test.mjs` | information gameplay | retain as behavioral regression plus new event assertions |
| `tests/encounter-lore-adversarial.test.mjs` | absence/leak/adversarial checks | extend with four-reader and hidden-event mutation tests |

---

# Appendix B — Owner-approved architecture notes that must not drift

- Three knowledge records: world event, perception record, derived NPC belief.
- Player has perceptions/holdings, not machine-authored beliefs.
- World event ledger is truth authority.
- Authenticity is not accuracy.
- Turns are not events.
- NPC beliefs are projections, never writes.
- Other minds are exposure only.
- Seeded open truths resolve before play.
- Same seed + same ordered inputs = deterministic identical state.
- Object participation never reveals object contents.
- Marcus quirk is profile configuration, not world truth.
- Existing Marcus behavior is the conformance fixture, not a design target to reinterpret.

