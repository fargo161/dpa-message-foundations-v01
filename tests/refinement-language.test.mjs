import test from "node:test";
import assert from "node:assert/strict";
import { createState } from "../src/encounter/state.mjs";
import { transition, previewIntent } from "../src/encounter/engine.mjs";
import { renderAuthoredFixtureLine } from "../src/conversation/language/realizer.mjs";

function fresh(variant) {
  for (let index = 0; index < 100; index++) {
    const state = createState(`refinement-language-${index}`, "language-refinement");
    if (state.lore.variant === variant) return state;
  }
  throw new Error("No fixture");
}
function ask(state, topic) {
  const intent = { requestId: `language-turn-${state.events.length}`, runId: state.runId, version: state.events.length, action: "ASK", topic, vibeId: "EA", intensity: "SUBTLE" };
  const before = structuredClone(state);
  const preview = previewIntent(state, intent, { languageMode: "AUTHORING_PREVIEW" });
  assert.deepEqual(state, before);
  const next = transition(state, intent, { languageMode: "AUTHORING_PREVIEW" });
  assert.equal(next.events.at(-1).playerText, preview.playerText);
  return next;
}

test("refinement language: late source and usefulness acknowledge irreversible disclosure in both variants", () => {
  for (const variant of ["POSITIVE", "NEGATIVE"]) {
    let state = ask(fresh(variant), "DISCLOSE_FULL");
    state = ask(state, "VERIFY_SOURCE");
    let event = state.events.at(-1);
    assert.match(event.playerText, /detail I already showed you/);
    assert.doesNotMatch(event.playerText, /keeping.*covered/);
    assert.match(event.feedback, /cannot restore.*or reopen/);
    assert.match(event.marcusText, /detail you (already )?showed me/);
    state = ask(state, "PROBE_USEFULNESS");
    event = state.events.at(-1);
    assert.match(event.playerText, /I showed you/);
    assert.match(event.feedback, /does not restore.*or reopen/);
    if (variant === "NEGATIVE") {
      state = ask(state, "QUESTION_RECORD");
      event = state.events.at(-1);
      assert.match(event.feedback, /cannot replay the reveal/);
      assert.doesNotMatch(event.feedback, /could now redirect/);
      assert.equal(state.lore.negativeWindow, null);
    }
  }
});

test("refinement language: repeated factual inquiries do not claim fresh progress", () => {
  for (const topic of ["SMALL_TALK", "ACK_MISSED", "VERIFY_SOURCE", "PROBE_USEFULNESS", "QUESTION_RECORD"]) {
    let state = fresh(topic === "QUESTION_RECORD" ? "NEGATIVE" : "POSITIVE");
    state = ask(state, topic);
    const progress = [...state.lore.progressKeys];
    state = ask(state, topic);
    assert.match(state.events.at(-1).feedback, /already/);
    assert.match(state.events.at(-1).feedback, /no new/);
    assert.deepEqual(state.lore.progressKeys, progress);
  }
});

test("refinement language: generic fixture reports context-neutral fallback honestly", () => {
  const line = "You missed the meeting. Can you acknowledge that?";
  const options = { mode: "AUTHORING_PREVIEW", vibeId: "DB", intensity: "BALANCED" };
  assert.equal(renderAuthoredFixtureLine(line, options).readiness, "AUTHORING_PREVIEW_CONTEXT_NEUTRAL");
  assert.equal(renderAuthoredFixtureLine(line, { ...options, mode: "PRODUCTION" }).text, line);
});
