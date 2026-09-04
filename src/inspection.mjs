import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { KEYWORDS, CROSS_KEYWORD_RULES, validateKeywordSet } from "./keywords.mjs";
import { ACTION_DEFINITIONS, DEMO_SCENARIOS, enumerateSemanticConfigurations, evaluateAvailableActions, resolveAction, scenarioActionSummary } from "./mechanics.mjs";
import { BASED_CUES, BASED_VIBES, DELIVERY_INTENSITIES, SPEECH_ACTS, loadAuthoredAnchors, validateBased } from "./based.mjs";
import { RELATIONSHIP_ROLE_CORE, validateRoleCore } from "./roles.mjs";
import { SOURCE_MANIFESTS, validateAllSourceManifests } from "./sources.mjs";
import { FoundationStore } from "./store.mjs";
import { FACE_COMPATIBILITY_BOUNDARY, TPL_ATOMS, TPL_CONSTRUCTIONS, TPL_FAMILIES, TPL_PROTOCOLS, TPL_STYLE_PROFILES, TPL_TEMPLATES, TPL_STATUSES, buildRuntimeMatrix, resolveMatrixCell, tplStatusSummary } from "./tpl.mjs";
import { adaptResolvedActionToSemanticRequest } from "./action-tpl-adapter.mjs";

const countBy = (items, selector) => Object.fromEntries(TPL_STATUSES.map((status) => [status, items.filter((item) => selector(item) === status).length]));
const acquisitionManifestPath = fileURLToPath(new URL("../data/acquisition-manifest.json", import.meta.url));

function loadAcquisitionManifest() {
  try { return JSON.parse(readFileSync(acquisitionManifestPath, "utf8")); } catch { return { generatedAt: null, sources: [] }; }
}

export function buildAuthoringPipelineTrace({ state = DEMO_SCENARIOS[0], vibeId = "AS", deliveryIntensity = "BALANCED" } = {}) {
  const pair = state.recommendedPairs[0];
  const evaluations = evaluateAvailableActions(state, pair.actorId, pair.targetId, pair.contextId);
  const availableEvaluations = evaluations.filter((entry) => entry.status === "AVAILABLE");
  const attempts = availableEvaluations.map((evaluation) => {
    const resolvedAction = resolveAction(state, evaluation.actionId, pair.actorId, pair.targetId, pair.contextId);
    const adapterInput = Object.prototype.hasOwnProperty.call(resolvedAction, "contextId")
      ? resolvedAction
      : { ...resolvedAction, contextId: pair.contextId };
    return { evaluation, resolvedAction, adapted: adaptResolvedActionToSemanticRequest(adapterInput) };
  });
  const selected = attempts.find((attempt) => attempt.adapted.ok);
  if (!selected) throw new Error("AUTHORING_PIPELINE_NO_RENDERABLE_ACTION");

  const matrix = buildRuntimeMatrix();
  const coordinate = matrix.find((entry) => entry.speechAct === selected.resolvedAction.macroAct && entry.vibeId === vibeId && entry.deliveryIntensity === deliveryIntensity);
  if (!coordinate) throw new Error(`AUTHORING_PIPELINE_COORDINATE_NOT_FOUND:${selected.resolvedAction.macroAct}_${vibeId}_${deliveryIntensity}`);
  const safeRender = resolveMatrixCell(matrix, selected.adapted.semanticRequest, vibeId, deliveryIntensity);

  return {
    authoredFacts: {
      count: state.facts.length,
      activeCount: state.facts.filter((fact) => fact.status === "ACTIVE").length,
      sourceIds: [...new Set(state.facts.map((fact) => fact.provenance?.sourceId).filter(Boolean))],
    },
    pair,
    availableActions: evaluations.filter((entry) => entry.status === "AVAILABLE").map(({ actionId, displayName, macroAct, status }) => ({ actionId, displayName, macroAct, status })),
    blockedActionCount: evaluations.filter((entry) => entry.status === "BLOCKED").length,
    adapterAttempts: attempts.map(({ evaluation, adapted }) => ({
      actionId: evaluation.actionId,
      displayName: evaluation.displayName,
      status: adapted.status,
      failureCodes: (adapted.failures ?? []).map((failure) => failure.code),
    })),
    resolvedAction: {
      actionId: selected.resolvedAction.actionId,
      displayName: selected.evaluation.displayName,
      macroAct: selected.resolvedAction.macroAct,
      outcome: selected.resolvedAction.outcome,
      payload: selected.resolvedAction.payload,
      emittedHistory: selected.resolvedAction.emittedHistory,
      trace: selected.resolvedAction.trace,
    },
    semanticRequest: selected.adapted.semanticRequest,
    based: {
      matrixKey: coordinate.key,
      speechAct: coordinate.speechAct,
      vibeId: coordinate.vibeId,
      vibeName: BASED_VIBES.find((entry) => entry.vibeId === coordinate.vibeId)?.name ?? coordinate.vibeId,
      deliveryIntensity: coordinate.deliveryIntensity,
      reviewStatus: coordinate.reviewStatus,
      candidateAnchorIds: coordinate.candidateAnchorIds,
    },
    safeRender,
    matrixCells: matrix.length,
    anchoredMatrixCells: matrix.filter((entry) => entry.candidateAnchorIds.length > 0).length,
  };
}

function representativeSemanticRequests() {
  const representatives = new Map();
  for (const state of DEMO_SCENARIOS) {
    for (const pair of state.recommendedPairs) {
      for (const evaluation of evaluateAvailableActions(state, pair.actorId, pair.targetId, pair.contextId)) {
        if (evaluation.status !== "AVAILABLE" || representatives.has(evaluation.macroAct)) continue;
        const resolved = resolveAction(state, evaluation.actionId, pair.actorId, pair.targetId, pair.contextId);
        const adapted = adaptResolvedActionToSemanticRequest(resolved);
        if (adapted.ok) representatives.set(evaluation.macroAct, adapted.semanticRequest);
      }
    }
  }
  for (const speechAct of SPEECH_ACTS) if (!representatives.has(speechAct)) throw new Error(`TPL_REPRESENTATIVE_MISSING:${speechAct}`);
  return representatives;
}

export function buildTplCoverage({ matrix = buildRuntimeMatrix(), representatives = representativeSemanticRequests() } = {}) {
  return matrix.map((cell) => {
    const payload = representatives.get(cell.speechAct);
    const rendered = resolveMatrixCell(matrix, payload, cell.vibeId, cell.deliveryIntensity);
    const replay = resolveMatrixCell(matrix, payload, cell.vibeId, cell.deliveryIntensity);
    const vibe = BASED_VIBES.find((entry) => entry.vibeId === cell.vibeId);
    const construction = TPL_CONSTRUCTIONS.find((entry) => entry.constructionId === rendered.constructionId);
    const protocol = TPL_PROTOCOLS.find((entry) => entry.tplProtocolId === rendered.tplProtocolId);
    const styleProfile = TPL_STYLE_PROFILES.find((entry) => entry.profileId === rendered.styleProfileId);
    const semanticEvidenceSummary = {
      method: rendered.semanticEvidence.method,
      passed: rendered.semanticEvidence.passed,
      requiredFragments: rendered.semanticEvidence.requiredFragments.map(({ slot, preserved }) => ({ slot, preserved })),
      unauthorizedFragmentCount: rendered.semanticEvidence.unauthorizedFragments.length,
      presentationOnlyAtomIds: rendered.semanticEvidence.presentationOnlyAtoms.map((atom) => atom.atomId),
    };
    return {
      coordinateKey: cell.key,
      speechAct: cell.speechAct,
      vibeId: cell.vibeId,
      vibeName: vibe?.name ?? cell.vibeId,
      primaryCue: vibe?.primaryCue,
      secondaryCue: vibe?.secondaryCue,
      deliveryIntensity: cell.deliveryIntensity,
      actionInvariant: [...cell.actionInvariant],
      actionInvariantNames: [...cell.actionInvariant],
      matrixReviewStatus: rendered.matrixReviewStatus,
      executionMode: rendered.executionMode,
      templateVariantId: rendered.templateVariantId,
      constructionId: rendered.constructionId,
      constructionName: construction?.constructionId === rendered.constructionId ? construction.constructionId.replace(/^CONSTRUCTION_/, "").toLowerCase().replaceAll("_", " ") : null,
      tplProtocolId: rendered.tplProtocolId,
      protocolName: protocol?.tplProtocolId === rendered.tplProtocolId ? protocol.tplProtocolId.replace(/^PROTOCOL_/, "").toLowerCase().replaceAll("_", " ") : null,
      styleProfileId: rendered.styleProfileId,
      styleProfileName: styleProfile?.name ?? null,
      readiness: structuredClone(rendered.readiness),
      sourceLine: rendered.sourceLine,
      gateDisposition: rendered.gateResult.disposition,
      candidateAnchorIds: [...rendered.candidateAnchorIds],
      requiredContextOrLoreFacts: structuredClone(rendered.requiredContextOrLoreFacts),
      provenance: structuredClone(rendered.provenance),
      gateResult: structuredClone(rendered.gateResult),
      previewEligible: rendered.previewEligible,
      productionEligible: rendered.productionEligible,
      renderedText: rendered.renderedText,
      styleProfileInput: structuredClone(rendered.styleProfileInput),
      semanticInvariancePassed: rendered.semanticInvariancePassed,
      invarianceResult: semanticEvidenceSummary,
      leakDiagnostics: rendered.rejectionReasons.filter((reason) => reason.code.includes("LEAK")),
      deterministic: JSON.stringify(rendered) === JSON.stringify(replay),
    };
  });
}

function tplCoverageSummary(coverage) {
  return {
    rowCount: coverage.length,
    coordinateCountByAct: Object.fromEntries(SPEECH_ACTS.map((speechAct) => [speechAct, coverage.filter((row) => row.speechAct === speechAct).length])),
    uniqueRenderedCountByAct: Object.fromEntries(SPEECH_ACTS.map((speechAct) => [speechAct, new Set(coverage.filter((row) => row.speechAct === speechAct).map((row) => row.renderedText)).size])),
    previewEligibleCount: coverage.filter((row) => row.previewEligible).length,
    productionEligibleCount: coverage.filter((row) => row.productionEligible).length,
    invariancePassCount: coverage.filter((row) => row.semanticInvariancePassed).length,
    deterministicCount: coverage.filter((row) => row.deterministic).length,
  };
}

export function buildInspectionReport({ includeCoverage = true } = {}) {
  const matrix = buildRuntimeMatrix();
  const anchors = loadAuthoredAnchors();
  const keywordConnections = Object.fromEntries(KEYWORDS.map((entry) => [entry.keywordId, CROSS_KEYWORD_RULES.filter((rule) => rule.keywords.includes(entry.keywordId)).length]));
  const capacity = enumerateSemanticConfigurations(DEMO_SCENARIOS, matrix);
  const sourceStatuses = Object.fromEntries([...new Set(SOURCE_MANIFESTS.map((entry) => entry.acquisitionStatus))].sort().map((status) => [status, SOURCE_MANIFESTS.filter((entry) => entry.acquisitionStatus === status).length]));
  const acquisitionManifest = loadAcquisitionManifest();
  const actualAcquisitionStatuses = Object.fromEntries([...new Set(acquisitionManifest.sources.map((entry) => entry.status))].sort().map((status) => [status, acquisitionManifest.sources.filter((entry) => entry.status === status).length]));
  const foundationStoreStatus = new FoundationStore().statusSummary();
  const tplCoverage = buildTplCoverage({ matrix });
  return {
    schemaVersion: "dpa-keyword-foundation@0.1",
    generatedAt: "2026-09-02T12:00:00.000Z",
    validation: {
      keywordErrors: validateKeywordSet(),
      basedErrors: validateBased(),
      roleErrors: validateRoleCore(),
      sourceManifestErrors: validateAllSourceManifests(),
    },
    keywords: {
      count: KEYWORDS.length,
      crossKeywordRuleCount: CROSS_KEYWORD_RULES.length,
      connectionCounts: keywordConnections,
      definitions: KEYWORDS.map(({ keywordId, displayName, category, arity, relatedStats, compatibleKeywords, conflictingKeywords, reviewStatus }) => ({ keywordId, displayName, category, arity, relatedStats, compatibleKeywords, conflictingKeywords, reviewStatus })),
    },
    based: {
      cueCount: BASED_CUES.length,
      cues: BASED_CUES,
      vibeCount: BASED_VIBES.length,
      vibes: BASED_VIBES,
      speechActs: SPEECH_ACTS,
      deliveryIntensities: DELIVERY_INTENSITIES,
      matrixCellCount: matrix.length,
      matrixStatusCounts: countBy(matrix, (entry) => entry.reviewStatus),
      authoredAnchorCount: anchors.length,
      authoredAnchorStatusCounts: countBy(anchors, (entry) => entry.status),
      gatedAnchorCount: anchors.filter((entry) => entry.audit.gated).length,
      anchorCoverage: new Set(matrix.flatMap((entry) => entry.candidateAnchorIds)).size,
    },
    mechanics: {
      actionCount: ACTION_DEFINITIONS.length,
      actions: ACTION_DEFINITIONS.map(({ actionId, displayName, macroAct, history }) => ({ actionId, displayName, macroAct, history })),
      scenarios: DEMO_SCENARIOS.map((state) => ({
        scenarioId: state.scenarioId,
        title: state.title,
        factCount: state.facts.length,
        recommendedPairCount: state.recommendedPairs.length,
        actionSummary: scenarioActionSummary(state).map((pair) => ({
          actorId: pair.actorId,
          targetId: pair.targetId,
          contextId: pair.contextId,
          availableActionIds: pair.actions.filter((action) => action.status === "AVAILABLE").map((action) => action.actionId),
          availableActions: pair.actions.filter((action) => action.status === "AVAILABLE").map(({ actionId, displayName, macroAct, status }) => ({ actionId, displayName, macroAct, status })),
          blockedActionIds: pair.actions.filter((action) => action.status === "BLOCKED").map((action) => action.actionId),
          blockedActions: pair.actions.filter((action) => action.status === "BLOCKED").map(({ actionId, displayName, macroAct, status, blockers }) => ({ actionId, displayName, macroAct, status, blockers })),
          blockerCodes: [...new Set(pair.actions.flatMap((action) => action.blockers.map((blocker) => blocker.code)))],
        })),
      })),
      capacity: { ...capacity, interpretation: "Valid authored action/coordinate configurations only; this is not a count of independently realized TPL payloads." },
    },
    roles: {
      starterPairCount: RELATIONSHIP_ROLE_CORE.length,
      defaultOnly: RELATIONSHIP_ROLE_CORE.every((entry) => entry.defaultOnly),
      pairs: RELATIONSHIP_ROLE_CORE,
    },
    tpl: {
      families: TPL_FAMILIES,
      atomCount: TPL_ATOMS.length,
      atomsByFamily: Object.fromEntries(TPL_FAMILIES.map((family) => [family, TPL_ATOMS.filter((atom) => atom.family === family).length])),
      constructionCount: TPL_CONSTRUCTIONS.length,
      protocolCount: TPL_PROTOCOLS.length,
      templateCount: TPL_TEMPLATES.length,
      styleProfileCount: TPL_STYLE_PROFILES.length,
      statuses: tplStatusSummary(),
      faceBoundary: FACE_COMPATIBILITY_BOUNDARY,
      runtimeApprovedProtocolCount: TPL_PROTOCOLS.filter((protocol) => protocol.reviewStatus === "APPROVED").length,
      coverageSummary: tplCoverageSummary(tplCoverage),
      coverage: includeCoverage ? tplCoverage : undefined,
    },
    sources: {
      manifestCount: SOURCE_MANIFESTS.length,
      manifestAcquisitionStatuses: sourceStatuses,
      acquisitionStatuses: actualAcquisitionStatuses,
      acquisitionManifestGeneratedAt: acquisitionManifest.generatedAt,
      realAcquiredSourceCount: acquisitionManifest.sources.filter((entry) => ["ACQUIRED_AND_INDEXED", "ACQUIRED_NOT_INDEXED"].includes(entry.status)).length,
      indexedExternalSourceCount: acquisitionManifest.sources.filter((entry) => entry.status === "ACQUIRED_AND_INDEXED").length,
      acquiredNotIndexedSourceCount: acquisitionManifest.sources.filter((entry) => entry.status === "ACQUIRED_NOT_INDEXED").length,
      actualAcquisitions: acquisitionManifest.sources.map(({ sourceId, status, artifactFilename, artifactCachePath, retrievedAt, byteSize, sha256, counts, probes, evidenceBoundary }) => ({ sourceId, status, artifactFilename, artifactCachePath, retrievedAt, byteSize, sha256, counts, probes: probes.map((probe) => ({ query: probe.query, hitCount: probe.results.length, provenancePreserved: probe.results.every((result) => result.provenance?.length > 0) })), evidenceBoundary })),
      runtimeRecordCount: foundationStoreStatus.runtimeRecordCount,
      storeStatus: foundationStoreStatus,
      manifests: SOURCE_MANIFESTS.map(({ sourceId, title, sourceType, canonicalUrl, artifactUrl, currentAcquisitionUrl, sourceVersion, licenseId, licenseUrl, acquisitionStatus, redistributionPolicy, notes }) => ({
        sourceId, title, sourceType, canonicalUrl, artifactUrl,
        ...(currentAcquisitionUrl === undefined ? {} : { currentAcquisitionUrl }),
        sourceVersion, licenseId, licenseUrl, acquisitionStatus, redistributionPolicy, notes,
      })),
    },
  };
}

export function formatInspectionReport(report) {
  const lines = [
    `DPA Message Foundations ${report.schemaVersion}`,
    `Validation: keywords=${report.validation.keywordErrors.length === 0 ? "PASS" : "FAIL"}, BASED=${report.validation.basedErrors.length === 0 ? "PASS" : "FAIL"}, roles=${report.validation.roleErrors.length === 0 ? "PASS" : "FAIL"}, sources=${report.validation.sourceManifestErrors.length === 0 ? "PASS" : "FAIL"}`,
    `Keywords: ${report.keywords.count}; cross-keyword rules: ${report.keywords.crossKeywordRuleCount}; minimum connections: ${Math.min(...Object.values(report.keywords.connectionCounts))}`,
    `BASED: ${report.based.cueCount} cues, ${report.based.vibeCount} ordered Vibes, ${report.based.speechActs.length} macro acts, ${report.based.deliveryIntensities.length} intensities, ${report.based.matrixCellCount} matrix cells`,
    `Anchors: ${report.based.authoredAnchorCount} candidate act/Vibe anchors; ${report.based.gatedAnchorCount} require fact/context gates; mapped reviewed cells=${report.based.matrixStatusCounts.REVIEWED ?? 0}; unmapped=${report.based.matrixStatusCounts.UNMAPPED ?? 0}`,
    `Mechanics: ${report.mechanics.actionCount} actions across ${report.mechanics.scenarios.length} authored demo scenarios`,
    `Semantic capacity: ${report.mechanics.capacity.validUniqueSemanticConfigurations} valid unique configurations; theoretical coordinate cross-product ${report.mechanics.capacity.theoretical}; blocked candidates ${report.mechanics.capacity.blockedCandidates}`,
    `TPL: ${report.tpl.families.length} families, ${report.tpl.atomCount} candidate atoms, ${report.tpl.constructionCount} reviewed constructions, ${report.tpl.templateCount} reviewed templates, ${report.tpl.coverageSummary.rowCount} executable preview rows (ASK/DEAL/PRESSURE=${SPEECH_ACTS.map((act) => report.tpl.coverageSummary.coordinateCountByAct[act]).join("/")}, unique=${SPEECH_ACTS.map((act) => report.tpl.coverageSummary.uniqueRenderedCountByAct[act]).join("/")}, invariance=${report.tpl.coverageSummary.invariancePassCount}, deterministic=${report.tpl.coverageSummary.deterministicCount}, preview=${report.tpl.coverageSummary.previewEligibleCount}, production=${report.tpl.coverageSummary.productionEligibleCount}), approved runtime protocols ${report.tpl.runtimeApprovedProtocolCount}`,
    `Sources: ${report.sources.manifestCount} manifests; actual acquisitions=${report.sources.realAcquiredSourceCount} (${report.sources.indexedExternalSourceCount} indexed, ${report.sources.acquiredNotIndexedSourceCount} authority-only); runtime records=${report.sources.runtimeRecordCount}`,
  ];
  return lines.join("\n");
}
