import test from "node:test";
import assert from "node:assert/strict";
import { createConversation, resolveConversation, projectConversation, previewConversation } from "../src/conversation/runtime.mjs";
import { informationVariant, r17Interest } from "../src/encounter/marcus-world.mjs";
import { projectPlayerInformation, projectMarcusInformation } from "../src/encounter/marcus-world-adapter.mjs";
import { projectWorld } from "../src/world/projections.mjs";
import { resolveR17Rate, r17ExtraFloor } from "../src/encounter/constants.mjs";
import { evaluateTurn } from "../src/encounter/marcus-policy.mjs";
import { marcusDecisionContext } from "../src/encounter/marcus-world-adapter.mjs";

const mode = { languageMode: "AUTHORING_PREVIEW" };
export const seeds = {};
for (let index = 0; Object.keys(seeds).length < 4 && index < 1000; index++) {
  const seed = `r17-proof-${index}`, key = `${informationVariant(seed)}:${r17Interest(seed)}`;
  seeds[key] ??= seed;
}
const start = (version, cares) => createConversation("marcus", seeds[`${version}:${cares}`], "r17-golden-run");
const terms = { units: 2, upfront: 70, repayment: 50, extra: 0, days: 7 };
const input = (state, fields) => ({ requestId: `r17_test_${state.events.length}`, runId: state.runId, version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields });
const step = (state, fields) => resolveConversation(state, input(state, fields), mode);
const ask = (state, topic, presentation = {}) => step(state, { action: "ASK", topic, ...presentation });
const deal = (state, information = "NONE", offer = terms, presentation = {}) => step(state, { action: "DEAL", information, terms: offer, ...presentation });
const accept = state => step(state, { action: "ACCEPT", offerId: state.counteroffer.id, offerVersion: state.counteroffer.version });
const player = projectPlayerInformation;
const npc = projectMarcusInformation;
const view = state => projectConversation(state, "r17-csrf", mode);
function assertRate(state, rate) {
  const snapshot = view(state);
  assert.equal(snapshot.play.extraChargeRate, rate);
  assert.equal(snapshot.debug.r17.extraChargeRate, rate);
  const offer = state.counteroffer;
  if (offer) {
    assert.equal(offer.extraChargeRate, rate);
    assert.ok(offer.terms.extra >= r17ExtraFloor(offer.terms.repayment, rate));
  }
}

test("R-17 central resolution and ceiling rounding are exact at integer boundaries", () => {
  assert.equal(resolveR17Rate(), 16);
  assert.equal(resolveR17Rate({ shown: true }), 13);
  assert.equal(resolveR17Rate({ blindTradeFailed: true }), 22);
  assert.equal(resolveR17Rate({ shown: true, blindTradeFailed: true }), 19);
  assert.equal(resolveR17Rate({ available: true, includesInformation: true, cares: true }), 8);
  assert.equal(resolveR17Rate({ available: true, includesInformation: true, cares: true, blindTradeFailed: true }), 22);
  for (const rate of [16, 13, 8, 22, 19]) for (const principal of [0, 1, 5, 50, 72, 100, 125, 180]) {
    const floor = r17ExtraFloor(principal, rate);
    assert.equal(floor, Math.floor((principal * rate + 99) / 100));
    assert.ok(floor * 100 >= principal * rate);
    assert.ok(principal === 0 || (floor - 1) * 100 < principal * rate);
  }
  assert.throws(() => r17ExtraFloor(-1, 16));
  assert.throws(() => r17ExtraFloor(1.5, 16));
});

test("R-17 content and interest resolve independently with approximately balanced deterministic samples", () => {
  const counts = { POSITIVE: [0, 0], NEGATIVE: [0, 0] };
  for (let index = 0; index < 2000; index++) {
    const seed = `r17-distribution-${index}`, version = informationVariant(seed), cares = r17Interest(seed);
    counts[version][Number(cares)]++;
    assert.equal(r17Interest(seed), r17Interest(seed));
  }
  for (const values of Object.values(counts)) {
    const ratio = values[1] / (values[0] + values[1]);
    assert.ok(ratio > 0.45 && ratio < 0.55, JSON.stringify(counts));
  }
  assert.equal(Object.keys(seeds).length, 4);
});

for (const version of ["POSITIVE", "NEGATIVE"]) for (const cares of [false, true]) {
  const key = `${version}/${cares ? "CARES" : "DOES_NOT_CARE"}`;
  test(`R-17 ${key}: creation and hoarding disclose nothing and confer no benefit`, () => {
    let state = start(version, cares);
    assert.deepEqual(state, start(version, cares));
    assert.equal(npc(state).caresAboutR17, cares);
    assert.equal(player(state).disclosure, "NONE");
    assert.equal(npc(state).disclosure, "NONE");
    assert.equal(npc(state).bodyClaims.length, 0);
    assert.equal(player(state).r17.interestKnown, false);
    assert.equal(projectWorld(state.world).possession.R17, "PLAYER");
    state = deal(state);
    assertRate(state, 16);
    assert.equal(player(state).r17.held, true);
    assert.equal(npc(state).bodyClaims.length, 0);
    assert.equal(state.events.at(-1).derived.informationBonus, 0);
  });

  test(`R-17 ${key}: Hint honestly learns interest without source, body or economic disclosure`, () => {
    let state = start(version, cares), before = JSON.stringify(state);
    const draft = previewConversation(state, input(state, { action: "ASK", topic: "R17_HINT" }), mode);
    assert.equal(JSON.stringify(state), before);
    assert.doesNotMatch(draft.playerText, /gate C|07:00|07:30|six crates|eight crates/i);
    state = ask(state, "R17_HINT");
    assertRate(state, 16);
    assert.equal(player(state).r17.hinted, true);
    assert.equal(player(state).r17.interestKnown, true);
    assert.equal(player(state).r17.knownMarcusInterest, cares);
    assert.equal(player(state).r17.available, true);
    assert.equal(npc(state).disclosure, "PARTIAL");
    assert.equal(npc(state).bodyClaims.length, 0);
    assert.equal(npc(state).sourceChecked, false);
    const reply = state.events.at(-1).marcusText;
    assert.match(reply, cares ? /Yes.*care|Yes.*matters/ : /don't need|don't care/);
    if (!cares) assert.match(reply, version === "POSITIVE" ? /Depot already called me about the collection change/ : /clerk.*count/);
    assert.equal(view(state).play.edge.card.label, "Hinted");
  });

  test(`R-17 ${key}: Show authentically reveals and spends the card, retaining 13% across counters`, () => {
    let state = ask(start(version, cares), "R17_SHOW", { vibeId: "BA", intensity: "OVERT" });
    assertRate(state, 13);
    assert.equal(npc(state).sourceChecked, true);
    assert.equal(npc(state).content, "DOCUMENT_SUPPORTED");
    assert.equal(npc(state).disclosure, "FULL");
    assert.ok(npc(state).bodyClaims.length > 0);
    assert.equal(player(state).r17.held, true);
    assert.equal(player(state).r17.available, false);
    assert.equal(view(state).play.edge.card.label, "Spent");
    assert.equal(state.informationLocal.negativeWindow, null);
    assert.ok(!state.events.at(-1).informationCauses.some(cause => cause.kind === "DISCLOSURE_BACKLASH"));
    const ids = state.events.at(-1).worldEventIds, batch = state.world.events.filter(event => ids.includes(event.eventId));
    const presentation = batch.find(event => event.kind === "DOCUMENT_PRESENTED");
    assert.deepEqual(presentation.payload.parts, ["header", "signature", "body"]);
    assert.equal(new Set(batch.map(event => event.commitGroup)).size, 1);
    for (let index = 0; index < 3; index++) { state = deal(state); assertRate(state, 13); }
    assert.throws(() => ask(state, "R17_HINT"), /spent|traded|available/i);
    assert.throws(() => deal(state, "OFFER_INFORMATION"), /private exchange|already has/i);
    assert.equal(npc(state).caresAboutR17, cares);
  });

  test(`R-17 ${key}: Hint then Trade has the locked rate and never delivers before confirmation`, () => {
    let state = deal(ask(start(version, cares), "R17_HINT"), "OFFER_INFORMATION");
    assertRate(state, cares ? 8 : 16);
    assert.equal(player(state).r17.blindTradeFailed, false);
    assert.equal(player(state).r17.held, true);
    assert.equal(npc(state).bodyClaims.length, 0);
    if (cares) {
      assert.ok(state.counteroffer.informationExchange);
      const before = JSON.stringify(state);
      previewConversation(state, input(state, { action: "ACCEPT", offerId: state.counteroffer.id, offerVersion: state.counteroffer.version }), mode);
      assert.equal(JSON.stringify(state), before);
      state = accept(state);
      assert.equal(state.status, "AGREED");
      assert.equal(projectWorld(state.world).possession.R17, "MARCUS");
      assert.equal(player(state).r17.held, false);
      assert.equal(player(state).r17.traded, true);
      assert.equal(npc(state).content, "DOCUMENT_SUPPORTED");
      assert.equal(view(state).play.edge.card.label, "Traded");
      assert.equal(view(state).play.edge.card.physicallyHeld, false);
      assert.equal(view(state).options.informationOptions.find(option => option.id === "OFFER_INFORMATION").available, false);
      assertRate(state, 8);
      const ids = state.events.at(-1).worldEventIds, batch = state.world.events.filter(event => ids.includes(event.eventId));
      assert.equal(new Set(batch.map(event => event.commitGroup)).size, 1);
      for (const kind of ["TRANSACTION", "DOCUMENT_PRESENTED", "DOCUMENT_TRANSFERRED", "ENCOUNTER_CLOSED"]) assert.ok(batch.some(event => event.kind === kind));
    } else {
      assert.equal(state.counteroffer.informationExchange, null);
      assert.equal(player(state).r17.available, true);
    }
  });

  test(`R-17 ${key}: blind Trade learns interest and preserves protected ownership`, () => {
    let state = deal(start(version, cares), "OFFER_INFORMATION");
    assertRate(state, cares ? 8 : 22);
    assert.equal(player(state).r17.hinted, false);
    assert.equal(player(state).r17.interestKnown, true);
    assert.equal(player(state).r17.knownMarcusInterest, cares);
    assert.equal(player(state).r17.blindTradeFailed, !cares);
    assert.match(player(state).r17.tradeAttempts[0], /:blind$/);
    assert.equal(npc(state).bodyClaims.length, 0);
    assert.equal(projectWorld(state.world).possession.R17, "PLAYER");
    if (!cares) {
      assert.match(state.events.at(-1).marcusText, /pay for something I don't need|information I don't want/);
      assert.equal(state.events.at(-1).faces.responding.presetId, "GUARDED");
      for (const information of ["NONE", "OFFER_INFORMATION", "OFFER_INFORMATION"]) { state = deal(state, information); assertRate(state, 22); }
      assert.equal(player(state).r17.held, true);
      assert.equal(npc(state).bodyClaims.length, 0);
    }
  });
}

for (const version of ["POSITIVE", "NEGATIVE"]) {
  test(`R-17 ${version}: failed blind Trade, redundant Hint and Show preserve additive consequences`, () => {
    let state = deal(start(version, false), "OFFER_INFORMATION"); assertRate(state, 22);
    state = ask(state, "R17_HINT"); assertRate(state, 22);
    assert.equal(npc(state).bodyClaims.length, 0);
    assert.equal(player(state).r17.blindTradeFailed, true);
    state = ask(state, "R17_SHOW"); assertRate(state, 19);
    assert.equal(player(state).r17.shown, true);
    assert.equal(player(state).r17.blindTradeFailed, true);
    assert.equal(view(state).play.edge.card.label, "Spent");
    for (let index = 0; index < 3; index++) { state = deal(state); assertRate(state, 19); }
    assert.throws(() => deal(state, "OFFER_INFORMATION"));
  });

  test(`R-17 ${version}: removing and readding uncompleted valuable Trade removes and restores only temporary 8%`, () => {
    let state = deal(start(version, true), "OFFER_INFORMATION"); assertRate(state, 8);
    state = deal(state, "NONE"); assertRate(state, 16);
    assert.equal(player(state).r17.held, true);
    state = deal(state, "OFFER_INFORMATION"); assertRate(state, 8);
    assert.equal(npc(state).bodyClaims.length, 0);
    const withdrawn = step(state, { action: "WALK" });
    assert.equal(projectWorld(withdrawn.world).possession.R17, "PLAYER");
    assert.equal(npc(withdrawn).bodyClaims.length, 0);
  });
}

test("R-17 minimum is enforced on otherwise strong approval, including the 22% penalty", () => {
  const failed = deal(start("POSITIVE", false), "OFFER_INFORMATION");
  const context = marcusDecisionContext(failed);
  context.metrics.confidence = 100; context.metrics.tension = 0;
  const low = { action: "DEAL", vibeId: "EA", intensity: "BALANCED", terms: { ...terms, extra: 10 } };
  const effect = { social: { confidence: 0, tension: 0 }, scoreBonus: 0, progressKey: null, exchange: null, r17Rate: 22 };
  const result = evaluateTurn(context, low, effect);
  assert.equal(result.outcome, "COUNTER");
  assert.equal(result.derived.extraFloor, 11);
  assert.deepEqual(result.counterTerms, { ...low.terms, extra: 11 });
  assert.equal(evaluateTurn(context, { ...low, terms: { ...terms, extra: 11 } }, effect).outcome, "ACCEPT");
  for (const rate of [16, 13, 8, 22, 19]) {
    const decision = evaluateTurn(context, { ...low, terms: { ...terms, upfront: 48, repayment: 72, extra: 0 } }, { ...effect, r17Rate: rate });
    assert.equal(decision.outcome, "COUNTER");
    assert.equal(decision.counterTerms.extra, r17ExtraFloor(72, rate));
    assert.deepEqual(Object.fromEntries(Object.entries(decision.counterTerms).filter(([key]) => key !== "extra")), { units: 2, upfront: 48, repayment: 72, days: 7 });
  }
});

test("R-17 valid Hint, Show and Trade resolve across every Vibe and intensity", () => {
  const unwanted = start("NEGATIVE", false), wanted = start("POSITIVE", true);
  const options = view(unwanted).options;
  for (const { vibeId } of options.vibes) for (const intensity of options.intensities) {
    const presentation = { vibeId, intensity };
    const hint = ask(unwanted, "R17_HINT", presentation); assert.equal(resolveR17Rate(player(hint).r17), 16);
    assert.equal(player(hint).r17.knownMarcusInterest, false);
    const shown = ask(unwanted, "R17_SHOW", presentation); assert.equal(resolveR17Rate(player(shown).r17), 13);
    assert.equal(npc(shown).content, "DOCUMENT_SUPPORTED");
    const failed = deal(unwanted, "OFFER_INFORMATION", terms, presentation); assert.equal(failed.events.at(-1).derived.extraChargeRate, 22);
    const valuable = deal(wanted, "OFFER_INFORMATION", terms, presentation);
    assert.equal(valuable.events.at(-1).derived.extraChargeRate, 8);
  }
});
