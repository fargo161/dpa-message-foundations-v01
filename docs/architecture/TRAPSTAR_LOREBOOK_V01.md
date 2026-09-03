# Trapstar Human Logic Lorebook Architecture v01

## Purpose and boundary

The lorebook is a static, nonlinear reading surface for the 14 keyword definitions in `src/keywords.mjs`. It explains the executable foundation; it does not expand that foundation. External datasets are attributed, defeasible evidence priors. They are never authored facts, BASED mappings, TPL protocols, player dialogue, or permission to infer a new semantic fact. The repository remains `UNLICENSED` and the source artifacts remain under their registered source policies.

The site deliberately keeps the following statuses visible and separate:

- `PROJECT_AUTHORED`: canonical repository definitions or reviewed project metadata.
- `EDITORIAL_INTERPRETATION`: navigation, comparison, trail, and explanatory synthesis.
- `EVIDENCE_PRIOR`: acquired research evidence retained for review only, with `runtimeEligible: false`.
- `ILLUSTRATIVE_FICTION`: a human-readable scenario or example, not a source claim.
- `COMMENTARY_ONLY`: satirical marginalia that cannot authorize mechanics.

TPL remains presentation-only. All 180 BASED matrix cells remain `UNMAPPED`, approved runtime TPL protocols remain zero, and dynamic dialogue population remains deferred to Phase 2.

## Content source and schema

`src/lorebook/content.mjs` is the single authored content source. It exports `LOREBOOK_CONTENT` with:

```text
schemaVersion: "dpa-lorebook@0.1"
site: { title, subtitle, description }
articles: one article per KEYWORDS[].keywordId
trails: editorial routes over canonical keyword IDs
includeCanonicalRuleEdges: boolean
```

Each article carries the canonical ID and name, street definition, technical definition, mechanic change, material relationships, emotional-leverage explanation, mechanics inputs/preconditions/state changes/outputs/blockers, typed keyword relationships, supported action affordances, BASED Vibe/intensity boundary, examples, confusion comparisons, evidence references, illustration metadata, and commentary. The source also includes a compatibility projection with implemented action IDs only; unsupported canonical affordances remain explicitly non-runtime.

The build model validates exact canonical coverage, duplicate IDs, required substantive sections, action IDs, BASED IDs and intensities, illustration alt text, relationship targets/types/source identity, trail targets, and minimum trail coverage. It rejects dangling references rather than generating a plausible-looking page.

## Links, backlinks, and relationship semantics

An article relationship is directional: `{ targetId, type, label, rationale }`. Types are registered in the source and rendered as text, so color is never the only meaning. Explicit article edges are kept distinct from `CO_OCCURS_WITH` edges derived from the multi-keyword `CROSS_KEYWORD_RULES`; a derived edge is a navigation projection, not an actual-world assertion.

The site derives incoming backlinks from the final de-duplicated edge set. Every “points here from” entry must have a corresponding forward edge, and every target must be one of the canonical IDs. Directed ontology meanings such as `OWES`, `CONTROLS`, and `HAS_LEVERAGE_OVER` are not silently made reciprocal.

Inline `[[KEYWORD_ID|optional label]]` references are converted to ordinary HTML links only when the target exists. Core articles and navigation remain usable with JavaScript disabled. Physical `index.html` directories give stable direct URLs and refresh behavior; the generated `404.html` contains an optional JavaScript route redirect plus no-JavaScript links back to the index and search.

## Illustration grammar

`src/lorebook/illustrations.mjs` supplies the original SVG renderer and one keyword-specific symbol for each canonical ID. Every illustration uses the same `0 0 640 360` viewBox and grammar:

```text
ACTOR node -> directional relationship -> TARGET node
                         |
                       STAKE
                         |
                    STATE label
```

The symbol, stake label, arrow direction, title, description, and text labels explain the term. SVG is generated from escaped project-authored values; scriptable or external SVG constructs are rejected before embedding. `src/lorebook/lorebook.css` supplies the charcoal/paper, evidence-red, nicotine-gold, and cool-signal system, dark-mode variables, line textures, focus states, responsive behavior, and reduced-motion handling. It is embedded into the static pages by `scripts/lorebook-build.mjs` so the build is self-contained.

## Evidence and commentary

Evidence references include source ID, source version, license ID, redistribution policy, claim scope, status, and an explicit `runtimeEligible: false`. No raw corpus bytes or worker-level records are copied into the lorebook. The Luangrath–Peck–Barger manuscript is conceptual TPL authority only and is not represented as an indexed reusable corpus. A scenario is labeled as illustrative, and a marginal note is rendered under a commentary label; neither is included in the mechanics store.

## Safe extension procedure

1. Add or change a canonical keyword in `src/keywords.mjs` first. Run the existing keyword/schema tests; do not add a lorebook article for a noncanonical ID.
2. Add exactly one article spec for the new canonical ID in `src/lorebook/content.mjs`. Reuse the required field structure, use only registered relationship/action/Vibe IDs, and state unsupported affordances as non-runtime.
3. Add or update typed relationship edges only when their direction and claim are defensible. Use a trail only as editorial navigation, never as a mechanics rule.
4. Add the keyword symbol in `src/lorebook/illustrations.mjs`, keeping actor/target/stake/arrow/state labels and accessible title/description intact.
5. Run `npm run lorebook:check`, `npm run lorebook:build`, and `npm test`. Inspect the generated direct routes at both phone and desktop widths.

Do not edit generated HTML as a second source of truth. Do not add external images, fonts, raw corpora, dynamic dialogue, TPL atoms, approved protocols, or player-visible raw TPL controls in this phase.

## Deferred Phase 2 extension points

Future work may add a keyword action only after authored state, schema, and mechanics checks exist; a semantic slot only after adapter and invariance tests; a TPL atom only after primary-source review and protocol approval; and a matrix cell only after a reviewed protocol and authored mapping exist. Dynamic dialogue population, runtime corpus selection, TPL protocol approvals, and semantic realization remain intentionally deferred.

## Verification commands

```powershell
npm ci
npm test
npm run lint
npm run typecheck
npm run schema:validate
npm run build
node scripts/check-generated.mjs
npm run lorebook:check
npm run lorebook:build
git diff --check
```

The cache-dependent `npm run test:real` remains a separate local verification command and is not required to render the documentation. It must never cause ignored corpora to enter Git.
