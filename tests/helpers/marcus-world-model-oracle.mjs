import { createConversation, resolveConversation, projectConversation } from "../../src/conversation/runtime.mjs";
import { buildNpcFrame } from "../../src/conversation/language/npc-lines.mjs";

export const ORACLE_MODE = "AUTHORING_PREVIEW";
const json = value => JSON.parse(JSON.stringify(value));
const turnFields = ["intent", "playerText", "marcusText", "outcome", "before", "after", "deltas", "reasons", "based", "derived", "progressKey", "informationCauses", "feedback", "reactionCause", "characterId", "faces"];

/** Capture compatibility observations, not the new world's internal representation. */
export function oracleSnapshot(state) {
  const projected = projectConversation(state, "frozen-oracle-csrf", { languageMode: ORACLE_MODE });
  const lore = state.lore;
  const turn = state.events.at(-1);
  return json({
    play: projected.play,
    options: projected.options,
    legacy: {
      knowledge: lore.knowledge, beliefs: lore.beliefs, disclosure: lore.disclosure,
      evidence: lore.evidence, privateFactId: lore.privateFactId,
      progressKeys: lore.progressKeys, negativeWindow: lore.negativeWindow,
    },
    outcome: {
      status: state.status, metrics: state.metrics, obligations: state.obligations,
      proposal: state.proposal, counteroffer: state.counteroffer, agreement: state.agreement,
      quirk: state.quirk, variant: lore.variant,
      replyFamily: turn ? buildNpcFrame({ ...state, events: state.events.slice(0, -1) }, turn.intent,
        { ...turn, counterTerms: state.counteroffer?.terms }).family : null,
      lastTurn: turn ? Object.fromEntries(turnFields.map(key => [key, turn[key]])) : null,
    },
  });
}

export function replayOracleRun(run) {
  let state = createConversation("marcus", run.seed, "frozen-marcus-oracle");
  const snapshots = [oracleSnapshot(state)];
  const inputs = [];
  for (const [index, step] of run.steps.entries()) {
    // Existing historical paired control: this is encounter-local opportunity state,
    // never a knowledge edit. The corpus explicitly records this intervention.
    if (step.control === "REMOVE_NEGATIVE_WINDOW") {
      state = structuredClone(state);
      state.lore.negativeWindow = null;
    }
    const input = { requestId: `frozen_oracle_${index}`, runId: state.runId, version: state.events.length,
      vibeId: "EA", intensity: "BALANCED", ...step.intent };
    if (input.action === "ACCEPT") {
      input.offerId = state.counteroffer.id;
      input.offerVersion = state.counteroffer.version;
    }
    inputs.push(json(input));
    state = resolveConversation(state, input, { languageMode: ORACLE_MODE });
    snapshots.push(oracleSnapshot(state));
  }
  return { inputs, snapshots };
}
