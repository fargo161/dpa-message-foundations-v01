const STOPWORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "was", "with"]);

export function tokenize(value) {
  return [...new Set(String(value ?? "").toLowerCase().match(/[a-z0-9][a-z0-9_-]*/g) ?? [])].filter((token) => !STOPWORDS.has(token));
}

const searchableText = (record) => [
  record.recordId, record.sourceRecordId, record.kind, record.priorKind, record.head, record.tail, record.relation,
  record.situation, record.ruleOfThumb, record.action, record.norm, record.intention, record.text, record.dialogueId,
  record.conversationId, record.speaker, record.role, record.userTurnId, record.annotation, record.strategy, record.label, ...(record.branches ?? []).flatMap((branch) => [branch.label, branch.action, branch.consequence]),
].filter(Boolean).join(" ");

export class SearchIndex {
  constructor(records = [], metadata = {}) {
    this.metadata = { indexVersion: "search-index@0.1", ...metadata };
    this.compact = Boolean(metadata.compactIndex);
    this.records = new Map();
    this.postings = new Map();
    this.add(records);
  }

  add(records) {
    for (const record of records) {
      const copy = this.compact ? {
        recordId: record.recordId,
        sourceId: record.sourceId,
        sourceRecordId: record.sourceRecordId,
        kind: record.kind,
        priorKind: record.priorKind,
        text: record.text ?? null,
        head: record.head ?? null,
        relation: record.relation ?? null,
        tail: record.tail ?? null,
        situation: record.situation ?? null,
        ruleOfThumb: record.ruleOfThumb ?? null,
        action: record.action ?? null,
        norm: record.norm ?? null,
        intention: record.intention ?? null,
        conversationId: record.conversationId ?? null,
        speaker: record.speaker ?? null,
        role: record.role ?? null,
        annotation: record.annotation ?? null,
        branches: record.branches ?? [],
        defaultOnly: record.defaultOnly ?? true,
        evidenceOnly: record.evidenceOnly ?? true,
        provenance: record.provenance ?? [],
      } : structuredClone(record);
      this.records.set(copy.recordId, copy);
      for (const token of tokenize(searchableText(copy))) {
        if (!this.postings.has(token)) this.postings.set(token, new Set());
        this.postings.get(token).add(copy.recordId);
      }
    }
    return this;
  }

  search(query, { limit = 20, sourceId = null, kind = null } = {}) {
    const queryTokens = tokenize(query);
    const scores = new Map();
    for (const token of queryTokens) for (const recordId of this.postings.get(token) ?? []) scores.set(recordId, (scores.get(recordId) ?? 0) + 1);
    return [...scores.entries()]
      .map(([recordId, score]) => ({ record: this.records.get(recordId), score, matchedTokens: queryTokens.filter((token) => this.postings.get(token)?.has(recordId)) }))
      .filter((entry) => (!sourceId || entry.record.sourceId === sourceId) && (!kind || entry.record.kind === kind))
      .sort((a, b) => b.score - a.score || a.record.recordId.localeCompare(b.record.recordId))
      .slice(0, limit)
      .map(({ record, score, matchedTokens }) => ({ recordId: record.recordId, sourceId: record.sourceId, sourceRecordId: record.sourceRecordId, score, matchedTokens, provenance: record.provenance ?? [], preview: searchableText(record).slice(0, 240) }));
  }

  snapshot() {
    return { ...this.metadata, recordCount: this.records.size, tokenCount: this.postings.size, sourceIds: [...new Set([...this.records.values()].map((record) => record.sourceId))].sort() };
  }
}

export function buildSearchIndex(records, metadata = {}) { return new SearchIndex(records, metadata); }
