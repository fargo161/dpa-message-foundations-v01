#!/usr/bin/env node
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildArtifacts } from "./build.mjs";

export const TRACKED_GENERATED_FILES = Object.freeze([
  "data/source-manifest.json",
  "data/generated/foundation-inspection.json",
  "data/generated/based-tpl-foundation.json",
]);

const root = fileURLToPath(new URL("..", import.meta.url));

async function assertFilesExist() {
  for (const relativePath of TRACKED_GENERATED_FILES) {
    try {
      await access(`${root}/${relativePath}`);
    } catch {
      throw new Error(`GENERATED_ARTIFACT_MISSING:${relativePath}`);
    }
  }
}

function assertTracked(relativePath) {
  const result = spawnSync("git", ["ls-files", "--error-unmatch", "--", relativePath], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`GENERATED_ARTIFACT_NOT_TRACKED:${relativePath}`);
}

function assertNoStagedDifference(relativePath) {
  const result = spawnSync("git", ["diff", "--cached", "--quiet", "--", relativePath], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`GENERATED_ARTIFACT_STAGED_DIFFERENCE:${relativePath}`);
}

export function normalizeGeneratedText(contents) {
  return contents.toString("utf8").replaceAll("\r\n", "\n");
}

export async function checkGeneratedArtifacts() {
  await assertFilesExist();
  for (const relativePath of TRACKED_GENERATED_FILES) {
    assertTracked(relativePath);
  }
  const stale = [];
  const temporaryDataRoot = await mkdtemp(join(tmpdir(), "dpa-generated-"));
  try {
    await buildArtifacts(temporaryDataRoot);
    for (const relativePath of TRACKED_GENERATED_FILES) {
      const artifactPath = relativePath.replace(/^data\//u, "");
      const current = normalizeGeneratedText(await readFile(`${root}/${relativePath}`));
      const rebuilt = normalizeGeneratedText(await readFile(join(temporaryDataRoot, artifactPath)));
      if (rebuilt !== current) stale.push(relativePath);
    }
  } finally {
    await rm(temporaryDataRoot, { recursive: true, force: true });
  }
  if (stale.length) throw new Error(`GENERATED_ARTIFACT_STALE:${stale.join(",")}`);
  for (const relativePath of TRACKED_GENERATED_FILES) assertNoStagedDifference(relativePath);
  return TRACKED_GENERATED_FILES.length;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const count = await checkGeneratedArtifacts();
  console.log(`generated-freshness-ok: ${count} tracked artifacts match npm run build`);
}
