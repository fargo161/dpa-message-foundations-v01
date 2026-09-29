# DPA Message Foundations — repository laws

## Scope

This isolated repository implements the Phase 1 semantic keyword, mechanics, BASED matrix, and TPL intake foundation. The connected legacy repository named in `handoff/REPOSITORY_CONNECTIONS.local.json` is read-only evidence. Do not run commands there that install, format, build, test with generated output, migrate, generate, commit, push, or otherwise mutate state.

## Canonical boundaries

- Lore and authored state establish facts; deterministic mechanics resolve actions and state transitions.
- `DEAL`, `PRESSURE`, and `ASK` are macro speech acts. Concrete actions remain separate from the macros.
- BASED has exactly five cues, 20 ordered two-cue Vibes, and no numeric cue mixture authority.
- Delivery Intensity is exactly `SUBTLE`, `BALANCED`, or `OVERT`; it changes written-signal salience only.
- TPL changes written presentation only and cannot change a semantic payload, outcome, actor, target, timing, leverage, condition, or knowledge boundary.
- Human-logic sources are defeasible, attributed priors. They cannot mutate live state, define BASED, or enter runtime without authored review.
- Face evidence is separate and is never constructed or mutated by the TPL renderer.

## Data and provenance

- Raw corpora belong only in ignored `.cache/external-data/` subdirectories.
- A manifest-only or fixture-only source is never described as downloaded, imported, approved, or runtime-ready.
- Never invent checksums, counts, versions, or license terms. Real receipts are created only from validated bytes.
- Keep source evidence, normalized candidates, review records, approved content, and runtime-safe content distinct.

## Editing and validation

- Use stable deterministic IDs and idempotent imports. Persistence-level uniqueness is required.
- Preserve existing files and changes. Never use destructive reset, checkout, clean, or broad deletion commands.
- Use `apply_patch` for local source edits.
- Run `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run schema:validate`, and `npm run build` in this repository before handoff.
- Run `node scripts/check-generated.mjs` after every build. It is the freshness gate for tracked generated reports and must pass before handoff.
- Keep `npm test` portable for a clean clone. Use `npm run test:real` only for a workstation with the separately acquired, ignored corpus cache; CI does not claim to contain those corpora.
- The CLI must expose readable names and explicit states; raw IDs are diagnostics only.

## Phase-2 boundary

The exact extension procedures are in `docs/architecture/PHASE_2_EXTENSION_POINTS_V01.md`. The owner-approved world-model extension adds ISSUED_BY and HAS_ATTRIBUTE to the original 14 keywords, for 16 total; the foundation retains 9 authored actions, 5 BASED cues, 20 ordered Vibes, and 180 structural matrix cells with reviewed authoring-preview executions. These are not production approvals: there are 0 approved runtime TPL protocols and 0 runtime corpus records; external research remains evidence-only. See `TPL_RUNTIME_PHASE_2_V01.md` for the preview/production boundary. The world event ledger uses the foundation keyword vocabulary as its grammar: every proposition in an event, claim, attitude or belief must be a valid keyword assertion. This grants vocabulary and validation only. Foundation actions, capacity rules and TPL rendering do not govern encounter resolution; the encounter's own mechanics remain authoritative for outcomes. Encounter delivery intensity may affect authored social interpretation while preserving semantic facts, independently of the TPL renderer. The frozen world architecture and implementation interfaces are in `docs/world-model/`.

The package is `UNLICENSED`. Do not add a reuse license without an explicit project-owner decision.
