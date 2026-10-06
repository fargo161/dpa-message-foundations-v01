import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { localClient, invokeEngine } from "./helpers/local-engine-client.mjs";

test("conversation portability: Avery uses the common engine, keywords, preview, two-face turn and restart", async t => {
  const fixture = JSON.parse(await readFile(new URL("./fixtures/conversation-broken-promise.json", import.meta.url), "utf8"));
  const client = localClient(); let view = client.view;
  const post = (method, fields) => invokeEngine(client.engine, method, { requestId: crypto.randomUUID(), runId: view.play.runId, version: view.play.version, ...fields });
  const commit = async (path, fields) => { const response = await post(path, fields); assert.equal(response.code, 0, await response.error?.message); view = await response.value; };
  assert.ok(view.options.scenarios.some(item => item.id === fixture.id));
  await commit("restart", { seed: "portability-proof", scenarioId: fixture.id });
  assert.deepEqual(view.play.character, fixture.character);
  assert.equal(view.play.scenario.kind, fixture.kind);
  assert.equal(view.options.price, null);
  for (const [key, value] of Object.entries(fixture.expected)) if (key !== "price") assert.deepEqual(view.play[key], value);
  const initialRun = view.play.runId;
  for (const expected of fixture.keywords[0].actions) {
    const keyword = view.options.keywords.find(item => item.id === fixture.keywords[0].id);
    assert.ok(keyword);
    const action = keyword.actions.find(item => item.id === expected.id && item.available);
    assert.ok(action, `Missing contextual action ${expected.id}`);
    assert.deepEqual(action.intent, expected.intent);
    const fields = { ...action.intent, keywordId: keyword.id, contextActionId: action.id, vibeId: "ES", intensity: "SUBTLE" };
    const preview = await post("preview", fields);
    assert.equal(preview.code, 0, await preview.error?.message);
    const draft = await preview.value;
    assert.doesNotMatch(draft.playerText, /Marcus|Contra|\$250|repayment/i);
    await commit("sendTurn", fields);
    const event = view.play.events.at(-1);
    assert.ok(event.faces.receiving && event.faces.responding);
    assert.deepEqual(event.faces.turnRef, { runId: initialRun, index: view.play.version });
    assert.doesNotMatch(`${event.playerText} ${event.marcusText}`, /Marcus|Contra|\$250|repayment/i);
    assert.deepEqual(view.play.metrics, {});
    assert.equal(view.play.counteroffer, null);
  }
  assert.equal(view.play.version, 3);
  assert.notEqual(view.play.status, "OPEN");
  await commit("restart", { seed: "back-to-default" });
  assert.equal(view.play.character.id, "marcus");
  assert.equal(view.play.scenario.kind, "NEGOTIATION");
  assert.notEqual(view.play.runId, initialRun);
  assert.equal(view.play.version, 0);

  await commit("restart", { seed: "portability-repetition", scenarioId: fixture.id });
  const unchanged = structuredClone(view);
  for (const fields of [
    { action: "DEAL", terms: { units: 1, upfront: 60, repayment: 0, extra: 0, days: 7 } },
    { action: "ASK", topic: "EXPLANATION", keywordId: "old-account", contextActionId: "ask-explanation" },
    { action: "ASK", topic: "EXPLANATION", knowledge: ["The bus definitely broke down"] },
  ]) {
    const response = await post("sendTurn", { vibeId: "EA", intensity: "BALANCED", ...fields });
    assert.ok(response.code >= 400 && response.code < 500);
    const current = client.engine.getState();
    assert.deepEqual(current, unchanged);
  }
  for (let index = 0; index < 6; index++) {
    await commit("sendTurn", { action: "ASK", topic: "EXPLANATION", keywordId: "missed-meeting", contextActionId: "ask-explanation", vibeId: "EA", intensity: "BALANCED" });
    const claims = view.options.keywords.filter(item => item.kind === "REPORTED_CLAIM");
    assert.equal(claims.length, 1, "Repeating a claim cannot create additional evidence");
    assert.match(claims[0].summary, /not independently checked/);
    assert.equal(view.play.metrics && Object.keys(view.play.metrics).length, 0);
    if (index > 0 && index < 5) assert.match(view.play.events.at(-1).marcusText, /Repeating the question/);
  }
  assert.equal(view.play.status, "ENDED");
  assert.ok(view.options.keywords.every(item => item.actions.every(action => !action.available)));
});
