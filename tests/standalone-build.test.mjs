// Dedicated packaging gate: Python 3.10+ is required. Not part of the Node-only portable suite.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { createConversation } from "../src/conversation/runtime.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const scratchParent = process.env.MARCUS_STANDALONE_WORK ?? path.join(os.tmpdir(), "marcus-standalone-builder-checks");
fs.mkdirSync(scratchParent, { recursive: true });
const scratch = fs.mkdtempSync(path.join(scratchParent, "run-"));
const python = process.env.MARCUS_PYTHON ?? "python";
// Inject the same optional build metadata into real and mirrored-source builds.
const frozenBuild = JSON.stringify({ mode: "standalone", packageName: "dpa-message-foundations", packageVersion: "0.1.0", commitFull: "1".repeat(40), commitShort: "1111111", dirty: true });
const builder = path.join(root, "tools", "build_standalone.py");
const hash = data => createHash("sha256").update(data).digest("hex");
const result = (source, output, tool = builder, args = true) => spawnSync(python, [tool, ...(args ? ["--source", source, "--output", output] : [])], { encoding: "utf8", cwd: root, env: { ...process.env, MARCUS_BUILD_INFO: frozenBuild } });
const baselineOutput = path.join(scratch, "baseline");
const first = result(root, baselineOutput);
assert.equal(first.status, 0, `Python builder prerequisite failed: ${first.error ?? first.stderr}`);
const html = fs.readFileSync(path.join(baselineOutput, "Marcus_Encounter.html"));
const inventoryBytes = fs.readFileSync(path.join(baselineOutput, "BUILD_INVENTORY.json"));
const inventory = JSON.parse(inventoryBytes);

function mirror(name) {
  const destination = path.join(scratch, name);
  for (const item of [...inventory.sourceInputs, ...inventory.assets]) {
    const target = path.join(destination, item.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, item.path), target);
  }
  return destination;
}
function change(source, file, edit) {
  const target = path.join(source, file);
  fs.writeFileSync(target, edit(fs.readFileSync(target, "utf8")), "utf8");
}
function rejects(source, label, pattern) {
  const output = path.join(scratch, `failed-${label}`);
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "Marcus_Encounter.html"), "preserve previous good build");
  const failed = result(source, output);
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, pattern);
  assert.equal(fs.readFileSync(path.join(output, "Marcus_Encounter.html"), "utf8"), "preserve previous good build");
  assert.equal(fs.existsSync(path.join(output, "BUILD_INVENTORY.json")), false);
}

test("standalone packaging is byte-reproducible and parses with the same world engine", () => {
  const again = path.join(scratch, "again");
  assert.equal(result(root, again).status, 0);
  assert.deepEqual(fs.readFileSync(path.join(again, "Marcus_Encounter.html")), html);
  assert.deepEqual(fs.readFileSync(path.join(again, "BUILD_INVENTORY.json")), inventoryBytes);
  assert.equal(hash(html), inventory.html.sha256);
  assert.equal(html.length, inventory.html.bytes);
  assert.equal(html.includes(13), false, "HTML is UTF-8/LF");
  assert.equal(inventory.assets.length, 28);
  assert.ok(inventory.moduleGraph.some(edge => edge.kind === "reexport" && edge.to === "src/encounter/constants.mjs"));
  const script = html.toString("utf8").split("<script>")[1].split("</script>")[0];
  new vm.Script(script); // Parse the complete UI too; DOM execution is a separate browser check.
  const context = vm.createContext({ structuredClone, URL });
  vm.runInContext(script.split("// BEGIN_MARCUS_EXISTING_UI")[0], context);
  const bundled = vm.runInContext('JSON.stringify(createConversation("marcus","lore-3","packaging-smoke"))', context);
  assert.deepEqual(JSON.parse(bundled), JSON.parse(JSON.stringify(createConversation("marcus", "lore-3", "packaging-smoke"))));
});

test("packaged source/ plus thin rebuild wrapper defaults are independent of host paths", () => {
  const source = mirror("package/source"), packageRoot = path.dirname(source);
  fs.mkdirSync(path.join(packageRoot, "tools"), { recursive: true });
  for (const name of ["build_standalone.py", "rebuild_standalone.py"]) fs.copyFileSync(path.join(root, "tools", name), path.join(packageRoot, "tools", name));
  const rebuilt = result(source, packageRoot, path.join(packageRoot, "tools", "rebuild_standalone.py"), false);
  assert.equal(rebuilt.status, 0, rebuilt.stderr);
  assert.deepEqual(fs.readFileSync(path.join(packageRoot, "Marcus_Encounter.html")), html);
  assert.deepEqual(fs.readFileSync(path.join(packageRoot, "BUILD_INVENTORY.json")), inventoryBytes);
});

test("a missing required asset fails without replacing a previous deliverable", () => {
  const source = mirror("missing-asset");
  fs.renameSync(path.join(source, "public/encounter/assets/marcus/base.webp"), path.join(source, "public/encounter/assets/marcus/base.unavailable"));
  rejects(source, "asset", /Missing required face asset/);
});

test("an unexpected transport substitution count fails loudly", () => {
  const source = mirror("changed-ui");
  change(source, "public/encounter/app.js", text => text.replace("await fetch(path,", "await fetch( path,"));
  rejects(source, "substitution", /Substitution contract failed: POST local adapter/);
});

test("unresolved reexports and unknown named bindings are rejected", () => {
  const missing = mirror("missing-reexport");
  change(missing, "src/encounter/state.mjs", text => `${text}\nexport { MISSING } from "./not-present.mjs";\n`);
  rejects(missing, "reexport", /Missing or escaped required source/);
  const binding = mirror("missing-binding");
  change(binding, "src/encounter/state.mjs", text => `${text}\nexport { MISSING } from "./constants.mjs";\n`);
  rejects(binding, "binding", /Unresolved reexport MISSING/);
});

test("unapproved Node dependencies and residual network calls are rejected", () => {
  const builtin = mirror("forbidden-builtin");
  change(builtin, "src/conversation/runtime.mjs", text => `import { request } from "node:https";\n${text}`);
  rejects(builtin, "builtin", /Unapproved Node builtin/);
  const network = mirror("network-call");
  change(network, "public/encounter/app.js", text => `${text}\nfetch("https://invalid.example/network-test");\n`);
  rejects(network, "network", /Residual network-capable call/);
});
