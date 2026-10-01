import { projectPlayerInformation, projectMarcusInformation } from "../encounter/marcus-world-adapter.mjs";
import { r17StandardExtra } from "../encounter/constants.mjs";
import { buildNpcFrame } from "../conversation/language/npc-lines.mjs";

export const LOG_SCHEMA = "marcus-playtest-log@0.1";
export const LOG_LIMITS = Object.freeze({ uiRecord: 8192, batch: 32768, request: 49152, recordsPerBatch: 32, engineRecord: 131072, stream: 16777216, assembled: 33554432 });
export const UI_TYPES = Object.freeze(["RUN_METADATA", "UI_ACTION", "UI_PANEL", "UI_DRAFT", "PREVIEW_REQUESTED", "PREVIEW_SHOWN", "TURN_SENT", "FACE_PRESENTED", "SCREEN_OBSERVED", "UI_ERROR", "PAGE_HIDDEN", "PAGE_RESUMED"]);
const bytes = value => new globalThis.TextEncoder().encode(JSON.stringify(value)).length;
const copy = value => JSON.parse(JSON.stringify(value));

/** Omit machine paths throughout logs, including seeds, error text and UI labels. */
export function portableValue(value) {
  if (typeof value === "string") return value.replace(/file:\/\/[^\s"'<>]+/gi, "[local-path omitted]").replace(/\b[A-Za-z]:[\\/][^\s"'<>]+/g, "[local-path omitted]").replace(/\/(?:Users|home|tmp|private|var|mnt|root|workspace|Volumes|etc|opt|srv|proc|sys|dev)\/[^\s"'<>]+/g, "[local-path omitted]");
  if (Array.isArray(value)) return value.map(portableValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [portableValue(key), portableValue(item)]));
  return value;
}

/** Local wall time at the observation's offset; injectable for deterministic tests. */
export function localTime(epoch, offsetMinutes = null) {
  const offset = offsetMinutes ?? -new Date(epoch).getTimezoneOffset();
  const shifted = new Date(epoch + offset * 60000).toISOString();
  const sign = offset < 0 ? "-" : "+", absolute = Math.abs(offset);
  const numeric = `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}${String(absolute % 60).padStart(2, "0")}`;
  return { utc: new Date(epoch).toISOString(), local: `${shifted.slice(0, -1)}${numeric.slice(0, 3)}:${numeric.slice(3)}`, offset: numeric,
    filenameTime: `${shifted.slice(0, 19).replace("T", "_").replaceAll(":", "-")}${numeric}` };
}

export function logBasename(epoch, seed, runId, offsetMinutes = null) {
  const slug = text => String(text).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 80) || "run";
  return `${localTime(epoch, offsetMinutes).filenameTime}_${slug(seed)}_${slug(runId)}`;
}

/** Allowlisted build fields; never a repository location. @param {any} build */
export function buildInfo(build = {}) {
  const full = typeof build.commitFull === "string" && /^[a-f0-9]{40}$/.test(build.commitFull) ? build.commitFull : null;
  return portableValue({ mode: build.mode ?? "dev-server", packageName: build.packageName ?? "dpa-message-foundations", packageVersion: build.packageVersion ?? "0.1.0", commitFull: full, commitShort: full?.slice(0, 7) ?? null, dirty: build.dirty ?? null });
}

/** @param {any} view */
export function screenModel(view) {
  const p = view.play;
  return copy(portableValue({ edge: p.edge ?? null, extraChargeRate: p.extraChargeRate ?? null, proposal: p.proposal ?? null, onTheTable: p.counteroffer ?? null,
    offerComparison: p.counteroffer?.extraChargeRate !== 16 && p.counteroffer?.terms ? `Standard charge without R-17: $${r17StandardExtra(p.counteroffer.terms.repayment)} · 16%` : null,
    status: p.status, statusLine: ({ OPEN: "Conversation open", AGREED: "Agreement reached", WITHDRAWN: "You walked away", ENDED: "Conversation ended" })[p.status] ?? p.status }));
}

/** @param {any} state @param {any} view */
export function endSummary(state, view) {
  const terms = state.agreement?.terms ?? null;
  const difference = terms ? r17StandardExtra(terms.repayment) - terms.extra : null;
  return copy(portableValue({ status: state.status, terms, cashRetained: state.metrics?.cash ?? null, stock: state.metrics?.playerStock ?? null,
    newRepayment: terms ? terms.repayment + terms.extra : null, totalOwed: state.metrics?.debt ?? null,
    standardExtra: terms ? r17StandardExtra(terms.repayment) : null, difference,
    savingsLine: difference > 0 ? `R-17 saved you $${difference} on the extra charge.` : difference < 0 ? `Your R-17 play cost you $${-difference} on the extra charge.` : null,
    relationalConsequences: view.play.conversation?.outcomeQuality?.relationalConsequences ?? [] }));
}

/** Validate an entire batch before accepting observations. @param {any} input */
export function validateUiBatch(input) {
  const shape = (object, keys) => object && typeof object === "object" && !Array.isArray(object) && Object.keys(object).length === keys.length && keys.every(key => Object.hasOwn(object, key));
  if (!shape(input, ["runId", "batchId", "records"]) || typeof input.runId !== "string" || input.runId.length > 200 || typeof input.batchId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(input.batchId)) throw new Error("Invalid log batch identity.");
  if (!Array.isArray(input.records) || input.records.length > LOG_LIMITS.recordsPerBatch || bytes(input) > LOG_LIMITS.batch) throw new Error("Log batch too large.");
  for (const record of input.records) {
    if (!shape(record, ["type", "clientEventId", "clientSeq", "observedT", "observedMs", "data"]) || !UI_TYPES.includes(record.type)) throw new Error("Only UI observations are accepted.");
    if (typeof record.clientEventId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(record.clientEventId) || !Number.isSafeInteger(record.clientSeq) || record.clientSeq < 1 || !Number.isFinite(record.observedMs) || record.observedMs < 0) throw new Error("Invalid UI observation order.");
    if (typeof record.observedT !== "string" || !Number.isFinite(Date.parse(record.observedT)) || new Date(record.observedT).toISOString() !== record.observedT) throw new Error("Invalid UI observation timestamp.");
    if (!record.data || typeof record.data !== "object" || Array.isArray(record.data) || bytes(record) > LOG_LIMITS.uiRecord) throw new Error("Invalid or oversized UI observation.");
    if (["source", "private", "engine", "endStatus", "header", "filename", "path"].some(key => Object.hasOwn(record.data, key))) throw new Error("Reserved log field.");
    if (record.type === "RUN_METADATA" && ((record.data.userAgent !== undefined && (typeof record.data.userAgent !== "string" || record.data.userAgent.length > 1024)) || (record.data.viewport !== undefined && (![record.data.viewport.width, record.data.viewport.height].every(value => Number.isSafeInteger(value) && value >= 0 && value <= 50000))))) throw new Error("Invalid browser metadata.");
  }
  return input;
}

/** Observer with no reference used by game resolution. @param {any} state @param {any} options */
export function createRunRecorder(state, options = {}) {
  const clock = options.clock ?? (() => Date.now()), offset = options.offsetMinutes ?? null;
  const start = clock(), time = localTime(start, offset), records = [], seen = new Set();
  let lastMs = 0, streamBytes = 0, sink = options.onRecord ?? (() => {});
  const marcus = (state.scenarioId ?? "marcus") === "marcus";
  const player = marcus ? projectPlayerInformation(state) : null, npc = marcus ? projectMarcusInformation(state) : null;
  /** @type {any} */
  const header = portableValue({ runId: state.runId, seed: state.seed, scenarioId: state.scenarioId ?? "marcus", quirk: state.quirk ?? null,
    startedAtUTC: time.utc, startedAtLocal: time.local, utcOffset: time.offset, endedAtUTC: null, endedAtLocal: null, endStatus: "incomplete",
    fileBase: logBasename(start, state.seed, state.runId, offset), build: buildInfo(options.build), userAgent: null, viewport: null,
    private: { r17Version: player ? player.privateFactId === "POSITIVE_ROUTE" ? "GOOD" : "BAD" : null, marcusInterest: npc ? npc.caresAboutR17 ? "cares" : "doesn't care" : null, quirk: state.quirk ?? null }, diagnostics: [] });
  function append(type, source, data, observation = null) {
    const now = clock(); lastMs = Math.max(lastMs, now - start, 0);
    const record = portableValue({ type, source, runId: state.runId, t: new Date(now).toISOString(), ms: lastMs, seq: records.length + 1,
      ...(observation ? { clientEventId: observation.clientEventId, clientSeq: observation.clientSeq, observedT: observation.observedT, observedMs: observation.observedMs } : {}), data });
    const length = bytes(record) + 1;
    if (length > (source === "ui" ? LOG_LIMITS.uiRecord : LOG_LIMITS.engineRecord) || streamBytes + length > LOG_LIMITS.stream) { header.diagnostics.push("Recorder limit reached; observations may be incomplete."); throw new Error("Log record or run limit reached."); }
    streamBytes += length; records.push(copy(record));
    try { sink(copy(record)); } catch { header.diagnostics.push("Persistence unavailable."); }
    return copy(record);
  }
  append("RUN_STARTED", "engine", { header: copy(header), initialMetrics: state.metrics, openingFace: options.view?.play.face ?? null, screenState: options.view ? screenModel(options.view) : null });
  return {
    header,
    setSink(next) { sink = next; },
    ingest(input) {
      validateUiBatch(input);
      if (input.runId !== state.runId) throw new Error("Unknown log run.");
      let accepted = 0;
      for (const item of input.records) {
        if (seen.has(item.clientEventId)) continue;
        const record = append(item.type, "ui", item.data, { ...item, observedMs: Math.max(0, Date.parse(item.observedT) - start) });
        seen.add(item.clientEventId); accepted++;
        if (item.type === "RUN_METADATA") {
          if (typeof record.data.userAgent === "string") header.userAgent = record.data.userAgent.slice(0, 1024);
          if (record.data.viewport && Number.isFinite(record.data.viewport.width) && Number.isFinite(record.data.viewport.height)) header.viewport = record.data.viewport;
        }
      }
      return accepted;
    },
    /** @param {any} before @param {any} after @param {any} submitted @param {any} view */
    turn(before, after, submitted, view) {
      const event = after.events.at(-1);
      if (!event || after.events.length !== before.events.length + 1) throw new Error("Expected one committed transition.");
      const used = event.intent ?? submitted;
      const relevant = used.action === "ACCEPT" ? after.agreement : used.action === "DEAL" ? after.counteroffer : used.topic === "CLARIFY_OFFER" ? after.counteroffer : null;
      const terms = used.action === "DEAL" ? used.terms : relevant?.terms ?? null;
      const rate = used.action === "DEAL" ? event.derived?.extraChargeRate ?? after.counteroffer?.extraChargeRate : relevant?.extraChargeRate ?? null;
      const family = marcus ? buildNpcFrame(before, used, { ...event, counterTerms: after.counteroffer?.terms }).family : null;
      const record = append("TURN_COMMITTED", "engine", { turn: after.events.length, requestId: submitted.requestId, action: used.action, topic: used.topic ?? null,
        keywordId: used.keywordId ?? null, contextActionId: used.contextActionId ?? null, vibe: used.vibeId, intensity: used.intensity, information: used.information ?? "NONE",
        submittedTerms: submitted.terms ?? null, normalizedTerms: terms, playerLine: event.playerText, marcusReply: event.marcusText, outcome: event.outcome,
        proposal: used.action === "DEAL" ? after.proposal : null, offer: after.counteroffer ?? null, agreement: after.agreement ?? null,
        resolvedR17Rate: view.play.extraChargeRate ?? null, charge: terms ? { rate: rate ?? null, extra: terms.extra, standardExtra: r17StandardExtra(terms.repayment), difference: r17StandardExtra(terms.repayment) - terms.extra } : null,
        informationEffect: event.informationCauses ?? [], reactionFamily: family, r17Reaction: event.reactionCause?.consequences?.r17Reaction ?? null,
        metricsBefore: event.before ?? before.metrics, metricsAfter: event.after ?? after.metrics, feedback: event.feedback ?? null, reasons: event.reasons ?? [],
        faces: event.faces ?? null, event: copy(event), screenState: screenModel(view) });
      if (after.status !== "OPEN") this.end(after.status, endSummary(after, view));
      return record;
    },
    end(status, summary = null) {
      if (header.endStatus !== "incomplete") return;
      if (!["AGREED", "WITHDRAWN", "ENDED", "REPLACED"].includes(status)) throw new Error("Invalid run end status.");
      const ending = localTime(clock(), offset);
      header.endStatus = status; header.endedAtUTC = ending.utc; header.endedAtLocal = ending.local;
      append("RUN_ENDED", "engine", { status, endedAtUTC: ending.utc, endedAtLocal: ending.local, summary });
    },
    assemble() { return assembleRecords(records, header); },
  };
}

/** Assemble live or recovered records. @param {any[]} records @param {any} currentHeader */
export function assembleRecords(records, currentHeader = null) {
  const header = copy(currentHeader ?? records.find(record => record.type === "RUN_STARTED")?.data.header);
  const turns = records.filter(record => record.type === "TURN_COMMITTED").map(record => ({ ...copy(record.data), recordSeq: record.seq,
    screenObservations: records.filter(item => item.type === "SCREEN_OBSERVED" && item.data.turn === record.data.turn).map(item => ({ authority: "ui-observation", recordSeq: item.seq, ...copy(item.data) })) }));
  for (const record of records) {
    if (record.type === "RUN_METADATA") { header.userAgent = record.data.userAgent ?? header.userAgent; header.viewport = record.data.viewport ?? header.viewport;
      if (record.data.lostUiObservations > 0) header.diagnostics.push(`${record.data.lostUiObservations} UI observations omitted by the browser queue limit.`);
    }
    if (record.type === "RUN_ENDED") { header.endStatus = record.data.status; header.endedAtUTC = record.data.endedAtUTC; header.endedAtLocal = record.data.endedAtLocal; }
  }
  const last = records.filter(record => record.type === "RUN_ENDED").at(-1);
  return copy(portableValue({ schemaVersion: LOG_SCHEMA, header, records, turns, endSummary: last?.data.summary ?? null }));
}
