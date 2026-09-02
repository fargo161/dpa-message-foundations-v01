#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "jsconfig.json", "--noEmit"], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("typecheck-ok: TypeScript checkJs passed for src/ and scripts/");
