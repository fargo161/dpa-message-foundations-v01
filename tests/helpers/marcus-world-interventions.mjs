import { createLedger, createEvent, appendCommit } from "../../src/world/ledger.mjs";
import { projectMarcusEconomy, advanceMarcusWorld, worldAssertion } from "../../src/encounter/marcus-world.mjs";

/** Test-only alternate history, replayed through ordinary validation; no runtime override store. */
export function rewriteMarcusHistory(state, transform, claimTransform = claim => claim) {
  let world = createLedger({ seed: state.world.seed, entities: state.world.entities });
  const groups = [];
  for (const original of state.world.events) {
    const changed = transform(structuredClone(original));
    const entries = changed ? Array.isArray(changed) ? changed : [changed] : [];
    for (const entry of entries) groups.push({ entry, original });
  }
  for (let index = 0; index < groups.length;) {
    const first = groups[index], group = first.entry.commitGroup;
    const batch = [first]; index++;
    if (group) while (index < groups.length && groups[index].entry.commitGroup === group) batch.push(groups[index++]);
    const events = [], claims = [];
    for (const { entry, original } of batch) {
      const { time, placeId, presentIds, observability, provenance, causedBy, commitGroup } = entry;
      const event = createEvent(world, entry.kind, entry.payload, { time, placeId, presentIds, observability, provenance, causedBy, commitGroup, offset: events.length });
      events.push(event);
      const allowed = entry.kind === "DOCUMENT_ISSUED" ? entry.payload.parts.flatMap(part => part.claimIds) : entry.payload.claimIds;
      for (const claim of state.world.claims.filter(item => item.originEventId === original.eventId && allowed?.includes(item.claimId))) {
        const changedClaim = claimTransform(structuredClone(claim));
        delete changedClaim.question; // Recompute the canonical key for a changed scope/value binding.
        claims.push({ ...changedClaim, originEventId: event.eventId });
      }
    }
    world = appendCommit(world, events, claims);
  }
  state.world = world;
  const economy = projectMarcusEconomy(world);
  Object.assign(state.metrics, economy.metrics); state.obligations = economy.obligations;
  return state;
}

/** Remove a lawful perception source, preserving unrelated economics and document possession. */
export function withoutFact(state, id) {
  return rewriteMarcusHistory(state, event => {
    const p = event.payload;
    if (id === "OLD_ACCOUNT" || id === "STOCK_TITLE") {
      if (event.seq === 1 && event.kind === "TRANSACTION") {
        const hide = effect => id === "OLD_ACCOUNT" ? effect.kind === "OBLIGATION_SET" && effect.obligationId === "OLD_ACCOUNT" : effect.kind === "RESOURCE_DELTA" && effect.holderId === "MARCUS" && effect.resourceId === "CONTRA";
        const hidden = p.hardEffects.filter(hide); p.hardEffects = p.hardEffects.filter(effect => !hide(effect));
        return [event, { ...structuredClone(event), presentIds: ["MARCUS", "PLAYER"], observability: "PRIVATE", provenance: { kind: "BACKSTORY", sourceRef: "private-account-or-acquisition" }, payload: { fromId: "MARCUS", toId: "PLAYER", hardEffects: hidden } }];
      }
    }
    if (id === "MISSED_CHECKIN" && event.kind === "COMMITMENT_WINDOW_CLOSED") return null;
    if (id === "SHARED_LOADING_SHIFT" && event.kind === "OCCURRENCE" && p.objectIds.includes("LOADING_SHIFT")) return null;
    if (id === "LEDGER_CLOSING" && event.kind === "ACTIVITY_STARTED" && p.activityId === "LEDGER_CLOSING") return null;
    if (id === "PICKUP_NEED" && event.kind === "ATTITUDE_SET" && p.assertion.keywordId === "NEEDS" && p.assertion.args.object === "COLLECTION_ARRANGED") return null;
    if (id === "RECORD_ASSERTION" && event.kind === "STATEMENT" && event.provenance.kind === "BACKSTORY" && p.speakerId === "MARCUS" && p.claimIds.includes("L42:body:0")) return null;
    if (event.kind === "DOCUMENT_READ" && p.readerId === "PLAYER" && p.documentId === "R17") {
      if (id === "DIRECT_RECEIPT") p.parts = p.parts.filter(part => part === "body");
      if (["POSITIVE_ROUTE", "NEGATIVE_DISCREPANCY"].includes(id)) p.parts = p.parts.filter(part => part !== "body");
      if (!p.parts.length) return null;
    }
    return event;
  });
}

export function alterPrivateClaim(state, field, value) {
  return rewriteMarcusHistory(state, event => event, claim => {
    if (claim.carrier.documentId === "R17" && claim.carrier.partId === "body") claim.proposition[field] = value;
    return claim;
  });
}

export function setOldDebt(state, amount) {
  return rewriteMarcusHistory(state, event => {
    if (event.kind === "TRANSACTION") for (const effect of event.payload.hardEffects) if (effect.kind === "OBLIGATION_SET" && effect.obligationId === "OLD_ACCOUNT") effect.principal = amount;
    return event;
  });
}

export function setResources(state, values) {
  const bindings = { cash: ["PLAYER", "CASH"], marcusStock: ["MARCUS", "CONTRA"], playerStock: ["PLAYER", "CONTRA"] };
  return rewriteMarcusHistory(state, event => {
    if (event.seq === 1) for (const [key, amount] of Object.entries(values)) {
      const [holder, resource] = bindings[key];
      event.payload.hardEffects.find(effect => effect.kind === "RESOURCE_DELTA" && effect.holderId === holder && effect.resourceId === resource).delta = amount;
    }
    return event;
  });
}

export function prepareInformation(state) {
  for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS"]) {
    const intent = { action: "ASK", topic, vibeId: "EA", intensity: "BALANCED" };
    Object.assign(state, advanceMarcusWorld(state, intent));
    state.events.push({ intent });
  }
  return state;
}

export function denyDocumentSource(state) {
  const assertion = { ...worldAssertion("observed-source-denial", "ISSUED_BY", { subject: "R17", object: "DEPOT" }), polarity: "NEGATED" };
  const event = createEvent(state.world, "OCCURRENCE", { actorId: "MARCUS", participants: [{ entityId: "MARCUS", access: "ALL" }], objectIds: ["R17"], happened: [assertion] }, { placeId: "COUNTER", presentIds: ["MARCUS"], observability: "PRIVATE" });
  state.world = appendCommit(state.world, [event]);
  return state;
}
