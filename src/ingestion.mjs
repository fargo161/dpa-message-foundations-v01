import { createHash } from "node:crypto";

const TRANSFORM_VERSION = "normalizer@0.1";

const stableText = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
const sourceRef = (sourceId, sourceVersion, sourceRecordId, licenseId, sourceSplit = undefined, sourceDomain = undefined) => ({ sourceId, sourceVersion, sourceRecordId, sourceSplit, sourceDomain, transformVersion: TRANSFORM_VERSION, licenseId });
const fingerprint = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function parseTsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;
  const finishField = () => { row.push(field); field = ""; };
  const finishRow = () => { finishField(); if (row.some((value) => value.length)) rows.push(row); row = []; };
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (char === "\t" && !quoted) finishField();
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[index + 1] === "\n") index += 1; finishRow(); }
    else field += char;
  }
  if (field || row.length) finishRow();
  return rows;
}

export function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;
  const finishField = () => { row.push(field); field = ""; };
  const finishRow = () => { finishField(); if (row.some((value) => value.length)) rows.push(row); row = []; };
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (char === "," && !quoted) finishField();
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[index + 1] === "\n") index += 1; finishRow(); }
    else field += char;
  }
  if (field || row.length) finishRow();
  return rows;
}

export function normalizeJsonl(text, options = {}) {
  const sourceId = options.sourceId ?? "unknown-jsonl";
  const sourceVersion = options.sourceVersion ?? "unspecified";
  const licenseId = options.licenseId ?? "REFERENCE_ONLY";
  const priorKind = options.priorKind ?? "DIALOGUE_PRIOR";
  const records = [];
  const rejections = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let raw;
    try { raw = JSON.parse(line); } catch { rejections.push({ sourceRecordId: String(index + 1), reason: "INVALID_JSON" }); continue; }
    const sourceRecordId = String(raw.id ?? raw.record_id ?? raw.utterance_id ?? raw.dialogue_id ?? index + 1);
    const textValue = raw.text == null ? null : String(raw.text);
    if (!textValue) { rejections.push({ sourceRecordId, reason: "MISSING_TEXT" }); continue; }
    const record = {
      recordId: `${sourceId}:${sourceRecordId}`,
      sourceId,
      sourceRecordId,
      kind: "DIALOGUE_PRIOR",
      priorKind,
      text: textValue,
      conversationId: raw.conversation_id ?? raw.conversationId ?? raw.dialogue_id ?? raw.root ?? raw.id ?? null,
      speaker: raw.speaker ?? raw.user ?? null,
      replyTo: raw.reply_to ?? raw["reply-to"] ?? raw.replyTo ?? null,
      normalizedScore: raw.meta?.["Normalized Score"] ?? null,
      politenessBinary: raw.meta?.Binary ?? null,
      annotation: raw.meta?.Annotations ?? null,
      defaultOnly: true,
      evidenceOnly: true,
      approvalStatus: "EVIDENCE_PRIOR",
      runtimeEligible: false,
      schemaFieldsObserved: Object.keys(raw).sort(),
      metadataFieldsObserved: Object.keys(raw.meta ?? {}).sort(),
      provenance: [{ sourceId, sourceVersion, sourceRecordId, transformVersion: TRANSFORM_VERSION, licenseId }],
    };
    record.fingerprint = fingerprint({ sourceId, sourceRecordId, text: record.text, conversationId: record.conversationId, speaker: record.speaker, replyTo: record.replyTo });
    records.push(record);
  }
  return { records: records.sort((a, b) => a.recordId.localeCompare(b.recordId)), rejections };
}

export function normalizePfgCsv(text, options = {}) {
  const sourceId = options.sourceId ?? "persuasion-for-good";
  const sourceVersion = options.sourceVersion ?? "master";
  const licenseId = options.licenseId ?? "APACHE-2.0";
  const rows = parseCsv(text);
  if (!rows.length) return { records: [], rejections: [{ sourceRecordId: "0", reason: "EMPTY_CSV" }] };
  const headers = rows[0].map((value) => String(value).trim());
  const index = Object.fromEntries(headers.map((header, position) => [header.toLowerCase(), position]));
  const get = (row, ...keys) => { for (const key of keys) { const position = index[key.toLowerCase()]; if (position !== undefined && row[position] !== undefined && row[position] !== "") return row[position]; } return null; };
  const records = [];
  const rejections = [];
  for (const [offset, row] of rows.slice(1).entries()) {
    const dialogueId = get(row, "dialogue_id", "b2");
    const turn = get(row, "turn");
    const sourceRecordId = `${dialogueId ?? "unknown"}:row_${offset + 1}`;
    const textValue = get(row, "text", "utterance", "unit");
    if (!textValue) { rejections.push({ sourceRecordId, reason: "MISSING_TEXT" }); continue; }
    const record = {
      recordId: `${sourceId}:${sourceRecordId}`,
      sourceId,
      sourceRecordId,
      kind: "DIALOGUE_PRIOR",
      priorKind: "PERSUASION_DIALOGUE",
      text: String(textValue),
      conversationId: dialogueId,
      speaker: get(row, "speaker", "user_id"),
      replyTo: get(row, "reply_to"),
      role: get(row, "role", "b4"),
      userTurnId: turn,
      defaultOnly: true,
      evidenceOnly: true,
      approvalStatus: "EVIDENCE_PRIOR",
      runtimeEligible: false,
      schemaFieldsObserved: headers,
      excludedFields: ["demographics", "personality", "moral_foundations", "values", "donation_outcome"],
      provenance: [{ sourceId, sourceVersion, sourceRecordId, transformVersion: TRANSFORM_VERSION, licenseId }],
    };
    record.fingerprint = fingerprint({ sourceId, sourceRecordId, text: record.text, conversationId: record.conversationId, speaker: record.speaker, replyTo: record.replyTo });
    records.push(record);
  }
  return { records: records.sort((a, b) => a.recordId.localeCompare(b.recordId)), rejections };
}

export function normalizeAtomicRows(rows, options = {}) {
  const sourceId = options.sourceId ?? "atomic-2020";
  const sourceVersion = options.sourceVersion ?? "2020-release";
  const licenseId = options.licenseId ?? "CC-BY-UNVERSIONED";
  const normalized = [];
  const rejections = [];
  const relationFamily = (relation) => ["xIntent", "xNeed", "xAttr", "xEffect", "xReact", "xWant", "oEffect", "oReact", "oWant"].includes(relation) ? "SOCIAL_INTERACTION" : ["HinderedBy", "IsBefore", "IsAfter", "HasSubEvent", "Causes", "xReason"].includes(relation) ? "EVENT_CENTERED" : ["ObjectUse", "AtLocation", "CapableOf", "Desires", "NotDesires"].includes(relation) ? "PHYSICAL_ENTITY" : null;
  for (const [index, raw] of rows.entries()) {
    const head = stableText(raw.head ?? raw.subject ?? raw[0]);
    const relation = stableText(raw.relation ?? raw.predicate ?? raw[1]);
    const tail = stableText(raw.tail ?? raw.object ?? raw[2]);
    const sourceRecordId = stableText(raw.id ?? raw.sourceRecordId ?? `${index + 1}`);
    const family = relationFamily(relation);
    if (!head || !relation || !tail || !family) {
      rejections.push({ sourceRecordId, reason: !family ? "UNSUPPORTED_RELATION" : "MISSING_HEAD_RELATION_TAIL", raw: { head, relation, tail } });
      continue;
    }
    normalized.push({
      recordId: `${sourceId}:${sourceRecordId}`,
      sourceId,
      sourceRecordId,
      kind: "HUMAN_LOGIC_PRIOR",
      priorKind: relation === "HinderedBy" ? "OBSTACLE" : relation === "xIntent" || relation === "xReason" ? "INTENT" : relation === "xNeed" ? "PRECONDITION" : relation.includes("Effect") ? "OTHER_EFFECT" : relation.includes("React") ? "OTHER_REACTION" : relation === "HasSubEvent" ? "SUBEVENT" : relation.includes("Before") || relation.includes("After") ? "EVENT_ORDER" : "OBJECT_AFFORDANCE",
      head,
      relation,
      tail,
      sourceFamily: family,
      defaultOnly: true,
      culturallyContingent: true,
      evidenceOnly: true,
      approvalStatus: "EVIDENCE_PRIOR",
      runtimeEligible: false,
      provenance: [sourceRef(sourceId, sourceVersion, sourceRecordId, licenseId)],
      fingerprint: fingerprint({ sourceId, sourceRecordId, head, relation, tail }),
    });
  }
  return { records: normalized.sort((a, b) => a.recordId.localeCompare(b.recordId)), rejections };
}

export function normalizeSocialChemistryRow(row, headers, options = {}, rowNumber = 1) {
  const sourceId = options.sourceId ?? "social-chemistry-101";
  const sourceVersion = options.sourceVersion ?? "v1.0";
  const licenseId = options.licenseId ?? "CC-BY-SA-4.0";
  const index = Object.fromEntries(headers.map((header, position) => [header, position]));
  const get = (key) => row[index[key]] ?? "";
  const sourceRecordId = stableText(get("rot-id"));
  if (!sourceRecordId) return { record: null, rejected: { sourceRecordId: String(rowNumber), reason: "MISSING_ROT_ID" } };
  const bad = stableText(get("rot-bad"));
  const record = {
    recordId: `${sourceId}:${sourceRecordId}`,
    sourceId,
    sourceRecordId,
    kind: "HUMAN_LOGIC_PRIOR",
    priorKind: "SOCIAL_NORM",
    situation: stableText(get("situation")),
    ruleOfThumb: stableText(get("rot")),
    action: stableText(get("action")) || null,
    split: stableText(get("split")) || null,
    area: stableText(get("area")) || null,
    agreementBucket: get("rot-agree") === "" ? null : Number(get("rot-agree")),
    qualityFlag: bad === "1" ? "LOW_QUALITY" : "DEFAULT",
    categorizations: stableText(get("rot-categorization")).split("|").filter(Boolean).sort(),
    moralFoundations: stableText(get("rot-moral-foundations")).split("|").filter(Boolean).sort(),
    legalityJudgment: stableText(get("action-legal")) || null,
    culturalPressure: get("action-pressure") === "" ? null : Number(get("action-pressure")),
    actionHypothetical: stableText(get("action-hypothetical")) || null,
    culturallyContingent: true,
    defaultOnly: true,
    evidenceOnly: true,
    approvalStatus: "EVIDENCE_PRIOR",
    runtimeEligible: false,
    provenance: [sourceRef(sourceId, sourceVersion, sourceRecordId, licenseId, get("split") || undefined, get("area") || undefined)],
  };
  record.fingerprint = fingerprint({ sourceId, sourceRecordId, situation: record.situation, ruleOfThumb: record.ruleOfThumb, action: record.action });
  return bad === "1" ? { record: null, rejected: record } : { record, rejected: null };
}

export function normalizeSocialChemistryTsv(text, options = {}) {
  const rows = parseTsv(text);
  if (!rows.length) return { records: [], rejected: [], errors: ["EMPTY_TSV"] };
  const headers = rows[0].map(stableText);
  const required = ["rot-id", "rot", "situation", "split", "rot-bad"];
  const errors = required.filter((column) => !headers.includes(column)).map((column) => `MISSING_COLUMN:${column}`);
  if (errors.length) return { records: [], rejected: [], errors };
  const records = [];
  const rejected = [];
  for (const [index, row] of rows.slice(1).entries()) {
    const normalized = normalizeSocialChemistryRow(row, headers, options, index + 2);
    if (normalized.record) records.push(normalized.record);
    if (normalized.rejected) rejected.push(normalized.rejected);
  }
  return { records: records.sort((a, b) => a.recordId.localeCompare(b.recordId)), rejected: rejected.sort((a, b) => String(a.recordId).localeCompare(String(b.recordId))), errors };
}

export function normalizeMoralStoriesRows(rows, options = {}) {
  const sourceId = options.sourceId ?? "moral-stories";
  const sourceVersion = options.sourceVersion ?? "2021-release";
  const licenseId = options.licenseId ?? "MIT";
  const grouped = new Map();
  for (const raw of rows) {
    const id = stableText(raw.ID ?? raw.id ?? raw.story_id ?? raw[0]);
    if (!id) continue;
    if (!grouped.has(id)) grouped.set(id, {});
    const target = grouped.get(id);
    for (const [key, value] of Object.entries(raw)) {
      if (value !== undefined && value !== null && value !== "") target[key.toLowerCase()] = value;
    }
  }
  const records = [...grouped.entries()].map(([id, raw]) => {
    const get = (...keys) => keys.map((key) => stableText(raw[key])).find(Boolean) ?? null;
    const record = {
      recordId: `${sourceId}:${id}`,
      sourceId,
      sourceRecordId: id,
      kind: "HUMAN_LOGIC_PRIOR",
      priorKind: "ACTION_CONSEQUENCE",
      norm: get("norm"),
      situation: get("situation"),
      intention: get("intention"),
      branches: [
        { branchId: "A", label: "moral_action", action: get("moral_action"), consequence: get("moral_consequence") },
        { branchId: "B", label: "immoral_action", action: get("immoral_action"), consequence: get("immoral_consequence") },
      ],
      defaultOnly: true,
      culturallyContingent: true,
      evidenceOnly: true,
      approvalStatus: "EVIDENCE_PRIOR",
      runtimeEligible: false,
      provenance: [sourceRef(sourceId, sourceVersion, id, licenseId)],
    };
    record.fingerprint = fingerprint({ sourceId, id, norm: record.norm, situation: record.situation, branches: record.branches });
    return record;
  });
  return { records: records.sort((a, b) => a.recordId.localeCompare(b.recordId)), rejections: [] };
}

export function dedupeNormalizedRecords(records) {
  const byKey = new Map();
  const duplicateRecords = [];
  for (const record of records) {
    const key = record.recordId;
    const existing = byKey.get(key);
    if (!existing) byKey.set(key, structuredClone(record));
    else {
      existing.provenance = [...new Map([...existing.provenance, ...(record.provenance ?? [])].map((ref) => [`${ref.sourceId}:${ref.sourceRecordId}:${ref.transformVersion}`, ref])).values()].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      duplicateRecords.push(record.recordId);
    }
  }
  return { records: [...byKey.values()].sort((a, b) => a.recordId.localeCompare(b.recordId)), duplicateRecords: duplicateRecords.sort() };
}
