import { createLedger, createEvent, appendCommit } from "../../src/world/ledger.mjs";
import { createClaim } from "../../src/world/claims.mjs";
import { PROFILE_VERSION, neutralPlayerProfile } from "../../src/world/profiles.mjs";
import { entities, assertion, options, append } from "./world-kernel-fixture.mjs";
export { assertion, options, append };
export const npcProfile = (entityId = "marcus", recognizes = ["depot_mark", "clerk_mark"]) => ({ version: PROFILE_VERSION, entityId, role: "NPC", recognizes, reception: {}, policy: {}, variant: "test" });
export const profileSamples = [neutralPlayerProfile(), npcProfile()];
export function emptyWorld(seed = "subjective") {
  return createLedger({ seed, entities: [...entities, { entityId: "dee", type: "ACTOR", role: "NPC" }, { entityId: "issuer", type: "ACTOR", role: "NPC" }, { entityId: "forger", type: "ACTOR", role: "NPC" }, { entityId: "other_doc", type: "OBJECT" }] });
}
export function issue(ledger, { documentId = "doc", issuerId = "issuer", apparentIssuer = "issuer", count = 6 } = {}) {
  const ids = { header: `${documentId}:issuer`, body: `${documentId}:count` };
  const event = createEvent(ledger, "DOCUMENT_ISSUED", { issuerId, documentId, parts: [{ partId: "header", claimIds: [ids.header], authenticating: true, markId: "depot_mark" }, { partId: "signature", claimIds: [], authenticating: true, markId: "clerk_mark" }, { partId: "body", claimIds: [ids.body], authenticating: false }] }, options({ presentIds: [issuerId], observability: "PRIVATE" }));
  const make = (claimId, partId, proposition) => createClaim({ claimId, proposition, category: { categoryId: "count", label: "A count discrepancy" }, carrier: { documentId, partId }, originEventId: event.eventId });
  return appendCommit(ledger, [event], [make(ids.header, "header", assertion("ISSUED_BY", { subject: documentId, object: apparentIssuer })), make(ids.body, "body", assertion("HAS_ATTRIBUTE", { subject: "intake", attribute: "crates", value: count }))]);
}
export function transfer(ledger, documentId = "doc", fromId = "issuer", toId = "player") {
  return append(ledger, "DOCUMENT_TRANSFERRED", { documentId, fromId, toId }, { presentIds: [fromId, toId] });
}
export function read(ledger, readerId = "player", parts = ["header", "signature", "body"], documentId = "doc") {
  return append(ledger, "DOCUMENT_READ", { readerId, documentId, parts }, { presentIds: [readerId], observability: "PRIVATE" });
}
export function show(ledger, parts = ["body"], audienceIds = ["marcus"], sightlineIds = ["marcus"], documentId = "doc", holderId = "player") {
  return append(ledger, "DOCUMENT_PRESENTED", { holderId, documentId, parts, audienceIds, sightlineIds }, { presentIds: [...new Set([holderId, ...audienceIds, ...sightlineIds, "dee"])] });
}
export function say(ledger, proposition, { speakerId = "player", audienceIds = ["marcus"], earshotIds = [], resolution = "EXACT", claimId = `say:${ledger.events.length}`, category = { categoryId: "count", label: "A count discrepancy" } } = {}) {
  const event = createEvent(ledger, "STATEMENT", { speakerId, audienceIds, earshotIds, resolution, claimIds: [claimId], delivery: { vibeId: "EA", intensity: "BALANCED", landed: 1 } }, options({ presentIds: [...new Set([speakerId, ...audienceIds, ...earshotIds])] }));
  return appendCommit(ledger, [event], [createClaim({ claimId, proposition, category, carrier: { actorId: speakerId }, originEventId: event.eventId })]);
}
