import { keywordBank } from "./keyword-bank.mjs";

/** Resolve from current authoritative knowledge, never from a client-supplied card. */
export function resolveContextAction(state, keywordId, contextActionId) {
  if (typeof keywordId !== "string" || typeof contextActionId !== "string") throw new Error("Keyword and contextual action must be identifiers.");
  const keyword = keywordBank(state).find(card => card.id === keywordId);
  if (!keyword) throw new Error("Unknown or unavailable keyword.");
  const action = keyword.actions.find(option => option.id === contextActionId);
  if (!action) throw new Error("This action does not belong to the selected keyword.");
  if (!action.available) throw new Error(action.reason);
  return structuredClone(action.intent);
}
