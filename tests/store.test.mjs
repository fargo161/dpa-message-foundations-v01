import test from "node:test";
import assert from "node:assert/strict";
import { FoundationStore, importFixtureIdempotently } from "../src/store.mjs";
import { SOURCE_BY_ID } from "../src/sources.mjs";

const source = SOURCE_BY_ID.get("project-role-core");
const records = [
  { recordId: "fixture:one", kind: "PROJECT_FIXTURE", value: "one", provenance: [{ sourceId: source.sourceId, sourceRecordId: "one" }] },
  { recordId: "fixture:two", kind: "PROJECT_FIXTURE", value: "two", provenance: [{ sourceId: source.sourceId, sourceRecordId: "two" }] },
];

test("synthetic import is idempotent, labeled, and resettable", () => {
  const store = new FoundationStore();
  const first = importFixtureIdempotently(store, source, records, Buffer.from("fixture-v1"));
  assert.equal(first.status, "IMPORTED");
  assert.equal(first.insertedSources, 1);
  assert.equal(first.insertedRecords, 2);
  assert.equal(store.snapshot().sources[0].label, "SYNTHETIC DEMO");
  assert.equal(store.runtimeRecords().length, 0);
  const replay = importFixtureIdempotently(store, { ...source, expectedArtifactName: "renamed.zip" }, records, Buffer.from("fixture-v1"));
  assert.equal(replay.status, "ALREADY_IMPORTED");
  assert.equal(replay.insertedRecords, 0);
  assert.equal(store.snapshot().records.length, 2);
  assert.equal(store.resetSynthetic().removedRecords, 2);
  assert.equal(store.snapshot().records.length, 0);
});

test("unverified sources are blocked and non-synthetic candidates survive synthetic reset", () => {
  const store = new FoundationStore();
  const blocked = store.importSource({ source, records, bytes: null, synthetic: false });
  assert.equal(blocked.status, "BLOCKED");
  const imported = store.importSource({ source, records: [records[0]], bytes: Buffer.from("candidate-v1"), retrievedAt: "2026-09-02T12:00:00.000Z", synthetic: false });
  assert.equal(imported.status, "IMPORTED");
  assert.equal(store.snapshot().records.length, 1);
  assert.equal(store.resetSynthetic().removedRecords, 0);
  assert.equal(store.snapshot().records.length, 1);
});
