import { BASED_VIBES, DELIVERY_INTENSITIES } from "../based.mjs";
import { EncounterError, exactObject, validateIdentity } from "../encounter/engine.mjs";
import { openingFace, buildFaceTurn } from "./face/policy.mjs";
import { SCENARIO_OPTIONS, languageReadiness } from "./contracts.mjs";
import { renderAuthoredFixtureLine } from "./language/realizer.mjs";
import { describeDelivery } from "./delivery-description.mjs";

// An intentionally bounded, newly authored portability fixture. Avery's explanation
// is a reported claim, not independent evidence that the explanation is true.
const character = Object.freeze({ id: "avery", name: "Avery (conversation fixture)" });
const opening = "Avery promised to meet you yesterday and did not arrive. You have not heard an explanation.";
const actionDefinitions = Object.freeze([
  { id: "ask-explanation", label: "Ask what happened", description: "Ask Avery to explain the missed meeting.", intent: { action: "ASK", topic: "EXPLANATION" } },
  { id: "ask-accountability", label: "Ask them to acknowledge it", description: "Name the missed commitment without adding a threat or demanding a new promise.", intent: { action: "ASK", topic: "ACCOUNTABILITY" } },
  { id: "walk-away", label: "Leave the conversation", description: "Finish this conversation without a transaction.", intent: { action: "WALK" } },
]);
const playerLines = Object.freeze({
  EXPLANATION: "You said you would meet me, but you did not arrive. What happened?",
  ACCOUNTABILITY: "You missed the meeting. Can you acknowledge that?",
  WALK: "I am leaving this conversation.",
});

export function createBrokenPromiseState(seed, runId) {
  return { schemaVersion: "conversation-fixture@0.1", scenarioId: "broken-promise", seed, runId,
    status: "OPEN", events: [], knowledge: [opening], statements: [] };
}

function fixtureBank(state) {
  return [{ id: "missed-meeting", label: "The missed meeting", kind: "SHARED_HISTORY", summary: opening,
    actions: actionDefinitions.map(action => ({ ...structuredClone(action), available: state.status === "OPEN", reason: state.status === "OPEN" ? "Available." : "This conversation has ended." })) },
  ...state.statements.map(statement => ({ id: statement.id, label: statement.label, kind: "REPORTED_CLAIM", summary: statement.text,
    actions: actionDefinitions.filter(a => a.id !== "ask-explanation").map(action => ({ ...structuredClone(action), available: state.status === "OPEN", reason: state.status === "OPEN" ? "Available." : "This conversation has ended." })) }))];
}

function validateFixture(state, input) {
  const fields = input?.action === "ASK" ? ["topic"] : input?.action === "WALK" ? [] : null;
  if (!fields) throw new EncounterError("This conversation supports questions or leaving, not financial offers.");
  const context = Object.hasOwn(input, "keywordId") || Object.hasOwn(input, "contextActionId") ? ["keywordId", "contextActionId"] : [];
  exactObject(input, ["requestId", "runId", "version", "action", "vibeId", "intensity", ...fields, ...context]);
  validateIdentity(state, input);
  if (state.status !== "OPEN") throw new EncounterError("This conversation has ended.", 409);
  if (!BASED_VIBES.some(v => v.vibeId === input.vibeId) || !DELIVERY_INTENSITIES.includes(input.intensity)) throw new EncounterError("Unknown delivery selection.");
  if (input.action === "ASK" && !["EXPLANATION", "ACCOUNTABILITY"].includes(input.topic)) throw new EncounterError("Unknown conversation question.");
  if (context.length) {
    const card = fixtureBank(state).find(k => k.id === input.keywordId);
    const action = card?.actions.find(a => a.id === input.contextActionId && a.available);
    if (!action || Object.entries(action.intent).some(([key, value]) => input[key] !== value)) throw new EncounterError("Unknown or mismatched subject and action.");
  }
}

export function previewBrokenPromise(state, input, { languageMode = "PRODUCTION" } = {}) {
  validateFixture(state, input);
  const line = renderAuthoredFixtureLine(playerLines[input.action === "WALK" ? "WALK" : input.topic], { vibeId: input.vibeId, intensity: input.intensity, mode: languageMode, variantSeed: `${state.seed}:${state.events.length}` });
  return { runId: state.runId, version: state.events.length, playerText: line.text,
    delivery: { vibeId: input.vibeId, intensity: input.intensity }, readiness: languageReadiness(languageMode), renderingStatus: line.readiness,
    deliveryDescription: describeDelivery({ vibeId: input.vibeId, intensity: input.intensity, action: input.action, topic: input.topic, renderingStatus: line.readiness }) };
}

export function transitionBrokenPromise(state, input, options = {}) {
  const preview = previewBrokenPromise(state, input, options);
  const next = structuredClone(state);
  const index = state.events.length + 1;
  const repeated = state.events.some(e => e.intent.topic === input.topic && input.action === "ASK");
  let reply;
  if (input.action === "WALK") {
    next.status = "WITHDRAWN";
    reply = "All right. We can leave it here.";
  } else if (index >= 6) {
    next.status = "ENDED";
    reply = "I have nothing more to add right now. Let's leave it here.";
  } else if (repeated) reply = "I have answered that. Repeating the question does not give me anything new to add.";
  else if (input.topic === "EXPLANATION") {
    reply = "The bus broke down. I should have found a way to let you know.";
    next.statements.push({ id: "avery-explanation", label: "Avery's explanation", text: "Avery says the bus broke down and that they should have let you know. You have not independently checked that explanation." });
  } else reply = "Yes. I said I would be there, and I wasn't. You were left waiting.";
  const outcome = next.status === "WITHDRAWN" ? "WITHDRAWN" : next.status === "ENDED" ? "END" : "ANSWER";
  const event = { characterId: character.id, intent: structuredClone(input), playerText: preview.playerText, marcusText: reply,
    outcome, feedback: input.topic === "EXPLANATION" && !repeated && next.status === "OPEN" ? "You heard Avery's explanation. It remains their account of what happened." : "No resources or new promises changed hands.",
    deltas: {}, reactionCause: { schemaVersion: "conversation-reaction-cause@0.1", turnRef: { runId: state.runId, index },
      semanticIntent: { action: input.action, topic: input.topic }, consequences: { outcome, transfersCommitted: false, informationCauses: [] },
      continuity: { previousTurnRef: index > 1 ? { runId: state.runId, index: index - 1 } : null, status: next.status, phase: next.status === "OPEN" ? "CONVERSATION" : "RESOLUTION" } }, faces: null };
  event.faces = buildFaceTurn(event, state.events.at(-1)?.faces?.responding ?? openingFace(character.id));
  next.events.push(event);
  return next;
}

export function projectBrokenPromise(state, csrf, { languageMode = "PRODUCTION" } = {}) {
  return { csrf,
    play: { runId: state.runId, version: state.events.length, seed: state.seed, status: state.status, character, scenario: SCENARIO_OPTIONS[1],
      edge: null, situation: { summary: opening, objective: "Ask what happened, ask for acknowledgment, or choose to leave. Avery's explanation remains an unverified account." },
      face: structuredClone(state.events.at(-1)?.faces?.responding ?? openingFace(character.id)), metrics: {}, obligations: null, proposal: null, counteroffer: null, agreement: null, clues: [],
      lore: { briefing: [opening], playerKnowledge: [...state.knowledge], disclosed: [], evidence: state.statements.map(s => s.text), informationOptions: [] },
      conversation: { phase: state.status === "OPEN" ? "CONVERSATION" : "RESOLUTION", opening: [opening], nextSteps: ["Choose a known subject and decide what to say."], outcomeQuality: null },
      events: state.events.map(e => ({ playerText: e.playerText, marcusText: e.marcusText, outcome: e.outcome, feedback: e.feedback, turnRef: e.reactionCause.turnRef,
        action: e.intent.action, vibeId: e.intent.vibeId, intensity: e.intent.intensity, faces: structuredClone(e.faces) })),
      availableActions: ["ASK", "WALK"].map(action => ({ action, available: state.status === "OPEN", reason: state.status === "OPEN" ? "Available." : "Conversation ended." })) },
    debug: { state: structuredClone(state), latestTurn: state.events.at(-1) ?? null, personality: { fixture: true, note: "Newly authored non-commercial proof. No social scoring or production character art." } },
    options: { vibes: BASED_VIBES, intensities: DELIVERY_INTENSITIES, topics: actionDefinitions.filter(a => a.intent.topic).map(a => ({ id: a.intent.topic, label: a.label, available: state.status === "OPEN" })),
      informationOptions: [], metricDefinitions: [], price: null, keywords: fixtureBank(state), faceCatalog: null, scenarios: SCENARIO_OPTIONS, languageReadiness: languageReadiness(languageMode) } };
}
