import { projectPerceptions, observedCandidates } from "../world/perception.mjs";
import { projectNpcBeliefs } from "../world/beliefs.mjs";
import { projectExposure } from "../world/exposure.mjs";
import { canonicalQuestion } from "../world/claims.mjs";
import { HISTORY_CONTENT } from "./history-content.mjs";

const exact = records => records.flatMap(record => record.claimsReceived.filter(claim => claim.resolution === "EXACT"));
const bodyOf = (claims, documentId) => claims.filter(claim => claim.carrier?.documentId === documentId && claim.carrier.partId === "body");
// Static authored sentences are licensed only by every exact value they express.
// A category, a lone docket or one count cannot fill in unread document contents.
function privateId(claims) {
  const has = (documentId, subject, attribute, value) => bodyOf(claims, documentId).some(({ proposition: item }) => item.keywordId === "HAS_ATTRIBUTE" && item.scope === "ACTUAL" && item.status === "ACTIVE" && item.polarity === "ASSERTED" && item.args.subject === subject && item.args.attribute === attribute && JSON.stringify(item.args.value) === JSON.stringify(value));
  if (has("R17", "COLLECTION", "collection_place", "GATE_C") && has("R17", "COLLECTION", "collection_window", { from: "07:00", until: "07:30" }) && has("R17", "COLLECTION", "docket", "R-17")) return "POSITIVE_ROUTE";
  if (has("R17", "INTAKE", "crates", 6) && has("L42", "INTAKE", "crates", 8)) return "NEGATIVE_DISCREPANCY";
  return null;
}
const orderedFacts = ids => Object.keys(HISTORY_CONTENT).filter(id => ids.includes(id));
const distinct = items => [...new Set(items)];
function activeActivities(records) {
  const active = new Set();
  for (const record of records) {
    if (record.act.kind === "ACTIVITY_STARTED") active.add(record.act.activityId);
    if (record.act.kind === "ACTIVITY_ENDED") active.delete(record.act.activityId);
  }
  return active;
}
function currentAttitudes(records) {
  const current = new Map();
  for (const record of records) if (record.act.kind === "ATTITUDE_SET") for (const item of record.act.propositions) current.set(canonicalQuestion(item), item);
  return [...current.values()];
}
function receivedFacts(records) {
  const claims = exact(records), facts = [];
  const propositions = records.flatMap(record => record.act.propositions);
  const latestOldAccount = propositions.filter(item => item.keywordId === "OWES" && item.args.term === "OLD_ACCOUNT").at(-1);
  // The fixed authored $250 sentence is unavailable when observed economics no longer support it.
  if (latestOldAccount?.args.amount === 250) facts.push("OLD_ACCOUNT");
  if (propositions.some(item => item.keywordId === "OWNS" && item.args.subject === "MARCUS" && item.args.object === "CONTRA" && item.args.quantity > 0)) facts.push("STOCK_TITLE");
  if (records.some(record => record.act.commitmentId === "DEBT_CHECKIN" && record.act.kept === false)) facts.push("MISSED_CHECKIN");
  if (records.some(record => record.act.kind === "OCCURRENCE" && record.act.objectIds.includes("LOADING_SHIFT"))) facts.push("SHARED_LOADING_SHIFT");
  if (claims.some(claim => claim.carrier?.documentId === "R17" && ["header", "signature"].includes(claim.carrier.partId))) facts.push("DIRECT_RECEIPT");
  const body = bodyOf(claims, "R17"), detailId = privateId(exact(records.filter(record => record.channel === "READ")));
  if (detailId) facts.push(detailId);
  if (claims.some(claim => claim.carrier?.documentId === "L42" && claim.carrier.partId === "body")) facts.push("RECORD_ASSERTION");
  const active = activeActivities(records);
  if (active.has("LEDGER_CLOSING")) facts.push("LEDGER_CLOSING");
  if (active.has("COLLECTION_ARRANGING") && currentAttitudes(records).some(item => item.keywordId === "NEEDS" && item.args.object === "COLLECTION_ARRANGED" && item.polarity === "ASSERTED" && item.status === "ACTIVE")) facts.push("PICKUP_NEED");
  return { ids: orderedFacts(facts), claims, body, detailId, active };
}
function heldDocuments(records, holder) {
  const held = new Set();
  for (const record of records) {
    if (record.act.kind === "DOCUMENT_ISSUED" && record.act.actorId === holder) held.add(record.act.documentId);
    if (record.act.kind === "DOCUMENT_TRANSFERRED") {
      if (record.act.toId === holder) held.add(record.act.documentId);
      if (record.act.fromId === holder) held.delete(record.act.documentId);
    }
  }
  return [...held];
}
function evidenceFrom(records, positive) {
  const evidence = [], seen = new Set();
  let bodyShown = false;
  for (const record of records) {
    if (record.act.outgoingPresentation?.documentId === "R17" && record.act.outgoingPresentation.partIds.includes("body") && record.act.outgoingPresentation.audienceIds.includes("MARCUS")) bodyShown = true;
    if (record.channel !== "TOLD" || record.act.actorId !== "MARCUS") continue;
    for (const claim of record.claimsReceived) {
      const id = claim.category.categoryId;
      if (seen.has(id)) continue;
      let entry;
      if (id === "SOURCE_VERIFIED") entry = { id, text: bodyShown ? "Marcus recognizes the depot header and signature; the already disclosed detail now has a checked source." : "Marcus recognizes the depot header and signature. He has checked the source, not the covered detail.", factIds: ["DIRECT_RECEIPT"] };
      if (id === "RELEVANCE_OBSERVED") entry = { id, text: positive ? "He says checked collection instructions could save a wasted journey. That suggests interest, not a promised concession." : "He says a concrete discrepancy would warrant rechecking the intake summary. That does not establish blame or guarantee concessions.", factIds: ["LEDGER_CLOSING", positive ? "PICKUP_NEED" : "RECORD_ASSERTION"] };
      if (id === "RELEVANCE_UNCERTAIN") entry = { id, text: "He does not identify a current use for that category of information.", factIds: ["LEDGER_CLOSING"] };
      if (id === "RECORD_QUESTIONED") entry = { id, text: "He maintains that the intake was signed off, but says a specific discrepancy can be checked. You have questioned a record, not proved misconduct.", factIds: ["RECORD_ASSERTION"] };
      if (entry) { evidence.push(entry); seen.add(id); }
    }
  }
  return evidence;
}

/** Player-only information. No NPC beliefs, private activities, attitudes or objective claims. */
export function projectPlayerInformation(state) {
  const perceptions = projectPerceptions(state.world).filter(record => record.holder === "PLAYER");
  const received = receivedFacts(perceptions), holdings = heldDocuments(perceptions, "PLAYER");
  // Reading a summary supplies its claim, not Marcus's stance or a memory of him saying it.
  if (!perceptions.some(record => record.channel === "TOLD" && record.act.actorId === "MARCUS" && record.claimsReceived.some(claim => claim.resolution === "EXACT" && claim.carrier?.documentId === "L42" && claim.carrier.partId === "body"))) received.ids = received.ids.filter(id => id !== "RECORD_ASSERTION");
  const privateFactId = holdings.includes("R17") ? received.detailId : null;
  let disclosure = "NONE";
  for (const record of perceptions) {
    if (record.act.addressedDelivery?.audienceIds.includes("MARCUS") && record.act.addressedDelivery.claims.some(claim => ["COLLECTION_CHANGE", "COUNT_MISMATCH"].includes(claim.category.categoryId)) && disclosure === "NONE") disclosure = "PARTIAL";
    if (record.act.outgoingPresentation?.documentId === "R17" && record.act.outgoingPresentation.partIds.includes("body") && record.act.outgoingPresentation.audienceIds.includes("MARCUS")) disclosure = "FULL";
  }
  const evidence = evidenceFrom(perceptions, privateFactId === "POSITIVE_ROUTE");
  const interestReply = perceptions.filter(record => record.channel === "TOLD" && record.act.actorId === "MARCUS")
    .flatMap(record => record.claimsReceived).filter(claim => ["R17_CARES", "R17_DOES_NOT_CARE"].includes(claim.category.categoryId)).at(-1);
  const traded = perceptions.some(record => record.act.kind === "DOCUMENT_TRANSFERRED" && record.act.documentId === "R17" && record.act.fromId === "PLAYER" && record.act.toId === "MARCUS");
  const keys = state.informationLocal.progressKeys;
  const r17 = { held: holdings.includes("R17"), available: holdings.includes("R17") && disclosure !== "FULL", traded,
    hinted: keys.includes("r17:hint"), shown: keys.includes("r17:shown"), blindTradeFailed: keys.includes("r17:blind-failure"),
    interestKnown: Boolean(interestReply), knownMarcusInterest: interestReply ? interestReply.category.categoryId === "R17_CARES" : null,
    tradeAttempts: keys.filter(key => key.startsWith("r17:trade-attempt:")) };
  return { perceptions, holdings, factIds: received.ids, bodyClaims: received.body, privateFactId, r17FactId: received.detailId, r17, disclosure, evidence,
    facts: Object.fromEntries(received.ids.map(id => [id, structuredClone(HISTORY_CONTENT[id])])),
    progressKeys: structuredClone(state.informationLocal.progressKeys), negativeWindow: structuredClone(state.informationLocal.negativeWindow) };
}

/** NPC-only information; objective world projection is deliberately not an input. */
export function projectMarcusInformation(state) {
  const perceptions = projectPerceptions(state.world).filter(record => record.holder === "MARCUS"), received = receivedFacts(perceptions);
  const profile = state.worldProfiles.find(item => item.entityId === "MARCUS");
  const attitudes = currentAttitudes(perceptions);
  const beliefs = projectNpcBeliefs(state.world, perceptions, profile, attitudes), exposure = projectExposure(state.world, perceptions, "MARCUS");
  const candidates = perceptions.flatMap(record => [...observedCandidates(record), ...record.claimsReceived]).filter(claim => claim.resolution === "EXACT");
  const beliefFor = predicate => beliefs.find(belief => candidates.some(claim => predicate(claim.proposition) && claim.question === belief.question));
  const source = beliefFor(proposition => proposition.keywordId === "ISSUED_BY" && proposition.args.subject === "R17");
  const count = beliefFor(proposition => proposition.keywordId === "HAS_ATTRIBUTE" && proposition.args.subject === "INTAKE" && proposition.args.attribute === "crates");
  const heldSource = candidates.find(candidate => candidate.claimId === source?.heldClaim)?.proposition;
  const sourceChecked = source?.stance === "BELIEVED" && source.rank >= 3 && heldSource?.polarity === "ASSERTED" && heldSource.status === "ACTIVE" && heldSource.scope === "ACTUAL" && heldSource.args.object === "DEPOT";
  const disclosure = received.detailId ? "FULL" : exposure.some(item => item.entityId === "PLAYER" && ["COLLECTION_CHANGE", "COUNT_MISMATCH"].includes(item.category.categoryId)) ? "PARTIAL" : "NONE";
  const ledgerClosing = received.active.has("LEDGER_CLOSING"), pickupNeed = received.ids.includes("PICKUP_NEED"), recordPresent = received.ids.includes("RECORD_ASSERTION");
  const bodySupport = received.body.length ? Math.max(...beliefs.filter(belief => received.body.some(claim => claim.question === belief.question)).map(belief => belief.rank)) : 0;
  const accepted = beliefs.filter(belief => belief.stance === "BELIEVED" && belief.resolution === "EXACT").map(belief => candidates.find(candidate => candidate.claimId === belief.heldClaim)?.proposition).filter(Boolean);
  const quantity = (subject, object) => accepted.find(item => item.keywordId === "OWNS" && item.args.subject === subject && item.args.object === object)?.args.quantity ?? 0;
  const economicMetrics = { cash: quantity("PLAYER", "CASH"), marcusStock: quantity("MARCUS", "CONTRA"), playerStock: quantity("PLAYER", "CONTRA"), debt: accepted.filter(item => item.keywordId === "OWES" && item.args.subject === "PLAYER" && item.args.object === "MARCUS").reduce((sum, item) => sum + (item.args.amount ?? 0), 0) };
  const interest = attitudes.find(item => item.keywordId === "NEEDS" && item.args.object === "R17");
  return { perceptions, beliefs, exposure, profile, attitudes, caresAboutR17: interest?.polarity === "ASSERTED", factIds: received.ids, privateFactId: received.detailId, bodyClaims: received.body,
    sourceChecked, disclosure, ledgerClosing, pickupNeed, recordPresent, economicMetrics, relevant: ledgerClosing && (pickupNeed || recordPresent),
    content: !received.body.length ? "UNKNOWN" : sourceChecked && bodySupport >= 3 ? "DOCUMENT_SUPPORTED" : "RECEIVED_UNVERIFIED",
    record: !recordPresent ? "NOT_APPLICABLE" : count?.stance === "DISPUTED" ? "DISPUTED" : count?.challenged ? "CHALLENGED_UNVERIFIED" : "RECONCILED_CLAIM" };
}

/** The encounter policy receives no ledger, player perceptions or combined compatibility view. */
export function marcusDecisionContext(state) {
  const marcus = projectMarcusInformation(state);
  return { profile: structuredClone(marcus.profile), quirk: marcus.profile.variant,
    metrics: { ...marcus.economicMetrics, confidence: state.metrics.confidence, tension: state.metrics.tension, patience: state.metrics.patience },
    events: state.events.map(({ intent, progressKey }) => ({ intent: structuredClone(intent), progressKey })) };
}

/** Detached compatibility observation for Debug/oracle only, never runtime authority. */
export function projectMarcusLore(state) {
  const player = projectPlayerInformation(state), marcus = projectMarcusInformation(state);
  const allIds = orderedFacts(distinct([...player.factIds, ...marcus.factIds]));
  const initialMarcus = marcus.factIds.filter(id => !["DIRECT_RECEIPT", "POSITIVE_ROUTE", "NEGATIVE_DISCREPANCY"].includes(id));
  const marcusKnown = [...initialMarcus];
  const aware = initialMarcus.filter(id => player.factIds.includes(id));
  for (const record of marcus.perceptions) {
    for (const claim of record.claimsReceived) {
      const id = claim.resolution === "EXACT" && claim.carrier?.documentId === "R17" ? claim.carrier.partId === "body" ? marcus.privateFactId : "DIRECT_RECEIPT" : null;
      if (id && !marcusKnown.includes(id)) marcusKnown.push(id);
    }
    for (const exposure of marcus.exposure.filter(item => item.eventId === record.eventId && item.entityId === "PLAYER")) {
      const id = ["COLLECTION_CHANGE", "COUNT_MISMATCH"].includes(exposure.category.categoryId) ? player.privateFactId : exposure.category.categoryId === "DOCUMENT_SOURCE" ? "DIRECT_RECEIPT" : null;
      if (id && !aware.includes(id)) aware.push(id);
    }
  }
  return { schemaVersion: "marcus-lore@0.1", variant: player.r17FactId === "POSITIVE_ROUTE" ? "POSITIVE" : "NEGATIVE", facts: Object.fromEntries(allIds.map(id => [id, structuredClone(HISTORY_CONTENT[id])])), privateFactId: player.privateFactId,
    knowledge: { player: player.factIds, marcus: marcusKnown, marcusAwarePlayerKnows: aware },
    beliefs: { source: marcus.sourceChecked ? "CHECKED" : "UNCHECKED", relevance: player.evidence.some(item => item.id === "RELEVANCE_OBSERVED") ? "POSSIBLY_USEFUL" : player.evidence.some(item => item.id === "RELEVANCE_UNCERTAIN") ? "NOT_ESTABLISHED" : "UNTESTED", content: marcus.content, record: marcus.record },
    disclosure: marcus.disclosure, evidence: player.evidence, progressKeys: structuredClone(state.informationLocal.progressKeys), negativeWindow: structuredClone(state.informationLocal.negativeWindow) };
}
