import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  DEMO_SCENARIOS,
  createAccessScenario,
  createMarcusScenario,
  enumerateSemanticConfigurations,
  evaluateAction,
  fact,
  resolveAction,
} from "../src/mechanics.mjs";
import { generateMatrix } from "../src/based.mjs";
import { normalizeAtomicRows, normalizeSocialChemistryTsv } from "../src/ingestion.mjs";
import { SOURCE_BY_ID, validateArtifactDigest } from "../src/sources.mjs";
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
  assert.equal(metric(capacity, "blocked", "blockedCandidates"), 3660);
  assert.equal(metric(capacity, "duplicate", "duplicateCandidates"), 0);
  assert.equal(metric(capacity, "unreachable", "unreachableCandidates"), 0);
  assert.equal(metric(capacity, "validUnique", "validUniqueSemanticConfigurations"), 660);
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
  assert.equal(tpl.TPL_FALLBACK_POLICY.vibeAffectsWording, false);
  const payload = { semanticRequestId: "vibe-red-team", speechAct: "ASK", slots: { REQUEST: "review the ledger" } };
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
