#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));

async function collect(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await collect(path));
    else if (entry.name.endsWith(".mjs")) output.push(path);
  }
  return output;
}

const files = [...await collect(join(root, "src")), ...await collect(join(root, "scripts"))];
const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) failures.push(`${relative(root, file)}\n${result.stderr.trim()}`);
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`lint-ok: ${files.length} ESM files parsed`);
