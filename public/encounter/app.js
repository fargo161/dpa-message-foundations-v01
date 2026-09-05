"use strict";

const $ = (id) => document.getElementById(id);
let snapshot = null;
let busy = false;
let synchronized = false;
let view = "play";
const publicKeys = ["cash", "debt", "marcusStock", "playerStock"];
const termKeys = ["units", "upfront", "repayment", "extra", "days"];
const names = { cash: "Player cash", debt: "Outstanding debt", marcusStock: "Marcus Contra stock", playerStock: "Player Contra stock", confidence: "Marcus confidence", tension: "Marcus tension", patience: "Marcus patience", units: "Contra units", upfront: "Upfront cash", repayment: "New credit principal", existing: "Existing debt", principal: "Accepted new Contra principal", extra: "Additional repayment", days: "Repay within (days)", runId: "Run identity", vibeId: "BASED Vibe", offerId: "Offer identity", offerVersion: "Offer version" };
const label = (key) => names[key] || key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const node = (tag, text) => { const element = document.createElement(tag); if (text !== undefined) element.textContent = String(text); return element; };
const plain = (value) => value === null || value === undefined ? "None" : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);

function table(headers, rows) {
  const wrap = node("div"); wrap.className = "table-wrap";
  const element = node("table"); const head = node("thead"); const tr = node("tr");
  headers.forEach((text) => { const cell = node("th", text); cell.scope = "col"; tr.append(cell); }); head.append(tr); element.append(head);
  const body = node("tbody");
  rows.forEach((cells) => { const row = node("tr"); cells.forEach((value) => { const cell = node("td"); cell.append(value instanceof Node ? value : document.createTextNode(plain(value))); row.append(cell); }); body.append(row); });
  element.append(body); wrap.append(element); return wrap;
}

function details(value) {
  if (value === null || value === undefined) return node("p", "None yet.");
  if (Array.isArray(value)) {
    if (!value.length) return node("p", "None yet.");
    const list = node("ul"); value.forEach((item) => { const entry = node("li"); entry.append(typeof item === "object" && item !== null ? details(item) : document.createTextNode(plain(item))); list.append(entry); }); return list;
  }
  if (typeof value === "object") return table(["Setting / field", "Value"], Object.entries(value).map(([key, entry]) => [label(key), typeof entry === "object" && entry !== null ? details(entry) : plain(entry)]));
  return node("p", plain(value));
}

function section(parent, title, content) { const block = node("section"); block.append(node("h3", title), content); parent.append(block); }
function notice(text, error = false) { $("notice").textContent = text; $("notice").classList.toggle("error", error); }
function availability(action) { return snapshot?.play.availableActions.find((entry) => entry.action === action) || { available: false, reason: "State is not available." }; }
function currentOffer() { return snapshot?.play.counteroffer || null; }

function refreshControls() {
  const ready = Boolean(snapshot) && synchronized && !busy;
  $("turn-fields").disabled = !ready || snapshot?.play.status !== "OPEN";
  const action = $("action").value;
  $("ask-fields").hidden = action !== "ASK"; $("deal-fields").hidden = action !== "DEAL";
  $("topic").disabled = action !== "ASK";
  termKeys.forEach((key) => { $(key).disabled = action !== "DEAL"; });
  $("send").textContent = busy ? "Working…" : `Send ${action}`;
  $("send").disabled = !ready || !availability(action).available;
  $("send-reason").textContent = availability(action).reason || "";
  $("accept").disabled = !ready || !currentOffer() || !availability("ACCEPT").available;
  $("accept-reason").textContent = availability("ACCEPT").reason || "";
  $("walk").disabled = !ready || !availability("WALK").available;
  $("walk-reason").textContent = availability("WALK").reason || "";
  $("restart").disabled = !ready; $("seed").disabled = busy;
  $("reload").disabled = busy;
}

function fillOptions() {
  const options = snapshot.options;
  const fill = (id, entries, getId, getLabel) => {
    const old = $(id).value; $(id).replaceChildren();
    entries.forEach((entry) => { const option = node("option", getLabel(entry)); option.value = getId(entry); $(id).append(option); });
    if ([...$(id).options].some((entry) => entry.value === old)) $(id).value = old;
  };
  fill("vibe", options.vibes, (entry) => entry.vibeId, (entry) => `${entry.vibeId} — ${entry.name}`);
  fill("intensity", options.intensities, (entry) => entry, (entry) => entry);
  if (!$("intensity").dataset.initialized) { $("intensity").value = "BALANCED"; $("intensity").dataset.initialized = "true"; }
  fill("topic", options.topics, (entry) => entry.id, (entry) => entry.label);
  $("price-note").textContent = `Contra price: ${options.price} per unit. Existing debt is separate from the new principal and additional repayment.`;
  updateVibe(); updateDraft();
}

function updateVibe() { const selected = snapshot?.options.vibes.find((entry) => entry.vibeId === $("vibe").value); $("vibe-meaning").textContent = selected?.fusionLogic || ""; }
function draftTerms() { return Object.fromEntries(termKeys.map((key) => [key, $(key).valueAsNumber])); }
function updateDraft() {
  if (!snapshot) return;
  const terms = draftTerms(); const expected = terms.units * snapshot.options.price - terms.upfront;
  $("repayment").setCustomValidity(Number.isFinite(expected) && terms.repayment !== expected ? `Principal must be ${expected}: units × price minus upfront cash.` : "");
  $("draft-summary").textContent = Number.isFinite(expected) && Number.isFinite(terms.extra) ? `Required principal: ${expected}. Your proposed new obligation: ${terms.repayment + terms.extra}. Existing debt is not included in this new obligation.` : "Enter whole-number terms to preview this proposal.";
}

function offerSummary(offer) {
  const fragment = document.createDocumentFragment();
  if (!offer) { fragment.append(node("p", "No current offer to accept. Ask a question or propose a deal.")); return fragment; }
  fragment.append(node("p", offer.source === "APPROVED_PROPOSAL" ? "Marcus has approved your proposal. Confirm the terms below to make the transfer." : "Marcus proposes the following terms. Review them before accepting."));
  fragment.append(table(["Term", "Amount / timing"], termKeys.map((key) => [label(key), offer.terms[key]])));
  fragment.append(node("p", `Accepting transfers ${offer.terms.upfront} cash to Marcus and ${offer.terms.units} Contra units to you. It adds ${offer.terms.repayment} principal plus ${offer.terms.extra} additional repayment, due within ${offer.terms.days} days. Existing debt remains owed.`));
  fragment.append(node("p", "Any intervening message invalidates this offer. Acceptance ends the encounter."));
  return fragment;
}

function renderPlay() {
  const play = snapshot.play;
  $("public-metrics").replaceChildren(table(["Resource", "Current amount"], publicKeys.map((key) => [label(key), play.metrics[key]])));
  const statuses = { OPEN: "Negotiations are open.", AGREED: "Agreement reached. This encounter is complete.", WITHDRAWN: "You walked away. This encounter is complete.", ENDED: "Marcus ended negotiations. This encounter is complete." };
  $("encounter-status").textContent = statuses[play.status] || play.status;
  $("current-offer").replaceChildren(offerSummary(currentOffer()));
  const conversation = $("conversation"); conversation.replaceChildren();
  if (!play.events.length) conversation.append(node("p", "Marcus waits for your opening message."));
  play.events.forEach((event, index) => { const article = node("article"); article.append(node("h3", `Turn ${index + 1} · ${label(event.outcome)}`), node("p", `You: ${event.playerText}`), node("p", `Marcus: ${event.marcusText}`)); conversation.append(article); });
  $("clues").replaceChildren(details(play.clues));
  $("agreement").replaceChildren();
  if (play.agreement) section($("agreement"), "Accepted terms", table(["Term", "Amount / timing"], termKeys.map((key) => [label(key), play.agreement.terms[key]])));
  else $("agreement").append(node("p", "No agreement has been accepted. Proposals do not transfer cash or Contra."));
  section($("agreement"), "Obligation breakdown", details(play.obligations));
}

function renderDebug() {
  if (!snapshot) return;
  const { debug, options, play } = snapshot; const state = debug.state; const turn = debug.latestTurn;
  const content = $("debug-content"); content.replaceChildren();
  section(content, "All seven persistent metrics", table(["Metric", "Value", "Range", "Meaning"], options.metricDefinitions.map((entry) => [entry.label, state.metrics[entry.key], `${entry.min}–${entry.max}`, entry.meaning])));
  section(content, "Latest turn — before / after / delta", turn ? table(["Metric", "Before", "After", "Delta"], options.metricDefinitions.map((entry) => [entry.label, turn.before[entry.key], turn.after[entry.key], turn.deltas[entry.key]])) : node("p", "No turn has been taken."));
  section(content, "Rules and reasons for the latest decision", details(turn?.reasons));
  section(content, "BASED and intensity contribution", details(turn?.based));
  section(content, "Derived decision scores, thresholds and repetition", details(turn?.derived));
  section(content, "Available actions and reasons", table(["Action", "Available", "Reason"], play.availableActions.map((entry) => [entry.action, entry.available ? "Yes" : "No", entry.reason])));
  section(content, "Current player proposal", details(state.proposal));
  section(content, "Current Marcus offer", details(state.counteroffer));
  section(content, "Accepted agreement", details(state.agreement));
  section(content, "Obligation breakdown", details(state.obligations));
  section(content, "Personality settings", details(debug.personality));
  section(content, "Run and hidden quirk", details({ seed: state.seed, runId: state.runId, version: play.version, status: state.status, quirk: state.quirk }));
  section(content, "Discovered clues", details(state.clues));
  section(content, "History and semantic intent", details(state.events));
  const raw = node("details"); raw.append(node("summary", "Optional raw state"), node("pre", JSON.stringify(state, null, 2))); content.append(raw);
}

function applySnapshot(data) {
  snapshot = data; synchronized = true;
  if (!$("seed").value || $("seed").dataset.run !== data.play.runId) { $("seed").value = data.play.seed; $("seed").dataset.run = data.play.runId; }
  fillOptions(); renderPlay(); if (view === "debug") renderDebug(); refreshControls();
}

async function getState() {
  const response = await fetch("/api/state", { credentials: "same-origin", cache: "no-store" });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || `State request failed (${response.status}).`); applySnapshot(data);
}

async function load() {
  if (busy) return; busy = true; refreshControls(); notice("Loading authoritative state…");
  try { await getState(); $("reload").hidden = true; notice("Encounter ready."); }
  catch (error) { synchronized = false; $("reload").hidden = false; notice(`Could not load state: ${error.message}`, true); }
  finally { busy = false; refreshControls(); }
}

async function submit(path, fields) {
  if (busy || !synchronized || !snapshot) return;
  busy = true; refreshControls(); notice("Marcus is considering your message…");
  try {
    const body = { requestId: crypto.randomUUID(), runId: snapshot.play.runId, version: snapshot.play.version, ...fields };
    const response = await fetch(path, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": snapshot.csrf }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    applySnapshot(data); $("reload").hidden = true;
    notice(path === "/api/restart" ? "New encounter started." : `Turn recorded. ${$("encounter-status").textContent}`);
  } catch (error) {
    synchronized = false;
    try { await getState(); $("reload").hidden = true; notice(`${error.message} Current state has been reloaded; review it before sending another action.`, true); }
    catch { $("reload").hidden = false; notice(`${error.message} The result is uncertain. Reload state before continuing; this action will not be automatically resent.`, true); }
  } finally { busy = false; refreshControls(); }
}

function messageFields(action) { return { action, vibeId: $("vibe").value, intensity: $("intensity").value }; }
$("turn-form").addEventListener("submit", (event) => {
  event.preventDefault(); const action = $("action").value;
  if (action === "DEAL") { updateDraft(); if (!$("turn-form").reportValidity()) return; }
  void submit("/api/turn", { ...messageFields(action), ...(action === "ASK" ? { topic: $("topic").value } : { terms: draftTerms() }) });
});
$("accept").addEventListener("click", () => { const offer = currentOffer(); if (offer) void submit("/api/turn", { ...messageFields("ACCEPT"), offerId: offer.id, offerVersion: offer.version }); });
$("walk").addEventListener("click", () => { void submit("/api/turn", messageFields("WALK")); });
$("restart-form").addEventListener("submit", (event) => { event.preventDefault(); void submit("/api/restart", { seed: $("seed").value }); });
$("action").addEventListener("change", refreshControls);
$("vibe").addEventListener("change", updateVibe);
termKeys.forEach((key) => $(key).addEventListener("input", updateDraft));
$("reload").addEventListener("click", () => { void load(); });
["play", "debug"].forEach((target) => $(`${target}-tab`).addEventListener("click", () => {
  view = target; $("play-view").hidden = target !== "play"; $("debug-view").hidden = target !== "debug";
  $("play-tab").setAttribute("aria-pressed", String(target === "play")); $("debug-tab").setAttribute("aria-pressed", String(target === "debug"));
  if (target === "debug") renderDebug();
}));
void load();
