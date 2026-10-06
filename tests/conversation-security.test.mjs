import test from "node:test";
import assert from "node:assert/strict";
import { localClient, invokeEngine, serveStatic } from "./helpers/local-engine-client.mjs";

async function serve() {
  const client = localClient(), view = client.view;
  const read = async () => client.engine.getState();
  const input = fields => ({ requestId: crypto.randomUUID(), runId: view.play.runId, version: view.play.version, vibeId: "EA", intensity: "BALANCED", ...fields });
  const post = (method, body) => invokeEngine(client.engine, method, body);
  return { view, read, input, post };
}

test("conversation security: preview rejects fabricated contexts, semantic substitution and fake language authority", async t => {
  const api = await serve(t);
  const keyword = api.view.options.keywords.find(item => item.actions.some(action => action.available && action.intent.action === "ASK"));
  assert.ok(keyword);
  const action = keyword.actions.find(item => item.available && item.intent.action === "ASK");
  const valid = { ...action.intent, keywordId: keyword.id, contextActionId: action.id };
  const mutations = [
    { ...valid, keywordId: "unlearned-secret" },
    { ...valid, contextActionId: "invented-action" },
    { ...valid, topic: "IMPOSSIBLE_TOPIC" },
    { ...valid, keywordId: undefined },
    { ...valid, contextActionId: undefined },
    { ...valid, state: { cash: 9999 } },
    { ...valid, playerText: "Marcus has forgiven the debt." },
    { ...valid, semanticFacts: { disclosed: "ALL" } },
    { ...valid, readiness: "PRODUCTION", approved: true },
    { ...valid, mode: "PRODUCTION", resolutionEnvelope: { valid: true } },
    { ...valid, action: "PRESSURE" },
  ];
  for (const fields of mutations) {
    for (const path of ["preview", "sendTurn"]) {
      const response = await api.post(path, api.input(fields));
      assert.ok(response.code >= 400 && response.code < 500, `${path} accepted ${JSON.stringify(fields)}`);
      assert.deepEqual(await api.read(), api.view);
    }
  }
  const tampered = structuredClone(api.view.options.keywords);
  tampered[0].actions.push({ id: "mint-money", available: true, intent: { action: "ASK", topic: "DEBT" } });
  const response = await api.post("sendTurn", api.input({ action: "ASK", topic: "DEBT", keywordId: tampered[0].id, contextActionId: "mint-money" }));
  assert.ok(response.code >= 400 && response.code < 500);
  assert.deepEqual(await api.read(), api.view);
});

test("conversation security: stale previews and simultaneous duplicate sends have no extra effects", async t => {
  const api = await serve(t);
  const input = api.input({ action: "ASK", topic: "DEBT" });
  const responses = await Promise.all([api.post("sendTurn", input), api.post("sendTurn", { ...input, requestId: crypto.randomUUID() })]);
  assert.deepEqual(responses.map(response => response.code).sort(), [0, 409]);
  const committed = await api.read();
  assert.equal(committed.play.version, 1);
  assert.equal(committed.play.events.length, 1);
  assert.equal(committed.debug.state.events.length, 1);
  assert.equal((await api.post("preview", { ...input, requestId: crypto.randomUUID() })).code, 409);
  assert.deepEqual(await api.read(), committed);
});

test("conversation security: only catalogued same-origin images and explicit static modules are served", async t => {
  const api = await serve(); api.url = await serveStatic(t);
  const page = await fetch(`${api.url}/`);
  const csp = page.headers.get("content-security-policy");
  assert.match(csp, /(?:^|;)\s*img-src 'self'(?:;|$)/);
  assert.match(csp, /script-src 'self' 'sha256-[A-Za-z0-9+/=]+'(?:;|$)/);
  assert.match(csp, /connect-src 'none'(?:;|$)/);
  assert.match(csp, /style-src 'self'(?:;|$)/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|data:|https:|\*/);
  const catalog = api.view.options.faceCatalog;
  assert.ok(catalog.assets.length > 0);
  for (const asset of [catalog.base, ...catalog.assets]) {
    assert.match(asset.src, /^\/assets\/marcus\/[a-zA-Z0-9_-]+\.webp$/);
    const response = await fetch(`${api.url}${asset.src}`);
    assert.equal(response.status, 200, asset.src);
    assert.match(response.headers.get("content-type"), /^image\/webp/);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }
  for (const path of ["/assets/marcus/", "/assets/marcus/not-approved.webp", "/assets/marcus/../../package.json", "/assets/marcus/%2e%2e%2fpackage.json", "/assets/marcus/base.webp?raw=1", "/.git/config", "/package.json"]) {
    assert.equal((await fetch(`${api.url}${path}`)).status, 404, path);
  }
  for (const path of ["/app.js", "/delivery-chart.js", "/delivery-chart.css", "/local-engine.mjs", "/browser-options.mjs", "/browser-node-fs.mjs", "/browser-node-url.mjs", "/build-info.js", "/src/conversation/face/catalog.mjs", "/src/based.mjs"]) assert.equal((await fetch(`${api.url}${path}`)).status, 200, path);
});
