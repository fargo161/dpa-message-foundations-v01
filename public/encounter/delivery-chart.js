import { readDeliveryPreferences, writeDeliveryPreferences, recordCommittedDelivery, deliveryShortcuts, resetDeliveryPreferences } from "/delivery-options.mjs";

const CUES = Object.freeze([
  ["B", "Belligerence"], ["A", "Aggression"], ["S", "Sociability"], ["E", "Empathy"], ["D", "Deception"],
]);
const INTENSITY_LABELS = { SUBTLE: "Subtle", BALANCED: "Balanced", OVERT: "Overt" };
const INTENSITY_SUMMARIES = {
  SUBTLE: "Keep the selected manner understated.",
  BALANCED: "Make the selected manner clear without emphasizing it heavily.",
  OVERT: "Make the selected manner strongly apparent.",
};

export function createDeliveryChart(container, { vibes, intensities, onChange, storage, chartContainer }) {
  const doc = container.ownerDocument;
  const ids = vibes.map((vibe) => vibe.vibeId);
  if (ids.length !== 20 || new Set(ids).size !== 20 || CUES.some(([cue]) => CUES.some(([other]) => cue !== other && !ids.includes(cue + other)))) {
    throw new Error("Delivery chart requires the 20 canonical ordered vibes.");
  }
  if (intensities.length !== 3 || Object.keys(INTENSITY_LABELS).some((intensity) => !intensities.includes(intensity))) {
    throw new Error("Delivery chart requires the three canonical intensities.");
  }
  if (storage === undefined) {
    try { storage = doc.defaultView.localStorage; } catch { storage = null; }
  }
  let preferences = readDeliveryPreferences(storage, ids);
  let selection = { vibeId: "EA", intensity: "BALANCED" };
  let destroyed = false;
  const root = element("section", "dc-chart");
  const menuRoot = chartContainer ? element("section", "dc-chart dc-menu-chart") : null;
  if (menuRoot) root.classList.add("dc-main-chart");
  root.setAttribute("aria-label", "BASED delivery chart");
  const intro = element("p", "dc-intro", "Choose your delivery. Your subject and action stay the same.");
  const toolbar = element("div", "dc-toolbar");
  const modeLabel = element("label", "dc-mode-label", "Your shortcuts ");
  const mode = element("select", "dc-mode");
  for (const [value, label] of [["RECENT", "Recent"], ["FREQUENT", "Most used"]]) {
    const option = element("option", "", label);
    option.value = value;
    mode.append(option);
  }
  mode.value = preferences.mode;
  modeLabel.append(mode);
  const reset = element("button", "dc-reset", "Reset preferences");
  reset.type = "button";
  toolbar.append(modeLabel, reset);
  const shortcutNote = element("p", "dc-shortcut-note");
  const shortcuts = element("div", "dc-shortcuts");
  shortcuts.setAttribute("role", "group");
  shortcuts.setAttribute("aria-label", "Delivery shortcuts");
  const chartLabel = element("h3", "dc-chart-label", "All 20 vibes");
  const chart = element("div", "dc-full-chart");
  for (const [cue, name] of CUES) {
    const group = element("section", "dc-cue-row");
    group.setAttribute("aria-label", `${name} leads`);
    const label = element("h4", "dc-cue-label");
    const dot = element("span", "dc-cue-dot", cue);
    dot.dataset.cue = cue;
    dot.setAttribute("aria-hidden", "true");
    label.append(dot, doc.createTextNode(name));
    const buttons = element("div", "dc-vibe-row");
    for (const vibe of vibes.filter((entry) => entry.vibeId[0] === cue)) buttons.append(vibeButton(vibe));
    group.append(label, buttons);
    chart.append(group);
  }
  const description = element("p", "dc-description");
  description.setAttribute("aria-live", "polite");
  const menuDescription = menuRoot ? element("p", "dc-description dc-menu-description") : null;
  if (menuDescription) menuDescription.setAttribute("aria-live", "polite");
  const intensityGroup = intensityControls();
  const storageNote = element("p", "dc-storage-note", "Shortcuts remember submitted speaking turns in this browser.");
  root.append(intro, toolbar, shortcutNote, shortcuts);
  if (menuRoot) {
    menuRoot.setAttribute("aria-label", "All BASED vibes");
    menuRoot.append(chartLabel, menuDescription, intensityControls(), chart);
    menuRoot.append(element("p", "dc-delivery-note", "These describe your manner, not a promised reaction. Read the exact-line preview for the wording used on this turn."));
    chartContainer.replaceChildren(menuRoot);
    menuRoot.addEventListener("click", handleClick);
  } else root.append(chartLabel, chart);
  root.append(description, intensityGroup, storageNote);
  container.replaceChildren(root);
  root.addEventListener("click", handleClick);
  mode.addEventListener("change", handleMode);
  reset.addEventListener("click", handleReset);
  renderShortcuts();
  renderSelection();
  persist();

  function element(tag, className, text) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function intensityControls() {
    const group = element("fieldset", "dc-intensity");
    group.append(element("legend", "", "Intensity"));
    for (const intensity of intensities) {
      const button = element("button", "dc-intensity-button", INTENSITY_LABELS[intensity]);
      button.type = "button";
      button.dataset.intensity = intensity;
      button.title = INTENSITY_SUMMARIES[intensity];
      group.append(button);
    }
    return group;
  }
  function vibeButton(vibe, source) {
    const button = element("button", "dc-vibe");
    button.type = "button";
    button.dataset.vibe = vibe.vibeId;
    button.dataset.cue = vibe.vibeId[0];
    const secondary = element("span", "dc-secondary-dot");
    secondary.dataset.cue = vibe.vibeId[1];
    secondary.setAttribute("aria-hidden", "true");
    button.append(secondary, element("span", "dc-vibe-name", vibe.name));
    const cueName = (cue) => CUES.find(([id]) => id === cue)[1];
    button.setAttribute("aria-label", `${vibe.name}: ${cueName(vibe.vibeId[0])} then ${cueName(vibe.vibeId[1])}${source === "STARTER" ? ", starter approach" : ""}`);
    button.title = vibe.fusionLogic ?? vibe.name;
    if (source === "STARTER") button.append(element("small", "dc-starter", "Starter"));
    return button;
  }
  function renderShortcuts() {
    const entries = deliveryShortcuts(preferences, ids);
    shortcuts.replaceChildren(...entries.map((entry) => vibeButton(vibes.find((vibe) => vibe.vibeId === entry.vibeId), entry.source)));
    const used = entries.filter((entry) => entry.source === "USED").length;
    shortcutNote.textContent = used === 0 ? "Starter approaches — no speaking turns recorded yet."
      : used < 3 ? "Your used vibes appear first; Starter fills unused spaces."
        : preferences.mode === "RECENT" ? "Your three most recently used vibes." : "Your three most used vibes; latest use breaks ties.";
    renderSelection();
  }
  function renderSelection() {
    for (const area of [root, menuRoot].filter(Boolean)) {
      for (const button of area.querySelectorAll("[data-vibe]")) button.setAttribute("aria-pressed", String(button.dataset.vibe === selection.vibeId));
      for (const button of area.querySelectorAll("[data-intensity]")) button.setAttribute("aria-pressed", String(button.dataset.intensity === selection.intensity));
    }
    const vibe = vibes.find((entry) => entry.vibeId === selection.vibeId);
    description.textContent = `${vibe.name} · ${INTENSITY_LABELS[selection.intensity]} — ${vibe.fusionLogic ?? "Selected delivery."} ${INTENSITY_SUMMARIES[selection.intensity]}`;
    if (menuDescription) menuDescription.textContent = description.textContent;
  }
  function persist() {
    const saved = writeDeliveryPreferences(storage, preferences);
    storageNote.textContent = saved ? "Shortcuts remember submitted speaking turns in this browser." : "Browser storage is unavailable; shortcuts work for this page visit.";
  }
  function handleClick(event) {
    const button = event.target.closest("button");
    if (!button || (!root.contains(button) && !menuRoot?.contains(button))) return;
    const next = { ...selection };
    if (button.dataset.vibe) next.vibeId = button.dataset.vibe;
    else if (button.dataset.intensity) next.intensity = button.dataset.intensity;
    else return;
    if (next.vibeId === selection.vibeId && next.intensity === selection.intensity) return;
    selection = next;
    renderSelection();
    if (typeof onChange === "function") onChange({ ...selection });
  }
  function handleMode() {
    preferences = { ...preferences, mode: mode.value };
    persist();
    renderShortcuts();
  }
  function handleReset() {
    preferences = resetDeliveryPreferences(preferences, ids);
    mode.value = preferences.mode;
    persist();
    renderShortcuts();
  }
  return {
    setSelection(next) {
      if (destroyed) return;
      if (!next || !ids.includes(next.vibeId) || !intensities.includes(next.intensity)) throw new Error("Invalid delivery selection.");
      selection = { vibeId: next.vibeId, intensity: next.intensity };
      renderSelection();
    },
    getSelection() { return { ...selection }; },
    recordTurn(turn) {
      if (destroyed) return;
      preferences = recordCommittedDelivery(preferences, turn, ids);
      persist();
      renderShortcuts();
    },
    destroy() {
      destroyed = true;
      root.removeEventListener("click", handleClick);
      menuRoot?.removeEventListener("click", handleClick);
      mode.removeEventListener("change", handleMode);
      reset.removeEventListener("click", handleReset);
      root.remove();
      menuRoot?.remove();
    },
  };
}
