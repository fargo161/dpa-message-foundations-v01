import test from "node:test";
import assert from "node:assert/strict";
import { BASED_VIBES, DELIVERY_INTENSITIES } from "../src/based.mjs";
import { describeDelivery } from "../src/conversation/delivery-description.mjs";

const selected = { vibeId: "EA", intensity: "BALANCED", action: "ASK", topic: "PRIORITIES", renderingStatus: "AUTHORING_PREVIEW" };

test("all 60 public delivery selections have distinct canonical descriptions without claiming unique dialogue", () => {
  const labels = new Set();
  const descriptions = new Set();
  for (const vibe of BASED_VIBES) for (const intensity of DELIVERY_INTENSITIES) {
    const result = describeDelivery({ ...selected, vibeId: vibe.vibeId, intensity });
    assert.deepEqual(Object.keys(result).sort(), ["applicability", "description", "label", "note"]);
    assert.ok(Object.values(result).every(value => typeof value === "string" && value.length > 0));
    assert.ok(result.label.startsWith(vibe.name));
    assert.ok(result.description.includes(vibe.fusionLogic));
    assert.match(result.note, /Different deliveries can share a sentence/);
    labels.add(result.label);
    descriptions.add(result.description);
  }
  assert.equal(labels.size, 60);
  assert.equal(descriptions.size, 60);
});

test("description is deterministic and ignores hidden state and server-supplied extras", () => {
  const input = Object.freeze({ ...selected,
    get state() { throw new Error("Hidden state read"); },
    get quirk() { throw new Error("Hidden quirk read"); },
    get socialScore() { throw new Error("Hidden score read"); },
  });
  assert.deepEqual(describeDelivery(input), describeDelivery(selected));
  assert.throws(() => describeDelivery({ ...selected, vibeId: "EE" }), /Invalid/);
  assert.throws(() => describeDelivery({ ...selected, intensity: "DOMINANT" }), /Invalid/);
});

test("per-line wording status distinguishes neutral, authored and production fallback honestly", () => {
  assert.match(describeDelivery({ ...selected, renderingStatus: "AUTHORING_PREVIEW_CONTEXT_NEUTRAL" }).note, /Neutral wording/);
  assert.match(describeDelivery({ ...selected, renderingStatus: "PRODUCTION_SAFETY_FALLBACK" }).note, /not approved for production/);
  assert.match(describeDelivery({ ...selected, renderingStatus: undefined }).note, /not been checked/);
  assert.match(describeDelivery({ ...selected, renderingStatus: "UNKNOWN" }).note, /not been checked/);
});

test("fixed actions and fixture questions explain limited applicability without predicting a reaction", () => {
  assert.match(describeDelivery({ ...selected, action: "ACCEPT" }).applicability, /exact current offer.*does not change these terms/);
  assert.match(describeDelivery({ ...selected, action: "WALK" }).applicability, /ending the conversation.*does not change your decision to leave/);
  assert.match(describeDelivery({ ...selected, topic: "CLARIFY_OFFER" }).applicability, /does not improve its terms.*takes a turn/);
  for (const topic of ["EXPLANATION", "ACCOUNTABILITY"]) {
    assert.match(describeDelivery({ ...selected, topic }).applicability, /changes the wording, not the explanation or acknowledgment/);
  }
  assert.match(describeDelivery({ ...selected, action: "DEAL" }).applicability, /does not predict the response/);
});
