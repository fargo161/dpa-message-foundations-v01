import { createLedger, createEvent, appendCommit } from "../world/ledger.mjs";
import { createClaim } from "../world/claims.mjs";
import { projectWorld } from "../world/projections.mjs";
import { neutralPlayerProfile, validateProfiles, landDelivery } from "../world/profiles.mjs";
import { PERSONALITY } from "./marcus-profile.mjs";
import { projectPlayerInformation, projectMarcusInformation } from "./marcus-world-adapter.mjs";

export function informationVariant(seed) {
  let hash = 2166136261;
  for (const character of `marcus-information-v1:${seed}`) hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507) >>> 0;
  return ((hash ^ (hash >>> 13)) >>> 0) % 2 ? "POSITIVE" : "NEGATIVE";
}
export function worldAssertion(id, keywordId, args, scope = "ACTUAL") {
  return { assertionId: id, keywordId, args, scope, polarity: "ASSERTED", status: "ACTIVE", contextIds: [], validFrom: "2026-09-01T00:00:00Z", validUntil: null,
    provenance: { sourceId: "marcus-world-authored-v01", sourceVersion: "0.1.3", sourceRecordId: id, transformVersion: "marcus-world@0.1", licenseId: "PROJECT_AUTHORED" } };
}
const entities = [
  ...["PLAYER", "MARCUS", "DEPOT", "CLERK"].map(entityId => ({ entityId, type: "ACTOR", role: entityId === "PLAYER" ? "PLAYER" : "NPC" })),
  ...["COUNTER", "DEPOT_YARD", "GATE_C"].map(entityId => ({ entityId, type: "LOCATION" })),
  ...["CASH", "CONTRA"].map(entityId => ({ entityId, type: "RESOURCE" })),
  ...["R17", "L42", "INTAKE", "COLLECTION", "LOADING_SHIFT", "CLERICAL_ERROR", "RUNNER_SHORTED", "DEPOT_MISCOUNT"].map(entityId => ({ entityId, type: "OBJECT" })),
  ...["OLD_ACCOUNT", "NEW_ACCOUNT"].map(entityId => ({ entityId, type: "OBLIGATION" })),
  ...["CHECKIN"].map(entityId => ({ entityId, type: "ACTION" })),
  ...["COLLECTION_ARRANGED", "RECORD_CHECKABLE", "CURRENT_USE_UNESTABLISHED", "PROFIT_PREDICTION"].map(entityId => ({ entityId, type: "PROPOSITION" })),
];
const category = (categoryId, label) => ({ categoryId, label });
const privateCategory = positive => category(positive ? "COLLECTION_CHANGE" : "COUNT_MISMATCH", positive ? "Changed collection instructions" : "An intake count mismatch");
const commonOptions = { placeId: "COUNTER", presentIds: ["PLAYER", "MARCUS"], provenance: { kind: "BACKSTORY", sourceRef: "marcus-history" } };
const delta = (holderId, resourceId, amount) => ({ kind: "RESOURCE_DELTA", holderId, resourceId, delta: amount });

/** Compile authored history to ordinary validated events; no information inventory is authored. */
export function createMarcusWorld(seed, quirk = "final_say", options = {}) {
  let world = createLedger({ seed, entities });
  const append = (kind, payload, extra = {}, claims = []) => {
    const event = createEvent(world, kind, payload, { ...commonOptions, ...extra });
    world = appendCommit(world, [event], claims.map(claim => createClaim({ ...claim, originEventId: event.eventId })));
    return event;
  };
  append("TRANSACTION", { fromId: "MARCUS", toId: "PLAYER", hardEffects: [delta("PLAYER", "CASH", 80), delta("MARCUS", "CONTRA", 8), delta("PLAYER", "CONTRA", 0), delta("MARCUS", "CASH", 0),
    { kind: "OBLIGATION_SET", obligationId: "OLD_ACCOUNT", debtorId: "PLAYER", creditorId: "MARCUS", principal: 250, extra: 0, days: null, status: "OPEN" }] }, { provenance: { kind: "BACKSTORY", sourceRef: "genesis" } });
  append("COMMITMENT_MADE", { commitmentId: "DEBT_CHECKIN", promisorId: "PLAYER", promiseeId: "MARCUS", assertion: worldAssertion("debt-checkin", "PROMISED_TO", { subject: "PLAYER", object: "MARCUS", term: "CHECKIN" }) }, { time: { windowFrom: "yesterday-09:00", windowUntil: "yesterday-10:00" } });
  append("COMMITMENT_WINDOW_CLOSED", { commitmentId: "DEBT_CHECKIN", parties: [{ entityId: "PLAYER", attendance: "ABSENT" }, { entityId: "MARCUS", attendance: "PRESENT" }], kept: false }, { presentIds: ["MARCUS"] });
  append("OCCURRENCE", { actorId: "MARCUS", participants: [{ entityId: "PLAYER", access: "ALL" }, { entityId: "MARCUS", access: "ALL" }], objectIds: ["LOADING_SHIFT"], happened: [] });
  append("ACTIVITY_STARTED", { activityId: "LEDGER_CLOSING", actorId: "MARCUS", label: "Closing today's ledger before tomorrow's collection", holds: [] }, { presentIds: ["MARCUS"], observability: "PRIVATE" });
  const positive = informationVariant(seed) === "POSITIVE";
  const countCauses = ["CLERICAL_ERROR", "RUNNER_SHORTED", "DEPOT_MISCOUNT"];
  let causeHash = 2166136261;
  for (const ch of `R17_COUNT_CAUSE:${seed}`) causeHash = Math.imul(causeHash ^ ch.codePointAt(0), 16777619) >>> 0;
  const countCause = options.countCause ?? countCauses[causeHash % countCauses.length];
  if (!countCauses.includes(countCause)) throw new Error("Unknown R17 count cause");
  const body = positive ? [
    worldAssertion("r17-place", "HAS_ATTRIBUTE", { subject: "COLLECTION", attribute: "collection_place", value: "GATE_C" }),
    worldAssertion("r17-window", "HAS_ATTRIBUTE", { subject: "COLLECTION", attribute: "collection_window", value: { from: "07:00", until: "07:30" } }),
    worldAssertion("r17-docket", "HAS_ATTRIBUTE", { subject: "COLLECTION", attribute: "docket", value: "R-17" }),
  ] : [worldAssertion("r17-count", "HAS_ATTRIBUTE", { subject: "INTAKE", attribute: "crates", value: 6 })];
  append("OCCURRENCE", { actorId: "DEPOT", participants: [{ entityId: "DEPOT", access: "ALL" }], objectIds: positive ? ["COLLECTION"] : ["INTAKE", countCause], happened: positive ? body : [worldAssertion("actual-count", "HAS_ATTRIBUTE", { subject: "INTAKE", attribute: "crates", value: countCause === "CLERICAL_ERROR" ? 8 : 6 })] }, { placeId: "DEPOT_YARD", presentIds: ["DEPOT"], observability: "PRIVATE", provenance: { kind: "SEED", sourceRef: positive ? "R17_CONTENT" : "R17_COUNT_CAUSE" } });
  function issue(documentId, issuerId, bodyAssertions, bodyCategory) {
    const parts = [{ partId: "header", claimIds: [`${documentId}:source:0`], authenticating: true, markId: "DEPOT_MARK" }, { partId: "signature", claimIds: [`${documentId}:source:1`], authenticating: true, markId: "CLERK_SIGNATURE" }, { partId: "body", claimIds: bodyAssertions.map((_, index) => `${documentId}:body:${index}`), authenticating: false }];
    const definitions = parts.flatMap(part => part.claimIds.map((claimId, index) => ({ claimId, proposition: part.partId === "body" ? bodyAssertions[index] : worldAssertion(claimId, "ISSUED_BY", { subject: documentId, object: issuerId }), category: part.partId === "body" ? bodyCategory : category("DOCUMENT_SOURCE", "Dated depot header and signature"), carrier: { documentId, partId: part.partId } })));
    append("DOCUMENT_ISSUED", { issuerId, documentId, parts }, { presentIds: [issuerId], observability: "PRIVATE" }, definitions);
  }
  issue("R17", "DEPOT", body, privateCategory(positive));
  append("DOCUMENT_TRANSFERRED", { documentId: "R17", fromId: "DEPOT", toId: "PLAYER" }, { presentIds: ["DEPOT", "PLAYER"] });
  append("DOCUMENT_READ", { readerId: "PLAYER", documentId: "R17", parts: ["header", "signature", "body"] }, { presentIds: ["PLAYER"], observability: "PRIVATE" });
  if (positive) {
    append("ATTITUDE_SET", { holderId: "MARCUS", assertion: worldAssertion("collection-need", "NEEDS", { subject: "MARCUS", object: "COLLECTION_ARRANGED" }) }, { presentIds: ["MARCUS"], observability: "PRIVATE" });
    append("ACTIVITY_STARTED", { activityId: "COLLECTION_ARRANGING", actorId: "MARCUS", label: "Arranging tomorrow's collection", holds: [] }, { presentIds: ["MARCUS"], observability: "PRIVATE" });
  } else {
    issue("L42", "CLERK", [worldAssertion("l42-count", "HAS_ATTRIBUTE", { subject: "INTAKE", attribute: "crates", value: 8 })], category("INTAKE_RECORD", "Signed intake reconciliation"));
    append("DOCUMENT_TRANSFERRED", { documentId: "L42", fromId: "CLERK", toId: "MARCUS" }, { presentIds: ["CLERK", "MARCUS"] });
    append("DOCUMENT_READ", { readerId: "MARCUS", documentId: "L42", parts: ["header", "signature", "body"] }, { presentIds: ["MARCUS"], observability: "PRIVATE" });
    append("DOCUMENT_PRESENTED", { holderId: "MARCUS", documentId: "L42", parts: ["body"], audienceIds: ["PLAYER"], sightlineIds: ["PLAYER", "MARCUS"] });
    append("STATEMENT", { speakerId: "MARCUS", audienceIds: ["PLAYER"], earshotIds: [], claimIds: ["L42:body:0"], resolution: "EXACT", delivery: { vibeId: "EA", intensity: "BALANCED", landed: 1 } });
  }
  const worldProfiles = [neutralPlayerProfile("PLAYER"), { version: "world-profile@0.1", entityId: "MARCUS", role: "NPC", recognizes: ["DEPOT_MARK", "CLERK_SIGNATURE"], reception: structuredClone(PERSONALITY.reactions), policy: structuredClone(PERSONALITY.policy), variant: quirk }];
  validateProfiles(worldProfiles);
  return { world, worldProfiles, informationLocal: { progressKeys: [], negativeWindow: null } };
}

export function projectMarcusEconomy(world) {
  const view = projectWorld(world), old = view.obligations.OLD_ACCOUNT, fresh = view.obligations.NEW_ACCOUNT;
  const obligations = { existing: old?.status === "OPEN" ? old.principal + old.extra : 0, principal: fresh?.status === "OPEN" ? fresh.principal : 0, extra: fresh?.status === "OPEN" ? fresh.extra : 0, days: fresh?.days ?? null };
  return { metrics: { cash: view.resources.PLAYER?.CASH ?? 0, marcusStock: view.resources.MARCUS?.CONTRA ?? 0, playerStock: view.resources.PLAYER?.CONTRA ?? 0, debt: obligations.existing + obligations.principal + obligations.extra }, obligations };
}

/** Stage a complete turn's world consequences. Encounter policy supplies only its resolved terminal outcome. */
export function advanceMarcusWorld(state, intent, outcome = {}) {
  const player = projectPlayerInformation(state), marcus = projectMarcusInformation(state);
  const local = structuredClone(state.informationLocal), turn = state.events.length + 1;
  const events = [], claims = [], group = `marcus-turn:${turn}`;
  const add = (kind, payload) => { const event = createEvent(state.world, kind, payload, { ...commonOptions, offset: events.length, commitGroup: group, causedBy: `${state.runId}:turn:${turn}`, time: { at: `turn:${turn}` }, provenance: { kind: "ENCOUNTER_TURN", sourceRef: `${state.runId}:turn:${turn}` } }); events.push(event); return event; };
  const delivery = { vibeId: intent.vibeId, intensity: intent.intensity, landed: landDelivery(state.worldProfiles.find(profile => profile.role === "PLAYER"), intent) };
  const statement = (speakerId, claimIds = [], resolution = "EXACT", definition = null) => {
    const event = add("STATEMENT", { speakerId, audienceIds: [speakerId === "PLAYER" ? "MARCUS" : "PLAYER"], earshotIds: [], claimIds, resolution, delivery });
    if (definition) claims.push(createClaim({ claimId: claimIds[0], ...definition, carrier: { actorId: speakerId }, originEventId: event.eventId }));
  };
  const reply = (tag, proposition, label) => statement("MARCUS", [`reply:${turn}:${tag}`], "EXACT", { proposition, category: category(tag, label) });
  const present = parts => add("DOCUMENT_PRESENTED", { holderId: "PLAYER", documentId: "R17", parts, audienceIds: ["MARCUS"], sightlineIds: ["PLAYER", "MARCUS"] });
  const once = key => { if (local.progressKeys.includes(key)) return false; local.progressKeys.push(key); return true; };
  const hint = () => once(`hint:${player.privateFactId}`);
  const privateIds = player.bodyClaims.map(claim => claim.claimId);
  const hints = ["PROBE_USEFULNESS", "QUESTION_RECORD", "DISCLOSE_PARTIAL"].includes(intent.topic) || intent.action === "DEAL" && intent.information === "OFFER_INFORMATION";
  if (intent.topic === "GUARANTEE") statement("PLAYER", [`prediction:${turn}`], "EXACT", { proposition: worldAssertion(`prediction:${turn}`, "OWNS", { subject: "PLAYER", object: "CASH" }, "HYPOTHETICAL"), category: category("FUTURE_PROFIT", "Claim about future profits") });
  else statement("PLAYER", hints ? privateIds : [], hints ? "CATEGORY" : "EXACT");
  if (local.negativeWindow && local.negativeWindow.consumedAt === null && !local.negativeWindow.expiredAt && turn > local.negativeWindow.expiresAt) local.negativeWindow.expiredAt = turn;
  let replied = false;
  if (hints) hint();
  if (intent.topic === "SMALL_TALK") once("history:SHARED_LOADING_SHIFT");
  if (intent.topic === "ACK_MISSED") once("history:MISSED_CHECKIN");
  if (intent.topic === "VERIFY_SOURCE") {
    present(["header", "signature"]);
    const inspected = projectMarcusInformation({ ...state, world: appendCommit(state.world, events, claims) });
    if (once("evidence:DIRECT_RECEIPT") && inspected.sourceChecked) { reply("SOURCE_VERIFIED", worldAssertion(`source-reply:${turn}`, "ISSUED_BY", { subject: "R17", object: "DEPOT" }), "Source verification reply"); replied = true; }
  }
  if (intent.topic === "PROBE_USEFULNESS" && once(`relevance:${player.privateFactId}`)) {
    const relevant = marcus.relevant;
    reply(relevant ? "RELEVANCE_OBSERVED" : "RELEVANCE_UNCERTAIN", worldAssertion(`relevance-reply:${turn}`, relevant && marcus.pickupNeed ? "NEEDS" : "BELIEVES", relevant && marcus.pickupNeed ? { subject: "MARCUS", object: "COLLECTION_ARRANGED" } : { subject: "MARCUS", proposition: relevant ? "RECORD_CHECKABLE" : "CURRENT_USE_UNESTABLISHED" }), "Usefulness reply"); replied = true;
  }
  if (intent.topic === "QUESTION_RECORD" && once("question:RECORD_ASSERTION")) { reply("RECORD_QUESTIONED", worldAssertion(`record-reply:${turn}`, "BELIEVES", { subject: "MARCUS", proposition: "RECORD_CHECKABLE" }), "Reply to record question"); replied = true; }
  if (intent.topic === "DISCLOSE_FULL" && marcus.disclosure !== "FULL") {
    present(["body"]); once(`disclosure:${player.privateFactId}`);
    const hostile = ["BA", "BS", "BE", "BD", "AB", "AD", "DB", "DA", "DS", "DE"].includes(intent.vibeId);
    if (player.privateFactId === "NEGATIVE_DISCREPANCY" && marcus.sourceChecked && marcus.ledgerClosing && marcus.recordPresent && player.evidence.some(item => item.id === "RELEVANCE_OBSERVED") && player.evidence.some(item => item.id === "RECORD_QUESTIONED") && !hostile && state.metrics.tension <= 45) local.negativeWindow = { factId: player.privateFactId, openedAt: turn, expiresAt: turn + 3, consumedAt: null };
  }
  if (intent.action === "DEAL" && local.negativeWindow && local.negativeWindow.consumedAt === null) local.negativeWindow.consumedAt = turn;
  if (intent.action === "ACCEPT") {
    const terms = state.counteroffer.terms;
    add("TRANSACTION", { fromId: "MARCUS", toId: "PLAYER", hardEffects: [delta("PLAYER", "CASH", -terms.upfront), delta("MARCUS", "CASH", terms.upfront), delta("MARCUS", "CONTRA", -terms.units), delta("PLAYER", "CONTRA", terms.units), { kind: "OBLIGATION_SET", obligationId: "NEW_ACCOUNT", debtorId: "PLAYER", creditorId: "MARCUS", principal: terms.repayment, extra: terms.extra, days: terms.days, status: "OPEN" }] });
    if (state.counteroffer.informationExchange) { present(["body"]); once(`exchange:${player.privateFactId}`); }
  }
  if (!replied) statement("MARCUS");
  if (["AGREED", "WITHDRAWN", "ENDED"].includes(outcome.status)) add("ENCOUNTER_CLOSED", { encounterId: state.runId, participantIds: ["PLAYER", "MARCUS"], outcome: outcome.status });
  return { world: appendCommit(state.world, events, claims), informationLocal: local, worldEventIds: events.map(event => event.eventId) };
}
