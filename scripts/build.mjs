#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { buildInspectionReport } from "../src/inspection.mjs";
import { BASED_CUES, BASED_VIBES, DELIVERY_INTENSITIES, SPEECH_ACTS } from "../src/based.mjs";
import { TPL_ATOMS, TPL_CONSTRUCTIONS, TPL_FAMILIES, TPL_PROTOCOLS, TPL_TEMPLATES, TPL_STYLE_PROFILES, TPL_FALLBACK_POLICY, FACE_COMPATIBILITY_BOUNDARY, buildRuntimeMatrix } from "../src/tpl.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const dataRoot = fileURLToPath(new URL("../data/", import.meta.url));

export async function buildArtifacts(outputRoot = dataRoot) {
  const generated = join(outputRoot, "generated");
  await mkdir(generated, { recursive: true });
  const report = buildInspectionReport();
  const basedTpl = {
    schemaVersion: report.schemaVersion,
    cues: BASED_CUES,
    vibes: BASED_VIBES,
    speechActs: SPEECH_ACTS,
    deliveryIntensities: DELIVERY_INTENSITIES,
    matrix: buildRuntimeMatrix(),
    tplFamilies: TPL_FAMILIES,
    atoms: TPL_ATOMS,
    constructions: TPL_CONSTRUCTIONS,
    protocols: TPL_PROTOCOLS,
    templates: TPL_TEMPLATES,
    styleProfiles: TPL_STYLE_PROFILES,
    semanticInvarianceBoundary: FACE_COMPATIBILITY_BOUNDARY,
    fallbackPolicy: TPL_FALLBACK_POLICY,
  };
  await writeFile(join(outputRoot, "source-manifest.json"), `${JSON.stringify(report.sources, null, 2)}\n`, "utf8");
  await writeFile(join(generated, "foundation-inspection.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(join(generated, "based-tpl-foundation.json"), `${JSON.stringify(basedTpl, null, 2)}\n`, "utf8");
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const outputFlag = process.argv.indexOf("--output-dir");
  const outputRoot = outputFlag === -1 ? dataRoot : resolve(process.argv[outputFlag + 1]);
  const report = await buildArtifacts(outputRoot);
  console.log(`build-ok: ${report.based.matrixCellCount} matrix cells, ${report.based.authoredAnchorCount} anchors, ${report.sources.manifestCount} source manifests`);
}
