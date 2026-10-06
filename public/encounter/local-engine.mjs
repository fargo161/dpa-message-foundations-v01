import { EncounterError, exactObject, validateIdentity, validateSeed } from "../../src/encounter/engine.mjs";
import { createConversation, resolveConversation, previewConversation, projectConversation } from "../../src/conversation/runtime.mjs";
import { createRunRecorder, LOG_SCHEMA } from "../../src/playtest/recorder.mjs";
import { renderLogMarkdown } from "../../src/playtest/markdown.mjs";

export const PLAYTEST_STORAGE_KEY = "marcus-playtest-current@0.1";
export const PLAYTEST_STORAGE_LIMIT = 2097152;
const execution = Object.freeze({ languageMode: "AUTHORING_PREVIEW" });

/** Page-owned encounter. Inject storage, build, assetSource, generateSeed,
 * generateId, clock, offsetMinutes and onWarning for another environment.
 * Commands are synchronous: validation and assignment cannot interleave.
 * Snapshots and logs are copies; callers never own the live state.
 * @param {any} options */
export function createLocalEngine(options = {}) {
  const clock = options.clock ?? (() => Date.now());
  let serial = 0;
  const generateId = options.generateId ?? (() => globalThis.crypto?.randomUUID?.() ?? `${clock().toString(36)}-${++serial}`);
  const generateSeed = options.generateSeed ?? (() => `local-${clock().toString(36)}-${++serial}`);
  const assetSource = options.assetSource ?? (src => src);
  const storage = options.storage ?? null;
  const logs = new Map(), seen = new Set();
  let state = null, recorder = null, previous = null;
  function warn(code) { try { (options.onWarning ?? (message => console.warn(message)))(code); } catch { /* Observers cannot stop gameplay. */ } }
  function observe(fn) { try { return fn(); } catch { warn("Playtest observation unavailable."); return null; } }
  try {
    const text = storage?.getItem(PLAYTEST_STORAGE_KEY);
    if (text && text.length <= PLAYTEST_STORAGE_LIMIT) {
      const saved = JSON.parse(text);
      if (saved?.schemaVersion === LOG_SCHEMA) previous = saved;
    }
  } catch { warn("Playtest storage unavailable."); }
  function save() {
    try {
      if (!recorder) return false;
      const text = JSON.stringify(recorder.assemble());
      if (text.length > PLAYTEST_STORAGE_LIMIT) { warn("Playtest storage limit reached."); return false; }
      storage?.setItem(PLAYTEST_STORAGE_KEY, text);
      return true;
    } catch { warn("Playtest storage unavailable."); return false; }
  }
  function startLog() {
    recorder = null;
    observe(() => {
      recorder = createRunRecorder(state, { build: options.build, clock, offsetMinutes: options.offsetMinutes,
        view: projectConversation(state, "LOG-ONLY", execution) });
      logs.set(state.runId, recorder);
      if (logs.size > 64) logs.delete(logs.keys().next().value);
      recorder.setSink(save);
      save();
    });
  }
  function ensureState() {
    if (state) return;
    state = createConversation(options.scenarioId ?? "marcus", options.seed ?? generateSeed(), generateId());
    startLog();
  }
  function getState() {
    ensureState();
    const snapshot = structuredClone(projectConversation(state, "LOCAL-OFFLINE", execution));
    delete snapshot.csrf;
    const catalog = snapshot.options.faceCatalog;
    if (catalog) for (const asset of [catalog.base, ...catalog.assets]) asset.src = assetSource(asset.src);
    return snapshot;
  }
  function checkSubmission(input) {
    ensureState();
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new EncounterError("Expected an object.");
    if (seen.has(input.requestId)) throw new EncounterError("Submission already used.", 409);
  }
  function preview(input) {
    checkSubmission(input);
    return previewConversation(state, input, execution);
  }
  function sendTurn(input) {
    checkSubmission(input);
    const next = resolveConversation(state, input, execution);
    const prior = state;
    state = next;
    seen.add(input.requestId);
    observe(() => recorder?.turn(prior, next, input, projectConversation(next, "LOG-ONLY", execution)));
    save();
    return getState();
  }
  /** Restart takes the same identity/version/seed/scenario command as a turn. */
  function restart(input) {
    checkSubmission(input);
    exactObject(input, ["requestId", "runId", "version", "seed", ...(Object.hasOwn(input, "scenarioId") ? ["scenarioId"] : [])]);
    validateIdentity(state, input);
    const seed = validateSeed(input.seed);
    const next = createConversation(input.scenarioId ?? "marcus", seed, generateId());
    state = next;
    seen.add(input.requestId);
    observe(() => recorder?.end("REPLACED"));
    save();
    startLog();
    return getState();
  }
  /** Accept bounded UI observations for a retained run; never gameplay authority. */
  function ingestLog(input) {
    ensureState();
    const log = logs.get(input?.runId);
    if (!log) throw new EncounterError("Unknown log run.", 404);
    let accepted;
    try { accepted = log.ingest(input); }
    catch (error) { throw new EncounterError(error.message, /large|limit/.test(error.message) ? 413 : 400); }
    return { accepted, persisted: save() };
  }
  /** Download JSON or Markdown, filename stem included. `previous` is the saved
   * run from the prior page load; `runId` selects a retained run in this page. */
  function exportLog(format = "json", { previous: saved = false, runId = null } = {}) {
    ensureState();
    if (!["json", "md"].includes(format)) throw new EncounterError("Unknown log format.");
    const log = saved ? previous : (runId ? logs.get(runId) : recorder)?.assemble();
    if (!log) throw new EncounterError("Run log unavailable.", 404);
    const copy = structuredClone(log);
    return { log: copy, basename: copy.header.fileBase,
      content: format === "md" ? renderLogMarkdown(copy) : JSON.stringify(copy, null, 2) + "\n" };
  }
  return Object.freeze({ getState, preview, sendTurn, restart, ingestLog, exportLog,
    hasPreviousLog: () => Boolean(previous), createRequestId: generateId });
}
