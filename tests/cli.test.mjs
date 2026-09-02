import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("..", import.meta.url));
const run = (command) => execFileSync(process.execPath, ["src/cli.mjs", command], { cwd, encoding: "utf8" });

test("author-facing CLI exposes report, inspect, and demo", () => {
  const report = run("report");
  assert.match(report, /180 matrix cells/);
  assert.match(report, /Semantic capacity: 1980 valid unique configurations; theoretical coordinate cross-product 12960/);
  const inspect = JSON.parse(run("inspect"));
  assert.equal(inspect.based.matrixCellCount, 180);
  assert.equal(inspect.sources.realAcquiredSourceCount, 8);
  assert.equal(inspect.sources.indexedExternalSourceCount, 7);
  assert.equal(inspect.sources.acquiredNotIndexedSourceCount, 1);
  const demo = JSON.parse(run("demo"));
  assert.equal(demo.resolvedAction.outcome, "PROPOSED");
  assert.equal(demo.fallback.semanticInvariancePassed, true);
});
