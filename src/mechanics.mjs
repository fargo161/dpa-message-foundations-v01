import { KEYWORD_BY_ID } from "./keywords.mjs";

export const MACRO_ACTS = Object.freeze(["DEAL", "PRESSURE", "ASK"]);
export const ACTION_STATUS = Object.freeze(["AVAILABLE", "BLOCKED"]);
export const FACT_SCOPES = Object.freeze(["ACTUAL", "BELIEF"]);
export const FACT_POLARITIES = Object.freeze(["ASSERTED", "DENIED", "DISPUTED"]);

// Mechanics owns this private replay record. It is deliberately not exposed
// as a caller-supplied hash; the adapter can compare a cloned resolution to
// the canonical values produced at resolution time.
const RESOLUTION_PAYLOAD_RECORDS = new Map();

const iso = (value) => new Date(value).toISOString();
const timeOf = (value) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

const stableValue = (value) => {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stableValue);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
};

const stableKey = (value) => JSON.stringify(stableValue(value));

const freezeDeep = (value) => {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeDeep(child);
  return Object.freeze(value);
};

const RESOLUTION_RECORD_IDS_BY_HISTORY = new Map();

function nextResolutionRecordId(historyId) {
  const recordIds = RESOLUTION_RECORD_IDS_BY_HISTORY.get(historyId) ?? [];
  const resolutionRecordId = `${historyId}:authority:${recordIds.length + 1}`;
  recordIds.push(resolutionRecordId);
  RESOLUTION_RECORD_IDS_BY_HISTORY.set(historyId, recordIds);
  return resolutionRecordId;
}

export function fact(keywordId, args, options = {}) {
  if (!KEYWORD_BY_ID.has(keywordId)) throw new Error(`Unknown keyword: ${keywordId}`);
  const defaultAssertionId = `${keywordId}_${Object.entries(stableValue(args)).map(([key, value]) => `${key}_${String(value)}`).join("_").toLowerCase()}`;
  return {
    assertionId: options.assertionId ?? defaultAssertionId,
    keywordId,
    args: structuredClone(args),
    scope: options.scope ?? "ACTUAL",
    polarity: options.polarity ?? "ASSERTED",
    status: options.status ?? "ACTIVE",
    contextIds: [...(options.contextIds ?? [])],
    validFrom: options.validFrom ?? "2026-01-01T00:00:00.000Z",
    validUntil: options.validUntil ?? null,
    provenance: options.provenance ?? {
      sourceId: "project-demo-fixture",
      sourceVersion: "0.1",
      sourceRecordId: options.assertionId ?? `${keywordId}_fixture`,
      transformVersion: "demo-fixture@0.1",
      licenseId: "PROJECT_AUTHORED",
    },
    notes: options.notes ?? [],
  };
}

const entity = (id, displayName, type = "ACTOR") => ({ id, displayName, type });

const baseState = (scenarioId, title, contextId, entities, facts, extras = {}) => ({
  schemaVersion: "dpa-keyword-foundation@0.1",
  scenarioId,
  title,
  now: "2026-09-02T12:00:00.000Z",
  entities,
  contexts: [{ id: contextId, name: contextId.replaceAll("_", " "), active: true }],
  facts,
  priors: extras.priors ?? [],
  history: [],
  consequences: extras.consequences ?? {},
  pressureContracts: extras.pressureContracts ?? [],
  blockers: extras.blockers ?? [],
  recommendedPairs: extras.recommendedPairs ?? [],
});

const projectProv = (id) => ({
  sourceId: "project-demo-fixture",
  sourceVersion: "0.1",
  sourceRecordId: id,
  transformVersion: "demo-fixture@0.1",
  licenseId: "PROJECT_AUTHORED",
});

export function createMarcusScenario() {
  const player = "player";
  const marcus = "marcus_broker_hill";
  const apt = "apartment_305";
  const entry = "apartment_305_entry";
  const debt = "debt_250_usd";
  const cash = "cash_80_usd";
  const secret = "secret_unregistered_sublet";
  const consequence = "public_debt_exposure";
  const c = "PRIVATE_NEGOTIATION";
  const facts = [
    fact("OWNS", { subject: marcus, object: apt }, { assertionId: "marcus_owns_apt_305", contextIds: [c], provenance: projectProv("marcus_owns_apt_305") }),
    fact("CONTROLS", { subject: marcus, object: entry }, { assertionId: "marcus_controls_apt_305_entry", contextIds: [c], provenance: projectProv("marcus_controls_apt_305_entry") }),
    fact("OWES", { subject: player, object: marcus, term: debt, amount: 250, unit: "USD", due: "2026-09-03T09:00:00.000Z", status: "ACTIVE" }, { assertionId: "player_owes_marcus_250", contextIds: [c], provenance: projectProv("player_owes_marcus_250") }),
    fact("OWNS", { subject: player, object: cash, quantity: 80, unit: "USD" }, { assertionId: "player_owns_cash_80", contextIds: [c], provenance: projectProv("player_owns_cash_80") }),
    fact("NEEDS", { subject: player, object: "debt_relief" }, { assertionId: "player_needs_debt_relief", contextIds: [c], provenance: projectProv("player_needs_debt_relief") }),
    fact("PROMISED_TO", { subject: player, object: marcus, term: debt, status: "PENDING" }, { assertionId: "player_promised_payment", contextIds: [c], provenance: projectProv("player_promised_payment") }),
    fact("PERMITTED", { subject: marcus, object: player, term: entry }, { assertionId: "marcus_permits_entry", contextIds: [c], provenance: projectProv("marcus_permits_entry") }),
    fact("DEPENDS_ON", { subject: player, object: marcus }, { assertionId: "player_depends_on_marcus", contextIds: [c], provenance: projectProv("player_depends_on_marcus") }),
    fact("KNOWS_SECRET_ABOUT", { subject: marcus, object: player, secret }, { assertionId: "marcus_knows_sublet_secret", contextIds: [c], provenance: projectProv("marcus_knows_sublet_secret") }),
    fact("KNOWS_SECRET_ABOUT", { subject: player, object: marcus, secret: "secret_late_fee" }, { assertionId: "player_knows_late_fee_secret", contextIds: [c], provenance: projectProv("player_knows_late_fee_secret") }),
    fact("BELIEVES", { subject: player, proposition: "debt_amount_300", confidence: 0.8 }, { assertionId: "player_believes_debt_300", contextIds: [c], provenance: projectProv("player_believes_debt_300") }),
    fact("TRUSTS", { subject: player, object: marcus }, { assertionId: "player_trusts_marcus", contextIds: [c], provenance: projectProv("player_trusts_marcus") }),
    fact("FEARS", { subject: player, object: consequence }, { assertionId: "player_fears_exposure", contextIds: [c], provenance: projectProv("player_fears_exposure") }),
    fact("RESENTS", { subject: player, object: marcus }, { assertionId: "player_resents_fee", contextIds: [c], provenance: projectProv("player_resents_fee") }),
    fact("HAS_LEVERAGE_OVER", { subject: marcus, object: player, basis: debt }, { assertionId: "marcus_leverage_debt", contextIds: [c], provenance: projectProv("marcus_leverage_debt") }),
    fact("HAS_LEVERAGE_OVER", { subject: marcus, object: player, basis: secret }, { assertionId: "marcus_leverage_secret", contextIds: [c], provenance: projectProv("marcus_leverage_secret") }),
  ];
  return baseState("fixture-marcus-apt-305", "Marcus “Broker” Hill / Apartment 305", c, {
    [player]: entity(player, "Player"),
    [marcus]: entity(marcus, "Marcus “Broker” Hill"),
    [apt]: entity(apt, "Apartment 305", "LOCATION"),
    [entry]: entity(entry, "Apartment 305 entry", "OBJECT"),
    [debt]: entity(debt, "Active debt: 250 USD", "OBLIGATION"),
    [cash]: entity(cash, "Player cash: 80 USD", "RESOURCE"),
    [secret]: entity(secret, "Unregistered sublet secret", "SECRET"),
  }, facts, {
    consequences: { [consequence]: "Marcus reports the active debt to the building owner." },
    pressureContracts: [{
      contractId: "pressure_debt_exposure",
      actorId: marcus,
      targetId: player,
      contextId: c,
      scope: "ACTUAL",
      status: "ACTIVE",
      validFrom: "2026-01-01T00:00:00.000Z",
      validUntil: null,
      leverageAssertionId: "marcus_leverage_debt",
      obligationAssertionId: "player_owes_marcus_250",
      fearAssertionId: "player_fears_exposure",
      demand: "pay debt_250_usd",
      fearedConsequenceId: consequence,
      consequenceId: consequence,
      provenance: projectProv("pressure_debt_exposure"),
    }],
    blockers: [{ id: "active_lock", actor: player, target: entry, reason: "entry_locked_after_hours" }],
    recommendedPairs: [
      { actorId: player, targetId: marcus, contextId: c },
      { actorId: marcus, targetId: player, contextId: c },
      { actorId: player, targetId: entry, contextId: c },
    ],
  });
}

export function createAccessScenario() {
  const player = "player";
  const warden = "rowan_warden";
  const archive = "archive_room";
  const door = "archive_door";
  const c = "ACCESS_REVIEW";
  const facts = [
    fact("OWNS", { subject: warden, object: archive }, { assertionId: "rowan_owns_archive", contextIds: [c], provenance: projectProv("rowan_owns_archive") }),
    fact("CONTROLS", { subject: warden, object: door }, { assertionId: "rowan_controls_archive_door", contextIds: [c], provenance: projectProv("rowan_controls_archive_door") }),
    fact("PERMITTED", { subject: warden, object: player, term: door }, { assertionId: "rowan_permits_player_archive", contextIds: [c], provenance: projectProv("rowan_permits_player_archive") }),
    fact("DEPENDS_ON", { subject: player, object: archive }, { assertionId: "player_depends_on_archive", contextIds: [c], provenance: projectProv("player_depends_on_archive") }),
    fact("TRUSTS", { subject: player, object: warden }, { assertionId: "player_trusts_warden", contextIds: [c], provenance: projectProv("player_trusts_warden") }),
    fact("NEEDS", { subject: player, object: archive }, { assertionId: "player_needs_archive", contextIds: [c], provenance: projectProv("player_needs_archive") }),
    fact("PROHIBITED", { subject: warden, object: "third_party", term: door }, { assertionId: "third_party_prohibited_archive", contextIds: [c], provenance: projectProv("third_party_prohibited_archive") }),
    fact("KNOWS_SECRET_ABOUT", { subject: warden, object: player, secret: "archive_schedule" }, { assertionId: "warden_knows_archive_schedule", contextIds: [c], provenance: projectProv("warden_knows_archive_schedule") }),
    fact("HAS_LEVERAGE_OVER", { subject: warden, object: player, basis: "archive_schedule" }, { assertionId: "warden_leverage_schedule", contextIds: [c], provenance: projectProv("warden_leverage_schedule") }),
    fact("FEARS", { subject: player, object: "loss_of_access" }, { assertionId: "player_fears_loss_of_access", contextIds: [c], provenance: projectProv("player_fears_loss_of_access") }),
    fact("RESENTS", { subject: player, object: warden }, { assertionId: "player_resents_gatekeeping", contextIds: [c], provenance: projectProv("player_resents_gatekeeping") }),
  ];
  return baseState("fixture-access-permission", "Archive access and permission", c, {
    [player]: entity(player, "Player"),
    [warden]: entity(warden, "Rowan, archive warden"),
    [archive]: entity(archive, "Records archive", "LOCATION"),
    [door]: entity(door, "Archive door", "OBJECT"),
  }, facts, {
    blockers: [{ id: "door_lock", actor: player, target: door, reason: "archive_door_locked" }],
    recommendedPairs: [
      { actorId: player, targetId: warden, contextId: c },
      { actorId: player, targetId: door, contextId: c },
      { actorId: "third_party", targetId: door, contextId: c },
    ],
  });
}

export function createSecretScenario() {
  const player = "player";
  const imani = "imani_intermediary";
  const secret = "sealed_bid_secret";
  const basis = "sealed_bid_secret";
  const consequence = "disclosure_to_counterparty";
  const c = "PRIVATE_DISCLOSURE";
  const facts = [
    fact("KNOWS_SECRET_ABOUT", { subject: imani, object: player, secret }, { assertionId: "imani_knows_bid_secret", contextIds: [c], provenance: projectProv("imani_knows_bid_secret") }),
    fact("HAS_LEVERAGE_OVER", { subject: imani, object: player, basis }, { assertionId: "imani_leverage_bid_secret", contextIds: [c], provenance: projectProv("imani_leverage_bid_secret") }),
    fact("BELIEVES", { subject: player, proposition: "imani_does_not_know_bid_secret", confidence: 0.9 }, { assertionId: "player_believes_secret_safe", contextIds: [c], provenance: projectProv("player_believes_secret_safe") }),
    fact("TRUSTS", { subject: player, object: imani }, { assertionId: "player_trusts_imani", contextIds: [c], provenance: projectProv("player_trusts_imani") }),
    fact("FEARS", { subject: player, object: consequence }, { assertionId: "player_fears_counterparty_disclosure", contextIds: [c], provenance: projectProv("player_fears_counterparty_disclosure") }),
    fact("RESENTS", { subject: player, object: imani }, { assertionId: "player_resents_secret_pressure", contextIds: [c], provenance: projectProv("player_resents_secret_pressure") }),
    fact("DEPENDS_ON", { subject: player, object: imani }, { assertionId: "player_depends_on_imani", contextIds: [c], provenance: projectProv("player_depends_on_imani") }),
    fact("NEEDS", { subject: player, object: "confidentiality" }, { assertionId: "player_needs_confidentiality", contextIds: [c], provenance: projectProv("player_needs_confidentiality") }),
    fact("PROMISED_TO", { subject: imani, object: player, term: "keep_bid_private", status: "PENDING" }, { assertionId: "imani_promised_privacy", contextIds: [c], provenance: projectProv("imani_promised_privacy") }),
    fact("PROHIBITED", { subject: player, object: imani, term: "disclose_bid_secret" }, { assertionId: "player_prohibits_disclosure", contextIds: [c], provenance: projectProv("player_prohibits_disclosure") }),
  ];
  return baseState("fixture-secret-leverage", "Secret, belief, and leverage", c, {
    [player]: entity(player, "Player"),
    [imani]: entity(imani, "Imani, intermediary"),
    [secret]: entity(secret, "Sealed bid secret", "SECRET"),
  }, facts, {
    consequences: { [consequence]: "The sealed bid is disclosed to the counterparty." },
    recommendedPairs: [
      { actorId: player, targetId: imani, contextId: c },
      { actorId: imani, targetId: player, contextId: c },
    ],
  });
}

export const DEMO_SCENARIOS = Object.freeze([
  createMarcusScenario(),
  createAccessScenario(),
  createSecretScenario(),
]);

function matchesArgs(actual, expected) {
  return Object.entries(expected).every(([key, value]) => stableKey(actual[key]) === stableKey(value));
}

export function contextIsActive(state, contextId) {
  return Boolean(contextId && state.contexts?.some((context) => context.id === contextId && context.active === true));
}

export function activeFacts(state, keywordId, options = {}) {
  const now = timeOf(state.now);
  const scope = options.scope ?? "ACTUAL";
  if (now === null || (options.contextId && !contextIsActive(state, options.contextId))) return [];
  return state.facts.filter((candidate) => {
    if (candidate.keywordId !== keywordId || candidate.polarity !== "ASSERTED" || candidate.status !== "ACTIVE") return false;
    if (scope !== "ANY" && (candidate.scope ?? "ACTUAL") !== scope) return false;
    const validFrom = timeOf(candidate.validFrom);
    const validUntil = candidate.validUntil == null ? null : timeOf(candidate.validUntil);
    if (validFrom === null || validFrom > now || (candidate.validUntil != null && (validUntil === null || now >= validUntil))) return false;
    if (options.contextId && candidate.contextIds.length && !candidate.contextIds.includes(options.contextId)) return false;
    return !options.args || matchesArgs(candidate.args, options.args);
  });
}

export function hasFact(state, keywordId, args, options = {}) {
  return activeFacts(state, keywordId, { ...options, args }).length > 0;
}

const pass = (code, message, matchedFacts = []) => ({ passed: true, code, message, matchedFacts });
const fail = (code, message, matchedFacts = []) => ({ passed: false, code, message, matchedFacts });

const checkFact = (keywordId, args, label) => (state, actorId, targetId, contextId) => {
  const resolved = Object.fromEntries(Object.entries(args).map(([key, value]) => [key, value === "$ACTOR" ? actorId : value === "$TARGET" ? targetId : value]));
  const matches = activeFacts(state, keywordId, { args: resolved, contextId });
  return matches.length ? pass(`FACT_${keywordId}`, `${label} is authored.`, matches.map((entry) => entry.assertionId)) : fail(`MISSING_${keywordId}`, `${label} is not authored for this direction.`);
};

const checkAnyFact = (keywordId, label) => (state, actorId, targetId, contextId) => {
  const matches = activeFacts(state, keywordId, { contextId }).filter((entry) => entry.args.subject === actorId && (targetId == null || [entry.args.object, entry.args.creditor, entry.args.target].includes(targetId)));
  return matches.length ? pass(`FACT_${keywordId}`, `${label} is authored.`, matches.map((entry) => entry.assertionId)) : fail(`MISSING_${keywordId}`, `${label} is not authored for this direction.`);
};

const checkTargetVulnerability = (keywordId, label) => (state, _actorId, targetId, contextId) => {
  const matches = activeFacts(state, keywordId, { contextId }).filter((entry) => entry.args.subject === targetId);
  return matches.length ? pass(`FACT_${keywordId}_TARGET`, `${label} is authored for the target.`, matches.map((entry) => entry.assertionId)) : fail(`MISSING_${keywordId}_TARGET`, `${label} is not authored for the target.`);
};

const checkNoFact = (keywordId, args, code, message) => (state, actorId, targetId, contextId) => {
  const resolved = Object.fromEntries(Object.entries(args).map(([key, value]) => [key, value === "$ACTOR" ? actorId : value === "$TARGET" ? targetId : value]));
  const matches = activeFacts(state, keywordId, { args: resolved, contextId });
  return matches.length ? fail(code, message, matches.map((entry) => entry.assertionId)) : pass(code, `No ${keywordId} defeater is active.`);
};

const activeBlockers = (state, action, actorId, targetId, contextId) => {
  const now = timeOf(state.now);
  if (now === null) return [];
  return (state.blockers ?? []).filter((blocker) => {
    if (blocker.status && blocker.status !== "ACTIVE") return false;
    if (blocker.scope && blocker.scope !== "ACTUAL") return false;
    const validFrom = blocker.validFrom == null ? null : timeOf(blocker.validFrom);
    const validUntil = blocker.validUntil == null ? null : timeOf(blocker.validUntil);
    if (validFrom === null && blocker.validFrom != null) return false;
    if (validUntil === null && blocker.validUntil != null) return false;
    if (validFrom !== null && validFrom > now) return false;
    if (validUntil !== null && now >= validUntil) return false;
    if (blocker.contextId && blocker.contextId !== contextId) return false;
    if (Array.isArray(blocker.contextIds) && blocker.contextIds.length && !blocker.contextIds.includes(contextId)) return false;
    if (blocker.actionId && blocker.actionId !== action.actionId) return false;
    if (Array.isArray(blocker.actionIds) && blocker.actionIds.length && !blocker.actionIds.includes(action.actionId)) return false;
    if (blocker.id && action.blockerIds?.length && !action.blockerIds.includes(blocker.id) && !blocker.actionId && !blocker.actionIds) return false;
    if (blocker.id && !blocker.actor && !blocker.target && !blocker.actionId && !blocker.actionIds && !action.blockerIds?.includes(blocker.id)) return false;
    if (blocker.actor && blocker.actor !== actorId) return false;
    if (blocker.target && blocker.target !== targetId) return false;
    return true;
  });
};

const checkStateBlockers = (action) => (state, actorId, targetId, contextId) => {
  const matches = activeBlockers(state, action, actorId, targetId, contextId);
  return matches.length
    ? fail("STATE_BLOCKER", "An authored state blocker prevents this action.", matches.map((entry) => entry.id))
    : pass("NO_STATE_BLOCKER", "No authored state blocker is active for this action.");
};

const checkAuthorityContradiction = (state, actorId, targetId, contextId) => {
  const permitted = activeFacts(state, "PERMITTED", { args: { subject: targetId, object: actorId }, contextId });
  const prohibited = activeFacts(state, "PROHIBITED", { args: { subject: targetId, object: actorId }, contextId });
  const sameTerm = permitted.filter((permission) => prohibited.some((ban) => stableKey(permission.args.term) === stableKey(ban.args.term)));
  return sameTerm.length
    ? fail("CONTRADICTORY_AUTHORITY", "PERMITTED and PROHIBITED are both authored for the same actor, target, and term; prohibition wins.", [...sameTerm.flatMap((entry) => [entry.assertionId]), ...prohibited.filter((entry) => sameTerm.some((permission) => stableKey(permission.args.term) === stableKey(entry.args.term))).map((entry) => entry.assertionId)])
    : pass("NO_CONTRADICTORY_AUTHORITY", "No contradictory permission and prohibition are active.");
};

const relationshipTension = (state, actorId, targetId, contextId) => {
  const trusts = activeFacts(state, "TRUSTS", { args: { subject: actorId, object: targetId }, contextId });
  const resents = activeFacts(state, "RESENTS", { args: { subject: actorId, object: targetId }, contextId });
  return trusts.length && resents.length
    ? pass("TRUST_RESENTMENT_TENSION", "TRUSTS and RESENTS coexist as authored relationship tension; neither fact is silently discarded.", [...trusts, ...resents].map((entry) => entry.assertionId))
    : pass("NO_TRUST_RESENTMENT_TENSION", "No authored trust/resentment tension is active.");
};

const contextChecks = new WeakSet();

const checkContext = (expected) => {
  const check = (state, _actorId, _targetId, contextId) => {
    if (!contextIsActive(state, contextId)) return fail(contextId ? "CONTEXT_NOT_ACTIVE" : "CONTEXT_REQUIRED", contextId ? `Context ${contextId} does not exist or is inactive.` : `Action requires context ${expected}.`);
    return contextId === expected ? pass("CONTEXT_MATCH", `Context ${expected} is active.`) : fail("CONTEXT_REQUIRED", `Action requires context ${expected}.`);
  };
  contextChecks.add(check);
  return check;
};

const checkActiveContext = (state, _actorId, _targetId, contextId) => contextIsActive(state, contextId)
  ? pass("CONTEXT_ACTIVE", `Context ${contextId} is active.`)
  : fail(contextId ? "CONTEXT_NOT_ACTIVE" : "CONTEXT_REQUIRED", contextId ? `Context ${contextId} does not exist or is inactive.` : "An active context is required.");
contextChecks.add(checkActiveContext);

const compareAssertionIds = (left, right) => String(left.assertionId).localeCompare(String(right.assertionId));
const sortedFacts = (entries) => [...entries].sort(compareAssertionIds);
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const pressureObligationStatuses = new Set(["ACTIVE", "PENDING"]);

function factMatchesDirection(entry, subject, object) {
  return entry.args?.subject === subject && entry.args?.object === object;
}

function factValidityDiagnostic(state, entries, fallbackCode, fallbackMessage) {
  const now = timeOf(state.now);
  const candidates = sortedFacts(entries);
  const belief = candidates.filter((entry) => entry.scope !== "ACTUAL");
  if (belief.length) return { code: "PRESSURE_SCOPE_NOT_ACTUAL", message: "Pressure evidence is belief-scoped and cannot authorize an actual-world action.", matchedFacts: belief.map((entry) => entry.assertionId) };
  const disputed = candidates.filter((entry) => entry.polarity !== "ASSERTED");
  if (disputed.length) return { code: "PRESSURE_EVIDENCE_NOT_ASSERTED", message: "Pressure evidence is denied or disputed and cannot authorize an action.", matchedFacts: disputed.map((entry) => entry.assertionId) };
  const inactive = candidates.filter((entry) => entry.status !== "ACTIVE");
  if (inactive.length) return { code: "PRESSURE_EVIDENCE_NOT_ACTIVE", message: "Pressure evidence is not in an active authored state.", matchedFacts: inactive.map((entry) => entry.assertionId) };
  const outsideValidity = candidates.filter((entry) => {
    const validFrom = timeOf(entry.validFrom);
    const validUntil = entry.validUntil == null ? null : timeOf(entry.validUntil);
    return now === null || validFrom === null || validFrom > now || (entry.validUntil != null && (validUntil === null || now >= validUntil));
  });
  if (outsideValidity.length) return { code: "PRESSURE_EVIDENCE_OUTSIDE_VALIDITY", message: "Pressure evidence is outside its authored validity interval.", matchedFacts: outsideValidity.map((entry) => entry.assertionId) };
  return { code: fallbackCode, message: fallbackMessage, matchedFacts: [] };
}

function pressureEvidenceCandidates(state, keywordId, predicate) {
  return sortedFacts((state.facts ?? []).filter((entry) => entry.keywordId === keywordId && predicate(entry)));
}

function pressureActualFacts(state, keywordId, predicate, contextId) {
  return sortedFacts(activeFacts(state, keywordId, { contextId }).filter(predicate));
}

function activePressureObligation(entry) {
  const status = entry.args?.status;
  return status == null || pressureObligationStatuses.has(status);
}

function pressureDemandId(entry) {
  return `${entry.keywordId}:${entry.assertionId}`;
}

function isPressureFactActive(state, entry, contextId, keywordId) {
  if (!entry || entry.keywordId !== keywordId || entry.polarity !== "ASSERTED" || entry.status !== "ACTIVE" || (keywordId === "OWES" && !activePressureObligation(entry))) return false;
  if (entry.scope !== "ACTUAL" || !contextIsActive(state, contextId)) return false;
  if (entry.contextIds?.length && !entry.contextIds.includes(contextId)) return false;
  const now = timeOf(state.now);
  const validFrom = timeOf(entry.validFrom);
  const validUntil = entry.validUntil == null ? null : timeOf(entry.validUntil);
  return now !== null && validFrom !== null && validFrom <= now && (entry.validUntil == null || (validUntil !== null && now < validUntil));
}

function pressureContractFact(state, contract, assertionId, keywordId, contextId) {
  const entry = (state.facts ?? []).find((candidate) => candidate.assertionId === assertionId);
  return isPressureFactActive(state, entry, contextId, keywordId) ? entry : null;
}

function pressureFactFailure(state, assertionId, keywordId, contextId) {
  const entry = (state.facts ?? []).find((candidate) => candidate.assertionId === assertionId);
  if (!entry) return ["OWES", "PROMISED_TO"].includes(keywordId) ? "MISSING_PRESSURE_DEMAND" : "PRESSURE_EVIDENCE_MISSING";
  if (entry.scope !== "ACTUAL") return "PRESSURE_SCOPE_NOT_ACTUAL";
  if (entry.polarity !== "ASSERTED") return "PRESSURE_EVIDENCE_NOT_ASSERTED";
  if (entry.status !== "ACTIVE" || (keywordId === "OWES" && !activePressureObligation(entry))) return keywordId === "OWES" ? "MISSING_PRESSURE_DEMAND" : "PRESSURE_EVIDENCE_NOT_ACTIVE";
  if (!contextIsActive(state, contextId) || (entry.contextIds?.length && !entry.contextIds.includes(contextId))) return "CONTEXT_NOT_ACTIVE";
  const now = timeOf(state.now);
  const validFrom = timeOf(entry.validFrom);
  const validUntil = entry.validUntil == null ? null : timeOf(entry.validUntil);
  if (now === null || validFrom === null || validFrom > now || (entry.validUntil != null && (validUntil === null || now >= validUntil))) return "PRESSURE_EVIDENCE_OUTSIDE_VALIDITY";
  return "PRESSURE_EVIDENCE_INVALID";
}

function pressureContractValidity(state, contract, actorId, targetId, contextId) {
  const reasons = [];
  const now = timeOf(state.now);
  if (!nonEmpty(contract.contractId)) reasons.push("PRESSURE_CONTRACT_ID_MISSING");
  if (!contract.provenance || ["sourceId", "sourceVersion", "sourceRecordId", "transformVersion", "licenseId"].some((field) => !nonEmpty(contract.provenance[field]))) reasons.push("PRESSURE_CONTRACT_PROVENANCE_MISSING");
  if (contract.actorId !== actorId || contract.targetId !== targetId) reasons.push("PRESSURE_CONTRACT_ACTOR_TARGET_MISMATCH");
  if (contract.contextId !== contextId) reasons.push("PRESSURE_CONTRACT_CONTEXT_MISMATCH");
  if (contract.scope !== "ACTUAL") reasons.push("PRESSURE_SCOPE_NOT_ACTUAL");
  if (contract.status !== "ACTIVE") reasons.push("PRESSURE_CONTRACT_NOT_ACTIVE");
  const validFrom = timeOf(contract.validFrom);
  const validUntil = contract.validUntil == null ? null : timeOf(contract.validUntil);
  if (now === null || validFrom === null || validFrom > now || (contract.validUntil != null && (validUntil === null || now >= validUntil))) reasons.push("PRESSURE_EVIDENCE_OUTSIDE_VALIDITY");
  if (!nonEmpty(contract.demand)) reasons.push("PRESSURE_DEMAND_MISSING");
  const leverage = pressureContractFact(state, contract, contract.leverageAssertionId, "HAS_LEVERAGE_OVER", contextId);
  const demand = pressureContractFact(state, contract, contract.obligationAssertionId, "OWES", contextId) ?? pressureContractFact(state, contract, contract.obligationAssertionId, "PROMISED_TO", contextId);
  const fear = pressureContractFact(state, contract, contract.fearAssertionId, "FEARS", contextId);
  if (!leverage) reasons.push(pressureFactFailure(state, contract.leverageAssertionId, "HAS_LEVERAGE_OVER", contextId));
  if (!demand) reasons.push(pressureFactFailure(state, contract.obligationAssertionId, "OWES", contextId));
  if (!fear) reasons.push(pressureFactFailure(state, contract.fearAssertionId, "FEARS", contextId));
  if (leverage && !factMatchesDirection(leverage, actorId, targetId)) reasons.push("PRESSURE_LEVERAGE_ACTOR_TARGET_MISMATCH");
  if (demand && (!factMatchesDirection(demand, targetId, actorId) || !nonEmpty(demand.args?.term) || stableKey(demand.args.term) !== stableKey(leverage?.args?.basis))) reasons.push("PRESSURE_DEMAND_LEVERAGE_MISMATCH");
  if (fear && (fear.args?.subject !== targetId || fear.args?.object !== contract.fearedConsequenceId || fear.args?.object !== contract.consequenceId)) reasons.push("PRESSURE_FEAR_NOT_LINKED");
  if (!nonEmpty(contract.consequenceId) || !nonEmpty(state.consequences?.[contract.consequenceId]) || contract.consequenceId !== contract.fearedConsequenceId) reasons.push("PRESSURE_CONSEQUENCE_NOT_AUTHORED");
  return { contract, leverage, demand, fear, consequenceId: contract.consequenceId, reasons, valid: reasons.length === 0 };
}

/**
 * Resolve pressure only through an explicit authored contract.  The contract
 * binds actor, target, leverage, demand, fear, consequence, context, scope,
 * and time; no fallback text or unrelated fact may fill a missing edge.
 */
export function resolvePressureGrounding(state, actorId, targetId, contextId) {
  const leveragePredicate = (entry) => factMatchesDirection(entry, actorId, targetId) && nonEmpty(entry.args?.basis);
  const leverageCandidates = pressureEvidenceCandidates(state, "HAS_LEVERAGE_OVER", leveragePredicate);
  const leverages = pressureActualFacts(state, "HAS_LEVERAGE_OVER", leveragePredicate, contextId);
  const obligationPredicate = (entry) => factMatchesDirection(entry, targetId, actorId) && nonEmpty(entry.args?.term) && activePressureObligation(entry);
  const obligationCandidates = sortedFacts((state.facts ?? []).filter((entry) => ["OWES", "PROMISED_TO"].includes(entry.keywordId) && obligationPredicate(entry)));
  const obligations = sortedFacts([
    ...pressureActualFacts(state, "OWES", obligationPredicate, contextId),
    ...pressureActualFacts(state, "PROMISED_TO", obligationPredicate, contextId),
  ]);
  const fearPredicate = (entry) => entry.args?.subject === targetId && nonEmpty(entry.args?.object);
  const fearCandidates = pressureEvidenceCandidates(state, "FEARS", fearPredicate);
  const fears = pressureActualFacts(state, "FEARS", fearPredicate, contextId);
  const authoredConsequences = new Set(Object.keys(state.consequences ?? {}).filter((key) => nonEmpty(key) && nonEmpty(state.consequences[key])));
  const consequenceFears = fears.filter((entry) => authoredConsequences.has(entry.args.object));
  const leverageBasisKeys = new Set(leverages.map((entry) => stableKey(entry.args.basis)));
  const demandByBasis = obligations.filter((entry) => leverageBasisKeys.has(stableKey(entry.args.term)));
  const contractCandidates = (state.pressureContracts ?? []).filter((contract) => contract.actorId === actorId && contract.targetId === targetId && contract.contextId === contextId).sort((left, right) => String(left.contractId).localeCompare(String(right.contractId)));
  const contractEvidence = contractCandidates.map((contract) => pressureContractValidity(state, contract, actorId, targetId, contextId));
  const matchingProhibitions = pressureActualFacts(state, "PROHIBITED", (entry) => {
    const directionMatches = factMatchesDirection(entry, actorId, targetId) || factMatchesDirection(entry, targetId, actorId);
    const termMatches = entry.args?.term === "INVOKE_CONSEQUENCE" || leverageBasisKeys.has(stableKey(entry.args?.term)) || obligations.some((demand) => stableKey(demand.args?.term) === stableKey(entry.args?.term));
    return directionMatches && termMatches;
  }, contextId);
  const linked = contractEvidence.filter((entry) => entry.valid && !matchingProhibitions.length);
  const chains = linked.map((entry) => ({
    contract: entry.contract,
    pressureContractId: entry.contract.contractId,
    leverage: entry.leverage,
    demand: entry.demand,
    fear: entry.fear,
    consequenceId: entry.consequenceId,
    prohibited: matchingProhibitions,
  }));
  return {
    leverageCandidates, leverages, linkedLeverages: contractEvidence.filter((entry) => entry.leverage).map((entry) => entry.leverage),
    obligationCandidates, obligations, linkedDemands: contractEvidence.filter((entry) => entry.demand).map((entry) => entry.demand),
    demandByBasis, fearCandidates, fears, consequenceFears,
    authoredConsequences: [...authoredConsequences].sort(), matchingProhibitions,
    contractCandidates, contractEvidence, chain: chains[0] ?? null, chains,
  };
}

function pressureMatchedIds(...groups) {
  return groups.flatMap((group) => group ?? []).map((entry) => entry.assertionId).filter(Boolean).sort();
}

function pressureContractMatchedIds(evidence) {
  return [
    evidence.contract?.contractId,
    evidence.leverage?.assertionId,
    evidence.demand?.assertionId,
    evidence.fear?.assertionId,
  ].filter(Boolean).sort();
}

const checkPressureLeverage = (state, actorId, targetId, contextId) => {
  const evidence = resolvePressureGrounding(state, actorId, targetId, contextId);
  if (evidence.linkedLeverages.length) return pass("PRESSURE_LEVERAGE_GROUNDED", "An actual, asserted, active leverage basis is authored for this actor and target.", pressureMatchedIds(evidence.linkedLeverages));
  const contractDiagnostic = evidence.contractEvidence.flatMap((entry) => entry.reasons).find((code) => ["PRESSURE_SCOPE_NOT_ACTUAL", "PRESSURE_EVIDENCE_NOT_ASSERTED", "PRESSURE_EVIDENCE_OUTSIDE_VALIDITY", "PRESSURE_EVIDENCE_NOT_ACTIVE"].includes(code));
  if (contractDiagnostic) return fail(contractDiagnostic, "The pressure contract's leverage evidence is not actual, asserted, active, and time-valid.", []);
  if (evidence.leverages.length && evidence.contractCandidates.length) return fail("PRESSURE_DEMAND_LEVERAGE_MISMATCH", "The authored pressure contract does not link the actor's active leverage basis.", pressureMatchedIds(evidence.leverages));
  const diagnostic = factValidityDiagnostic(state, evidence.leverageCandidates, "MISSING_PRESSURE_LEVERAGE", "No actual, asserted, active leverage basis is authored for this actor and target.");
  return fail(diagnostic.code, diagnostic.message, diagnostic.matchedFacts);
};

const checkPressureDemand = (state, actorId, targetId, contextId) => {
  const evidence = resolvePressureGrounding(state, actorId, targetId, contextId);
  if (evidence.linkedDemands.length) return pass("PRESSURE_DEMAND_GROUNDED", "An active authored obligation or promise is named by the pressure contract.", pressureMatchedIds(evidence.linkedDemands, evidence.linkedLeverages));
  const contractDiagnostic = evidence.contractEvidence.flatMap((entry) => entry.reasons).find((code) => ["PRESSURE_SCOPE_NOT_ACTUAL", "PRESSURE_EVIDENCE_NOT_ASSERTED", "PRESSURE_EVIDENCE_OUTSIDE_VALIDITY", "PRESSURE_EVIDENCE_NOT_ACTIVE"].includes(code));
  if (contractDiagnostic) return fail(contractDiagnostic, "The pressure contract's demand evidence is not actual, asserted, active, and time-valid.", []);
  const missingContractEvidence = evidence.contractEvidence.flatMap((entry) => entry.reasons).find((code) => ["PRESSURE_EVIDENCE_MISSING", "MISSING_PRESSURE_DEMAND"].includes(code));
  if (missingContractEvidence) return fail(missingContractEvidence, "The pressure contract names no active authored demand evidence.", []);
  if (evidence.demandByBasis.length && evidence.contractCandidates.length) return fail("PRESSURE_DEMAND_LEVERAGE_MISMATCH", "The active obligation is not the obligation named by the authored pressure contract.", pressureMatchedIds(evidence.demandByBasis));
  if (evidence.obligations.length) return fail("PRESSURE_DEMAND_LEVERAGE_MISMATCH", "The authored demand term does not match the actor's leverage basis; pressure cannot cross-contaminate obligations.", pressureMatchedIds(evidence.obligations, evidence.leverages));
  const diagnostic = factValidityDiagnostic(state, evidence.obligationCandidates, "MISSING_PRESSURE_DEMAND", "No active authored obligation or promise connects the target to the actor's leverage basis.");
  return fail(diagnostic.code, diagnostic.message, diagnostic.matchedFacts);
};

const checkPressureConsequence = (state, actorId, targetId, contextId) => {
  const evidence = resolvePressureGrounding(state, actorId, targetId, contextId);
  if (evidence.chain) return pass("PRESSURE_CONSEQUENCE_GROUNDED", "The target's authored fear names the selected authored consequence within the same pressure chain.", pressureContractMatchedIds(evidence.chain));
  if (evidence.matchingProhibitions.length) return fail("PRESSURE_PROHIBITED", "An authored prohibition defeats this pressure chain.", pressureMatchedIds(evidence.matchingProhibitions));
  const invalidContract = evidence.contractEvidence.find((entry) => entry.reasons.length);
  if (invalidContract) {
    const priority = ["PRESSURE_FEAR_NOT_LINKED", "PRESSURE_CONSEQUENCE_NOT_AUTHORED", "PRESSURE_CONTRACT_PROVENANCE_MISSING", "PRESSURE_EVIDENCE_MISSING", "PRESSURE_EVIDENCE_NOT_ASSERTED", "PRESSURE_EVIDENCE_NOT_ACTIVE", "PRESSURE_EVIDENCE_OUTSIDE_VALIDITY"];
    const reason = priority.find((code) => invalidContract.reasons.includes(code)) ?? invalidContract.reasons[0];
    return fail(reason, `The authored pressure contract ${invalidContract.contract.contractId} failed its linked evidence checks.`, pressureContractMatchedIds(invalidContract));
  }
  if (evidence.fears.length && !evidence.consequenceFears.length) return fail("PRESSURE_FEAR_NOT_LINKED", "The target has fear evidence, but it does not name an authored consequence identity.", pressureMatchedIds(evidence.fears));
  if (evidence.consequenceFears.length && !evidence.demandByBasis.length) return fail("PRESSURE_CONSEQUENCE_DEMAND_NOT_LINKED", "The feared consequence is authored, but no demand is linked to the leverage basis.", pressureMatchedIds(evidence.consequenceFears, evidence.leverages));
  if (evidence.fearCandidates.length) {
    const diagnostic = factValidityDiagnostic(state, evidence.fearCandidates, "MISSING_PRESSURE_FEARED_CONSEQUENCE", "No actual, asserted, active, time-valid target fear is available for this pressure chain.");
    return fail(diagnostic.code, diagnostic.message, diagnostic.matchedFacts);
  }
  return fail("MISSING_PRESSURE_FEARED_CONSEQUENCE", "No target fear is authored for an identity in the consequence map.");
};

function pressurePayload(actorId, targetId, state, contextId) {
  const evidence = resolvePressureGrounding(state, actorId, targetId, contextId);
  if (!evidence.chain) throw new Error("PRESSURE_GROUNDING_UNAVAILABLE");
  const { leverage, demand, fear, consequenceId } = evidence.chain;
  const allEvidence = [evidence.chain.contract, leverage, demand, fear];
  const validFromEntry = allEvidence.reduce((current, entry) => timeOf(entry.validFrom) > timeOf(current.validFrom) ? entry : current, allEvidence[0]);
  const boundedUntil = allEvidence.filter((entry) => entry.validUntil != null).sort((left, right) => timeOf(left.validUntil) - timeOf(right.validUntil))[0] ?? null;
  const compactFields = (fields) => Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== null));
  const validity = compactFields({
    scope: "ACTUAL",
    contextId,
    validFrom: validFromEntry.validFrom,
    validUntil: boundedUntil?.validUntil ?? null,
    validUntilIsUnbounded: boundedUntil === null,
  });
  return {
    actor: actorId,
    target: targetId,
    action: "INVOKE_CONSEQUENCE",
    contextId,
    leverage: compactFields({
      actor: actorId,
      target: targetId,
      basis: leverage.args.basis,
      sourceAssertionId: leverage.assertionId,
      scope: leverage.scope,
      contextId,
      validFrom: leverage.validFrom,
      validUntil: leverage.validUntil,
      pressureContractId: evidence.chain.pressureContractId,
    }),
    demand: compactFields({
      kind: demand.keywordId === "OWES" ? "FULFILL_OBLIGATION" : "HONOR_PROMISE",
      demandId: pressureDemandId(demand),
      subject: demand.args.subject,
      object: demand.args.object,
      term: demand.args.term,
      amount: demand.args.amount,
      unit: demand.args.unit,
      due: demand.args.due,
      sourceAssertionId: demand.assertionId,
      scope: demand.scope,
      contextId,
      validFrom: demand.validFrom,
      validUntil: demand.validUntil,
      pressureContractId: evidence.chain.pressureContractId,
      authoredDemand: evidence.chain.contract.demand,
    }),
    consequence: compactFields({
      consequenceId,
      text: state.consequences[consequenceId],
      fearedBy: fear.args.subject,
      fearedConsequenceSourceAssertionId: fear.assertionId,
      leverageBasis: leverage.args.basis,
      demandId: pressureDemandId(demand),
      scope: fear.scope,
      contextId,
      validFrom: fear.validFrom,
      validUntil: fear.validUntil,
      validity,
      pressureContractId: evidence.chain.pressureContractId,
    }),
  };
};

export const ACTION_DEFINITIONS = Object.freeze([
  {
    actionId: "REQUEST_EXTENSION", displayName: "Request a repayment extension", tplPresentation: { label: "a repayment extension" }, macroAct: "ASK",
    requiredChecks: [checkContext("PRIVATE_NEGOTIATION"), checkFact("OWES", { subject: "$ACTOR", object: "$TARGET" }, "An active debt connects the actor and target"), checkFact("NEEDS", { subject: "$ACTOR", object: "debt_relief" }, "The actor needs debt relief")],
    forbiddenChecks: [],
    payload: (actorId, targetId) => ({ actor: actorId, target: targetId, action: "REQUEST_EXTENSION", object: "debt_relief" }),
    history: "EXTENSION_REQUESTED",
  },
  {
    actionId: "OFFER_PARTIAL_PAYMENT", displayName: "Offer a partial payment", tplPresentation: { label: "a partial payment" }, macroAct: "DEAL",
    requiredChecks: [checkContext("PRIVATE_NEGOTIATION"), checkFact("OWES", { subject: "$ACTOR", object: "$TARGET" }, "An active debt connects the actor and target"), checkFact("OWNS", { subject: "$ACTOR", object: "cash_80_usd" }, "The actor owns a cash resource"), checkFact("NEEDS", { subject: "$ACTOR", object: "debt_relief" }, "The actor needs debt relief")],
    forbiddenChecks: [],
    payload: (actorId, targetId) => ({ actor: actorId, target: targetId, action: "OFFER_PARTIAL_PAYMENT", offer: { object: "cash_80_usd", quantity: 80, unit: "USD" }, return: { object: "debt_250_usd", status: "partial_satisfaction" } }),
    history: "PARTIAL_PAYMENT_OFFERED",
  },
  {
    actionId: "OFFER_CASH_FOR_EXTENSION", displayName: "Offer cash for an extension", tplPresentation: { label: "cash for an extension" }, macroAct: "DEAL",
    requiredChecks: [checkContext("PRIVATE_NEGOTIATION"), checkFact("OWES", { subject: "$ACTOR", object: "$TARGET" }, "An active debt connects the actor and target"), checkFact("OWNS", { subject: "$ACTOR", object: "cash_80_usd" }, "The actor owns a cash resource"), checkFact("PROMISED_TO", { subject: "$ACTOR", object: "$TARGET" }, "A commitment connects the parties")],
    forbiddenChecks: [],
    payload: (actorId, targetId) => ({ actor: actorId, target: targetId, action: "OFFER_CASH_FOR_EXTENSION", offer: { object: "cash_80_usd", quantity: 80, unit: "USD" }, return: { object: "repayment_deadline", change: "extension" } }),
    history: "CASH_FOR_EXTENSION_OFFERED",
  },
  {
    actionId: "REQUEST_ACCESS", displayName: "Request controlled access", tplPresentation: { label: "controlled access" }, macroAct: "ASK",
    requiredChecks: [checkContext("ACCESS_REVIEW"), checkFact("CONTROLS", { subject: "$TARGET", object: "archive_door" }, "The target controls the access channel"), checkFact("PERMITTED", { subject: "$TARGET", object: "$ACTOR", term: "archive_door" }, "The target has authored permission"), checkFact("DEPENDS_ON", { subject: "$ACTOR", object: "archive_room" }, "The actor depends on the resource")],
    forbiddenChecks: [checkNoFact("PROHIBITED", { subject: "$TARGET", object: "$ACTOR", term: "archive_door" }, "SPECIFIC_PROHIBITION", "A specific prohibition defeats this access request.")],
    blockerIds: ["active_lock", "door_lock"],
    payload: (actorId, targetId) => ({ actor: actorId, target: targetId, action: "REQUEST_ACCESS", object: "archive_door", permission: "requested" }),
    history: "ACCESS_REQUESTED",
  },
  {
    actionId: "TRADE_INFORMATION", displayName: "Trade authored information", tplPresentation: { label: "an information exchange" }, macroAct: "DEAL",
    requiredChecks: [checkContext("PRIVATE_DISCLOSURE"), checkFact("KNOWS_SECRET_ABOUT", { subject: "$ACTOR", object: "$TARGET" }, "The actor has scoped secret knowledge"), checkFact("HAS_LEVERAGE_OVER", { subject: "$ACTOR", object: "$TARGET" }, "The actor has an authored leverage basis")],
    forbiddenChecks: [],
    payload: (actorId, targetId) => ({ actor: actorId, target: targetId, action: "TRADE_INFORMATION", offer: { information: "scoped_secret" }, return: { object: "confidentiality_or_action" } }),
    history: "INFORMATION_TRADE_PROPOSED",
  },
  {
    actionId: "INVOKE_CONSEQUENCE", displayName: "Invoke an authored consequence", tplPresentation: { label: "the authored consequence" }, macroAct: "PRESSURE",
    requiredChecks: [checkActiveContext, checkPressureLeverage, checkPressureDemand, checkPressureConsequence],
    forbiddenChecks: [],
    payload: pressurePayload,
    history: "CONSEQUENCE_INVOKED",
  },
  {
    actionId: "CHALLENGE_DEBT_VALIDITY", displayName: "Challenge the debt validity", tplPresentation: { label: "a review of the debt ledger" }, macroAct: "ASK",
    requiredChecks: [checkContext("PRIVATE_NEGOTIATION"), checkAnyFact("OWES", "A debt claim exists"), checkFact("BELIEVES", { subject: "$ACTOR", proposition: "debt_amount_300" }, "The actor has a conflicting debt belief")],
    forbiddenChecks: [],
    payload: (actorId, targetId) => ({ actor: actorId, target: targetId, action: "CHALLENGE_DEBT_VALIDITY", object: "debt_250_usd", request: "review_authored_ledger" }),
    history: "DEBT_VALIDITY_CHALLENGED",
  },
  {
    actionId: "REQUEST_EVIDENCE", displayName: "Request evidence", tplPresentation: { label: "evidence for the knowledge claim" }, macroAct: "ASK",
    requiredChecks: [checkContext("PRIVATE_DISCLOSURE"), checkFact("BELIEVES", { subject: "$ACTOR", proposition: "imani_does_not_know_bid_secret" }, "The actor holds an uncertain belief about knowledge"), checkFact("KNOWS_SECRET_ABOUT", { subject: "$TARGET", object: "$ACTOR" }, "The target's scoped knowledge can be challenged")],
    forbiddenChecks: [],
    payload: (actorId, targetId) => ({ actor: actorId, target: targetId, action: "REQUEST_EVIDENCE", request: "show_knowledge_evidence" }),
    history: "EVIDENCE_REQUESTED",
  },
  {
    actionId: "REQUEST_SUPPORT", displayName: "Request dependency support", tplPresentation: { label: "dependency support" }, macroAct: "ASK",
    requiredChecks: [checkFact("DEPENDS_ON", { subject: "$ACTOR", object: "$TARGET" }, "The actor depends on the target"), checkFact("TRUSTS", { subject: "$ACTOR", object: "$TARGET" }, "The actor has authored directional trust")],
    forbiddenChecks: [],
    payload: (actorId, targetId) => ({ actor: actorId, target: targetId, action: "REQUEST_SUPPORT", request: "provide_dependency_support" }),
    history: "SUPPORT_REQUESTED",
  },
]);

export const ACTION_BY_ID = new Map(ACTION_DEFINITIONS.map((entry) => [entry.actionId, entry]));

function runChecks(checks, state, actorId, targetId, contextId) {
  return checks.map((check) => check(state, actorId, targetId, contextId));
}

export function evaluateAction(state, actionId, actorId, targetId, contextId) {
  const action = ACTION_BY_ID.get(actionId);
  if (!action) throw new Error(`Unknown action: ${actionId}`);
  const hasContextCheck = action.requiredChecks.some((check) => contextChecks.has(check));
  const required = runChecks(hasContextCheck ? action.requiredChecks : [checkActiveContext, ...action.requiredChecks], state, actorId, targetId, contextId);
  const consistencyChecks = [relationshipTension];
  const stateBlockerCheck = checkStateBlockers(action);
  const contradictionChecks = actionId === "REQUEST_ACCESS" ? [checkAuthorityContradiction] : [];
  const forbidden = runChecks([...action.forbiddenChecks, stateBlockerCheck, ...contradictionChecks], state, actorId, targetId, contextId);
  const failed = [...required.filter((entry) => !entry.passed), ...forbidden.filter((entry) => !entry.passed)];
  const available = failed.length === 0;
  const consistency = runChecks(consistencyChecks, state, actorId, targetId, contextId);
  return {
    actionId,
    displayName: action.displayName,
    macroAct: action.macroAct,
    actorId,
    targetId,
    contextId,
    status: available ? "AVAILABLE" : "BLOCKED",
    requiredChecks: required,
    forbiddenChecks: forbidden,
    consistencyChecks: consistency,
    blockers: failed.map((entry) => ({ code: entry.code, message: entry.message, matchedFacts: entry.matchedFacts })),
    trace: [
      { step: "ACTION_SELECTED", detail: `${actionId} selected for ${actorId} → ${targetId}.` },
      ...required.map((entry) => ({ step: "REQUIRED_ASSERTION", code: entry.code, passed: entry.passed, detail: entry.message, matchedFacts: entry.matchedFacts })),
      ...forbidden.map((entry) => ({ step: "DEFEATER_CHECK", code: entry.code, passed: entry.passed, detail: entry.message, matchedFacts: entry.matchedFacts })),
      ...consistency.map((entry) => ({ step: "CONSISTENCY_CHECK", code: entry.code, passed: entry.passed, detail: entry.message, matchedFacts: entry.matchedFacts })),
      { step: "AVAILABILITY_RESOLVED", status: available ? "AVAILABLE" : "BLOCKED", detail: available ? "All authored preconditions passed." : "At least one authored precondition or defeater failed." },
    ],
  };
}

export function evaluateAvailableActions(state, actorId, targetId, contextId, macroAct = null) {
  return ACTION_DEFINITIONS
    .filter((action) => !macroAct || action.macroAct === macroAct)
    .map((action) => evaluateAction(state, action.actionId, actorId, targetId, contextId));
}

export function resolveAction(state, actionId, actorId, targetId, contextId) {
  const evaluation = evaluateAction(state, actionId, actorId, targetId, contextId);
  const action = ACTION_BY_ID.get(actionId);
  const nextState = structuredClone(state);
  const available = evaluation.status === "AVAILABLE";
  const payload = available ? action.payload(actorId, targetId, state, contextId) : null;
  const existingHistoryIds = new Set((state.history ?? []).map((event) => event.historyId));
  const priorOccurrences = (state.history ?? []).filter((event) => event.actionId === actionId && event.actorId === actorId && event.targetId === targetId && event.contextId === contextId).length;
  let occurrence = priorOccurrences + 1;
  let historyId = `${state.scenarioId}:${action.history}:${actorId}:${targetId}:${contextId}:${occurrence}`;
  while (existingHistoryIds.has(historyId)) {
    occurrence += 1;
    historyId = `${state.scenarioId}:${action.history}:${actorId}:${targetId}:${contextId}:${occurrence}`;
  }
  const historyEvent = {
    historyId,
    eventType: action.history,
    actorId,
    targetId,
    actionId,
    contextId,
    createdAt: iso(state.now),
    provenance: projectProv(`${state.scenarioId}:${action.history}`),
  };
  if (available) nextState.history.push(historyEvent);
  const resolutionRecordId = available ? nextResolutionRecordId(historyId) : null;
  if (available) {
    const record = freezeDeep({
      resolutionRecordId,
      historyId,
      actionId,
      macroAct: action.macroAct,
      actorId,
      targetId,
      contextId,
      stateBeforeFingerprint: stableKey(state),
      stateAfterFingerprint: stableKey(nextState),
      payload: freezeDeep(structuredClone(payload)),
    });
    RESOLUTION_PAYLOAD_RECORDS.set(resolutionRecordId, record);
  }
  return {
    actionId,
    actorId,
    targetId,
    macroAct: action.macroAct,
    resolutionRecordId,
    payload,
    preconditionEvaluations: { required: evaluation.requiredChecks, forbidden: evaluation.forbiddenChecks },
    outcome: available ? "PROPOSED" : "BLOCKED",
    deterministicEffects: available ? [{ kind: "EMIT_HISTORY", historyId: historyEvent.historyId }] : [],
    emittedHistory: available ? [historyEvent] : [],
    mandatorySemanticFacts: available ? Object.keys(payload) : [],
    forbiddenSemanticAdditions: ["unauthored_deadline", "unauthored_threat", "unauthored_promise", "unauthored_knowledge"],
    quarantine: available ? null : { status: "QUARANTINED", actionId, reason: "BLOCKED_ACTION_HAS_NO_RENDERABLE_SEMANTIC_PAYLOAD", blockers: evaluation.blockers },
    trace: [...evaluation.trace, ...(available ? [] : [{ step: "BLOCKED_ACTION_QUARANTINED", status: "QUARANTINED", detail: "No semantic payload or history effect is exposed for a blocked action." }])],
    stateBefore: structuredClone(state),
    stateAfter: nextState,
  };
}

export function getAuthoritativeResolvedPayload(resolvedAction, contextId) {
  const historyId = resolvedAction?.emittedHistory?.[0]?.historyId;
  const resolutionRecordId = resolvedAction?.resolutionRecordId;
  const record = typeof resolutionRecordId === "string" ? RESOLUTION_PAYLOAD_RECORDS.get(resolutionRecordId) : null;
  if (!record) throw new Error("RESOLUTION_CANONICAL_RECORD_UNAVAILABLE");
  if (record.resolutionRecordId !== resolutionRecordId || record.historyId !== historyId) throw new Error("RESOLUTION_CANONICAL_RECORD_IDENTITY_MISMATCH");
  if (record.actionId !== resolvedAction.actionId || record.macroAct !== resolvedAction.macroAct || record.actorId !== resolvedAction.actorId || record.targetId !== resolvedAction.targetId || record.contextId !== contextId) {
    throw new Error("RESOLUTION_CANONICAL_RECORD_IDENTITY_MISMATCH");
  }
  if (stableKey(resolvedAction.stateBefore) !== record.stateBeforeFingerprint || stableKey(resolvedAction.stateAfter) !== record.stateAfterFingerprint) throw new Error("RESOLUTION_CANONICAL_RECORD_STATE_MISMATCH");
  return structuredClone(record.payload);
}

export function getRecordedResolutionPayload(resolutionRecordId) {
  const record = typeof resolutionRecordId === "string" ? RESOLUTION_PAYLOAD_RECORDS.get(resolutionRecordId) : null;
  return record ? structuredClone(record) : null;
}

export function priorCannotMutateState(state, prior) {
  const before = JSON.stringify(state);
  const suggested = { ...structuredClone(prior), defaultOnly: true, status: "SUGGESTION_ONLY" };
  const after = JSON.stringify(state);
  return { unchanged: before === after, prior: suggested, trace: ["Prior recorded as retrieval suggestion only.", "No live fact, stat, action availability, or outcome was changed."] };
}

export function scenarioActionSummary(state) {
  return state.recommendedPairs.map((pair) => ({
    ...pair,
    actions: evaluateAvailableActions(state, pair.actorId, pair.targetId, pair.contextId),
  }));
}

export function enumerateSemanticConfigurations(states, coordinates) {
  const valid = [];
  const seen = new Set();
  let actCompatibleTheoretical = 0;
  let actIncompatible = 0;
  let blocked = 0;
  let duplicate = 0;
  let unreachable = 0;
  const coordinateList = [...coordinates];
  for (const state of states) {
    for (const pair of state.recommendedPairs) {
      const evaluations = evaluateAvailableActions(state, pair.actorId, pair.targetId, pair.contextId);
      for (const evaluation of evaluations) {
        for (const coordinate of coordinateList) {
          const row = { scenarioId: state.scenarioId, actorId: pair.actorId, targetId: pair.targetId, actionId: evaluation.actionId, macroAct: evaluation.macroAct, coordinateKey: coordinate.key };
          const coordinateIsValid = typeof coordinate.key === "string" && MACRO_ACTS.includes(coordinate.speechAct);
          if (!coordinateIsValid || pair.reachable === false || coordinate.reachable === false) {
            unreachable += 1;
          } else if (coordinate.speechAct !== evaluation.macroAct) {
            actIncompatible += 1;
          } else {
            actCompatibleTheoretical += 1;
            if (evaluation.status === "BLOCKED") {
              blocked += 1;
            } else {
              const candidateKey = stableKey(row);
              if (seen.has(candidateKey)) duplicate += 1;
              else {
                seen.add(candidateKey);
                valid.push(row);
              }
            }
          }
        }
      }
    }
  }
  const candidatePairs = states.reduce((sum, state) => sum + state.recommendedPairs.length, 0);
  const totalCandidateCombinations = candidatePairs * ACTION_DEFINITIONS.length * coordinateList.length;
  return {
    theoretical: actCompatibleTheoretical,
    actCompatibleTheoretical,
    totalCandidateCombinations,
    actIncompatible,
    blocked,
    duplicate,
    unreachable,
    validUnique: valid.length,
    candidatePairs,
    blockedCandidates: blocked,
    duplicateCandidates: duplicate,
    validUniqueSemanticConfigurations: valid.length,
    validConfigurations: valid,
    classificationTotals: { theoretical: actCompatibleTheoretical, actIncompatible, blocked, duplicate, unreachable, validUnique: valid.length },
    notes: ["Theoretical is the act-compatible action/coordinate cross-product; act-incompatible combinations are excluded before availability evaluation.", "Blocked is an act-compatible action whose authored mechanics evaluation is BLOCKED; duplicate and unreachable candidates are retained as explicit exclusion classes.", "It does not claim runtime TPL render capacity; the 180-coordinate runtime is reviewed authoring-preview language and remains production-ineligible until owner approval."],
  };
}
