import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createEncounterServer } from "../scripts/encounter-server.mjs";
import { createLocalEngine } from "../public/encounter/local-engine.mjs";
const stripCsrf = view => { const copy = structuredClone(view); delete copy.csrf; return copy; };

test("old HTTP path equals local engine over all 20 golden runs, preview, restart, agreement, walk and logs", async t => {
  const clock = () => Date.parse("2026-10-01T22:05:12Z"), build = { mode: "dev-server", packageVersion: "0.1.0" };
  const directory = await mkdtemp(join(tmpdir(), "marcus-equivalence-"));
  const server = createEncounterServer({ logging: true, logDirectory: directory, logClock: clock, logOffset: -240, logBuild: build });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${url}/api/state`), cookie = response.headers.get("set-cookie").split(";")[0];
  let view = await response.json(), id = view.play.runId, serial = 0;
  const local = createLocalEngine({ seed: view.play.seed, generateId: () => id, clock, offsetMinutes: -240, build });
  assert.deepEqual(local.getState(), stripCsrf(view));
  const post = async (path, input) => {
    const r = await fetch(`${url}/api/${path}`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json", "X-CSRF-Token": view.csrf }, body: JSON.stringify(input) });
    assert.equal(r.status, 200, await r.clone().text()); return r.json();
  };
  const body = fields => ({ requestId: `equivalence-${++serial}`, runId: view.play.runId, version: view.play.version, ...fields });
  const restart = async seed => { const input = body({ seed, scenarioId: "marcus" }); view = await post("restart", input); id = view.play.runId; assert.deepEqual(local.restart(input), stripCsrf(view)); };
  const turn = async fields => {
    const input = body({ vibeId: "EA", intensity: "BALANCED", ...fields }), before = local.getState();
    assert.deepEqual(local.preview(input), await post("preview", input)); assert.deepEqual(local.getState(), before);
    view = await post("turn", input); assert.deepEqual(local.sendTurn(input), stripCsrf(view));
    const logs = await (await fetch(`${url}/api/playtest-log.json`, { headers: { Cookie: cookie } })).json();
    assert.deepEqual(local.exportLog().log, logs);
  };
  const goldens = JSON.parse(await readFile(new URL("../docs/marcus-information-exchange-v01/GOLDEN_RUNS.json", import.meta.url), "utf8"));
  assert.equal(goldens.routes.length, 20);
  for (const route of goldens.routes) {
    await restart(route.seed);
    for (const fields of route.actions) await turn(fields);
    if (view.play.counteroffer) await turn({ action: "ACCEPT", offerId: view.play.counteroffer.id, offerVersion: view.play.counteroffer.version });
    else if (view.play.status === "OPEN") await turn({ action: "WALK" });
  }
  await restart("r17-proof-0"); await turn({ action: "WALK" });
  const before = local.getState(), invalid = body({ seed: "" });
  const r = await fetch(`${url}/api/restart`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json", "X-CSRF-Token": view.csrf }, body: JSON.stringify(invalid) });
  const error = await r.json(); assert.throws(() => local.restart(invalid), { message: error.error }); assert.deepEqual(local.getState(), before);
});
