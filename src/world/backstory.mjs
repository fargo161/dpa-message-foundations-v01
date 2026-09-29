import { createEvent, appendCommit } from "./ledger.mjs";
import { createClaim, canonicalQuestion, assertionsConflict, validateWorldAssertion } from "./claims.mjs";
import { detached, HARD_KEYWORDS } from "./event-contract.mjs";
import { projectPerceptions } from "./perception.mjs";

const same = (a, b) => canonicalQuestion(a) === canonicalQuestion(b) && !assertionsConflict(a, b);
const fail = message => { throw new Error(`WORLD_BACKSTORY:${message}`); };

/** Entries compile before append; committed history is never edited to teach a character. */
export function compileBackstory(ledger, entries) {
  let next = ledger;
  for (const entry of entries) {
    const { holder, proposition } = entry;
    if (next.entities.find(entity => entity.entityId === holder)?.type !== "ACTOR") fail("holder");
    if (proposition) validateWorldAssertion(proposition, next.entities);
    const opts = { placeId: entry.placeId ?? next.entities.find(entity => entity.type === "LOCATION")?.entityId, time: { at: entry.when ?? "backstory" }, presentIds: [holder], provenance: { kind: "BACKSTORY", sourceRef: `backstory:${next.events.length + 1}` } };
    if (entry.kind === "ATTITUDE_SET") {
      const event = createEvent(next, "ATTITUDE_SET", { holderId: holder, assertion: proposition }, { ...opts, observability: "PRIVATE" });
      next = appendCommit(next, [event]);
    } else if (entry.via === "TOLD") {
      if (!entry.from || !proposition) fail("TOLD requires speaker and proposition");
      const claimId = `backstory:${encodeURIComponent(next.seed)}:${next.events.length + 1}:claim`;
      const event = createEvent(next, "STATEMENT", { speakerId: entry.from, audienceIds: [holder], earshotIds: [], claimIds: [claimId], resolution: "EXACT", delivery: { vibeId: "EA", intensity: "BALANCED", landed: 1 } }, { ...opts, presentIds: [...new Set([holder, entry.from])] });
      const claim = createClaim({ claimId, proposition, category: entry.category ?? { categoryId: proposition.keywordId, label: proposition.keywordId }, carrier: { actorId: entry.from }, originEventId: event.eventId });
      next = appendCommit(next, [event], [claim]);
    } else if (entry.via === "READ") {
      const event = createEvent(next, "DOCUMENT_READ", { readerId: holder, documentId: entry.documentId, parts: entry.parts }, opts);
      next = appendCommit(next, [event]);
      if (proposition && !projectPerceptions(next).some(record => record.eventId === event.eventId && record.holder === holder && record.claimsReceived.some(claim => claim.proposition && same(claim.proposition, proposition)))) fail("requested proposition not in read parts");
    } else if (entry.via === "SEEN") {
      if (!proposition) fail("SEEN requires proposition");
      const already = projectPerceptions(next).some(record => record.holder === holder && (!entry.eventId || record.eventId === entry.eventId) && record.channel === "SEEN" && record.act.propositions.some(assertion => same(assertion, proposition)));
      if (already) continue;
      if (entry.eventId) fail("cannot add a witness to committed history");
      if (HARD_KEYWORDS.includes(proposition.keywordId)) fail("hard state must be observed at its transaction; cannot duplicate it");
      if (next.events.some(event => (event.payload.happened ?? event.payload.holds ?? []).some(assertion => same(assertion, proposition)))) fail("fact already exists; cannot duplicate an unobserved fact");
      let payload = { actorId: holder, participants: [{ entityId: holder, access: "ALL" }], objectIds: [], happened: [proposition] };
      let options = opts;
      if (entry.stagedEvent) {
        if (entry.stagedEvent.kind !== "OCCURRENCE" || !entry.stagedEvent.payload.happened.some(assertion => same(assertion, proposition))) fail("staged SEEN origin");
        payload = detached(entry.stagedEvent.payload);
        payload.participants = [...payload.participants.filter(participant => participant.entityId !== holder), { entityId: holder, access: "ALL" }];
        options = { ...opts, ...detached(entry.stagedEvent.options ?? {}), presentIds: [...new Set([...(entry.stagedEvent.options?.presentIds ?? []), payload.actorId, holder])], provenance: opts.provenance };
      }
      next = appendCommit(next, [createEvent(next, "OCCURRENCE", payload, options)]);
    } else fail("unknown shortcut");
  }
  return next;
}
