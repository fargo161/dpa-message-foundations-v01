#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { EncounterError, exactObject, validateIdentity, validateSeed } from "../src/encounter/engine.mjs";
import { createConversation, resolveConversation, previewConversation, projectConversation } from "../src/conversation/runtime.mjs";
import { FACE_CATALOG } from "../src/conversation/face/catalog.mjs";
import { languageReadiness } from "../src/conversation/contracts.mjs";
import { createRunRecorder, LOG_LIMITS, buildInfo } from "../src/playtest/recorder.mjs";
import { renderLogMarkdown } from "../src/playtest/markdown.mjs";
import { createPlaytestDiskStore } from "./playtest-log-store.mjs";

const STATIC = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
  ["/delivery-chart.js", ["delivery-chart.js", "text/javascript; charset=utf-8"]],
  ["/delivery-chart.css", ["delivery-chart.css", "text/css; charset=utf-8"]],
  ["/face-renderer.js", ["face-renderer.js", "text/javascript; charset=utf-8"]],
  ["/turn-player.js", ["turn-player.js", "text/javascript; charset=utf-8"]],
  ["/playtest-log.js", ["playtest-log.js", "text/javascript; charset=utf-8"]],
]);
for (const asset of [FACE_CATALOG.base, ...FACE_CATALOG.assets]) {
  if (!/^\/assets\/marcus\/[a-zA-Z0-9_-]+\.webp$/.test(asset.src)) throw new Error("Unsafe catalog asset path.");
  STATIC.set(asset.src, [asset.src.slice(1), "image/webp"]);
}
const token = () => randomBytes(32).toString("hex");
const TTL = 2 * 60 * 60 * 1000;

async function readJson(req, limit = 16384) {
  if (req.headers["content-type"]?.split(";")[0].trim() !== "application/json") throw new EncounterError("Use application/json.", 415);
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new EncounterError("Request too large.", 413);
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new EncounterError("Invalid JSON."); }
}

/** @param {any} options */
export function createEncounterServer({ languageMode = "AUTHORING_PREVIEW", logging = false, logDirectory = fileURLToPath(new URL("../playtest-logs/", import.meta.url)), logBuild = null, logClock = null, logOffset = null, logError = code => console.warn(`Playtest logging: ${code}`) } = {}) {
  languageReadiness(languageMode);
  const executionOptions = { languageMode };
  const sessions = new Map();
  const repository = fileURLToPath(new URL("../", import.meta.url));
  let metadata = logBuild;
  if (logging && !metadata) {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    let commitFull = null, dirty = null;
    try { commitFull = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); dirty = Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()); } catch { /* Git is optional. */ }
    metadata = buildInfo({ mode: "dev-server", packageName: pkg.name, packageVersion: pkg.version, commitFull, dirty });
  }
  const disk = logging ? createPlaytestDiskStore({ directory: logDirectory, onError: (runId, code) => {
    for (const session of sessions.values()) { const recorder = session.logs?.get(runId); if (recorder) recorder.header.diagnostics.push(`Disk logging unavailable (${code}).`); }
    logError(code);
  } }) : null;
  const observe = callback => { try { callback(); } catch { logError("LOG_OBSERVATION_FAILED"); } };
  function startLog(session) {
    if (!logging) return;
    observe(() => {
      session.logs ??= new Map();
      const recorder = createRunRecorder(session.state, { build: metadata, ...(logClock ? { clock: logClock } : {}), offsetMinutes: logOffset,
        view: projectConversation(session.state, "LOG-ONLY", executionOptions), onRecord: record => disk.append(record) });
      session.logs.set(session.state.runId, recorder);
      if (session.logs.size > 64) session.logs.delete(session.logs.keys().next().value);
      disk.snapshot(recorder.assemble());
    });
  }
  const server = createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const json = (status, value) => { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(value)); };
    try {
      const path = req.url;
      if (req.method === "GET" && path === "/delivery-options.mjs") {
        const data = await readFile(new URL("../src/conversation/delivery-options.mjs", import.meta.url));
        res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" }); res.end(data); return;
      }
      if (req.method === "GET" && path === "/r17-rates.mjs") {
        const data = await readFile(new URL("../src/encounter/constants.mjs", import.meta.url));
        res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" }); res.end(data); return;
      }
      if (req.method === "GET" && STATIC.has(path)) {
        const [file, type] = STATIC.get(path);
        const data = await readFile(new URL(`../public/encounter/${file}`, import.meta.url));
        res.writeHead(200, { "Content-Type": type }); res.end(data); return;
      }
      const logRoute = ["/api/playtest-log", "/api/playtest-log.json", "/api/playtest-log.md"].includes(path);
      if (!["/api/state", "/api/turn", "/api/restart", "/api/preview"].includes(path) && !logRoute) { json(404, { error: "Not found." }); return; }
      const getRoute = path === "/api/state" || path === "/api/playtest-log.json" || path === "/api/playtest-log.md";
      if ((getRoute && req.method !== "GET") || (!getRoute && req.method !== "POST")) { json(405, { error: "Method not allowed." }); return; }
      if (req.headers["sec-fetch-site"] === "cross-site") throw new EncounterError("Cross-site requests are not allowed.", 403);
      if (req.headers.origin) {
        let origin;
        try { origin = new URL(req.headers.origin); } catch { throw new EncounterError("Invalid origin.", 403); }
        if (!["http:", "https:"].includes(origin.protocol) || origin.host !== req.headers.host) throw new EncounterError("Origin mismatch.", 403);
      }
      const now = Date.now();
      for (const [id, session] of sessions) if (now - session.touched > TTL) sessions.delete(id);
      let sid = req.headers.cookie?.split(";").map(part => part.trim()).find(part => part.startsWith("marcus_lore_session="))?.slice("marcus_lore_session=".length);
      let session = sid && sessions.get(sid);
      if (!session && path === "/api/state") {
        if (sessions.size >= 256) throw new EncounterError("Prototype session capacity reached. Try again later.", 503);
        sid = token();
        const seed = randomBytes(6).toString("hex");
        session = { csrf: token(), state: createConversation("marcus", seed, randomUUID()), seen: new Set(), touched: now };
        sessions.set(sid, session);
        startLog(session);
        const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
        res.setHeader("Set-Cookie", `marcus_lore_session=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=7200${secure}`);
      }
      if (!session) throw new EncounterError("Session missing or expired; refresh the page.", 401);
      session.touched = now;
      if (path === "/api/state") { json(200, projectConversation(session.state, session.csrf, executionOptions)); return; }
      if (logRoute && !logging) { json(404, { error: "Playtest logging disabled." }); return; }
      if (logRoute && getRoute) {
        const recorder = session.logs?.get(session.state.runId);
        if (!recorder) throw new EncounterError("Run log unavailable.", 404);
        const log = recorder.assemble(), format = path.endsWith(".md") ? "md" : "json";
        res.writeHead(200, { "Content-Type": format === "md" ? "text/markdown; charset=utf-8" : "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${log.header.fileBase}.${format}"`, "X-Playtest-Basename": log.header.fileBase });
        res.end(format === "md" ? renderLogMarkdown(log) : JSON.stringify(log, null, 2) + "\n"); return;
      }
      if (req.headers["x-csrf-token"] !== session.csrf) throw new EncounterError("Session token mismatch.", 403);
      const input = await readJson(req, logRoute ? LOG_LIMITS.request : 16384);
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new EncounterError("Expected an object.");
      if (logRoute) {
        const recorder = session.logs?.get(input.runId);
        if (!recorder) throw new EncounterError("Unknown log run.", 404);
        let accepted;
        try { accepted = recorder.ingest(input); } catch (error) { throw new EncounterError(error.message, /large|limit/.test(error.message) ? 413 : 400); }
        disk.snapshot(recorder.assemble()); await disk.flush(input.runId);
        json(200, { accepted, persisted: !disk.failed(input.runId) }); return;
      }
      if (session.seen.has(input.requestId)) throw new EncounterError("Submission already used.", 409);
      if (session.seen.size >= 512) throw new EncounterError("Session request limit reached. Open a new browser session.", 429);
      if (path === "/api/preview") {
        json(200, previewConversation(session.state, input, executionOptions)); return;
      }
      let next;
      if (path === "/api/restart") {
        exactObject(input, ["requestId", "runId", "version", "seed", ...(Object.hasOwn(input, "scenarioId") ? ["scenarioId"] : [])]);
        validateIdentity(session.state, input);
        const seed = validateSeed(input.seed);
        next = createConversation(input.scenarioId ?? "marcus", seed, randomUUID());
      } else next = resolveConversation(session.state, input, executionOptions);
      // No asynchronous operation between validation and assignment: a turn commits atomically.
      const prior = session.state;
      session.state = next;
      session.seen.add(input.requestId);
      if (logging) observe(() => {
        const recorder = session.logs?.get(prior.runId);
        if (path === "/api/restart") { recorder?.end("REPLACED"); if (recorder) disk.snapshot(recorder.assemble()); startLog(session); }
        else if (recorder) { recorder.turn(prior, next, input, projectConversation(next, "LOG-ONLY", executionOptions)); disk.snapshot(recorder.assemble()); }
      });
      json(200, projectConversation(session.state, session.csrf, executionOptions));
    } catch (error) {
      if (!res.headersSent) json(error instanceof EncounterError ? error.status : 500, { error: error instanceof EncounterError ? error.message : "Prototype could not complete this request." });
      else res.end();
      if (!(error instanceof EncounterError)) console.error(error);
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.maxHeadersCount = 40;
  server.on("close", () => { void disk?.flush(); });
  return server;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const port = Number(process.env.MARCUS_PORT ?? 4175);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("MARCUS_PORT must be 1–65535.");
  const server = createEncounterServer({ logging: true });
  server.listen(port, "127.0.0.1", () => console.log(`Marcus encounter: http://127.0.0.1:${port}/ (PID ${process.pid}; ${fileURLToPath(import.meta.url)})`));
}
