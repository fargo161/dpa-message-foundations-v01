# Current build file map

This mission uses the complete isolated worktree recorded in BASELINE_AUDIT.md. No old source checkout, corpus cache, legacy project or public playtest is a runtime dependency.

| Files | Responsibility |
| --- | --- |
| src/encounter/state.mjs | Seven metrics, initial lore, descriptive phase |
| src/encounter/engine.mjs | Closed intent validation, authoritative transactions, knowledge integration, offer lifetime, safe projections |
| src/encounter/history-content.mjs | Ten provenance-labeled meaningful entries, topics and bounded information rules |
| src/encounter/knowledge.mjs | Seeded variants, knowledge/belief inventory, server eligibility, player-safe projection |
| src/encounter/information-policy.mjs | Evidence, partial/full disclosure, exchange, one-use negative opening |
| src/encounter/marcus-policy.mjs | Existing BASED interpretation plus meaningful progress and bounded information contribution |
| src/encounter/marcus-profile.mjs | Existing 20-Vibe personality configuration; obsolete global goodwill cutoff removed |
| src/encounter/conversation.mjs | Phase/outcome view and versioned reaction-cause handoff |
| src/encounter/messages.mjs | Interim authored semantic dialogue grounded in resolved causes |
| public/encounter/index.html, app.js, style.css | Plain Play/Debug, opening, knowledge, structured choices and clarification |
| scripts/encounter-server.mjs | Isolated local cookie sessions and restricted HTTP routes; default port 4175 |
| tests/encounter-knowledge-unit.test.mjs | H2 focused pure-module tests |
| tests/encounter-history.test.mjs, encounter-information.test.mjs, encounter-lore-adversarial.test.mjs | Independent H4 gameplay, fact-absence, knowledge and real HTTP evidence |
| scripts/test-portable.mjs | Registers every new test in npm test |
| docs/marcus-lore-v01/ | Current contract, canon, traceability, decisions, evidence and handoffs |

The existing mechanics/keyword/TPL modules remain the foundation reference. The canonical BASED module and its original tracked Markdown input remain intact. No runtime imports of corpus, store, lorebook or LLM services were added.
