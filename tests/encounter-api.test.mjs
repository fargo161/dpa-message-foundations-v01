import test from "node:test";
import assert from "node:assert/strict";
import { localClient, invokeEngine } from "./helpers/local-engine-client.mjs";

test("local engines reject replay, foreign runs and state injection and isolate restarts", async () => {
  const a = localClient(), b = localClient();
  const input = (client, fields) => ({ requestId: crypto.randomUUID(), runId: client.view.play.runId, version: client.view.play.version, vibeId: "EA", intensity: "BALANCED", ...fields });
  const post = (client, body, method = "sendTurn") => invokeEngine(client.engine, method, body);
  const ask = input(a, { action: "ASK", topic: "DEBT" });
  assert.equal((await post(b, ask)).code, 409);
  const done = await post(a, ask); assert.equal(done.code, 0); a.view = done.value;
  assert.equal((await post(a, ask)).code, 409);
  assert.equal((await post(a, { ...input(a, { action: "ASK", topic: "RISK" }), state: { cash: 1000 } })).code, 400);
  assert.equal(b.engine.getState().play.version, 0);
  const restart = { requestId: crypto.randomUUID(), runId: a.view.play.runId, version: a.view.play.version, seed: "repeatable" };
  const restarted = await post(a, restart, "restart"); assert.equal(restarted.code, 0);
  const newView = restarted.value; assert.notEqual(newView.play.runId, a.view.play.runId);
  assert.equal((await post(a, ask)).code, 409);
});
