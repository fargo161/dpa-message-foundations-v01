import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createEncounterServer } from "../scripts/encounter-server.mjs";
import { createState, METRIC_DEFINITIONS } from "../src/encounter/state.mjs";
import { transition, projectState } from "../src/encounter/engine.mjs";
import { selectQuirk } from "../src/encounter/marcus-profile.mjs";

const terms = { units: 2, upfront: 60, repayment: 60, extra: 20, days: 7 };
const initial = (seed = "review") => createState(seed, "review-run", selectQuirk(seed));
let serial = 0;
const intent = (state, extra = {}) => ({ requestId: `review_${++serial}`, runId: state.runId,
  version: state.events.length, action: "ASK", topic: "DEBT", vibeId: "EA", intensity: "BALANCED", ...extra });
const deal = (state, values = terms, extra = {}) => {
  const input = intent(state, { action: "DEAL", terms: values, ...extra }); delete input.topic; return input;
};
function offered() {
  for (const vibeId of ["EA", "AE", "SE", "SA", "ES", "AS"]) {
    const result = transition(initial(), deal(initial(), terms, { vibeId }));
    if (result.counteroffer) return result;
  }
  assert.fail("No defensible proposal produced an offer for adversarial acceptance tests.");
}
function accept(state, offer = state.counteroffer) {
  const input = intent(state, { action: "ACCEPT", offerId: offer.id, offerVersion: offer.version }); delete input.topic; return input;
}
function rejectedUnchanged(state, input) {
  const before = structuredClone(state); assert.throws(() => transition(state, input)); assert.deepEqual(state, before);
}
async function withServer(run) {
  const server = createEncounterServer(); server.listen(0, "127.0.0.1"); await once(server, "listening");
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
async function session(base) {
  const response = await fetch(`${base}/api/state`); assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie"); assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/);
  return { cookie: cookie.split(";")[0], data: await response.json() };
}
async function post(base, client, body, path = "/api/turn", headers = {}) {
  return fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: client.cookie,
    "X-CSRF-Token": client.data.csrf, ...headers }, body: JSON.stringify(body) });
}
async function read(base, client) { return (await fetch(`${base}/api/state`, { headers: { Cookie: client.cookie } })).json(); }

test("adversarial: economics reject fabricated credit even at maximal confidence", () => {
  const state = initial(); state.metrics.confidence = 100; state.metrics.tension = 0;
  for (const changes of [{ units: 0 }, { units: 9 }, { units: 1.5 }, { upfront: -1 }, { upfront: 81, repayment: 39 },
    { repayment: 0 }, { repayment: 59 }, { extra: -1 }, { extra: 10001 }, { days: 0 }, { days: 31 },
    { extra: NaN }, { extra: Infinity }, { extra: "20" }, { guaranteedProfit: 10000 }]) {
    rejectedUnchanged(state, deal(state, { ...terms, ...changes }));
  }
  for (const changes of [{ marcusStock: 1 }, { playerStock: 99 }, { cash: 59 }]) {
    const reduced = structuredClone(state); Object.assign(reduced.metrics, changes); rejectedUnchanged(reduced, deal(reduced));
  }
  const capped = structuredClone(state); capped.obligations.existing = 99999; capped.metrics.debt = 99999;
  rejectedUnchanged(capped, deal(capped));
});

test("adversarial: closed intent and semantic shapes forbid client authority", () => {
  const state = initial();
  for (const changes of [{ state }, { metrics: { cash: 100000 } }, { terms }, { action: "PRESSURE" },
    { vibeId: "friendly" }, { intensity: "MAXIMUM" }, { topic: "PROFIT" }, { version: "0" }, { runId: "foreign" }]) {
    rejectedUnchanged(state, intent(state, changes));
  }
});

test("adversarial: offers move nothing, acceptance accounts once and rechecks resources", () => {
  const state = offered(); const before = initial();
  for (const key of ["cash", "debt", "marcusStock", "playerStock"]) assert.equal(state.metrics[key], before.metrics[key]);
  for (const changes of [{ cash: 0 }, { marcusStock: 0 }, { playerStock: 100 }]) {
    const reduced = structuredClone(state); Object.assign(reduced.metrics, changes); rejectedUnchanged(reduced, accept(reduced));
  }
  const capped = structuredClone(state); capped.obligations.existing = 100000; rejectedUnchanged(capped, accept(capped));
  const proposal = state.counteroffer.terms; const done = transition(state, accept(state));
  assert.equal(done.status, "AGREED"); assert.equal(done.metrics.cash, 80 - proposal.upfront);
  assert.equal(done.metrics.marcusStock, 8 - proposal.units); assert.equal(done.metrics.playerStock, proposal.units);
  assert.equal(done.obligations.existing, 250); assert.equal(done.obligations.principal, proposal.repayment);
  assert.equal(done.obligations.extra, proposal.extra); assert.equal(done.metrics.debt, 250 + proposal.repayment + proposal.extra);
  assert.ok(!done.events.at(-1).playerText.includes(state.counteroffer.id));
  assert.ok(done.events.at(-1).playerText.includes(`${proposal.units} Contra unit(s)`));
  assert.ok(done.events.at(-1).playerText.includes(`$${proposal.repayment} new principal`));
  assert.deepEqual(done.agreement.terms, proposal); rejectedUnchanged(done, accept(done, state.counteroffer));
});

test("adversarial: forged, mismatched and intervening-turn offers fail", () => {
  const state = offered(); rejectedUnchanged(state, accept(state, { ...state.counteroffer, id: "forged" }));
  rejectedUnchanged(state, accept(state, { ...state.counteroffer, version: state.counteroffer.version + 1 }));
  const later = transition(state, intent(state, { topic: "RISK" })); rejectedUnchanged(later, accept(later, state.counteroffer));
});

test("adversarial: repeated probes have finite benefit and always consume a finite encounter", () => {
  for (const topic of ["DEBT", "RISK", "PRIORITIES", "FINAL_SAY"]) {
    let state = initial(); let turns = 0;
    while (state.status === "OPEN" && turns < 30) {
      const old = state; state = transition(state, intent(state, { topic, vibeId: ["EA", "SE", "SA"][turns % 3] })); turns++;
      assert.ok(state.metrics.patience < old.metrics.patience, `${topic} failed to consume patience`);
      if (turns > 2) assert.ok(state.metrics.confidence <= old.metrics.confidence, `${topic} farms confidence by changing Vibe`);
      for (const d of METRIC_DEFINITIONS) assert.ok(state.metrics[d.key] >= d.min && state.metrics[d.key] <= d.max);
    }
    assert.equal(state.status, "ENDED"); assert.ok(turns <= 12); assert.equal(state.metrics.playerStock, 0);
  }
});

test("adversarial: seeded replay reproduces transitions and delivery leaves submitted terms intact", () => {
  const replay = () => { let state = initial("same-seed");
    for (const input of [intent(state, { requestId: "replay_ask", topic: "RISK" })]) state = transition(state, input);
    state = transition(state, deal(state, terms, { requestId: "replay_deal" })); return state; };
  assert.deepEqual(replay(), replay());
  for (const vibeId of ["EA", "BA", "DE", "SE"]) for (const intensity of ["SUBTLE", "BALANCED", "OVERT"]) {
    const state = transition(initial(), deal(initial(), terms, { vibeId, intensity }));
    assert.deepEqual(state.events[0].intent.terms, terms); assert.deepEqual(state.proposal.terms, terms);
    assert.equal(state.metrics.cash, 80); assert.equal(state.metrics.playerStock, 0);
  }
});

test("adversarial: projection has four Play metrics and every displayed fact agrees with Debug", () => {
  const state = offered(); const projected = projectState(state, "csrf");
  assert.deepEqual(Object.keys(projected.play.metrics).sort(), ["cash", "debt", "marcusStock", "playerStock"].sort());
  for (const [key, value] of Object.entries(projected.play.metrics)) assert.equal(value, projected.debug.state.metrics[key]);
  for (const key of ["status", "seed", "runId", "proposal", "counteroffer", "agreement", "obligations", "clues"]) assert.deepEqual(projected.play[key], projected.debug.state[key]);
  assert.equal(projected.play.version, state.events.length); assert.equal(Object.hasOwn(projected.play, "quirk"), false);
  assert.ok(projected.play.events.every(event => Object.keys(event).sort().join() === "marcusText,outcome,playerText"));
});

test("adversarial HTTP: sessions, CSRF, stale/replay, simultaneous turns and restart isolate authority", async () => withServer(async base => {
  const a = await session(base); const b = await session(base); const originalB = structuredClone(b.data);
  const input = intent(a.data.debug.state);
  for (const [client, body, headers] of [[b, input, {}], [a, input, { "X-CSRF-Token": "forged" }],
    [a, input, { Origin: "https://hostile.example" }], [a, input, { "Sec-Fetch-Site": "cross-site" }],
    [a, { ...input, metrics: { cash: 99999 } }, {}]]) {
    const response = await post(base, client, body, "/api/turn", headers); assert.ok(response.status >= 400);
    assert.equal(typeof (await response.json()).error, "string"); assert.deepEqual(await read(base, a), a.data);
  }
  const simultaneous = await Promise.all([post(base, a, input), post(base, a, { ...input, requestId: "parallel_other" })]);
  assert.deepEqual(simultaneous.map(r => r.status).sort(), [200, 409]); a.data = await read(base, a);
  assert.equal(a.data.play.version, 1); const frozen = structuredClone(a.data);
  assert.equal((await post(base, a, input)).status, 409); assert.deepEqual(await read(base, a), frozen);
  const restart = { requestId: "restart_review", runId: a.data.play.runId, version: a.data.play.version, seed: "reproduced" };
  const restarted = await post(base, a, restart, "/api/restart"); assert.equal(restarted.status, 200); a.data = await restarted.json();
  assert.notEqual(a.data.play.runId, restart.runId); assert.equal(a.data.play.version, 0);
  assert.equal((await post(base, a, restart, "/api/restart")).status, 409);
  assert.equal((await post(base, a, { ...input, requestId: "old_run_review", version: 0 })).status, 409);
  assert.deepEqual(await read(base, b), originalB);
}));

test("adversarial HTTP: only prototype assets/routes are served", async () => withServer(async base => {
  for (const path of ["/package.json", "/AGENTS.md", "/src/based.mjs", "/.git/config", "/docs/architecture/MARCUS_ENCOUNTER_V01.md",
    "/%2e%2e/package.json", "/api/admin", "/api/turn?state=1"]) {
    const response = await fetch(`${base}${path}`); assert.equal(response.status, 404, path);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  }
  assert.equal((await fetch(`${base}/api/turn`)).status, 405);
  assert.equal((await fetch(`${base}/api/state`, { method: "POST" })).status, 405);
}));

test("adversarial: context, prior risk acknowledgment and delivery change actual decisions", () => {
  const state = createState("recognition-review", "context-run", "recognition");
  const borderline = { units: 2, upfront: 60, repayment: 60, extra: 0, days: 7 };
  const direct = transition(state, deal(state, borderline));
  const acknowledged = transition(state, intent(state, { topic: "RISK", vibeId: "SE" }));
  const later = transition(acknowledged, deal(acknowledged, borderline));
  assert.equal(direct.events.at(-1).outcome, "COUNTER"); assert.equal(later.events.at(-1).outcome, "ACCEPT");
  assert.deepEqual(later.counteroffer.terms, borderline); assert.ok(acknowledged.clues.length > 0);
  const businessEA = transition(state, deal(state, terms));
  const businessSE = transition(state, deal(state, terms, { vibeId: "SE" }));
  const riskEA = transition(state, intent(state, { topic: "RISK" }));
  assert.ok(businessEA.events[0].deltas.confidence > businessSE.events[0].deltas.confidence);
  assert.ok(acknowledged.events[0].deltas.confidence > riskEA.events[0].deltas.confidence);
  const subtle = transition(state, intent(state, { topic: "RISK", vibeId: "BA", intensity: "SUBTLE" }));
  const overt = transition(state, intent(state, { topic: "RISK", vibeId: "BA", intensity: "OVERT" }));
  assert.ok(overt.metrics.tension > subtle.metrics.tension);
  const refused = transition(state, deal(state, { units: 8, upfront: 0, repayment: 480, extra: 10000, days: 30 }));
  assert.equal(refused.events[0].outcome, "REJECT"); assert.equal(refused.metrics.playerStock, 0);
  for (const quirk of ["recognition", "plain_dealing", "final_say"]) {
    const discovered = transition(createState("clue", "clue-run", quirk), intent(createState("clue", "clue-run", quirk), { topic: "PRIORITIES", vibeId: "ES" }));
    assert.ok(discovered.clues.length); assert.ok(discovered.metrics.confidence >= 40); assert.equal(discovered.metrics.patience, 11);
    assert.ok(!discovered.clues.join(" ").includes(quirk));
  }
});

test("adversarial: cycling distinct social actions cannot evade opening benefit budget", () => {
  let state = initial();
  for (const [index, topic] of ["RISK", "DEBT", "FINAL_SAY", "PRIORITIES", "TERMS", "RISK"].entries()) {
    const old = state; state = transition(state, intent(state, { topic, vibeId: ["EA", "SE", "ES"][index % 3] }));
    if (index >= 3) { assert.ok(state.metrics.confidence <= old.metrics.confidence); assert.ok(state.metrics.tension >= old.metrics.tension); }
    assert.ok(state.metrics.patience < old.metrics.patience);
  }
});

test("adversarial HTTP: cross-session offers fail and complete replayed agreements match", async () => withServer(async base => {
  const clients = await Promise.all([session(base), session(base)]);
  for (const client of clients) {
    const restart = await post(base, client, { requestId: "shared_seed_restart", runId: client.data.play.runId, version: 0, seed: "review" }, "/api/restart");
    assert.equal(restart.status, 200); client.data = await restart.json();
    for (const mutation of [{ upfront: 81, repayment: 39 }, { repayment: 0 }, { units: 9, repayment: 480 }, { extra: -1 }]) {
      const response = await post(base, client, deal(client.data.debug.state, { ...terms, ...mutation }));
      assert.equal(response.status, 400); assert.deepEqual(await read(base, client), client.data);
    }
    const response = await post(base, client, deal(client.data.debug.state)); assert.equal(response.status, 200); client.data = await response.json();
    assert.ok(client.data.play.counteroffer); assert.equal(client.data.play.metrics.playerStock, 0);
  }
  const [a, b] = clients;
  const forged = accept(b.data.debug.state, a.data.play.counteroffer);
  assert.equal((await post(base, b, forged)).status, 409); assert.deepEqual(await read(base, b), b.data);
  assert.deepEqual(a.data.play.metrics, b.data.play.metrics); assert.deepEqual(a.data.play.counteroffer.terms, b.data.play.counteroffer.terms);
  for (const client of clients) {
    const input = accept(client.data.debug.state); const response = await post(base, client, input);
    assert.equal(response.status, 200); client.data = await response.json(); assert.equal(client.data.play.status, "AGREED");
    assert.equal((await post(base, client, input)).status, 409); assert.deepEqual(await read(base, client), client.data);
  }
  assert.deepEqual(a.data.play.metrics, b.data.play.metrics); assert.deepEqual(a.data.play.obligations, b.data.play.obligations);
}));
