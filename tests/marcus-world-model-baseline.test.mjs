import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { replayOracleRun } from "./helpers/marcus-world-model-oracle.mjs";

const bytes = fs.readFileSync(new URL("./fixtures/marcus-world-model-baseline-v01.json", import.meta.url));
const fixture = JSON.parse(bytes);
test("frozen Marcus oracle has the pre-migration byte hash and complete recovered corpus", () => {
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46");
  assert.equal(fixture.baselineSHA, "838b075081d0b97de468d4e84984ce1e57908e76");
  assert.equal(fixture.runs.length, 23);
  assert.equal(fixture.runs.reduce((sum, run) => sum + run.snapshots.length, 0), 127);
});
for (const run of fixture.runs) test(`C1/C2 frozen Marcus behavior: ${run.id}`, () => {
  const actual = replayOracleRun(run);
  assert.deepEqual(actual.inputs, run.inputs, `${run.id}: exact validated input sequence`);
  for (const [index, expected] of run.snapshots.entries()) {
    assert.deepEqual(actual.snapshots[index], expected, `${run.id}: turn ${index} public/legacy/outcome projection`);
  }
});
