import { actorForEvent, detached } from "./event-contract.mjs";
import { canonicalQuestion, deriveClaimRegistry } from "./claims.mjs";

const unique = values => [...new Set(values.filter(Boolean))];
function participants(payload) {
  return unique([...(payload.participants ?? []).map(participant => participant.entityId), ...(payload.parties ?? []).map(party => party.entityId), ...(payload.participantIds ?? []), ...(payload.audienceIds ?? []), ...["actorId", "fromId", "toId", "issuerId", "readerId", "holderId", "speakerId", "promisorId", "promiseeId"].map(key => payload[key])]);
}

function observedAssertion(event, index, keywordId, args) {
  return { assertionId: `${event.eventId}:observed:${index}`, keywordId, args, scope: "ACTUAL", polarity: "ASSERTED", status: "ACTIVE", contextIds: [], validFrom: "1970-01-01T00:00:00Z", validUntil: null, provenance: { sourceId: "world-event-observation", sourceVersion: "0.1.3", sourceRecordId: event.eventId, transformVersion: "perception@0.1", licenseId: "PROJECT_AUTHORED" } };
}

function receive(claim, resolution) {
  const base = { claimId: claim.claimId, resolution, category: detached(claim.category) };
  return resolution === "CATEGORY" ? base : { ...base, proposition: detached(claim.proposition), question: claim.question, carrier: detached(claim.carrier) };
}

/** Each act is already redacted for its holder. No later projector needs raw payload content. */
export function projectPerceptions(ledger) {
  const result = [], claims = deriveClaimRegistry(ledger), documents = new Map(), commitments = new Map(), balances = new Map();
  function baseAct(event, holder, access = "ALL") {
    const p = event.payload;
    const act = { kind: event.kind, actorId: actorForEvent(ledger, event), participantIds: participants(p), objectIds: unique([...(p.objectIds ?? []), p.documentId]), propositions: [], audienceIds: [...(p.audienceIds ?? [])] };
    if (p.documentId) act.documentId = p.documentId;
    if (p.fromId) act.fromId = p.fromId;
    if (p.toId) act.toId = p.toId;
    if (event.kind === "DOCUMENT_PRESENTED" && holder === p.holderId) act.outgoingPresentation = { documentId: p.documentId, partIds: [...p.parts], audienceIds: p.audienceIds.filter(id => p.sightlineIds.includes(id)) };
    if (p.delivery) act.delivery = detached(p.delivery);
    if (p.activityId) { act.activityId = p.activityId; if (p.label) act.label = p.label; }
    if (p.commitmentId) act.commitmentId = p.commitmentId;
    if (event.kind === "COMMITMENT_WINDOW_CLOSED") { act.attendance = detached(p.parties); act.kept = p.kept; }
    if (event.kind === "ENCOUNTER_CLOSED") { act.encounterId = p.encounterId; act.outcome = p.outcome; }
    if (event.kind === "OCCURRENCE") act.propositions = p.happened.filter(assertion => access === "ALL" || access.includes(assertion.assertionId)).map(detached);
    if (event.kind === "ACTIVITY_STARTED") act.propositions = p.holds.map(detached);
    if (event.kind === "COMMITMENT_MADE") act.propositions = [detached(p.assertion)];
    if (event.kind === "ATTITUDE_SET" && p.holderId === holder) act.propositions = [detached(p.assertion)];
    if (event.kind === "TRANSACTION") {
      act.resourceTransfers = p.hardEffects.filter(effect => effect.kind === "RESOURCE_DELTA").map(detached);
      for (const effect of p.hardEffects) {
        if (effect.kind === "OBLIGATION_SET") act.propositions.push(observedAssertion(event, act.propositions.length, "OWES", { subject: effect.debtorId, object: effect.creditorId, term: effect.obligationId, amount: effect.status === "OPEN" ? effect.principal + effect.extra : 0 }));
        else {
          const key = `${holder}\u0000${effect.holderId}\u0000${effect.resourceId}`;
          // Unobserved balances are never imported into a subjective observation.
          if (balances.has(key) || event.seq === 1 && event.provenance.sourceRef === "genesis") {
            const quantity = (balances.get(key) ?? 0) + effect.delta;
            balances.set(key, quantity);
            if (quantity >= 0) act.propositions.push(observedAssertion(event, act.propositions.length, "OWNS", { subject: effect.holderId, object: effect.resourceId, quantity }));
          }
        }
      }
    }
    act.propositions = act.propositions.map((assertion, index) => ({ ...assertion, assertionId: `${event.eventId}:observed:${index}` }));
    return act;
  }
  /** @param {any} event @param {string} holder @param {string} channel @param {string} rule @param {any} [options] */
  function add(event, holder, channel, rule, options = {}) {
    const { portion = "ALL", resolution = "EXACT", received = [], access = "ALL", act: extra = {} } = options;
    result.push({ perceptionId: `${event.eventId}:perception:${encodeURIComponent(holder)}:${rule}`, eventId: event.eventId, holder, channel, portion: detached(portion), resolution, claimsReceived: detached(received), rule, act: { ...baseAct(event, holder, access), ...detached(extra) } });
  }
  function read(event, holder, rule) {
    const p = event.payload, manifest = documents.get(p.documentId), parts = manifest.parts.filter(part => p.parts.includes(part.partId));
    add(event, holder, "READ", rule, { portion: parts.map(part => `${p.documentId}.${part.partId}`), received: parts.flatMap(part => part.claimIds.map(id => receive(claims[id], "EXACT"))), act: { parts: parts.map(({ partId, authenticating, markId }) => ({ partId, authenticating, ...(markId ? { markId } : {}) })), authenticatingPartIds: manifest.parts.filter(part => part.authenticating).map(part => part.partId), readAudienceIds: rule === "P6" ? p.audienceIds.filter(id => p.sightlineIds.includes(id)) : [p.readerId] } });
  }
  for (const event of ledger.events) {
    const p = event.payload, present = event.presentIds, actor = actorForEvent(ledger, event);
    if (event.kind === "DOCUMENT_ISSUED") documents.set(p.documentId, { parts: detached(p.parts) });
    if (event.kind === "COMMITMENT_MADE") commitments.set(p.commitmentId, event);
    if (event.kind === "COMMITMENT_WINDOW_CLOSED") {
      const made = commitments.get(p.commitmentId);
      for (const party of p.parties) {
        if (party.attendance === "PRESENT") add(event, party.entityId, "SEEN", "P8");
        else if (made && result.some(record => record.holder === party.entityId && record.eventId === made.eventId)) add(event, party.entityId, "INFERRED", "P8");
      }
      continue;
    }
    let observers = event.observability === "PRIVATE" ? [actor] : event.observability === "PRESENT" ? present : participants(p).filter(id => present.includes(id));
    observers = unique(observers);
    // Specialized content records replace the generic act record for their reader.
    const addressed = event.kind === "STATEMENT" ? p.audienceIds.filter(id => present.includes(id)) : [];
    const overheard = event.kind === "STATEMENT" ? p.earshotIds.filter(id => present.includes(id) && !addressed.includes(id) && id !== actor) : [];
    const readers = event.kind === "DOCUMENT_PRESENTED" ? p.audienceIds.filter(id => p.sightlineIds.includes(id)) : event.kind === "DOCUMENT_READ" ? [p.readerId] : [];
    for (const holder of observers.filter(id => ![...addressed, ...overheard, ...readers].includes(id))) {
      if (event.kind === "DOCUMENT_PRESENTED" && !p.sightlineIds.includes(holder)) continue;
      const access = event.kind === "OCCURRENCE" && event.observability === "PARTICIPANTS" ? p.participants.find(participant => participant.entityId === holder)?.access ?? "ALL" : "ALL";
      add(event, holder, "SEEN", event.observability === "PRIVATE" ? "P3" : event.observability === "PRESENT" ? "P2" : "P1", { access });
    }
    if (event.kind === "STATEMENT") {
      const received = p.claimIds.map(id => receive(claims[id], p.resolution));
      for (const holder of addressed) add(event, holder, "TOLD", "P4", { resolution: p.resolution, received });
      for (const holder of overheard) add(event, holder, "HEARD", "P5", { resolution: p.resolution, received });
      // The speaker observes their own addressed delivery; this confers exposure, never belief.
      const speakerRecord = result.find(record => record.eventId === event.eventId && record.holder === p.speakerId);
      if (speakerRecord) speakerRecord.act.addressedDelivery = { audienceIds: addressed, claims: received };
    }
    if (event.kind === "DOCUMENT_READ") read(event, p.readerId, "P7");
    if (event.kind === "DOCUMENT_PRESENTED") {
      for (const holder of readers) read(event, holder, "P6");
      for (const holder of present.filter(id => !p.sightlineIds.includes(id))) add(event, holder, "SEEN", "P6b", { portion: [], act: { propositions: [] } });
    }
  }
  return result;
}

export function observedCandidates(perception) {
  return perception.act.propositions.map(proposition => ({ claimId: proposition.assertionId, proposition: detached(proposition), question: canonicalQuestion(proposition), resolution: "EXACT", carrier: { actorId: perception.act.actorId } }));
}
