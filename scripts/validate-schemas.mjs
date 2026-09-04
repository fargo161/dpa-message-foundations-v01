#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { KEYWORDS } from "../src/keywords.mjs";
import { createMarcusScenario, enumerateSemanticConfigurations, evaluateAction, resolveAction } from "../src/mechanics.mjs";
import { BASED_CUES, BASED_VIBES, DELIVERY_INTENSITIES, SPEECH_ACTS, buildMatrixWithAnchors } from "../src/based.mjs";
import { TPL_ATOMS, TPL_CONSTRUCTIONS, TPL_FAMILIES, TPL_PROTOCOLS, TPL_TEMPLATES, TPL_STYLE_PROFILES, TPL_FALLBACK_POLICY, FACE_COMPATIBILITY_BOUNDARY, buildRuntimeMatrix, validateTplArtifactIntegrity } from "../src/tpl.mjs";
import { buildAuthoringPipelineTrace } from "../src/inspection.mjs";
import { adaptResolvedActionToSemanticRequest } from "../src/action-tpl-adapter.mjs";
import { assertValidDocument } from "../src/schema-validator.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const json = async (relativePath) => JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
const keywordSchema = await json("schemas/keyword.schema.json");
const mechanicsSchema = await json("schemas/mechanics.schema.json");
const basedTplSchema = await json("schemas/based-tpl.schema.json");
const semanticRequestSchema = await json("schemas/semantic-request.schema.json");
const acquisitionSchema = await json("schemas/acquisition-manifest.schema.json");
const persistedBasedTpl = await json("data/generated/based-tpl-foundation.json");

function assertCoordinateInventory(artifact, label) {
  const expectedKeys = SPEECH_ACTS.flatMap((speechAct) => BASED_VIBES.flatMap((vibe) => DELIVERY_INTENSITIES.map((intensity) => `${speechAct}_${vibe.vibeId}_${intensity}`)));
  const actualKeys = artifact.map((entry) => entry.key ?? entry.coordinateKey);
  if (actualKeys.length !== 180 || new Set(actualKeys).size !== 180 || expectedKeys.some((key) => !actualKeys.includes(key))) throw new Error(`TPL_COORDINATE_INVENTORY_INVALID:${label}`);
  for (const speechAct of SPEECH_ACTS) if (actualKeys.filter((key) => key.startsWith(`${speechAct}_`)).length !== 60) throw new Error(`TPL_COORDINATE_ACT_COUNT_INVALID:${label}:${speechAct}`);
}

for (const keyword of KEYWORDS) assertValidDocument(keyword, keywordSchema, `keyword:${keyword.keywordId}`);
const state = createMarcusScenario();
assertValidDocument(state, mechanicsSchema, "mechanics:state");
assertValidDocument(evaluateAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION"), mechanicsSchema, "mechanics:action-evaluation");
const representativeResolutions = [
  ["DEAL", "OFFER_PARTIAL_PAYMENT", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION"],
  ["PRESSURE", "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION"],
  ["ASK", "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION"],
];
for (const [macroAct, actionId, actorId, targetId, contextId] of representativeResolutions) {
  const resolved = resolveAction(state, actionId, actorId, targetId, contextId);
  assertValidDocument(resolved, mechanicsSchema, `mechanics:resolved-action:${macroAct}`);
  if (resolved.macroAct !== macroAct) throw new Error(`SCHEMA_REPRESENTATIVE_ACT_MISMATCH:${actionId}`);
  const adapted = adaptResolvedActionToSemanticRequest(resolved);
  if (!adapted.ok) throw new Error(`SCHEMA_REPRESENTATIVE_ADAPTER_FAILED:${macroAct}:${adapted.failures.map((failure) => failure.code).join(",")}`);
  assertValidDocument(adapted.semanticRequest, semanticRequestSchema, `semantic-request:${macroAct}`);
}
assertValidDocument(enumerateSemanticConfigurations([state], buildMatrixWithAnchors()), mechanicsSchema, "mechanics:capacity");
const matrix = buildRuntimeMatrix();
const runtimeArtifact = { schemaVersion: "dpa-keyword-foundation@0.1", cues: BASED_CUES, vibes: BASED_VIBES, speechActs: SPEECH_ACTS, deliveryIntensities: DELIVERY_INTENSITIES, matrix, tplFamilies: TPL_FAMILIES, atoms: TPL_ATOMS, constructions: TPL_CONSTRUCTIONS, protocols: TPL_PROTOCOLS, templates: TPL_TEMPLATES, styleProfiles: TPL_STYLE_PROFILES, semanticInvarianceBoundary: FACE_COMPATIBILITY_BOUNDARY, fallbackPolicy: TPL_FALLBACK_POLICY };
assertValidDocument(runtimeArtifact, basedTplSchema, "based-tpl");
const runtimeIntegrityErrors = validateTplArtifactIntegrity(runtimeArtifact);
if (runtimeIntegrityErrors.length) throw new Error(`TPL_ARTIFACT_INTEGRITY_FAILED:runtime:${runtimeIntegrityErrors.join(",")}`);
assertValidDocument(persistedBasedTpl, basedTplSchema, "based-tpl:persisted-generated-artifact");
const persistedIntegrityErrors = validateTplArtifactIntegrity(persistedBasedTpl);
if (persistedIntegrityErrors.length) throw new Error(`TPL_ARTIFACT_INTEGRITY_FAILED:persisted:${persistedIntegrityErrors.join(",")}`);
assertCoordinateInventory(matrix, "runtime");
assertCoordinateInventory(persistedBasedTpl.matrix, "persisted-matrix");
assertCoordinateInventory(persistedBasedTpl.templates, "persisted-templates");
assertValidDocument(buildAuthoringPipelineTrace().semanticRequest, semanticRequestSchema, "semantic-request");
assertValidDocument(await json("data/acquisition-manifest.json"), acquisitionSchema, "acquisition-manifest");
console.log(`schema-validation-ok: ${KEYWORDS.length} keywords, mechanics state/action/transition/capacity, BASED/TPL, semantic request, acquisition manifest`);
