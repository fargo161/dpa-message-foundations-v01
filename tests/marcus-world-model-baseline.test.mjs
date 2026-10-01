import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { replayOracleRun } from "./helpers/marcus-world-model-oracle.mjs";

const bytes = fs.readFileSync(new URL("./fixtures/marcus-world-model-baseline-v01.json", import.meta.url));
const fixture = JSON.parse(bytes);
const proof = JSON.parse(fs.readFileSync(new URL("./fixtures/marcus-r17-exchange-v01.json", import.meta.url)));
test("frozen Marcus oracle has the pre-migration byte hash and complete recovered corpus", () => {
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46");
  assert.equal(fixture.baselineSHA, "838b075081d0b97de468d4e84984ce1e57908e76");
  assert.equal(fixture.runs.length, 23);
  assert.equal(fixture.runs.reduce((sum, run) => sum + run.snapshots.length, 0), 127);
});
for (const run of fixture.runs) test(`C1/C2 R-17 migrated Marcus behavior: ${run.id}`, () => {
  const actual = replayOracleRun(run);
  const expectedRun = proof.runs.find(item => item.id === run.id);
  assert.deepEqual(actual.inputs, expectedRun.inputs, `${run.id}: exact validated input sequence`);
  for (const [index, expected] of expectedRun.snapshots.entries()) {
    assert.deepEqual(actual.snapshots[index], expected, `${run.id}: turn ${index} public/legacy/outcome projection`);
  }
});
test("every changed historical snapshot has an explicit rule and path migration record", () => {
  const migration = JSON.parse(fs.readFileSync(new URL("../docs/marcus-information-exchange-v01/SNAPSHOT_MIGRATION.json", import.meta.url)));
  assert.equal(proof.sourceFixtureSHA256, createHash("sha256").update(bytes).digest("hex"));
  assert.equal(migration.sourceFixtureSHA256, proof.sourceFixtureSHA256);
  assert.equal(migration.snapshots.length, 127);
  function changedPaths(before, after, path = "") {
    if (JSON.stringify(before) === JSON.stringify(after)) return [];
    if (before && after && typeof before === "object" && typeof after === "object" && !Array.isArray(before) && !Array.isArray(after)) return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap(key => changedPaths(before[key], after[key], `${path}/${key}`));
    if (Array.isArray(before) && Array.isArray(after) && before.length === after.length) return before.flatMap((value, index) => changedPaths(value, after[index], `${path}/${index}`));
    return [path];
  }
  for (const run of fixture.runs) for (const [index, snapshot] of run.snapshots.entries()) {
    const expected = proof.runs.find(item => item.id === run.id).snapshots[index];
    const paths = changedPaths(snapshot, expected);
    const record = migration.snapshots.find(item => item.runId === run.id && item.snapshotIndex === index);
    assert.deepEqual(record.differences.map(item => item.path), paths);
    assert.equal(record.changed, paths.length > 0);
    for (const difference of record.differences) {
      assert.ok(difference.ruleIds.length > 0);
      assert.ok(difference.ruleIds.every(id => typeof migration.rules[id] === "string"));
    }
  }
});

test("exact-extra migration lists all 127 snapshots and reconstructs the prior expectation hashes", () => {
  const migration = JSON.parse(fs.readFileSync(new URL("../docs/marcus-information-exchange-v01/EXTRA_CHARGE_MIGRATION.json", import.meta.url)));
  assert.equal(migration.startingCommit, "e7aa831bb5237b2f6e8b0b439b4a8efd56d1bf7b");
  assert.equal(migration.historicalFixtureSHA256, createHash("sha256").update(bytes).digest("hex"));
  assert.equal(migration.snapshots.length, 127);
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
  const hash = value => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
  for (const run of proof.runs) for (const [index, after] of run.snapshots.entries()) {
    const row = migration.snapshots.find(item => item.runId === run.id && item.snapshotIndex === index);
    assert.equal(row.afterSHA256, hash(after));
    assert.equal(row.changed, row.differences.length > 0);
    const before = structuredClone(after);
    for (const difference of row.differences) {
      assert.ok(difference.ruleIds.length > 0 && difference.ruleIds.every(id => migration.rules[id]));
      const parts = difference.path.split("/").slice(1), key = parts.pop();
      const parent = parts.reduce((value, part) => value[part], before);
      if (difference.afterPresent) assert.deepEqual(parent[key], difference.after);
      else assert.equal(Object.hasOwn(parent, key), false);
      if (difference.beforePresent) parent[key] = structuredClone(difference.before);
      else delete parent[key];
    }
    assert.equal(row.beforeSHA256, hash(before), `${run.id}:${index}: every changed prior expectation is accounted for`);
  }
});
