import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateDocument } from "../src/schema-validator.mjs";
import { createMarcusScenario, resolveAction } from "../src/mechanics.mjs";
import { adaptResolvedActionToSemanticRequest } from "../src/action-tpl-adapter.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("executable schema validator rejects malformed payloads", async () => {
  const keywordSchema = JSON.parse(await readFile(`${root}/schemas/keyword.schema.json`, "utf8"));
  const mechanicsSchema = JSON.parse(await readFile(`${root}/schemas/mechanics.schema.json`, "utf8"));
  const semanticRequestSchema = JSON.parse(await readFile(`${root}/schemas/semantic-request.schema.json`, "utf8"));
  const acquisitionSchema = JSON.parse(await readFile(`${root}/schemas/acquisition-manifest.schema.json`, "utf8"));
  const acquisitionManifest = JSON.parse(await readFile(`${root}/data/acquisition-manifest.json`, "utf8"));
  assert.ok(validateDocument({}, keywordSchema).length > 0);
  assert.ok(validateDocument({}, mechanicsSchema).length > 0);
  assert.ok(validateDocument({}, semanticRequestSchema).length > 0);
  assert.deepEqual(validateDocument(acquisitionManifest, acquisitionSchema), []);
});

test("semantic schemas validate representative DEAL, PRESSURE, and ASK requests", async () => {
  const mechanicsSchema = JSON.parse(await readFile(`${root}/schemas/mechanics.schema.json`, "utf8"));
  const semanticRequestSchema = JSON.parse(await readFile(`${root}/schemas/semantic-request.schema.json`, "utf8"));
  const state = createMarcusScenario();
  const examples = [
    ["DEAL", "OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill"],
    ["PRESSURE", "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player"],
    ["ASK", "REQUEST_EXTENSION", "player", "marcus_broker_hill"],
  ];
  for (const [speechAct, actionId, actorId, targetId] of examples) {
    const resolved = resolveAction(state, actionId, actorId, targetId, "PRIVATE_NEGOTIATION");
    assert.deepEqual(validateDocument(resolved, mechanicsSchema), [], `${speechAct} mechanics payload should validate`);
    const adapted = adaptResolvedActionToSemanticRequest(resolved);
    assert.equal(adapted.ok, true, `${speechAct} adapter example should be accepted`);
    assert.deepEqual(validateDocument(adapted.semanticRequest, semanticRequestSchema), [], `${speechAct} semantic request should validate`);
  }
});

test("pressure and semantic request schemas reject empty or malformed required content", async () => {
  const mechanicsSchema = JSON.parse(await readFile(`${root}/schemas/mechanics.schema.json`, "utf8"));
  const semanticRequestSchema = JSON.parse(await readFile(`${root}/schemas/semantic-request.schema.json`, "utf8"));
  const acquisitionSchema = JSON.parse(await readFile(`${root}/schemas/acquisition-manifest.schema.json`, "utf8"));
  const state = createMarcusScenario();
  const pressure = resolveAction(state, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.deepEqual(validateDocument({ ...pressure, payload: { ...pressure.payload, demand: "" } }, mechanicsSchema).length > 0, true);
  const adapted = adaptResolvedActionToSemanticRequest(pressure);
  assert.equal(adapted.ok, true);
  const malformed = structuredClone(adapted.semanticRequest);
  malformed.slots.DEMAND = {};
  assert.ok(validateDocument(malformed, semanticRequestSchema).length > 0);
  const renamed = structuredClone(adapted.semanticRequest);
  renamed.slots.PRESSURE = renamed.slots.DEMAND;
  delete renamed.slots.DEMAND;
  assert.ok(validateDocument(renamed, semanticRequestSchema).length > 0);
  const acquisition = JSON.parse(await readFile(`${root}/data/acquisition-manifest.json`, "utf8"));
  delete acquisition.sources[0].counts.aggregatedAnnotationRows;
  assert.ok(validateDocument(acquisition, acquisitionSchema).length > 0);
  const windowsPath = JSON.parse(await readFile(`${root}/data/acquisition-manifest.json`, "utf8"));
  windowsPath.sources[0].artifactCachePath = windowsPath.sources[0].artifactCachePath.replaceAll("/", "\\");
  assert.ok(validateDocument(windowsPath, acquisitionSchema).length > 0);
});
