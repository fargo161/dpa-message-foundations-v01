import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import * as sourceRuntime from "../src/conversation/runtime.mjs";
import { createRunRecorder } from "../src/playtest/recorder.mjs";
import { renderLogMarkdown } from "../src/playtest/markdown.mjs";

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
const fixture = JSON.parse(fs.readFileSync(new URL("./fixtures/marcus-r17-exchange-v01.json", import.meta.url)));
let commandSerial = 0;
function sandbox(extra = {}) {
  const context = vm.createContext({ structuredClone, URL, TextEncoder, TextDecoder, console,
    crypto: { randomUUID: () => "frozen-marcus-oracle" },
    fetch() { throw new Error("NETWORK_FORBIDDEN"); }, XMLHttpRequest: class { constructor() { throw new Error("NETWORK_FORBIDDEN"); } },
    ...extra,
  });
  vm.runInContext(core, context);
  const engine = vm.runInContext('__req("public/encounter/local-engine.mjs").createLocalEngine(__req("public/encounter/browser-options.mjs").createBrowserOptions())', context);
  const restart = (seed, scenarioId = "marcus") => {
    const view = engine.getState();
    return engine.restart({ requestId: `offline-restart-${++commandSerial}`, runId: view.play.runId, version: view.play.version, seed, scenarioId });
  };
  return { context, engine, restart, runtime: vm.runInContext('__req("src/conversation/runtime.mjs")', context),
    adapter: vm.runInContext('__req("src/encounter/marcus-world-adapter.mjs")', context),
    language: vm.runInContext('__req("src/conversation/language/npc-lines.mjs")', context),
    getState: () => engine.getState().debug.state };
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
  for (const entry of ["src/conversation/runtime.mjs", "src/encounter/engine.mjs", "public/encounter/delivery-chart.js", "public/encounter/face-renderer.js", "public/encounter/turn-player.js", "src/playtest/recorder.mjs", "src/playtest/markdown.mjs", "public/encounter/playtest-log.js", "public/encounter/local-engine.mjs", "public/encounter/browser-options.mjs"]) visit(entry);
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
  assert.deepEqual(counts, { "embedded face image guard": 1, "unused Node authored-anchor URL": 1, "inline CSS": 1, "remove module script transport": 1, "inline script": 1 });
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

test("actual local engine restarts deterministic seeds, previews without mutation, commits and resets both variants", () => {
  const embedded = sandbox();
  const assets = vm.runInContext("__MARCUS_ASSET_DATA", embedded.context);
  const reverse = Object.fromEntries(Object.entries(assets).map(([key, value]) => [value, key]));
  function normalizeAssets(view) {
    const copy = json(view), catalog = copy.options.faceCatalog;
    catalog.base.src = reverse[catalog.base.src];
    for (const asset of catalog.assets) asset.src = reverse[asset.src];
    return copy;
  }
  function projected(state) { const view = sourceRuntime.projectConversation(state, "LOCAL-OFFLINE", mode); delete view.csrf; return json(view); }
  for (const variant of ["POSITIVE", "NEGATIVE"]) {
    const run = fixture.runs.find(item => item.snapshots[0].outcome.variant === variant);
    const restart = embedded.restart(run.seed);
    const source = sourceRuntime.createConversation("marcus", run.seed, "frozen-marcus-oracle");
    equal(normalizeAssets(restart), projected(source), `${variant} restart engine`);
    const before = JSON.stringify(embedded.getState()), input = { ...run.inputs[0], requestId: `offline-variant-${variant}` };
    const preview = embedded.engine.preview(input);
    assert.equal(JSON.stringify(embedded.getState()), before);
    equal(json(preview), json(sourceRuntime.previewConversation(source, input, mode)), `${variant} preview engine`);
    const moved = embedded.engine.sendTurn(input), next = sourceRuntime.resolveConversation(source, input, mode);
    equal(normalizeAssets(moved), projected(next), `${variant} turn engine`);
    const reset = embedded.restart(run.seed);
    equal(normalizeAssets(reset), normalizeAssets(restart), `${variant} restart reproducibility`);
  }
});

test("actual offline recorder and download exports match the shared server model with fixed metadata and clock", async () => {
  const epoch = Date.parse("2026-10-01T22:05:12Z");
  class FixedDate extends Date { constructor(value = epoch) { super(value); } static now() { return epoch; } }
  const embedded = sandbox({ Date: FixedDate });
  embedded.restart("r17-proof-0");
  let state = json(embedded.getState());
  const metadata = json(vm.runInContext("__MARCUS_BUILD_INFO", embedded.context));
  const recorder = createRunRecorder(state, { clock: () => epoch, build: metadata, view: sourceRuntime.projectConversation(state, "LOG-ONLY", mode) });
  const steps = [{ action: "ASK", topic: "R17_HINT" }, { action: "DEAL", information: "OFFER_INFORMATION", terms: { units: 2, upfront: 70, repayment: 50, extra: 9999, days: 7 } }, { action: "ACCEPT" }];
  for (const [index, fields] of steps.entries()) {
    const command = { requestId: `offline_log_${index}`, runId: state.runId, version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields };
    if (command.action === "ACCEPT") Object.assign(command, { offerId: state.counteroffer.id, offerVersion: state.counteroffer.version });
    const before = state; state = sourceRuntime.resolveConversation(state, command, mode); recorder.turn(before, state, command, sourceRuntime.projectConversation(state, "LOG-ONLY", mode));
    embedded.engine.sendTurn(command); equal(json(embedded.getState()), json(state), "observed offline transition");
  }
  const downloads = [], blobs = [];
  const doc = { addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], body: { append() {} }, createElement: () => ({ click() { downloads.push(this.download); }, remove() {} }) };
  const win = { Blob, URL: { createObjectURL(blob) { blobs.push(blob); return "blob:local-run"; }, revokeObjectURL() {} }, navigator: { userAgent: "offline-test" }, innerWidth: 1000, innerHeight: 700, setInterval: () => 1, clearInterval() {}, setTimeout: callback => callback() };
  const observerFactory = vm.runInContext('__req("public/encounter/playtest-log.js").createPlaytestObserver', embedded.context);
  const observer = observerFactory({ doc, win, clock: () => epoch, getContext: () => ({ snapshot: sourceRuntime.projectConversation(state, "LOCAL-OFFLINE", mode) }), engine: { ...embedded.engine,
    ingestLog(body) { recorder.ingest(body); return embedded.engine.ingestLog(body); }
  } });
  observer.bind(sourceRuntime.projectConversation(state, "LOCAL-OFFLINE", mode));
  await observer.download("json"); const jsonAtDownload = recorder.assemble();
  await observer.download("md"); const mdAtDownload = renderLogMarkdown(recorder.assemble());
  assert.deepEqual(JSON.parse(await blobs[0].text()), jsonAtDownload); assert.equal(await blobs[1].text(), mdAtDownload);
  assert.match(downloads[0], /-0400_r17-proof-0_.*\.json$/); assert.match(downloads[1], /\.md$/);
  assert.equal(jsonAtDownload.turns[1].normalizedTerms.extra, 4); assert.equal(jsonAtDownload.header.endStatus, "AGREED"); observer.destroy();
});

test("offline storage failures preserve gameplay and do not restore state from a saved log", async () => {
  const embedded = sandbox({ localStorage: { getItem() { throw new Error("STORAGE_FORBIDDEN"); }, setItem() { throw new Error("STORAGE_FORBIDDEN"); } } });
  embedded.restart("r17-proof-2");
  const state = embedded.getState(), command = { requestId: "offline_storage_walk", runId: state.runId, version: 0, vibeId: "EA", intensity: "BALANCED", action: "WALK" };
  const result = embedded.engine.sendTurn(command); assert.equal(result.play.status, "WITHDRAWN");
  const exported = embedded.engine.exportLog("json"); assert.equal(exported.log.header.endStatus, "WITHDRAWN");
});

test("actual embedded R-17 proof matches all 20 golden routes, including Show and Hint", () => {
  const goldens = JSON.parse(fs.readFileSync(new URL("../docs/marcus-information-exchange-v01/GOLDEN_RUNS.json", import.meta.url), "utf8"));
  const embedded = sandbox();
  assert.equal(goldens.routes.length, 20);
  for (const route of goldens.routes) {
    const version = route.version === "GOOD" ? "POSITIVE" : "NEGATIVE";
    const runId = `golden:${version}:${route.cares}:${route.scenario}`;
    let source = sourceRuntime.createConversation("marcus", route.seed, runId);
    let bundled = embedded.runtime.createConversation("marcus", route.seed, runId);
    for (const [index, fields] of route.actions.entries()) {
      const input = { requestId: `golden_${index}`, runId, version: source.events.length, vibeId: "EA", intensity: "BALANCED", ...fields };
      source = sourceRuntime.resolveConversation(source, input, mode);
      bundled = embedded.runtime.resolveConversation(bundled, input, mode);
      equal(json(bundled), json(source), `${route.seed}:${route.scenario}:${index} source state`);
      const projected = embedded.runtime.projectConversation(bundled, "golden-csrf", mode);
      assert.equal(projected.play.extraChargeRate, route.expectedRates[index]);
      assert.deepEqual(json(projected.play.edge.card), route.observations[index].card);
    }
    if (route.cares && ["HINT_TRADE", "BLIND_TRADE"].includes(route.scenario)) {
      const offer = source.counteroffer;
      const input = { requestId: "golden_confirm", runId, version: source.events.length, vibeId: "EA", intensity: "BALANCED", action: "ACCEPT", offerId: offer.id, offerVersion: offer.version };
      source = sourceRuntime.resolveConversation(source, input, mode);
      bundled = embedded.runtime.resolveConversation(bundled, input, mode);
      equal(json(bundled), json(source), `${route.seed}:${route.scenario} completed exchange`);
      const projected = embedded.runtime.projectConversation(bundled, "golden-csrf", mode);
      assert.equal(projected.play.edge.card.id, "TRADED");
      assert.equal(projected.play.edge.card.physicallyHeld, false);
      assert.equal(projected.play.extraChargeRate, 8);
    }
  }
});

test("embedded exact-extra regression and blind exposure preview match source with networking forbidden", () => {
  const embedded = sandbox();
  const execute = runtime => {
    let state = runtime.createConversation("marcus", "88fdc2d7be9a", "offline-extra-regression");
    const step = fields => {
      const input = { requestId: `offline_extra_${state.events.length}`, runId: state.runId, version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields };
      const before = JSON.stringify(state), preview = runtime.previewConversation(state, input, mode);
      assert.equal(JSON.stringify(state), before);
      state = runtime.resolveConversation(state, input, mode);
      assert.equal(state.events.at(-1).playerText, preview.playerText);
    };
    step({ action: "ASK", topic: "R17_HINT" });
    for (const [units, upfront, repayment] of [[4, 60, 180], [3, 60, 120], [3, 65, 115]]) step({ action: "DEAL", information: "OFFER_INFORMATION", terms: { units, upfront, repayment, extra: 20, days: 6 } });
    assert.equal(state.counteroffer.terms.extra, 10);
    step({ action: "ACCEPT", offerId: state.counteroffer.id, offerVersion: state.counteroffer.version });
    assert.equal(state.metrics.debt, 375);
    return json(state);
  };
  equal(execute(embedded.runtime), execute(sourceRuntime), "offline $10 extra agreement");
  for (const seed of ["r17-proof-0", "r17-proof-1"]) {
    const source = sourceRuntime.createConversation("marcus", seed, "offline-blind-limit");
    source.worldProfiles.find(profile => profile.entityId === "MARCUS").policy.maximumExposure = 307;
    source.metrics.confidence = 100; source.metrics.tension = 0;
    const bundled = json(source);
    const input = { requestId: "offline_blind_limit", runId: source.runId, version: 0, action: "DEAL", vibeId: "EA", intensity: "BALANCED", information: "OFFER_INFORMATION", terms: { units: 2, upfront: 70, repayment: 50, extra: 20, days: 7 } };
    equal(json(embedded.runtime.previewConversation(bundled, input, mode)), json(sourceRuntime.previewConversation(source, input, mode)), "blind preview parity");
    equal(json(embedded.runtime.resolveConversation(bundled, input, mode)), json(sourceRuntime.resolveConversation(source, input, mode)), "blind limit ordinary reply parity");
  }
});
