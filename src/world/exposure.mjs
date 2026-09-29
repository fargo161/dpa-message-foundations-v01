import { detached } from "./event-contract.mjs";

/** Exposure is a projection over this holder's records, never over another person's mind. */
export function projectExposure(ledger, perceptions, holderId) {
  if (ledger.entities.find(entity => entity.entityId === holderId)?.role !== "NPC") throw new Error("WORLD_EXPOSURE:NPC holder required");
  const result = [];
  const priorReads = new Map();
  const add = (record, entityId, claim, channel, direction) => {
    if (!entityId || entityId === holderId) return;
    const item = { holder: holderId, entityId, claimId: claim.claimId, resolution: claim.resolution, channel, direction, eventId: record.eventId, supportedBy: [record.perceptionId], category: detached(claim.category) };
    result.push(item);
  };
  for (const record of perceptions.filter(perception => perception.holder === holderId)) {
    if (record.act.outgoingPresentation) {
      const outgoing = record.act.outgoingPresentation;
      for (const claim of priorReads.values()) if (claim.carrier.documentId === outgoing.documentId && outgoing.partIds.includes(claim.carrier.partId)) for (const entityId of outgoing.audienceIds) add(record, entityId, claim, "READ", "RECEIVED");
    }
    if (record.act.addressedDelivery) for (const entityId of record.act.addressedDelivery.audienceIds) for (const claim of record.act.addressedDelivery.claims) add(record, entityId, claim, "TOLD", "RECEIVED");
    if (["P4", "P5"].includes(record.rule)) {
      for (const claim of record.claimsReceived) {
        add(record, record.act.actorId, claim, "TOLD", "PROVIDED");
        for (const entityId of record.act.audienceIds) add(record, entityId, claim, "TOLD", "RECEIVED");
      }
    }
    if (record.rule === "P6") for (const claim of record.claimsReceived) {
      add(record, record.act.actorId, claim, "SHOWN", "PROVIDED");
      for (const entityId of record.act.readAudienceIds ?? []) add(record, entityId, claim, "READ", "RECEIVED");
    }
    if (record.channel === "READ") for (const claim of record.claimsReceived) if (claim.resolution === "EXACT" && claim.carrier?.documentId) priorReads.set(claim.claimId, claim);
  }
  return result;
}
