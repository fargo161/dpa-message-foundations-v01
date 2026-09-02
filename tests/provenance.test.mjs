import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { SOURCE_MANIFESTS, assertAllowedSourceUrl, createReceipt, safeExtractEntries, validateAllSourceManifests, validateRedirectChain } from "../src/sources.mjs";
import { normalizeAtomicRows, normalizeMoralStoriesRows, normalizeSocialChemistryTsv, dedupeNormalizedRecords } from "../src/ingestion.mjs";

test("source manifest is complete and source URLs are policy-gated", () => {
  assert.equal(SOURCE_MANIFESTS.length, 9);
  assert.deepEqual(validateAllSourceManifests(), []);
  assert.equal(SOURCE_MANIFESTS.filter((source) => source.acquisitionStatus === "ACQUIRED").length, 8);
  assert.equal(assertAllowedSourceUrl("https://github.com/allenai/comet-atomic-2020"), "https://github.com/allenai/comet-atomic-2020");
  assert.throws(() => assertAllowedSourceUrl("http://zissou.infosci.cornell.edu/corpus.zip"), /SOURCE_HTTP_BLOCKED/);
  assert.throws(() => assertAllowedSourceUrl("https://example.com/corpus.zip"), /SOURCE_HOST_NOT_ALLOWLISTED/);
  assert.throws(() => validateRedirectChain(["https://github.com/source", "http://zissou.infosci.cornell.edu/corpus.zip"]), /SOURCE_HTTP_BLOCKED/);
});

test("receipts and archive extraction reject unsafe or unverifiable artifacts", () => {
  const bytes = Buffer.from("fixture");
  const receipt = createReceipt({ sourceId: "fixture", sourceVersion: "0.1", licenseId: "PROJECT_AUTHORED", artifactUrl: "https://github.com/fargo161/one-room-behavior-lab", bytes, retrievedAt: "2026-09-02T12:00:00.000Z" });
  assert.equal(receipt.sha256, createHash("sha256").update(bytes).digest("hex"));
  assert.equal(receipt.byteSize, 7);
  assert.deepEqual(safeExtractEntries([{ name: "ok/file.txt", bytes: "x" }], "C:\\cache\\fixture")[0].outputPath, "C:\\cache\\fixture\\ok\\file.txt");
  assert.throws(() => safeExtractEntries([{ name: "../escape.txt", bytes: "x" }], "C:\\cache\\fixture"), /ARCHIVE_PATH_TRAVERSAL/);
  assert.throws(() => safeExtractEntries([{ name: "C:\\escape.txt", bytes: "x" }], "C:\\cache\\fixture"), /ARCHIVE_PATH_UNSAFE/);
});

test("normalizers preserve provenance and keep priors default-only", () => {
  const atomic = normalizeAtomicRows([
    { id: "a1", head: "person opens door", relation: "xIntent", tail: "enter" },
    { id: "bad", head: "person", relation: "unknown", tail: "thing" },
  ]);
  assert.equal(atomic.records.length, 1);
  assert.equal(atomic.rejections[0].reason, "UNSUPPORTED_RELATION");
  assert.equal(atomic.records[0].defaultOnly, true);
  assert.equal(atomic.records[0].culturallyContingent, true);

  const social = normalizeSocialChemistryTsv("rot-id\trot\tsituation\tsplit\trot-bad\tarea\n1\tSay thanks\tA favor\ttrain\t0\tpoliteness\n2\tInsult them\tA dispute\ttest\t1\tconflict\n");
  assert.equal(social.records.length, 1);
  assert.equal(social.rejected.length, 1);
  assert.equal(social.rejected[0].qualityFlag, "LOW_QUALITY");
  assert.equal(social.records[0].provenance[0].sourceSplit, "train");

  const moral = normalizeMoralStoriesRows([{ ID: "story-1", Norm: "Keep promises", Situation: "A promise exists", Moral_action: "Keep it", Moral_consequence: "Trust", Immoral_action: "Break it", Immoral_consequence: "Distrust" }]);
  assert.equal(moral.records.length, 1);
  assert.equal(moral.records[0].branches.length, 2);
  assert.equal(moral.records[0].defaultOnly, true);
  const deduped = dedupeNormalizedRecords([atomic.records[0], { ...atomic.records[0], provenance: [{ ...atomic.records[0].provenance[0], sourceId: "second-reference" }] }]);
  assert.equal(deduped.records.length, 1);
  assert.equal(deduped.duplicateRecords.length, 1);
  assert.equal(deduped.records[0].provenance.length, 2);
});
