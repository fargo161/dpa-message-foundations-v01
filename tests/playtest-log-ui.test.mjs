import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createPlaytestObserver, filteredDebug } from "../public/encounter/playtest-log.js";
import { createConversation, projectConversation } from "../src/conversation/runtime.mjs";

function harness() {
  const handlers = new Map(), ids = new Map(), actions = [], downloads = [], tasks = [], blobs = [];
  const element = (id = "", tagName = "DIV") => ({ id, tagName, dataset: {}, textContent: id, value: "", hidden: false, disabled: false, open: false, parentElement: null,
    getAttribute(name) { return this[name] ?? null; }, querySelector() { return null; }, closest(selector) { return selector === "button,summary" && ["BUTTON", "SUMMARY"].includes(this.tagName) ? this : null; },
    addEventListener(type, callback) { this[`on${type}`] = callback; }, click() { downloads.push({ name: this.download, url: this.href }); }, remove() {} });
  for (const id of ["edge-note", "extra-display", "extra-comparison", "draft-summary", "repayment", "units", "upfront", "days", "information", "debug-view", "play-view", "history-panel", "offer-builder", "run-log-dialog", "download-run-log", "download-run-log-end", "close-run-log", "download-log-json", "download-log-md", "previous-run-download", "download-previous-json", "download-previous-md"]) ids.set(id, element(id, id === "offer-builder" ? "DETAILS" : id === "units" ? "INPUT" : "DIV"));
  ids.get("debug-view").hidden = true; ids.get("extra-display").textContent = "$4 · 8% if he values R-17 · $11 · 22% if he doesn't";
  const doc = { body: { append() {} }, getElementById: id => ids.get(id), querySelectorAll: selector => selector.startsWith("details") ? [ids.get("offer-builder"), ids.get("history-panel")] : [ids.get("units")],
    addEventListener: (type, callback) => handlers.set(type, callback), removeEventListener() {}, createElement: () => element("", "A") };
  const snapshot = projectConversation(createConversation("marcus", "r17-proof-0", "ui-logger"), "csrf", { languageMode: "AUTHORING_PREVIEW" });
  const win = { navigator: { userAgent: "test-browser" }, innerWidth: 1000, innerHeight: 700, queueMicrotask: callback => tasks.push(callback), setInterval: () => 1, clearInterval() {}, addEventListener: (type, callback) => handlers.set(type, callback), removeEventListener() {}, setTimeout: callback => callback(), Blob,
    URL: { createObjectURL(blob) { blobs.push(blob); return "blob:run-log"; }, revokeObjectURL() {} } };
  const content = JSON.stringify({ private: { marcusInterest: "cares" }, header: { fileBase: "run" } });
  const transport = async (path, options) => {
    if (options.method === "POST") { assert.equal(options.keepalive, true); assert.equal(options.headers["X-CSRF-Token"], "csrf"); actions.push(...JSON.parse(options.body).records); return { ok: true, json: async () => ({ persisted: true }) }; }
    return { ok: true, text: async () => path.endsWith("md") ? "# SPOILERS\n" : content, headers: { get: () => "2026-10-01_18-05-12-0400_test_run" } };
  };
  const observer = createPlaytestObserver({ getContext: () => ({ snapshot, selection: { vibeId: "EA", intensity: "BALANCED" } }), transport, doc, win, clock: () => Date.parse("2026-10-01T22:05:12Z") });
  observer.bind(snapshot);
  const drain = () => { while (tasks.length) tasks.shift()(); };
  return { observer, snapshot, doc, win, ids, actions, handlers, drain, downloads, blobs };
}

test("filtered Debug excludes raw private state while retaining observed diagnostics", () => {
  const h = harness(), safe = filteredDebug(h.snapshot), rendered = JSON.stringify(safe);
  assert.equal(Object.hasOwn(safe, "state"), false); assert.doesNotMatch(rendered, /marcusCaresAboutR17|worldProfiles|r17-interest|quirk|"private"/);
  assert.equal(safe.observed.r17RateContext.knownMarcusInterest, null); assert.deepEqual(safe.observed.metrics, h.snapshot.play.metrics); h.observer.destroy();
});

test("browser observer records panel clicks, committed edits and both blind extra outcomes", async () => {
  const h = harness(), summary = { id: "builder-summary", tagName: "SUMMARY", textContent: "Build an offer", disabled: false, dataset: {}, getAttribute: () => null, closest() { return this; } };
  h.handlers.get("click")({ target: summary, isTrusted: true }); h.ids.get("offer-builder").open = true; h.drain();
  h.ids.get("units").value = "2"; h.handlers.get("change")({ target: h.ids.get("units") }); h.drain(); h.handlers.get("blur")({ target: h.ids.get("units") }); h.drain();
  h.ids.get("units").parentElement = { tagName: "DIALOG", open: false };
  h.observer.screen("closed dialog");
  h.observer.record("UI_ACTION", { oversized: "x".repeat(9000) });
  await h.observer.flush();
  assert.ok(h.actions.some(record => record.type === "UI_PANEL" && record.data.open === true));
  assert.equal(h.actions.filter(record => record.type === "UI_DRAFT").length, 1);
  assert.match(h.actions.find(record => record.type === "UI_DRAFT").data.extraDisplay, /8%.*22%/);
  assert.ok(h.actions.some(record => record.type === "SCREEN_OBSERVED")); assert.ok(h.actions.some(record => record.type === "UI_ACTION" && record.data.label === "Build an offer"));
  assert.ok(h.actions.some(record => record.type === "RUN_METADATA" && record.data.lostUiObservations === 1));
  assert.ok(h.actions.filter(record => record.type === "SCREEN_OBSERVED" && record.data.reason === "closed dialog").every(record => !(record.data.choices ?? []).some(choice => choice.target === "units")));
  assert.ok(!h.handlers.has("mousemove") && !h.handlers.has("mouseover") && !h.handlers.has("scroll")); h.observer.destroy();
});

test("face phases, preview/error text and pagehide flush retain UI timing and structure", async () => {
  const h = harness(); h.observer.record("PREVIEW_REQUESTED", { requestId: "preview-one" }); h.observer.record("PREVIEW_SHOWN", { playerLine: "At your extra charge." });
  h.observer.record("FACE_PRESENTED", { phase: "receiving", face: { presetId: "HEARING_TERMS" } }); h.observer.record("FACE_PRESENTED", { phase: "responding", face: { presetId: "READY_TO_AGREE" } });
  h.observer.record("UI_ERROR", { message: "Whole numbers required." }); h.handlers.get("pagehide")(); await h.observer.flush();
  assert.ok(h.actions.some(record => record.type === "PAGE_HIDDEN")); assert.equal(h.actions.filter(record => record.type === "FACE_PRESENTED").length, 2);
  h.actions.forEach(record => { assert.equal(new Date(record.observedT).toISOString(), record.observedT); assert.ok(record.clientSeq >= 1); }); h.observer.destroy();
});

test("download creates JSON/Markdown files without putting their private content into DOM", async () => {
  const h = harness(); await h.observer.download("json"); await h.observer.download("md");
  assert.equal(h.downloads.length, 2); assert.match(h.downloads[0].name, /-0400_test_run\.json$/); assert.match(h.downloads[1].name, /\.md$/);
  assert.match(await h.blobs[0].text(), /marcusInterest/); assert.equal(await h.blobs[1].text(), "# SPOILERS\n");
  assert.ok([...h.ids.values()].every(element => !element.textContent.includes("marcusInterest"))); h.observer.destroy();
});

test("transport failures are console-only and queued observations can retry", async () => {
  let fail = true, warnings = 0, accepted = [];
  const h = harness(), observer = createPlaytestObserver({ getContext: () => ({ snapshot: h.snapshot }), doc: h.doc, win: h.win, onError: () => warnings++, transport: async (path, options) => { if (fail) throw new Error("offline"); accepted.push(...JSON.parse(options.body).records); return { ok: true, json: async () => ({}) }; } });
  observer.bind(h.snapshot); await observer.flush(); assert.ok(warnings > 0); fail = false; await observer.flush(); assert.ok(accepted.length > 0);
  assert.equal(h.ids.get("extra-display").textContent, "$4 · 8% if he values R-17 · $11 · 22% if he doesn't"); observer.destroy(); h.observer.destroy();
});

test("source hooks observe real delivery order, transitions and errors without copying Debug", () => {
  const app = readFileSync(new URL("../public/encounter/app.js", import.meta.url), "utf8"), chart = readFileSync(new URL("../public/encounter/delivery-chart.js", import.meta.url), "utf8"), html = readFileSync(new URL("../public/encounter/index.html", import.meta.url), "utf8");
  assert.match(app, /filteredDebug\(snapshot\)/); assert.doesNotMatch(app, /JSON\.stringify\([^\n]*snapshot\.debug/);
  assert.ok(app.includes('$("turn-form").after($("download-run-log-end"))'));
  assert.match(chart, /orderShown:/); assert.match(chart, /onObserve\?\./); assert.match(app, /observer\.record\("TURN_SENT"/); assert.match(app, /observer\.record\("UI_ERROR"/);
  for (const id of ["download-run-log", "download-run-log-end", "download-log-json", "download-log-md"]) assert.ok(html.includes(`id="${id}"`));
});
