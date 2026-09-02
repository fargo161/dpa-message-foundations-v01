import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateDocument } from "../src/schema-validator.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("executable schema validator rejects malformed payloads", async () => {
  const keywordSchema = JSON.parse(await readFile(`${root}/schemas/keyword.schema.json`, "utf8"));
  const mechanicsSchema = JSON.parse(await readFile(`${root}/schemas/mechanics.schema.json`, "utf8"));
  assert.ok(validateDocument({}, keywordSchema).length > 0);
  assert.ok(validateDocument({}, mechanicsSchema).length > 0);
});
