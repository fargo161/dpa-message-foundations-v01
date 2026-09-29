import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import * as sourceRuntime from "../src/conversation/runtime.mjs";

// Dedicated packaging test: node tests/standalone-parity.test.mjs HTML_PATH
// or MARCUS_STANDALONE_HTML=... node --test tests/standalone-parity.test.mjs.
const htmlPath = process.env.MARCUS_STANDALONE_HTML ?? process.argv[2];
if (!htmlPath) throw new Error("Supply standalone HTML path via MARCUS_STANDALONE_HTML or positional argument.");
const html = fs.readFileSync(htmlPath, "utf8"), root = fileURLToPath(new URL("../", import.meta.url));
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]);
const script = scripts.find(code => code.includes("const __mods ="));
assert.ok(script, "actual HTML must contain its module registry");
const appMarker = 'const { createDeliveryChart } = __req("public/encounter/delivery-chart.js");';
assert.ok(script.includes(appMarker), "UI boundary must be identifiable");
const core = script.slice(0, script.indexOf(appMarker));
const mode = { languageMode: "AUTHORING_PREVIEW" };
const json = value => JSON.parse(JSON.stringify(value));
const sha = value => createHash("sha256").update(value).digest("hex");
const fixtureBytes = fs.readFileSync(new URL("./fixtures/marcus-world-model-baseline-v01.json", import.meta.url));
const fixture = JSON.parse(fixtureBytes);
function sandbox() {
  const context = vm.createContext({ structuredClone, URL, TextEncoder, TextDecoder, console,
    crypto: { randomUUID: () => "frozen-marcus-oracle" },
    fetch() { throw new Error("NETWORK_FORBIDDEN"); }, XMLHttpRequest: class { constructor() { throw new Error("NETWORK_FORBIDDEN"); } },
  });
  vm.runInContext(core, context);
  return { context, runtime: vm.runInContext('__req("src/conversation/runtime.mjs")', context),
    adapter: vm.runInContext('__req("src/encounter/marcus-world-adapter.mjs")', context),
    language: vm.runInContext('__req("src/conversation/language/npc-lines.mjs")', context),
    api: vm.runInContext("__localApi", context), getState: () => vm.runInContext("__localState", context) };
}
const turnFields = ["intent", "playerText", "marcusText", "outcome", "before", "after", "deltas", "reasons", "based", "derived", "progressKey", "informationCauses", "feedback", "reactionCause", "characterId", "faces"];
function snapshot(state, runtime, adapter, language) {
  const projected = runtime.projectConversation(state, "frozen-oracle-csrf", mode), lore = adapter.projectMarcusLore(state), turn = state.events.at(-1);
  return json({ play: projected.play, options: projected.options,
    legacy: Object.fromEntries(["knowledge", "beliefs", "disclosure", "evidence", "privateFactId", "progressKeys", "negativeWindow"].map(key => [key, lore[key]])),
    outcome: { status: state.status, metrics: state.metrics, obligations: state.obligations, proposal: state.proposal, counteroffer: state.counteroffer, agreement: state.agreement, quirk: state.quirk, variant: lore.variant,
      replyFamily: turn ? language.buildNpcFrame({ ...state, events: state.events.slice(0, -1) }, turn.intent, { ...turn, counterTerms: state.counteroffer?.terms }).family : null,
      lastTurn: turn ? Object.fromEntries(turnFields.map(key => [key, turn[key]])) : null } });
}
function equal(actual, expected, label) {
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
  const left = JSON.stringify(canonical(actual)), right = JSON.stringify(canonical(expected));
  assert.equal(sha(left), sha(right), label);
}

test("standalone is classic-script parseable with all 28 exact source face assets and no network entrypoints", () => {
  new vm.Script(script);
  assert.ok(!/<script\b[^>]*\bsrc\s*=|<link\b[^>]*\bhref\s*=/i.test(html));
  assert.ok(!/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bsendBeacon\s*\(|\bimport\s*\(/.test(script));
  const embedded = sandbox(), assets = vm.runInContext("__MARCUS_ASSET_DATA", embedded.context);
  const sourceAssets = fs.readdirSync(path.join(root, "public/encounter/assets/marcus")).filter(name => name.endsWith(".webp")).sort();
  assert.equal(sourceAssets.length, 28); assert.equal(Object.keys(assets).length, 28);
  for (const name of sourceAssets) {
    const value = assets[`/assets/marcus/${name}`];
    assert.ok(value.startsWith("data:image/webp;base64,"));
    assert.equal(sha(Buffer.from(value.split(",")[1], "base64")), sha(fs.readFileSync(path.join(root, "public/encounter/assets/marcus", name))), name);
  }
});

test("standalone module graph and non-import source bodies match the migrated source with only browser substitutions", () => {
  const modules = new Map([...script.matchAll(/__mods\["([^"\n]+)"\] = function\(__req,module,exports\)\{\n([\s\S]*?)\n\};(?=\n(?:__mods\[|\/\/ END_MARCUS_MODULE_REGISTRY|globalThis\.__MARCUS_ASSET_DATA))/g)].map(match => [match[1], match[2]]));
  const expected = new Set();
  function resolve(current, spec) {
    if (spec.startsWith("node:")) return spec;
    if (spec.startsWith("/")) return ({ "/delivery-options.mjs": "src/conversation/delivery-options.mjs", "/delivery-chart.js": "public/encounter/delivery-chart.js", "/face-renderer.js": "public/encounter/face-renderer.js", "/turn-player.js": "public/encounter/turn-player.js" })[spec];
    return path.posix.normalize(path.posix.join(path.posix.dirname(current), spec));
  }
  function visit(name) {
    if (name.startsWith("node:") || expected.has(name)) return;
    expected.add(name);
    const source = fs.readFileSync(path.join(root, name), "utf8");
    for (const match of source.matchAll(/^\s*(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?["']([^"']+)["']/gm)) visit(resolve(name, match[1]));
  }
  for (const entry of ["src/conversation/runtime.mjs", "src/encounter/engine.mjs", "public/encounter/delivery-chart.js", "public/encounter/face-renderer.js", "public/encounter/turn-player.js"]) visit(entry);
  assert.deepEqual([...modules.keys()].sort(), [...expected].sort());
  for (const [name, compiled] of modules) {
    let source = fs.readFileSync(path.join(root, name), "utf8").replaceAll("\r\n", "\n");
    source = source.replace(/^\s*import\s+.*?;\s*$/gm, "").replace(/\bexport\s*\{[^}]+\}\s*(?:from\s*["'][^"']+["'])?\s*;?/g, "").replace(/\bexport\s+(?=const|let|var|function|class)/g, "");
    if (name === "src/based.mjs") source = source.replaceAll("import.meta.url", '"file:///standalone/src/based.mjs"');
    if (name === "public/encounter/face-renderer.js") source = source.replace('if (!asset || !/^\\/assets\\/marcus\\/[a-zA-Z0-9_-]+\\.webp$/.test(asset.src)) return;', 'if (!asset || !/^data:image\\/webp;base64,[A-Za-z0-9+/=]+$/.test(asset.src)) return;');
    const body = compiled.replace(/^\s*const\s+[^\n]*= __req\([^\n]*\);\s*$/gm, "").replace(/^\s*__req\([^\n]*\);\s*$/gm, "").replace(/\nObject\.assign\(module\.exports, \{[^\n]*\}\);\n?$/, "");
    const normalize = text => text.replace(/^\s*$/gm, "").trim();
    equal(normalize(body), normalize(source), `module source ${name}`);
  }
});

test("standalone inventory independently matches output bytes, normalized source inputs and substitution contracts", () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(path.dirname(htmlPath), "BUILD_INVENTORY.json"), "utf8"));
  const output = fs.readFileSync(htmlPath);
  assert.equal(inventory.html.sha256, sha(output)); assert.equal(inventory.html.bytes, output.length);
  for (const entry of inventory.sourceInputs) {
    const normalized = fs.readFileSync(path.join(root, entry.path), "utf8").replaceAll("\r\n", "\n");
    assert.equal(entry.sha256, sha(normalized), entry.path);
    assert.equal(entry.bytes, Buffer.byteLength(normalized), entry.path);
  }
  for (const entry of inventory.assets) {
    const source = fs.readFileSync(path.join(root, entry.path));
    assert.equal(entry.sha256, sha(source)); assert.equal(entry.bytes, source.length);
  }
  assert.equal(inventory.assets.length, 28);
  const counts = Object.fromEntries(inventory.substitutions.map(item => [item.label, item.actual]));
  assert.deepEqual(counts, { "embedded face image guard": 1, "unused Node authored-anchor URL": 1, "POST local adapter": 1, "GET local adapter": 1, "file-context UUID": 2, "inline CSS": 1, "remove module script transport": 1, "inline script": 1 });
  assert.ok(inventory.substitutions.every(item => item.actual === item.expected));
  assert.ok(!JSON.stringify(inventory).includes(root), "inventory must not depend on host paths");
});

test("actual embedded runtime equals migrated source and frozen oracle over all 23 routes/127 snapshots", () => {
  assert.equal(sha(fixtureBytes), "add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46");
  const embedded = sandbox(); let count = 0;
  for (const run of fixture.runs) {
    let bundled = embedded.runtime.createConversation("marcus", run.seed, "frozen-marcus-oracle");
    let source = sourceRuntime.createConversation("marcus", run.seed, "frozen-marcus-oracle");
    for (let index = 0; index <= run.steps.length; index++) {
      equal(json(bundled), json(source), `${run.id}:${index} entire runtime state`);
      equal(snapshot(bundled, embedded.runtime, embedded.adapter, embedded.language), run.snapshots[index], `${run.id}:${index} frozen oracle`);
      count++;
      if (index < run.steps.length) {
        if (run.steps[index].control === "REMOVE_NEGATIVE_WINDOW") { source.informationLocal.negativeWindow = null; bundled.informationLocal.negativeWindow = null; }
        source = sourceRuntime.resolveConversation(source, run.inputs[index], mode);
        bundled = embedded.runtime.resolveConversation(bundled, run.inputs[index], mode);
      }
    }
  }
  assert.equal(count, 127);
});

test("actual local API restarts deterministic seeds, previews without mutation, commits and resets both variants", async () => {
  const embedded = sandbox();
  const assets = vm.runInContext("__MARCUS_ASSET_DATA", embedded.context);
  const reverse = Object.fromEntries(Object.entries(assets).map(([key, value]) => [value, key]));
  function normalizeAssets(view) {
    const copy = json(view), catalog = copy.options.faceCatalog;
    catalog.base.src = reverse[catalog.base.src];
    for (const asset of catalog.assets) asset.src = reverse[asset.src];
    return copy;
  }
  for (const variant of ["POSITIVE", "NEGATIVE"]) {
    const run = fixture.runs.find(item => item.snapshots[0].outcome.variant === variant);
    const restart = await embedded.api("/api/restart", { scenarioId: "marcus", seed: run.seed });
    assert.equal(restart.status, 200);
    const source = sourceRuntime.createConversation("marcus", run.seed, "frozen-marcus-oracle");
    equal(normalizeAssets(restart.data), json(sourceRuntime.projectConversation(source, "LOCAL-OFFLINE", mode)), `${variant} restart API`);
    const before = JSON.stringify(embedded.getState());
    const preview = await embedded.api("/api/preview", run.inputs[0]); assert.equal(preview.status, 200);
    assert.equal(JSON.stringify(embedded.getState()), before);
    equal(json(preview.data), json(sourceRuntime.previewConversation(source, run.inputs[0], mode)), `${variant} preview API`);
    const moved = await embedded.api("/api/turn", run.inputs[0]); assert.equal(moved.status, 200);
    const next = sourceRuntime.resolveConversation(source, run.inputs[0], mode);
    equal(normalizeAssets(moved.data), json(sourceRuntime.projectConversation(next, "LOCAL-OFFLINE", mode)), `${variant} turn API`);
    const reset = await embedded.api("/api/restart", { scenarioId: "marcus", seed: run.seed });
    equal(normalizeAssets(reset.data), normalizeAssets(restart.data), `${variant} restart reproducibility`);
  }
});
