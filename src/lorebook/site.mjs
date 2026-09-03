import { ACTION_BY_ID } from "../mechanics.mjs";
import { BASED_VIBES, DELIVERY_INTENSITIES } from "../based.mjs";
import { CROSS_KEYWORD_RULES, KEYWORD_BY_ID, KEYWORD_IDS, KEYWORDS } from "../keywords.mjs";

/**
 * Runtime/static-site contract for the future authored lorebook modules.
 *
 * A content module may export `LOREBOOK_CONTENT`, `content`, or a default
 * value with this shape:
 * {
 *   schemaVersion: "dpa-lorebook@0.1",
 *   site: { title, subtitle, description },
 *   articles: [{ keywordId, streetDefinition, technicalDefinition,
 *     whatThisChanges, mechanics, relationships, actions, based, examples,
 *     scenario, confusedWith, evidence, satiricalNote }],
 *   trails: [{ trailId, name, description, keywordIds }]
 * }
 *
 * An illustration module may export `ILLUSTRATIONS`, `illustrations`, or a
 * default map keyed by keyword ID. Each value is either a string SVG or:
 * { illustrationId, svg, alt, description }. SVG is project-authored input;
 * this module rejects scriptable/external SVG constructs before embedding it.
 *
 * The content module is deliberately not imported here: this repository does
 * not yet contain one. The build/check scripts resolve it explicitly so a
 * future content fork gets a useful missing-module error rather than a fake
 * completed book.
 */

export const LOREBOOK_SCHEMA_VERSION = "dpa-lorebook@0.1";

export const RELATIONSHIP_TYPES = Object.freeze([
  "ENABLES",
  "DEPENDS_ON",
  "BLOCKS",
  "CONTRADICTS",
  "INTENSIFIES",
  "REDUCES",
  "REVEALS",
  "CONCEALS",
  "SUBSTITUTES_FOR",
  "CO_OCCURS_WITH",
]);

const RELATIONSHIP_DIRECTIONS = Object.freeze({
  CO_OCCURS_WITH: "CO_OCCURRENCE_ONLY",
  CONTRADICTS: "BIDIRECTIONAL_BY_EXPLICIT_RULE",
  ENABLES: "OUTBOUND_FROM_THIS_TERM",
  DEPENDS_ON: "OUTBOUND_FROM_THIS_TERM",
  BLOCKS: "OUTBOUND_FROM_THIS_TERM",
  INTENSIFIES: "OUTBOUND_FROM_THIS_TERM",
  REDUCES: "OUTBOUND_FROM_THIS_TERM",
  REVEALS: "OUTBOUND_FROM_THIS_TERM",
  CONCEALS: "OUTBOUND_FROM_THIS_TERM",
  SUBSTITUTES_FOR: "OUTBOUND_FROM_THIS_TERM",
});

export const ARTICLE_REQUIRED_FIELDS = Object.freeze([
  "streetDefinition",
  "technicalDefinition",
  "whatThisChanges",
  "mechanics",
  "examples",
  "scenario",
  "confusedWith",
  "evidence",
  "satiricalNote",
]);

export const SITE_ROUTES = Object.freeze({
  home: "/",
  search: "/search/",
  random: "/random/",
  map: "/map/",
  trailIndex: "/trails/",
  keywordPrefix: "/keywords/",
  notFound: "/404.html",
});

const DEFAULT_SITE = Object.freeze({
  title: "The Trapstar Field Guide to Human Logic",
  subtitle: "A practical catalogue of what people want, what they claim to want, and what they are likely to do about the difference.",
  description: "A living, nonlinear field guide to authored human-logic mechanics.",
});

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const array = (value) => Array.isArray(value) ? value : [];

function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
}

function unique(values) {
  return [...new Set(values)];
}

function normalizeBasePath(value = "") {
  const text = String(value ?? "").trim();
  if (!text || text === "/") return "";
  return `/${text.replace(/^\/+|\/+$/g, "")}`;
}

function encodeSegment(value) {
  return encodeURIComponent(String(value));
}

export function keywordRoute(keywordId, options = {}) {
  return `${normalizeBasePath(options.basePath)}${SITE_ROUTES.keywordPrefix}${encodeSegment(keywordId)}/`;
}

export function trailRoute(trailId, options = {}) {
  return `${normalizeBasePath(options.basePath)}${SITE_ROUTES.trailIndex}${encodeSegment(trailId)}/`;
}

export function routeHref(route, options = {}) {
  const basePath = normalizeBasePath(options.basePath);
  if (!route || route === "/") return `${basePath || ""}/`;
  if (route.startsWith(basePath) && basePath) return route;
  return `${basePath}${route.startsWith("/") ? route : `/${route}`}`;
}

/** @param {any} article @param {string} field @param {any} [fallback] */
function articleValue(article, field, fallback = "") {
  const value = article?.[field];
  if (Array.isArray(value)) return value;
  return value ?? fallback;
}

function extractModuleValue(moduleValue, names) {
  if (!moduleValue) return null;
  for (const name of names) if (hasOwn(moduleValue, name)) return moduleValue[name];
  if (hasOwn(moduleValue, "default")) return moduleValue.default;
  return moduleValue;
}

export function extractLorebookContent(moduleValue) {
  const root = extractModuleValue(moduleValue, ["LOREBOOK_CONTENT", "content"]);
  if (!root) return null;
  if (Array.isArray(root)) return { articles: root };
  if (isObject(root) && (root.KEYWORD_ARTICLE_LIST || root.KEYWORD_ARTICLES)) {
    const metadata = root.LOREBOOK_METADATA ?? {};
    return {
      schemaVersion: LOREBOOK_SCHEMA_VERSION,
      site: {
        title: root.LOREBOOK_TITLE ?? metadata.title,
        subtitle: root.LOREBOOK_SUBTITLE ?? metadata.subtitle,
        description: metadata.evidenceBoundary ?? DEFAULT_SITE.description,
      },
      articles: root.KEYWORD_ARTICLE_LIST ?? Object.values(root.KEYWORD_ARTICLES),
      trails: root.READING_TRAILS ?? [],
    };
  }
  if (isObject(root) && Array.isArray(root.articles) && root.schemaVersion === "dpa-keyword-foundation@0.1") {
    return { ...root, schemaVersion: LOREBOOK_SCHEMA_VERSION };
  }
  return root;
}

export function extractLorebookIllustrations(moduleValue) {
  const root = extractModuleValue(moduleValue, ["ILLUSTRATIONS", "illustrations"]);
  if (!root) return null;
  if (isObject(root) && isObject(root.illustrations)) return root.illustrations;
  return root;
}

export function extractLorebookIllustrationRenderer(moduleValue) {
  if (!moduleValue) return null;
  return moduleValue.renderKeywordIllustration ?? moduleValue.default?.renderKeywordIllustration ?? (typeof moduleValue.default === "function" ? moduleValue.default : null);
}

function normalizeRelationshipType(type) {
  if (!nonEmptyString(type)) return type;
  return type.toUpperCase() === "COMMONLY_CO_OCCURS_WITH" ? "CO_OCCURS_WITH" : type.toUpperCase();
}

function normalizeRelationship(sourceId, relationship) {
  if (typeof relationship === "string") return normalizeRelationship(sourceId, { targetId: relationship, type: "CO_OCCURS_WITH", label: "co-occurs with" });
  if (!isObject(relationship)) return { sourceId, targetId: null, type: null, label: "", integrityKey: "" };
  const targetId = relationship.targetId ?? relationship.targetKeywordId ?? relationship.to ?? relationship.keywordId;
  const type = normalizeRelationshipType(relationship.type ?? relationship.relationshipType);
  const normalized = {
    sourceId,
    targetId,
    type,
    label: relationship.label ?? type?.toLowerCase().replaceAll("_", " ") ?? "",
    rationale: relationship.rationale ?? relationship.note ?? relationship.condition ?? "",
    direction: relationship.direction ?? "DIRECTED",
  };
  return { ...normalized, integrityKey: stableJson(normalized) };
}

function normalizeArticle(article, options = {}) {
  const keywordId = article?.keywordId ?? article?.id;
  const canonical = KEYWORD_BY_ID.get(keywordId);
  const illustrationMap = options.illustrations ?? {};
  let illustration = article?.illustration ?? illustrationMap[keywordId] ?? null;
  if (illustration && !illustration.svg && options.illustrationRenderer) {
    const renderedSvg = options.illustrationRenderer(keywordId, {
      description: illustration.altText ?? illustration.description,
      relationshipType: article?.relationships?.[0]?.type ?? keywordId,
      transitionLabel: article?.relationships?.[0]?.condition ?? "AUTHORED RELATION",
    });
    illustration = { ...illustration, svg: renderedSvg, alt: illustration.alt ?? illustration.altText, description: illustration.description ?? illustration.altText };
  }
  const relationships = array(article?.relationships ?? article?.relatedTerms).map((entry) => normalizeRelationship(keywordId, entry));
  const actions = array(article?.actions ?? article?.affordances ?? article?.actionConnections).map((entry) => {
    if (typeof entry === "string") return { actionId: entry, note: "" };
    return { actionId: entry?.actionId ?? entry?.id, note: entry?.note ?? entry?.support ?? "" };
  });
  const based = isObject(article?.based) ? {
    vibes: array(article.based.vibes ?? article.based.vibeIds).map((vibe) => typeof vibe === "string" ? vibe : vibe?.vibeId),
    intensities: Array.isArray(article.based.intensities)
      ? article.based.intensities
      : Object.keys(article.based.intensities ?? {}).length ? Object.keys(article.based.intensities) : [...DELIVERY_INTENSITIES],
    note: article.based.note ?? "",
  } : { vibes: [], intensities: [...DELIVERY_INTENSITIES], note: "" };
  return {
    ...article,
    keywordId,
    displayName: article?.displayName ?? canonical?.displayName ?? keywordId,
    category: article?.category ?? canonical?.category ?? "",
    canonicalDefinition: canonical?.definition ?? "",
    streetDefinition: article?.streetDefinition ?? article?.streetLevelDefinition,
    technicalDefinition: article?.technicalDefinition,
    whatThisChanges: article?.whatThisChanges,
    mechanics: articleValue(article, "mechanics", {}),
    relationships,
    actions,
    based,
    examples: articleValue(article, "examples", {
      compact: article?.mechanicsExample ?? "",
      scenario: article?.scenario ?? "",
    }),
    scenario: article?.scenario,
    confusedWith: articleValue(article, "confusedWith", article?.commonlyConfusedWith ?? []),
    evidence: articleValue(article, "evidence", []),
    satiricalNote: typeof article?.satiricalNote === "string" ? article.satiricalNote : article?.satiricalNote?.text,
    illustration,
  };
}

function normalizeTrail(trail) {
  return {
    trailId: trail?.trailId ?? trail?.id,
    name: trail?.name ?? trail?.title ?? trail?.trailId ?? trail?.id,
    description: trail?.description ?? trail?.rationale ?? "",
    keywordIds: array(trail?.keywordIds ?? trail?.keywords),
  };
}

function deriveRuleEdges() {
  return CROSS_KEYWORD_RULES.flatMap((rule) => rule.keywords.slice(0, -1).flatMap((sourceId, index) => rule.keywords.slice(index + 1).map((targetId) => ({
    sourceId,
    targetId,
    type: "CO_OCCURS_WITH",
    label: "co-occurs with in authored rule",
    rationale: rule.result,
    ruleId: rule.ruleId,
    derived: true,
    direction: "CO_OCCURRENCE_ONLY",
    integrityKey: stableJson({ sourceId, targetId, type: "CO_OCCURS_WITH", label: "co-occurs with in authored rule", rationale: rule.result, direction: "CO_OCCURRENCE_ONLY" }),
  }))));
}

function normalizeSite(site) {
  return { ...DEFAULT_SITE, ...(isObject(site) ? site : {}) };
}

/** @param {{ content?: any, illustrations?: any, illustrationRenderer?: Function, basePath?: string, styles?: string }} [options] */
export function buildLorebookModel({ content, illustrations, illustrationRenderer, basePath = "", styles = "" } = {}) {
  const contentRoot = extractLorebookContent(content) ?? {};
  const illustrationRoot = extractLorebookIllustrations(illustrations) ?? illustrations ?? {};
  const rawArticles = array(contentRoot.articles ?? contentRoot.entries);
  const articles = rawArticles.map((article) => normalizeArticle(article, { illustrations: illustrationRoot, illustrationRenderer }));
  const articleById = new Map(articles.map((article) => [article.keywordId, article]));
  const explicitRelationships = articles.flatMap((article) => article.relationships);
  const derivedRelationships = contentRoot.includeCanonicalRuleEdges === false ? [] : deriveRuleEdges();
  const relationships = [...explicitRelationships, ...derivedRelationships]
    .filter((relationship, index, all) => relationship.targetId && all.findIndex((candidate) => candidate.sourceId === relationship.sourceId && candidate.targetId === relationship.targetId && candidate.type === relationship.type) === index);
  const backlinks = new Map(KEYWORD_IDS.map((keywordId) => [keywordId, []]));
  for (const relationship of relationships) {
    if (backlinks.has(relationship.targetId)) backlinks.get(relationship.targetId).push(relationship);
  }
  for (const links of backlinks.values()) links.sort((left, right) => `${left.sourceId}:${left.type}`.localeCompare(`${right.sourceId}:${right.type}`));
  const trails = array(contentRoot.trails).map(normalizeTrail);
  return {
    schemaVersion: contentRoot.schemaVersion ?? null,
    basePath: normalizeBasePath(basePath),
    styles: nonEmptyString(styles) ? styles : "",
    evidenceSources: isObject(contentRoot.evidenceSources) ? contentRoot.evidenceSources : {},
    site: normalizeSite(contentRoot.site),
    canonicalKeywords: KEYWORDS,
    articles,
    articleById,
    relationships,
    backlinks,
    trails,
    routes: {
      home: routeHref(SITE_ROUTES.home, { basePath }),
      search: routeHref(SITE_ROUTES.search, { basePath }),
      random: routeHref(SITE_ROUTES.random, { basePath }),
      map: routeHref(SITE_ROUTES.map, { basePath }),
      trailIndex: routeHref(SITE_ROUTES.trailIndex, { basePath }),
      notFound: routeHref(SITE_ROUTES.notFound, { basePath }),
    },
  };
}

function requiredFieldPresent(article, field) {
  const value = article?.[field];
  if (Array.isArray(value)) return value.length > 0;
  if (isObject(value)) return Object.keys(value).length > 0;
  return nonEmptyString(value);
}

export function validateLorebookModel(model) {
  const errors = [];
  if (!model || !isObject(model)) return ["model_not_object"];
  if (model.schemaVersion !== LOREBOOK_SCHEMA_VERSION) errors.push("schema_version");
  const canonicalIds = new Set(KEYWORD_IDS);
  const articleIds = model.articles.map((article) => article.keywordId);
  if (model.articles.length !== KEYWORD_IDS.length) errors.push(`article_count:${model.articles.length}/${KEYWORD_IDS.length}`);
  if (new Set(articleIds).size !== articleIds.length) errors.push("duplicate_article_id");
  for (const keywordId of KEYWORD_IDS) {
    const article = model.articleById.get(keywordId);
    if (!article) {
      errors.push(`missing_article:${keywordId}`);
      continue;
    }
    for (const field of ARTICLE_REQUIRED_FIELDS) if (!requiredFieldPresent(article, field)) errors.push(`missing:${keywordId}.${field}`);
    if (!article.illustration) errors.push(`missing_illustration:${keywordId}`);
    else if (!nonEmptyString(article.illustration.alt ?? article.illustration.altText)) errors.push(`missing_illustration_alt:${keywordId}`);
    for (const relationship of article.relationships) {
      if (!canonicalIds.has(relationship.targetId)) errors.push(`unknown_relationship_target:${keywordId}:${relationship.targetId}`);
      if (!RELATIONSHIP_TYPES.includes(relationship.type)) errors.push(`unknown_relationship_type:${keywordId}:${relationship.type}`);
      if (relationship.sourceId !== keywordId) errors.push(`relationship_source_mismatch:${keywordId}`);
      if (relationship.integrityKey !== stableJson({ sourceId: relationship.sourceId, targetId: relationship.targetId, type: relationship.type, label: relationship.label, rationale: relationship.rationale, direction: relationship.direction })) errors.push(`relationship_integrity_mismatch:${keywordId}:${relationship.targetId}`);
    }
    for (const action of article.actions) if (!ACTION_BY_ID.has(action.actionId)) errors.push(`unknown_action:${keywordId}:${action.actionId}`);
    for (const vibeId of article.based.vibes) if (!BASED_VIBES.some((vibe) => vibe.vibeId === vibeId)) errors.push(`unknown_vibe:${keywordId}:${vibeId}`);
    for (const intensity of article.based.intensities) if (!DELIVERY_INTENSITIES.includes(intensity)) errors.push(`unknown_intensity:${keywordId}:${intensity}`);
  }
  for (const relationship of model.relationships) {
    if (!canonicalIds.has(relationship.sourceId) || !canonicalIds.has(relationship.targetId)) errors.push(`dangling_relationship:${relationship.sourceId}:${relationship.targetId}`);
    if (!RELATIONSHIP_TYPES.includes(relationship.type)) errors.push(`invalid_relationship:${relationship.sourceId}:${relationship.type}`);
    if (relationship.direction !== RELATIONSHIP_DIRECTIONS[relationship.type]) errors.push(`relationship_direction:${relationship.sourceId}:${relationship.targetId}:${relationship.type}`);
    if (relationship.integrityKey !== stableJson({ sourceId: relationship.sourceId, targetId: relationship.targetId, type: relationship.type, label: relationship.label, rationale: relationship.rationale, direction: relationship.direction })) errors.push(`relationship_integrity_mismatch:${relationship.sourceId}:${relationship.targetId}`);
  }
  const knownEvidence = model.evidenceSources ?? {};
  for (const article of model.articles) for (const entry of array(article.evidence)) {
    if (!isObject(entry)) {
      errors.push(`invalid_evidence:${article.keywordId}`);
      continue;
    }
    const source = knownEvidence[entry.sourceId];
    if (!source) {
      errors.push(`unknown_evidence:${article.keywordId}:${entry.sourceId}`);
      continue;
    }
    if (entry.sourceVersion !== source.sourceVersion) errors.push(`evidence_version_mismatch:${article.keywordId}:${entry.sourceId}`);
    if (entry.status !== source.status) errors.push(`evidence_status_mismatch:${article.keywordId}:${entry.sourceId}`);
    if (entry.licenseId !== source.licenseId) errors.push(`evidence_license_mismatch:${article.keywordId}:${entry.sourceId}`);
    if (entry.redistributionPolicy !== source.redistributionPolicy) errors.push(`evidence_policy_mismatch:${article.keywordId}:${entry.sourceId}`);
    if (entry.runtimeEligible !== false) errors.push(`evidence_runtime_eligible:${article.keywordId}:${entry.sourceId}`);
  }
  const forwardKeys = new Set(model.relationships.map((entry) => `${entry.sourceId}|${entry.targetId}|${entry.type}`));
  for (const [targetId, incoming] of model.backlinks.entries()) {
    for (const relationship of incoming) if (!forwardKeys.has(`${relationship.sourceId}|${targetId}|${relationship.type}`)) errors.push(`backlink_without_forward:${relationship.sourceId}:${targetId}`);
  }
  const trailIds = new Set();
  for (const trail of model.trails) {
    if (!nonEmptyString(trail.trailId) || trailIds.has(trail.trailId)) errors.push(`invalid_trail_id:${trail.trailId}`);
    trailIds.add(trail.trailId);
    if (!nonEmptyString(trail.name) || !nonEmptyString(trail.description)) errors.push(`incomplete_trail:${trail.trailId}`);
    if (trail.keywordIds.length < 2) errors.push(`short_trail:${trail.trailId}`);
    for (const keywordId of trail.keywordIds) if (!canonicalIds.has(keywordId)) errors.push(`unknown_trail_keyword:${trail.trailId}:${keywordId}`);
  }
  if (model.trails.length < 3) errors.push(`trail_count:${model.trails.length}/3`);
  return unique(errors);
}

export function validateRouteManifest(model, pages = null) {
  const errors = [];
  const manifest = buildRouteManifest(model);
  const routeKeys = manifest.routes.map((entry) => entry.route);
  if (new Set(routeKeys).size !== routeKeys.length) errors.push("duplicate_route");
  const expectedFiles = new Set([
    "index.html",
    "search/index.html",
    "random/index.html",
    "map/index.html",
    "trails/index.html",
    ...model.articles.map((article) => `keywords/${article.keywordId}/index.html`),
    ...model.trails.map((trail) => `trails/${trail.trailId}/index.html`),
  ]);
  const manifestFiles = new Set(manifest.routes.map((entry) => entry.file));
  for (const file of expectedFiles) if (!manifestFiles.has(file)) errors.push(`route_manifest_missing_file:${file}`);
  for (const file of manifestFiles) if (!expectedFiles.has(file)) errors.push(`route_manifest_unexpected_file:${file}`);
  if (pages) {
    for (const file of expectedFiles) if (!pages.has(file)) errors.push(`rendered_page_missing:${file}`);
    for (const file of pages.keys()) if (file.endsWith(".html") && file !== "404.html" && !expectedFiles.has(file)) errors.push(`rendered_page_unmanifested:${file}`);
  }
  return unique(errors);
}

function searchTextForArticle(article, model) {
  const canonical = KEYWORD_BY_ID.get(article.keywordId);
  const typedRoles = Object.entries(article.canonicalShape?.typedArgumentRoles ?? canonical?.typedArgumentRoles ?? {}).flatMap(([key, role]) => [key, role]);
  const relations = article.relationships.flatMap((relationship) => [
    relationship.type,
    relationship.label,
    relationship.rationale,
    relationship.targetId,
    model.articleById.get(relationship.targetId)?.displayName,
  ]);
  const actions = article.actions.flatMap((action) => [
    action.actionId,
    action.note,
    ACTION_BY_ID.get(action.actionId)?.displayName,
    ACTION_BY_ID.get(action.actionId)?.macroAct,
  ]);
  return [
    article.keywordId,
    article.displayName,
    article.category,
    canonical?.definition,
    article.canonicalDefinition,
    article.streetDefinition,
    article.technicalDefinition,
    article.technicalMechanicNote,
    article.whatThisChanges,
    article.explicitNonMeanings,
    article.canonicalShape,
    article.mechanics,
    article.materialRelationships,
    article.emotionalLeverage,
    article.examples,
    article.scenario,
    article.confusedWith,
    article.evidence,
    article.satiricalNote,
    article.based,
    typedRoles,
    relations,
    actions,
  ].map(text).join(" ").toLocaleLowerCase();
}

export { searchTextForArticle };

export function searchLorebook(model, query = "") {
  const normalizedQuery = String(query).trim().toLocaleLowerCase();
  if (!normalizedQuery) return [...model.articles];
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return model.articles.filter((article) => terms.every((term) => searchTextForArticle(article, model).includes(term)));
}

export function randomKeyword(model, seed = null) {
  const articles = model.articles;
  if (!articles.length) return null;
  if (seed === null || seed === undefined || seed === "") return articles[Math.floor(Math.random() * articles.length)];
  let hash = 2166136261;
  for (const character of String(seed)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return articles[Math.abs(hash) % articles.length];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
}

function text(value) {
  if (Array.isArray(value)) return value.map((entry) => text(entry)).join(" ");
  if (isObject(value)) return Object.values(value).map((entry) => text(entry)).join(" ");
  return String(value ?? "");
}

function renderInline(value, model) {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry === "string") return renderInline(entry, model);
      if (isObject(entry) && (entry.keywordId || entry.targetId)) {
        const keywordId = entry.keywordId ?? entry.targetId;
        if (!model.articleById.has(keywordId)) return escapeHtml(entry.label ?? keywordId);
        return `<a href="${escapeHtml(keywordRoute(keywordId, model))}">${escapeHtml(entry.label ?? model.articleById.get(keywordId).displayName)}</a>`;
      }
      return escapeHtml(text(entry));
    }).join("");
  }
  const source = escapeHtml(value);
  return source.replace(/\[\[([A-Z][A-Z0-9_]+)(?:\|([^\]]+))?\]\]/g, (match, keywordId, label) => {
    if (!model.articleById.has(keywordId)) return match;
    return `<a href="${escapeHtml(keywordRoute(keywordId, model))}">${escapeHtml(label ?? model.articleById.get(keywordId).displayName)}</a>`;
  });
}

function renderParagraphs(value, model) {
  const paragraphs = Array.isArray(value) ? value : [value];
  return paragraphs.filter((paragraph) => paragraph !== undefined && paragraph !== null && text(paragraph).trim()).map((paragraph) => `<p>${renderInline(paragraph, model)}</p>`).join("\n");
}

function renderList(items, model, empty = "None recorded.") {
  const values = array(items).filter((item) => text(item).trim());
  if (!values.length) return `<p class="empty-note">${escapeHtml(empty)}</p>`;
  return `<ul>${values.map((item) => `<li>${renderInline(typeof item === "string" ? item : text(item), model)}</li>`).join("")}</ul>`;
}

function renderLabel(label, value) {
  return `<div class="fact"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(text(value))}</dd></div>`;
}

function renderIllustration(article) {
  const illustration = typeof article.illustration === "string" ? { svg: article.illustration, alt: `${article.displayName} relationship diagram` } : article.illustration;
  if (!illustration) return `<figure class="illustration illustration-missing" data-illustration-status="MISSING"><div class="illustration-placeholder">ILLUSTRATION PENDING</div><figcaption>Illustration pending for ${escapeHtml(article.displayName)}.</figcaption></figure>`;
  const svg = String(illustration.svg ?? "");
  const unsafe = /<\/?script\b|<foreignObject\b|javascript:|data:text\/html|xlink:href\s*=|href\s*=\s*["']https?:/i.test(svg);
  if (!svg.trim().startsWith("<svg") || unsafe) return `<figure class="illustration illustration-invalid" data-illustration-status="INVALID"><div class="illustration-placeholder">ILLUSTRATION REJECTED</div><figcaption>Illustration failed the static safety boundary for ${escapeHtml(article.displayName)}.</figcaption></figure>`;
  return `<figure class="illustration" data-illustration-status="READY"><div class="illustration-art">${svg}</div><figcaption>${escapeHtml(illustration.description ?? illustration.alt ?? illustration.altText)}</figcaption></figure>`;
}

function renderRelationshipList(article, model) {
  const outgoing = model.relationships.filter((relationship) => relationship.sourceId === article.keywordId);
  const incoming = model.backlinks.get(article.keywordId) ?? [];
  const all = [
    ...outgoing.map((relationship) => ({ ...relationship, relationDirection: relationship.type === "CO_OCCURS_WITH" ? "co-occurs with" : "points to" })),
    ...incoming.map((relationship) => ({ ...relationship, relationDirection: relationship.type === "CO_OCCURS_WITH" ? "co-occurs with" : "points here from" })),
  ];
  if (!all.length) return `<p class="empty-note">No typed links yet. The ontology editor must add an authored edge.</p>`;
  return `<ul class="relationship-list">${all.map((relationship) => {
    const otherId = relationship.relationDirection === "points to" || relationship.relationDirection === "co-occurs with" ? relationship.targetId : relationship.sourceId;
    const other = model.articleById.get(otherId);
    return `<li><span class="relationship-direction">${escapeHtml(relationship.relationDirection)}</span> <a href="${escapeHtml(keywordRoute(otherId, model))}">${escapeHtml(other?.displayName ?? otherId)}</a> <strong class="relationship-type">${escapeHtml(relationship.type)}</strong>${relationship.rationale ? ` <span class="relationship-rationale">${escapeHtml(relationship.rationale)}</span>` : ""}</li>`;
  }).join("")}</ul>`;
}

function renderActionList(article) {
  if (!article.actions.length) return `<p class="empty-note">No authored action affordance is registered for this term.</p>`;
  return `<ul>${article.actions.map((action) => {
    const definition = ACTION_BY_ID.get(action.actionId);
    return `<li><strong>${escapeHtml(definition?.displayName ?? action.actionId)}</strong> <span class="act-tag">${escapeHtml(definition?.macroAct ?? "UNREGISTERED")}</span>${action.note ? ` — ${escapeHtml(action.note)}` : ""}</li>`;
  }).join("")}</ul>`;
}

function renderEvidence(article, model) {
  const evidence = array(article.evidence);
  if (!evidence.length) return `<p class="empty-note">No source record is attached yet.</p>`;
  return `<ul class="evidence-list">${evidence.map((entry) => {
    const item = typeof entry === "string" ? { label: entry, status: "EDITORIAL_INTERPRETATION" } : entry;
    const status = item.status ?? "EDITORIAL_INTERPRETATION";
    return `<li><span class="status-label">${escapeHtml(status)}</span> ${item.sourceId ? `<code>${escapeHtml(item.sourceId)}</code> ` : ""}${renderInline(item.label ?? item.note ?? item.claim ?? "", model)}</li>`;
  }).join("")}</ul>`;
}

function renderSearchTerms(model) {
  return model.articles.map((article) => `<li data-search-term="${escapeHtml(searchTextForArticle(article, model))}"><a href="${escapeHtml(keywordRoute(article.keywordId, model))}">${escapeHtml(article.displayName)}</a><span>${escapeHtml(article.category)}</span></li>`).join("");
}

function renderTrailLinks(model, trails = model.trails) {
  if (!trails.length) return `<p class="empty-note">No authored reading trails are available.</p>`;
  return `<ul class="trail-list">${trails.map((trail) => `<li><a href="${escapeHtml(trailRoute(trail.trailId, model))}">${escapeHtml(trail.name)}</a><span>${escapeHtml(trail.description)}</span></li>`).join("")}</ul>`;
}

function renderHead(title, model, description = model.site.description) {
  const styles = [model.styles, SITE_CSS].filter((value) => nonEmptyString(value)).join("\n");
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><title>${escapeHtml(title)} · ${escapeHtml(model.site.title)}</title><style>${styles}</style>`;
}

const SITE_CSS = `
:root { color-scheme: light dark; --ink: #191817; --paper: #eee8dc; --paper-deep: #d6ccb9; --red: #a13b2f; --gold: #b2863c; --signal: #467783; --muted: #625e56; --focus: #f0b429; --line: #958b78; font-family: "Segoe UI", system-ui, sans-serif; }
* { box-sizing: border-box; }
html { background: var(--paper); color: var(--ink); scroll-behavior: smooth; }
body { margin: 0; min-width: 17rem; line-height: 1.55; background: radial-gradient(circle at 15% 0, rgba(178,134,60,.09), transparent 28rem), var(--paper); }
a { color: var(--red); text-decoration-thickness: .11em; text-underline-offset: .16em; }
a:hover { color: var(--signal); }
a:focus-visible, button:focus-visible, input:focus-visible { outline: .2rem solid var(--focus); outline-offset: .2rem; }
.skip-link { position: absolute; left: .75rem; top: .5rem; transform: translateY(-180%); background: var(--ink); color: var(--paper); padding: .5rem .75rem; z-index: 3; }
.skip-link:focus { transform: translateY(0); }
.site-header, .site-footer, main, .site-nav { width: min(100% - 2rem, 78rem); margin-inline: auto; }
.site-header { padding: 2rem 0 1rem; border-bottom: .16rem solid var(--ink); }
.masthead { display: flex; gap: 1rem; align-items: baseline; justify-content: space-between; flex-wrap: wrap; }
.eyebrow, .status-label, .act-tag, .relationship-type, .route-label { font: 700 .72rem/1.2 "Arial Narrow", Impact, sans-serif; letter-spacing: .09em; text-transform: uppercase; }
.eyebrow { color: var(--red); }
h1, h2, h3 { font-family: "Arial Narrow", Impact, "Segoe UI", sans-serif; line-height: 1.05; letter-spacing: -.02em; }
h1 { font-size: clamp(2.2rem, 7vw, 5.6rem); margin: .2rem 0 .5rem; max-width: 12ch; }
h2 { font-size: clamp(1.45rem, 3vw, 2.35rem); margin-top: 2.2rem; }
h3 { font-size: 1.2rem; }
.subtitle { max-width: 60ch; color: var(--muted); }
.site-nav { padding: .7rem 0; display: flex; flex-wrap: wrap; gap: .65rem 1.1rem; }
.site-nav a { font-weight: 700; }
main { padding: 1.2rem 0 4rem; }
.content-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(14rem, 22rem); gap: 2rem; align-items: start; }
.panel, .term-card, .mechanics-card, .illustration { border: .12rem solid var(--line); background: color-mix(in srgb, var(--paper) 90%, var(--paper-deep)); box-shadow: .35rem .35rem 0 rgba(25,24,23,.12); }
.panel, .term-card, .mechanics-card { padding: 1rem; }
.term-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1rem; }
.term-card h2, .term-card h3 { margin: 0 0 .4rem; }
.term-card p { margin: .35rem 0; }
.term-meta { color: var(--muted); font-size: .9rem; }
.article-header { border-left: .5rem solid var(--red); padding-left: 1rem; }
.canonical-id { color: var(--muted); font-family: ui-monospace, monospace; font-size: .9rem; }
.street-definition { font-size: 1.25rem; max-width: 58ch; }
.definition-label { color: var(--red); font-weight: 800; }
.fact-list { display: grid; gap: .6rem; margin: 0; }
.fact { border-top: .08rem solid var(--line); padding-top: .5rem; }
.fact dt { font-weight: 800; }
.fact dd { margin: 0; }
.illustration { padding: .75rem; margin: 1rem 0; min-height: 10rem; }
.illustration-art { display: grid; place-items: center; min-height: 7rem; }
.illustration-art svg { width: 100%; height: auto; max-height: 18rem; }
.illustration figcaption { color: var(--muted); font-size: .85rem; margin-top: .55rem; }
.illustration-placeholder { min-height: 7rem; display: grid; place-items: center; color: var(--muted); letter-spacing: .12em; font: 700 .78rem/1 "Arial Narrow", Impact, sans-serif; }
.relationship-list, .evidence-list, .trail-list { padding-left: 1.2rem; }
.relationship-list li, .evidence-list li, .trail-list li { margin: .55rem 0; }
.relationship-direction, .relationship-rationale, .trail-list span { color: var(--muted); }
.relationship-type, .act-tag, .status-label { display: inline-block; border: .08rem solid currentColor; padding: .12rem .3rem; margin-inline: .2rem; }
.relationship-type { color: var(--signal); }
.act-tag { color: var(--red); }
.status-label { color: var(--gold); }
.marginalia { border-top: .12rem dashed var(--red); margin-top: 1.5rem; padding-top: .7rem; color: var(--muted); font-style: italic; }
.search-form { display: flex; gap: .5rem; max-width: 42rem; }
.search-form input { flex: 1; min-width: 0; padding: .7rem; border: .12rem solid var(--ink); background: var(--paper); color: var(--ink); font: inherit; }
button { padding: .7rem 1rem; border: .12rem solid var(--ink); background: var(--ink); color: var(--paper); cursor: pointer; font: 700 .9rem/1 "Arial Narrow", Impact, sans-serif; }
.search-results { list-style: none; padding: 0; max-width: 46rem; }
.search-results li { display: flex; justify-content: space-between; gap: 1rem; border-bottom: .08rem solid var(--line); padding: .7rem 0; }
.search-results li span { color: var(--muted); }
.random-options { columns: 2 12rem; }
.random-options li { margin: .35rem 0; }
.map-list { list-style: none; padding: 0; display: grid; gap: .7rem; }
.map-list li { border-left: .35rem solid var(--signal); padding: .45rem .7rem; background: color-mix(in srgb, var(--paper) 92%, var(--paper-deep)); }
.site-footer { border-top: .12rem solid var(--line); padding: 1.5rem 0 3rem; color: var(--muted); font-size: .9rem; }
.empty-note { color: var(--muted); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 42rem) { .site-header, .site-footer, main, .site-nav { width: min(100% - 1.25rem, 78rem); } .content-grid { display: block; } .content-grid > * + * { margin-top: 1.2rem; } .masthead { display: block; } .search-form { display: block; } .search-form input, .search-form button { width: 100%; margin-bottom: .5rem; } .search-results li { display: block; } }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
@media (prefers-contrast: more) { :root { --line: var(--ink); --muted: var(--ink); } a { text-decoration-thickness: .18em; } }
@media (prefers-color-scheme: dark) { :root { --ink: #f0eadf; --paper: #242321; --paper-deep: #37332d; --muted: #c5bbab; --line: #a79b88; --red: #f0806b; --gold: #e2bd68; --signal: #83c3cd; } body { background: radial-gradient(circle at 15% 0, rgba(226,189,104,.08), transparent 28rem), var(--paper); } }
`;

function renderRuntimeScript(model) {
  const data = {
    routes: model.routes,
    keywordRoutes: Object.fromEntries(model.articles.map((article) => [article.keywordId, keywordRoute(article.keywordId, model)])),
  };
  return `<script type="module">(() => {
  const DATA = ${safeJson(data)};
  const searchForm = document.querySelector("[data-lorebook-search]");
  const searchInput = searchForm?.querySelector("input[name=q]");
  const searchItems = [...document.querySelectorAll("[data-search-term]")];
  const searchStatus = document.querySelector("[data-search-status]");
  const updateSearch = () => {
    if (!searchInput || !searchItems.length) return;
    const terms = searchInput.value.trim().toLocaleLowerCase().split(/\\s+/).filter(Boolean);
    let visible = 0;
    for (const item of searchItems) {
      const shown = terms.every((term) => item.dataset.searchTerm.includes(term));
      item.hidden = !shown;
      if (shown) visible += 1;
    }
    if (searchStatus) searchStatus.textContent = terms.length ? visible + " matching terms" : visible + " terms";
  };
  if (searchInput) {
    const params = new URLSearchParams(window.location.search);
    searchInput.value = params.get("q") ?? "";
    searchInput.addEventListener("input", updateSearch);
    updateSearch();
  }
  const randomTarget = document.querySelector("[data-lorebook-random-target]");
  const randomButton = document.querySelector("[data-lorebook-random-button]");
  const randomOptions = [...document.querySelectorAll("[data-random-option]")];
  const chooseRandom = () => {
    if (!randomOptions.length) return;
    const selected = randomOptions[Math.floor(Math.random() * randomOptions.length)];
    if (randomTarget) { randomTarget.href = selected.href; randomTarget.textContent = "Open " + selected.textContent; }
  };
  randomButton?.addEventListener("click", chooseRandom);
  if (randomOptions.length) chooseRandom();
  document.documentElement.dataset.lorebookEnhanced = "true";
})();</script>`;
}

export function renderShell({ model, title, body, currentRoute = "" }) {
  const nav = [
    ["Index", model.routes.home],
    ["Search", model.routes.search],
    ["Random term", model.routes.random],
    ["Relationship map", model.routes.map],
    ["Reading trails", model.routes.trailIndex],
  ];
  return `<!doctype html><html lang="en"><head>${renderHead(title, model)}</head><body class="lorebook-site trapstar-field-guide"><a class="skip-link" href="#main-content">Skip to main content</a><header class="site-header"><div class="masthead"><div><p class="eyebrow">TRAPSTAR FIELD GUIDE / LIVING DOCUMENT</p><p class="canonical-id">${escapeHtml(model.site.title)}</p></div><span class="route-label">${escapeHtml(currentRoute || "INDEX")}</span></div><p class="subtitle">${escapeHtml(model.site.subtitle)}</p></header><nav class="site-nav" aria-label="Primary navigation">${nav.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join("")}</nav><main id="main-content">${body}</main><footer class="site-footer"><p>Canonical terms and authored mechanics remain distinct from editorial interpretation, evidence priors, and satire.</p><p><a href="${escapeHtml(model.routes.home)}">Return to the index</a></p></footer>${renderRuntimeScript(model)}</body></html>`;
}

export function renderIndexPage(model) {
  const body = `<section class="panel"><p class="eyebrow">START ANYWHERE</p><h1>${escapeHtml(model.site.title)}</h1><p class="street-definition">${escapeHtml(model.site.description)}</p><p>Enter through a term, follow a typed relationship, search by mechanic, or let the field guide choose a route. The links are ordinary HTML links, so the document remains readable when the enhancement script is unavailable.</p></section><section aria-labelledby="terms-heading"><h2 id="terms-heading">Canonical keywords</h2><div class="term-grid">${model.articles.map((article) => `<article class="term-card"><p class="eyebrow">${escapeHtml(article.category)}</p><h3><a href="${escapeHtml(keywordRoute(article.keywordId, model))}">${escapeHtml(article.displayName)}</a></h3><p>${escapeHtml(article.streetDefinition ?? article.canonicalDefinition)}</p><p class="term-meta"><code>${escapeHtml(article.keywordId)}</code> · ${model.relationships.filter((relationship) => relationship.sourceId === article.keywordId || relationship.targetId === article.keywordId).length} typed connections</p></article>`).join("")}</div></section><section aria-labelledby="trails-heading"><h2 id="trails-heading">Reading trails</h2>${renderTrailLinks(model)}</section>`;
  return renderShell({ model, title: "Index", body, currentRoute: "INDEX" });
}

export function renderKeywordPage(model, keywordId) {
  const article = model.articleById.get(keywordId);
  if (!article) return renderNotFoundPage(model, keywordId);
  const examples = isObject(article.examples) ? article.examples : { compact: article.examples };
  const mechanics = isObject(article.mechanics) ? article.mechanics : { detail: article.mechanics };
  const body = `<div class="content-grid"><article><header class="article-header"><p class="eyebrow">${escapeHtml(article.category)} / CANONICAL ARTICLE</p><h1>${escapeHtml(article.displayName)}</h1><p class="canonical-id">${escapeHtml(article.keywordId)}</p><p class="street-definition"><span class="definition-label">On the street:</span> ${renderInline(article.streetDefinition ?? article.canonicalDefinition, model)}</p></header>${renderIllustration(article)}<section aria-labelledby="technical-heading"><h2 id="technical-heading">Technical definition</h2>${renderParagraphs(article.technicalDefinition, model)}<p><span class="definition-label">Canonical definition:</span> ${renderInline(article.canonicalDefinition, model)}</p></section><section aria-labelledby="changes-heading"><h2 id="changes-heading">What this changes</h2>${renderParagraphs(article.whatThisChanges, model)}</section><section aria-labelledby="mechanics-heading"><h2 id="mechanics-heading">Mechanic in the field</h2><dl class="fact-list">${renderLabel("Inputs", mechanics.inputs)}${renderLabel("Preconditions", mechanics.preconditions)}${renderLabel("State changes", mechanics.stateChanges)}${renderLabel("Outputs", mechanics.outputs)}${renderLabel("Blockers", mechanics.blockers)}</dl>${examples.compact ? `<h3>Compact example</h3>${renderParagraphs(examples.compact, model)}` : ""}${article.scenario ? `<h3>Human-readable scenario</h3>${renderParagraphs(article.scenario, model)}` : ""}</section><section aria-labelledby="confused-heading"><h2 id="confused-heading">Commonly confused with</h2>${renderList(article.confusedWith, model)}</section><section aria-labelledby="evidence-heading"><h2 id="evidence-heading">Evidence and status</h2>${renderEvidence(article, model)}</section>${article.satiricalNote ? `<aside class="marginalia" aria-label="Satirical commentary"><strong>Marginal note / commentary:</strong> ${renderInline(article.satiricalNote, model)}</aside>` : ""}</article><aside class="panel" aria-labelledby="connections-heading"><h2 id="connections-heading">Connections</h2>${renderRelationshipList(article, model)}<h3>Action affordances</h3>${renderActionList(article)}<h3>BASED / delivery</h3>${article.based.vibes.length ? renderList(article.based.vibes.map((vibeId) => `${BASED_VIBES.find((vibe) => vibe.vibeId === vibeId)?.name ?? vibeId} (${vibeId})`), model) : `<p class="empty-note">No authored Vibe mapping is attached.</p>`}<p>${escapeHtml(article.based.note)}</p><p><a href="${escapeHtml(model.routes.map)}">See every relationship edge</a></p></aside></div>`;
  return renderShell({ model, title: article.displayName, body, currentRoute: `KEYWORD / ${article.keywordId}` });
}

export function renderSearchPage(model) {
  const body = `<section class="panel"><p class="eyebrow">SEARCH THE FIELD GUIDE</p><h1>Find a term</h1><form class="search-form" data-lorebook-search method="get" action="${escapeHtml(model.routes.search)}" role="search"><label class="sr-only" for="term-search">Search by name, phrase, role, relationship, action, or mechanic</label><input id="term-search" name="q" type="search" autocomplete="off" placeholder="Try leverage, request, access…"><button type="submit">Search</button></form><p id="search-status" data-search-status aria-live="polite">${model.articles.length} terms</p></section><section aria-labelledby="results-heading"><h2 id="results-heading">All canonical terms</h2><ul class="search-results">${renderSearchTerms(model)}</ul></section>`;
  return renderShell({ model, title: "Search", body, currentRoute: "SEARCH" });
}

export function renderRandomPage(model) {
  const first = model.articles[0];
  const body = `<section class="panel"><p class="eyebrow">NONLINEAR ENTRY POINT</p><h1>Random term</h1><p>JavaScript may choose a fresh term. Without it, this page still offers every ordinary article link.</p><p><a data-lorebook-random-target href="${escapeHtml(first ? keywordRoute(first.keywordId, model) : model.routes.home)}">Open ${escapeHtml(first?.displayName ?? "the index")}</a> <button type="button" data-lorebook-random-button>Choose again</button></p></section><section aria-labelledby="random-options-heading"><h2 id="random-options-heading">Browseable options</h2><ul class="random-options">${model.articles.map((article) => `<li><a data-random-option href="${escapeHtml(keywordRoute(article.keywordId, model))}">${escapeHtml(article.displayName)}</a></li>`).join("")}</ul></section>`;
  return renderShell({ model, title: "Random term", body, currentRoute: "RANDOM" });
}

export function renderMapPage(model) {
  const sorted = [...model.relationships].sort((left, right) => `${left.sourceId}:${left.targetId}:${left.type}`.localeCompare(`${right.sourceId}:${right.targetId}:${right.type}`));
  const body = `<section class="panel"><p class="eyebrow">ONTOLOGY / EXPLICIT TEXTUAL EDGES</p><h1>Relationship map</h1><p>Each edge states its direction and relationship type in text. CO_OCCURS_WITH is a navigation-only co-occurrence link, not a directional truth claim. Color is a filing cue, not the meaning.</p></section><section aria-labelledby="map-heading"><h2 id="map-heading">${sorted.length} authored and derived edges</h2><ul class="map-list">${sorted.map((relationship) => `<li><a href="${escapeHtml(keywordRoute(relationship.sourceId, model))}">${escapeHtml(model.articleById.get(relationship.sourceId)?.displayName ?? relationship.sourceId)}</a> <strong class="relationship-type">${escapeHtml(relationship.type)}</strong> <a href="${escapeHtml(keywordRoute(relationship.targetId, model))}">${escapeHtml(model.articleById.get(relationship.targetId)?.displayName ?? relationship.targetId)}</a>${relationship.rationale ? `<br><span class="relationship-rationale">${escapeHtml(relationship.rationale)}</span>` : ""}</li>`).join("")}</ul></section>`;
  return renderShell({ model, title: "Relationship map", body, currentRoute: "MAP" });
}

export function renderTrailIndexPage(model) {
  const body = `<section class="panel"><p class="eyebrow">CURATED ROUTES</p><h1>Reading trails</h1><p>Trails are editorial routes through the actual ontology. They are navigation aids, not new mechanics.</p></section><section aria-labelledby="trail-heading"><h2 id="trail-heading">Choose a route</h2>${renderTrailLinks(model)}</section>`;
  return renderShell({ model, title: "Reading trails", body, currentRoute: "TRAILS" });
}

export function renderTrailPage(model, trailId) {
  const trail = model.trails.find((entry) => entry.trailId === trailId);
  if (!trail) return renderNotFoundPage(model, trailId);
  const body = `<section class="panel"><p class="eyebrow">READING TRAIL</p><h1>${escapeHtml(trail.name)}</h1><p>${escapeHtml(trail.description)}</p></section><nav aria-label="Trail terms"><ol class="trail-list">${trail.keywordIds.map((keywordId, index) => `<li><span class="route-label">${index + 1}</span> <a href="${escapeHtml(keywordRoute(keywordId, model))}">${escapeHtml(model.articleById.get(keywordId)?.displayName ?? keywordId)}</a></li>`).join("")}</ol></nav><p><a href="${escapeHtml(model.routes.trailIndex)}">All reading trails</a></p>`;
  return renderShell({ model, title: trail.name, body, currentRoute: `TRAIL / ${trail.trailId}` });
}

export function renderNotFoundPage(model, attempted = "") {
  const body = `<section class="panel"><p class="eyebrow">NO FILED RECORD</p><h1>That route is not in the guide.</h1><p>${attempted ? `No canonical article matches <code>${escapeHtml(attempted)}</code>.` : "The requested route could not be resolved."}</p><p><a href="${escapeHtml(model.routes.home)}">Go to the index</a> or <a href="${escapeHtml(model.routes.search)}">search the terms</a>.</p></section>`;
  return renderShell({ model, title: "Not found", body, currentRoute: "404" });
}

export function renderStaticHost404(model) {
  const routeTargets = [
    { route: model.routes.home, file: `${model.routes.home}index.html` },
    { route: model.routes.search, file: `${model.routes.search}index.html` },
    { route: model.routes.random, file: `${model.routes.random}index.html` },
    { route: model.routes.map, file: `${model.routes.map}index.html` },
    { route: model.routes.trailIndex, file: `${model.routes.trailIndex}index.html` },
    ...model.articles.map((article) => ({ route: keywordRoute(article.keywordId, model), file: `${keywordRoute(article.keywordId, model)}index.html` })),
    ...model.trails.map((trail) => ({ route: trailRoute(trail.trailId, model), file: `${trailRoute(trail.trailId, model)}index.html` })),
  ];
  const payload = safeJson(routeTargets);
  const fallbackScript = `<script type="module">const routes=${payload};const clean=(value)=>value.replace(/\\/+$/, "/")||"/";const found=routes.find((entry)=>clean(location.pathname)===clean(entry.route));if(found){location.replace(found.file);}</script>`;
  return `<!doctype html><html lang="en"><head>${renderHead("Not found", model)}</head><body class="lorebook-site trapstar-field-guide"><main id="main-content"><section class="panel"><p class="eyebrow">STATIC HOST FALLBACK</p><h1>Route lookup</h1><p>JavaScript-enabled static hosts can redirect this path to its generated directory index. Without JavaScript, use the links below.</p><p><a href="${escapeHtml(model.routes.home)}">Open the index</a> · <a href="${escapeHtml(model.routes.search)}">Search</a></p></section></main>${fallbackScript}</body></html>`;
}

export function renderAllPages(model) {
  const pages = new Map();
  pages.set("index.html", renderIndexPage(model));
  pages.set("search/index.html", renderSearchPage(model));
  pages.set("random/index.html", renderRandomPage(model));
  pages.set("map/index.html", renderMapPage(model));
  pages.set("trails/index.html", renderTrailIndexPage(model));
  pages.set("404.html", renderStaticHost404(model));
  for (const article of model.articles) pages.set(`keywords/${article.keywordId}/index.html`, renderKeywordPage(model, article.keywordId));
  for (const trail of model.trails) pages.set(`trails/${trail.trailId}/index.html`, renderTrailPage(model, trail.trailId));
  return pages;
}

export function buildRouteManifest(model) {
  return {
    schemaVersion: LOREBOOK_SCHEMA_VERSION,
    routes: [
      { route: model.routes.home, kind: "index", file: "index.html" },
      { route: model.routes.search, kind: "search", file: "search/index.html" },
      { route: model.routes.random, kind: "random", file: "random/index.html" },
      { route: model.routes.map, kind: "map", file: "map/index.html" },
      { route: model.routes.trailIndex, kind: "trail-index", file: "trails/index.html" },
      ...model.articles.map((article) => ({ route: keywordRoute(article.keywordId, model), kind: "keyword", keywordId: article.keywordId, file: `keywords/${article.keywordId}/index.html` })),
      ...model.trails.map((trail) => ({ route: trailRoute(trail.trailId, model), kind: "trail", trailId: trail.trailId, file: `trails/${trail.trailId}/index.html` })),
    ],
  };
}

export function siteArchitectureAssumptions() {
  return Object.freeze({
    contentModule: "src/lorebook/content.mjs",
    illustrationModule: "src/lorebook/illustrations.mjs",
    contentMustDeclare: ["schemaVersion", "articles", "trails"],
    articleMustCover: [...ARTICLE_REQUIRED_FIELDS],
    illustrationMustProvide: ["svg", "alt", "description"],
    canonicalIdsSource: "src/keywords.mjs:KEYWORDS",
    relationshipSource: "authored article relationships plus optional typed canonical rule co-occurrence edges",
    staticRefreshStrategy: "directory index routes plus generated 404.html redirect for static hosts",
    runtimeDialogueBoundary: "The site renders documentation only; external evidence and TPL remain non-runtime.",
  });
}

export { escapeHtml, stableJson };
