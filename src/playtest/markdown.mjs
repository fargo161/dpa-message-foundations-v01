const text = value => String(value ?? "").replaceAll("\r", "").replace(/[<>]/g, character => character === "<" ? "&lt;" : "&gt;");
const elapsed = value => { const ms = Math.max(0, Math.floor(value)); return `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`; };
const block = value => `\n\n~~~~json\n${JSON.stringify(value, null, 2)}\n~~~~\n`;
function describe(record) {
  const d = record.data;
  if (record.type === "RUN_STARTED") return "Run started";
  if (record.type === "RUN_ENDED") return `Run ended · ${d.status}`;
  if (record.type === "UI_PANEL") return `${d.open ? "Opened" : "Closed"} “${text(d.label || d.target)}”`;
  if (record.type === "TURN_SENT") return `Turn ${d.turn ?? ""} sent · ${text(d.action)}`;
  if (record.type === "TURN_COMMITTED") return `Turn ${d.turn} · ${d.outcome} · Marcus (face: ${d.faces?.responding?.presetId ?? "none"}): “${text(d.marcusReply)}”`;
  if (record.type === "FACE_PRESENTED") return `${text(d.phase)} face · ${text(d.face?.presetId)} · ${text(d.face?.visibleCaption)}`;
  if (record.type === "UI_ACTION") return `${text(d.kind || "Picked")} “${text(d.label || d.target)}”${d.value !== undefined ? ` → ${text(d.value)}` : ""}`;
  if (record.type === "UI_DRAFT") return `Draft changed · ${text(d.target)} → ${text(d.value)} · Extra: ${text(d.extraDisplay)}`;
  if (record.type === "UI_ERROR") return `Error shown: ${text(d.message)}`;
  if (record.type === "SCREEN_OBSERVED") return `Screen observed · turn ${d.turn} · ${text(d.reason)} · Your edge: ${text(d.text?.["edge-note"]?.text)}`;
  if (record.type === "PREVIEW_SHOWN") return `Preview: “${text(d.playerLine)}”`;
  return `${record.type.replaceAll("_", " ")} · ${text(d.label || d.reason || "")}`;
}

/** @param {any} log */
export function renderLogMarkdown(log) {
  const h = log.header;
  const lines = ["# Marcus playtest run log", "", `- Run: ${text(h.runId)}`, `- Seed: ${text(h.seed)}`, `- Scenario: ${text(h.scenarioId)}`,
    `- Started (local): ${h.startedAtLocal} · offset ${h.utcOffset}`, `- Started (UTC): ${h.startedAtUTC}`,
    `- Ended (local): ${h.endedAtLocal ?? "not completed"}`, `- Ended (UTC): ${h.endedAtUTC ?? "not completed"}`, `- Status: **${h.endStatus}**`,
    `- Build: ${text(h.build.mode)} · ${text(h.build.packageName)} ${text(h.build.packageVersion)} · ${h.build.commitFull ?? "Git SHA unavailable"} · dirty: ${h.build.dirty ?? "unknown"}`,
    `- Browser: ${text(h.userAgent ?? "not received")}`, `- Viewport: ${h.viewport ? `${h.viewport.width} × ${h.viewport.height}` : "not received"}`,
    "", "## SPOILERS — private run facts", "", `- R-17 version: ${h.private.r17Version ?? "not applicable"}`, `- Marcus interest: ${h.private.marcusInterest ?? "not applicable"}`, `- Quirk: ${text(h.private.quirk ?? "not applicable")}`,
    "", "## Timeline", "", "Times are recorder append times. Delayed browser actions retain their original observed time and client order.", ""];
  for (const record of log.records) lines.push(`- [${elapsed(record.ms)}] #${record.seq} ${record.source}: ${describe(record)}${record.observedMs !== undefined ? ` (observed [${elapsed(record.observedMs)}], client #${record.clientSeq})` : ""}`);
  lines.push("", "## Full turns", "");
  for (const turn of log.turns) lines.push(`### Turn ${turn.turn} · ${turn.outcome}`, `\nYou: ${text(turn.playerLine)}\n\nMarcus: ${text(turn.marcusReply)}`, block(turn));
  lines.push("## End summary", "", log.endSummary ? block(log.endSummary) : "No final agreement. This run is incomplete or was replaced before a result.", "", "## Recorder diagnostics", block(h.diagnostics ?? []));
  return lines.join("\n") + "\n";
}
