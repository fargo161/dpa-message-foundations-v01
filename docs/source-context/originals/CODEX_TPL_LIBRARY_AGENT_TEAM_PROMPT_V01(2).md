# CODEX PROMPT — REBUILD THE EMP TPL INTAKE LIBRARY WITH AN AGENT TEAM

Paste this entire prompt into a Codex app or CLI chat opened on the EMP repository.

---

## Operating instruction

You are the lead Codex agent inside the existing EMP / BASED / SPC repository. Use a real subagent workflow to inspect, repair, and complete the TPL Intake Library shown in the attached reference image.

This is an implementation task. Do not stop at a proposal, mockup, or architecture document. Inspect the repository, form the team described below, implement the authorized changes, run tests, exercise the UI, and return an evidence-backed completion report.

If this Codex surface cannot spawn subagents, stop before editing and say exactly that. Do not silently replace the requested team workflow with a single-agent run.

Do not commit, push, publish, deploy, delete user-owned source evidence, or rewrite unrelated systems unless separately requested.

## Target outcome

Turn the current intake/demo shell into an understandable, source-grounded, deterministic TPL curation system that:

1. removes or isolates duplicated demo state;
2. prevents duplicate imports;
3. removes the fake `Stop -> AS` demonstration rule from every canonical path;
4. separates `Sources`, `Review`, `Protocols`, `BASED Matrix`, and `Renderer` into understandable stages;
5. loads the canonical five-family written TPL ontology;
6. adds `DEAL`, `PRESSURE`, `ASK`, and Delivery Intensity;
7. generates exactly 180 `Vibe x act x intensity` matrix cells;
8. imports actual licensed corpus data when source access and repository policy permit it; and
9. visibly distinguishes what is implemented, populated, empty, unmapped, quarantined, or blocked.

The finished system must support thousands of deterministic combinatorial written-message presentations without storing thousands of near-duplicate finished sentences and without using a runtime language model.

---

## Team formation and orchestration

Spawn the following six bounded subagents. Keep the lead thread focused on requirements, shared decisions, integration, and the final result.

| Agent | Initial investigation | Implementation ownership after the contract freeze |
| --- | --- | --- |
| A — Repository and legacy-state auditor | Map the actual app, persistence, fixtures, imports, migrations, routes, tests, duplicate state, and `Stop -> AS` rule. | Persistence cleanup, demo isolation, deduplication migration, and import-idempotency code only. |
| B — TPL ontology and matrix architect | Locate canonical BASED definitions, request/keyword schemas, intensity concepts, TPL data, and face boundaries. | Five-family ontology, stable enums/schemas, matrix generator, and canonical seed data only. |
| C — Corpus and provenance engineer | Inspect current source records, importer boundaries, network constraints, licenses, attribution, privacy handling, and raw/derived separation. | Source manifests, reproducible corpus importers, provenance, checksums, and staging data only. |
| D — Protocol compiler and semantic-integrity engineer | Trace the render pipeline and identify semantic-drift, determinism, collision, and compatibility risks. | Pragmatic constructions, protocols, resolver/compiler, semantic-invariance validation, and capacity reporting only. |
| E — Curation UI and workflow engineer | Audit the current intake screen, navigation, accessibility, state semantics, and player/admin boundaries. | The five curation stages, coverage/status UI, drill-downs, and renderer preview only after shared contracts are frozen. |
| F — Verification and adversarial reviewer | Inspect tests and prepare a requirements-to-tests traceability plan. Challenge hidden shortcuts or fabricated completion. | Tests, fixtures, accessibility checks, regression review, and final independent acceptance report; no ownership of production definitions. |

### Mandatory team rules

1. Spawn Agents A–F before implementation.
2. Phase 0 is read-only for every subagent. They may run safe inspection commands and tests but may not edit files.
3. Each agent must return a concise report containing:
   - evidence with exact file paths and symbols;
   - defects and risks;
   - proposed files to own;
   - dependencies on other agents;
   - blockers and unknowns;
   - recommended validation.
4. Wait for all Phase 0 reports.
5. The lead must reconcile their findings into one contract freeze before any write work:
   - repository root and active instructions;
   - canonical enum source;
   - schema and ID conventions;
   - persistence and migration plan;
   - layer boundaries;
   - UI state meanings;
   - exclusive file/directory ownership;
   - integration and test order.
6. The lead owns shared schemas, shared exports, dependency changes, migrations that cross domains, and conflict resolution. Subagents must not independently redefine shared concepts.
7. Never let two live agents edit the same file. Use one of these safe patterns:
   - parallel edits to explicitly non-overlapping paths;
   - sequential handoffs for shared files; or
   - separate Git worktrees when truly parallel changes would otherwise overlap.
8. Preserve all pre-existing user changes. Inspect `git status --short` before edits. Never use destructive reset/checkout commands.
9. Do not install production dependencies without repository evidence and a clear need. Follow existing tooling and conventions.
10. Agents report distilled findings and verification results, not raw logs. The lead decides what lands.
11. After integration, Agent F reviews the combined result against every acceptance gate. The lead fixes verified failures and reruns the relevant checks.
12. If any subagent becomes blocked, it reports the exact blocker to the lead and continues with non-blocked work within its assignment.

### Suggested execution phases

#### Phase 0 — Parallel read-only audit

- Lead: discover the repository root, read every applicable `AGENTS.md`, inspect the current branch/status, identify build/test commands, and attach the reference screenshot or its observations to the task context.
- Agents A–F: perform the bounded investigations above.
- Lead: wait for all reports and publish the contract freeze plus ownership map before edits.

#### Phase 1 — Foundations

- Agent A implements demo isolation and deduplication primitives.
- Agent B implements canonical enums, schemas, ontology, and the 180-cell generator.
- Agent C implements source manifests and importer boundaries.
- Agent F adds structural and migration tests against the frozen contracts.
- Lead integrates shared contracts and resolves any cross-domain file.

#### Phase 2 — Protocol system

- Agent D implements pragmatic constructions, TPL protocols, deterministic selection, semantic-invariance validation, and capacity enumeration.
- Agent C completes permitted real-data ingestion and records actual import results.
- Agent F adds semantic, provenance, determinism, and corpus tests.
- Lead verifies that ontology evidence, corpus evidence, BASED meaning, and runtime behavior remain separate.

#### Phase 3 — Curation experience

- Agent E implements the five explicit stages and status/coverage UI against the stabilized backend.
- Agent A verifies that UI imports are idempotent and synthetic state is isolated.
- Agent D wires renderer preview without exposing TPL controls to the player-facing runtime.
- Agent F runs UI, accessibility, and end-to-end checks.

#### Phase 4 — Independent acceptance and closeout

- Agent F performs an adversarial audit of the integrated work.
- Lead fixes confirmed defects, reruns tests, calculates final counts, and returns one consolidated report.

---

## Repository preflight

Do not assume the shell starts in the correct repository.

1. Determine the workspace and Git root with safe read-only commands.
2. Read applicable repository instructions, README files, architecture notes, package manifests, schemas, migration conventions, and test configuration.
3. Inspect `git status --short` and preserve existing changes.
4. Search for all TPL, EMP, BASED, Vibe, Delivery Intensity, `DEAL`, `PRESSURE`, `ASK`, request/keyword, semantic-payload, face-compatibility, intake, fixture, persistence, and renderer code.
5. Search for the exact strings and variants associated with the known defects:
   - `synthetic-tpl-intake`
   - `Synthetic demo`
   - `Stop and listen`
   - `Stop`
   - `AS`
   - `rule-synthetic-stop`
   - `urgency`
   - `tact`
   - `tone`
   - `Medium`
   - `70/30`
6. Determine whether the duplicated demo state comes from fixture loading, seed execution, persistence hydration, React strict-mode behavior, event replay, an append-only import, or another evidenced cause.
7. Determine the actual runtime language, data store, schema validator, component system, and test runner from repository evidence.
8. If `CODEX_TPL_LIBRARY_UPDATE_PROMPT_V01.md` exists, read it as the expanded domain specification. This prompt governs team orchestration and the nine repair outcomes; the two documents must be reconciled rather than treated as alternatives.
9. Reuse project conventions. Do not invent a parallel framework merely to satisfy the wording of this prompt.

If the repository or canonical BASED source cannot be found unambiguously, stop before destructive or speculative work and report the exact blocker.

---

## Locked domain laws

These requirements are authoritative and may not be simplified by any agent.

### Written/visual TPL only

All TPL modifiers are written or visually presented in the message surface.

- `VOICE_QUALITY` visibly represents how words might be spoken.
- `VOCALIZATION` writes or symbolizes fillers, utterances, or bodily sounds.
- `TACTILE_KINESIC` writes or symbolizes touch or physical interaction.
- `VISUAL_KINESIC` writes or symbolizes bodily movement or expression.
- `ARTIFACT` controls visible formatting and presentation.

TPL must not trigger real audio, haptics, facial animation, or bodily animation. Those are separate systems.

### Player authoring boundary

The player selects only:

1. one hard-authored semantic request through the request/keyword system;
2. one ordered BASED Vibe; and
3. one Delivery Intensity.

The player never directly authors or selects TPL families, atoms, punctuation rules, emoji, protocols, profiles, facial slots, hidden NPC state, success probability, or numeric Cue mixtures. EMP automatically resolves a compatible written treatment.

Backend curators and developers may inspect or author candidates in the intake library. Do not leak those authoring controls into player-facing runtime UI.

### BASED authority

BASED contains exactly five stable Cues identified by:

```text
B A S E D
```

BASED contains exactly 20 ordered two-Cue Vibes:

```text
BA BS BE BD
AB AS AE AD
SB SA SE SD
EB EA ES ED
DB DA DS DE
```

Order matters. The first Cue governs and the second modifies. `BA` and `AB` are different. Do not infer Cue definitions from the letters; load them from canonical project data.

A Vibe is not a fixed emotion, personality, urgency, tact, tone, face, truth value, success probability, or outcome. External corpus labels must never redefine BASED.

If canonical Cue/Vibe definitions are absent or contradictory, create the exact unmapped 20-Vibe matrix skeleton and mark semantic compatibility authoring blocked. Do not guess.

### Delivery Intensity authority

The only valid public/canonical values are:

```text
SUBTLE
BALANCED
OVERT
```

Delivery Intensity controls the salience of written signaling. It cannot change the proposition, redefine the Vibe, determine a Cue mixture, or invent urgency.

Reject `LOW`, `MEDIUM`, `HIGH`, player-facing sliders, and numeric intensity fields from canonical authoring paths unless an existing private renderer field is proven compatible and cleanly translated at the boundary.

### No semantic 70/30 rule

Legacy `70/30` language has icon-composition relevance only. It has no semantic, mechanical, facial, TPL, intensity, scoring, storage, or runtime authority. Do not introduce `lead_weight`, `secondary_weight`, hidden equivalents, or 70/30 mixing logic.

### Face boundary

The raw EMP face system has exactly five bounded Goose anatomical slots, one asset per slot. Face evidence is separate from TPL evidence and many-to-many with Vibes.

- Do not use a face as proof of internal state.
- Do not assign one mandatory face to one Vibe.
- Preserve separate reaction-face and reply-face records.
- Do not construct or mutate faces inside the TPL renderer.
- Emoji or a written gesture cannot silently replace the actual face record.

### Evidence, not proof

TPL and faces provide interpretable evidence. Neither reveals internal truth. A signal may be sincere, strategic, habitual, conflicted, misleading, or misunderstood according to authored context and state.

---

## Source hierarchy and provenance boundaries

Use primary sources and record source authority separately from dataset reuse rights.

### TPL ontology authority

Andrea Webb Luangrath, Joann Peck, and Victor A. Barger, “Textual Paralanguage and its Implications for Marketing Communications,” Journal of Consumer Psychology 27 (2017), 98–107.

- Abstract: https://arxiv.org/abs/1605.06799
- Manuscript: https://arxiv.org/pdf/1605.06799
- DOI: https://doi.org/10.1016/j.jcps.2016.05.002

Use the paper as the conceptual authority for what qualifies as TPL and for the five-family coding structure. Do not assume its hand-coded social-media corpus is publicly released. Do not copy underlying Twitter, Facebook, or Instagram posts. Keep manuscript rights separate from underlying-post rights.

### `ASK` evidence source

Use the Stanford Politeness Corpus for request constructions and pragmatic markers.

- Wikipedia: https://convokit.cornell.edu/documentation/wiki_politeness.html
- Stack Exchange: https://convokit.cornell.edu/documentation/stack_politeness.html
- Paper: https://aclanthology.org/P13-1025/

Expected source-scale references to verify at ingestion time:

- 4,353 Wikipedia requests;
- 6,603 Stack Exchange requests;
- 10,956 total requests;
- CC BY 4.0 according to ConvoKit documentation.

Politeness is evidence for pragmatic construction patterns. It is not BASED, morality, friendliness, submission, truth, or outcome likelihood.

### `DEAL` evidence source

Use CaSiNo for negotiation moves and sequencing.

- Repository/data: https://github.com/kushalchawla/CaSiNo
- Paper: https://aclanthology.org/2021.naacl-main.254/

Expected source-scale references to verify at ingestion time:

- 1,030 negotiation dialogues;
- 4,615 strategy-annotated utterances across 396 dialogues;
- CC BY 4.0 repository license.

Abstract reusable patterns away from campsite-specific food, water, and firewood facts. Preserve provenance.

### `PRESSURE` evidence source

Use PersuasionForGood for persuasion/dialogue strategies.

- Documentation: https://convokit.cornell.edu/documentation/persuasionforgood.html
- Paper: https://aclanthology.org/P19-1566/
- Original dataset: https://gitlab.com/ucdavisnlp/persuasionforgood

Expected source-scale references to verify at ingestion time:

- 1,017 conversations;
- 20,932 utterances;
- 6,136 annotated utterances in 300 conversations;
- Apache License 2.0 according to ConvoKit documentation.

Do not import charity-specific facts or demographic/personality profiling into BASED. Protected or demographic attributes must not drive message treatment.

### Authority table

| Source | May define | Must not define |
| --- | --- | --- |
| Luangrath–Peck–Barger | Written TPL ontology and coding boundaries | BASED meanings or runtime compatibility |
| Stanford Politeness | Request/pragmatic candidates | BASED mappings or moral labels |
| CaSiNo | Negotiation move candidates | EMP-world facts or BASED mappings |
| PersuasionForGood | Persuasion/pressure candidates | Player profiling or BASED mappings |
| Canonical project BASED data | Cue/Vibe meaning and authored compatibility | Corpus licensing |
| Canonical keyword/request data | Semantic proposition and slots | Surface TPL ontology |
| Canonical EMP runtime data | Rendering integration | Research-source authority |

Verify versions, licenses, counts, and acquisition URLs against the official source at implementation time. If access is blocked, implement the manifest and reproducible importer boundary, mark acquisition blocked, and import zero fabricated records.

---

## Required system layers

Keep these layers distinct in schemas, storage, APIs, and UI labels.

1. **Source evidence** — immutable or append-safe raw imports with provenance and license metadata.
2. **Review records** — normalized snippets/candidates with human and derived annotations explicitly distinguished.
3. **Pragmatic constructions** — lexical/syntactic patterns for `DEAL`, `PRESSURE`, or `ASK`.
4. **TPL atoms** — atomic written surface operations within one of the five TPL families.
5. **TPL protocols** — curated bundles of constructions, atoms, placement, exclusions, and intensity behavior.
6. **BASED compatibility matrix** — authored compatibility between ordered Vibe, act, intensity, and approved protocols.
7. **Renderer** — deterministic compilation of an immutable semantic payload through one compatible construction/protocol.
8. **Face compatibility** — a separate evidence system, outside the TPL renderer.

Never allow a raw corpus label to become a Vibe mapping through an automatic rule.

---

## Canonical five-family TPL ontology

Implement exactly these top-level families. They are not one-to-one matches for the five BASED Cues.

### `VOICE_QUALITY`

Visible writing that represents how words might be spoken. Candidate subtypes include emphasis, stress, pitch, rhythm, tempo, silence, intensity/volume, intonation, censorship, spelling, and scare quotes.

Deterministic operations may include bounded capitalization, mixed case, punctuation patterning, word-final periods, per-token periods, letter repetition, character spacing, segmentation, ellipses, bracketed silence, authored descriptors, censorship symbols, and approved nonstandard spelling.

### `VOCALIZATION`

Visible fillers, utterances, or represented sounds. Candidate groups include hesitation, acknowledgment, laughter, surprise, approval, disgust, exertion, frustration, breathing/sighing, environmental/impact sounds, and silence-management markers.

Every item remains contextual and ambiguous. Never diagnose an emotion from a single token.

### `TACTILE_KINESIC`

Visible representations of touch or physical interaction. Candidate groups include affiliative, greeting, comforting, celebratory, hostile, distancing, or refusal-of-contact acts.

This family must be opt-in and context/relationship gated. Never insert contact merely because a Vibe is selected.

### `VISUAL_KINESIC`

Visible representations of bodily movement or expression: emoticons, suitable emoji, written action markers, gesture descriptors, or posture descriptors.

The Goose face remains separate. Prevent accidental duplication or contradiction unless authored as intentional evidence.

### `ARTIFACT`

Message-presentation properties such as typeface role, weight/emphasis role, color role, spacing, line breaks, alignment, lists, message segmentation, bubble/layout treatment, and non-kinesic iconography.

Artifact treatments must remain accessible, localizable, and supported by the real renderer.

---

## Required canonical structures

Adapt names to the repository, but preserve these concepts and stable identities.

### Source manifest

At minimum store:

```text
source_id
title
authors
year
source_type
canonical_url
doi when applicable
version/revision when applicable
license and attribution requirements
underlying_data_reuse status
authority_scope
acquisition status
retrieved_at
content checksum
record counts
notes
```

### Review record

At minimum store:

```text
record_id
source_id
source_external_id
raw/normalized content references
speech-act candidate
TPL-family/subtype candidates
annotation origin: HUMAN | DERIVED | SOURCE | PROJECT_AUTHORED
review state
license/provenance reference
content fingerprint
review notes
```

Human and derived annotations must never be visually or structurally conflated.

### TPL atom

At minimum store:

```text
tpl_atom_id
family
subtype
operation
scope
placement
parameters_by_intensity
semantic risk
ambiguity
max occurrences
conflict tags
required context tags
accessibility/localization notes
source references
review status
```

### Pragmatic construction

Store lexical/syntactic strategy separately from surface TPL:

```text
construction_id
speech_act
template or structured operation
required/optional semantic slots
source references
semantic effect: NONE unless explicitly authored otherwise
review status
```

Hedging, indirectness, deference, greetings, apologies, pronoun framing, and comparable devices belong here unless canonical repository architecture proves a better distinction. Do not force all pragmatic devices into TPL.

### TPL protocol

A protocol is a curated bundle, not a Vibe definition:

```text
tpl_protocol_id
speech-act compatibility
construction compatibility
required/optional/excluded atom IDs
conflict rules
intensity profiles
semantic-invariance requirement
source references
review status
```

### Semantic payload

The request/keyword system owns the proposition. Protect applicable slots such as:

```text
ACTOR ACTION OBJECT QUANTITY PRICE DEADLINE LOCATION CONDITION
LEVERAGE PERMISSION PROHIBITION CONSEQUENCE RECIPIENT
```

The request ID and slot values must survive rendering.

### BASED compatibility cell

Generate exactly one cell for every ordered combination:

```text
20 Vibes x 3 acts x 3 intensities = 180 cells
```

Each cell needs at least:

```text
vibe_id
speech_act
delivery_intensity
allowed_protocol_ids
preferred_protocol_ids
excluded_protocol_ids
source = AUTHORED_PROJECT_COMPATIBILITY
review_status = UNMAPPED | CANDIDATE | REVIEWED | APPROVED | BLOCKED
```

Generate all 180 keys even when compatibility content is absent. `UNMAPPED` is valid and visible; guessed compatibility is not.

### Render result

Every result must expose traceability:

```text
semantic_request_id
speech_act
vibe_id
delivery_intensity
construction_id
tpl_protocol_id
applied_atom_ids
payload_before
payload_after
semantic_invariance_passed
rendered_text
stable seed
provenance references
```

---

## Duplicate-state repair and import idempotency

The current screenshot shows the synthetic fixture twice, producing two source rows and six records from a three-record fixture. It also shows a fake deterministic `Stop -> AS` rule and one synthetic collection. Treat this as a symptom to diagnose, not as proof of the exact root cause.

Implement all of the following unless the repository already has an equivalent proven mechanism:

1. Give every source import a stable source identity and acquisition fingerprint.
2. Compute a deterministic import fingerprint from normalized source identity, version, license, and verified content checksum.
3. Give records a stable natural key or fingerprint using source ID, source-external ID, and normalized content where appropriate.
4. Enforce uniqueness in the persistence layer, not only in the button handler.
5. Make reimport idempotent. A repeated identical import must return an explicit `already imported` result with zero duplicated sources and records.
6. Handle partial/retried imports transactionally or with safe upsert semantics.
7. Report inserted, unchanged, updated, rejected, quarantined, and duplicate counts.
8. Distinguish exact duplicate, same source/new version, and conflicting content under the same external ID.
9. Add concurrency coverage so double-clicks or simultaneous imports cannot duplicate state.
10. Separate synthetic fixture storage from canonical source storage. Synthetic data must be opt-in, visibly labeled `SYNTHETIC DEMO`, excluded from production/runtime exports, and resettable without touching licensed evidence.
11. Provide a safe migration for existing duplicated demo rows. Prefer reversible quarantine or canonical merge according to repository conventions. Never erase unrelated reviewed records.
12. Ensure loading a fixture is never an unguarded append action.

The lead must report both the diagnosed cause and the applied guardrails.

---

## Remove the fake `Stop -> AS` rule

Find the actual record, seed, transformation, UI action, and tests behind `rule-synthetic-stop`, `Stop and listen`, or equivalent behavior.

- Remove the rule from canonical loading, review, protocol generation, compatibility, exports, and runtime paths.
- Do not replace it with another one-token-to-Vibe inference.
- If useful for test history, keep it only inside a clearly named noncanonical demo/quarantine fixture that cannot enter approved/runtime data.
- Add regression tests proving that the token `stop` does not automatically map to `AS` or any Vibe.
- Vibe compatibility must come from authored canonical project mappings, never keyword detection alone.

---

## Legacy fixture quarantine and migration

The uploaded `tpl_intake_library_fixture.json` is evidence of an earlier design, not canonical project authority. Its known defects include:

- only 19 Vibe mappings; `DE` is missing;
- reduction of Vibes to urgency, tact, and tone presets;
- reversed Vibe pairs that are duplicated or weakly differentiated;
- `Medium` urgency/intensity and player-facing sliders;
- unsupported success, friction, and clarity scores;
- mixed/incompatible record shapes inside one matrix collection; and
- at least one semantic violation that changes `tomorrow morning` to `whenever you get a chance`.

Do not silently normalize this fixture into the new canonical model.

1. Preserve the original unchanged in a clearly marked legacy/quarantine location if repository policy permits it.
2. Remove all canonical authority from its Vibe mappings, numeric scores, sliders, and urgency/tact/tone model.
3. Produce a machine-readable migration/rejection report that accounts for every source object, rule, record, and field.
4. Salvage only independently reviewable written surface techniques that have valid provenance and pass semantic review.
5. Keep salvaged atoms in candidate state until human approval; never inherit the fixture's Vibe mapping.
6. Add the deadline-changing example as a negative semantic-invariance regression fixture.
7. Prove quarantined data cannot enter protocol approval, matrix resolution, export, capacity counts, or runtime rendering.

---

## Corpus ingestion rules

Build reproducible importers rather than manually pasting examples.

For every imported record:

- retain source and original record IDs;
- retain license/attribution metadata;
- record dataset version, retrieval date, acquisition URL, and checksum;
- avoid or remove unnecessary personal identifiers;
- separate raw, normalized, candidate, reviewed, approved, rejected, quarantined, and runtime layers;
- preserve raw text only where the license and repository policy permit it;
- distinguish source-authored, human-annotated, corpus-derived, mechanically derived, and project-authored data;
- keep domain-specific content out of general runtime templates unless explicitly approved;
- prevent demographic or personality attributes from affecting BASED compatibility;
- use deterministic ordering and idempotent imports;
- emit exact record counts and validation failures.

Do not call a manifest-only source `imported`. Do not call downloaded raw data `approved`. Do not call candidate patterns `runtime-ready`.

If the environment cannot fetch a source, deliver and test the importer boundary against a small license-safe fixture, record `0` real records imported, and state the exact acquisition blocker. Never fabricate corpus volume.

---

## `DEAL`, `PRESSURE`, and `ASK` semantic boundaries

### `DEAL`

An authored offer, exchange, concession, bargain, or conditional agreement. TPL cannot change offered/requested items, quantities, price, conditions, deadlines, ownership, or concession state.

### `PRESSURE`

An authored attempt to increase compliance through urgency, leverage, consequence, insistence, or repeated appeal. TPL cannot invent a threat, punishment, deadline, leverage, authority, accusation, promise, or consequence.

### `ASK`

An authored request for action, information, permission, access, aid, or transfer. TPL cannot change the action, actor, recipient, object, quantity, deadline, permission state, or conditions.

---

## Deterministic protocol compiler

Compile only compatible layers:

```text
semantic template
x keyword payload
x speech act
x ordered BASED Vibe
x Delivery Intensity
x pragmatic construction
x TPL protocol
x optional permitted atoms
```

The compiler must:

- use stable IDs and a stable seed;
- filter incompatibilities before enumeration;
- enforce placement, scope, context gates, conflict tags, and maximum occurrences;
- prevent incoherent stacking and unbounded punctuation/repetition growth;
- reject duplicate rendered outputs;
- retain provenance for every construction and atom;
- reject `UNMAPPED`, unreviewed, rejected, quarantined, or blocked content from runtime resolution;
- run without a runtime LLM; and
- prove semantic invariance with structured slot checks, not vague text similarity alone.

Reject a render if it removes or changes a protected slot, adds a proposition, changes the speech act, reverses a deadline, changes actor/recipient/object/quantity/price/ownership/location, or invents a threat, promise, accusation, condition, leverage, or consequence.

Return machine-readable failure reasons such as:

```text
REJECT_MISSING_REQUIRED_SLOT
REJECT_SLOT_VALUE_CHANGED
REJECT_ADDED_PROPOSITION
REJECT_DEADLINE_DRIFT
REJECT_SPEECH_ACT_DRIFT
REJECT_UNAUTHORED_THREAT
REJECT_UNAUTHORED_CONDITION
```

---

## Required curation UI

Replace the current one-screen ambiguity with five clearly navigable stages. Use existing app design conventions and responsive/accessibility patterns.

### 1. Sources

Show:

- source title and stable ID;
- source type, authority scope, license, version, and acquisition state;
- raw record count, accepted count, duplicate count, failure count, and checksum;
- `SYNTHETIC DEMO` and `LICENSED CORPUS` labels where applicable;
- import progress and a precise idempotent reimport result;
- safe source detail and permitted reset/quarantine actions.

Do not mix a three-line synthetic fixture with a licensed corpus without explicit labeling and filtering.

### 2. Review

Show:

- candidate content and provenance;
- lifecycle state;
- human versus source versus derived annotation origin;
- speech-act and TPL-family candidates;
- reviewer notes and validation reasons;
- batch actions with confirmation, counts, and reversible behavior where practical.

Approval must not turn a raw sentence directly into a Vibe mapping.

### 3. Protocols

Show:

- pragmatic constructions, TPL atoms, and bundled protocols as distinct types;
- family/subtype, compatible acts, intensity behavior, conflicts, context gates, provenance, and review state;
- deterministic preview examples with semantic payload before/after;
- validation failures and why a candidate cannot be approved.

### 4. BASED Matrix

Render a coverage view for all 180 cells:

```text
20 ordered Vibes x 3 acts x 3 intensities
```

Support filters by Vibe, act, intensity, review state, and coverage. Each cell must show status and counts for allowed/preferred/excluded protocols. Selecting a cell reveals its authored evidence and history.

An index list of the 20 Vibe IDs is not the matrix. Empty cells must remain visible and measurable.

### 5. Renderer

Provide a curator/developer preview that accepts:

- an existing hard-authored semantic request or test fixture;
- one of the three acts;
- one ordered Vibe;
- one Delivery Intensity;
- a stable seed.

Show the resolved construction/protocol/atoms, rendered written output, before/after semantic slots, invariance result, provenance, and rejection reasons.

This backend preview must not become a player-facing TPL atom or protocol picker.

### Persistent status summary

Across the curation system show accurate totals for:

- sources by acquisition state;
- raw/reviewed/approved/quarantined/rejected records;
- atoms, constructions, and protocols by review state;
- matrix cells by `UNMAPPED`, `CANDIDATE`, `REVIEWED`, `APPROVED`, and `BLOCKED`;
- real versus synthetic content;
- valid unique render capacity.

Never summarize `180 generated cells` as `180 implemented mappings`. A generated empty skeleton and an approved populated cell are different achievements.

---

## Capacity report

Add a deterministic reporting command or page that calculates:

- theoretical combinations;
- candidates removed by compatibility filters;
- candidates removed by semantic validation;
- duplicate renderings removed;
- valid unique renderings;
- counts by act, Vibe, intensity, TPL family, construction, and protocol;
- populated and empty matrix cells.

Demonstrate at least 10,000 valid unique deterministic configurations if the repository contains enough approved semantic payloads and mappings. Do not inflate the total with empty, identical, invalid, unapproved, or semantically changed outputs.

If the evidence cannot support 10,000, report the verified number and list the exact missing inputs. Truthful partial capacity is a valid result; fabricated scale is not.

---

## Mandatory tests and acceptance gates

Agent F must maintain a traceability table linking every gate below to an automated test, verified UI check, or explicit blocker.

### Repository and migration

- Record baseline counts for sources, records, rules, collections, profiles, protocols, and matrix cells before mutation.
- Use the repository's normal backup/migration mechanism and document a tested rollback or recovery path.
- Pre-existing user changes remain intact.
- The diagnosed duplicate cause is documented.
- Existing duplicated demo state is safely merged, quarantined, or isolated.
- Importing the known three-record synthetic fixture once produces one logical demo source and three logical demo records.
- Reimporting an identical fixture, the same bytes under a renamed file, or a file containing repeated records produces zero new logical sources or records.
- A partial failure can be retried without duplication or orphaned relationships.
- Concurrent/double imports cannot create duplicates.
- Synthetic reset cannot delete licensed or reviewed corpus data.
- Collection/profile relationships remain valid or have an explicit, tested migration disposition.

### Structural

- Exactly five top-level TPL families.
- Exactly 20 ordered Vibe IDs, including `DE`.
- Reversed pairs remain distinct.
- Exactly three acts: `DEAL`, `PRESSURE`, `ASK`.
- Exactly three intensities: `SUBTLE`, `BALANCED`, `OVERT`.
- Exactly 180 unique matrix keys.
- No duplicate stable IDs.
- No semantic 70/30 fields or logic.
- No canonical urgency/tact/tone reduction of BASED.
- No player-facing TPL atom/protocol selector.
- No unsupported success/friction/clarity or numeric Cue-weight authority.

### `Stop -> AS` regression

- No canonical seed, rule, API, UI action, export, or runtime path maps `stop` to `AS`.
- Token occurrence alone never selects a Vibe.
- Any retained historical example is quarantined and excluded from approval/runtime.

### Semantic invariance

- Actor, action, recipient, object, quantity, price, deadline, location, ownership, permission, prohibition, condition, leverage, and consequence survive where present.
- The known bad transformation from `tomorrow morning` to `whenever you get a chance` is rejected.
- No unauthored threat, promise, accusation, leverage, deadline, or consequence appears.
- Intensity changes visible signaling without changing protected payload slots.

### Protocol and determinism

- Incompatible atoms cannot stack.
- Context gates and occurrence maxima are enforced.
- Repetition is bounded.
- Same fully specified input and seed produces the same result.
- Different permitted choices retain provenance.
- Duplicate output is removed from capacity counts.
- `UNMAPPED` or unapproved cells cannot resolve silently.
- Quarantined/rejected content cannot enter runtime output.

### Corpus and provenance

- Each imported record has a source ID, external ID or documented substitute, license reference, and fingerprint.
- Source/version/checksum counts are reported.
- Import is deterministic and idempotent.
- Raw, derived, reviewed, approved, and runtime layers cannot be confused.
- Real imported counts come from importer output, not documentation estimates.
- A blocked dataset produces zero fabricated records.

### Face separation

- TPL rendering does not mutate Goose face slots.
- Face compatibility remains many-to-many.
- Reaction and reply face references remain distinct.
- Written emoji/gesture does not automatically replace face evidence.

### UI and accessibility

- The five stages are separately navigable and have unambiguous names.
- Current stage and status are keyboard/screen-reader discoverable.
- Status is never color-only.
- Tables/grids remain usable at supported viewport sizes.
- The 180-cell matrix exposes all empty and populated states.
- Synthetic and licensed content are visibly distinct.
- Implemented, populated, approved, empty, unmapped, quarantined, and blocked are not conflated.
- Error, import, approval, and reset actions provide precise feedback.

### End-to-end

- Run the repository's unit, integration, migration, type, lint, and build checks as applicable.
- Start the real app and exercise the full path from source import through review, protocol, matrix, and renderer preview.
- Use the repository's browser/end-to-end tooling if present.
- Capture concise evidence of the exercised paths and any environment-only limitations.

---

## Required deliverables

Adapt filenames to repository conventions, but deliver functioning equivalents of:

1. duplicate-state diagnosis and safe migration;
2. persistence-level import deduplication;
3. isolated, resettable synthetic demo data;
4. removal/quarantine report for `Stop -> AS`;
5. source/license manifest;
6. five-family TPL ontology;
7. TPL atom, pragmatic-construction, protocol, semantic-payload, render-result, and matrix schemas;
8. complete 180-key matrix skeleton plus honest coverage state;
9. reproducible corpus importers or tested acquisition boundaries;
10. deterministic protocol compiler;
11. semantic-invariance validator;
12. five-stage curation UI;
13. implemented-versus-empty status summary;
14. structural, semantic, migration, corpus, face-separation, UI, and end-to-end tests;
15. capacity report;
16. implementation report with changed files, commands, results, counts, limitations, and blockers.

Documentation cannot substitute for working schemas, persistence behavior, renderer logic, UI, and tests.

---

## Stop conditions

Stop and ask for direction if:

- more than one repository could be the target;
- applicable project instructions conflict;
- canonical BASED definitions conflict or cannot be identified;
- the required migration would destroy non-demo user data;
- a source license is incompatible or cannot be verified;
- additional credentials or permissions are required;
- compatibility mappings would require inventing BASED meanings; or
- pre-existing user changes overlap required edits and cannot be preserved safely.

Do not stop solely because a corpus download is unavailable. Complete the schema, manifest, importer boundary, tests, and honest blocked-state reporting without fabricating data.

---

## Final response contract

Lead with what is actually working.

Return one consolidated report containing:

1. **Team execution** — agents used, bounded ownership, and completed handoffs.
2. **Root causes** — duplicate state and fake-rule origin with exact file/symbol references.
3. **Changes** — files created/modified and the behavior each change provides.
4. **Canonical counts** — families, Vibes, acts, intensities, matrix cells, atoms, constructions, protocols, and sources.
5. **Corpus ingestion** — records actually imported by source, duplicates skipped, failures, versions, checksums, and licenses.
6. **Matrix coverage** — populated/approved/unmapped/blocked counts, not just total generated cells.
7. **Capacity** — verified valid unique configurations and exclusion counts.
8. **Verification** — exact commands, pass/fail totals, browser/UI paths exercised, and Agent F's independent result.
9. **Legacy disposition** — what was migrated, quarantined, retained as demo-only, or removed from canonical paths.
10. **Remaining work** — distinguish blocked, awaiting human review, and deliberately deferred items.

Classify every deliverable as one of:

```text
IMPLEMENTED_AND_VERIFIED
IMPLEMENTED_AWAITING_CONTENT
CANDIDATE_AWAITING_HUMAN_REVIEW
BLOCKED
DEFERRED
```

Do not claim the TPL library is complete because schemas or 180 empty rows exist. Do not claim thousands of usable messages unless the capacity report proves thousands of unique, approved, compatible, semantically invariant results.

## Final canonical directive

Luangrath–Peck–Barger defines **what written TPL is**. External corpora provide **source-grounded pragmatic and strategy candidates**. Canonical project BASED data determines **Vibe meaning and authored compatibility**. Delivery Intensity controls **visible signal salience**. `DEAL`, `PRESSURE`, `ASK`, and the keyword/request system preserve **what is being communicated**. Goose face data supplies **separate visual evidence**.

Keep those authorities separate while making them deterministic and combinatorial.
