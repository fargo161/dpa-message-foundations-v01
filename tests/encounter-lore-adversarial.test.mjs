import test from "node:test";
import { projectMarcusLore } from "../src/encounter/marcus-world-adapter.mjs";
import assert from "node:assert/strict";
import { localClient, invokeEngine } from "./helpers/local-engine-client.mjs";
import { createState } from "../src/encounter/state.mjs";
import { transition } from "../src/encounter/engine.mjs";
import { selectQuirk } from "../src/encounter/marcus-profile.mjs";

let serial = 0;
const terms = { units: 2, upfront: 60, repayment: 60, extra: 12, days: 7 };
const input = (view, fields) => ({ requestId: `lore_request_${++serial}`, runId: view.play.runId, version: view.play.version,
  vibeId: "EA", intensity: "BALANCED", ...fields });
async function serve() {
  const read = async client => client.engine.getState();
  const session = async () => localClient();
  const post = (client, body, method = "sendTurn") => invokeEngine(client.engine, method, body);
  const turn = async (client, fields) => { const result = await post(client, input(client.view, fields));
    assert.equal(result.code, 0, result.error?.message); client.view = result.value; return client.view; };
  return { read, session, post, turn };
}

test("lore local engine: new malformed semantic shapes cannot mutate knowledge, history or resources", async t => {
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
    const response = await api.post(client, input(client.view, fields)); assert.ok(response.code >= 400 && response.code < 500);
    assert.equal(typeof (await response.value).error, "string"); assert.deepEqual(await api.read(client), client.view);
  }
});

test("lore local engine: disclosure replay, foreign runs, sessions and restart isolate knowledge", async t => {
  const api = await serve(t); const a = await api.session(); const b = await api.session(); const originalB = structuredClone(b.view);
  const disclose = input(a.view, { action: "ASK", topic: "DISCLOSE_FULL" });
  assert.equal((await api.post(b, disclose)).code, 409);
  const response = await api.post(a, disclose); assert.equal(response.code, 0); a.view = await response.value;
  assert.equal((await api.post(a, disclose)).code, 409); assert.deepEqual(await api.read(a), a.view);
  assert.deepEqual(await api.read(b), originalB);
  const prior = structuredClone(a.view);
  const restart = { requestId: `restart_${++serial}`, runId: a.view.play.runId, version: a.view.play.version, seed: a.view.play.seed };
  const fresh = await api.post(a, restart, "restart"); assert.equal(fresh.code, 0); a.view = await fresh.value;
  assert.notEqual(a.view.play.runId, prior.play.runId); assert.equal(a.view.play.version, 0);
  assert.notDeepEqual(projectMarcusLore(a.view.debug.state), projectMarcusLore(prior.debug.state));
  assert.equal((await api.post(a, { ...disclose, requestId: `expired_${++serial}`, version: 0 })).code, 409);
  assert.deepEqual(await api.read(b), originalB);
});

test("lore local engine: clarification retains offer but disclosure invalidates it and accept stays atomic", async t => {
  const api = await serve(t); const a = await api.session(); const b = await api.session();
  await api.turn(a, { action: "DEAL", terms }); const offer = structuredClone(a.view.play.counteroffer); assert.ok(offer);
  await api.turn(a, { action: "ASK", topic: "CLARIFY_OFFER" }); assert.deepEqual(a.view.play.counteroffer, offer);
  assert.equal((await api.post(b, input(b.view, { action: "ACCEPT", offerId: offer.id, offerVersion: offer.version }))).code, 409);
  await api.turn(a, { action: "ASK", topic: "DISCLOSE_PARTIAL" });
  assert.equal((await api.post(a, input(a.view, { action: "ACCEPT", offerId: offer.id, offerVersion: offer.version }))).code, 409);
  await api.turn(a, { action: "DEAL", terms }); const current = a.view.play.counteroffer; assert.ok(current);
  const acceptance = input(a.view, { action: "ACCEPT", offerId: current.id, offerVersion: current.version });
  const parallel = await Promise.all([api.post(a, acceptance), api.post(a, { ...acceptance, requestId: `parallel_${++serial}` })]);
  assert.deepEqual(parallel.map(r => r.code).sort(), [0, 409]); a.view = await api.read(a);
  assert.equal(a.view.play.status, "AGREED"); assert.equal(a.view.play.metrics.playerStock, current.terms.units);
  assert.equal(a.view.play.metrics.cash, 80 - current.terms.upfront);
  assert.equal(a.view.play.metrics.debt, 250 + current.terms.repayment + current.terms.extra);
  const frozen = structuredClone(a.view);
  for (const fields of [{ action: "ASK", topic: "DISCLOSE_FULL" }, { action: "WALK" }, { action: "DEAL", terms }]) {
    assert.equal((await api.post(a, input(a.view, fields))).code, 409); assert.deepEqual(await api.read(a), frozen);
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

test("lore local engine: conditional information is delivered atomically only by current exact acceptance", async t => {
  const api = await serve(t); const client = await api.session();
  const restart = await api.post(client, { requestId: `positive_seed_${++serial}`, runId: client.view.play.runId,
    version: client.view.play.version, seed: "lore-3" }, "restart");
  assert.equal(restart.code, 0); client.view = await restart.value;
  for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS"]) await api.turn(client, { action: "ASK", topic });
  await api.turn(client, { action: "DEAL", terms: { units: 2, upfront: 41, repayment: 79, extra: 0, days: 7 }, information: "OFFER_INFORMATION" });
  const offer = structuredClone(client.view.play.counteroffer); assert.ok(offer.informationExchange);
  assert.equal(projectMarcusLore(client.view.debug.state).knowledge.marcus.includes("POSITIVE_ROUTE"), false);
  await api.turn(client, { action: "ASK", topic: "CLARIFY_OFFER" }); assert.deepEqual(client.view.play.counteroffer, offer);
  const malformed = input(client.view, { action: "ACCEPT", offerId: offer.id, offerVersion: offer.version, disclosure: "FULL" });
  assert.equal((await api.post(client, malformed)).code, 400); assert.deepEqual(await api.read(client), client.view);
  await api.turn(client, { action: "ACCEPT", offerId: offer.id, offerVersion: offer.version });
  assert.equal(client.view.play.status, "AGREED");
  assert.equal(client.view.play.metrics.cash, 80 - offer.terms.upfront);
  assert.equal(client.view.play.metrics.debt, 250 + offer.terms.repayment + offer.terms.extra);
  assert.equal(offer.extraChargeRate, 8);
  assert.equal(offer.terms.extra, Math.ceil(offer.terms.repayment * 8 / 100));
  assert.ok(projectMarcusLore(client.view.debug.state).knowledge.marcus.includes("POSITIVE_ROUTE"));
  assert.equal(projectMarcusLore(client.view.debug.state).disclosure, "FULL"); assert.ok(client.view.play.lore.disclosed.length);
  assert.ok(client.view.debug.latestTurn.reactionCause.consequences.transfersCommitted);
  assert.equal(Object.hasOwn(client.view.play.events.at(-1), "reactionCause"), false);
});
