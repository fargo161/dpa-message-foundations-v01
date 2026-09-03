#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { stat } from "node:fs/promises";
import { isAbsolute, resolve, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  buildLorebookModel,
  buildRouteManifest,
  extractLorebookIllustrationRenderer,
  renderAllPages,
  siteArchitectureAssumptions,
  validateRouteManifest,
  validateLorebookModel,
} from "../src/lorebook/site.mjs";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const defaultContentPath = "src/lorebook/content.mjs";
const defaultIllustrationPath = "src/lorebook/illustrations.mjs";
const defaultStylesPath = "src/lorebook/lorebook.css";
const defaultOutputPath = "dist/lorebook";

function readOption(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function usage() {
  return [
    "Usage: node scripts/lorebook-build.mjs [options]",
    "",
    "Options:",
    `  --content <path>        Authored content module (default: ${defaultContentPath})`,
    `  --illustrations <path> Illustration module (default: ${defaultIllustrationPath})`,
    `  --styles <path>        Visual grammar CSS (default: ${defaultStylesPath})`,
    `  --out <path>           Static output directory (default: ${defaultOutputPath})`,
    "  --base-path <path>     Public URL prefix, e.g. /field-guide",
    "  --serve                Serve the generated directory on localhost:4173",
    "  --port <number>        Port used with --serve (default: 4173)",
    "  --help                 Show this help",
  ].join("\n");
}

function resolveRepositoryPath(value) {
  return isAbsolute(value) ? value : resolve(repositoryRoot, value);
}

async function importRequiredModule(label, requestedPath) {
  const absolutePath = resolveRepositoryPath(requestedPath);
  try {
    return await import(pathToFileURL(absolutePath).href);
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND" && error.message?.includes(absolutePath)) {
      throw new Error(`LOREBOOK_${label.toUpperCase()}_MODULE_MISSING: expected ${relative(repositoryRoot, absolutePath) || absolutePath}. Create the authored module using the contract in src/lorebook/site.mjs, or pass --${label} <path>.`);
    }
    throw error;
  }
}

function failWithValidation(errors) {
  const detail = errors.map((error) => `  - ${error}`).join("\n");
  throw new Error(`LOREBOOK_CONTENT_INVALID:\n${detail}`);
}

async function writePages(outputRoot, pages) {
  for (const [pagePath, html] of pages) {
    const destination = resolve(outputRoot, pagePath);
    await mkdir(resolve(destination, ".."), { recursive: true });
    await writeFile(destination, `${html}\n`, "utf8");
  }
}

async function serveDirectory(outputRoot, port) {
  const root = resolve(outputRoot);
  const server = createServer(async (request, response) => {
    let requestPath;
    try {
      requestPath = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    } catch {
      response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      response.end("Bad request");
      return;
    }
    const relativePath = requestPath.replace(/^\/+/, "");
    let candidate = resolve(root, relativePath);
    if (!candidate.startsWith(`${root}${relativePath ? "\\" : ""}`) && candidate !== root) {
      response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }
    try {
      let details = await stat(candidate);
      if (details.isDirectory()) {
        candidate = resolve(candidate, "index.html");
        details = await stat(candidate);
      }
      if (!details.isFile() || !candidate.startsWith(root)) throw new Error("not a file");
      const body = await readFile(candidate);
      const contentType = candidate.endsWith(".html")
        ? "text/html; charset=utf-8"
        : candidate.endsWith(".json")
          ? "application/json; charset=utf-8"
          : candidate.endsWith(".css")
            ? "text/css; charset=utf-8"
            : "application/octet-stream";
      response.writeHead(200, { "content-type": contentType, "cache-control": "no-cache" });
      response.end(body);
    } catch {
      response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      response.end(await readFile(resolve(root, "404.html")));
    }
  });
  await new Promise((resolveServer, rejectServer) => {
    server.once("error", rejectServer);
    server.listen(port, "127.0.0.1", () => resolveServer(undefined));
  });
  console.log(`lorebook-dev-server: http://127.0.0.1:${port}/`);
  await new Promise((resolveServer) => {
    server.once("close", resolveServer);
    process.once("SIGINT", () => server.close());
    process.once("SIGTERM", () => server.close());
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(usage());
    return;
  }
  const contentPath = readOption(args, "--content", defaultContentPath);
  const illustrationPath = readOption(args, "--illustrations", defaultIllustrationPath);
  const stylesPath = readOption(args, "--styles", defaultStylesPath);
  const outputRoot = resolveRepositoryPath(readOption(args, "--out", defaultOutputPath));
  const basePath = readOption(args, "--base-path", "");
  const shouldServe = args.includes("--serve");
  const port = Number(readOption(args, "--port", "4173"));
  if (shouldServe && (!Number.isInteger(port) || port < 1 || port > 65535)) throw new Error("LOREBOOK_INVALID_PORT: --port must be an integer from 1 to 65535");
  const [content, illustrations, styles] = await Promise.all([
    importRequiredModule("content", contentPath),
    importRequiredModule("illustrations", illustrationPath),
    readFile(resolveRepositoryPath(stylesPath), "utf8"),
  ]);
  const model = buildLorebookModel({ content, illustrations, illustrationRenderer: extractLorebookIllustrationRenderer(illustrations), styles, basePath });
  const errors = validateLorebookModel(model);
  if (errors.length) failWithValidation(errors);
  const pages = renderAllPages(model);
  const routeErrors = validateRouteManifest(model, pages);
  if (routeErrors.length) failWithValidation(routeErrors);
  await writePages(outputRoot, pages);
  await writeFile(resolve(outputRoot, "route-manifest.json"), `${JSON.stringify(buildRouteManifest(model), null, 2)}\n`, "utf8");
  console.log(`lorebook-build-ok: ${model.articles.length} articles, ${model.relationships.length} relationships, ${model.trails.length} trails, ${pages.size} HTML pages`);
  console.log(`output: ${relative(repositoryRoot, outputRoot) || outputRoot}`);
  console.log(`contract: ${siteArchitectureAssumptions().contentModule} + ${siteArchitectureAssumptions().illustrationModule}`);
  if (shouldServe) await serveDirectory(outputRoot, port);
}

try {
  await main();
} catch (error) {
  console.error(`lorebook-build-error: ${error.message}`);
  process.exitCode = 1;
}
