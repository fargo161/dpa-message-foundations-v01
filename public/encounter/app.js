import { createDeliveryChart } from "/delivery-chart.js";
import { createFaceRenderer } from "/face-renderer.js";
import { createTurnPlayer } from "/turn-player.js";

const $ = id => document.getElementById(id);
const node = (tag, text) => { const element = document.createElement(tag); if (text !== undefined) element.textContent = String(text); return element; };
const termKeys = ["units", "upfront", "repayment", "extra", "days"];
const names = { cash: "Cash", debt: "Outstanding debt", marcusStock: "Their Contra", playerStock: "Your Contra", units: "Contra units", upfront: "Cash now", repayment: "New principal", extra: "Additional repayment", days: "Repay within (days)" };
let snapshot = null, busy = false, synchronized = false, view = "play", delivery = null;
let keywordId = null, actionId = null, preview = null, previewSequence = 0, previewTimer = null;
let pendingSnapshot = null;
const faceRenderer = createFaceRenderer($("portrait"));
const character = () => snapshot?.play.character || { id: "marcus", name: "Marcus" };
const keywords = () => snapshot?.options.keywords || [];
const selectedKeyword = () => keywords().find(entry => entry.id === keywordId);
const selectedAction = () => selectedKeyword()?.actions.find(entry => entry.id === actionId);
const offer = () => snapshot?.play.counteroffer;
const commercial = () => snapshot?.play.scenario?.kind !== "CONVERSATION" && snapshot?.options.price != null;
const available = action => snapshot?.play.availableActions?.find(entry => entry.action === action)?.available === true;
function notice(text, error = false) { $("notice").textContent = text; $("notice").classList.toggle("error", error); }
function publicDetails(value) {
  const box = node("div");
  if (value == null) return box;
  if (Array.isArray(value)) value.forEach(entry => box.append(publicDetails(entry)));
  else if (typeof value === "object") Object.entries(value).forEach(([key, entry]) => { const part = node("div"); part.append(node("strong", `${key.replace(/([a-z])([A-Z])/g, "$1 $2")}: `), publicDetails(entry)); box.append(part); });
  else box.append(node("p", value));
  return box;
}
function termTable(terms) {
  const table = node("table"), body = node("tbody");
  termKeys.forEach(key => { const row = node("tr"), header = node("th", names[key]); header.scope = "row"; row.append(header, node("td", terms[key])); body.append(row); });
  table.append(body); return table;
}
function renderFace(face, phase) {
  faceRenderer.render(snapshot.options.faceCatalog, face, character());
  $("face-caption").textContent = face?.visibleCaption || "";
  $("receiving-phase").classList.toggle("active", phase === "receiving");
  $("responding-phase").classList.toggle("active", phase === "responding");
}
const turnPlayer = createTurnPlayer({
  onReceiving(event) {
    $("player-line").hidden = false; $("player-line").textContent = `You: ${event.playerText}`;
    $("npc-line").textContent = "…";
    renderFace(event.faces?.receiving || snapshot.play.face, "receiving");
    $("skip").hidden = false; notice(`${character().name} hears you.`);
  },
  onResponding(event) {
    if (pendingSnapshot) { applySnapshot(pendingSnapshot); pendingSnapshot = null; }
    renderFace(event.faces?.responding || snapshot.play.face, "responding");
  },
  onFinish() { $("skip").hidden = true; },
});

function setUnavailable(id, condition) { $(id).dataset.unavailable = String(condition); }
function refreshControls() {
  const ready = Boolean(snapshot) && synchronized && !busy;
  const open = ready && snapshot.play.status === "OPEN";
  $("turn-fields").disabled = !open; $("menu-fields").disabled = !open;
  setUnavailable("more", !open); setUnavailable("walk", !available("WALK"));
  setUnavailable("accept", !offer() || !available("ACCEPT"));
  setUnavailable("clarify", !findAction(intent => intent.action === "ASK" && intent.topic === "CLARIFY_OFFER"));
  setUnavailable("propose", !findAction(intent => intent.action === "DEAL"));
  document.querySelectorAll("[data-interact]").forEach(element => { element.disabled = !ready || element.dataset.unavailable === "true"; });
  $("seed").disabled = !ready; $("scenario").disabled = !ready; $("reload").disabled = busy;
  const isDeal = selectedAction()?.intent.action === "DEAL";
  termKeys.forEach(key => { $(key).disabled = !open || !commercial(); $(key).required = isDeal; });
  $("information").disabled = !open || !commercial();
  $("send").disabled = !open || !preview || preview.key !== draftKey();
  $("send").textContent = busy ? "Working…" : selectedAction()?.intent.action === "ACCEPT" ? "Confirm exact terms →" : selectedAction()?.intent.action === "WALK" ? "Walk away →" : "Say it →";
}
function findAction(predicate) {
  for (const keyword of keywords()) { const action = keyword.actions.find(entry => entry.available && predicate(entry.intent)); if (action) return { keyword, action }; }
  return null;
}
function chooseFound(found) { if (found) chooseAction(found.keyword.id, found.action.id); }
function chooseAction(subject, action) {
  if (busy || !synchronized) return;
  keywordId = subject; actionId = action;
  const chosen = selectedAction();
  if (chosen?.intent.action === "DEAL") $("information").value = chosen.intent.information || "NONE";
  renderKeywords(); updateDraft(); schedulePreview();
}
function actionButton(keyword, action, full) {
  const button = node("button", action.label); button.type = "button";
  button.disabled = !action.available; button.setAttribute("aria-pressed", String(keyword.id === keywordId && action.id === actionId));
  button.title = action.reason || action.description;
  if (full) button.append(node("small", action.available ? action.description : action.reason));
  button.addEventListener("click", () => chooseAction(keyword.id, action.id)); return button;
}
function renderKeywords() {
  const bank = $("keyword-bank"); bank.replaceChildren();
  keywords().forEach(keyword => {
    const button = node("button", keyword.label); button.type = "button"; button.append(node("small", keyword.kind));
    button.setAttribute("aria-pressed", String(keyword.id === keywordId));
    button.addEventListener("click", () => { if (busy) return; keywordId = keyword.id; actionId = keyword.actions.find(action => action.available)?.id || null; const intent = selectedAction()?.intent; if (intent?.action === "DEAL") $("information").value = intent.information || "NONE"; renderKeywords(); updateDraft(); schedulePreview(); }); bank.append(button);
  });
  const keyword = selectedKeyword(), actions = keyword?.actions || [];
  $("keyword-title").textContent = keyword?.label || "No known subjects"; $("keyword-summary").textContent = keyword?.summary || "";
  $("subject-label").textContent = keyword ? `// ${keyword.label}` : "";
  $("keyword-actions").replaceChildren(...actions.map(action => actionButton(keyword, action, true)));
  const suggestions = actions.filter(action => action.available).slice(0, 3);
  // Keep a chosen fourth-or-later authored action visible when the menu closes.
  const chosen = selectedAction(); if (chosen?.available && !suggestions.includes(chosen)) suggestions.splice(2, 1, chosen);
  $("context-actions").replaceChildren(...suggestions.map(action => actionButton(keyword, action, false)));
  $("action-description").textContent = chosen?.description || "Open More things to say to choose a subject.";
  $("edge-note").replaceChildren(node("strong", keyword?.label || "Your knowledge"), node("p", keyword?.summary || "Known subjects are available in your keyword bank."));
  $("draft-warning").textContent = chosen?.intent.action === "ACCEPT" ? "This confirms the exact offer shown above, including any attached information. Acceptance ends the encounter." : chosen?.description || "";
  refreshControls();
}
function fillOptions() {
  const options = snapshot.options;
  if (!delivery) delivery = createDeliveryChart($("delivery-main"), { vibes: options.vibes, intensities: options.intensities, chartContainer: $("based-chart-menu"), onChange: () => schedulePreview() });
  const previousInformation = $("information").value;
  $("information").replaceChildren(...(options.informationOptions || []).map(entry => { const option = node("option", entry.label); option.value = entry.id; option.disabled = entry.available === false; return option; }));
  if ([...$("information").options].some(entry => entry.value === previousInformation && !entry.disabled)) $("information").value = previousInformation;
  else $("information").value = [...$("information").options].find(entry => !entry.disabled)?.value || "";
  $("scenario").replaceChildren(...(options.scenarios || [{ id: snapshot.play.scenario?.id || "marcus", label: "Marcus encounter" }]).map(entry => { const option = node("option", entry.label); option.value = entry.id; return option; }));
  $("scenario").value = snapshot.play.scenario?.id || $("scenario").options[0]?.value;
  if (!selectedKeyword()) { keywordId = keywords()[0]?.id || null; actionId = null; }
  if (!selectedAction()?.available) actionId = selectedKeyword()?.actions.find(entry => entry.available)?.id || null;
}
function draftTerms() { return Object.fromEntries(termKeys.map(key => [key, $(key).value === "" ? NaN : Number($(key).value)])); }
function updateDraft() {
  if (!snapshot) return;
  const terms = draftTerms(), expected = terms.units * snapshot.options.price - terms.upfront;
  const isDeal = selectedAction()?.intent.action === "DEAL";
  $("repayment").setCustomValidity(isDeal && terms.repayment !== expected ? `Principal must be ${expected}: units × price minus cash now.` : "");
  $("draft-summary").textContent = Number.isFinite(expected) ? `Required principal: ${expected}. New repayment: ${terms.repayment + terms.extra}. Existing debt stays separate.` : "Enter whole-number terms.";
  const information = snapshot.options.informationOptions?.find(entry => entry.id === $("information").value);
  $("information-reason").textContent = information?.reason || "";
  refreshControls();
}
function intentFields() {
  const selected = selectedAction();
  if (!selected?.available) return null;
  const fields = { ...selected.intent, ...delivery.getSelection(), keywordId, contextActionId: actionId };
  if (fields.action === "DEAL") { fields.terms = draftTerms(); fields.information = selected.intent.information || "NONE"; }
  if (fields.action === "ACCEPT") { if (!offer()) return null; fields.offerId = offer().id; fields.offerVersion = offer().version; }
  return fields;
}
function draftKey() { return snapshot ? JSON.stringify({ runId: snapshot.play.runId, version: snapshot.play.version, fields: intentFields() }) : ""; }
function invalidatePreview() { previewSequence += 1; preview = null; globalThis.clearTimeout(previewTimer); }
function schedulePreview() {
  invalidatePreview(); refreshControls();
  if (busy || !snapshot || !synchronized) return;
  if (snapshot.play.status !== "OPEN") { $("preview-state").textContent = "Conversation complete"; $("player-preview").textContent = "Review your conversation or start a new encounter."; return; }
  $("preview-state").textContent = "Preparing your line…"; $("player-preview").textContent = "…";
  const sequence = previewSequence;
  previewTimer = globalThis.setTimeout(() => { void requestPreview(sequence); }, 180);
}
async function post(path, body) {
  const response = await fetch(path, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": snapshot.csrf }, body: JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`); return data;
}
async function requestPreview(sequence) {
  const fields = intentFields(); if (!fields || busy || sequence !== previewSequence) return;
  const key = draftKey(); const body = { requestId: crypto.randomUUID(), runId: snapshot.play.runId, version: snapshot.play.version, ...fields };
  try {
    const data = await post("/api/preview", body);
    if (sequence !== previewSequence || busy || key !== draftKey() || data.runId !== snapshot.play.runId || data.version !== snapshot.play.version) return;
    preview = { key, body, text: data.playerText };
    $("player-preview").textContent = data.playerText; $("preview-state").textContent = "Ready · review, then send";
  } catch (error) {
    if (sequence !== previewSequence || key !== draftKey()) return;
    preview = null; $("player-preview").textContent = error.message; $("preview-state").textContent = "Draft needs attention";
  }
  refreshControls();
}
function renderOffer() {
  const box = $("current-offer"), current = offer(); box.replaceChildren();
  if (!current) { box.append(node("p", "No offer is open. Build your terms or ask what would make an agreement possible.")); return; }
  box.append(node("p", current.source === "APPROVED_PROPOSAL" ? `${character().name} approved your proposal. It still needs your confirmation.` : `${character().name} offers these terms.`), termTable(current.terms));
  box.append(node("p", `Confirmation transfers ${current.terms.upfront} cash and ${current.terms.units} Contra, adding ${current.terms.repayment} principal and ${current.terms.extra} additional repayment due within ${current.terms.days} days. Existing debt remains owed.`));
  if (current.informationExchange) box.append(node("p", `On acceptance: ${current.informationExchange.summary}`));
  $("accept-reason").textContent = "Clarification preserves this offer unless the conversation ends. Other discussion or a new proposal replaces it.";
}
function renderPlay() {
  const play = snapshot.play, who = character(), latest = play.events.at(-1);
  $("speaker-name").textContent = who.name; $("portrait-name").textContent = who.name.toUpperCase();
  $("scenario-name").textContent = play.scenario?.label || "READ THE DEAL";
  $("language-readiness").textContent = snapshot.options.languageReadiness?.mode === "AUTHORING_PREVIEW" ? "AUTHORING PREVIEW · LANGUAGE IN REVIEW" : "Existing authored wording";
  const statuses = { OPEN: "Conversation open", AGREED: "Agreement reached", WITHDRAWN: "You walked away", ENDED: "Conversation ended" };
  $("encounter-status").textContent = statuses[play.status] || play.status;
  $("npc-line").textContent = latest?.marcusText || `${who.name} waits for your opening words.`;
  $("player-line").hidden = !latest; $("player-line").textContent = latest ? `You: ${latest.playerText}` : "";
  renderFace(play.face, "responding");
  $("opening").replaceChildren(publicDetails(play.conversation?.opening || play.lore?.briefing || []));
  $("public-metrics").replaceChildren(...["cash", "debt", "marcusStock", "playerStock"].filter(key => play.metrics?.[key] !== undefined).map(key => { const entry = node("div"); entry.className = "metric"; entry.append(node("span", names[key]), node("strong", play.metrics[key])); return entry; }));
  $("deal-fields").hidden = !commercial(); $("workspace-title").textContent = commercial() ? "BUILD THE OFFER" : "BUILD YOUR MESSAGE";
  $("price-note").textContent = commercial() ? `${snapshot.options.price} PER CONTRA · OLD DEBT SEPARATE` : "SUBJECT · INTENTION · DELIVERY";
  renderOffer(); renderKeywords(); updateDraft();
  $("conversation").replaceChildren(...play.events.map((event, index) => { const article = node("article"); article.append(node("h3", `Turn ${index + 1}`), node("p", `You: ${event.playerText}`), node("p", `${who.name}: ${event.marcusText}`)); if (event.feedback) { const feedback = node("p", event.feedback); feedback.className = "turn-feedback"; article.append(feedback); } return article; }));
  $("resolution").hidden = play.status === "OPEN";
  $("agreement").replaceChildren(publicDetails(play.agreement), publicDetails(play.obligations));
  $("outcome").replaceChildren(publicDetails(play.conversation?.outcomeQuality));
  $("walk-reason").textContent = play.availableActions?.find(entry => entry.action === "WALK")?.reason || "";
}
function renderDebug() {
  if (view !== "debug" || !snapshot) return;
  $("debug-content").replaceChildren(node("pre", JSON.stringify({ definitions: snapshot.options.metricDefinitions, ...snapshot.debug }, null, 2)));
}
function applySnapshot(data) {
  invalidatePreview(); snapshot = data; synchronized = true;
  if ($("seed").dataset.run !== data.play.runId) { $("seed").value = data.play.seed; $("seed").dataset.run = data.play.runId; keywordId = null; actionId = null; }
  fillOptions(); renderPlay(); renderDebug(); refreshControls();
}
async function getState() {
  const response = await fetch("/api/state", { credentials: "same-origin", cache: "no-store" });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not load encounter."); applySnapshot(data);
}
async function load() {
  if (busy) return; busy = true; invalidatePreview(); turnPlayer.cancel(); pendingSnapshot = null; refreshControls();
  try { await getState(); $("reload").hidden = true; notice("Choose a subject, a move, and your delivery. Read your line before sending."); }
  catch (error) { synchronized = false; $("reload").hidden = false; notice(error.message, true); }
  finally { busy = false; refreshControls(); schedulePreview(); }
}
async function submit(path, body) {
  if (busy || !synchronized || !snapshot) return;
  busy = true; invalidatePreview(); closeMenu(); refreshControls(); notice(path === "/api/restart" ? "Starting a fresh conversation…" : "Sending your words…");
  try {
    const data = await post(path, body);
    if (path === "/api/turn") {
      const event = data.play.events.at(-1);
      if (event && data.play.events.length > snapshot.play.events.length) {
        delivery.recordTurn({ runId: data.play.runId, index: event.turnRef?.index ?? data.play.events.length, action: event.action || body.action, vibeId: event.vibeId || body.vibeId });
        pendingSnapshot = data; await turnPlayer.play(event);
      } else applySnapshot(data);
    } else { turnPlayer.cancel(); pendingSnapshot = null; applySnapshot(data); }
    $("reload").hidden = true; notice(path === "/api/restart" ? "New conversation started." : "Response received. Review what changed, then choose your next move.");
  } catch (error) {
    synchronized = false; turnPlayer.cancel(); pendingSnapshot = null; $("skip").hidden = true;
    try { await getState(); $("reload").hidden = true; notice(`${error.message} Current state reloaded. Review it before sending again.`, true); }
    catch { $("reload").hidden = false; notice(`${error.message} Result uncertain. Reload state before continuing; this action will not be resent automatically.`, true); }
  } finally { busy = false; refreshControls(); schedulePreview(); }
}
function closeMenu() { if ($("conversation-menu").open) $("conversation-menu").close(); $("more").setAttribute("aria-expanded", "false"); }
$("more").addEventListener("click", () => { if (busy) return; $("conversation-menu").showModal(); $("more").setAttribute("aria-expanded", "true"); $("keywords-tab").focus(); });
$("close-menu").addEventListener("click", closeMenu); $("return-draft").addEventListener("click", closeMenu);
$("conversation-menu").addEventListener("close", () => { $("more").setAttribute("aria-expanded", "false"); $("more").focus(); });
["keywords", "based"].forEach(page => $(`${page}-tab`).addEventListener("click", () => { ["keywords", "based"].forEach(other => { $(`${other}-page`).hidden = other !== page; $(`${other}-tab`).setAttribute("aria-pressed", String(other === page)); }); }));
$("history-toggle").addEventListener("click", () => { $("history-panel").hidden = !$("history-panel").hidden; $("history-toggle").setAttribute("aria-expanded", String(!$("history-panel").hidden)); });
["play", "debug"].forEach(target => $(`${target}-tab`).addEventListener("click", () => { if (busy) return; view = target; $("play-view").hidden = target !== "play"; $("debug-view").hidden = target !== "debug"; ["play", "debug"].forEach(other => $(`${other}-tab`).setAttribute("aria-pressed", String(other === target))); renderDebug(); }));
$("turn-form").addEventListener("submit", event => { event.preventDefault(); if (busy || !preview || preview.key !== draftKey()) return; updateDraft(); if (selectedAction()?.intent.action === "DEAL" && !$("turn-form").reportValidity()) return; void submit("/api/turn", preview.body); });
$("accept").addEventListener("click", () => chooseFound(findAction(intent => intent.action === "ACCEPT")));
$("clarify").addEventListener("click", () => chooseFound(findAction(intent => intent.action === "ASK" && intent.topic === "CLARIFY_OFFER")));
$("walk").addEventListener("click", () => chooseFound(findAction(intent => intent.action === "WALK")));
$("propose").addEventListener("click", () => chooseFound(findAction(intent => intent.action === "DEAL" && (intent.information || "NONE") === ($("information").value || "NONE"))));
$("information").addEventListener("change", () => { const match = findAction(intent => intent.action === "DEAL" && (intent.information || "NONE") === $("information").value); chooseFound(match); });
termKeys.forEach(key => $(key).addEventListener("input", () => { updateDraft(); schedulePreview(); }));
$("restart-form").addEventListener("submit", event => { event.preventDefault(); if (busy || !snapshot) return; void submit("/api/restart", { requestId: crypto.randomUUID(), runId: snapshot.play.runId, version: snapshot.play.version, seed: $("seed").value, scenarioId: $("scenario").value }); });
$("reload").addEventListener("click", () => { void load(); }); $("skip").addEventListener("click", () => turnPlayer.skip());
void load();
