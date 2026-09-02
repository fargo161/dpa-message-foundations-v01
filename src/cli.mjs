#!/usr/bin/env node
import { buildInspectionReport, formatInspectionReport } from "./inspection.mjs";
import { DEMO_SCENARIOS, evaluateAvailableActions, resolveAction, priorCannotMutateState } from "./mechanics.mjs";
import { buildMatrixWithAnchors, generateMatrix } from "./based.mjs";
import { renderSafeFallback } from "./tpl.mjs";

const command = process.argv[2] ?? "help";

function printHelp() {
  console.log("Usage: node src/cli.mjs <inspect|report|demo>");
  console.log("  inspect  Emit the complete machine-readable Phase 1 inspection report.");
  console.log("  report   Emit a concise author-facing status report.");
  console.log("  demo     Show authored mechanics traces and safe TPL fallback examples.");
}

if (command === "inspect") {
  console.log(JSON.stringify(buildInspectionReport(), null, 2));
} else if (command === "report") {
  console.log(formatInspectionReport(buildInspectionReport()));
} else if (command === "demo") {
  const state = DEMO_SCENARIOS[0];
  const pair = state.recommendedPairs[0];
  const evaluations = evaluateAvailableActions(state, pair.actorId, pair.targetId, pair.contextId);
  const extension = resolveAction(state, "REQUEST_EXTENSION", pair.actorId, pair.targetId, pair.contextId);
  const prior = priorCannotMutateState(state, { priorId: "prior_demo_01", text: "A prior scene suggested a debt discussion." });
  const payload = { semanticRequestId: "demo-request-extension", speechAct: extension.macroAct, slots: { REQUEST: "extend the repayment deadline" } };
  const fallback = renderSafeFallback(payload, "AS", "BALANCED");
  console.log(JSON.stringify({ scenarioId: state.scenarioId, pair, availableActions: evaluations.filter((entry) => entry.status === "AVAILABLE").map((entry) => entry.actionId), blockedActionCount: evaluations.filter((entry) => entry.status === "BLOCKED").length, resolvedAction: { actionId: extension.actionId, outcome: extension.outcome, emittedHistory: extension.emittedHistory, trace: extension.trace }, prior, fallback, matrixCells: generateMatrix().length, anchoredMatrixCells: buildMatrixWithAnchors().filter((entry) => entry.candidateAnchorIds.length > 0).length }, null, 2));
} else {
  printHelp();
  process.exitCode = command === "help" ? 0 : 1;
}
