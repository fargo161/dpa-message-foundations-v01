import { detached, stableStringify } from "./event-contract.mjs";
import { assertionsConflict } from "./claims.mjs";
import { observedCandidates } from "./perception.mjs";
import { validateProfiles } from "./profiles.mjs";

const unique = values => [...new Set(values)];
const equivalent = (a, b) => a.resolution === "CATEGORY" && b.resolution === "CATEGORY" ? a.category.categoryId === b.category.categoryId : a.question === b.question && !assertionsConflict(a.proposition, b.proposition);

/** The registry is deliberately not consulted: exact content must arrive in this NPC's records. */
export function projectNpcBeliefs(ledger, perceptions, npcProfile, ownAttitudes = []) {
  validateProfiles([npcProfile]);
  const entity = ledger.entities.find(entry => entry.entityId === npcProfile.entityId);
  if (npcProfile.role !== "NPC" || entity?.role !== "NPC") throw new Error("WORLD_BELIEF:NPC holder required");
  const records = perceptions.filter(perception => perception.holder === npcProfile.entityId);
  if (!Array.isArray(ownAttitudes) || ownAttitudes.some(assertion => assertion.args?.subject !== npcProfile.entityId || !["NEEDS", "FEARS", "TRUSTS", "RESENTS"].includes(assertion.keywordId))) throw new Error("WORLD_BELIEF:foreign or invalid own attitude");
  const readDocuments = new Map();
  const checked = new Set();
  const trusts = new Set(ownAttitudes.filter(assertion => assertion.keywordId === "TRUSTS" && assertion.args.subject === npcProfile.entityId && assertion.polarity === "ASSERTED" && assertion.status === "ACTIVE").map(assertion => assertion.args.object));
  let candidates = [];
  function addCandidates(record, claims, rank, support = []) {
    for (const claim of claims) {
      // BELIEVES encodes a mind inside a proposition, forbidden by the one-level exposure contract.
      if (claim.proposition?.keywordId === "BELIEVES") continue;
      if (record.channel === "READ" && claim.proposition?.keywordId === "ISSUED_BY" && !checked.has(record.act.documentId)) continue;
      const candidate = { ...detached(claim), question: claim.resolution === "CATEGORY" ? `category:${claim.category.categoryId}` : claim.question, rank, supportedBy: [record.perceptionId], hardSnapshot: record.act.kind === "TRANSACTION" && record.act.propositions.some(proposition => proposition.assertionId === claim.claimId) && ["OWNS", "OWES"].includes(claim.proposition?.keywordId) };
      candidate.supportedBy = unique([...candidate.supportedBy, ...support]);
      candidates.push(candidate);
    }
  }
  for (const record of records) {
    let newlyChecked = false;
    if (record.channel === "READ") {
      const id = record.act.documentId;
      if (!readDocuments.has(id)) readDocuments.set(id, { required: new Set(), parts: new Map(), issuerClaims: [], supportedBy: [], history: [] });
      const document = readDocuments.get(id);
      for (const partId of record.act.authenticatingPartIds ?? []) document.required.add(partId);
      for (const part of record.act.parts ?? []) if (part.authenticating) document.parts.set(part.partId, part);
      for (const claim of record.claimsReceived) if (claim.resolution === "EXACT" && claim.proposition.keywordId === "ISSUED_BY" && claim.proposition.scope === "ACTUAL" && claim.proposition.args.subject === id && record.act.parts.some(part => part.authenticating && part.partId === claim.carrier.partId)) document.issuerClaims.push(claim);
      document.supportedBy.push(record.perceptionId);
      if (!checked.has(id) && document.required.size && [...document.required].every(partId => document.parts.has(partId) && npcProfile.recognizes.includes(document.parts.get(partId).markId)) && document.issuerClaims.some(claim => claim.proposition.polarity === "ASSERTED")) { checked.add(id); newlyChecked = true; }
    }
    const rank = record.channel === "SEEN" ? 4 : record.channel === "READ" && checked.has(record.act.documentId) ? 3 : record.channel === "TOLD" && trusts.has(record.act.actorId) ? 2 : record.channel === "INFERRED" ? 0 : 1;
    const document = record.channel === "READ" ? readDocuments.get(record.act.documentId) : null;
    addCandidates(record, [...observedCandidates(record), ...record.claimsReceived], rank, document && checked.has(record.act.documentId) ? document.supportedBy : []);
    // R6 occurs when authentication is learned, not retroactively at the old READ's position.
    if (newlyChecked) for (const prior of document.history) addCandidates(prior, prior.claimsReceived, 3, document.supportedBy);
    if (document) document.history.push(record);
  }
  // Observed transactions change current hard state. Old snapshots remain in perceptions,
  // but are not rival claims about the new balance. Unseen transactions do nothing here.
  candidates = candidates.filter((candidate, index) => !candidate.hardSnapshot || !candidates.slice(index + 1).some(later => later.hardSnapshot && later.question === candidate.question));
  const questions = unique(candidates.map(candidate => candidate.question));
  return questions.map(question => {
    const own = candidates.filter(candidate => candidate.question === question);
    const sequence = candidates.filter(candidate => candidate.question === question || candidate.proposition && own.some(other => other.proposition && assertionsConflict(candidate.proposition, other.proposition)));
    let accepted = [], competing = [], rank = -1, challenged = false, supportedBy = [];
    for (const candidate of sequence) {
      supportedBy = unique([...supportedBy, ...candidate.supportedBy]);
      const repeat = accepted.find(other => equivalent(other, candidate));
      if (repeat && candidate.rank <= rank) continue; // R2 adds support without inventing a challenge.
      if (candidate.rank > rank) { accepted = [candidate]; competing = []; rank = candidate.rank; challenged = false; } // R1/R3
      else if (candidate.rank === rank) { // R4, including a strengthened formerly weak challenger.
        if (!repeat) accepted.push(candidate);
        competing = competing.filter(other => !equivalent(other, candidate));
        challenged = competing.length > 0;
      } else { // R5: only a weaker claim arriving after the stronger one is a challenge.
        challenged = true;
        if (!competing.some(other => equivalent(other, candidate))) competing.push(candidate);
      }
    }
    const disputed = accepted.length > 1, winner = accepted[0];
    const defeated = !accepted.some(candidate => candidate.question === question);
    return { holder: npcProfile.entityId, question, stance: defeated ? "DISBELIEVED" : disputed ? "DISPUTED" : "BELIEVED", heldClaim: defeated || disputed ? null : winner.claimId, competing: (disputed ? [...accepted, ...competing] : competing).map(candidate => candidate.claimId), challenged, resolution: own[0].resolution, rank, supportedBy };
  }).sort((a, b) => a.question < b.question ? -1 : a.question > b.question ? 1 : 0);
}

/** Absence is the only UNKNOWN representation; this accessor does not store it. */
export function beliefOn(beliefs, question) {
  return detached(beliefs.find(belief => belief.question === question) ?? { question, stance: "UNKNOWN" });
}

export function equivalentBeliefState(a, b) { return stableStringify(a) === stableStringify(b); }
