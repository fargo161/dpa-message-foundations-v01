#!/usr/bin/env node
import { buildAuthoringPipelineTrace, buildInspectionReport, formatInspectionReport } from "./inspection.mjs";

const command = process.argv[2] ?? "help";
const args = process.argv.slice(3);

function optionValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function printHelp() {
  console.log("Usage: node src/cli.mjs <inspect|report|demo>");
  console.log("  inspect  Emit the machine-readable Phase 2 inspection summary.");
  console.log("           --coverage emits the 180-row TPL coverage table; --coordinate KEY emits one readable row.");
  console.log("  report   Emit a concise author-facing status report.");
  console.log("  demo     Trace authored facts through action, semantic request, BASED, and preview rendering.");
}

if (command === "inspect") {
  const coordinateKey = optionValue("--coordinate");
  const report = buildInspectionReport({ includeCoverage: Boolean(coordinateKey || args.includes("--coverage")) });
  if (coordinateKey) {
    const row = report.tpl.coverage.find((entry) => entry.coordinateKey === coordinateKey);
    if (!row) {
      console.error(`Unknown TPL coordinate: ${coordinateKey}`);
      process.exitCode = 1;
    } else console.log(JSON.stringify(row, null, 2));
  } else if (args.includes("--coverage")) {
    console.log(JSON.stringify({ summary: report.tpl.coverageSummary, rows: report.tpl.coverage }, null, 2));
  } else console.log(JSON.stringify(report, null, 2));
} else if (command === "report") {
  console.log(formatInspectionReport(buildInspectionReport()));
} else if (command === "demo") {
  console.log(JSON.stringify(buildAuthoringPipelineTrace(), null, 2));
} else {
  printHelp();
  process.exitCode = command === "help" ? 0 : 1;
}
