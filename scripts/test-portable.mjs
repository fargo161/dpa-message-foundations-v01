#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const portableTests = [
  "tests/cli.test.mjs",
  "tests/mechanics.test.mjs",
  "tests/provenance.test.mjs",
  "tests/store.test.mjs",
  "tests/structural.test.mjs",
  "tests/tpl.test.mjs",
  "tests/inspection.test.mjs",
  "tests/schema-validation.test.mjs",
  "tests/adversarial.test.mjs",
];

const schema = spawnSync(process.execPath, ["scripts/validate-schemas.mjs"], { stdio: "inherit" });
if (schema.status !== 0) process.exit(schema.status ?? 1);
const tests = spawnSync(process.execPath, ["--test", ...portableTests], { stdio: "inherit" });
process.exit(tests.status ?? 1);
