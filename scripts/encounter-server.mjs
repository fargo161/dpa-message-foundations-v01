#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FACE_CATALOG } from "../src/conversation/face/catalog.mjs";
import { SOURCE_MODULES } from "./encounter-static-files.mjs";

const repository = new URL("../", import.meta.url);
const STATIC = new Map([
  ["/", ["public/encounter/index.html", "text/html; charset=utf-8"]],
  ["/delivery-options.mjs", ["src/conversation/delivery-options.mjs", "text/javascript; charset=utf-8"]],
  ["/r17-rates.mjs", ["src/encounter/constants.mjs", "text/javascript; charset=utf-8"]],
  ["/build-info.js", ["dist/encounter-dev/build-info.js", "text/javascript; charset=utf-8"]],
]);
for (const file of ["app.js", "delivery-chart.js", "face-renderer.js", "turn-player.js", "playtest-log.js", "local-engine.mjs", "browser-options.mjs", "browser-node-fs.mjs", "browser-node-url.mjs"]) STATIC.set("/" + file, ["public/encounter/" + file, "text/javascript; charset=utf-8"]);
for (const file of ["style.css", "delivery-chart.css"]) STATIC.set("/" + file, ["public/encounter/" + file, "text/css; charset=utf-8"]);
for (const file of SOURCE_MODULES) STATIC.set("/" + file, [file, "text/javascript; charset=utf-8"]);

for (const asset of [FACE_CATALOG.base, ...FACE_CATALOG.assets]) {
  if (!/^\/assets\/marcus\/[a-zA-Z0-9_-]+\.webp$/.test(asset.src)) throw new Error("Unsafe catalog asset path.");
  STATIC.set(asset.src, ["public/encounter" + asset.src, "image/webp"]);
}

// Prepare a static metadata asset once, never process a game request.
function prepareBuildInfo() {
  const pkg = JSON.parse(readFileSync(new URL("package.json", repository), "utf8"));
  let commitFull = null, dirty = null;
  try {
    commitFull = execFileSync("git", ["rev-parse", "HEAD"], { cwd: fileURLToPath(repository), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    dirty = Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: fileURLToPath(repository), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim());
  } catch { /* Git is optional for dev metadata. */ }
  const build = { mode: "dev-server", packageName: pkg.name, packageVersion: pkg.version, commitFull, commitShort: commitFull?.slice(0, 7) ?? null, dirty };
  mkdirSync(new URL("dist/encounter-dev/", repository), { recursive: true });
  writeFileSync(new URL("dist/encounter-dev/build-info.js", repository), `globalThis.__MARCUS_BUILD_INFO = ${JSON.stringify(build)};\n`);
}

export function createEncounterServer() {
  prepareBuildInfo();
  const index = readFileSync(new URL("public/encounter/index.html", repository), "utf8");
  const importMap = index.match(/<script type="importmap">([\s\S]*?)<\/script>/)?.[1];
  if (!importMap) throw new Error("Missing browser import map.");
  const mapHash = createHash("sha256").update(importMap).digest("base64");
  const server = createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", `default-src 'self'; script-src 'self' 'sha256-${mapHash}'; style-src 'self'; connect-src 'none'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`);
    const entry = req.method === "GET" ? STATIC.get(req.url) : null;
    if (!entry) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Not found."); return; }
    try {
      const [file, type] = entry;
      const data = await readFile(new URL(file, repository));
      res.writeHead(200, { "Content-Type": type }); res.end(data);
    } catch { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Not found."); }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.maxHeadersCount = 40;
  return server;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const port = Number(process.env.MARCUS_PORT ?? 4175);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("MARCUS_PORT must be 1–65535.");
  const server = createEncounterServer();
  server.listen(port, "127.0.0.1", () => console.log(`Marcus encounter: http://127.0.0.1:${port}/ (PID ${process.pid}; ${fileURLToPath(import.meta.url)})`));
}
