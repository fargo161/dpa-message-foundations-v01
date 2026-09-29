import test from "node:test";
import { projectMarcusLore } from "../src/encounter/marcus-world-adapter.mjs";
import assert from "node:assert/strict";
import { createEncounterServer } from "../scripts/encounter-server.mjs";
import { createState } from "../src/encounter/state.mjs";
import { transition } from "../src/encounter/engine.mjs";
import { selectQuirk } from "../src/encounter/marcus-profile.mjs";

let serial = 0;
const terms = { units: 2, upfront: 60, repayment: 60, extra: 12, days: 7 };
const input = (view, fields) => ({ requestId: `lore_request_${++serial}`, runId: view.play.runId, version: view.play.version,
  vibeId: "EA", intensity: "BALANCED", ...fields });
async function serve(t) {
  const server = createEncounterServer(); await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}`;
  const read = async client => (await fetch(`${url}/api/state`, { headers: { Cookie: client.cookie } })).json();
  const session = async () => { const r = await fetch(`${url}/api/state`); return { cookie: r.headers.get("set-cookie").split(";")[0], view: await r.json() }; };
  const post = (client, body, path = "/api/turn", headers = {}) => fetch(`${url}${path}`, { method: "POST", headers: { Cookie: client.cookie,
    "Content-Type": "application/json", "X-CSRF-Token": client.view.csrf, ...headers }, body: JSON.stringify(body) });
  const turn = async (client, fields) => { const response = await post(client, input(client.view, fields));
    assert.equal(response.status, 200, await response.clone().text()); client.view = await response.json(); return client.view; };
  return { url, read, session, post, turn };
}

test("lore HTTP: new malformed semantic shapes cannot mutate knowledge, history or resources", async t => {
  const api = await serve(t); const client = await api.session();
  for (const fields of [
    { action: "ASK", topic: "DISCLOSE_FULL", facts: ["POSITIVE_ROUTE"] },
    { action: "ASK", topic: "DISCLOSE_FULL", lore: { disclosure: "FULL" } },
    { action: "ASK", topic: "VERIFY_SOURCE", evidence: true },
    { action: "ASK", topic: "QUESTION_RECORD", consequence: "exposure" },
    { action: "DEAL", terms, information: "THREATEN_EXPOSURE" },
    { action: "DEAL", terms, information: { factId: "POSITIVE_ROUTE" } },
    { action: "DEAL", terms, scoreBonus: 999 },
    { action: "ASK", topic: "CLARIFY_OFFER", offerVersion: 0 },
    { action: "PRESSURE", terms },
    { action: "DEAL", terms: { ...terms, upfront: 81, repayment: 39 }, information: "OFFER_INFORMATION" },
    { action: "DEAL", terms: { ...terms, repayment: 0 }, information: "NONE" },
  ]) {
    const response = await api.post(client, input(client.view, fields)); assert.ok(response.status >= 400 && response.status < 500);
    assert.equal(typeof (await response.json()).error, "string"); assert.deepEqual(await api.read(client), client.view);
  }
});

test("lore HTTP: disclosure replay, foreign runs, sessions and restart isolate knowledge", async t => {
  const api = await serve(t); const a = await api.session(); const b = await api.session(); const originalB = structuredClone(b.view);
  const disclose = input(a.view, { action: "ASK", topic: "DISCLOSE_FULL" });
  assert.equal((await api.post(b, disclose)).status, 409);
  assert.equal((await api.post(a, disclose, "/api/turn", { "X-CSRF-Token": b.view.csrf })).status, 403);
  const response = await api.post(a, disclose); assert.equal(response.status, 200); a.view = await response.json();
  assert.equal((await api.post(a, disclose)).status, 409); assert.deepEqual(await api.read(a), a.view);
  assert.deepEqual(await api.read(b), originalB);
  const prior = structuredClone(a.view);
  const restart = { requestId: `restart_${++serial}`, runId: a.view.play.runId, version: a.view.play.version, seed: a.view.play.seed };
  const fresh = await api.post(a, restart, "/api/restart"); assert.equal(fresh.status, 200); a.view = await fresh.json();
  assert.notEqual(a.view.play.runId, prior.play.runId); assert.equal(a.view.play.version, 0);
  assert.notDeepEqual(projectMarcusLore(a.view.debug.state), projectMarcusLore(prior.debug.state));
  assert.equal((await api.post(a, { ...disclose, requestId: `expired_${++serial}`, version: 0 })).status, 409);
  assert.deepEqual(await api.read(b), originalB);
});

test("lore HTTP: clarification retains offer but disclosure invalidates it and accept stays atomic", async t => {
  const api = await serve(t); const a = await api.session(); const b = await api.session();
  await api.turn(a, { action: "DEAL", terms }); const offer = structuredClone(a.view.play.counteroffer); assert.ok(offer);
  await api.turn(a, { action: "ASK", topic: "CLARIFY_OFFER" }); assert.deepEqual(a.view.play.counteroffer, offer);
  assert.equal((await api.post(b, input(b.view, { action: "ACCEPT", offerId: offer.id, offerVersion: offer.version }))).status, 409);
  await api.turn(a, { action: "ASK", topic: "DISCLOSE_PARTIAL" });
  assert.equal((await api.post(a, input(a.view, { action: "ACCEPT", offerId: offer.id, offerVersion: offer.version }))).status, 409);
  await api.turn(a, { action: "DEAL", terms }); const current = a.view.play.counteroffer; assert.ok(current);
  const acceptance = input(a.view, { action: "ACCEPT", offerId: current.id, offerVersion: current.version });
  const parallel = await Promise.all([api.post(a, acceptance), api.post(a, { ...acceptance, requestId: `parallel_${++serial}` })]);
  assert.deepEqual(parallel.map(r => r.status).sort(), [200, 409]); a.view = await api.read(a);
  assert.equal(a.view.play.status, "AGREED"); assert.equal(a.view.play.metrics.playerStock, current.terms.units);
  assert.equal(a.view.play.metrics.cash, 80 - current.terms.upfront);
  assert.equal(a.view.play.metrics.debt, 250 + current.terms.repayment + current.terms.extra);
  const frozen = structuredClone(a.view);
  for (const fields of [{ action: "ASK", topic: "DISCLOSE_FULL" }, { action: "WALK" }, { action: "DEAL", terms }]) {
    assert.equal((await api.post(a, input(a.view, fields))).status, 409); assert.deepEqual(await api.read(a), frozen);
  }
});

test("lore: information cannot authorize unavailable stock, fake cash or inconsistent obligation", () => {
  let state;
  for (let n = 0; n < 100; n++) { const seed = `lore-${n}`; const candidate = createState(seed, "economic-review", selectQuirk(seed));
    if (projectMarcusLore(candidate).privateFactId === "POSITIVE_ROUTE") { state = candidate; break; } }
  assert.ok(state);
  const apply = fields => ({ requestId: `hard_bound_${state.events.length}`, runId: state.runId, version: state.events.length,
    vibeId: "EA", intensity: "BALANCED", ...fields });
  for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS"]) state = transition(state, apply({ action: "ASK", topic }));
  state.metrics.confidence = 100; state.metrics.tension = 0;
  for (const change of [{ units: 9 }, { units: -1 }, { upfront: 81, repayment: 39 }, { repayment: 0 }, { extra: -1 }, { extra: NaN }, { days: 31 }]) {
    const before = structuredClone(state); assert.throws(() => transition(state, apply({ action: "DEAL", terms: { ...terms, ...change }, information: "OFFER_INFORMATION" })));
    assert.deepEqual(state, before);
  }
  const impossible = transition(state, apply({ action: "DEAL", terms: { units: 8, upfront: 0, repayment: 480, extra: 9999, days: 30 }, information: "OFFER_INFORMATION" }));
  assert.notEqual(impossible.events.at(-1).outcome, "ACCEPT"); assert.equal(impossible.metrics.cash, 80); assert.equal(impossible.metrics.playerStock, 0);
});

test("lore HTTP: conditional information is delivered atomically only by current exact acceptance", async t => {
  const api = await serve(t); const client = await api.session();
  const restart = await api.post(client, { requestId: `positive_seed_${++serial}`, runId: client.view.play.runId,
    version: client.view.play.version, seed: "independent-lore-2" }, "/api/restart");
  assert.equal(restart.status, 200); client.view = await restart.json();
  for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS"]) await api.turn(client, { action: "ASK", topic });
  await api.turn(client, { action: "DEAL", terms: { units: 2, upfront: 41, repayment: 79, extra: 0, days: 7 }, information: "OFFER_INFORMATION" });
  const offer = structuredClone(client.view.play.counteroffer); assert.ok(offer.informationExchange);
  assert.equal(projectMarcusLore(client.view.debug.state).knowledge.marcus.includes("POSITIVE_ROUTE"), false);
  await api.turn(client, { action: "ASK", topic: "CLARIFY_OFFER" }); assert.deepEqual(client.view.play.counteroffer, offer);
  const malformed = input(client.view, { action: "ACCEPT", offerId: offer.id, offerVersion: offer.version, disclosure: "FULL" });
  assert.equal((await api.post(client, malformed)).status, 400); assert.deepEqual(await api.read(client), client.view);
  await api.turn(client, { action: "ACCEPT", offerId: offer.id, offerVersion: offer.version });
  assert.equal(client.view.play.status, "AGREED"); assert.equal(client.view.play.metrics.cash, 39); assert.equal(client.view.play.metrics.debt, 329);
  assert.ok(projectMarcusLore(client.view.debug.state).knowledge.marcus.includes("POSITIVE_ROUTE"));
  assert.equal(projectMarcusLore(client.view.debug.state).disclosure, "FULL"); assert.ok(client.view.play.lore.disclosed.length);
  assert.ok(client.view.debug.latestTurn.reactionCause.consequences.transfersCommitted);
  assert.equal(Object.hasOwn(client.view.play.events.at(-1), "reactionCause"), false);
});
