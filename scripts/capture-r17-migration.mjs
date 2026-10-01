#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { replayOracleRun } from "../tests/helpers/marcus-world-model-oracle.mjs";

const historicalUrl = new URL("../tests/fixtures/marcus-world-model-baseline-v01.json", import.meta.url);
const historicalBytes = readFileSync(historicalUrl), historical = JSON.parse(historicalBytes.toString("utf8"));
const hash = createHash("sha256").update(historicalBytes).digest("hex");
const previousBytes = execFileSync("git", ["show", "e7aa831:tests/fixtures/marcus-r17-exchange-v01.json"], { maxBuffer: 20 * 1024 * 1024 });
const previous = JSON.parse(previousBytes.toString("utf8"));
const previousHash = createHash("sha256").update(previousBytes).digest("hex");
if (hash !== "add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46") throw new Error("Historical fixture changed.");
const rules = {
  SURFACE: "Brief 6, 16, 17: replace the six-stage surface with Hint / Show / Trade, availability by held leverage, and truthful lifecycle status.",
  RATE: "Section 35 and follow-up A1-A3: centralized 16/13/8/22/19 rate and ceiling rounding; extra is exact, scoring uses standard 16%, trade value belongs to the current offer only.",
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
  return [{ path, before: before ?? null, after: after ?? null, beforePresent: before !== undefined, afterPresent: after !== undefined, ruleIds }];
}
const runs = [], snapshots = [];
const followupRules = {
  EXACT_EXTRA: "Follow-up A1/A3: normalize submitted extra to the exact resolved whole-dollar charge; actual exposure and settlement use that charge.",
  STANDARD_SCORE: "Follow-up A2: score and concession comparisons use standard 16%; repetition ignores the player-uneditable extra.",
  PROPOSAL_SPEECH: "Follow-up A6: DEAL names new credit at Marcus's extra charge; ACCEPT and Marcus's replies retain exact established amounts.",
  PUBLIC_DRAFT: "Follow-up A5: public rate context contains observed interest only; blind drafts have both possible charges and no private-interest oracle.",
  CHARGE_COPY: "Follow-up A1/A4/B: exact-charge wording replaces floor/minimum/bargaining-chip wording; comparisons use 16% on the same principal.",
  LIMIT_RESPONSE: "User addition: blind charge-dependent hard limits resolve with Marcus's ordinary counter/reject response, never a validation oracle.",
};
const followupSnapshots = [];
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const snapshotHash = value => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
for (const run of historical.runs) {
  const actual = replayOracleRun(run);
  if (actual.snapshots.length !== run.snapshots.length) throw new Error(`Snapshot count changed: ${run.id}`);
  runs.push({ ...run, inputs: actual.inputs, snapshots: actual.snapshots });
  const oldRun = previous.runs.find(item => item.id === run.id);
  for (const [index, before] of oldRun.snapshots.entries()) {
    const after = actual.snapshots[index];
    const differences = changes(before, after).map(change => ({ ...change, ruleIds:
      /r17RateContext/.test(change.path) ? ["PUBLIC_DRAFT"]
        : /playerText/.test(change.path) ? ["PROPOSAL_SPEECH"]
          : /derived|progressKey|deltas|metrics/.test(change.path) ? ["STANDARD_SCORE", "EXACT_EXTRA"]
            : /terms|obligations|agreement|proposal|counteroffer/.test(change.path) ? ["EXACT_EXTRA", "STANDARD_SCORE"]
              : ["CHARGE_COPY", "STANDARD_SCORE", "EXACT_EXTRA"] }));
    followupSnapshots.push({ runId: run.id, snapshotIndex: index, changed: differences.length > 0, beforeSHA256: snapshotHash(before), afterSHA256: snapshotHash(after), ruleIds: [...new Set(differences.flatMap(change => change.ruleIds))], differences });
  }
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
writeFileSync(new URL("EXTRA_CHARGE_MIGRATION.json", reportDirectory), JSON.stringify({ startingCommit: "e7aa831bb5237b2f6e8b0b439b4a8efd56d1bf7b", previousFixtureSHA256: previousHash, historicalFixtureSHA256: hash, rules: followupRules, snapshots: followupSnapshots }, null, 2) + "\n");
writeFileSync(new URL("EXTRA_CHARGE_MIGRATION.md", reportDirectory), `# Exact extra-charge follow-up migration\n\nCompared with the committed e7aa831 R-17 fixture (SHA-256 ${previousHash}). The original historical fixture is unchanged (SHA-256 ${hash}). Every changed path, old/new value, governing rule and before/after snapshot hash is recorded in EXTRA_CHARGE_MIGRATION.json.\n\n${Object.entries(followupRules).map(([id, rule]) => `- **${id}**: ${rule}`).join("\n")}\n\n| Run | Snapshot / turn | Rules changing the expectation | Changed paths |\n| --- | ---: | --- | ---: |\n${followupSnapshots.map(row => `| ${row.runId} | ${row.snapshotIndex} | ${row.changed ? row.ruleIds.join(", ") : "UNCHANGED"} | ${row.differences.length} |`).join("\n")}\n`);
const table = snapshots.map(row => `| ${row.runId} | ${row.snapshotIndex} | ${row.changed ? row.ruleIds.join(", ") : "UNCHANGED"} | ${row.differences.length} |`).join("\n");
writeFileSync(new URL("SNAPSHOT_MIGRATION.md", reportDirectory), `# R-17 frozen snapshot migration\n\nThe historical fixture is preserved byte-for-byte (SHA-256 ${hash}). Snapshot 0 is opening state; later indices are turn numbers. This table lists every historical snapshot; SNAPSHOT_MIGRATION.json contains every changed path, old/new value and applicable locked rule.\n\n${Object.entries(rules).map(([id, rule]) => `- **${id}**: ${rule}`).join("\n")}\n\n| Historical run | Snapshot / turn | Rules changing its expectation | Changed paths |\n| --- | ---: | --- | ---: |\n${table}\n`);
console.log(`Migration captured: ${snapshots.filter(row => row.changed).length}/${snapshots.length} snapshots changed; historical fixture unchanged.`);
