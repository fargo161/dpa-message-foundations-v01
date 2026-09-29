export const WORLD_SCHEMA_VERSION = "trapstar-world@0.1.3";
export const EVENT_KINDS = Object.freeze(["OCCURRENCE", "TRANSACTION", "DOCUMENT_ISSUED", "DOCUMENT_TRANSFERRED", "DOCUMENT_READ", "DOCUMENT_PRESENTED", "STATEMENT", "COMMITMENT_MADE", "COMMITMENT_WINDOW_CLOSED", "ACTIVITY_STARTED", "ACTIVITY_ENDED", "ATTITUDE_SET", "ENCOUNTER_CLOSED"]);
export const ENTITY_TYPES = Object.freeze(["ACTOR", "RESOURCE", "OBJECT", "LOCATION", "ACTION", "PROPOSITION", "SECRET", "OBLIGATION"]);
export const ATTRIBUTE_REGISTRY = Object.freeze({crates: {type: "count", conflict: "EXACT_DIFFERENCE"}, collection_place: {type: "location", conflict: "EXACT_DIFFERENCE"}, collection_window: {type: "time_range", conflict: "EXACT_DIFFERENCE"}, docket: {type: "identifier", conflict: "EXACT_DIFFERENCE"}});
export const ATTITUDE_KEYWORDS = Object.freeze(["NEEDS", "FEARS", "TRUSTS", "RESENTS"]);
export const HARD_KEYWORDS = Object.freeze(["OWNS", "OWES"]);
export const PAYLOAD_FIELDS = Object.freeze({
  OCCURRENCE: ["actorId", "participants", "objectIds", "happened"],
  TRANSACTION: ["fromId", "toId", "hardEffects"],
  DOCUMENT_ISSUED: ["issuerId", "documentId", "parts"],
  DOCUMENT_TRANSFERRED: ["documentId", "fromId", "toId"],
  DOCUMENT_READ: ["readerId", "documentId", "parts"],
  DOCUMENT_PRESENTED: ["holderId", "documentId", "parts", "audienceIds", "sightlineIds"],
  STATEMENT: ["speakerId", "audienceIds", "earshotIds", "claimIds", "resolution", "delivery"],
  COMMITMENT_MADE: ["commitmentId", "promisorId", "promiseeId", "assertion"],
  COMMITMENT_WINDOW_CLOSED: ["commitmentId", "parties", "kept"],
  ACTIVITY_STARTED: ["activityId", "actorId", "label", "holds"],
  ACTIVITY_ENDED: ["activityId", "actorId"],
  ATTITUDE_SET: ["holderId", "assertion"],
  ENCOUNTER_CLOSED: ["encounterId", "participantIds", "outcome"],
});
export const ACTOR_FIELDS = Object.freeze({OCCURRENCE:"actorId", TRANSACTION:"fromId", DOCUMENT_ISSUED:"issuerId", DOCUMENT_TRANSFERRED:"fromId", DOCUMENT_READ:"readerId", DOCUMENT_PRESENTED:"holderId", STATEMENT:"speakerId", COMMITMENT_MADE:"promisorId", ACTIVITY_STARTED:"actorId", ACTIVITY_ENDED:"actorId", ATTITUDE_SET:"holderId"});
export function eventIdFor(seed, seq) { return `world:${encodeURIComponent(String(seed))}:${seq}`; }
export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
export function detached(value) { return JSON.parse(JSON.stringify(value)); }
export function freezeTree(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freezeTree); Object.freeze(value); }
  return value;
}
export function actorForEvent(ledger, event) {
  if (event.kind === "COMMITMENT_WINDOW_CLOSED") return ledger.events.find(e => e.kind === "COMMITMENT_MADE" && e.payload.commitmentId === event.payload.commitmentId)?.payload.promisorId ?? null;
  return event.payload[ACTOR_FIELDS[event.kind]] ?? null;
}
