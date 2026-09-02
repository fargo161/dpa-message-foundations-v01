import test from "node:test";
import assert from "node:assert/strict";
import { KEYWORDS, CROSS_KEYWORD_RULES, validateKeywordSet } from "../src/keywords.mjs";
import { BASED_CUES, BASED_VIBES, DELIVERY_INTENSITIES, SPEECH_ACTS, generateMatrix, validateBased } from "../src/based.mjs";
import { RELATIONSHIP_ROLE_CORE, validateRoleCore } from "../src/roles.mjs";

test("keyword foundation has the approved bounded graph", () => {
  assert.equal(KEYWORDS.length, 14);
  assert.equal(CROSS_KEYWORD_RULES.length, 13);
  assert.deepEqual(validateKeywordSet(), []);
  const counts = Object.fromEntries(KEYWORDS.map((keyword) => [keyword.keywordId, CROSS_KEYWORD_RULES.filter((rule) => rule.keywords.includes(keyword.keywordId)).length]));
  assert.ok(Object.values(counts).every((count) => count >= 2));
  assert.ok(KEYWORDS.every((keyword) => keyword.positiveExamples.length && keyword.boundaryExamples.length && keyword.counterexamples.length));
});

test("BASED authority is ordered and non-numeric", () => {
  assert.deepEqual(BASED_CUES.map((cue) => cue.cueId), ["B", "A", "S", "E", "D"]);
  assert.equal(BASED_VIBES.length, 20);
  assert.notEqual(BASED_VIBES.find((vibe) => vibe.vibeId === "BA").fusionLogic, BASED_VIBES.find((vibe) => vibe.vibeId === "AB").fusionLogic);
  assert.deepEqual(SPEECH_ACTS, ["DEAL", "PRESSURE", "ASK"]);
  assert.deepEqual(DELIVERY_INTENSITIES, ["SUBTLE", "BALANCED", "OVERT"]);
  assert.equal(generateMatrix().length, 180);
  assert.equal(new Set(generateMatrix().map((cell) => cell.key)).size, 180);
  assert.deepEqual(validateBased(), []);
  assert.deepEqual(validateRoleCore(), []);
  assert.equal(RELATIONSHIP_ROLE_CORE.length, 24);
});
