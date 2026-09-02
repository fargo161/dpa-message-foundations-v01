import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { SOURCE_BY_ID, SOURCE_MANIFESTS, assertAllowedSourceUrl, canonicalPosixPath, createReceipt, safeExtractEntries, validateAllSourceManifests, validateArtifactDigest, validateRedirectChain } from "../src/sources.mjs";
import { normalizeAtomicRows, normalizeMoralStoriesRows, normalizeSocialChemistryTsv, dedupeNormalizedRecords } from "../src/ingestion.mjs";

test("source manifest is complete and source URLs are policy-gated", () => {
  assert.equal(SOURCE_MANIFESTS.length, 9);
  assert.deepEqual(validateAllSourceManifests(), []);
  assert.equal(SOURCE_MANIFESTS.filter((source) => source.acquisitionStatus === "ACQUIRED").length, 8);
  assert.ok(SOURCE_MANIFESTS.filter((source) => source.artifactUrl).every((source) => source.verification?.verifiedAt && source.verification.primarySourceUrl && source.verification.artifactEvidenceUrl && source.verification.licenseEvidenceUrl));
  assert.equal(assertAllowedSourceUrl("https://github.com/allenai/comet-atomic-2020"), "https://github.com/allenai/comet-atomic-2020");
  assert.throws(() => assertAllowedSourceUrl("http://zissou.infosci.cornell.edu/corpus.zip"), /SOURCE_HTTP_BLOCKED/);
  assert.throws(() => assertAllowedSourceUrl("https://example.com/corpus.zip"), /SOURCE_HOST_NOT_ALLOWLISTED/);
  assert.throws(() => assertAllowedSourceUrl("https://token:secret@example.com/corpus.zip"), /SOURCE_URL_CREDENTIALS_BLOCKED/);
  assert.throws(() => assertAllowedSourceUrl("https://github.com/source#fragment"), /SOURCE_URL_FRAGMENT_NOT_ALLOWED/);
  assert.throws(() => validateRedirectChain(["https://github.com/source", "http://zissou.infosci.cornell.edu/corpus.zip"]), /SOURCE_HTTP_BLOCKED/);
});

test("registered artifact receipts reject altered or unregistered bytes", () => {
  const atomic = SOURCE_BY_ID.get("atomic-2020");
  assert.doesNotThrow(() => validateArtifactDigest(atomic, { byteSize: atomic.byteSize, sha256: atomic.checksum }));
  assert.throws(() => validateArtifactDigest(atomic, { byteSize: atomic.byteSize - 1, sha256: atomic.checksum }), /SOURCE_BYTE_SIZE_MISMATCH/);
  assert.throws(() => validateArtifactDigest(atomic, { byteSize: atomic.byteSize, sha256: "0".repeat(64) }), /SOURCE_CHECKSUM_MISMATCH/);
  assert.throws(() => validateArtifactDigest(SOURCE_BY_ID.get("project-role-core"), { byteSize: 1, sha256: "0".repeat(64) }), /SOURCE_EXPECTED_RECEIPT_MISSING/);
});

test("TPL authority corruption fails closed before receipt or manifest writes", () => {
  const source = SOURCE_BY_ID.get("tpl-ontology-luangrath-peck-barger");
  const corruptedBytes = Buffer.from("%PDF-corrupted-manuscript");
  const corruptedDigest = { byteSize: corruptedBytes.byteLength, sha256: createHash("sha256").update(corruptedBytes).digest("hex") };
  assert.throws(() => validateArtifactDigest(source, corruptedDigest), /SOURCE_BYTE_SIZE_MISMATCH|SOURCE_CHECKSUM_MISMATCH/);
  const processor = readFileSync(new URL("../scripts/process-real-datasets.mjs", import.meta.url), "utf8");
  const registrationStart = processor.indexOf("async function registerTplAuthority()");
  const validation = processor.indexOf("validateArtifactDigest(source, receipt)", registrationStart);
  const receiptWrite = processor.indexOf("writeFile(receiptPath", registrationStart);
  const manifestWrite = processor.indexOf("writeFile(acquisitionManifestPath", registrationStart);
  assert.ok(registrationStart >= 0 && validation > registrationStart, "TPL registration has no registered-digest validation");
  assert.ok(validation < receiptWrite, "TPL registration writes a receipt before validating its digest");
  assert.ok(validation < manifestWrite, "TPL registration can reach manifest serialization before validating its digest");
});

test("tracked acquisition paths use canonical POSIX separators across platforms", () => {
  assert.equal(canonicalPosixPath(".cache\\external-data\\tpl-authority\\receipt.json"), ".cache/external-data/tpl-authority/receipt.json");
  assert.equal(canonicalPosixPath("data/acquisition-manifest.json"), "data/acquisition-manifest.json");
});

test("synthetic fixture receipts remain explicitly synthetic and cannot validate as acquired", () => {
  const source = SOURCE_BY_ID.get("project-role-core");
  const receipt = createReceipt({ sourceId: source.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, artifactUrl: source.canonicalUrl, bytes: Buffer.from("synthetic-fixture"), retrievedAt: "2026-09-02T12:00:00.000Z" });
  assert.equal(source.acquisitionStatus, "FIXTURE_ONLY");
  assert.throws(() => validateArtifactDigest(source, receipt), /SOURCE_EXPECTED_RECEIPT_MISSING/);
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
    { id: "a2", head: "person opens door", relation: "xEffect", tail: "door opens" },
    { id: "a3", head: "person opens door", relation: "oEffect", tail: "observer notices" },
    { id: "bad", head: "person", relation: "unknown", tail: "thing" },
  ]);
  assert.equal(atomic.records.length, 3);
  assert.equal(atomic.rejections[0].reason, "UNSUPPORTED_RELATION");
  assert.equal(atomic.records[0].defaultOnly, true);
  assert.equal(atomic.records[0].culturallyContingent, true);
  assert.equal(atomic.records.find((record) => record.relation === "xEffect").priorKind, "SELF_EFFECT");
  assert.equal(atomic.records.find((record) => record.relation === "oEffect").priorKind, "OTHER_EFFECT");

  const social = normalizeSocialChemistryTsv("rot-id\trot\tsituation\tsplit\trot-bad\tarea\n1\tSay thanks\tA favor\ttrain\t0\tpoliteness\n2\tInsult them\tA dispute\ttest\t1\tconflict\n");
  assert.equal(social.records.length, 1);
  assert.equal(social.rejected.length, 1);
  assert.equal(social.rejected[0].qualityFlag, "LOW_QUALITY");
  assert.equal(social.records[0].provenance[0].sourceSplit, "train");

  const socialRows = [
    "rot-id\trot\tsituation\tsplit\trot-bad\trot-agree\taction-legal\taction-pressure\trot-worker-id\tbreakdown-worker-id",
    "rot-1\tBe reliable\tA promise exists\ttrain\t0\t2\tyes\t1\tworker-b\tbreakdown-2",
    "rot-1\tBe reliable\tA promise exists\ttrain\t0\t4\tno\t3\tworker-a\tbreakdown-1",
  ].join("\n");
  const socialReordered = socialRows.split("\n").slice(0, 1).concat(socialRows.split("\n").slice(1).reverse()).join("\n");
  const ordered = normalizeSocialChemistryTsv(socialRows);
  const reversed = normalizeSocialChemistryTsv(socialReordered);
  assert.deepEqual(ordered.records, reversed.records);
  assert.equal(ordered.records.length, 1);
  assert.equal(ordered.records[0].annotations.length, 2);
  assert.deepEqual(ordered.records[0].annotations.map((annotation) => annotation.legalityJudgment), ["no", "yes"]);
  assert.equal(ordered.aggregatedAnnotationRows, 1);
  assert.deepEqual(ordered.duplicateRecords, []);

  const moral = normalizeMoralStoriesRows([{ ID: "story-1", Norm: "Keep promises", Situation: "A promise exists", Moral_action: "Keep it", Moral_consequence: "Trust", Immoral_action: "Break it", Immoral_consequence: "Distrust" }]);
  assert.equal(moral.records.length, 1);
  assert.equal(moral.records[0].branches.length, 2);
  assert.equal(moral.records[0].defaultOnly, true);
  const deduped = dedupeNormalizedRecords([atomic.records[0], { ...atomic.records[0], provenance: [{ ...atomic.records[0].provenance[0], sourceId: "second-reference" }] }]);
  assert.equal(deduped.records.length, 1);
  assert.equal(deduped.duplicateRecords.length, 1);
  assert.equal(deduped.records[0].provenance.length, 2);
});
