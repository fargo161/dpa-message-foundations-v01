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

- Raw corpora belong only in ignored `.cache/emp-lore-packs/` subdirectories.
- A manifest-only or fixture-only source is never described as downloaded, imported, approved, or runtime-ready.
- Never invent checksums, counts, versions, or license terms. Real receipts are created only from validated bytes.
- Keep source evidence, normalized candidates, review records, approved content, and runtime-safe content distinct.

## Editing and validation

- Use stable deterministic IDs and idempotent imports. Persistence-level uniqueness is required.
- Preserve existing files and changes. Never use destructive reset, checkout, clean, or broad deletion commands.
- Use `apply_patch` for local source edits.
- Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` in this repository before handoff.
- The CLI must expose readable names and explicit states; raw IDs are diagnostics only.
