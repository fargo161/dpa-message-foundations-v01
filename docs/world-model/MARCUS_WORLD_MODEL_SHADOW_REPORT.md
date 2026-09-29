# Marcus pre-cutover shadow evidence

The original encounter runtime remains authoritative at this checkpoint. No existing runtime module was changed for the shadow comparison. The new constructor, transition and compatibility adapter run alongside it in a test-only harness.

The immutable oracle covers 23 runs, 104 transitions and 127 snapshots. Its SHA-256 remains `add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46`.

`tests/marcus-world-shadow.test.mjs` independently advances world events from the recorded intents. Only encounter-local social metrics, offers, turn history and resolved terminal status cross from the existing runtime. Old knowledge, beliefs, disclosure and evidence never initialize or update the shadow information model. Resources and obligations are compared directly from the new ledger projection.

Every snapshot also substitutes the derived compatibility observation into the existing public renderer and compares the complete oracle snapshot: Play, options, replies, reply family, faces, metrics, obligations, terms and information observations. This establishes pre-cutover projection equivalence; it does not by itself prove that the new reader boundaries govern runtime decisions. Post-cutover oracle and independent C1–C11 tests remain required.

The shadow suite passes 27 tests: 23 recorded routes and four boundary tests covering reported speech, current attitudes/trust, incomplete or changed receipt contents, and missing read evidence. Independent review verified repairs for stale attitude values and static prose exposing unread detail. Earlier kernel and subjective findings were also corrected and independently rechecked, including carrier authentication upgrades and downgrades.

Final pre-cutover commands: `npm test`, `npm run lint`, `npm run typecheck`, `npm run schema:validate`, `npm run build`, `node scripts/check-generated.mjs`. All pass. Actual portable count: **379 passed, 0 failed, 0 skipped** (40127.0233 ms). This comprises the original 290 tests, 24 immutable-oracle checks, 10 kernel tests, 28 subjective tests and 27 shadow tests.

Detailed command logs and independent audit records are exported in `outputs/marcus-world-model/validation/` in the calling workspace. The next stage switches authority; no push, merge, deployment or public tunnel is authorized.
