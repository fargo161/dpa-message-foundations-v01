import test from "node:test";
import assert from "node:assert/strict";
import { createEncounterServer } from "../scripts/encounter-server.mjs";

test("HTTP sessions reject replay/cross-session/state injection and restrict static access", async t => {
  const server = createEncounterServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}`;
  async function session() {
    const response = await fetch(`${url}/api/state`);
    return { cookie: response.headers.get("set-cookie").split(";")[0], view: await response.json() };
  }
  const a = await session(); const b = await session();
  const input = (client, fields) => ({ requestId: crypto.randomUUID(), runId: client.view.play.runId, version: client.view.play.version, vibeId: "EA", intensity: "BALANCED", ...fields });
  const post = (client, body, path = "/api/turn", csrf = client.view.csrf) => fetch(`${url}${path}`, { method: "POST", headers: { Cookie: client.cookie, "Content-Type": "application/json", "X-CSRF-Token": csrf }, body: JSON.stringify(body) });
  const ask = input(a, { action: "ASK", topic: "DEBT" });
  assert.equal((await post(b, ask, "/api/turn", a.view.csrf)).status, 403);
  assert.equal((await post(b, ask)).status, 409);
  const done = await post(a, ask); assert.equal(done.status, 200); a.view = await done.json();
  assert.equal((await post(a, ask)).status, 409);
  assert.equal((await post(a, { ...input(a, { action: "ASK", topic: "RISK" }), state: { cash: 1000 } })).status, 400);
  const bView = await (await fetch(`${url}/api/state`, { headers: { Cookie: b.cookie } })).json();
  assert.equal(bView.play.version, 0);
  const restart = { requestId: crypto.randomUUID(), runId: a.view.play.runId, version: a.view.play.version, seed: "repeatable" };
  const restarted = await post(a, restart, "/api/restart"); assert.equal(restarted.status, 200);
  const newView = await restarted.json(); assert.notEqual(newView.play.runId, a.view.play.runId);
  assert.equal((await post(a, ask)).status, 409);
  for (const path of ["/src/mechanics.mjs", "/package.json", "/.git/config", "/api/admin", "/?file=package.json"]) assert.equal((await fetch(`${url}${path}`)).status, 404);
  const badOrigin = await fetch(`${url}/api/turn`, { method: "POST", headers: { Cookie: a.cookie, Origin: "https://other.example", "Content-Type": "application/json", "X-CSRF-Token": a.view.csrf }, body: JSON.stringify(ask) });
  assert.equal(badOrigin.status, 403);
});
