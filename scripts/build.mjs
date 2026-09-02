#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildInspectionReport } from "../src/inspection.mjs";
import { BASED_CUES, BASED_VIBES, DELIVERY_INTENSITIES, SPEECH_ACTS, buildMatrixWithAnchors } from "../src/based.mjs";
import { TPL_ATOMS, TPL_CONSTRUCTIONS, TPL_FAMILIES, TPL_PROTOCOLS, TPL_FALLBACK_POLICY, FACE_COMPATIBILITY_BOUNDARY } from "../src/tpl.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const generated = fileURLToPath(new URL("../data/generated/", import.meta.url));
await mkdir(generated, { recursive: true });
const report = buildInspectionReport();
const basedTpl = {
  schemaVersion: report.schemaVersion,
  cues: BASED_CUES,
  vibes: BASED_VIBES,
  speechActs: SPEECH_ACTS,
  deliveryIntensities: DELIVERY_INTENSITIES,
  matrix: buildMatrixWithAnchors(),
  tplFamilies: TPL_FAMILIES,
  atoms: TPL_ATOMS,
  constructions: TPL_CONSTRUCTIONS,
  protocols: TPL_PROTOCOLS,
  semanticInvarianceBoundary: FACE_COMPATIBILITY_BOUNDARY,
  fallbackPolicy: TPL_FALLBACK_POLICY,
};
await writeFile(fileURLToPath(new URL("../data/source-manifest.json", import.meta.url)), `${JSON.stringify(report.sources, null, 2)}\n`, "utf8");
await writeFile(fileURLToPath(new URL("../data/generated/foundation-inspection.json", import.meta.url)), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(fileURLToPath(new URL("../data/generated/based-tpl-foundation.json", import.meta.url)), `${JSON.stringify(basedTpl, null, 2)}\n`, "utf8");
console.log(`build-ok: ${report.based.matrixCellCount} matrix cells, ${report.based.authoredAnchorCount} anchors, ${report.sources.manifestCount} source manifests`);
