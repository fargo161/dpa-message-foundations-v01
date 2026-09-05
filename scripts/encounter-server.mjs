#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createState } from "../src/encounter/state.mjs";
import { selectQuirk } from "../src/encounter/marcus-profile.mjs";
import { EncounterError, exactObject, projectState, transition, validateIdentity, validateSeed } from "../src/encounter/engine.mjs";

const STATIC = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
]);
const token = () => randomBytes(32).toString("hex");
const TTL = 2 * 60 * 60 * 1000;

async function readJson(req) {
  if (req.headers["content-type"]?.split(";")[0].trim() !== "application/json") throw new EncounterError("Use application/json.", 415);
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw new EncounterError("Request too large.", 413);
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new EncounterError("Invalid JSON."); }
}

export function createEncounterServer() {
  const sessions = new Map();
  const server = createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const json = (status, value) => { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(value)); };
    try {
      const path = req.url;
      if (req.method === "GET" && STATIC.has(path)) {
        const [file, type] = STATIC.get(path);
        const data = await readFile(new URL(`../public/encounter/${file}`, import.meta.url));
        res.writeHead(200, { "Content-Type": type }); res.end(data); return;
      }
      if (!["/api/state", "/api/turn", "/api/restart"].includes(path)) { json(404, { error: "Not found." }); return; }
      if ((path === "/api/state" && req.method !== "GET") || (path !== "/api/state" && req.method !== "POST")) { json(405, { error: "Method not allowed." }); return; }
      if (req.headers["sec-fetch-site"] === "cross-site") throw new EncounterError("Cross-site requests are not allowed.", 403);
      if (req.headers.origin) {
        let origin;
        try { origin = new URL(req.headers.origin); } catch { throw new EncounterError("Invalid origin.", 403); }
        if (!["http:", "https:"].includes(origin.protocol) || origin.host !== req.headers.host) throw new EncounterError("Origin mismatch.", 403);
      }
      const now = Date.now();
      for (const [id, session] of sessions) if (now - session.touched > TTL) sessions.delete(id);
      let sid = req.headers.cookie?.split(";").map(part => part.trim()).find(part => part.startsWith("marcus_session="))?.slice("marcus_session=".length);
      let session = sid && sessions.get(sid);
      if (!session && path === "/api/state") {
        if (sessions.size >= 256) throw new EncounterError("Prototype session capacity reached. Try again later.", 503);
        sid = token();
        const seed = randomBytes(6).toString("hex");
        session = { csrf: token(), state: createState(seed, randomUUID(), selectQuirk(seed)), seen: new Set(), touched: now };
        sessions.set(sid, session);
        const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
        res.setHeader("Set-Cookie", `marcus_session=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=7200${secure}`);
      }
      if (!session) throw new EncounterError("Session missing or expired; refresh the page.", 401);
      session.touched = now;
      if (path === "/api/state") { json(200, projectState(session.state, session.csrf)); return; }
      if (req.headers["x-csrf-token"] !== session.csrf) throw new EncounterError("Session token mismatch.", 403);
      const input = await readJson(req);
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new EncounterError("Expected an object.");
      if (session.seen.has(input.requestId)) throw new EncounterError("Submission already used.", 409);
      if (session.seen.size >= 512) throw new EncounterError("Session request limit reached. Open a new browser session.", 429);
      let next;
      if (path === "/api/restart") {
        exactObject(input, ["requestId", "runId", "version", "seed"]);
        validateIdentity(session.state, input);
        const seed = validateSeed(input.seed);
        next = createState(seed, randomUUID(), selectQuirk(seed));
      } else next = transition(session.state, input);
      // No asynchronous operation between validation and assignment: a turn commits atomically.
      session.state = next;
      session.seen.add(input.requestId);
      json(200, projectState(session.state, session.csrf));
    } catch (error) {
      if (!res.headersSent) json(error instanceof EncounterError ? error.status : 500, { error: error instanceof EncounterError ? error.message : "Prototype could not complete this request." });
      else res.end();
      if (!(error instanceof EncounterError)) console.error(error);
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.maxHeadersCount = 40;
  return server;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const port = Number(process.env.MARCUS_PORT ?? 4174);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("MARCUS_PORT must be 1–65535.");
  const server = createEncounterServer();
  server.listen(port, "127.0.0.1", () => console.log(`Marcus encounter: http://127.0.0.1:${port}/ (PID ${process.pid}; ${fileURLToPath(import.meta.url)})`));
}
