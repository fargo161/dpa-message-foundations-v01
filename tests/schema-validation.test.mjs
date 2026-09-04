import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateDocument } from "../src/schema-validator.mjs";
import { createMarcusScenario, resolveAction } from "../src/mechanics.mjs";
import { adaptResolvedActionToSemanticRequest } from "../src/action-tpl-adapter.mjs";
import { validateTplArtifactIntegrity } from "../src/tpl.mjs";

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
  const contradictoryAcquisition = JSON.parse(await readFile(`${root}/data/acquisition-manifest.json`, "utf8"));
  contradictoryAcquisition.sources[0].status = "FIXTURE_ONLY";
  assert.ok(validateDocument(contradictoryAcquisition, acquisitionSchema).length > 0);
  const indexedWithoutReceipt = JSON.parse(await readFile(`${root}/data/acquisition-manifest.json`, "utf8"));
  indexedWithoutReceipt.sources[0].status = "ACQUIRED_NOT_INDEXED";
  indexedWithoutReceipt.sources[0].counts.indexed = 1;
  indexedWithoutReceipt.sources[0].indexSnapshot = null;
  indexedWithoutReceipt.sources[0].normalizedRecordsPath = null;
  assert.ok(validateDocument(indexedWithoutReceipt, acquisitionSchema).length > 0);
});

test("persisted TPL artifacts reject contradictory readiness combinations", async () => {
  const basedTplSchema = JSON.parse(await readFile(`${root}/schemas/based-tpl.schema.json`, "utf8"));
  const matrixCellSchema = { ...basedTplSchema.$defs.matrixCell, $defs: basedTplSchema.$defs };
  const persisted = JSON.parse(await readFile(`${root}/data/generated/based-tpl-foundation.json`, "utf8"));
  assert.deepEqual(validateDocument(persisted, basedTplSchema), [], "persisted generated TPL artifact should validate");
  const cases = [
    ["reviewed style marked production-eligible", (artifact) => { artifact.styleProfiles[0].productionEligible = true; }],
    ["production matrix execution without approval", (artifact) => { artifact.matrix[0].executionMode = "PRODUCTION"; artifact.matrix[0].productionEligible = true; }],
    ["approved preview protocol represented as production", (artifact) => { artifact.protocols[0].reviewStatus = "APPROVED"; }],
  ];
  for (const [label, mutate] of cases) {
    const candidate = structuredClone(persisted);
    mutate(candidate);
    assert.ok(validateDocument(candidate, basedTplSchema).length > 0, `${label} passed persisted schema validation`);
  }

  const crossRecordContradiction = structuredClone(persisted);
  crossRecordContradiction.matrix[0].readiness = { state: "PRODUCTION_ELIGIBLE" };
  crossRecordContradiction.matrix[0].reviewStatus = "APPROVED";
  crossRecordContradiction.matrix[0].executionMode = "PRODUCTION_RUNTIME";
  crossRecordContradiction.matrix[0].previewEligible = true;
  crossRecordContradiction.matrix[0].productionEligible = true;
  crossRecordContradiction.matrix[0].styleProfileId = "ZANT_HUMOR_V01";
  assert.deepEqual(validateDocument(crossRecordContradiction, basedTplSchema), [], "cross-record fixture should pass its local schema shape");
  assert.ok(validateTplArtifactIntegrity(crossRecordContradiction).some((error) => error.includes("PRODUCTION") || error.includes("READINESS")));

  const duplicateCoordinate = structuredClone(persisted);
  duplicateCoordinate.templates[1].coordinateKey = duplicateCoordinate.templates[0].coordinateKey;
  assert.deepEqual(validateDocument(duplicateCoordinate, basedTplSchema), [], "duplicate-coordinate fixture should pass its local schema shape");
  assert.ok(validateTplArtifactIntegrity(duplicateCoordinate).some((error) => error.startsWith("TEMPLATE_COORDINATE_DUPLICATE")));

  const readinessFixtures = [
    ["PREVIEW_READY", "CANDIDATE", "AUTHORING_PREVIEW", true, false, "CANONICAL_NEUTRAL_V01"],
    ["REVIEWED", "REVIEWED", "AUTHORING_PREVIEW", true, false, "CANONICAL_NEUTRAL_V01"],
    ["APPROVED", "APPROVED", "AUTHORING_PREVIEW", true, false, "CANONICAL_NEUTRAL_V01"],
    ["PRODUCTION_ELIGIBLE", "APPROVED", "PRODUCTION_RUNTIME", true, true, "ZANT_HUMOR_V01"],
    ["BLOCKED", "BLOCKED", "PRODUCTION_SAFETY_FALLBACK", false, false, "CANONICAL_NEUTRAL_V01"],
  ];
  for (const [state, reviewStatus, executionMode, previewEligible, productionEligible, styleProfileId] of readinessFixtures) {
    const fixture = {
      ...structuredClone(persisted.matrix[0]),
      readiness: { state },
      reviewStatus,
      executionMode,
      previewEligible,
      productionEligible,
      styleProfileId,
    };
    assert.deepEqual(validateDocument(fixture, matrixCellSchema), [], `${state} readiness fixture should validate`);
  }

  const contradictoryReadiness = structuredClone(persisted.matrix[0]);
  contradictoryReadiness.readiness = { state: "REVIEWED" };
  contradictoryReadiness.reviewStatus = "APPROVED";
  contradictoryReadiness.productionEligible = true;
  contradictoryReadiness.executionMode = "PRODUCTION";
  assert.ok(validateDocument(contradictoryReadiness, matrixCellSchema).length > 0, "mixed readiness state passed validation");
});
