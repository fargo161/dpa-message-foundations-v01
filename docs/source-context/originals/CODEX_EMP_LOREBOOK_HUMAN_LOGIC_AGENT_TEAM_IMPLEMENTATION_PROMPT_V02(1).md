# CODEX AGENT-TEAM IMPLEMENTATION PROMPT — EMP Lorebook + Human Logic Core

**Version:** V0.2
**Date:** 2026-09-02
**Target repository:** `C:\Users\mcdon\Documents\ChatGPT\prototype-authoring-foundations-v01`
**Primary authoring surface:** `/authoring/keyword-maker`, or the actual equivalent found during repository audit
**Execution mode:** Form an agent team, audit, acquire data, design, implement, migrate, test, document, and hand off a working build
**Do not stop after analysis or planning.**

---

## 0. Direct instruction to Codex

You are the lead implementation agent for a major EMP authoring-system overhaul.

Create and coordinate an agent team to transform the current **Keyword Maker** into an **AI-writer-style EMP Lorebook** backed by a deterministic social-state compiler and three authoritative human-logic datasets:

1. **ATOMIC 2020** for everyday event, intent, prerequisite, reaction, effect, desire, obstacle, and ordering knowledge.
2. **Social Chemistry 101** for contextual social norms, judgments, agreement, cultural pressure, legality, and responsibility.
3. **Moral Stories** for situation → intention → alternative action → consequence structures.
4. A manually curated **EMP Relationship Role Core** connecting common human roles and obligations to EMP relationship facts, contexts, stats, action affordances, and overrides.
5. The existing **TPL library** operating only after meaning has been resolved, as the written realization layer.

The completed product must feel like a lorebook or world bible to an author. Internally it must remain a deterministic relationship/context/stat/action compiler.

This is not a request to train a language model. These datasets are to be normalized into searchable, attributable, overridable logic priors and authoring suggestions. They must never become an opaque model or an uncontrolled dialogue generator.

Use subagents for bounded, non-overlapping work. Maintain one integration owner. Inspect the repository and all applicable instructions before editing. Preserve all unrelated user work.

---

## 1. Canonical project law

Lock the following laws into the architecture, types, UI language, tests, and documentation.

### 1.1 The communication stack

> **Lore retrieves what matters. The Keyword/Social-State system determines what can happen. BASED and Delivery Intensity shape the social performance. TPL supplies the written flesh.**

The runtime order is:

```text
Authored lore and live state
    → relevant lore activation
    → relationship/context/stat evaluation
    → semantic action availability
    → state-transition contract
    → BASED Vibe + Delivery Intensity
    → compatible TPL realization
    → facial presentation and written dialogue
```

### 1.2 Player-facing controls remain locked

The player does **not** select raw TPL cues or TPL profiles.

The player selects only:

1. One semantic request/action through the request/keyword system.
2. One canonical BASED Vibe.
3. Delivery Intensity: `SUBTLE`, `BALANCED`, or `OVERT`.

The system selects compatible TPL treatment and facial presentation automatically.

### 1.3 Meaning and wording are separate

The dialogue string is never the source of mechanical truth.

The semantic system determines:

- actor;
- target;
- operator;
- bound entities and resources;
- relationship facts;
- relevant contexts;
- relevant stats;
- desired state change;
- preconditions;
- responder evaluation;
- selected outcome;
- state effects;
- emitted history facts;
- facts that the final wording must preserve.

TPL may change how the message feels. It must not change the target, proposition, quantity, offer, threat, request, condition, or resolved state delta.

### 1.4 Commonsense is a prior, not canon

External human-logic data is fallible, culturally contingent, stereotype-bearing, and frequently defeasible.

Every imported assertion must therefore be marked as a **default prior** unless an author explicitly promotes it into world canon.

Required precedence:

```text
Explicit author canon
    > current world and encounter state
    > character-specific beliefs and traits
    > relationship contracts and obligations
    > current context
    > enabled human-logic priors
    > optional AI hypothesis
```

No imported record may directly change trust, fear, respect, leverage, resentment, obligation, availability, or any other live stat merely because it matched text.

It may:

- suggest a possible precondition;
- suggest a possible reaction;
- suggest a likely consequence;
- contribute a scored candidate;
- explain why a candidate was suggested;
- help an author create or revise a deterministic rule.

Only an authored or accepted deterministic rule may change live state.

---

## 2. Desired product outcome

Replace the current graph-first, UUID-first CRUD experience with an author-first lorebook.

The author should experience:

- a searchable world bible;
- readable entries for characters, relationships, obligations, locations, objects, contexts, events, rules, secrets, memories, and semantic actions;
- explicit aliases and activation rules;
- structured facts beneath the prose;
- character-specific knowledge and belief scopes;
- relationship and stat inspectors;
- history and progression;
- reusable human-logic packs;
- a context-preview tool explaining exactly what activated and why;
- an action-preview tool showing what semantic moves are available and why;
- a final contract preview showing what will be passed to BASED/TPL.

The underlying graph remains valuable, but it becomes an optional **Connections** view rather than the main authoring surface.

Raw UUIDs must not be the normal editing workflow. They remain available only in diagnostics, provenance, exports, and advanced inspection.

Native browser `prompt`, `confirm`, and `alert` dialogs must not be used for normal authoring.

---

## 3. Verified source registry

Use the following authoritative sources. Do not silently substitute scraped mirrors or community reposts.

### 3.1 ATOMIC 2020

**Purpose:** Primary EMP human event-logic source.

**Official repository:**
<https://github.com/allenai/comet-atomic-2020>

**Official dataset artifact:**
<https://drive.google.com/file/d/1uuY0Y_s8dhxdsoOe8OHRgsqf-9qJIai7/view?usp=drive_link>

**Artifact name:** `atomic2020_data-feb2021.zip`

**Direct-download form for an automated fetcher:**
`https://drive.google.com/uc?export=download&id=1uuY0Y_s8dhxdsoOe8OHRgsqf-9qJIai7`

**Paper:**
<https://ojs.aaai.org/index.php/AAAI/article/view/16792/16599>

**License:** Dataset CC-BY; code Apache-2.0. Confirm the license text from the downloaded/repository materials and store it in the source manifest.

**Published scale:** 1.33 million everyday inferential tuples across 23 relations:

- 9 social-interaction relations;
- 7 event-centered relations;
- 7 physical-entity relations.

**Important relation families:**

| ATOMIC relation | EMP interpretation |
| --- | --- |
| `xIntent` | likely actor goal or reason for acting |
| `xNeed` | likely prerequisite or prior state |
| `xAttr` | perceived actor attribute candidate; never treat as objective identity truth |
| `xEffect` | likely effect on actor |
| `xReact` | likely actor reaction/appraisal |
| `xWant` | likely actor follow-up desire |
| `oEffect` | likely effect on other participant |
| `oReact` | likely other-participant reaction/appraisal |
| `oWant` | likely other-participant follow-up desire |
| `HinderedBy` | obstacle or defeater |
| `IsBefore` | likely subsequent ordering relationship, according to source orientation after inspection |
| `IsAfter` | likely prior ordering relationship, according to source orientation after inspection |
| `HasSubEvent` | action decomposition candidate |
| `Causes` | general causal candidate |
| `xReason` | likely reason candidate |
| `ObjectUse` | object affordance candidate |
| `AtLocation` | likely location candidate |
| `CapableOf` | capability candidate |
| `Desires` / `NotDesires` | generalized desire candidate |

Do not assume column names or orientation solely from this table. The ingestion agent must inspect the archive, record its actual files and schemas, and lock verified mappings in tests.

### 3.2 Social Chemistry 101

**Purpose:** Contextual social norms and perceived social pressure.

**Official repository:**
<https://github.com/mbforbes/social-chemistry-101>

**Official dataset ZIP:**
<https://storage.googleapis.com/ai2-mosaic-public/projects/social-chemistry/data/social-chem-101.zip>

**Expected primary data file:** `social-chem-101.v1.0.tsv`

**Paper:**
<https://aclanthology.org/2020.emnlp-main.48/>

**License:** CC BY-SA 4.0.

**Published scale:**

- approximately 292,000 rules-of-thumb;
- approximately 104,000 situations;
- more than 4.5 million labels and free-text annotations.

**Important source fields:**

- `area`;
- `split`;
- `rot`;
- `rot-id`;
- `rot-agree`;
- `rot-bad`;
- `rot-categorization`;
- `rot-moral-foundations`;
- `rot-char-targeting`;
- `action`;
- `action-agency`;
- `action-moral-judgment`;
- `action-agree`;
- `action-legal`;
- `action-pressure`;
- `action-char-involved`;
- `action-hypothetical`;
- `situation`;
- `situation-short-id`;
- `characters`.

Required initial filtering policy:

1. Preserve raw records in the external cache.
2. Exclude `rot-bad = 1` from default retrieval.
3. Do not interpret `rot-agree` as truth.
4. Preserve disagreement and source domain.
5. Preserve whether an action is explicit, probable, hypothetical, or explicitly absent.
6. Preserve legality and cultural pressure as reported judgments, not universal facts.
7. Do not collapse morality, etiquette, advice, description, and legality into one score.
8. Allow authors to disable this pack globally or per project.
9. Keep CC BY-SA-derived output in a separately identifiable pack with attribution and license metadata.

The original repository notes that its legacy model-training dependencies are outdated. Do not adopt that training stack. Parse the TSV using the target repository's maintained toolchain or an isolated modern import script.

### 3.3 Moral Stories

**Purpose:** Branching social action and consequence examples.

**Official repository:**
<https://github.com/demelin/moral_stories>

**Official original dataset archive:**
<https://drive.google.com/file/d/1qze2jHi0Ed5dY7Cse55E34wVzeSGTvQs/view?usp=sharing>

**Direct-download form for an automated fetcher:**
`https://drive.google.com/uc?export=download&id=1qze2jHi0Ed5dY7Cse55E34wVzeSGTvQs`

**Maintained dataset mirror and viewer:**
<https://huggingface.co/datasets/demelin/moral_stories>

**Paper:**
<https://aclanthology.org/2021.emnlp-main.54/>

**License:** MIT according to the official repository and Hugging Face dataset card. Preserve the license and citation in the manifest.

**Published scale:** 12,000 structured narratives, represented in paired or task-specific forms.

**Canonical semantic fields visible in the maintained dataset:**

- `ID`;
- `norm`;
- `situation`;
- `intention`;
- `moral_action`;
- `moral_consequence`;
- `immoral_action`;
- `immoral_consequence`;
- task `label` where applicable.

Do not encode `moral_action` as mechanically successful or `immoral_action` as mechanically unsuccessful. These are dataset labels and examples, not universal outcome laws.

Normalize the source into paired candidate branches:

```text
situation
    + intention
    + norm assertion
    → branch A action
    → branch A consequence
    → branch B action
    → branch B consequence
```

Both branches remain default priors. Authors decide whether and how they become deterministic EMP outcome rules.

### 3.4 Sources explicitly excluded from the first implementation

Do **not** ingest the following into the distributable core in this assignment:

- GLUCOSE, because its dataset/models are CC BY-NC 4.0;
- EmpatheticDialogues, because its dataset card identifies CC BY-NC 4.0;
- unlicensed community lorebooks;
- copyrighted franchise lorebooks;
- scraped advice sites;
- arbitrary Reddit, forum, or roleplay packs;
- generated synthetic norms without source and review.

Their schemas may be discussed in documentation, but their records must not enter the shipped pack.

### 3.5 AI-writer lorebook behavior references

Use these systems only as interaction-design references:

- NovelAI Lorebook: <https://docs.novelai.net/en/text/lorebook/>
- Novelcrafter Codex entry anatomy: <https://www.novelcrafter.com/help/docs/codex/anatomy-codex-entry>
- Novelcrafter Codex overview: <https://www.novelcrafter.com/features/codex>
- SillyTavern World Info: <https://docs.sillytavern.app/usage/core-concepts/worldinfo/>
- AI Dungeon plot components: <https://help.aidungeon.com/faq/plot-components>

Adopt entry-first authoring, aliases, activation, relations, mentions, progression, priority, budgets, and context inspection. Do not copy proprietary styling, text, or assets.

---

## 4. Data acquisition and storage requirements

### 4.1 Never commit the raw corpora

The full downloaded archives and extracted raw corpora must not be committed to Git.

Create a repository-appropriate ignored cache, for example:

```text
.cache/emp-lore-packs/
├── downloads/
├── extracted/
├── normalized/
└── indexes/
```

If the repository already has a data-cache convention, use it instead.

Commit only:

- source manifests;
- attribution and license notices;
- fetch scripts;
- archive-validation code;
- deterministic normalization code;
- schemas;
- small reviewed fixtures;
- small curated EMP packs;
- tests;
- documentation.

### 4.2 Reproducible source manifest

Define a source manifest with at least:

```ts
type SourceManifest = {
  sourceId: string;
  displayName: string;
  sourceVersion: string;
  canonicalPageUrl: string;
  artifactUrl: string;
  expectedArtifactName: string;
  retrievedAt?: string;
  sha256?: string;
  byteSize?: number;
  licenseId: string;
  licenseUrl: string;
  citation: string;
  redistributionPolicy: "REFERENCE_ONLY" | "SEPARATE_PACK" | "ALLOW_WITH_ATTRIBUTION";
  enabledByDefault: boolean;
  notes: string[];
};
```

Do not invent checksums. Calculate them from downloaded bytes and record them in a local lock/receipt after a successful fetch. If a stable official checksum is discovered, record it separately as publisher checksum.

### 4.3 Safe downloader

The downloader must:

- use an explicit source allowlist;
- refuse unexpected redirect domains unless the manifest allows them;
- stream data rather than load the entire archive into memory;
- support resumable or retryable acquisition where the stack permits;
- calculate SHA-256;
- validate archive type;
- reject path traversal entries;
- reject extraction outside the target cache;
- report artifact size;
- emit a machine-readable receipt;
- skip a valid cached artifact;
- offer `--force` only as an explicit operator action;
- never delete unrelated cache contents;
- fail loudly instead of generating fake fixture data.

If Google Drive confirmation prevents automatic downloading, implement a clear fallback that accepts a user-supplied archive at the expected cache path and validates it identically. Do not automate login, scrape credentials, or bypass access controls.

### 4.4 Runtime must work offline

After a pack has been built, runtime lore retrieval and social-state compilation must not require network access.

### 4.5 Provenance survives normalization

Every normalized record must retain:

```ts
type ProvenanceRef = {
  sourceId: string;
  sourceVersion: string;
  sourceRecordId: string;
  sourceSplit?: string;
  sourceDomain?: string;
  transformVersion: string;
  licenseId: string;
};
```

When multiple source rows merge into one normalized candidate, retain all contributing provenance references.

---

## 5. Required agent team

The lead agent must form a team. Use the maximum safe parallelism supported by the environment, but never assign multiple agents to edit the same files simultaneously.

The lead owns:

- the master plan;
- agent boundaries;
- shared architectural decisions;
- integration;
- conflict resolution;
- final tests;
- final user report.

Subagents must not independently commit unless the lead explicitly delegates commit ownership. Prefer one integration/commit owner.

### 5.1 Wave One — parallel, read-only discovery

Spawn the following bounded agents after the lead has read `AGENTS.md` and established the repository root.

#### Agent A — Repository and architecture auditor

Mission:

- identify actual framework, package manager, persistence layer, route structure, tests, build commands, and authoring conventions;
- trace `/authoring/keyword-maker` end to end;
- trace current entity, relationship, context, stat, keyword, request, BASED, expression, TPL, and export schemas;
- identify migrations and saved-data compatibility requirements;
- identify raw UUID and browser-dialog problems;
- identify pre-existing user changes.

Deliver a report only. Do not edit production code during Wave One.

#### Agent B — Dataset provenance and acquisition auditor

Mission:

- validate all three canonical source pages, artifact URLs, filenames, licenses, and citations;
- inspect available archive structures without committing the data;
- propose cache layout, manifests, downloader approach, receipt format, and license notices;
- flag any discrepancy between this prompt and the live sources.

Deliver a report and exact source table. Do not normalize data yet.

#### Agent C — Domain-schema and migration designer

Mission:

- inspect the existing data model;
- propose the smallest compatible extension for lore entries, lore packs, activation rules, knowledge scopes, priors, provenance, action suggestions, and context previews;
- define migration and rollback-safe behavior;
- identify which existing IDs can be preserved.

Deliver types/schema proposals and migration risks. Do not modify shared types yet.

#### Agent D — Lorebook UX auditor

Mission:

- inspect the existing page and component system;
- map current controls into the new left-navigation / center-editor / right-inspector layout;
- identify reusable components and accessibility conventions;
- produce a route/component change map;
- define mobile and keyboard behavior.

Deliver a UI implementation map. Do not edit the route yet.

#### Agent E — EMP relationship and social-mechanics designer

Mission:

- inspect existing relationship facts, stats, contexts, action frames, DEAL/PRESSURE/ASK operators, and rule engine;
- propose a curated relationship-role pack that connects human-logic priors to existing EMP mechanics without auto-changing state;
- define role-specific affordance suggestions and override rules.

Deliver the proposed pack taxonomy and mappings. Do not edit shared pack files yet.

#### Agent F — TPL/BASED integration auditor

Mission:

- trace the current BASED, Delivery Intensity, TPL, and expression contracts;
- identify the exact handoff boundary from resolved semantic contract to surface realization;
- identify any current paths where TPL or dialogue text incorrectly controls mechanics;
- propose contract-preservation tests.

Deliver an integration report only.

### 5.2 Required architecture checkpoint

The lead must wait for Wave One, compare findings, and publish an internal decision record before production edits begin.

The checkpoint must lock:

- actual module/file ownership;
- canonical terminology;
- storage strategy;
- schema version;
- migration strategy;
- pack boundaries;
- data-fetch strategy;
- relationship-stat vocabulary;
- retrieval API;
- TPL handoff contract;
- UI component boundaries;
- test commands;
- each Wave Two agent's exclusive files.

If agents disagree, the lead decides and records why.

### 5.3 Wave Two — parallel implementation with exclusive ownership

After the checkpoint, assign non-overlapping implementation work.

#### Agent B2 — Data source and ingestion implementation

Own only:

- source manifests;
- download/validation scripts;
- extraction safety;
- ATOMIC normalizer;
- Social Chemistry normalizer;
- Moral Stories normalizer;
- normalized-record fixtures;
- ingestion unit tests;
- provenance and license documentation.

Do not edit the lorebook route or TPL runtime.

#### Agent C2 — Lorebook domain and persistence implementation

Own only:

- lorebook domain types;
- activation types;
- lore-pack registry types;
- knowledge scopes;
- migrations;
- persistence adapters;
- deterministic CRUD services;
- import/export format;
- domain unit tests.

Coordinate shared-type changes through the lead.

#### Agent D2 — Lorebook UI implementation

Own only:

- page layout;
- entry navigation;
- entry editor;
- tabs;
- relationship/stat/context inspector;
- pack manager;
- context-preview UI;
- loading/error/empty states;
- accessibility and responsive styling;
- UI component tests.

Use types locked at the checkpoint. Do not create duplicate domain types inside components.

#### Agent E2 — Relationship Role Core implementation

Own only:

- curated relationship-role pack data;
- role-pair definitions;
- obligations, permissions, likely tensions, and suggested stats;
- source notes;
- pack validation;
- fixtures and tests.

All outputs are suggestions/defaults. No pack entry may hard-code universal behavior.

#### Agent F2 — Retrieval and deterministic compiler integration

Own only:

- indexing adapter;
- activation and retrieval pipeline;
- prior scoring;
- relationship/context/stat applicability checks;
- candidate action-suggestion generation;
- explanation trace;
- context contract generation;
- runtime tests.

Do not implement dialogue wording.

#### Agent G2 — BASED/TPL boundary implementation

If concurrency permits, spawn or reassign an agent to own only:

- the semantic-contract-to-TPL handoff;
- BASED Vibe and Delivery Intensity compatibility;
- proposition-preservation validation;
- deterministic fallback behavior;
- expression request envelope;
- integration tests proving TPL cannot change mechanics.

If concurrency does not permit, the lead owns this work after integrating other Wave Two branches.

### 5.4 Wave Three — independent verification

Reassign at least one agent that did not author the tested subsystem as an adversarial QA reviewer.

The QA reviewer must attempt to break:

- license/source attribution;
- archive extraction safety;
- duplicate imports;
- migrations;
- activation matching;
- priority/budget behavior;
- knowledge-scope separation;
- author-canon precedence;
- relationship-direction handling;
- stat directionality;
- context exclusions;
- dialogue/semantic proposition preservation;
- mobile and keyboard authoring;
- import/export round trips;
- saved legacy data;
- performance on large indexes.

The QA agent reports failures to the lead. The owning implementation agent fixes them. The QA agent retests.

### 5.5 Standard agent return contract

Every agent must return:

1. Scope completed.
2. Files inspected.
3. Files changed.
4. Design decisions.
5. Assumptions.
6. Commands run.
7. Tests and exact results.
8. Known risks.
9. Required integration actions.

---

## 6. Mandatory repository audit before editing

Codex begins from an arbitrary directory. Establish the correct repository before any repo-specific command.

Expected repository:

```text
C:\Users\mcdon\Documents\ChatGPT\prototype-authoring-foundations-v01
```

Do not assume that path exists in the execution environment. Resolve and verify the repository root.

Inspect:

1. `AGENTS.md` and any nested instructions.
2. Current branch and `git status`.
3. Pre-existing modified and untracked files.
4. Package manager and lockfile.
5. Application framework.
6. TypeScript or language configuration.
7. Lint, format, test, E2E, and build scripts.
8. Existing persistence and schema-version mechanisms.
9. Keyword Maker route, components, services, state, APIs, fixtures, and tests.
10. EMP Raw and TPL Library routes.
11. BASED and facial-expression integrations.
12. Current JSON export format.
13. Existing seeded/demo data.
14. Current saved browser/local/server state.
15. Current accessibility and design-system primitives.

Preserve unrelated user changes. Never run `git reset --hard`, destructive checkout, broad clean, or bulk deletion.

Do not replace a partially implemented compatible system with a parallel duplicate.

---

## 7. Canonical domain model

Adapt names to existing conventions only if necessary. Preserve the concepts.

### 7.1 Lore entry

```ts
type LoreEntryType =
  | "CHARACTER"
  | "FACTION"
  | "LOCATION"
  | "RESOURCE"
  | "OBJECT"
  | "RELATIONSHIP"
  | "OBLIGATION"
  | "CONTEXT"
  | "EVENT"
  | "MEMORY"
  | "SECRET"
  | "RULE"
  | "SEMANTIC_ACTION"
  | "HUMAN_LOGIC_PRIOR";

type LoreEntry = {
  id: string;
  schemaVersion: number;
  type: LoreEntryType;
  name: string;
  aliases: string[];
  tags: string[];
  canonicalStatus: "CANON" | "DEFAULT_PRIOR" | "DRAFT" | "DEPRECATED";
  summary: string;
  authorNotes?: string;
  aiContextText?: string;
  activation: ActivationPolicy;
  facts: LoreFact[];
  relationships: RelationshipRef[];
  stats: StatBinding[];
  knowledge: KnowledgeBinding[];
  mechanics: MechanicBinding[];
  progression: ProgressionRecord[];
  provenance: ProvenanceRef[];
  createdAt: string;
  updatedAt: string;
};
```

### 7.2 Activation policy

```ts
type ActivationPolicy = {
  mode: "ALWAYS" | "DETECTED" | "AUTHOR_ONLY" | "DISABLED";
  keys: string[];
  aliasesIncluded: boolean;
  matchMode: "TOKEN" | "PHRASE" | "EXACT" | "REGEX";
  caseSensitive: boolean;
  requireAny?: string[];
  requireAll?: string[];
  excludeAny?: string[];
  participantIds?: string[];
  locationIds?: string[];
  requiredContextIds?: string[];
  forbiddenContextIds?: string[];
  priority: number;
  tokenBudget?: number;
  recursionMode: "NONE" | "REFERENCED_ENTRIES";
  maxRecursionDepth: number;
};
```

Regex must be validated and safely bounded. Invalid regex cannot crash preview or runtime.

### 7.3 Knowledge scope

Support at least:

- `ACTUAL` — objective authored world fact;
- `PUBLIC` — broadly available information;
- `KNOWN_BY` — known by listed entities;
- `BELIEVED_BY` — believed by listed entities, possibly false;
- `SUSPECTED_BY` — uncertain belief;
- `AUTHOR_ONLY` — never sent to runtime realization.

The same proposition may exist in conflicting scopes. Do not collapse actual truth and belief.

### 7.4 Human-logic prior

```ts
type PriorKind =
  | "INTENT"
  | "PRECONDITION"
  | "ACTOR_EFFECT"
  | "OTHER_EFFECT"
  | "ACTOR_REACTION"
  | "OTHER_REACTION"
  | "FOLLOWUP_WANT"
  | "OBSTACLE"
  | "EVENT_ORDER"
  | "SUBEVENT"
  | "OBJECT_AFFORDANCE"
  | "SOCIAL_NORM"
  | "SOCIAL_JUDGMENT"
  | "CULTURAL_PRESSURE"
  | "LEGALITY_JUDGMENT"
  | "ACTION_CONSEQUENCE";

type HumanLogicPrior = {
  id: string;
  kind: PriorKind;
  triggerText: string;
  consequentText: string;
  actorPlaceholder?: string;
  otherPlaceholder?: string;
  sourceConfidence?: number;
  agreementBucket?: number;
  sourceCategory?: string[];
  sourceDomain?: string;
  culturallyContingent: boolean;
  defaultOnly: true;
  provenance: ProvenanceRef[];
};
```

### 7.5 Retrieval result

```ts
type RetrievalReason = {
  entryId: string;
  reasonType:
    | "ALWAYS_ON"
    | "KEY_MATCH"
    | "ALIAS_MATCH"
    | "RELATION_REFERENCE"
    | "CONTEXT_MATCH"
    | "PARTICIPANT_MATCH"
    | "SEMANTIC_SIMILARITY"
    | "MANUAL_PIN";
  matchedValue?: string;
  score: number;
};

type LoreRetrievalResult = {
  includedEntries: Array<{
    entry: LoreEntry;
    reasons: RetrievalReason[];
    estimatedTokens: number;
  }>;
  excludedEntries: Array<{
    entryId: string;
    reason: string;
  }>;
  activatedPriors: HumanLogicPrior[];
  totalEstimatedTokens: number;
  warnings: string[];
};
```

Keyword matching must work without embeddings. Semantic/vector search may be an optional adapter, never a required dependency.

### 7.6 State-transition contract

The existing contract should be extended rather than duplicated. It must contain or reference:

- actor;
- target;
- operator: initially `DEAL`, `PRESSURE`, or `ASK`;
- action frame;
- bound semantic tokens;
- active relationship facts;
- active contexts;
- relevant stat snapshot;
- preconditions and their evaluations;
- desired state change;
- responder evaluation trace;
- resolved outcome;
- deterministic effects;
- emitted history facts;
- mandatory semantic facts for realization;
- BASED Vibe;
- Delivery Intensity;
- allowed TPL treatment constraints;
- expression request;
- source lore and prior provenance used as suggestions.

Do not permit a prior or lore entry to bypass outcome resolution.

---

## 8. EMP Relationship Role Core

Create a small, reviewed, first-party pack that connects common social roles to EMP mechanics.

### 8.1 Required starter role pairs

Include at least:

- creditor ↔ debtor;
- lender ↔ borrower;
- landlord ↔ tenant;
- employer ↔ worker;
- supervisor ↔ subordinate;
- buyer ↔ seller;
- supplier ↔ customer;
- owner ↔ borrower of property;
- promisor ↔ promise recipient;
- favor giver ↔ favor receiver;
- authority ↔ subject;
- guardian ↔ dependent;
- protector ↔ protected person;
- host ↔ guest;
- friend ↔ friend;
- ally ↔ ally;
- rival ↔ rival;
- confidant ↔ secret holder;
- witness ↔ observed actor;
- information holder ↔ information seeker;
- blackmailer ↔ pressure target;
- negotiator ↔ counterpart;
- parent ↔ child;
- sibling ↔ sibling.

### 8.2 Every role pair declares suggestions, not behavior

Each role-pair entry may suggest:

- directional relationship fact;
- reciprocal or asymmetric structure;
- common obligations;
- common permissions;
- common violations;
- likely leverage sources;
- relevant context tags;
- relevant stats;
- possible DEAL/PRESSURE/ASK affordances;
- common blockers;
- candidate history facts;
- author questions.

It must not declare that every creditor is threatening, every authority is obeyed, every friend is trusted, or any other universal stereotype.

### 8.3 Initial relationship stats

Reuse existing canonical stats wherever possible. If the current system lacks a coherent starter set, support these as optional directional or reciprocal stats:

- trust;
- respect;
- fear;
- leverage;
- resentment;
- obligation;
- familiarity.

Do not hard-code every role pair to use every stat.

### 8.4 Example role definition

```yaml
id: emp.role.creditor_debtor.v1
name: Creditor and Debtor
directional: true
roles:
  source: CREDITOR
  target: DEBTOR
relationship_fact: OWED_BY
suggested_stats:
  - obligation
  - trust
  - respect
  - leverage
  - resentment
common_obligations:
  - debtor repays agreed value by agreed condition
  - creditor recognizes valid satisfaction of the debt
possible_ask_actions:
  - REQUEST_EXTENSION
  - REQUEST_PARTIAL_PAYMENT
possible_deal_actions:
  - OFFER_RESOURCE_FOR_EXTENSION
  - RENEGOTIATE_TERMS
possible_pressure_actions:
  - INVOKE_CONSEQUENCE
  - REVEAL_NONPAYMENT
default_only: true
author_questions:
  - Is the debt legitimate?
  - Does each party agree on the amount and deadline?
  - Who else knows about it?
  - What collateral or leverage exists?
```

---

## 9. Lorebook user experience

### 9.1 Global layout

Implement a three-region authoring layout.

#### Left — Lorebook navigation

- search by name, alias, text, tag, type, and source pack;
- filters for entry type, canonical status, context, pack, and validation state;
- category groups;
- compact entry cards showing readable names, not raw IDs;
- `New Entry` menu;
- pack enable/disable status;
- import/export controls.

#### Center — Selected entry editor

Tabs or equivalent sections:

1. **Overview** — name, aliases, type, summary, tags, canonical status.
2. **Facts** — structured propositions and knowledge scopes.
3. **Relationships** — typed links and direction.
4. **Stats** — values, bounds, ownership, direction, and change history.
5. **Activation** — aliases, keys, conditions, priority, budget, recursion.
6. **Mechanics** — semantic actions, preconditions, outcomes, and state effects.
7. **History** — progression, changes, memories, evidence.
8. **Sources** — source pack, license, record provenance, transform version.

#### Right — Live inspector

- selected-entry validation;
- incoming and outgoing relationships;
- active contexts;
- relevant stats;
- knowledge visibility summary;
- action availability summary;
- warnings;
- quick preview launch.

### 9.2 Top-level controls

Replace raw CRUD button clutter with:

- `New Entry`;
- `Lore Packs`;
- `Context Preview`;
- `Connections`;
- `Import`;
- `Export`;
- `Advanced`.

Preserve powerful existing capabilities within appropriate tabs or dialogs.

### 9.3 Lore Packs manager

Show:

- pack name and version;
- source;
- enabled/disabled state;
- number of raw, normalized, indexed, and rejected records;
- license;
- attribution;
- checksum/receipt status;
- last built time;
- validation status;
- download/build/rebuild action;
- local cache status;
- warnings about cultural contingency;
- pack-level activation and priority settings.

The user must be able to remove a local cache or rebuild a pack without deleting authored lore entries. Use a scoped, confirmable, recoverable operation.

### 9.4 Context Preview

Build a deterministic preview tool accepting:

- scene text or semantic action seed;
- actor;
- target;
- participants;
- location;
- active contexts;
- world-state snapshot;
- BASED Vibe;
- Delivery Intensity.

It must display:

- included lore entries;
- why each activated;
- exact alias/key/condition match;
- included facts;
- applied knowledge perspective;
- candidate human-logic priors;
- source and license;
- included relationship facts;
- stat values consulted;
- semantic actions exposed;
- failed action preconditions;
- excluded lore and reasons;
- token estimate;
- final state-transition contract;
- TPL realization envelope, without allowing TPL to alter the contract.

### 9.5 Progressive disclosure

Basic mode shows:

- name;
- type;
- aliases;
- summary;
- relationships;
- essential facts.

Mechanics mode shows:

- stats;
- action frames;
- rules;
- outcomes;
- knowledge scopes.

Advanced mode shows:

- raw IDs;
- regex;
- priority;
- token budget;
- recursion;
- source record IDs;
- normalized JSON;
- migration/schema information.

### 9.6 Accessibility

Require:

- full keyboard navigation;
- visible focus;
- correct labels and descriptions;
- no color-only state distinctions;
- screen-reader-readable validation;
- reduced-motion compatibility;
- usable narrow viewport;
- focus trapping/restoration for dialogs;
- meaningful empty and error states.

---

## 10. Ingestion and normalization pipeline

### 10.1 Pipeline stages

Implement explicit stages:

```text
source manifest
    → fetch or validate supplied archive
    → safe extract
    → raw schema inspection
    → deterministic normalization
    → validation and rejection report
    → deduplication
    → pack build
    → search index build
    → receipt and statistics
```

Every stage must be rerunnable and idempotent.

### 10.2 ATOMIC normalizer

The ATOMIC normalizer must:

- enumerate every source file;
- validate required columns;
- preserve source relation;
- preserve original head/tail text;
- normalize participant placeholders without losing originals;
- map only verified relations;
- label potentially stereotype-bearing `xAttr` records carefully;
- distinguish social, event, and physical families;
- emit rejection reasons;
- retain duplicates until the dedupe stage can compare provenance;
- generate small deterministic fixtures covering all imported relation types.

Initial pack priorities:

1. Social-interaction relations.
2. Event-centered relations.
3. Physical/object relations only where useful to resource and location lore.

### 10.3 Social Chemistry normalizer

The Social Chemistry normalizer must:

- parse TSV safely;
- preserve blank/null distinctions;
- preserve source area;
- preserve split;
- exclude `rot-bad = 1` from default index while retaining it in rejection/audit counts;
- represent morality, norms, advice, and description as separate tags;
- preserve moral-foundation labels as source annotations, not EMP laws;
- preserve legality and pressure separately;
- preserve worker-agreement buckets;
- preserve character-targeting and action-involvement fields;
- record cultural contingency on every normalized record;
- provide filters by source area and agreement bucket.

Do not include worker IDs in user-facing prompts or normal lore context. Preserve only if legally and technically necessary for source traceability; otherwise omit from normalized runtime data.

### 10.4 Moral Stories normalizer

The Moral Stories normalizer must:

- acquire one canonical representation without duplicating the same story across 26 task configurations;
- preserve original IDs;
- reconstruct moral/immoral branch pairs where required;
- preserve norm, situation, intention, action, and consequence separately;
- record missing/not-specified fields explicitly;
- never infer a deterministic stat delta during import;
- expose each branch as an action-consequence prior;
- support author comparison of both branches;
- record license and source provenance.

### 10.5 Deduplication

Deduplication must be deterministic and explainable.

Use normalized keys and source IDs. Do not use an LLM to decide whether two records are duplicates.

When text-normalized records collide:

- preserve all provenance;
- preserve differing annotations;
- do not average incompatible categories into a false certainty;
- expose disagreement.

### 10.6 Indexing

Do not load millions of records into React state or the initial page payload.

Use the repository's available storage technology after audit. Suitable options may include:

- SQLite with full-text search;
- an existing local database;
- server-side indexed JSON/NDJSON shards;
- an existing embedded search adapter.

Requirements:

- exact-key and phrase retrieval without embeddings;
- filters by source, kind, relationship role, context, and pack;
- bounded result count;
- stable ordering;
- provenance returned with every result;
- no network requirement;
- index version tied to transform version;
- rebuild when source or transform version changes.

Vector search is optional and must sit behind an interface. Do not block the core implementation on embeddings.

---

## 11. Prior scoring and deterministic applicability

### 11.1 Candidate scoring

Candidate prior scoring may consider:

- exact semantic-action match;
- normalized verb/frame overlap;
- actor/other participant compatibility;
- active relationship role;
- active context;
- source reliability/quality flag;
- source agreement annotation;
- author pinning;
- pack priority.

The score controls retrieval rank only. It does not make the prior true.

### 11.2 Applicability trace

Every candidate must return an explanation:

```text
Included because:
- action frame matched REQUEST_EXTENSION;
- relationship role matched DEBTOR_TO_CREDITOR;
- context matched PRIVATE_NEGOTIATION;
- source record was not marked low quality;
- author enabled Social Norms Core.

Not promoted to mechanic because:
- no authored effect rule references this prior.
```

### 11.3 Author promotion workflow

Allow an author to promote a prior into:

- a draft lore fact;
- a draft precondition;
- a draft action affordance;
- a draft outcome effect;
- a draft reaction rule;
- a character belief;
- a relationship-role override.

Promotion must create a new first-party authored object with a provenance link. It must not mutate the source pack record.

The author must review and save it before it affects live mechanics.

---

## 12. TPL/BASED realization boundary

### 12.1 Required handoff

After semantic resolution, create or reuse one typed realization envelope containing:

- resolved proposition;
- speaker;
- addressee;
- mandatory facts;
- forbidden semantic changes;
- dialogue act/action frame;
- outcome status;
- BASED Vibe;
- Delivery Intensity;
- compatible TPL families/protocol constraints selected by the system;
- expression request;
- deterministic fallback text key.

### 12.2 Proposition-preservation validator

Before accepting realized dialogue, validate that it does not:

- change the actor or target;
- change quantity;
- change requested resource;
- turn an ask into a threat;
- turn a threat into an offer;
- add a concession that was not resolved;
- remove a condition;
- assert knowledge unavailable to the speaker;
- reveal author-only lore;
- contradict the resolved outcome.

If validation fails, use deterministic fallback wording and log an explainable diagnostic.

### 12.3 No direct source prose dumping

Do not dump retrieved ATOMIC, Social Chemistry, or Moral Stories prose directly into final dialogue.

The data informs suggestions and reasoning. TPL realizes an authored semantic contract.

---

## 13. Persistence, migrations, and compatibility

### 13.1 Preserve current data

Existing entities, relationships, contexts, stats, aliases, and IDs must migrate without loss.

Where current records lack new fields, provide deterministic defaults.

### 13.2 Schema versioning

Every saved lorebook/export must carry an explicit schema version.

Implement:

- migration from current format;
- validation before save;
- validation after migration;
- stable export ordering;
- round-trip tests;
- duplicate-ID detection;
- readable error reports.

### 13.3 Import formats

At minimum support:

- the application's canonical JSON format;
- current legacy Keyword Maker export;
- internal lore-pack format.

If NovelAI/SillyTavern import is easy and safe, place it behind a separate adapter and label unsupported fields. It is not required for core acceptance.

### 13.4 Failure behavior

A failed pack import, failed migration, or failed index build must not corrupt authored lore.

Use transactional or staged replacement behavior appropriate to the current persistence layer.

---

## 14. Testing requirements

### 14.1 Dataset tests

Test:

- manifest validation;
- source allowlist;
- redirect handling;
- SHA-256 receipt generation;
- cache reuse;
- corrupt archive rejection;
- zip-slip/path traversal rejection;
- unexpected schema rejection;
- each imported ATOMIC relation;
- Social Chemistry nulls and categorical values;
- `rot-bad` filtering;
- Social Chemistry disagreement preservation;
- Moral Stories branch pairing;
- duplicate provenance merge;
- idempotent rebuild;
- license manifest presence.

### 14.2 Domain tests

Test:

- lore-entry validation;
- alias behavior;
- knowledge-scope separation;
- directional relationships;
- reciprocal relationships;
- stat bounds;
- context requirements and exclusions;
- activation modes;
- invalid regex isolation;
- recursive activation depth;
- priority and budget behavior;
- migration and export round trips.

### 14.3 Compiler tests

Test:

- explicit canon overrides a prior;
- character belief may differ from actual truth;
- current context defeats a generic norm;
- relationship role affects applicability without creating an automatic effect;
- a retrieved reaction does not change emotion stats by itself;
- unavailable actions show failed preconditions;
- deterministic state resolution works with all external packs disabled;
- output is stable for the same state and input.

### 14.4 TPL boundary tests

For each operator `DEAL`, `PRESSURE`, and `ASK`, test every Delivery Intensity:

- `SUBTLE`;
- `BALANCED`;
- `OVERT`.

Verify that wording changes but semantic proposition does not.

Test that the player never directly selects a raw TPL cue/profile.

Test deterministic fallback when TPL realization is missing or invalid.

### 14.5 UI and E2E tests

Test:

- create/edit/delete or archive entry through accessible dialogs;
- search by name and alias;
- filter by entry type and pack;
- create a relationship without entering a UUID;
- inspect stat direction;
- build/enable/disable a pack;
- preview activation reason;
- promote a prior to a draft authored rule;
- save and reload;
- import/export round trip;
- legacy-data migration;
- keyboard-only operation;
- narrow viewport;
- empty, loading, validation, and failure states.

### 14.6 Performance tests

Measure rather than guess.

At minimum record:

- normalized row counts;
- index size;
- pack build time;
- cold query time;
- warm query time;
- context-preview time;
- initial page payload;
- browser memory while browsing results.

The UI must page or virtualize large result sets and request only bounded records.

---

## 15. Required demonstration fixture

Create a compact first-party demo involving Marcus “Broker” Hill and Apartment 305 without polluting the general source packs.

The fixture should include:

- PLAYER;
- Marcus;
- Apartment 305;
- a debt obligation;
- a repayment deadline;
- a cash resource;
- a private negotiation context;
- at least one secret or leverage fact;
- directed relationship stats;
- actual versus believed knowledge;
- `ASK`, `DEAL`, and `PRESSURE` actions;
- multiple action outcomes;
- TPL realization preview.

Example semantic actions:

- `REQUEST_EXTENSION`;
- `OFFER_PARTIAL_PAYMENT`;
- `OFFER_CASH_FOR_EXTENSION`;
- `TRADE_INFORMATION`;
- `CHALLENGE_DEBT_VALIDITY`;
- `INVOKE_CONSEQUENCE`.

Required proof:

1. Mentioning Marcus activates the Marcus entry.
2. The creditor/debtor role pack becomes relevant.
3. Human-logic priors appear as attributed suggestions.
4. A prior alone does not change state.
5. Authored rules determine available actions and effects.
6. Selecting an action, BASED Vibe, and Delivery Intensity produces a realization envelope.
7. TPL changes wording/presentation without changing the mechanical proposition.

---

## 16. Security, privacy, bias, and content controls

### 16.1 Bias and stereotypes

Implement warnings and review tools for:

- person-attribute claims;
- demographic generalizations;
- legality claims;
- cultural-pressure claims;
- authority/obedience assumptions;
- gendered role expectations;
- moral absolutism;
- violent or coercive consequences.

Source data must never be presented as “how humans work.” Label it as observed/crowdsourced commonsense annotations and defaults.

### 16.2 Source text and prompt exposure

Do not send an entire source corpus to a language model.

Do not expose worker identifiers in normal UI or prompts.

Do not surface author-only facts to runtime dialogue.

### 16.3 Download security

Do not execute code from downloaded dataset archives.

Do not install legacy model dependencies from the source repositories.

Treat all archive contents as untrusted data.

---

## 17. Documentation deliverables

Create repository-appropriate documentation covering:

1. Lorebook architecture.
2. Canonical communication stack.
3. Source registry and citations.
4. License and attribution requirements.
5. Fetch/build commands.
6. Cache behavior.
7. Normalized schemas.
8. Human-logic prior semantics.
9. Relationship Role Core.
10. Activation and context preview.
11. Knowledge scopes.
12. State-transition contract.
13. BASED/TPL boundary.
14. Migration and rollback-safe behavior.
15. Testing and benchmark results.
16. Known limitations and deferred work.

Also produce a machine-readable source manifest and an attribution file included in exports when source-derived entries are present.

---

## 18. Acceptance criteria

The assignment is complete only when all applicable criteria pass.

### 18.1 Data

- [ ] Three authoritative source manifests exist.
- [ ] Fetch/validate workflow exists for all three sources.
- [ ] Raw corpora are Git-ignored.
- [ ] Archive validation is safe.
- [ ] Provenance survives normalization.
- [ ] Licenses and citations are stored.
- [ ] Pack builds are reproducible and idempotent.
- [ ] No noncommercial dataset is included.

### 18.2 Lorebook

- [ ] The tool is entry-first rather than UUID-first.
- [ ] Names and aliases drive normal authoring.
- [ ] Relationships, contexts, and stats remain first-class mechanics.
- [ ] Knowledge and belief scopes are supported.
- [ ] Graph view is optional.
- [ ] Native browser prompts are removed from normal workflows.
- [ ] Import/export and migration work.

### 18.3 Human logic

- [ ] ATOMIC priors are searchable.
- [ ] Social Chemistry norms are searchable with quality and contingency metadata.
- [ ] Moral Stories branches are searchable as paired action/consequence examples.
- [ ] Relationship Role Core exists and validates.
- [ ] Priors never directly mutate state.
- [ ] Authors can promote a prior into a reviewed draft mechanic.
- [ ] Explicit canon always wins.

### 18.4 Compiler and TPL

- [ ] Deterministic action availability works with all external packs disabled.
- [ ] State-transition contracts are inspectable.
- [ ] Player controls remain semantic request + BASED Vibe + Delivery Intensity.
- [ ] TPL receives a resolved meaning contract.
- [ ] TPL cannot alter the proposition.
- [ ] Deterministic fallbacks exist.

### 18.5 Quality

- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] E2E tests pass where the repository supports them.
- [ ] Build passes.
- [ ] Lint/typecheck passes.
- [ ] Legacy data is preserved.
- [ ] Performance measurements are recorded.
- [ ] Accessibility checks pass.
- [ ] Independent QA agent has retested fixes.

---

## 19. Explicit non-goals for this pass

Do not expand scope into:

- training or fine-tuning a model;
- voice or audio;
- direct player selection of TPL cues;
- autonomous AI mutation of canon;
- autonomous AI mutation of relationship stats;
- full ConceptNet ingestion;
- GLUCOSE ingestion;
- EmpatheticDialogues ingestion;
- community lorebook marketplaces;
- copyrighted franchise data;
- multiplayer synchronization;
- Unity or Phaser porting;
- replacing the entire project persistence architecture without necessity.

Design clean interfaces for future additions, but finish the current implementation first.

---

## 20. Stop conditions and fallback behavior

Do not stop merely because:

- a dataset is large;
- a legacy source repository has outdated training dependencies;
- network access is unavailable in the current Codex environment;
- the UI needs migration;
- there are pre-existing unrelated changes.

If network access is unavailable, implement and test download validation against small local fixtures, provide exact fetch commands, and clearly report that the real source build remains unverified. Never fabricate a successful corpus build.

Stop and ask the user only if:

- the actual repository cannot be located;
- required repository instructions conflict irreconcilably;
- a destructive migration cannot be avoided and the intended target is ambiguous;
- a source license materially contradicts the verified registry and no compliant path exists;
- completing the task requires credentials or authority not already available.

---

## 21. Final verification and handoff format

Before reporting completion, the lead must:

1. Review `git diff` and `git status`.
2. Confirm unrelated user changes were preserved.
3. Run the repository's required test, lint, typecheck, and build commands.
4. Run ingestion fixtures.
5. Run real pack builds when source access permits.
6. Record data counts and checksums without pasting large raw data.
7. Run the Marcus demonstration.
8. Run proposition-preservation tests.
9. Run independent QA.
10. Document remaining limitations honestly.

Final response must lead with the outcome and include:

- what was implemented;
- which agents handled which bounded areas;
- important architecture decisions;
- exact data sources acquired;
- pack counts and validation results;
- files/modules changed;
- migration behavior;
- tests and exact outcomes;
- benchmark summary;
- known limitations;
- how to launch and inspect the result;
- commit hash if a commit was explicitly requested or appropriate to the repository workflow.

Do not claim completion if only fixtures were tested or real source acquisition failed. State the exact boundary between implemented infrastructure and verified live data.

---

## 22. Final architectural reminder

The goal is not to make an LLM improvise “human behavior.”

The goal is to give authors a powerful lorebook containing:

- explicit world facts;
- scoped knowledge and beliefs;
- typed relationships;
- contexts;
- stats;
- obligations;
- reusable semantic actions;
- attributed human-logic priors;
- deterministic rules and outcomes;
- explainable activation;
- inspectable state transitions.

Then BASED and Delivery Intensity shape the social performance, and TPL realizes the already-resolved message in writing.

> **Lore supplies relevant memory. Mechanics decide. TPL speaks.**
