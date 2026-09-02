#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { KEYWORDS } from "../src/keywords.mjs";
import { createMarcusScenario, enumerateSemanticConfigurations, evaluateAction, resolveAction } from "../src/mechanics.mjs";
import { BASED_CUES, BASED_VIBES, DELIVERY_INTENSITIES, SPEECH_ACTS, buildMatrixWithAnchors } from "../src/based.mjs";
import { TPL_ATOMS, TPL_CONSTRUCTIONS, TPL_FAMILIES, TPL_PROTOCOLS, TPL_FALLBACK_POLICY, FACE_COMPATIBILITY_BOUNDARY } from "../src/tpl.mjs";
import { buildAuthoringPipelineTrace } from "../src/inspection.mjs";
import { assertValidDocument } from "../src/schema-validator.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const json = async (relativePath) => JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
const keywordSchema = await json("schemas/keyword.schema.json");
const mechanicsSchema = await json("schemas/mechanics.schema.json");
const basedTplSchema = await json("schemas/based-tpl.schema.json");
const semanticRequestSchema = await json("schemas/semantic-request.schema.json");
const acquisitionSchema = await json("schemas/acquisition-manifest.schema.json");

for (const keyword of KEYWORDS) assertValidDocument(keyword, keywordSchema, `keyword:${keyword.keywordId}`);
const state = createMarcusScenario();
assertValidDocument(state, mechanicsSchema, "mechanics:state");
assertValidDocument(evaluateAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION"), mechanicsSchema, "mechanics:action-evaluation");
assertValidDocument(resolveAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION"), mechanicsSchema, "mechanics:resolved-action");
assertValidDocument(enumerateSemanticConfigurations([state], buildMatrixWithAnchors()), mechanicsSchema, "mechanics:capacity");
const matrix = buildMatrixWithAnchors();
assertValidDocument({ schemaVersion: "dpa-keyword-foundation@0.1", cues: BASED_CUES, vibes: BASED_VIBES, speechActs: SPEECH_ACTS, deliveryIntensities: DELIVERY_INTENSITIES, matrix, tplFamilies: TPL_FAMILIES, atoms: TPL_ATOMS, constructions: TPL_CONSTRUCTIONS, protocols: TPL_PROTOCOLS, semanticInvarianceBoundary: FACE_COMPATIBILITY_BOUNDARY, fallbackPolicy: TPL_FALLBACK_POLICY }, basedTplSchema, "based-tpl");
assertValidDocument(buildAuthoringPipelineTrace().semanticRequest, semanticRequestSchema, "semantic-request");
assertValidDocument(await json("data/acquisition-manifest.json"), acquisitionSchema, "acquisition-manifest");
console.log(`schema-validation-ok: ${KEYWORDS.length} keywords, mechanics state/action/transition/capacity, BASED/TPL, semantic request, acquisition manifest`);
