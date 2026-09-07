import test from "node:test";
import assert from "node:assert/strict";
import { BASED_VIBES, DELIVERY_INTENSITIES } from "../src/based.mjs";
import { createState } from "../src/encounter/state.mjs";
import { describeTerms } from "../src/conversation/language/frames.mjs";
import { buildPlayerFrame, renderPlayerFrame } from "../src/conversation/language/realizer.mjs";
import { NPC_REPLY_FAMILIES } from "../src/conversation/language/npc-lines.mjs";

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
