#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { replayOracleRun } from "../tests/helpers/marcus-world-model-oracle.mjs";

const historicalUrl = new URL("../tests/fixtures/marcus-world-model-baseline-v01.json", import.meta.url);
const historicalBytes = readFileSync(historicalUrl), historical = JSON.parse(historicalBytes.toString("utf8"));
const hash = createHash("sha256").update(historicalBytes).digest("hex");
if (hash !== "add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46") throw new Error("Historical fixture changed.");
const rules = {
  SURFACE: "Brief 6, 16, 17: replace the six-stage surface with Hint / Show / Trade, availability by held leverage, and truthful lifecycle status.",
  RATE: "Brief 14, locked A/B and Section 35: R-17 changes only extra (zero proof score bonus); centralized 16/13/8/22/19 rate, ceiling rounding, approval floor and current-offer-only trade value.",
  INTEREST: "Brief 5/7 and locked C: independently seeded interest, honestly observed responses, no initial R-17 body disclosure.",
  TRANSFER: "Brief 20/21 and locked D/E: coherent source/body reads and real atomic document transfer; history retains Traded visibility.",
  FEEDBACK: "Brief 18 and Section 35.H: resolved information feedback and existing face presets; presentation cannot change the proof mechanics.",
};
function changes(before, after, path = "") {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (before && after && typeof before === "object" && typeof after === "object" && !Array.isArray(before) && !Array.isArray(after)) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap(key => changes(before[key], after[key], `${path}/${key}`));
  }
  if (Array.isArray(before) && Array.isArray(after) && before.length === after.length) return before.flatMap((value, index) => changes(value, after[index], `${path}/${index}`));
  const ruleIds = path.startsWith("/options/") || path.includes("/edge") || path.includes("/informationOptions") ? ["SURFACE"]
    : /extra|terms|metrics|obligations|derived|counteroffer|agreement|proposal/i.test(path) ? ["RATE"]
      : /knowledge|disclosure|privateFactId|exchange|belief|progressKeys|evidence/i.test(path) ? ["INTEREST", "TRANSFER"]
        : ["FEEDBACK", "RATE", "INTEREST"];
  return [{ path, before: before ?? null, after: after ?? null, ruleIds }];
}
const runs = [], snapshots = [];
for (const run of historical.runs) {
  const actual = replayOracleRun(run);
  if (actual.snapshots.length !== run.snapshots.length) throw new Error(`Snapshot count changed: ${run.id}`);
  runs.push({ ...run, inputs: actual.inputs, snapshots: actual.snapshots });
  for (const [index, expected] of run.snapshots.entries()) {
    const differences = changes(expected, actual.snapshots[index]);
    snapshots.push({ runId: run.id, snapshotIndex: index, turn: index, changed: differences.length > 0, ruleIds: [...new Set(differences.flatMap(change => change.ruleIds))], differences });
  }
  console.log(`Captured ${run.id}: ${actual.snapshots.length} snapshots`);
}
const reportDirectory = new URL("../docs/marcus-information-exchange-v01/", import.meta.url);
mkdirSync(reportDirectory, { recursive: true });
writeFileSync(new URL("../tests/fixtures/marcus-r17-exchange-v01.json", import.meta.url), JSON.stringify({ schemaVersion: "marcus-r17-oracle@0.1", sourceFixtureSHA256: hash, startingHEAD: "bdecd96eb310deebc15cb231a305c45f4569831e", rules, runs }, null, 2) + "\n");
writeFileSync(new URL("SNAPSHOT_MIGRATION.json", reportDirectory), JSON.stringify({ sourceFixtureSHA256: hash, rules, snapshots }, null, 2) + "\n");
const table = snapshots.map(row => `| ${row.runId} | ${row.snapshotIndex} | ${row.changed ? row.ruleIds.join(", ") : "UNCHANGED"} | ${row.differences.length} |`).join("\n");
writeFileSync(new URL("SNAPSHOT_MIGRATION.md", reportDirectory), `# R-17 frozen snapshot migration\n\nThe historical fixture is preserved byte-for-byte (SHA-256 ${hash}). Snapshot 0 is opening state; later indices are turn numbers. This table lists every historical snapshot; SNAPSHOT_MIGRATION.json contains every changed path, old/new value and applicable locked rule.\n\n${Object.entries(rules).map(([id, rule]) => `- **${id}**: ${rule}`).join("\n")}\n\n| Historical run | Snapshot / turn | Rules changing its expectation | Changed paths |\n| --- | ---: | --- | ---: |\n${table}\n`);
console.log(`Migration captured: ${snapshots.filter(row => row.changed).length}/${snapshots.length} snapshots changed; historical fixture unchanged.`);
