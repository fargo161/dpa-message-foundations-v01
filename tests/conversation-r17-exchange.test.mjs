import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createConversation, resolveConversation, projectConversation, previewConversation } from "../src/conversation/runtime.mjs";
import { informationVariant, r17Interest } from "../src/encounter/marcus-world.mjs";
import { resolveContextAction } from "../src/conversation/context-actions.mjs";
import { projectPlayerInformation } from "../src/encounter/marcus-world-adapter.mjs";
import { r17StandardExtra } from "../src/encounter/constants.mjs";
const mode = { languageMode: "AUTHORING_PREVIEW" };
const seeds = {};
for (let index = 0; Object.keys(seeds).length < 4; index++) {
  const seed = `r17-proof-${index}`;
  seeds[`${informationVariant(seed)}:${r17Interest(seed)}`] ??= seed;
}
const start = (version, cares) => createConversation("marcus", seeds[`${version}:${cares}`], "r17-public-test");
const input = (state, fields) => ({ requestId: `public_r17_${state.events.length}`, runId: state.runId, version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields });
const step = (state, fields) => resolveConversation(state, input(state, fields), mode);
const view = state => projectConversation(state, "csrf", mode);
const available = state => view(state).options.informationOptions.find(option => option.id === "OFFER_INFORMATION").available;
const terms = { units: 2, upfront: 70, repayment: 50, extra: 0, days: 7 };

test("R-17 surface exposes exactly Hint, Show and Trade for both content versions", () => {
  for (const version of ["POSITIVE", "NEGATIVE"]) for (const cares of [false, true]) {
    const state = start(version, cares), snapshot = view(state), before = JSON.stringify(state);
    const card = snapshot.options.keywords.find(card => card.id === "depot-counterfoil");
    assert.deepEqual(card.actions.map(action => action.label), ["Hint", "Show", "Trade"]);
    assert.ok(card.actions.every(action => action.available));
    assert.equal(available(state), true);
    for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS", "DISCLOSE_PARTIAL", "DISCLOSE_FULL", "QUESTION_RECORD"]) {
      assert.ok(!snapshot.options.topics.some(option => option.id === topic));
      assert.ok(!snapshot.options.keywords.flatMap(card => card.actions).some(action => action.intent.topic === topic));
    }
    assert.equal(snapshot.play.edge.card.label, "Held");
    assert.equal(snapshot.play.edge.relevance.id, "UNTESTED");
    assert.equal(snapshot.play.edge.source, undefined);
    assert.equal(snapshot.play.edge.opening, undefined);
    assert.equal(JSON.stringify(state), before);
    for (const action of card.actions) assert.deepEqual(resolveContextAction(state, card.id, action.id), action.intent);
  }
});

test("R-17 builder availability follows ownership and leverage rather than interest or preparation", () => {
  for (const version of ["POSITIVE", "NEGATIVE"]) for (const cares of [false, true]) {
    const initial = start(version, cares);
    const hinted = step(initial, { action: "ASK", topic: "R17_HINT" });
    assert.equal(available(hinted), true);
    const shown = step(hinted, { action: "ASK", topic: "R17_SHOW" });
    assert.equal(available(shown), false);
    assert.ok(view(shown).options.keywords.find(card => card.id === "depot-counterfoil").actions.every(action => !action.available));
    const attempted = step(initial, { action: "DEAL", information: "OFFER_INFORMATION", terms });
    assert.equal(available(attempted), true);
    if (cares) {
      const completed = step(attempted, { action: "ACCEPT", offerId: attempted.counteroffer.id, offerVersion: attempted.counteroffer.version });
      assert.equal(available(completed), false);
      assert.equal(projectPlayerInformation(completed).holdings.includes("R17"), false);
      assert.equal(view(completed).play.edge.card.label, "Traded");
    } else {
      assert.equal(view(attempted).play.extraChargeRate, 22);
      assert.equal(view(attempted).play.edge.card.label, "Held");
      assert.match(view(attempted).play.edge.note, /physically held.*penalty remains/);
    }
  }
});

test("R-17 previews do not probe, spend, transfer, penalize or select future reactions", () => {
  const state = start("NEGATIVE", false), before = JSON.stringify(state);
  for (const fields of [{ action: "ASK", topic: "R17_HINT" }, { action: "ASK", topic: "R17_SHOW" }, { action: "DEAL", information: "OFFER_INFORMATION", terms }]) {
    const request = input(state, fields), draft = previewConversation(state, request, mode);
    assert.equal(JSON.stringify(state), before);
    assert.equal(draft.faces, undefined);
    const committed = resolveConversation(state, request, mode);
    assert.equal(committed.events.at(-1).playerText, draft.playerText);
  }
});

test("R-17 reactions distinctly express interest, disinterest, Show goodwill, concession and annoyance", () => {
  const reactions = [
    [step(start("POSITIVE", true), { action: "ASK", topic: "R17_HINT" }), "LEANING_IN"],
    [step(start("POSITIVE", false), { action: "ASK", topic: "R17_HINT" }), "ATTENTIVE"],
    [step(start("NEGATIVE", false), { action: "ASK", topic: "R17_SHOW" }), "WARM_ACKNOWLEDGMENT"],
    [step(start("NEGATIVE", true), { action: "DEAL", information: "OFFER_INFORMATION", terms }), "READY_TO_AGREE"],
    [step(start("NEGATIVE", false), { action: "DEAL", information: "OFFER_INFORMATION", terms }), "GUARDED"],
  ];
  for (const [state, preset] of reactions) assert.equal(state.events.at(-1).faces.responding.presetId, preset);
  assert.equal(new Set(reactions.map(([state]) => state.events.at(-1).faces.responding.presetId)).size, 5);
});

test("actual UI render functions show Held, Spent, Traded, retained-card penalty and authoritative percentages", () => {
  const source = readFileSync(new URL("../public/encounter/app.js", import.meta.url), "utf8");
  function renderer(snapshot) {
    const elements = new Map();
    const node = (tag, text = "") => ({ tag, own: String(text), children: [], append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.own = ""; this.children = items; },
      get textContent() { return this.own + this.children.map(item => item.textContent).join(" "); }, set textContent(text) { this.own = String(text); this.children = []; } });
    const $ = id => { if (!elements.has(id)) elements.set(id, node("div")); return elements.get(id); };
    const context = vm.createContext({ snapshot, node, $, r17StandardExtra, offer: () => snapshot.play.counteroffer, character: () => ({ name: "Marcus" }),
      termKeys: ["units", "upfront", "repayment", "extra", "days"], names: {}, document: { querySelector: () => node("div") } });
    for (const name of ["termTable", "renderEdge", "renderOffer"]) {
      const remainder = source.slice(source.indexOf(`function ${name}(`)), end = name === "renderEdge" ? remainder.indexOf("\nconst turnPlayer") : remainder.search(/\n(?:async )?function /);
      vm.runInContext(remainder.slice(0, end), context);
    }
    vm.runInContext("renderEdge(); renderOffer();", context);
    return { edge: $("edge-note").textContent, offer: $("current-offer").textContent };
  }
  const initial = start("POSITIVE", false);
  assert.match(renderer(view(initial)).edge, /Your edge: Held/);
  const failure = step(initial, { action: "DEAL", information: "OFFER_INFORMATION", terms });
  const failedText = renderer(view(failure));
  assert.match(failedText.edge, /physically held.*penalty remains/);
  assert.match(failedText.offer, /22% of new credit/);
  const shown = step(failure, { action: "ASK", topic: "R17_SHOW" });
  assert.match(renderer(view(shown)).edge, /Your edge: Spent/);
  const later = step(shown, { action: "DEAL", information: "NONE", terms });
  assert.match(renderer(view(later)).offer, /19% of new credit/);
  const offered = step(start("NEGATIVE", true), { action: "DEAL", information: "OFFER_INFORMATION", terms });
  const traded = step(offered, { action: "ACCEPT", offerId: offered.counteroffer.id, offerVersion: offered.counteroffer.version });
  assert.match(renderer(view(traded)).edge, /Your edge: Traded/);
});
