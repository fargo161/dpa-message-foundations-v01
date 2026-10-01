import test from "node:test";
import { projectMarcusLore } from "../src/encounter/marcus-world-adapter.mjs";
import assert from "node:assert/strict";
import { createEncounterServer } from "../scripts/encounter-server.mjs";
import { createState } from "../src/encounter/state.mjs";
import { selectQuirk } from "../src/encounter/marcus-profile.mjs";
import { r17Interest } from "../src/encounter/marcus-world.mjs";

const slots = ["left_brow", "left_eye", "mouth", "right_brow", "right_eye"];
const eyeIds = new Set(["2eff921f4373", "f1b2a234411e"]);
function checkFace(face, catalog) {
  assert.ok(face && typeof face.presetId === "string");
  assert.equal(face.catalogVersion, catalog.version);
  assert.deepEqual(face.slots.map(slot => slot.slot).sort(), slots);
  for (const slot of face.slots) {
    if (slot.assetId === null) continue;
    const asset = catalog.assets.find(item => item.assetId === slot.assetId);
    assert.ok(asset, `Uncatalogued asset ${slot.assetId}`);
    assert.equal(asset.slot, slot.slot);
    if (slot.slot.endsWith("_eye")) assert.ok(eyeIds.has(slot.assetId), `Unreviewed eye ${slot.assetId}`);
  }
}
async function serve(t) {
  const server = createEncounterServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${url}/api/state`);
  const cookie = response.headers.get("set-cookie").split(";")[0];
  let view = await response.json();
  const read = async () => (await fetch(`${url}/api/state`, { headers: { Cookie: cookie } })).json();
  const body = fields => ({ requestId: crypto.randomUUID(), runId: view.play.runId, version: view.play.version, ...fields });
  const post = (path, input) => fetch(`${url}${path}`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json", "X-CSRF-Token": view.csrf }, body: JSON.stringify(input) });
  const commit = async (path, input) => { const response = await post(path, input); assert.equal(response.status, 200, await response.clone().text()); view = await response.json(); return view; };
  return { get view() { return view; }, read, body, post, commit };
}
function speaking(fields) { return { vibeId: "EA", intensity: "BALANCED", ...fields }; }
function contextual(view, topic) {
  for (const keyword of view.options.keywords) {
    const action = keyword.actions.find(item => item.available && item.intent.action === "ASK" && item.intent.topic === topic);
    if (action) return { keywordId: keyword.id, contextActionId: action.id, ...action.intent };
  }
  assert.fail(`No contextual access to existing topic ${topic}`);
}

test("conversation: preview has no effects and its request can still commit exactly once", async t => {
  const api = await serve(t);
  const before = structuredClone(api.view);
  assert.equal(api.view.options.vibes.length, 20);
  checkFace(api.view.play.face, api.view.options.faceCatalog);
  const input = api.body(speaking(contextual(api.view, "DEBT")));
  for (let i = 0; i < 2; i++) {
    const response = await api.post("/api/preview", input);
    assert.equal(response.status, 200, await response.clone().text());
    const preview = await response.json();
    assert.deepEqual(Object.keys(preview).sort(), ["delivery", "deliveryDescription", "playerText", "readiness", "renderingStatus", "runId", "version"]);
    assert.deepEqual(Object.keys(preview.deliveryDescription).sort(), ["applicability", "description", "label", "note"]);
    assert.equal(preview.runId, before.play.runId);
    assert.equal(preview.version, before.play.version);
    assert.ok(preview.playerText.length > 10);
    assert.deepEqual(await api.read(), before);
  }
  await api.commit("/api/turn", input);
  assert.equal(api.view.play.version, before.play.version + 1);
  const event = api.view.play.events.at(-1);
  assert.deepEqual(event.turnRef, { runId: api.view.play.runId, index: 1 });
  assert.deepEqual(event.faces.turnRef, event.turnRef);
  checkFace(event.faces.receiving, api.view.options.faceCatalog);
  checkFace(event.faces.responding, api.view.options.faceCatalog);
  assert.deepEqual(api.view.play.face, event.faces.responding);
  const committed = structuredClone(api.view);
  assert.equal((await api.post("/api/turn", input)).status, 409);
  assert.deepEqual(await api.read(), committed);
});

test("conversation: both knowledge variants and all three quirks complete contextual HTTP routes", async t => {
  const combinations = new Map();
  for (let i = 0; i < 500 && combinations.size < 6; i++) {
    const seed = `conversation-coverage-${i}`;
    const state = createState(seed, "coverage", selectQuirk(seed));
    combinations.set(`${projectMarcusLore(state).variant}/${state.quirk}`, seed);
  }
  assert.equal(combinations.size, 6);
  const api = await serve(t);
  for (const [combination, seed] of combinations) {
    await api.commit("/api/restart", api.body({ seed }));
    for (const topic of ["PRIORITIES", "R17_HINT", "DEBT"]) {
      await api.commit("/api/turn", api.body(speaking(contextual(api.view, topic))));
    }
    const terms = { units: 2, upfront: 60, repayment: 60, extra: 12, days: 7 };
    await api.commit("/api/turn", api.body(speaking({ action: "DEAL", terms })));
    assert.ok(api.view.play.counteroffer, `${combination} should retain a concrete offer`);
    const offer = structuredClone(api.view.play.counteroffer);
    await api.commit("/api/turn", api.body(speaking(contextual(api.view, "CLARIFY_OFFER"))));
    assert.deepEqual(api.view.play.counteroffer, offer);
    await api.commit("/api/turn", api.body(speaking({ action: "ACCEPT", offerId: offer.id, offerVersion: offer.version })));
    assert.equal(api.view.play.status, "AGREED", combination);
    assert.equal(api.view.play.metrics.cash, 80 - offer.terms.upfront);
    assert.equal(api.view.play.metrics.debt, 250 + offer.terms.repayment + offer.terms.extra);
    assert.equal(api.view.play.metrics.playerStock, offer.terms.units);
    assert.equal(api.view.play.events.length, 6);
    for (const [index, event] of api.view.play.events.entries()) {
      assert.deepEqual(event.faces.turnRef, { runId: api.view.play.runId, index: index + 1 });
      checkFace(event.faces.receiving, api.view.options.faceCatalog);
      checkFace(event.faces.responding, api.view.options.faceCatalog);
      assert.equal(Object.hasOwn(event, "reactionCause"), false);
    }
  }
});

test("conversation: reception expression does not use future outcome, hidden reasons, or direct vibe", async () => {
  const { buildFaceTurn, openingFace } = await import("../src/conversation/face/policy.mjs");
  const event = { intent: { action: "ASK", topic: "DEBT", vibeId: "EA", intensity: "BALANCED" }, outcome: "DISCUSS", deltas: {},
    reactionCause: { turnRef: { runId: "face-independence", index: 1 }, semanticIntent: { action: "ASK", topic: "DEBT" }, consequences: {}, continuity: {} } };
  const before = structuredClone(event);
  const baseline = buildFaceTurn(event, openingFace());
  const altered = structuredClone(event);
  altered.intent.vibeId = "AB";
  altered.outcome = "REJECT";
  altered.deltas = { tension: 30, confidence: -30 };
  altered.reactionCause.consequences = { outcome: "REJECT", reasons: ["secret reason"], informationCauses: [{ factIds: ["SECRET"] }] };
  assert.deepEqual(buildFaceTurn(altered, openingFace()).receiving, baseline.receiving);
  assert.deepEqual(event, before);
});

test("conversation: delivery previews preserve conditional information and exact terms across all 60 coordinates", async t => {
  const api = await serve(t);
  let seed;
  for (let i = 0; i < 50; i++) {
    const candidate = `conditional-preview-${i}`;
    if (projectMarcusLore(createState(candidate, "preview-proof", selectQuirk(candidate))).variant === "POSITIVE" && r17Interest(candidate)) { seed = candidate; break; }
  }
  assert.ok(seed);
  await api.commit("/api/restart", api.body({ seed }));
  const factId = projectMarcusLore(api.view.debug.state).privateFactId;
  const detail = projectMarcusLore(api.view.debug.state).facts[factId].proposition;
  await api.commit("/api/turn", api.body(speaking(contextual(api.view, "R17_HINT"))));
  const terms = { units: 2, upfront: 41, repayment: 79, extra: 0, days: 7 };
  const before = structuredClone(api.view);
  for (const vibe of api.view.options.vibes) for (const intensity of api.view.options.intensities) {
    const response = await api.post("/api/preview", api.body({ action: "DEAL", terms, information: "OFFER_INFORMATION", vibeId: vibe.vibeId, intensity }));
    assert.equal(response.status, 200, await response.clone().text());
    const preview = await response.json();
    assert.ok(preview.playerText.includes("$41") && preview.playerText.includes("$79") && preview.playerText.includes("$0") && preview.playerText.includes("7 day"));
    assert.match(preview.playerText, /if we both agree/);
    assert.equal(preview.playerText.includes(detail), false, "Conditional proposal cannot disclose operative detail");
  }
  assert.deepEqual(await api.read(), before);
  await api.commit("/api/turn", api.body(speaking({ action: "DEAL", terms, information: "OFFER_INFORMATION" })));
  const offer = api.view.play.counteroffer;
  assert.ok(offer?.informationExchange);
  const input = api.body(speaking({ action: "ACCEPT", offerId: offer.id, offerVersion: offer.version }));
  const held = structuredClone(api.view);
  const preview = await api.post("/api/preview", input);
  assert.equal(preview.status, 200, await preview.clone().text());
  assert.ok((await preview.json()).playerText.includes(detail));
  assert.deepEqual(await api.read(), held);
  assert.equal(projectMarcusLore(held.debug.state).knowledge.marcus.includes(factId), false);
  await api.commit("/api/turn", input);
  assert.ok(projectMarcusLore(api.view.debug.state).knowledge.marcus.includes(factId));
  assert.equal(api.view.play.metrics.cash, 80 - offer.terms.upfront);
  assert.equal(api.view.play.metrics.debt, 250 + offer.terms.repayment + offer.terms.extra);
});

test("conversation presentation: skip shows the response once; cancellation cannot replay a pending beat", async t => {
  const { createTurnPlayer } = await import("../public/encounter/turn-player.js");
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const calls = [];
  const player = createTurnPlayer({ onReceiving: event => calls.push(`hear:${event.id}`), onResponding: event => calls.push(`reply:${event.id}`), onFinish: event => calls.push(`finish:${event.id}`), reducedMotion: () => false });
  const first = player.play({ id: "one" });
  assert.deepEqual(calls, ["hear:one"]);
  t.mock.timers.tick(500);
  assert.deepEqual(calls, ["hear:one"]);
  player.skip(); player.skip();
  assert.equal(await first, true);
  t.mock.timers.tick(5000);
  assert.deepEqual(calls, ["hear:one", "reply:one", "finish:one"]);
  const cancelled = player.play({ id: "cancelled" });
  player.cancel();
  assert.equal(await cancelled, false);
  t.mock.timers.tick(5000);
  assert.deepEqual(calls, ["hear:one", "reply:one", "finish:one", "hear:cancelled"]);
  assert.equal(player.playing, false);
});

test("conversation presentation: reduced motion preserves both ordered beats", async t => {
  const { createTurnPlayer } = await import("../public/encounter/turn-player.js");
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const calls = [];
  const player = createTurnPlayer({ onReceiving: () => calls.push("hear"), onResponding: () => calls.push("reply"), onFinish: () => calls.push("finish"), reducedMotion: () => true });
  const completion = player.play({ id: "reduced-motion" });
  assert.deepEqual(calls, ["hear"]);
  t.mock.timers.tick(180);
  assert.equal(await completion, true);
  assert.deepEqual(calls, ["hear", "reply", "finish"]);
});
