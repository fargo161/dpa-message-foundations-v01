#!/usr/bin/env node
import { access, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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

export async function checkGeneratedArtifacts() {
  await assertFilesExist();
  for (const relativePath of TRACKED_GENERATED_FILES) {
    assertTracked(relativePath);
  }
  /** @type {Array<[string, Buffer]>} */
  const snapshotEntries = await Promise.all(TRACKED_GENERATED_FILES.map(async (relativePath) => [relativePath, await readFile(`${root}/${relativePath}`)]));
  const snapshots = new Map(snapshotEntries);
  const result = spawnSync(process.execPath, ["scripts/build.mjs"], { cwd: root, encoding: "utf8" });
  const stale = [];
  try {
    if (result.status !== 0) throw new Error(`GENERATED_BUILD_FAILED:${result.stderr || result.stdout}`);
    for (const relativePath of TRACKED_GENERATED_FILES) {
      const rebuilt = await readFile(`${root}/${relativePath}`);
      if (!rebuilt.equals(snapshots.get(relativePath))) stale.push(relativePath);
    }
  } finally {
    await Promise.all([...snapshots.entries()].map(([relativePath, contents]) => writeFile(`${root}/${relativePath}`, contents)));
  }
  if (stale.length) throw new Error(`GENERATED_ARTIFACT_STALE:${stale.join(",")}`);
  for (const relativePath of TRACKED_GENERATED_FILES) assertNoStagedDifference(relativePath);
  return TRACKED_GENERATED_FILES.length;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const count = await checkGeneratedArtifacts();
  console.log(`generated-freshness-ok: ${count} tracked artifacts match npm run build`);
}
