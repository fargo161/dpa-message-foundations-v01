import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  DEMO_SCENARIOS,
  createAccessScenario,
  createMarcusScenario,
  createSecretScenario,
  enumerateSemanticConfigurations,
  evaluateAction,
  fact,
  resolveAction,
} from "../src/mechanics.mjs";
import { generateMatrix } from "../src/based.mjs";
import { normalizeAtomicRows, normalizeSocialChemistryTsv } from "../src/ingestion.mjs";
import { SOURCE_BY_ID, validateArtifactDigest } from "../src/sources.mjs";
import { assertValidDocument } from "../src/schema-validator.mjs";
import { FoundationStore } from "../src/store.mjs";
import addFormats from "ajv-formats";

const root = fileURLToPath(new URL("..", import.meta.url));

const tplLoad = await import("../src/tpl.mjs")
  .then((module) => ({ module, error: null }))
  .catch((error) => ({ module: null, error }));
const adapterLoad = await import("../src/action-tpl-adapter.mjs")
  .then((module) => ({ module, error: null }))
  .catch((error) => ({ module: null, error }));
const inspectionLoad = await import("../src/inspection.mjs")
  .then((module) => ({ module, error: null }))
  .catch((error) => ({ module: null, error }));

const syntaxBlocker = tplLoad.error
  ? `BLOCKING SYNTAX_BLOCKER src/tpl.mjs:72 — ${tplLoad.error.name}: ${tplLoad.error.message}`
  : null;

function requireTpl(t) {
  if (tplLoad.module) return tplLoad.module;
  t.skip(`${syntaxBlocker}; TPL attack deferred until the syntax repair is present.`);
  return null;
}

function metric(capacity, ...names) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(capacity, name)) return capacity[name];
    if (Object.prototype.hasOwnProperty.call(capacity.breakdown ?? {}, name)) return capacity.breakdown[name];
  }
  return undefined;
}

function runGit(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function canonicalSemanticRequest(speechAct, semanticSlots = {}, overrides = {}) {
  const actionId = speechAct === "ASK" ? "REQUEST_EXTENSION" : speechAct === "DEAL" ? "OFFER_PARTIAL_PAYMENT" : "INVOKE_CONSEQUENCE";
  const slots = {
    actor: "player",
    target: "marcus_broker_hill",
    action: actionId,
    contextId: "PRIVATE_NEGOTIATION",
    ...semanticSlots,
  };
  return {
    schemaVersion: "dpa-keyword-foundation@0.1",
    adapterVersion: "action-tpl-adapter@0.1",
    semanticRequestId: `semantic:red-team:${speechAct.toLowerCase()}`,
    actionId,
    actorId: "player",
    targetId: "marcus_broker_hill",
    contextId: "PRIVATE_NEGOTIATION",
    actor: "player",
    target: "marcus_broker_hill",
    action: actionId,
    speechAct,
    outcome: "PROPOSED",
    slots,
    mandatorySemanticFacts: ["authored_fact"],
    forbiddenSemanticAdditions: ["unauthored_threat"],
    provenance: [{
      sourceId: "red-team",
      sourceRecordId: `event:${speechAct}`,
      transformVersion: "red-team@1",
      licenseId: "PROJECT_AUTHORED",
    }],
    ...overrides,
  };
}

test("TPL syntax gate reports the exact current blocker", () => {
  assert.equal(tplLoad.error, null, syntaxBlocker ?? "");
});

test("ASK and PRESSURE actions cannot cross into DEAL or ASK coordinates", () => {
  const coordinates = generateMatrix().filter((coordinate) => ["DEAL", "PRESSURE", "ASK"].includes(coordinate.speechAct) && coordinate.vibeId === "BA" && coordinate.deliveryIntensity === "SUBTLE");
  const coordinateActByKey = new Map(coordinates.map((coordinate) => [coordinate.key, coordinate.speechAct]));
  const capacity = enumerateSemanticConfigurations(DEMO_SCENARIOS, coordinates);
  const mismatches = capacity.validConfigurations.filter((row) => coordinateActByKey.get(row.coordinateKey) !== row.macroAct);
  assert.deepEqual(mismatches, [], "valid configurations contain an ASK+DEAL or PRESSURE+ASK cross-act pairing");
  assert.ok(capacity.validConfigurations.some((row) => row.macroAct === "ASK"));
  assert.ok(capacity.validConfigurations.some((row) => row.macroAct === "PRESSURE"));
});

test("capacity is independently derived into act-compatible and incompatible classes", () => {
  const capacity = enumerateSemanticConfigurations(DEMO_SCENARIOS, generateMatrix());
  assert.equal(capacity.candidatePairs, 8);
  assert.equal(metric(capacity, "theoretical"), 4320);
  assert.equal(metric(capacity, "actIncompatible", "actIncompatibleCandidates"), 8640);
  // Strict pressure grounding removes the previously available but unauthored
  // secret-pressure branch: 600 valid and 3,720 blocked.
  assert.equal(metric(capacity, "blocked", "blockedCandidates"), 3720);
  assert.equal(metric(capacity, "duplicate", "duplicateCandidates"), 0);
  assert.equal(metric(capacity, "unreachable", "unreachableCandidates"), 0);
  assert.equal(metric(capacity, "validUnique", "validUniqueSemanticConfigurations"), 600);
});

test("belief-scoped debt cannot authorize an actual-world request", () => {
  const state = createMarcusScenario();
  state.facts = state.facts.filter((entry) => !(entry.keywordId === "OWES" && entry.scope === "ACTUAL"));
  state.facts.push(fact("OWES", { subject: "player", object: "marcus_broker_hill", term: "debt_250_usd", amount: 250, unit: "USD" }, {
    assertionId: "belief_only_debt",
    scope: "BELIEF",
    contextIds: ["PRIVATE_NEGOTIATION"],
  }));
  const evaluation = evaluateAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  assert.equal(evaluation.status, "BLOCKED");
  assert.ok(evaluation.blockers.some((blocker) => blocker.code === "MISSING_OWES"));
});

test("future facts, inactive contexts, and nonexistent contexts cannot authorize actions", () => {
  const future = createMarcusScenario();
  future.facts.find((entry) => entry.keywordId === "OWES").validFrom = "2026-09-03T00:00:00.000Z";
  assert.equal(evaluateAction(future, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION").status, "BLOCKED");

  const inactive = createMarcusScenario();
  inactive.contexts[0].active = false;
  assert.equal(evaluateAction(inactive, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION").status, "BLOCKED");
  assert.equal(evaluateAction(createMarcusScenario(), "REQUEST_EXTENSION", "player", "marcus_broker_hill", "CONTEXT_DOES_NOT_EXIST").status, "BLOCKED");
});

test("an authored state blocker is mechanically enforced", () => {
  const state = createMarcusScenario();
  state.blockers.push({ id: "red-team-blocker", actor: "player", target: "marcus_broker_hill", contextId: "PRIVATE_NEGOTIATION", status: "ACTIVE" });
  const evaluation = evaluateAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  assert.equal(evaluation.status, "BLOCKED");
  assert.ok(evaluation.blockers.some((blocker) => blocker.code === "STATE_BLOCKER"));
});

test("simultaneous permission and prohibition are contradictory and prohibition wins", () => {
  const state = createAccessScenario();
  state.facts.push(fact("PROHIBITED", { subject: "rowan_warden", object: "player", term: "archive_door" }, {
    assertionId: "red_team_prohibition",
    contextIds: ["ACCESS_REVIEW"],
  }));
  const evaluation = evaluateAction(state, "REQUEST_ACCESS", "player", "rowan_warden", "ACCESS_REVIEW");
  assert.equal(evaluation.status, "BLOCKED");
  assert.ok(evaluation.blockers.some((blocker) => blocker.code === "CONTRADICTORY_AUTHORITY"));
});

test("repeated resolution receives collision-free history identities", () => {
  const state = createMarcusScenario();
  const first = resolveAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  const second = resolveAction(first.stateAfter, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  assert.equal(first.outcome, "PROPOSED");
  assert.equal(second.outcome, "PROPOSED");
  assert.notEqual(first.emittedHistory[0].historyId, second.emittedHistory[0].historyId);
  assert.equal(second.stateAfter.history.length, 2);
  assert.equal(state.history.length, 0, "resolution mutated the input state");
});

test("blocked actions are quarantined before the TPL boundary", (t) => {
  if (!adapterLoad.module) {
    t.skip(`${syntaxBlocker ?? `TPL adapter import blocker: ${adapterLoad.error?.message}`}; blocked-action boundary deferred until TPL loads.`);
    return;
  }
  const blocked = resolveAction(createMarcusScenario(), "REQUEST_EXTENSION", "player", "apartment_305_entry", "PRIVATE_NEGOTIATION");
  assert.equal(blocked.outcome, "BLOCKED");
  assert.equal(blocked.payload, null);
  const adapted = adapterLoad.module.adaptResolvedActionToSemanticRequest(blocked);
  assert.equal(adapted.ok, false);
  assert.equal(adapted.quarantined, true);
  assert.equal(adapted.semanticRequest, null);
  assert.ok(adapted.failures.some((failure) => failure.code === "BLOCKED_ACTION_NOT_RENDERABLE"));
});

test("uppercase and lowercase semantic slots remain invariant", (t) => {
  const tpl = requireTpl(t);
  if (!tpl) return;
  const askBefore = { semanticRequestId: "ask-red-team", speechAct: "ASK", actorId: "player", targetId: "warden", slots: { REQUEST: "review the ledger", request: "review the ledger" } };
  const askChanged = structuredClone(askBefore);
  askChanged.slots.REQUEST = "pay now";
  assert.equal(tpl.validateSemanticInvariance(askBefore, askChanged).passed, false, "uppercase REQUEST mutation was accepted");
  const lowerChanged = structuredClone(askBefore);
  lowerChanged.slots.request = "pay now";
  assert.equal(tpl.validateSemanticInvariance(askBefore, lowerChanged).passed, false, "lowercase request mutation was accepted");
  const actorChanged = structuredClone(askBefore);
  actorChanged.actorId = "other-actor";
  assert.equal(tpl.validateSemanticInvariance(askBefore, actorChanged).passed, false, "actor drift was accepted");

  const dealBefore = { semanticRequestId: "deal-red-team", speechAct: "DEAL", slots: { OFFER: { object: "cash", quantity: 80, unit: "USD" }, RETURN: { object: "extension" } } };
  const offerChanged = structuredClone(dealBefore);
  offerChanged.slots.OFFER.quantity = 800;
  assert.equal(tpl.validateSemanticInvariance(dealBefore, offerChanged).passed, false, "nested OFFER quantity mutation was accepted");
  const returnChanged = structuredClone(dealBefore);
  returnChanged.slots.RETURN = { object: "ownership transfer" };
  assert.equal(tpl.validateSemanticInvariance(dealBefore, returnChanged).passed, false, "RETURN substitution was accepted");

  const pressureBefore = { semanticRequestId: "pressure-red-team", speechAct: "PRESSURE", slots: { DEMAND: "pay today", CONSEQUENCE: "report the debt" } };
  const consequenceChanged = structuredClone(pressureBefore);
  consequenceChanged.slots.CONSEQUENCE = "invented threat";
  assert.equal(tpl.validateSemanticInvariance(pressureBefore, consequenceChanged).passed, false, "CONSEQUENCE substitution was accepted");
});

test("canonical-only TPL boundary rejects legacy payloads and envelope mutations before rendering", (t) => {
  const tpl = requireTpl(t);
  if (!tpl) return;

  const malformedCases = [
    ["missing schemaVersion", (payload) => { delete payload.schemaVersion; }, "REJECT_ENVELOPE_FIELD_MISSING"],
    ["wrong schemaVersion", (payload) => { payload.schemaVersion = "dpa-keyword-foundation@9.9"; }, "REJECT_SCHEMA_VERSION_INVALID"],
    ["false adapterVersion", (payload) => { payload.adapterVersion = "attacker-adapter@9"; }, "REJECT_ADAPTER_VERSION_INVALID"],
    ["missing provenance", (payload) => { delete payload.provenance; }, "REJECT_PROVENANCE_EMPTY"],
    ["extra provenance property", (payload) => { payload.provenance[0].privatePath = "C:\\secret"; }, "REJECT_UNAUTHORIZED_PROVENANCE_FIELD"],
    ["duplicate mandatory policy", (payload) => { payload.mandatorySemanticFacts.push("authored_fact"); }, "REJECT_POLICY_ARRAY_DUPLICATE"],
    ["duplicate forbidden policy", (payload) => { payload.forbiddenSemanticAdditions.push("unauthored_threat"); }, "REJECT_POLICY_ARRAY_DUPLICATE"],
  ];

  for (const [label, mutate, expectedCode] of malformedCases) {
    const payload = canonicalSemanticRequest("ASK", { REQUEST: "review the ledger", request: "review the ledger" });
    mutate(payload);
    const validation = tpl.validateSemanticPayload(payload);
    assert.equal(validation.passed, false, `${label} crossed validateSemanticPayload`);
    assert.ok(validation.reasons.some((reason) => reason.code === expectedCode), `${label} did not report ${expectedCode}`);
    assert.throws(() => tpl.renderSafeFallback(payload, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/, `${label} reached rendering`);
  }

  const legacyPayloads = [
    ["ASK", { REQUEST: "review the ledger", request: "review the ledger" }],
    ["DEAL", { OFFER: { object: "cash", quantity: 80 }, RETURN: { object: "extension" } }],
    ["PRESSURE", { DEMAND: "pay today", CONSEQUENCE: "report the debt" }],
  ];
  for (const [speechAct, slots] of legacyPayloads) {
    const payload = { semanticRequestId: `legacy:${speechAct}`, speechAct, slots };
    assert.equal(tpl.validateSemanticPayload(payload).passed, false, `${speechAct} legacy payload crossed validation`);
    assert.throws(() => tpl.renderSafeFallback(payload, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/, `${speechAct} legacy payload reached rendering`);
    assert.throws(() => tpl.resolveMatrixCell(generateMatrix(), payload, "AS", "BALANCED"), /SEMANTIC_PAYLOAD_INVALID/, `${speechAct} legacy payload reached matrix resolution`);
  }
});

test("blocked actions remain quarantined even when a proposed resolution is forged", (t) => {
  const adapter = adapterLoad.module;
  const tpl = requireTpl(t);
  if (!adapter || !tpl) {
    t.skip(`${syntaxBlocker ?? "TPL adapter unavailable"}; blocked-action attack deferred until TPL loads.`);
    return;
  }

  const blocked = resolveAction(createMarcusScenario(), "REQUEST_EXTENSION", "player", "apartment_305_entry", "PRIVATE_NEGOTIATION");
  assert.equal(blocked.outcome, "BLOCKED");
  assert.equal(blocked.payload, null);
  assert.throws(() => tpl.renderSafeFallback(blocked.payload, "AS", "OVERT"), /SEMANTIC_PAYLOAD_INVALID/);

  const forged = structuredClone(blocked);
  const forgedEvent = {
    historyId: "forged:blocked-request:1",
    eventType: "EXTENSION_REQUESTED",
    actorId: forged.actorId,
    targetId: forged.targetId,
    actionId: forged.actionId,
    contextId: "PRIVATE_NEGOTIATION",
    createdAt: forged.stateBefore.now,
    provenance: {
      sourceId: "project-authored",
      sourceVersion: "1",
      sourceRecordId: "forged",
      transformVersion: "red-team@1",
      licenseId: "PROJECT_AUTHORED",
    },
  };
  forged.outcome = "PROPOSED";
  forged.payload = { actor: forged.actorId, target: forged.targetId, action: forged.actionId, request: "review the ledger" };
  forged.mandatorySemanticFacts = ["forged_fact"];
  forged.emittedHistory = [forgedEvent];
  forged.deterministicEffects = [{ kind: "EMIT_HISTORY", historyId: forgedEvent.historyId }];
  forged.stateAfter.history.push(forgedEvent);

  const adapted = adapter.adaptResolvedActionToSemanticRequest(forged);
  assert.equal(adapted.ok, false, "a forged blocked resolution crossed the adapter boundary");
  assert.equal(adapted.quarantined, true);
  assert.equal(adapted.semanticRequest, null);
});

test("TRADE_INFORMATION requires an authored OFFER and rejects uppercase/lowercase disagreement", (t) => {
  const adapter = adapterLoad.module;
  if (!adapter) {
    t.skip(`${syntaxBlocker ?? "TPL adapter unavailable"}; DEAL adapter attack deferred until TPL loads.`);
    return;
  }
  const trade = resolveAction(createSecretScenario(), "TRADE_INFORMATION", "imani_intermediary", "player", "PRIVATE_DISCLOSURE");
  assert.equal(trade.outcome, "PROPOSED");
  assert.deepEqual(trade.payload.offer, { information: "scoped_secret" });
  assert.deepEqual(trade.payload.return, { object: "confidentiality_or_action" });

  const missingOffer = structuredClone(trade);
  delete missingOffer.payload.offer;
  const missingOfferResult = adapter.adaptResolvedActionToSemanticRequest(missingOffer);
  assert.equal(missingOfferResult.ok, false, "TRADE_INFORMATION adapted without an OFFER");
  assert.ok(missingOfferResult.failures.some((failure) => failure.code === "MISSING_DEAL_SEMANTIC_CONTENT"));

  for (const [label, mutate] of [
    ["OFFER", (payload) => { payload.OFFER = { information: "different_secret" }; }],
    ["RETURN", (payload) => { payload.RETURN = { object: "ownership_transfer" }; }],
  ]) {
    const mismatched = structuredClone(trade);
    mutate(mismatched.payload);
    const result = adapter.adaptResolvedActionToSemanticRequest(mismatched);
    assert.equal(result.ok, false, `${label}/lowercase disagreement crossed the adapter`);
    assert.ok(result.failures.some((failure) => failure.code === "RESOLUTION_UPPERCASE_LOWERCASE_MISMATCH"), `${label} mismatch was not explicit`);
  }
});

test("separate occurrences cannot reuse a semantic identity and immutable replay remains idempotent", (t) => {
  const adapter = adapterLoad.module;
  if (!adapter) {
    t.skip(`${syntaxBlocker ?? "TPL adapter unavailable"}; identity attack deferred until TPL loads.`);
    return;
  }
  const args = ["REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION"];
  const first = resolveAction(createMarcusScenario(), ...args);
  const second = resolveAction(first.stateAfter, ...args);
  const firstAdapted = adapter.adaptResolvedActionToSemanticRequest(first);
  const secondAdapted = adapter.adaptResolvedActionToSemanticRequest(second);
  const replayed = adapter.adaptResolvedActionToSemanticRequest(structuredClone(first));

  assert.equal(firstAdapted.ok, true);
  assert.equal(secondAdapted.ok, true);
  assert.notEqual(first.emittedHistory[0].historyId, second.emittedHistory[0].historyId);
  assert.notEqual(firstAdapted.semanticRequest.semanticRequestId, secondAdapted.semanticRequest.semanticRequestId);
  assert.equal(replayed.semanticRequest.semanticRequestId, firstAdapted.semanticRequest.semanticRequestId);

  const reused = structuredClone(second);
  reused.emittedHistory[0].historyId = first.emittedHistory[0].historyId;
  reused.stateAfter.history[reused.stateAfter.history.length - 1].historyId = first.emittedHistory[0].historyId;
  reused.deterministicEffects[0].historyId = first.emittedHistory[0].historyId;
  const reusedResult = adapter.adaptResolvedActionToSemanticRequest(reused);
  assert.equal(reusedResult.ok, false, "a second occurrence reused the first history identity");
  assert.ok(reusedResult.failures.some((failure) => ["RESOLUTION_HISTORY_ALREADY_PRESENT", "RESOLUTION_HISTORY_ID_NOT_UNIQUE"].includes(failure.code)));
});

test("legacy fallbacks stay safe while mapped preview uses reviewed protocols", (t) => {
  const tpl = requireTpl(t);
  if (!tpl) return;
  const payloads = {
    ASK: canonicalSemanticRequest("ASK", { REQUEST: "review the ledger", request: "review the ledger" }),
    DEAL: canonicalSemanticRequest("DEAL", {
      OFFER: { object: "cash", quantity: 80 },
      offer: { object: "cash", quantity: 80 },
      RETURN: { object: "extension" },
      return: { object: "extension" },
    }),
    PRESSURE: canonicalSemanticRequest("PRESSURE", {
      DEMAND: "pay today",
      demand: "pay today",
      CONSEQUENCE: "report the debt",
      consequence: "report the debt",
    }),
  };

  assert.equal(tpl.TPL_PROTOCOLS.filter((protocol) => protocol.reviewStatus === "APPROVED").length, 0);
  assert.equal(generateMatrix().filter((cell) => cell.reviewStatus === "APPROVED").length, 0);
  const completePressure = canonicalSemanticRequest("PRESSURE", {
    actor: "marcus_broker_hill",
    target: "player",
    leverage: { actor: "marcus_broker_hill", target: "player", basis: "debt_250_usd", sourceAssertionId: "marcus_leverage_debt", scope: "ACTUAL", contextId: "PRIVATE_NEGOTIATION", validFrom: "2026-01-01T00:00:00.000Z", pressureContractId: "pressure_debt_exposure" },
    DEMAND: { kind: "FULFILL_OBLIGATION", demandId: "OWES:player_owes_marcus_250", subject: "player", object: "marcus_broker_hill", term: "debt_250_usd", amount: 250, unit: "USD", due: "2026-09-03T09:00:00.000Z", sourceAssertionId: "player_owes_marcus_250", scope: "ACTUAL", contextId: "PRIVATE_NEGOTIATION", validFrom: "2026-01-01T00:00:00.000Z", pressureContractId: "pressure_debt_exposure", authoredDemand: "pay debt_250_usd" },
    demand: { kind: "FULFILL_OBLIGATION", demandId: "OWES:player_owes_marcus_250", subject: "player", object: "marcus_broker_hill", term: "debt_250_usd", amount: 250, unit: "USD", due: "2026-09-03T09:00:00.000Z", sourceAssertionId: "player_owes_marcus_250", scope: "ACTUAL", contextId: "PRIVATE_NEGOTIATION", validFrom: "2026-01-01T00:00:00.000Z", pressureContractId: "pressure_debt_exposure", authoredDemand: "pay debt_250_usd" },
    CONSEQUENCE: { consequenceId: "public_debt_exposure", text: "Marcus reports the active debt to the building owner.", fearedBy: "player", fearedConsequenceSourceAssertionId: "player_fears_exposure", leverageBasis: "debt_250_usd", demandId: "OWES:player_owes_marcus_250", scope: "ACTUAL", contextId: "PRIVATE_NEGOTIATION", validFrom: "2026-01-01T00:00:00.000Z", validity: { scope: "ACTUAL", contextId: "PRIVATE_NEGOTIATION", validFrom: "2026-01-01T00:00:00.000Z", validUntilIsUnbounded: true }, pressureContractId: "pressure_debt_exposure" },
    consequence: { consequenceId: "public_debt_exposure", text: "Marcus reports the active debt to the building owner.", fearedBy: "player", fearedConsequenceSourceAssertionId: "player_fears_exposure", leverageBasis: "debt_250_usd", demandId: "OWES:player_owes_marcus_250", scope: "ACTUAL", contextId: "PRIVATE_NEGOTIATION", validFrom: "2026-01-01T00:00:00.000Z", validity: { scope: "ACTUAL", contextId: "PRIVATE_NEGOTIATION", validFrom: "2026-01-01T00:00:00.000Z", validUntilIsUnbounded: true }, pressureContractId: "pressure_debt_exposure" },
  }, { actorId: "marcus_broker_hill", targetId: "player", actor: "marcus_broker_hill", target: "player" });
  for (const [speechAct, payload] of Object.entries(payloads)) {
    const fallback = tpl.renderSafeFallback(payload, "AS", "BALANCED");
    const construction = tpl.TPL_CONSTRUCTIONS.find((entry) => entry.constructionId === fallback.constructionId);
    assert.ok(construction, `${speechAct} fallback references a dangling construction`);
    assert.ok(construction.speechActs.includes(speechAct), `${speechAct} fallback references the wrong construction act`);
    assert.equal(fallback.tplProtocolId, null, `${speechAct} legacy fallback claims a protocol was approved`);

    const matrixResult = tpl.resolveMatrixCell(generateMatrix(), speechAct === "PRESSURE" ? completePressure : payload, "AS", "BALANCED");
    assert.equal(matrixResult.constructionId, fallback.constructionId);
    assert.equal(matrixResult.matrixReviewStatus, "REVIEWED");
    assert.equal(matrixResult.fallbackUsed, false);
    assert.equal(matrixResult.productionEligible, false);
  }
});

test("slot removal, renaming, propositions, knowledge, and author-only reveals are rejected", (t) => {
  const tpl = requireTpl(t);
  if (!tpl) return;
  const before = { semanticRequestId: "strict-red-team", speechAct: "ASK", slots: { REQUEST: "review the ledger" } };
  const removed = structuredClone(before);
  delete removed.slots.REQUEST;
  assert.equal(tpl.validateSemanticInvariance(before, removed).passed, false);
  const renamed = { ...before, slots: { ASK: "review the ledger" } };
  assert.equal(tpl.validateSemanticInvariance(before, renamed).passed, false);
  const added = { ...before, slots: { ...before.slots, INVENTED_THREAT: "pay or else" } };
  assert.equal(tpl.validateSemanticInvariance(before, added).passed, false);
  assert.equal(tpl.validateSemanticInvariance(before, before, { speakerKnowledgeClaims: [{ claim: "unseen ledger", available: false }] }).passed, false);
  assert.equal(tpl.validateSemanticInvariance(before, before, { authorOnlyReveals: ["sealed fact"] }).passed, false);
});

test("clean-clone npm test is portable and real-corpus verification is explicit", () => {
  const packageJson = JSON.parse(readFileSync(`${root}/package.json`, "utf8"));
  assert.ok(packageJson.scripts["test:real"], "missing explicit test:real command");
  assert.doesNotMatch(packageJson.scripts.test, /(^|\s)node\s+--test(?:\s|$)/, "npm test runs Node's implicit all-tests discovery and will include cache-dependent real-acquisition tests");
  assert.doesNotMatch(packageJson.scripts.test, /real-acquisition\.test\.mjs/);
});

test("acquisition and processing use one canonical external-data cache", () => {
  const acquirer = readFileSync(`${root}/scripts/acquire.mjs`, "utf8");
  const processor = readFileSync(`${root}/scripts/process-real-datasets.mjs`, "utf8");
  assert.match(acquirer, /EXTERNAL_DATA_CACHE_ROOT|\.cache[\\/]external-data/);
  assert.match(processor, /EXTERNAL_DATA_CACHE_ROOT|\.cache[\\/]external-data/);
  assert.doesNotMatch(acquirer, /\.cache[\\/]emp-lore-packs/);
  assert.doesNotMatch(processor, /\.cache[\\/]emp-lore-packs/);
});

test("checksum mismatch is checked before archive extraction", () => {
  const processor = readFileSync(`${root}/scripts/process-real-datasets.mjs`, "utf8");
  const validationCalls = [...processor.matchAll(/validateArtifactDigest\s*\(/g)].map((match) => match.index);
  const extractionCall = processor.indexOf("extractZipFile(artifactPath");
  assert.ok(validationCalls.some((position) => position < extractionCall), "no checksum validation call precedes extraction");
  const source = SOURCE_BY_ID.get("atomic-2020");
  assert.throws(() => validateArtifactDigest(source, { byteSize: source.byteSize + 1, sha256: "0".repeat(64) }), /SOURCE_BYTE_SIZE_MISMATCH/);
});

test("Social Chemistry preserves repeated rot-id annotations and is input-order independent", () => {
  const headers = ["rot-id", "rot", "situation", "split", "rot-bad", "rot-agree", "rot-categorization", "rot-moral-foundations", "action-legal", "action-pressure", "rot-worker-id", "breakdown-worker-id", "action"];
  const rows = [
    ["rot-1", "Offer thanks", "A neighbor helped", "train", "0", "0.8", "politeness", "care", "legal", "0.1", "worker-a", "breakdown-a", "say thanks"],
    ["rot-1", "Offer thanks", "A neighbor helped", "train", "0", "0.2", "reciprocity", "fairness", "unclear", "0.9", "worker-b", "breakdown-b", "say thanks"],
  ];
  const text = [headers, ...rows].map((row) => row.join("\t")).join("\n");
  const reversed = [headers, ...rows.toReversed()].map((row) => row.join("\t")).join("\n");
  const first = normalizeSocialChemistryTsv(text);
  const second = normalizeSocialChemistryTsv(reversed);
  assert.deepEqual(second, first, "reordering annotations changed normalized output");
  assert.ok(first.records.length === 1 || first.records.length === 2, "normalization discarded or duplicated the canonical RoT unexpectedly");
  const serialized = JSON.stringify(first.records);
  for (const marker of ["worker-a", "worker-b", "breakdown-a", "breakdown-b", "0.8", "0.2", "legal", "unclear", "0.1", "0.9", "politeness", "reciprocity", "care", "fairness"]) {
    assert.match(serialized, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `annotation evidence ${marker} was discarded`);
  }
});

test("ATOMIC retains self/other relation distinctions and original predicates", () => {
  const result = normalizeAtomicRows([
    { id: "self-effect", head: "person opens door", relation: "xEffect", tail: "person enters" },
    { id: "other-effect", head: "person opens door", relation: "oEffect", tail: "someone enters" },
    { id: "self-react", head: "person opens door", relation: "xReact", tail: "person feels relief" },
    { id: "other-react", head: "person opens door", relation: "oReact", tail: "someone feels relief" },
  ]);
  assert.equal(result.records.length, 4);
  for (const relation of ["xEffect", "oEffect", "xReact", "oReact"]) assert.ok(result.records.some((record) => record.relation === relation));
  const selfEffect = result.records.find((record) => record.relation === "xEffect");
  const otherEffect = result.records.find((record) => record.relation === "oEffect");
  const selfReact = result.records.find((record) => record.relation === "xReact");
  const otherReact = result.records.find((record) => record.relation === "oReact");
  assert.notEqual(selfEffect.priorKind, otherEffect.priorKind, "xEffect and oEffect collapsed into one prior kind");
  assert.notEqual(selfReact.priorKind, otherReact.priorKind, "xReact and oReact collapsed into one prior kind");
  assert.match(selfEffect.priorKind, /SELF|ACTOR|X/i);
  assert.match(otherEffect.priorKind, /OTHER|TARGET|O/i);
});

test("malformed foundation payloads fail executable JSON Schema validation", async () => {
  let AjvConstructor;
  try {
    AjvConstructor = (await import("ajv/dist/2020.js")).default;
  } catch {
    try { AjvConstructor = (await import("ajv")).default; } catch { AjvConstructor = null; }
  }
  assert.ok(AjvConstructor, "no executable JSON Schema validator is installed");
  const schema = JSON.parse(readFileSync(`${root}/schemas/mechanics.schema.json`, "utf8"));
  const ajv = new AjvConstructor({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate({}), false, "an empty mechanics object passed schema validation");
});

test("generated report agrees with executable capacity and documents the Vibe wording boundary", async (t) => {
  const tpl = requireTpl(t);
  if (!tpl || inspectionLoad.error) {
    if (inspectionLoad.error && !tplLoad.error) t.skip(`inspection import blocker: ${inspectionLoad.error.message}`);
    return;
  }
  const inspection = inspectionLoad.module;
  const report = inspection.buildInspectionReport();
  const derived = enumerateSemanticConfigurations(DEMO_SCENARIOS, generateMatrix());
  for (const key of ["theoretical", "actIncompatible", "blockedCandidates", "duplicateCandidates", "validUniqueSemanticConfigurations"]) {
    assert.equal(report.mechanics.capacity[key], derived[key], `report/code contradiction for capacity.${key}`);
  }
  assert.match(inspection.formatInspectionReport(report), new RegExp(`Semantic capacity: ${derived.validUniqueSemanticConfigurations} valid unique configurations`));
  assert.equal(tpl.TPL_FALLBACK_POLICY.vibeAffectsWording, true);
  const payload = {
    schemaVersion: "dpa-keyword-foundation@0.1",
    adapterVersion: "action-tpl-adapter@0.1",
    semanticRequestId: "vibe-red-team",
    actionId: "REQUEST_EXTENSION",
    actorId: "player",
    targetId: "marcus_broker_hill",
    contextId: "PRIVATE_NEGOTIATION",
    actor: "player",
    target: "marcus_broker_hill",
    action: "REQUEST_EXTENSION",
    speechAct: "ASK",
    outcome: "PROPOSED",
    slots: { actor: "player", target: "marcus_broker_hill", action: "REQUEST_EXTENSION", contextId: "PRIVATE_NEGOTIATION", REQUEST: "review the ledger", request: "review the ledger" },
    mandatorySemanticFacts: ["player_owes_marcus_250"],
    forbiddenSemanticAdditions: ["unauthored_threat"],
    provenance: [{ sourceId: "project-authored-test", sourceRecordId: "history:vibe-red-team", transformVersion: "adversarial-test@1", licenseId: "PROJECT_AUTHORED" }],
  };
  const subtleA = tpl.renderSafeFallback(payload, "BA", "BALANCED");
  const subtleD = tpl.renderSafeFallback(payload, "DA", "BALANCED");
  assert.equal(subtleA.renderedText, subtleD.renderedText, "Vibe selection changed fallback wording despite the foundation policy");
  assert.notEqual(subtleA.vibeId, subtleD.vibeId);
  const readme = readFileSync(`${root}/README.md`, "utf8");
  assert.doesNotMatch(readme, /Vibe[^\n]*(?:changes|affects)\s+wording/i, "README makes a false Vibe-wording claim");
});

test("raw corpus bytes are not tracked and candidate text contains no secrets or private paths", () => {
  const rawTracked = runGit(["ls-files", "--", ".cache", "data/raw", "data/downloads", "data/extracted", "data/indexes"]);
  assert.equal(rawTracked, "", `tracked raw/cache paths found:\n${rawTracked}`);
  const candidateFiles = new Set([
    ...runGit(["diff", "--name-only"]).split(/\r?\n/).filter(Boolean),
    ...runGit(["ls-files", "--others", "--exclude-standard"]).split(/\r?\n/).filter(Boolean),
  ]);
  const sensitive = [];
  const secretPattern = /(C:[\\/]+Users[\\/]+|gho_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|BEGIN (?:RSA|OPENSSH|EC|DSA) PRIVATE KEY|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]+)/i;
  for (const relativePath of candidateFiles) {
    if (!relativePath || /^(?:\.cache|data\/(?:raw|downloads|extracted|indexes))\//.test(relativePath)) continue;
    let content;
    try { content = readFileSync(`${root}/${relativePath}`, "utf8"); } catch { continue; }
    if (secretPattern.test(content)) sensitive.push(relativePath);
  }
  assert.deepEqual(sensitive, [], `secrets or private machine paths found in candidate files: ${sensitive.join(", ")}`);
});

test("INVOKE_CONSEQUENCE requires linked authored pressure evidence", () => {
  const unrelatedFear = createMarcusScenario();
  unrelatedFear.facts = unrelatedFear.facts.filter((entry) => entry.keywordId !== "FEARS");
  unrelatedFear.facts.push(fact("FEARS", { subject: "player", object: "unrelated_social_embarrassment" }, {
    assertionId: "player_fears_unrelated_embarrassment",
    contextIds: ["PRIVATE_NEGOTIATION"],
  }));
  assert.equal(
    evaluateAction(unrelatedFear, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION").status,
    "BLOCKED",
    "an unrelated target fear authorized pressure",
  );

  const noObligation = createMarcusScenario();
  noObligation.facts = noObligation.facts.filter((entry) => !["OWES", "PROMISED_TO"].includes(entry.keywordId));
  assert.equal(
    evaluateAction(noObligation, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION").status,
    "BLOCKED",
    "generic pressure remained available without an active authored demand or obligation",
  );

  const mismatchedSecret = createSecretScenario();
  const secretPressure = resolveAction(mismatchedSecret, "INVOKE_CONSEQUENCE", "imani_intermediary", "player", "PRIVATE_DISCLOSURE");
  assert.equal(secretPressure.outcome, "BLOCKED", "secret leverage silently became an obligation pressure");

  const linked = resolveAction(createMarcusScenario(), "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.equal(linked.outcome, "PROPOSED", "the fully linked authored pressure chain was rejected");
  assert.equal(linked.payload.leverage.sourceAssertionId, "marcus_leverage_debt");
  assert.equal(linked.payload.leverage.basis, "debt_250_usd");
  assert.equal(linked.payload.demand.sourceAssertionId, "player_owes_marcus_250");
  assert.equal(linked.payload.demand.term, "debt_250_usd");
  assert.equal(linked.payload.consequence.consequenceId, "public_debt_exposure");
  assert.equal(linked.payload.consequence.fearedConsequenceSourceAssertionId, "player_fears_exposure");
  assert.equal(linked.payload.consequence.leverageBasis, linked.payload.leverage.basis);
  assert.equal(linked.payload.consequence.demandId, linked.payload.demand.demandId);
});

test("pressure evidence obeys scope, time, context, dispute, and prohibition boundaries", () => {
  const mutations = [
    ["belief-only leverage", (state) => state.facts.filter((entry) => entry.keywordId === "HAS_LEVERAGE_OVER").forEach((entry) => { entry.scope = "BELIEF"; })],
    ["expired leverage", (state) => state.facts.filter((entry) => entry.keywordId === "HAS_LEVERAGE_OVER").forEach((entry) => { entry.validUntil = state.now; })],
    ["disputed leverage", (state) => state.facts.filter((entry) => entry.keywordId === "HAS_LEVERAGE_OVER").forEach((entry) => { entry.polarity = "DISPUTED"; })],
    ["inactive context", (state) => { state.contexts[0].active = false; }],
    ["prohibited pressure", (state) => state.facts.push(fact("PROHIBITED", { subject: "player", object: "marcus_broker_hill", term: "INVOKE_CONSEQUENCE" }, { assertionId: "prohibit_pressure", contextIds: ["PRIVATE_NEGOTIATION"] }))],
  ];
  for (const [label, mutate] of mutations) {
    const state = createMarcusScenario();
    mutate(state);
    const evaluation = evaluateAction(state, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
    assert.equal(evaluation.status, "BLOCKED", `${label} evidence authorized pressure`);
  }
});

test("adapter derives occurrence-specific identities and authenticates event provenance", () => {
  const adapter = adapterLoad.module;
  assert.ok(adapter, "action adapter did not load");
  const state = createMarcusScenario();
  const firstResolution = resolveAction(state, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  const first = adapter.adaptResolvedActionToSemanticRequest(firstResolution);
  const replay = adapter.adaptResolvedActionToSemanticRequest(firstResolution);
  const secondResolution = resolveAction(firstResolution.stateAfter, "REQUEST_EXTENSION", "player", "marcus_broker_hill", "PRIVATE_NEGOTIATION");
  const second = adapter.adaptResolvedActionToSemanticRequest(secondResolution);

  assert.equal(first.ok, true);
  assert.equal(replay.ok, true);
  assert.equal(second.ok, true);
  assert.equal(replay.semanticRequest.semanticRequestId, first.semanticRequest.semanticRequestId, "replaying one immutable event was not idempotent");
  assert.notEqual(first.semanticRequest.semanticRequestId, second.semanticRequest.semanticRequestId, "separate event occurrences collided");
  assert.equal(first.semanticRequest.provenance[0].sourceRecordId, firstResolution.emittedHistory[0].historyId, "adapter provenance does not identify the emitted event");
  assert.equal(second.semanticRequest.provenance[0].sourceRecordId, secondResolution.emittedHistory[0].historyId);

  const missingHistory = structuredClone(firstResolution);
  delete missingHistory.emittedHistory;
  assert.equal(adapter.adaptResolvedActionToSemanticRequest(missingHistory).ok, false, "resolution without event identity crossed the adapter");
  const driftedHistory = structuredClone(firstResolution);
  driftedHistory.emittedHistory[0].historyId = "unrelated:event:identity";
  assert.equal(adapter.adaptResolvedActionToSemanticRequest(driftedHistory).ok, false, "drifted event identity crossed the adapter");
  const contextDrift = structuredClone(firstResolution);
  contextDrift.contextId = "OTHER_CONTEXT";
  assert.equal(adapter.adaptResolvedActionToSemanticRequest(contextDrift).ok, false, "explicit context drift from event identity crossed the adapter");
  const missingStateSnapshots = structuredClone(firstResolution);
  delete missingStateSnapshots.stateBefore;
  delete missingStateSnapshots.stateAfter;
  assert.equal(adapter.adaptResolvedActionToSemanticRequest(missingStateSnapshots).ok, false, "event identity without state snapshots crossed the adapter");
});

test("semantic invariance covers the complete envelope, contradictory slot pairs, and identity consistency", (t) => {
  const tpl = requireTpl(t);
  if (!tpl) return;
  const before = {
    schemaVersion: "dpa-keyword-foundation@0.1",
    adapterVersion: "action-tpl-adapter@0.1",
    semanticRequestId: "envelope-red-team",
    actionId: "REQUEST_EXTENSION",
    actorId: "player",
    targetId: "marcus_broker_hill",
    contextId: "PRIVATE_NEGOTIATION",
    actor: "player",
    target: "marcus_broker_hill",
    action: "REQUEST_EXTENSION",
    speechAct: "ASK",
    outcome: "PROPOSED",
    slots: { REQUEST: "review the ledger", request: "review the ledger", actor: "player", target: "marcus_broker_hill", action: "REQUEST_EXTENSION", contextId: "PRIVATE_NEGOTIATION" },
    mandatorySemanticFacts: ["player_owes_marcus_250"],
    forbiddenSemanticAdditions: ["unauthored_threat"],
    provenance: [{ sourceId: "mechanics-action-resolution", sourceRecordId: "event-1", transformVersion: "action-tpl-adapter@0.1", licenseId: "PROJECT_AUTHORED" }],
  };
  const scalarMutations = {
    schemaVersion: "other-schema@9",
    adapterVersion: "other-adapter@9",
    semanticRequestId: "other-request",
    actionId: "OTHER_ACTION",
    actorId: "other-actor",
    targetId: "other-target",
    contextId: "OTHER_CONTEXT",
    actor: "other-actor",
    target: "other-target",
    action: "OTHER_ACTION",
    speechAct: "DEAL",
    outcome: "BLOCKED",
  };
  for (const [field, value] of Object.entries(scalarMutations)) {
    const changed = structuredClone(before);
    changed[field] = value;
    assert.equal(tpl.validateSemanticInvariance(before, changed).passed, false, `${field} mutation was accepted`);
    const removed = structuredClone(before);
    delete removed[field];
    assert.equal(tpl.validateSemanticInvariance(before, removed).passed, false, `${field} removal was accepted`);
    const added = structuredClone(before);
    delete added[field];
    assert.equal(tpl.validateSemanticInvariance(added, before).passed, false, `${field} addition was accepted`);
  }
  for (const field of ["slots", "mandatorySemanticFacts", "forbiddenSemanticAdditions", "provenance"]) {
    const changed = structuredClone(before);
    if (field === "slots") changed.slots.REQUEST = "pay now";
    else if (field === "provenance") changed.provenance[0].sourceRecordId = "event-2";
    else changed[field].push("unauthorized-mutation");
    assert.equal(tpl.validateSemanticInvariance(before, changed).passed, false, `${field} mutation was accepted`);
    const removed = structuredClone(before);
    delete removed[field];
    assert.equal(tpl.validateSemanticInvariance(before, removed).passed, false, `${field} removal was accepted`);
  }

  const contradictoryCase = structuredClone(before);
  contradictoryCase.slots.request = "pay now";
  assert.equal(tpl.validateSemanticPayload(contradictoryCase).passed, false, "contradictory REQUEST/request slots were accepted");
  const slotIdentityDrift = structuredClone(before);
  slotIdentityDrift.slots.actor = "other-actor";
  assert.equal(tpl.validateSemanticPayload(slotIdentityDrift).passed, false, "slot actor drift from top-level actor was accepted");
});

test("malformed required semantic slots fail closed", (t) => {
  const tpl = requireTpl(t);
  if (!tpl) return;
  const cases = [
    ["ASK", { REQUEST: {} }],
    ["ASK", { REQUEST: [] }],
    ["DEAL", { OFFER: {}, RETURN: { object: "extension" } }],
    ["DEAL", { OFFER: { object: "cash", quantity: "eighty", unit: "USD" }, RETURN: { object: "extension" } }],
    ["DEAL", { OFFER: { object: "cash", quantity: 80, unit: "USD" }, RETURN: [] }],
    ["PRESSURE", { DEMAND: {}, CONSEQUENCE: "report the debt" }],
    ["PRESSURE", { DEMAND: "pay today", CONSEQUENCE: [] }],
  ];
  for (const [speechAct, slots] of cases) {
    assert.equal(tpl.validateSemanticPayload({ semanticRequestId: `malformed-${speechAct}`, speechAct, slots }).passed, false, `${speechAct} malformed slots were accepted`);
  }
});

test("the executable mechanics schema accepts the actual repaired state and pressure resolution", () => {
  const schema = JSON.parse(readFileSync(`${root}/schemas/mechanics.schema.json`, "utf8"));
  const state = createMarcusScenario();
  assert.doesNotThrow(() => assertValidDocument(state, schema, "red-team:mechanics-state"), "the mechanics schema rejects the actual state shape");
  const pressure = resolveAction(state, "INVOKE_CONSEQUENCE", "marcus_broker_hill", "player", "PRIVATE_NEGOTIATION");
  assert.doesNotThrow(() => assertValidDocument(pressure, schema, "red-team:pressure-resolution"), "the mechanics schema rejects the actual pressure resolution shape");
});

test("Social Chemistry preserves row-specific action evidence, collisions, duplicates, and order", () => {
  const headers = ["rot-id", "rot", "situation", "split", "rot-bad", "rot-agree", "rot-categorization", "rot-moral-foundations", "action-legal", "action-pressure", "rot-worker-id", "breakdown-worker-id", "action", "area"];
  const row = (action, legal, pressure, rotWorker, breakdownWorker) => ["rot-collision", "Honor the agreement", "A deal is pending", "train", "0", "3", "fairness", "fairness", legal, String(pressure), rotWorker, breakdownWorker, action, "negotiation"];
  const rows = [
    row("ask for a fair extension", "legal", 0.1, "worker-a", "breakdown-a"),
    row("demand immediate payment", "illegal", 0.9, "worker-a", "breakdown-a"),
    row("demand immediate payment", "illegal", 0.9, "worker-a", "breakdown-a"),
    row("suggest mediation", "unclear", 0.5, "worker-b", "breakdown-b"),
  ];
  const text = [headers, ...rows].map((entry) => entry.join("\t")).join("\n");
  const reversed = [headers, ...rows.toReversed()].map((entry) => entry.join("\t")).join("\n");
  const first = normalizeSocialChemistryTsv(text);
  const second = normalizeSocialChemistryTsv(reversed);
  assert.deepEqual(second, first, "reordering rows changed normalized Social Chemistry evidence");
  assert.equal(first.records.length, 1);
  assert.equal(first.records[0].annotations.length, 3, "distinct annotation collision was discarded");
  assert.equal(first.duplicateRecords.length, 1, "exact duplicate was not counted separately");
  assert.equal(first.aggregatedAnnotationRows, 2);
  for (const action of ["ask for a fair extension", "demand immediate payment", "suggest mediation"]) {
    assert.ok(first.records[0].annotations.some((annotation) => annotation.action === action), `row-specific action evidence ${action} was discarded`);
  }
  assert.deepEqual(first.records[0].annotations.map((annotation) => annotation.legalityJudgment), ["illegal", "legal", "unclear"]);
  assert.deepEqual(first.records[0].annotations.map((annotation) => annotation.culturalPressure), [0.9, 0.1, 0.5]);
  assert.equal(first.records[0].aggregatedAnnotationCount, 3);
});

test("FoundationStore rejects non-synthetic bytes that do not match the registered receipt", () => {
  const source = SOURCE_BY_ID.get("atomic-2020");
  const result = new FoundationStore().importSource({
    source,
    records: [],
    bytes: Buffer.from("corrupted artifact bytes"),
    retrievedAt: "2026-09-02T12:00:00.000Z",
    synthetic: false,
  });
  assert.equal(result.status, "BLOCKED", "unregistered bytes were committed as an acquired source");
  assert.ok(result.errors.some((error) => /CHECKSUM|BYTE_SIZE/.test(error)));
});

test("TPL authority and acquisition code fail closed before receipt or extraction", () => {
  const processor = readFileSync(`${root}/scripts/process-real-datasets.mjs`, "utf8").replace(/\r\n/g, "\n");
  const registerStart = processor.indexOf("async function registerTplAuthority");
  const registerEnd = processor.indexOf("\n}\n\nawait mkdir", registerStart);
  assert.ok(registerStart >= 0 && registerEnd > registerStart, "TPL authority registration function was not found");
  const registration = processor.slice(registerStart, registerEnd);
  const validationPosition = registration.indexOf("validateArtifactDigest(source, receipt)");
  const receiptWritePosition = registration.indexOf("writeFile(receiptPath");
  assert.ok(validationPosition >= 0, "TPL authority registration never validates the registered digest");
  assert.ok(validationPosition < receiptWritePosition, "TPL authority receipt is written before digest validation");

  assert.match(processor, /import\s*\{[^}]*EXTERNAL_DATA_CACHE_ROOT[^}]*\}\s*from\s*["']\.\.\/src\/sources\.mjs["']/s, "processor duplicated the cache root instead of importing it");
  assert.match(processor, /function trackedPath\(path\)\s*\{\s*return canonicalPosixPath\(relative\(root, path\)\);\s*\}/, "processor does not canonicalize tracked paths to POSIX separators");
});

test("tracked acquisition paths are canonical POSIX paths", () => {
  const manifest = JSON.parse(readFileSync(`${root}/data/acquisition-manifest.json`, "utf8"));
  const pathValues = [];
  for (const source of manifest.sources) pathValues.push(source.artifactCachePath, source.receiptPath, source.normalizedRecordsPath, source.extraction?.extractedPath, source.indexSnapshot?.persistedPostingsPath);
  assert.ok(pathValues.every((value) => value == null || !String(value).includes("\\")), "tracked manifest contains Windows separators");
});

test("every acquisition source reports the same count fields", () => {
  const manifest = JSON.parse(readFileSync(`${root}/data/acquisition-manifest.json`, "utf8"));
  for (const source of manifest.sources) {
    for (const key of ["raw", "accepted", "rejected", "duplicate", "aggregatedAnnotationRows", "normalized", "indexed"]) assert.ok(Object.hasOwn(source.counts, key), `${source.sourceId} lacks counts.${key}`);
  }
});

test("CI declares minimum read-only permissions", () => {
  const workflow = readFileSync(`${root}/.github/workflows/ci.yml`, "utf8");
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/, "CI workflow does not declare minimum read-only permissions");
});

test("CI enforces generated-artifact freshness", () => {
  const workflow = readFileSync(`${root}/.github/workflows/ci.yml`, "utf8");
  assert.ok(/git\s+diff\s+--exit-code\s+--\s+(?:data\/generated|data\/source-manifest)/.test(workflow) || /node\s+scripts\/check-generated\.mjs/.test(workflow), "CI builds artifacts but never fails on stale tracked generated output");
});

test("generated tracked artifacts exactly match the current executable builders", (t) => {
  if (inspectionLoad.error) {
    t.skip(`inspection import blocker: ${inspectionLoad.error.message}`);
    return;
  }
  const inspection = inspectionLoad.module;
  const report = inspection.buildInspectionReport();
  assert.deepEqual(JSON.parse(readFileSync(`${root}/data/generated/foundation-inspection.json`, "utf8")), JSON.parse(JSON.stringify(report)), "foundation inspection artifact is stale");
  assert.deepEqual(JSON.parse(readFileSync(`${root}/data/source-manifest.json`, "utf8")), JSON.parse(JSON.stringify(report.sources)), "source-manifest artifact is stale");
  if (!tplLoad.module) {
    t.skip(syntaxBlocker ?? "TPL import unavailable");
    return;
  }
  const tpl = tplLoad.module;
  const basedTpl = {
    schemaVersion: report.schemaVersion,
    cues: report.based.cues,
    vibes: report.based.vibes,
    speechActs: report.based.speechActs,
    deliveryIntensities: report.based.deliveryIntensities,
    matrix: tpl.buildTplScaffold().matrix,
    tplFamilies: tpl.TPL_FAMILIES,
    atoms: tpl.TPL_ATOMS,
    constructions: tpl.TPL_CONSTRUCTIONS,
    protocols: tpl.TPL_PROTOCOLS,
    templates: tpl.TPL_TEMPLATES,
    styleProfiles: tpl.TPL_STYLE_PROFILES,
    semanticInvarianceBoundary: tpl.FACE_COMPATIBILITY_BOUNDARY,
    fallbackPolicy: tpl.TPL_FALLBACK_POLICY,
  };
  assert.deepEqual(JSON.parse(readFileSync(`${root}/data/generated/based-tpl-foundation.json`, "utf8")), basedTpl, "BASED/TPL artifact is stale");
});

test("tracked repository surface has no unexpectedly large files and acquisition attribution is complete", () => {
  const tracked = runGit(["ls-files"]).split(/\r?\n/).filter(Boolean);
  const large = tracked.filter((relativePath) => existsSync(`${root}/${relativePath}`) && statSync(`${root}/${relativePath}`).size > 10 * 1024 * 1024);
  assert.deepEqual(large, [], `unexpectedly large tracked files: ${large.join(", ")}`);
  const manifest = JSON.parse(readFileSync(`${root}/data/acquisition-manifest.json`, "utf8"));
  for (const source of manifest.sources) {
    assert.ok(source.sourceVersion, `${source.sourceId} has no source version`);
    assert.ok(source.licenseId, `${source.sourceId} has no license attribution`);
    assert.ok(source.artifactFilename, `${source.sourceId} has no artifact filename`);
    assert.match(source.sha256, /^[a-f0-9]{64}$/, `${source.sourceId} has no SHA-256 receipt`);
    assert.ok(Number.isSafeInteger(source.byteSize) && source.byteSize > 0, `${source.sourceId} has no byte size receipt`);
  }
});
