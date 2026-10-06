import { createDeliveryChart } from "/delivery-chart.js";
import { createFaceRenderer } from "/face-renderer.js";
import { createTurnPlayer } from "/turn-player.js";
import { r17DraftCharges, r17StandardExtra } from "/r17-rates.mjs";
import { createPlaytestObserver, filteredDebug } from "/playtest-log.js";
import { createLocalEngine } from "/local-engine.mjs";
import { createBrowserOptions } from "/browser-options.mjs";

const $ = id => document.getElementById(id);
const node = (tag, text) => { const element = document.createElement(tag); if (text !== undefined) element.textContent = String(text); return element; };
const termKeys = ["units", "upfront", "repayment", "extra", "days"];
const names = { cash: "Cash", debt: "Total owed", marcusStock: "Their Contra", playerStock: "Your Contra", units: "Contra units", upfront: "Cash now", repayment: "New principal", extra: "Additional repayment", days: "Repay within (days)" };
let snapshot = null, busy = false, synchronized = false, view = "play", delivery = null;
let keywordId = null, actionId = null, preview = null, previewSequence = 0, previewTimer = null;
let pendingSnapshot = null;
const engine = createLocalEngine(createBrowserOptions());
const observer = createPlaytestObserver({ getContext: () => ({ snapshot, selection: delivery?.getSelection() ?? null }), engine });
// Presentation only: keep the exact offer and send controls outside the collapsible draft.
const builder = node("details"), builderSummary = node("summary", "Build an offer");
builder.id = "offer-builder"; builder.append(builderSummary, document.querySelector(".proposal"));
document.querySelector(".deal-grid").prepend(builder);
const revisit = node("details"); revisit.id = "revisit"; revisit.append(node("summary", "Revisit earlier points"), node("div"));
$("context-actions").after(revisit);
$("npc-line").before($("player-line"));
$("npc-line").after($("resolution"));
// The completed-turn fieldset is disabled; keep its export control outside it.
$("turn-form").after($("download-run-log-end"));
const faceDetails = node("details"); faceDetails.className = "face-description";
faceDetails.append(node("summary", "Face description"), $("face-caption")); $("npc-line").after(faceDetails);
$("accept").textContent = "Choose these terms";
$("propose").hidden = false;
document.querySelector(".workspace-heading").hidden = true;
const allVibes = node("button", "All 20 BASED vibes ↗"); allVibes.id = "all-vibes"; allVibes.type = "button"; allVibes.dataset.interact = "";
allVibes.setAttribute("aria-haspopup", "dialog");
document.querySelector(".delivery-section>.hint").replaceChildren(allVibes);
const faceRenderer = createFaceRenderer($("portrait"));
const r17Rate = node("p"); r17Rate.id = "r17-rate"; $("edge-note").after(r17Rate);
const character = () => snapshot?.play.character || { id: "marcus", name: "Marcus" };
const keywords = () => snapshot?.options.keywords || [];
const selectedKeyword = () => keywords().find(entry => entry.id === keywordId);
const selectedAction = () => selectedKeyword()?.actions.find(entry => entry.id === actionId);
const offer = () => snapshot?.play.counteroffer;
const commercial = () => snapshot?.play.scenario?.kind !== "CONVERSATION" && snapshot?.options.price != null;
const available = action => snapshot?.play.availableActions?.find(entry => entry.action === action)?.available === true;
function notice(text, error = false) { $("notice").textContent = text; $("notice").classList.toggle("error", error); if (error) observer.record("UI_ERROR", { message: text }); }
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
function inspectFaces(event, index) {
  if (busy || !event?.faces) return;
  $("face-review-title").textContent = `TURN ${index + 1} · SAVED REACTIONS`;
  $("face-review-pair").replaceChildren(...["receiving", "responding"].map(phase => {
    const panel = node("section"), portrait = node("div"), face = event.faces[phase];
    portrait.className = "review-portrait";
    createFaceRenderer(portrait).render(snapshot.options.faceCatalog, face, character());
    panel.append(node("h3", phase === "receiving" ? "01 · HEARS YOU" : "02 · RESPONDS"), portrait,
      node("p", face?.visibleCaption || ""), node("blockquote", phase === "receiving" ? `You: ${event.playerText}` : `${character().name}: ${event.marcusText}`));
    return panel;
  }));
  $("face-review").showModal(); $("close-face-review").focus();
}
function renderEdge() {
  const edge = snapshot.play.edge, box = $("edge-note"); box.replaceChildren();
  if (!edge) { box.append(node("strong", "What you know"), node("p", snapshot.play.situation?.summary || "Review the conversation for what has been said.")); return; }
  box.append(node("strong", edge.title));
  if (edge.card?.label) box.append(node("p", `Your edge: ${edge.card.label}`));
  if (edge.note) box.append(node("p", edge.note));
  for (const [label, status] of [["Disclosure", edge.disclosure], ["Source", edge.source], ["Interest", edge.relevance]]) {
    if (status?.label) {
      const short = label === "Source" ? (status.shortLabel || (status.id === "CHECKED" ? "Source checked" : "Not checked"))
        : label === "Interest" ? ({ OBSERVED: "Possible use, no promise", UNCERTAIN: "No current use identified", UNTESTED: "Not asked yet" }[status.id] || status.label) : status.label;
      box.append(node("p", `${label}: ${short}`));
    }
  }
  if (edge.opening?.status !== "NONE" && edge.opening?.label) { const opening = node("p", edge.opening.label); opening.className = "edge-opening"; box.append(opening); }
  const evidence = node("details"); evidence.append(node("summary", "Exact evidence and observations"), node("p", edge.detail));
  for (const status of [edge.source, edge.relevance]) if (status?.label) evidence.append(node("p", status.label));
  for (const observation of edge.observations || []) evidence.append(node("p", observation));
  box.append(evidence);
}
const turnPlayer = createTurnPlayer({
  onReceiving(event) {
    $("reaction-controls").scrollIntoView({ block: "start", behavior: "auto" });
    $("response-announcement").textContent = ""; $("latest-feedback").hidden = true;
    $("player-line").hidden = false; $("player-line").textContent = `You: ${event.playerText}`;
    $("npc-line").textContent = "…";
    renderFace(event.faces?.receiving || snapshot.play.face, "receiving");
    $("skip").hidden = false; $("skip").focus(); notice(`${character().name} hears you.`);
    observer.record("FACE_PRESENTED", { turn: event.turnRef?.index, phase: "receiving", face: event.faces?.receiving }); observer.screen("hearing", { turn: event.turnRef?.index, phase: "receiving" });
  },
  onResponding(event) {
    if (pendingSnapshot) { applySnapshot(pendingSnapshot); pendingSnapshot = null; }
    renderFace(event.faces?.responding || snapshot.play.face, "responding");
    $("npc-line").textContent = event.marcusText;
    $("response-announcement").textContent = `${character().name}: ${event.marcusText} ${event.faces?.responding?.visibleCaption || ""} ${event.feedback || ""}`;
    observer.record("FACE_PRESENTED", { turn: event.turnRef?.index, phase: "responding", face: event.faces?.responding }); observer.screen("responding"); void observer.flush();
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
  setUnavailable("inspect-last", !snapshot?.play.events.at(-1)?.faces);
  setUnavailable("replay", !snapshot?.play.events.at(-1)?.faces);
  document.querySelectorAll("[data-interact]").forEach(element => { element.disabled = !ready || element.dataset.unavailable === "true"; });
  $("seed").disabled = !ready; $("scenario").disabled = !ready; $("reload").disabled = busy;
  $("manual-reactions").disabled = busy;
  const isDeal = selectedAction()?.intent.action === "DEAL";
  termKeys.forEach(key => { $(key).disabled = !open || !commercial(); $(key).required = isDeal; });
  $("information").disabled = !open || !commercial();
  $("send").disabled = !open || !preview || preview.key !== draftKey();
  $("accept").hidden = selectedAction()?.intent.action === "ACCEPT";
  $("send").textContent = busy ? "Working…" : selectedAction()?.intent.action === "ACCEPT" ? "Confirm exact terms →" : selectedAction()?.intent.action === "WALK" ? "Walk away →" : selectedAction()?.completion?.done ? "Repeat this point →" : "Say it →";
}
function findAction(predicate) {
  for (const keyword of keywords()) { const action = keyword.actions.find(entry => entry.available && predicate(entry.intent)); if (action) return { keyword, action }; }
  return null;
}
function chooseFound(found) { if (found) chooseAction(found.keyword.id, found.action.id); }
function chooseAction(subject, action) {
  if (busy || !synchronized) return;
  keywordId = subject; actionId = action;
  observer.record("UI_ACTION", { kind: "Selected move", target: actionId, label: selectedAction()?.label, keywordId, contextActionId: actionId, available: selectedAction()?.available, intent: selectedAction()?.intent });
  const chosen = selectedAction();
  builder.open = chosen?.intent.action === "DEAL";
  if (chosen?.intent.action === "DEAL") $("information").value = chosen.intent.information || "NONE";
  renderKeywords(); updateDraft(); schedulePreview();
}
function actionButton(keyword, action, full) {
  const button = node("button", action.label); button.type = "button";
  button.dataset.playtestAction = action.id;
  button.disabled = !action.available; button.setAttribute("aria-pressed", String(keyword.id === keywordId && action.id === actionId));
  button.title = action.reason || action.description;
  if (full) button.append(node("small", action.available ? action.description : action.reason));
  if (action.completion?.done) { const badge = node("small", action.completion.label || "Already discussed"); badge.className = "completion"; button.append(badge); }
  button.addEventListener("click", () => chooseAction(keyword.id, action.id)); return button;
}
function renderKeywords() {
  const bank = $("keyword-bank"); bank.replaceChildren();
  keywords().forEach(keyword => {
    const button = node("button", keyword.label); button.type = "button"; button.append(node("small", keyword.kindLabel || keyword.kind));
    button.setAttribute("aria-pressed", String(keyword.id === keywordId));
    button.addEventListener("click", () => { if (busy) return; keywordId = keyword.id; actionId = keyword.actions.find(action => action.available)?.id || null; const intent = selectedAction()?.intent; if (intent?.action === "DEAL") $("information").value = intent.information || "NONE"; renderKeywords(); updateDraft(); schedulePreview(); }); bank.append(button);
  });
  const keyword = selectedKeyword(), actions = keyword?.actions || [];
  $("keyword-title").textContent = keyword?.label || "No known subjects"; $("keyword-summary").textContent = keyword?.summary || "";
  $("subject-label").textContent = keyword ? `// ${keyword.label}` : "";
  $("keyword-actions").replaceChildren(...actions.map(action => actionButton(keyword, action, true)));
  const suggestions = actions.filter(action => action.available && !action.completion?.done && !["ACCEPT"].includes(action.intent.action) && action.intent.topic !== "CLARIFY_OFFER").slice(0, 3);
  // Keep a chosen fourth-or-later authored action visible when the menu closes.
  const chosen = selectedAction(); if (chosen?.available && !chosen.completion?.done && chosen.intent.action !== "ACCEPT" && chosen.intent.topic !== "CLARIFY_OFFER" && !suggestions.includes(chosen)) suggestions.splice(2, 1, chosen);
  $("context-actions").replaceChildren(...suggestions.map(action => actionButton(keyword, action, false)));
  const repeated = actions.filter(action => action.completion?.done);
  revisit.hidden = !repeated.length; revisit.lastElementChild.replaceChildren(...repeated.map(action => actionButton(keyword, action, false)));
  if (chosen?.completion?.done) revisit.open = true;
  if (!suggestions.length && commercial()) {
    const next = node("button", "Return to bargaining →"); next.type = "button";
    next.addEventListener("click", () => chooseFound(findAction(intent => intent.action === "DEAL" && (intent.information || "NONE") === "NONE")));
    $("context-actions").append(next);
  }
  $("action-description").textContent = chosen?.description || "Open More things to say to choose a subject.";
  renderEdge();
  $("draft-warning").textContent = chosen?.intent.action === "ACCEPT" ? "Confirming transfers the exact terms above, including attached information, and ends this encounter." : chosen?.completion?.done ? "You already discussed this point. Sending it again repeats it and spends another turn." : "";
  refreshControls();
}
function fillOptions() {
  const options = snapshot.options;
  if (!delivery) delivery = createDeliveryChart($("delivery-main"), { vibes: options.vibes, intensities: options.intensities, chartContainer: $("based-chart-menu"), onChange: () => schedulePreview(), onObserve: data => observer.record("UI_ACTION", data) });
  if (!$("delivery-settings")) {
    const settings = node("details"); settings.id = "delivery-settings"; settings.append(node("summary", "Delivery shortcuts & help"));
    [".dc-intro", ".dc-toolbar", ".dc-shortcut-note", ".dc-storage-note"].forEach(selector => { const element = $("delivery-main").querySelector(selector); if (element) settings.append(element); });
    $("based-chart-menu").append(settings);
  }
  const previousInformation = $("information").value;
  $("information").replaceChildren(...(options.informationOptions || []).map(entry => { const option = node("option", entry.label); option.value = entry.id; option.disabled = entry.available === false; return option; }));
  if ([...$("information").options].some(entry => entry.value === previousInformation && !entry.disabled)) $("information").value = previousInformation;
  else $("information").value = [...$("information").options].find(entry => !entry.disabled)?.value || "";
  $("scenario").replaceChildren(...(options.scenarios || [{ id: snapshot.play.scenario?.id || "marcus", label: "Marcus encounter" }]).map(entry => { const option = node("option", entry.label); option.value = entry.id; return option; }));
  $("scenario").value = snapshot.play.scenario?.id || $("scenario").options[0]?.value;
  if (!selectedKeyword()) { keywordId = keywords()[0]?.id || null; actionId = null; }
  if (!selectedAction()?.available) actionId = selectedKeyword()?.actions.find(entry => entry.available && entry.intent.action === "ASK")?.id || selectedKeyword()?.actions.find(entry => entry.available)?.id || null;
}
function draftTerms() { return Object.fromEntries(termKeys.map(key => [key, $(key).value === "" ? NaN : Number($(key).value)])); }
function updateDraft() {
  if (!snapshot) return;
  const input = draftTerms(), expected = input.units * snapshot.options.price - input.upfront;
  $("repayment").value = commercial() && Number.isFinite(expected) ? String(expected) : "";
  const terms = draftTerms();
  const charges = Number.isSafeInteger(expected) && expected >= 0 ? r17DraftCharges(expected, snapshot.play.r17RateContext, $("information").value === "OFFER_INFORMATION") : [];
  const blind = charges.length > 1, charge = charges[0];
  $("extra").value = charge ? String(charge.extra) : "";
  terms.extra = charge?.extra ?? NaN;
  $("extra-display").textContent = blind ? `$${charges[0].extra} · ${charges[0].rate}% if he values R-17 · $${charges[1].extra} · ${charges[1].rate}% if he doesn't` : charge ? `$${charge.extra} · ${charge.rate}% of new credit` : "Enter valid new credit.";
  $("extra-comparison").hidden = !charge || blind || charge.rate === 16;
  $("extra-comparison").textContent = charge && !blind && charge.rate !== 16 ? `Standard charge without R-17: $${r17StandardExtra(expected)} · 16%` : "";
  const isDeal = selectedAction()?.intent.action === "DEAL";
  $("upfront").setCustomValidity(isDeal && expected < 0 ? "Cash now cannot exceed the price of the requested Contra." : "");
  $("draft-summary").textContent = snapshot.play.status !== "OPEN" ? "" : charge ? blind ? `Keep $${snapshot.play.metrics.cash - terms.upfront} cash. Repay $${expected + charges[0].extra} if he values R-17, or $${expected + charges[1].extra} if he doesn't, in ${terms.days} days. Old debt stays owed.` : `Keep $${snapshot.play.metrics.cash - terms.upfront} cash. Repay $${terms.repayment + terms.extra} in ${terms.days} days ($${terms.repayment} credit + $${terms.extra} extra). Old debt stays owed.` : "Enter whole-number terms.";
  const information = snapshot.options.informationOptions?.find(entry => entry.id === $("information").value);
  const exchange = snapshot.options.informationOptions?.find(entry => entry.id === "OFFER_INFORMATION");
  $("information-reason").textContent = [information?.reason, information?.id !== "OFFER_INFORMATION" && exchange?.available === false ? exchange.reason : ""].filter(Boolean).join(" ");
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
  $("delivery-description").replaceChildren();
  if (busy || !snapshot || !synchronized) return;
  if (snapshot.play.status !== "OPEN") { $("preview-state").textContent = "Conversation complete"; $("player-preview").textContent = "Review your conversation or start a new encounter."; return; }
  $("preview-state").textContent = "Preparing your line…"; $("player-preview").textContent = "…";
  const sequence = previewSequence;
  previewTimer = globalThis.setTimeout(() => { void requestPreview(sequence); }, 180);
}
async function requestPreview(sequence) {
  const fields = intentFields(); if (!fields || busy || sequence !== previewSequence) return;
  const key = draftKey(); const body = { requestId: engine.createRequestId(), runId: snapshot.play.runId, version: snapshot.play.version, ...fields };
  observer.record("PREVIEW_REQUESTED", { requestId: body.requestId, intent: fields });
  try {
    const data = await engine.preview(body);
    if (sequence !== previewSequence || busy || key !== draftKey() || data.runId !== snapshot.play.runId || data.version !== snapshot.play.version) return;
    preview = { key, body, text: data.playerText };
    $("player-preview").textContent = data.playerText; $("preview-state").textContent = selectedAction()?.completion?.done ? "Repeat prepared · already discussed" : "Ready · review, then send";
    const manner = data.deliveryDescription;
    if (manner) $("delivery-description").replaceChildren(node("strong", manner.label));
    if (fields.topic === "CLARIFY_OFFER") $("draft-warning").textContent = "Asking keeps these exact terms open, but spends a turn and may test his patience.";
    observer.record("PREVIEW_SHOWN", { requestId: body.requestId, playerLine: data.playerText, delivery: fields.vibeId, intensity: fields.intensity }); observer.screen("preview");
  } catch (error) {
    if (sequence !== previewSequence || key !== draftKey()) return;
    preview = null; $("player-preview").textContent = error.message; $("preview-state").textContent = "Draft needs attention";
    observer.record("UI_ERROR", { message: error.message });
  }
  refreshControls();
}
function renderOffer() {
  const box = $("current-offer"), current = offer(); box.replaceChildren();
  $("accept-reason").textContent = "";
  document.querySelector(".offer-sheet").hidden = !current;
  if (!current) return;
  box.append(node("p", current.source === "APPROVED_PROPOSAL" ? `${character().name} approved this. Confirm below to accept.` : `${character().name} offers these terms.`), termTable(current.terms));
  box.append(node("p", `Confirmation transfers ${current.terms.upfront} cash and ${current.terms.units} Contra, adding ${current.terms.repayment} principal and ${current.terms.extra} additional repayment due within ${current.terms.days} days. Existing debt remains owed.`));
  box.append(node("p", `After confirmation: ${snapshot.play.metrics.cash - current.terms.upfront} cash retained; ${current.terms.repayment + current.terms.extra} new repayment due.`));
  if (Number.isFinite(current.extraChargeRate)) {
    box.append(node("p", `Extra: $${current.terms.extra} · ${current.extraChargeRate}% of new credit.`));
    if (current.extraChargeRate !== 16) box.append(node("p", `Standard charge without R-17: $${r17StandardExtra(current.terms.repayment)} · 16%`));
  }
  const proposal = [...snapshot.play.events].reverse().find(event => event.action === "DEAL");
  if (proposal && current.source !== "APPROVED_PROPOSAL") {
    const comparison = node("details"); comparison.append(node("summary", "Compare with your last spoken proposal"), node("p", proposal.playerText)); box.append(comparison);
  }
  if (current.informationExchange) box.append(node("p", `On acceptance: ${current.informationExchange.summary}`));
  $("accept-reason").textContent = "Clarification preserves this offer unless the conversation ends. Other discussion or a new proposal replaces it.";
}
function renderReceipt() {
  const play = snapshot.play, terms = play.agreement?.terms, quality = play.conversation?.outcomeQuality;
  $("agreement").replaceChildren(); $("outcome").replaceChildren();
  $("resolution").querySelector("h2").textContent = play.status === "AGREED" ? "Your agreed deal" : "Conversation complete";
  if (terms) {
    const totals = node("div"); totals.className = "receipt-totals";
    for (const [label, value] of [["Contra acquired", terms.units], ["Cash remaining", `$${play.metrics.cash}`], ["New repayment", `$${terms.repayment + terms.extra} in ${terms.days} days`], ["Total owed", `$${play.metrics.debt}`]]) {
      const item = node("div"); item.append(node("span", label), node("strong", value)); totals.append(item);
    }
    $("agreement").append(totals, node("p", `Old debt: $${play.obligations?.existing ?? play.agreement.obligations?.existing ?? 0}. New credit: $${terms.repayment} + $${terms.extra} extra. The old debt is still owed.`));
    const saved = r17StandardExtra(terms.repayment) - terms.extra;
    if (saved !== 0) $("agreement").append(node("p", saved > 0 ? `R-17 saved you $${saved} on the extra charge.` : `Your R-17 play cost you $${-saved} on the extra charge.`));
    const receipt = node("details"); receipt.append(node("summary", "Accepted terms"), termTable(terms));
    if (play.agreement.informationExchange?.summary) receipt.append(node("p", play.agreement.informationExchange.summary));
    $("agreement").append(receipt);
  } else if (commercial()) $("agreement").append(node("p", `Cash: $${play.metrics.cash}. Your Contra: ${play.metrics.playerStock}. Total owed: $${play.metrics.debt}.`));
  for (const text of quality?.relationalConsequences || []) $("outcome").append(node("p", text));
}
function renderPlay() {
  const play = snapshot.play, who = character(), latest = play.events.at(-1);
  $("speaker-name").textContent = who.name; $("portrait-name").textContent = who.name.toUpperCase();
  $("scenario-name").textContent = play.scenario?.label || "READ THE DEAL";
  $("language-readiness").hidden = true;
  const statuses = { OPEN: "Conversation open", AGREED: "Agreement reached", WITHDRAWN: "You walked away", ENDED: "Conversation ended" };
  $("encounter-status").textContent = statuses[play.status] || play.status;
  $("npc-line").textContent = latest?.marcusText || `${who.name} waits for your opening words.`;
  $("latest-feedback").hidden = !latest?.feedback; $("latest-feedback").textContent = latest?.feedback || "";
  $("situation").hidden = !play.situation || play.status !== "OPEN";
  $("situation-summary").textContent = commercial() ? "You owe Marcus $250 and missed yesterday’s check-in. You want more Contra; private information may help." : play.situation?.summary || "";
  $("situation-objective").textContent = commercial() ? "Aim for 2 Contra using some new credit. A smaller deal or walking away is also your choice." : play.situation?.objective || "";
  $("player-line").hidden = !latest; $("player-line").textContent = latest ? `You: ${latest.playerText}` : "";
  renderFace(play.face, "responding");
  $("opening").replaceChildren(publicDetails(play.conversation?.opening || play.lore?.briefing || []));
  $("public-metrics").replaceChildren(...["cash", "debt", "marcusStock", "playerStock"].filter(key => play.metrics?.[key] !== undefined).map(key => { const entry = node("div"); entry.className = "metric"; entry.append(node("span", names[key]), node("strong", play.metrics[key])); return entry; }));
  $("deal-fields").hidden = !commercial(); $("workspace-title").textContent = commercial() ? "BUILD THE OFFER" : "BUILD YOUR MESSAGE";
  document.querySelector(".deal-workspace").hidden = play.status !== "OPEN";
  document.querySelector(".delivery-section").hidden = play.status !== "OPEN";
  $("context-actions").hidden = play.status !== "OPEN";
  $("action-description").hidden = play.status !== "OPEN";
  $("subject-label").parentElement.hidden = play.status !== "OPEN";
  $("walk").hidden = play.status !== "OPEN"; $("walk-reason").hidden = play.status !== "OPEN";
  $("price-note").textContent = commercial() ? `${snapshot.options.price} PER CONTRA · OLD DEBT SEPARATE` : "SUBJECT · INTENTION · DELIVERY";
  $("r17-rate").hidden = !Number.isFinite(play.extraChargeRate);
  $("r17-rate").textContent = Number.isFinite(play.extraChargeRate) ? `Marcus's extra charge: ${play.extraChargeRate}% of new principal.` : "";
  renderOffer(); renderKeywords(); updateDraft();
  $("conversation").replaceChildren(...play.events.map((event, index) => { const article = node("article"); article.append(node("h3", `Turn ${index + 1}`), node("p", `You: ${event.playerText}`), node("p", `${who.name}: ${event.marcusText}`)); if (event.feedback) { const feedback = node("p", event.feedback); feedback.className = "turn-feedback"; article.append(feedback); } if (event.faces) { const inspect = node("button", "Inspect both reactions"); inspect.type = "button"; inspect.dataset.interact = ""; inspect.addEventListener("click", () => inspectFaces(event, index)); article.append(inspect); } return article; }));
  $("resolution").hidden = play.status === "OPEN";
  $("download-run-log-end").hidden = play.status === "OPEN";
  renderReceipt();
  if (play.status !== "OPEN") revisit.hidden = true;
  $("walk-reason").textContent = play.availableActions?.find(entry => entry.action === "WALK")?.reason || "";
}
function renderDebug() {
  if (view !== "debug" || !snapshot) return;
  $("debug-content").replaceChildren(node("pre", JSON.stringify(filteredDebug(snapshot), null, 2)));
}
function applySnapshot(data) {
  invalidatePreview(); snapshot = data; synchronized = true;
  observer.bind(data);
  if ($("seed").dataset.run !== data.play.runId) { $("seed").value = data.play.seed; $("seed").dataset.run = data.play.runId; keywordId = null; actionId = null; }
  fillOptions();
  if (offer() && available("ACCEPT")) {
    const accept = findAction(intent => intent.action === "ACCEPT");
    if (accept) { keywordId = accept.keyword.id; actionId = accept.action.id; builder.open = false; }
  }
  renderPlay(); renderDebug(); refreshControls();
  observer.screen("snapshot applied");
}
function resetDraft() {
  termKeys.forEach(key => { $(key).value = $(key).defaultValue; });
  $("information").value = "NONE";
  $("response-announcement").textContent = "";
  builder.open = false; revisit.open = false;
}
function focusResponse() {
  const target = snapshot?.play.status === "OPEN" ? $("npc-line") : $("resolution");
  target.focus({ preventScroll: true });
}
async function getState() {
  applySnapshot(engine.getState());
}
async function load() {
  if (busy) return; busy = true; invalidatePreview(); turnPlayer.cancel(); pendingSnapshot = null; refreshControls();
  try { await getState(); $("reload").hidden = true; notice(snapshot.play.status === "OPEN" ? "Choose your words and delivery. Sending spends a turn; browsing does not." : "Conversation complete. Review the result or replay the reactions."); }
  catch (error) { synchronized = false; $("reload").hidden = false; notice(error.message, true); }
  finally { busy = false; refreshControls(); schedulePreview(); }
}
async function submit(method, body) {
  if (busy || !synchronized || !snapshot) return;
  observer.record("TURN_SENT", { turn: snapshot.play.version + 1, action: method === "restart" ? "RESTART" : body.action, requestId: body.requestId, intent: body }); void observer.flush();
  busy = true; invalidatePreview(); closeMenu(); refreshControls(); notice(method === "restart" ? "Starting a fresh conversation…" : "Sending your words…");
  try {
    const data = await engine[method](body);
    if (method === "sendTurn") {
      const event = data.play.events.at(-1);
      if (event && data.play.events.length > snapshot.play.events.length) {
        delivery.recordTurn({ runId: data.play.runId, index: event.turnRef?.index ?? data.play.events.length, action: event.action || body.action, vibeId: event.vibeId || body.vibeId });
        pendingSnapshot = data; await turnPlayer.play(event, { manual: $("manual-reactions").checked });
      } else applySnapshot(data);
    } else { turnPlayer.cancel(); pendingSnapshot = null; resetDraft(); applySnapshot(data); }
    $("reload").hidden = true; notice(snapshot.play.status !== "OPEN" ? "Conversation complete. Your result is shown below." : method === "restart" ? "New conversation started." : "Response received. Review what changed, then choose your next move.");
  } catch (error) {
    synchronized = false; turnPlayer.cancel(); pendingSnapshot = null; $("skip").hidden = true;
    try { await getState(); $("reload").hidden = true; notice(`${error.message} Current state reloaded. Review it before sending again.`, true); }
    catch { $("reload").hidden = false; notice(`${error.message} Result uncertain. Reload state before continuing; this action will not be resent automatically.`, true); }
  } finally { busy = false; refreshControls(); schedulePreview(); focusResponse(); observer.screen("send complete"); void observer.flush(); }
}
function closeMenu() { if ($("conversation-menu").open) $("conversation-menu").close(); $("more").setAttribute("aria-expanded", "false"); }
$("more").addEventListener("click", () => { if (busy) return; $("conversation-menu").showModal(); $("more").setAttribute("aria-expanded", "true"); $("keywords-tab").focus(); });
$("all-vibes").addEventListener("click", () => { if (busy) return; $("more").click(); $("based-tab").click(); $("based-tab").focus(); });
$("close-menu").addEventListener("click", closeMenu); $("return-draft").addEventListener("click", closeMenu);
$("conversation-menu").addEventListener("close", () => { $("more").setAttribute("aria-expanded", "false"); $("more").focus(); });
["keywords", "based"].forEach(page => $(`${page}-tab`).addEventListener("click", () => { ["keywords", "based"].forEach(other => { $(`${other}-page`).hidden = other !== page; $(`${other}-tab`).setAttribute("aria-pressed", String(other === page)); }); }));
$("history-toggle").addEventListener("click", () => { $("history-panel").hidden = !$("history-panel").hidden; $("history-toggle").setAttribute("aria-expanded", String(!$("history-panel").hidden)); });
["play", "debug"].forEach(target => $(`${target}-tab`).addEventListener("click", () => { if (busy) return; view = target; $("play-view").hidden = target !== "play"; $("debug-view").hidden = target !== "debug"; ["play", "debug"].forEach(other => $(`${other}-tab`).setAttribute("aria-pressed", String(other === target))); renderDebug(); }));
$("turn-form").addEventListener("submit", event => { event.preventDefault(); if (busy || !preview || preview.key !== draftKey()) return; updateDraft(); if (selectedAction()?.intent.action === "DEAL" && !$("turn-form").reportValidity()) return; void submit("sendTurn", preview.body); });
$("accept").addEventListener("click", () => chooseFound(findAction(intent => intent.action === "ACCEPT")));
$("clarify").addEventListener("click", () => chooseFound(findAction(intent => intent.action === "ASK" && intent.topic === "CLARIFY_OFFER")));
$("walk").addEventListener("click", () => chooseFound(findAction(intent => intent.action === "WALK")));
$("propose").addEventListener("click", () => chooseFound(findAction(intent => intent.action === "DEAL" && (intent.information || "NONE") === ($("information").value || "NONE"))));
$("information").addEventListener("change", () => { if (selectedAction()?.intent.action === "DEAL") chooseFound(findAction(intent => intent.action === "DEAL" && (intent.information || "NONE") === $("information").value)); updateDraft(); schedulePreview(); });
termKeys.forEach(key => $(key).addEventListener("input", () => { updateDraft(); schedulePreview(); }));
$("restart-form").addEventListener("submit", event => { event.preventDefault(); if (busy || !snapshot) return; void submit("restart", { requestId: engine.createRequestId(), runId: snapshot.play.runId, version: snapshot.play.version, seed: $("seed").value, scenarioId: $("scenario").value }); });
$("reload").addEventListener("click", () => { void load(); }); $("skip").addEventListener("click", () => turnPlayer.skip());
$("replay").addEventListener("click", async () => {
  const event = snapshot?.play.events.at(-1); if (busy || !event?.faces) return;
  busy = true; invalidatePreview(); refreshControls();
  try { await turnPlayer.play(event, { manual: $("manual-reactions").checked }); } finally { busy = false; renderPlay(); refreshControls(); schedulePreview(); notice("Reaction replay complete. No turn spent."); $("replay").focus(); }
});
$("inspect-last").addEventListener("click", () => inspectFaces(snapshot.play.events.at(-1), snapshot.play.events.length - 1));
$("close-face-review").addEventListener("click", () => $("face-review").close());
$("face-review").addEventListener("close", () => $("inspect-last").focus());
observer.setupDownloads();
void load();
