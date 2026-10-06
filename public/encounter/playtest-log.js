// Presentation observer only. The page engine accepts observations directly.
export function filteredDebug(snapshot) {
  const p = snapshot.play;
  return { definitions: snapshot.options.metricDefinitions, observed: { status: p.status, metrics: p.metrics, edge: p.edge,
    r17RateContext: p.r17RateContext, extraChargeRate: p.extraChargeRate, proposal: p.proposal, offer: p.counteroffer, agreement: p.agreement,
    latestVisibleTurn: p.events.at(-1) ?? null } };
}

export function createPlaytestObserver({ getContext, engine, doc = document, win = globalThis, clock = () => Date.now(), onError = () => console.warn("Playtest logging unavailable.") }) {
  const runs = new Map(), origin = `${clock().toString(36)}-${globalThis.crypto?.randomUUID?.() ?? "page"}`;
  const sizes = value => new globalThis.TextEncoder().encode(JSON.stringify(value)).length;
  let current = null, sequence = 0, busy = null, destroyed = false;
  const panels = new Map(), edits = new Map();
  function attempt(fn) { try { return fn(); } catch { onError(); return null; } }
  function record(type, data) {
    return attempt(() => {
      if (!current || destroyed) return;
      const now = clock(), item = { type, clientEventId: `${origin}-${++sequence}`, clientSeq: sequence, observedT: new Date(now).toISOString(), observedMs: Math.max(0, now - current.started), data };
      if (sizes(item) > 8192 || current.bytes + sizes(item) > 1048576) { current.lost++; onError(); return; }
      current.records.push(item); current.bytes += sizes(item);
    });
  }
  function visible(element) {
    if (!element) return false;
    for (let parent = element; parent; parent = parent.parentElement) {
      if (parent.hidden || parent.getAttribute?.("aria-hidden") === "true") return false;
      if (parent.tagName === "DIALOG" && !parent.open) return false;
      if (parent.tagName === "DETAILS" && !parent.open && !element.closest?.("summary")) return false;
    }
    return true;
  }
  function panelStates() {
    const result = [];
    for (const [index, element] of [...doc.querySelectorAll("details, dialog, #history-panel, #debug-view, #play-view, #keywords-page, #based-page")].entries()) {
      const label = element.querySelector?.("summary,h2,h3")?.textContent?.trim() || element.getAttribute?.("aria-label") || element.id || `Panel ${index + 1}`;
      const target = element.id || `${element.tagName.toLowerCase()}-${label}`;
      result.push({ target, label, open: ["DETAILS", "DIALOG"].includes(element.tagName) ? Boolean(element.open) : !element.hidden });
    }
    return result;
  }
  function scanPanels() {
    attempt(() => { for (const panel of panelStates()) { if (panels.get(panel.target) !== panel.open) { panels.set(panel.target, panel.open); record("UI_PANEL", panel); } } });
  }
  function screen(reason, extra = {}) {
    attempt(() => {
      if (!current) return;
      const context = getContext(), turn = extra.turn ?? context.snapshot?.play.version ?? 0;
      const chunks = [], ids = ["edge-note", "r17-rate", "current-offer", "extra-display", "extra-comparison", "draft-summary", "information-reason", "player-preview", "preview-state", "player-line", "npc-line", "face-caption", "encounter-status", "notice", "latest-feedback", "agreement", "outcome", "revisit", "face-review-pair", "conversation"];
      for (const id of ids) {
        const element = doc.getElementById(id); if (!element) continue;
        const value = element.textContent || "", total = Math.max(1, Math.ceil(value.length / 2200));
        for (let part = 0; part < total; part++) chunks.push({ text: { [id]: { text: value.slice(part * 2200, (part + 1) * 2200), visible: visible(element), textPart: part + 1, textParts: total } } });
      }
      const choices = [...doc.querySelectorAll("button,input,select")].filter(visible).map(element => ({ target: element.id || element.dataset.vibe || element.dataset.intensity || element.dataset.playtestAction || element.textContent.trim(), label: element.getAttribute("aria-label") || element.textContent.trim(), available: !element.disabled,
        ...(element.tagName === "INPUT" || element.tagName === "SELECT" ? { value: element.type === "checkbox" ? element.checked : element.value } : {}), selected: element.getAttribute("aria-pressed") === "true" }));
      for (let index = 0; index < choices.length; index += 12) chunks.push({ choices: choices.slice(index, index + 12) });
      chunks.push({ panels: panelStates(), activeView: visible(doc.getElementById("debug-view")) ? "debug" : "play", selection: context.selection ?? null });
      // Keep every text segment/choice within the bounded observation batch.
      let packet = {}, packets = [];
      for (const chunk of chunks) {
        const next = { ...packet, ...chunk, ...(chunk.text ? { text: { ...packet.text, ...chunk.text } } : {}) };
        if (sizes(next) > 6000 || (chunk.choices && packet.choices) || (chunk.text && Object.keys(chunk.text).some(key => packet.text?.[key]))) { packets.push(packet); packet = chunk; }
        else packet = next;
      }
      packets.push(packet);
      packets.forEach((data, index) => record("SCREEN_OBSERVED", { reason, turn, ...extra, part: index + 1, parts: packets.length, ...data }));
    });
  }
  function draft(target, value) {
    attempt(() => {
      const key = JSON.stringify([target, value]); if (edits.get(target) === key) return;
      edits.set(target, key);
      const get = id => doc.getElementById(id);
      record("UI_DRAFT", { target, value, units: get("units")?.value, cash: get("upfront")?.value, days: get("days")?.value, principal: get("repayment")?.value,
        information: get("information")?.value, extraDisplay: get("extra-display")?.textContent, comparison: get("extra-comparison")?.textContent, summary: get("draft-summary")?.textContent });
    });
  }
  async function flush() {
    if (busy) return busy.then(() => flush());
    busy = (async () => {
      for (const run of runs.values()) {
        if (run.lost && run.bytes < 1048000) {
          const now = clock(), item = { type: "RUN_METADATA", clientEventId: `${origin}-${++sequence}`, clientSeq: sequence, observedT: new Date(now).toISOString(), observedMs: Math.max(0, now - run.started), data: { lostUiObservations: run.lost } };
          run.records.push(item); run.bytes += sizes(item); run.lost = 0;
        }
        while (run.records.length) {
          const records = []; let bytes = 0;
          for (const item of run.records.slice(0, 32)) { if (bytes + sizes(item) > 30000) break; records.push(item); bytes += sizes(item); }
          if (!records.length) break;
          const body = { runId: run.runId, batchId: `${origin}-${records[0].clientSeq}`, records };
          try {
            const result = await engine.ingestLog(body); if (result.persisted === false) onError();
            run.records.splice(0, records.length); run.bytes -= bytes;
          } catch { onError(); return; }
        }
      }
    })();
    try { await busy; } finally { busy = null; }
  }
  function later(fn) { win.queueMicrotask?.(() => { attempt(fn); }); }
  function click(event) {
    const element = event.target?.closest?.("button,summary"); if (!element) return;
    const label = element.getAttribute("aria-label") || element.textContent.trim(), available = !element.disabled;
    later(() => {
      record("UI_ACTION", { kind: "Clicked", target: element.id || element.dataset.playtestAction || element.dataset.vibe || element.dataset.intensity || label, label, available,
        value: element.getAttribute("aria-pressed") ?? element.value, interactionOrigin: event.isTrusted ? "user" : "program", selection: getContext().selection ?? null });
      scanPanels(); screen("interaction");
    });
  }
  function change(event) {
    const element = event.target;
    if (!["INPUT", "SELECT"].includes(element?.tagName)) return;
    later(() => { const value = element.type === "checkbox" ? element.checked : element.value;
      if (["units", "upfront", "days", "information"].includes(element.id)) draft(element.id, value);
      else { const key = JSON.stringify(value); if (edits.get(element.id) === key) return; edits.set(element.id, key); record("UI_ACTION", { kind: "Changed", target: element.id, label: element.id, value, available: !element.disabled }); }
      screen("committed edit");
    });
  }
  function hidden() { record("PAGE_HIDDEN", {}); void flush(); }
  function resumed() { record("PAGE_RESUMED", {}); screen("resume"); }
  const timer = win.setInterval?.(() => { void flush(); }, 2000);
  const mutation = win.MutationObserver ? new win.MutationObserver(scanPanels) : null;
  attempt(() => { doc.addEventListener("click", click, true); doc.addEventListener("change", change, true); doc.addEventListener("blur", change, true);
    doc.addEventListener("toggle", scanPanels, true); doc.addEventListener("close", scanPanels, true); win.addEventListener?.("pagehide", hidden); win.addEventListener?.("pageshow", resumed);
    mutation?.observe(doc.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open", "hidden"] }); });
  async function download(format, previous = false) {
    try {
      record("UI_ACTION", { kind: "Download", target: "run-log", label: previous ? "Previous saved run log" : "Download run log", value: format });
      await flush();
      const { content, basename: name } = await engine.exportLog(format, { previous });
      const blob = new win.Blob([content], { type: format === "json" ? "application/json" : "text/markdown" });
      const url = win.URL.createObjectURL(blob), anchor = doc.createElement("a");
      anchor.href = url; anchor.download = `${name}.${format}`; anchor.hidden = true; doc.body.append(anchor); anchor.click(); anchor.remove();
      win.setTimeout?.(() => win.URL.revokeObjectURL(url), 1000);
    } catch { onError(); }
  }
  return {
    record, screen, draft, flush, download,
    bind(snapshot) {
      attempt(() => {
        const runId = snapshot.play.runId;
        if (current?.runId === runId) return;
        void flush(); panels.clear(); edits.clear();
        current = runs.get(runId) ?? { runId, started: clock(), records: [], bytes: 0, lost: 0 };
        runs.set(runId, current);
        if (runs.size > 64) runs.delete(runs.keys().next().value);
        record("RUN_METADATA", { userAgent: win.navigator?.userAgent || "unavailable", viewport: { width: win.innerWidth || 0, height: win.innerHeight || 0 }, clientStartedAtUTC: new Date(current.started).toISOString() });
        scanPanels();
      });
    },
    setupDownloads() {
      attempt(() => {
        const dialog = doc.getElementById("run-log-dialog");
        for (const id of ["download-run-log", "download-run-log-end"]) doc.getElementById(id).addEventListener("click", () => dialog.showModal());
        doc.getElementById("close-run-log").addEventListener("click", () => dialog.close());
        for (const format of ["json", "md"]) doc.getElementById(`download-log-${format}`).addEventListener("click", () => { void download(format); });
        const previous = engine.hasPreviousLog();
        doc.getElementById("previous-run-download").hidden = !previous;
        for (const format of ["json", "md"]) doc.getElementById(`download-previous-${format}`).addEventListener("click", () => { void download(format, true); });
      });
    },
    destroy() { destroyed = true; win.clearInterval?.(timer); mutation?.disconnect(); doc.removeEventListener("click", click, true); doc.removeEventListener("change", change, true); doc.removeEventListener("blur", change, true); doc.removeEventListener("toggle", scanPanels, true); doc.removeEventListener("close", scanPanels, true); win.removeEventListener?.("pagehide", hidden); win.removeEventListener?.("pageshow", resumed); },
  };
}
