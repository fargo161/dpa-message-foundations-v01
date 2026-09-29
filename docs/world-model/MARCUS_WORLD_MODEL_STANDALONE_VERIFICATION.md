# Marcus World-Model standalone verification

Independent verifier E; Phase 11; 2026-09-29.

## Result and scope

PASS: dedicated automated packaging suite, 5/5 tests, 74,221.1825 ms. The actual generated HTML registry executes with the same full runtime states as migrated source, and matches the unchanged baseline oracle across all 23 routes, 104 transitions and 127 snapshots. No production or oracle changes were made for this verification.

Artifact verified: `outputs/marcus-world-model/standalone/Marcus_Encounter.html`, 701,749 bytes.

| Artifact | SHA-256 |
| --- | --- |
| HTML | a4ad2ccd1475e149b30c241556d104dc5f04952d2cd8bfec4d67c1a336d2a775 |
| BUILD_INVENTORY.json | 4f19ac6ce2342dc3e83bbc4e34d23b6adbdd923efbc5a672072dc6a4fb59a8cf |
| Immutable baseline fixture | add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46 |

## Executed checks

| Check | Evidence |
| --- | --- |
| HTML executable syntax | Entire inline program parses as a classic JavaScript script. |
| Embedded assets | All 28 WebP assets decode byte-for-byte to source assets, including the base face. |
| Offline code | No external script/link references or executable fetch, XMLHttpRequest, WebSocket, EventSource, sendBeacon or dynamic import entrypoints in the generated program. VM network entrypoints throw if called. |
| Module parity | Independent source dependency traversal matches compiled module wrappers; all non-import source bodies match with only the two declared browser substitutions. |
| Inventory | Output hash/byte count, source input hashes/byte counts, all asset hashes and eight counted substitution contracts independently checked. |
| Gameplay parity | Actual HTML registry versus source full runtime state, plus complete frozen oracle projection, at all 127 positions. Oracle SHA pinned before replay. |
| Local API | Positive and negative deterministic seeded restart, preview without mutation, committed first turn, source-equivalent projections and identical reset. |
| Rebuild reproducibility | Two separate scratch rebuilds produce HTML and inventory hashes identical to canonical deliverables. |
| Missing asset failure | Scratch source missing base.webp exits 1 with Missing required face asset; both preexisting output sentinels remain byte-identical. |
| Substitution failure | Scratch source with altered POST fetch spelling exits 1 with expected 1, found 0 contract error; both preexisting output sentinels remain byte-identical. |

## Comparison rules

JSON object keys are sorted recursively for comparison; array order and all values are preserved. This removes object insertion-order differences, not behavioral fields. Runtime states and oracle snapshots otherwise have no normalization or exclusions. Local API face data URLs are mapped back to source asset paths only after independently verifying the embedded asset bytes. Deterministic VM UUID and matching CSRF token inputs are used for source/API comparisons.

The source-to-registry check removes ESM imports/exports and their generated CommonJS bindings, then compares the remaining bodies. The only body adaptations admitted are the face-image data-URL guard and the unused authored-anchor import.meta.url replacement. Transport changes are separately counted: local POST/GET adapters, file-context UUID calls, inline CSS/script and removal of the module script tag. The builder inventory records these contracts.

## Reproduction

From the mission source directory:

```powershell
node tests/standalone-parity.test.mjs '../../outputs/marcus-world-model/standalone/Marcus_Encounter.html'
```

Alternatively set MARCUS_STANDALONE_HTML and run the same file with node --test. This packaging-dependent test is deliberately outside the portable source test list.

Independent rebuild/failure-injection harness:

```powershell
python ../verifier-review/audit_standalone_build.py
```

The harness writes only scratch copies and outputs under work/verifier-review/standalone-build-audit. Durable results are also copied to outputs/marcus-world-model/validation/independent-standalone-build-results.json. The dedicated test result is preserved in independent-standalone-focused-result.txt.

## Remaining manual check

Actual file:// browser execution, visual face rendering, and UI restart/positive/negative smoke are NOT certified by these tests. The browser tool rejected local-file navigation and prohibited workarounds; no alternate launch or indirect route was attempted. The VM executes the embedded engine and local API without a browser DOM. An authorized manual browser check of the final HTML remains pending.

The required Phase 11 deliverable is the offline standalone HTML. A native executable/wrapper is deferred and outside this migration's current scope.
