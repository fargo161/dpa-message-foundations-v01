#!/usr/bin/env node
import { buildAuthoringPipelineTrace, buildInspectionReport, formatInspectionReport } from "./inspection.mjs";

const command = process.argv[2] ?? "help";

function printHelp() {
  console.log("Usage: node src/cli.mjs <inspect|report|demo>");
  console.log("  inspect  Emit the complete machine-readable Phase 1 inspection report.");
  console.log("  report   Emit a concise author-facing status report.");
  console.log("  demo     Trace authored facts through action, semantic request, BASED, and safe rendering.");
}

if (command === "inspect") {
  console.log(JSON.stringify(buildInspectionReport(), null, 2));
} else if (command === "report") {
  console.log(formatInspectionReport(buildInspectionReport()));
} else if (command === "demo") {
  console.log(JSON.stringify(buildAuthoringPipelineTrace(), null, 2));
} else {
  printHelp();
  process.exitCode = command === "help" ? 0 : 1;
}
