#!/usr/bin/env node
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  buildLorebookModel,
  buildRouteManifest,
  extractLorebookIllustrationRenderer,
  siteArchitectureAssumptions,
  validateRouteManifest,
  validateLorebookModel,
} from "../src/lorebook/site.mjs";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const defaultContentPath = "src/lorebook/content.mjs";
const defaultIllustrationPath = "src/lorebook/illustrations.mjs";

function readOption(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function resolveRepositoryPath(value) {
  return isAbsolute(value) ? value : resolve(repositoryRoot, value);
}

function importInstruction(label, requestedPath) {
  const absolutePath = resolveRepositoryPath(requestedPath);
  return `Create ${relative(repositoryRoot, absolutePath) || absolutePath} using the ${label} contract documented in src/lorebook/site.mjs, or pass --${label} <path>.`;
}

async function importRequiredModule(label, requestedPath) {
  const absolutePath = resolveRepositoryPath(requestedPath);
  try {
    return await import(pathToFileURL(absolutePath).href);
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND" && error.message?.includes(absolutePath)) {
      throw new Error(`LOREBOOK_${label.toUpperCase()}_MODULE_MISSING: ${importInstruction(label, requestedPath)}`);
    }
    throw error;
  }
}

function printSummary(model) {
  const relationshipTypes = Object.fromEntries(model.relationships.map((relationship) => relationship.type).map((type) => [type, model.relationships.filter((relationship) => relationship.type === type).length]));
  const manifest = buildRouteManifest(model);
  console.log(`lorebook-check-ok: ${model.articles.length} articles; ${model.relationships.length} relationships; ${model.trails.length} trails; ${manifest.routes.length} routes`);
  console.log(`canonical-keywords: ${model.canonicalKeywords.length}`);
  console.log(`relationship-types: ${JSON.stringify(relationshipTypes)}`);
  console.log(`assumptions: ${JSON.stringify(siteArchitectureAssumptions())}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Usage: node scripts/lorebook-check.mjs [--content <path>] [--illustrations <path>] [--base-path <path>]");
    return;
  }
  const contentPath = readOption(args, "--content", defaultContentPath);
  const illustrationPath = readOption(args, "--illustrations", defaultIllustrationPath);
  const basePath = readOption(args, "--base-path", "");
  const [content, illustrations] = await Promise.all([
    importRequiredModule("content", contentPath),
    importRequiredModule("illustrations", illustrationPath),
  ]);
  const model = buildLorebookModel({ content, illustrations, illustrationRenderer: extractLorebookIllustrationRenderer(illustrations), basePath });
  const errors = [...validateLorebookModel(model), ...validateRouteManifest(model)];
  if (errors.length) {
    console.error(`LOREBOOK_CHECK_FAILED: ${errors.length} issue(s)`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }
  printSummary(model);
}

try {
  await main();
} catch (error) {
  console.error(`lorebook-check-error: ${error.message}`);
  process.exitCode = 1;
}
