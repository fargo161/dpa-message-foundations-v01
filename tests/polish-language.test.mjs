import test from "node:test";
import assert from "node:assert/strict";
import { BASED_VIBES, DELIVERY_INTENSITIES } from "../src/based.mjs";
import { createState } from "../src/encounter/state.mjs";
import { describeTerms } from "../src/conversation/language/frames.mjs";
import { buildPlayerFrame, renderPlayerFrame } from "../src/conversation/language/realizer.mjs";
import { NPC_REPLY_FAMILIES } from "../src/conversation/language/npc-lines.mjs";
import { transition } from "../src/encounter/engine.mjs";
import { playerMessage } from "../src/encounter/messages.mjs";
import { buildNpcFrame, renderNpcFrame } from "../src/conversation/language/realizer.mjs";

test("polish: natural singular/plural terms retain every financial value", () => {
  assert.equal(describeTerms({ units: 1, upfront: 20, repayment: 40, extra: 3, days: 1 }), "1 Contra unit, $20 upfront, $40 in new credit plus $3 extra due in 1 day");
  assert.equal(describeTerms({ units: 2, upfront: 40, repayment: 80, extra: 10, days: 7 }), "2 Contra units, $40 upfront, $80 in new credit plus $10 extra due in 7 days");
});

test("polish: fixed-state shortcut delivery has different rhythms without different facts", () => {
  const state = createState("polish-language", "polish-language-run");
  const before = structuredClone(state);
  const frame = buildPlayerFrame(state, { action: "ASK", topic: "TERMS" });
  for (const variantSeed of [0, 1]) {
    const lines = ["EA", "AE", "SA"].map(vibeId => renderPlayerFrame(frame, { vibeId, intensity: "BALANCED", mode: "AUTHORING_PREVIEW", variantSeed }).text);
    assert.equal(new Set(lines).size, 3, "shortcut previews should not collapse into the same opening beat");
    for (const vibe of BASED_VIBES) {
      const intensities = DELIVERY_INTENSITIES.map(intensity => renderPlayerFrame(frame, { vibeId: vibe.vibeId, intensity, mode: "AUTHORING_PREVIEW", variantSeed }).text);
      assert.equal(new Set(intensities).size, 3, `${vibe.vibeId} intensity should change visible salience`);
      for (const line of intensities) {
        assert.ok(line.endsWith(frame.text));
        assert.doesNotMatch(line.slice(0, -frame.text.length), /promise|guarantee|owe|agree|threat|\d/i);
      }
    }
  }
  assert.deepEqual(state, before);
});

test("polish: concise information replies retain uncertainty and no automatic agreement", () => {
  for (const line of NPC_REPLY_FAMILIES.RELEVANCE_COUNT({ shared: true })) {
    assert.match(line, /doesn't/);
    assert.match(line, /caused|responsible/);
    assert.match(line, /isn't a deal|settle our terms/);
  }
  for (const line of NPC_REPLY_FAMILIES.OPPORTUNITY_OPENED()) assert.match(line, /not saying yes|don't have a deal/);
  for (const line of NPC_REPLY_FAMILIES.TERMS()) assert.match(line, /can help/);
});

test("review: repeated clarification signals actual dwindling patience without changing the offer or ledger", () => {
  let state = createState("independent-lore-1", "patience-language-run");
  const step = fields => transition(state, { runId: state.runId, requestId: `patience_${state.events.length}`, version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields });
  state = step({ action: "DEAL", terms: { units: 2, upfront: 40, repayment: 80, extra: 10, days: 7 }, information: "NONE" });
  const offer = structuredClone(state.counteroffer);
  assert.ok(offer);
  const ledger = structuredClone(state.obligations);
  const warnings = new Set();
  while (state.status === "OPEN") {
    state = step({ action: "ASK", topic: "CLARIFY_OFFER" });
    assert.deepEqual(state.obligations, ledger);
    assert.equal(state.metrics.cash, 80);
    assert.equal(state.metrics.playerStock, 0);
    assert.equal(state.lore.knowledge.marcus.includes(state.lore.privateFactId), false);
    const reply = state.events.at(-1).marcusText;
    if (state.status === "OPEN") {
      assert.deepEqual(state.counteroffer, offer);
      assert.match(reply, /terms|offer/);
      assert.ok(reply.includes(describeTerms(offer.terms)));
      if (state.metrics.patience <= 3) { assert.match(reply, /almost out of patience/); warnings.add("last"); }
      else if (state.metrics.patience <= 6) { assert.match(reply, /running out of patience/); warnings.add("low"); }
      else if (state.metrics.patience <= 12) { assert.match(reply, /going in circles/); warnings.add("middle"); }
    } else {
      assert.equal(state.status, "ENDED");
      assert.equal(state.metrics.patience, 0);
      assert.match(reply, /terms again and again|repeat the offer/);
      assert.match(reply, /out of patience/);
    }
  }
  assert.equal(warnings.size, 3);
});

test("review: both end phrasings distinguish patience from tension without inventing repeated clarification", () => {
  const state = createState("ending-language", "ending-language-run");
  for (const [patience, tension, expected, excluded] of [[0, 20, /patience/, /repeat the offer|terms again/], [5, 90, /tense|heated/, /patience/]]) {
    state.metrics.patience = patience;
    state.metrics.tension = tension;
    const before = structuredClone(state);
    const frame = buildNpcFrame(state, { action: "ASK", topic: "DEBT" }, { outcome: "END" });
    for (const variantSeed of [0, 1]) {
      const text = renderNpcFrame(frame, { mode: "AUTHORING_PREVIEW", variantSeed }).text;
      assert.match(text, expected);
      assert.doesNotMatch(text, excluded);
    }
    assert.deepEqual(state, before);
  }
});

test("review: conditional clarification and fallback acceptance punctuate the exchange once", () => {
  const terms = { units: 2, upfront: 40, repayment: 80, extra: 10, days: 7 };
  const summary = "Exact depot collection instructions: gate, time window and docket; delivered on acceptance.";
  for (const reply of NPC_REPLY_FAMILIES.CLARIFY({ terms: describeTerms(terms), exchange: summary })) {
    assert.ok(reply.includes(summary));
    assert.doesNotMatch(reply, /acceptance\.\./);
  }
  assert.doesNotMatch(playerMessage({ action: "ACCEPT", vibeId: "EA", intensity: "BALANCED" }, { offer: { terms, informationExchange: { summary } } }), /acceptance\.\./);
});
