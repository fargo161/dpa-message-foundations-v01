export const CONVERSATION_VERSION = "conversation-system@0.1";
export const SCENARIO_OPTIONS = Object.freeze([
  Object.freeze({ id: "marcus", label: "Marcus — the Contra deal", kind: "NEGOTIATION" }),
  Object.freeze({ id: "broken-promise", label: "Avery — the broken promise (fixture)", kind: "CONVERSATION" }),
]);

export function languageReadiness(mode) {
  if (!["AUTHORING_PREVIEW", "PRODUCTION"].includes(mode)) throw new Error("Unknown language mode.");
  return {
    mode,
    state: mode === "AUTHORING_PREVIEW" ? "REVIEW_REQUIRED" : "AUTHORED_FALLBACK",
    productionProtocolsApproved: 0,
    label: mode === "AUTHORING_PREVIEW" ? "Language preview — authored wording awaiting review" : "Existing authored wording",
  };
}
