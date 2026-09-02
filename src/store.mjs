import { createHash } from "node:crypto";
import { normalizeImportIdentity, createReceipt } from "./sources.mjs";

const hashJson = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const recordNaturalKey = (record) => `${record.sourceId ?? record.provenance?.[0]?.sourceId ?? "unknown"}:${record.sourceRecordId ?? record.externalId ?? record.recordId}`;

export class FoundationStore {
  constructor(seed = {}) {
    this.sources = new Map((seed.sources ?? []).map((entry) => [entry.importFingerprint, structuredClone(entry)]));
    this.records = new Map((seed.records ?? []).map((entry) => [entry.naturalKey, structuredClone(entry)]));
    this.auditLog = [...(seed.auditLog ?? [])];
  }

  importSource({ source, records, bytes = null, retrievedAt = null, synthetic = false }) {
    const sha256 = bytes ? createReceipt({ sourceId: source.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, artifactUrl: source.artifactUrl, bytes, retrievedAt: retrievedAt ?? new Date().toISOString() }).sha256 : source.checksum;
    if (!sha256) return { status: "BLOCKED", sourceId: source.sourceId, insertedSources: 0, insertedRecords: 0, duplicateRecords: 0, errors: ["VERIFIED_CHECKSUM_REQUIRED"] };
    const importFingerprint = hashJson(normalizeImportIdentity({ sourceId: source.sourceId, sourceVersion: source.sourceVersion, licenseId: source.licenseId, sha256 }));
    const existingSource = this.sources.get(importFingerprint);
    if (existingSource) {
      const result = { status: "ALREADY_IMPORTED", sourceId: source.sourceId, importFingerprint, insertedSources: 0, unchangedSources: 1, insertedRecords: 0, unchangedRecords: records.length, duplicateRecords: records.length, updatedRecords: 0, rejectedRecords: 0, quarantinedRecords: 0, errors: [] };
      this.auditLog.push({ event: "IMPORT_REPLAY", ...result });
      return result;
    }
    const staged = [];
    const result = { status: "IMPORTED", sourceId: source.sourceId, importFingerprint, insertedSources: 1, unchangedSources: 0, insertedRecords: 0, unchangedRecords: 0, duplicateRecords: 0, updatedRecords: 0, rejectedRecords: 0, quarantinedRecords: 0, errors: [] };
    for (const record of [...records].sort((a, b) => String(a.recordId).localeCompare(String(b.recordId)))) {
      const naturalKey = recordNaturalKey(record);
      const recordFingerprint = record.fingerprint ?? hashJson(record);
      const existing = this.records.get(naturalKey);
      if (existing && existing.fingerprint === recordFingerprint) { result.duplicateRecords += 1; result.unchangedRecords += 1; continue; }
      if (existing && existing.fingerprint !== recordFingerprint) { result.rejectedRecords += 1; result.errors.push(`CONFLICTING_RECORD:${naturalKey}`); continue; }
      staged.push({ ...structuredClone(record), sourceId: source.sourceId, sourceVersion: source.sourceVersion, naturalKey, fingerprint: recordFingerprint, synthetic, lifecycle: synthetic ? "SYNTHETIC_DEMO" : "CANDIDATE", importFingerprint });
    }
    const sourceRecord = { ...structuredClone(source), importFingerprint, checksum: sha256, byteSize: bytes ? Buffer.from(bytes).byteLength : source.byteSize, retrievedAt: retrievedAt ?? source.retrievedAt, synthetic, label: synthetic ? "SYNTHETIC DEMO" : source.sourceType === "PROJECT_AUTHORED_PACK" ? "PROJECT AUTHORED" : "LICENSED CORPUS", importedRecordCount: staged.length, status: synthetic ? "SYNTHETIC_DEMO" : "ACQUIRED" };
    this.sources.set(importFingerprint, sourceRecord);
    staged.forEach((record) => { this.records.set(record.naturalKey, record); result.insertedRecords += 1; });
    this.auditLog.push({ event: "IMPORT_COMMITTED", ...result });
    return result;
  }

  resetSynthetic() {
    const sourceKeys = [...this.sources.entries()].filter(([, source]) => source.synthetic).map(([key]) => key);
    const recordKeys = [...this.records.entries()].filter(([, record]) => record.synthetic).map(([key]) => key);
    sourceKeys.forEach((key) => this.sources.delete(key));
    recordKeys.forEach((key) => this.records.delete(key));
    const result = { status: "SYNTHETIC_RESET", removedSources: sourceKeys.length, removedRecords: recordKeys.length };
    this.auditLog.push({ event: "SYNTHETIC_RESET", ...result });
    return result;
  }

  snapshot() { return { sources: [...this.sources.values()].sort((a, b) => a.importFingerprint.localeCompare(b.importFingerprint)), records: [...this.records.values()].sort((a, b) => a.naturalKey.localeCompare(b.naturalKey)), auditLog: [...this.auditLog] }; }

  runtimeRecords() { return [...this.records.values()].filter((record) => !record.synthetic && ["APPROVED", "RUNTIME"].includes(record.lifecycle)).sort((a, b) => a.naturalKey.localeCompare(b.naturalKey)); }

  statusSummary() {
    const by = (items, key) => Object.fromEntries([...new Set(items.map((item) => item[key]))].sort().map((value) => [value, items.filter((item) => item[key] === value).length]));
    const sources = [...this.sources.values()];
    const records = [...this.records.values()];
    return { sourcesByStatus: by(sources, "status"), sourcesByLabel: by(sources, "label"), recordsByLifecycle: by(records, "lifecycle"), sourceCount: sources.length, recordCount: records.length, runtimeRecordCount: this.runtimeRecords().length };
  }
}

export function importFixtureIdempotently(store, source, records, bytes = Buffer.from(JSON.stringify(records))) {
  return store.importSource({ source, records, bytes, synthetic: true, retrievedAt: "2026-09-02T12:00:00.000Z" });
}
