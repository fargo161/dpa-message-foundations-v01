import { createState } from "../encounter/state.mjs";
import { selectQuirk } from "../encounter/marcus-profile.mjs";
import { transition, projectState, previewIntent, EncounterError } from "../encounter/engine.mjs";
import { createBrokenPromiseState, transitionBrokenPromise, previewBrokenPromise, projectBrokenPromise } from "./scenarios.mjs";

// Transport and UI use this interface without requiring any scenario's metrics.
const adapters = Object.freeze({
  marcus: { create: (seed, runId) => ({ ...createState(seed, runId, selectQuirk(seed)), scenarioId: "marcus" }), transition, preview: previewIntent, project: projectState },
  "broken-promise": { create: createBrokenPromiseState, transition: transitionBrokenPromise, preview: previewBrokenPromise, project: projectBrokenPromise },
});

function adapter(id) {
  if (typeof id !== "string" || !Object.hasOwn(adapters, id)) throw new EncounterError("Unknown conversation scenario.");
  return adapters[id];
}
export function createConversation(scenarioId, seed, runId) { return adapter(scenarioId).create(seed, runId); }
export function resolveConversation(state, input, options) { return adapter(state.scenarioId ?? "marcus").transition(state, input, options); }
export function previewConversation(state, input, options) { return adapter(state.scenarioId ?? "marcus").preview(state, input, options); }
export function projectConversation(state, csrf, options) { return adapter(state.scenarioId ?? "marcus").project(state, csrf, options); }
