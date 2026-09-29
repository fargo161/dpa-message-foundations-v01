#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const portableTests = [
  "tests/marcus-world-model-baseline.test.mjs",
  "tests/world-kernel.test.mjs",
  "tests/world-subjective.test.mjs",
  "tests/marcus-world-shadow.test.mjs",
  "tests/review-state-copy.test.mjs",
  "tests/encounter-polish-regression.test.mjs",
  "tests/polish-language.test.mjs",
  "tests/refinement-edge.test.mjs",
  "tests/refinement-language.test.mjs",
  "tests/refinement-delivery.test.mjs",
  "tests/refinement-policy.test.mjs",
  "tests/refinement-acceptance.test.mjs",
  "tests/refinement-ui.test.mjs",
  "tests/conversation-keyword-bank.test.mjs",
  "tests/conversation-delivery.test.mjs",
  "tests/conversation-language.test.mjs",
  "tests/conversation-faces.test.mjs",
  "tests/conversation-acceptance.test.mjs",
  "tests/conversation-portability.test.mjs",
  "tests/conversation-security.test.mjs",
  "tests/encounter-history.test.mjs",
  "tests/encounter-information.test.mjs",
  "tests/encounter-lore-adversarial.test.mjs",
  "tests/encounter-knowledge-unit.test.mjs",
  "tests/encounter-engine.test.mjs",
  "tests/encounter-api.test.mjs",
  "tests/encounter-policy.test.mjs",
  "tests/encounter-adversarial.test.mjs",
  "tests/cli.test.mjs",
  "tests/mechanics.test.mjs",
  "tests/provenance.test.mjs",
  "tests/store.test.mjs",
  "tests/structural.test.mjs",
  "tests/tpl.test.mjs",
  "tests/tpl-runtime.test.mjs",
  "tests/action-tpl-adapter.test.mjs",
  "tests/inspection.test.mjs",
  "tests/schema-validation.test.mjs",
  "tests/generated-freshness.test.mjs",
  "tests/adversarial.test.mjs",
  "tests/lorebook.test.mjs",
];

const schema = spawnSync(process.execPath, ["scripts/validate-schemas.mjs"], { stdio: "inherit" });
if (schema.status !== 0) process.exit(schema.status ?? 1);
const tests = spawnSync(process.execPath, ["--test", ...portableTests], { stdio: "inherit" });
process.exit(tests.status ?? 1);
