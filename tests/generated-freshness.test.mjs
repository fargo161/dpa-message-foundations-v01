import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { TRACKED_GENERATED_FILES } from "../scripts/check-generated.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("tracked generated artifacts are fresh and covered by the build check", () => {
  assert.deepEqual([...TRACKED_GENERATED_FILES].sort(), [
    "data/generated/based-tpl-foundation.json",
    "data/generated/foundation-inspection.json",
    "data/source-manifest.json",
  ]);
  const result = spawnSync(process.execPath, ["scripts/check-generated.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /generated-freshness-ok/);
});
