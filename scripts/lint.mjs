#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["node_modules/eslint/bin/eslint.js", "src", "scripts", "public/encounter"], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("lint-ok: ESLint static correctness rules passed for src/, scripts/, and public/encounter/");
