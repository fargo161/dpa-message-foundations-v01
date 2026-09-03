import { readFile } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { KEYWORD_IDS, KEYWORDS } from "../src/keywords.mjs";
import { ACTION_BY_ID } from "../src/mechanics.mjs";
import { LOREBOOK_CONTENT, LOREBOOK_CONTENT_ERRORS } from "../src/lorebook/content.mjs";
import { renderKeywordIllustration, ILLUSTRATION_VIEWBOX } from "../src/lorebook/illustrations.mjs";
import {
  buildLorebookModel,
  buildRouteManifest,
  keywordRoute,
  renderAllPages,
  searchLorebook,
  validateLorebookModel,
} from "../src/lorebook/site.mjs";

const contentModule = { LOREBOOK_CONTENT };
const illustrationsModule = await import("../src/lorebook/illustrations.mjs");

function model() {
  return buildLorebookModel({ content: contentModule, illustrations: illustrationsModule });
}

test("lorebook has exactly one substantive article for every canonical keyword", () => {
  assert.deepEqual(LOREBOOK_CONTENT.articles.map((article) => article.keywordId), KEYWORD_IDS);
  assert.equal(LOREBOOK_CONTENT.articles.length, KEYWORDS.length);
  assert.deepEqual(LOREBOOK_CONTENT_ERRORS, []);
  const current = model();
  assert.deepEqual(validateLorebookModel(current), []);
  for (const article of current.articles) {
    for (const field of ["streetDefinition", "technicalDefinition", "whatThisChanges", "mechanics", "examples", "scenario", "confusedWith", "evidence", "satiricalNote"]) {
      assert.ok(article[field], `${article.keywordId} must have ${field}`);
    }
  }
});

test("relationship edges, backlinks, trails, and routes are closed over canonical IDs", () => {
  const current = model();
  const routeManifest = buildRouteManifest(current);
  const routeSet = new Set(routeManifest.routes.map((route) => route.route));
  assert.equal(current.trails.length >= 3, true);
  for (const article of current.articles) {
    assert.ok(routeSet.has(keywordRoute(article.keywordId, current)));
    for (const edge of current.relationships.filter((entry) => entry.sourceId === article.keywordId)) {
      assert.ok(current.articleById.has(edge.targetId));
      assert.ok(current.backlinks.get(edge.targetId).some((incoming) => incoming.sourceId === article.keywordId && incoming.type === edge.type));
    }
  }
  for (const [targetId, incoming] of current.backlinks) {
    for (const edge of incoming) assert.ok(current.relationships.some((candidate) => candidate.sourceId === edge.sourceId && candidate.targetId === targetId && candidate.type === edge.type));
  }
  assert.equal(new Set(routeManifest.routes.map((route) => route.route)).size, routeManifest.routes.length);
});

test("each article uses the shared accessible illustration grammar", () => {
  const current = model();
  for (const article of current.articles) {
    const svg = article.illustration.svg;
    assert.match(svg, /^<svg\b/);
    assert.match(svg, /<title\b[^>]*>[^<]+<\/title>/);
    assert.match(svg, /<desc\b[^>]*>[^<]+<\/desc>/);
    assert.match(svg, new RegExp(`viewBox="${ILLUSTRATION_VIEWBOX.replaceAll(" ", "\\s+")}"`));
    assert.match(svg, /data-node-role="actor"/);
    assert.match(svg, /data-node-role="target"/);
    assert.match(svg, /data-stake-keyword=/);
    assert.match(svg, /data-direction=/);
    assert.ok(article.illustration.alt.trim());
  }
  assert.equal(renderKeywordIllustration("OWNS").includes("<script"), false);
  assert.throws(() => renderKeywordIllustration("NOT_CANONICAL"), /UNKNOWN_KEYWORD_ILLUSTRATION/);
});

test("rendered pages remain useful without JavaScript and use stable internal links", () => {
  const current = model();
  const pages = renderAllPages(current);
  assert.equal(pages.size, 23);
  const articlePage = pages.get("keywords/OWES/index.html");
  assert.ok(articlePage.includes("<h1>Owes</h1>"));
  assert.ok(articlePage.includes("Marginal note / commentary:"));
  assert.ok(articlePage.includes("href=\"/keywords/NEEDS/\""));
  assert.ok(articlePage.includes("<svg"));
  assert.ok(articlePage.includes("prefers-reduced-motion"));
  assert.match(pages.get("map/index.html"), /CO_OCCURS_WITH/);
  assert.match(pages.get("map/index.html"), /navigation-only co-occurrence link/);
  const withoutScripts = articlePage.replaceAll(/<script\b[\s\S]*?<\/script>/gi, "");
  assert.ok(withoutScripts.includes("<h1>Owes</h1>"));
  assert.ok(withoutScripts.includes("Technical definition"));
  for (const html of pages.values()) {
    for (const href of html.matchAll(/href="(\/[^"#?]*)/g)) {
      const route = href[1].replace(/\/$/, "") || "/";
      assert.ok(route === "/" || route.startsWith("/keywords/") || route.startsWith("/search") || route.startsWith("/random") || route.startsWith("/map") || route.startsWith("/trails"), `unexpected internal route ${route}`);
    }
  }
});

test("search reaches canonical names, roles, relationships, actions, and mechanics", () => {
  const current = model();
  assert.ok(searchLorebook(current, "leverage").some((article) => article.keywordId === "HAS_LEVERAGE_OVER"));
  assert.ok(searchLorebook(current, "DEBTOR").some((article) => article.keywordId === "OWES"));
  assert.ok(searchLorebook(current, "REQUEST_EXTENSION").some((article) => article.keywordId === "OWES"));
  assert.ok(searchLorebook(current, "blockers").length > 0);
  assert.ok(searchLorebook(current, "knowledge").some((article) => article.keywordId === "KNOWS_SECRET_ABOUT"));
  assert.equal(searchLorebook(current, "not-a-real-term").length, 0);
  for (const article of current.articles) for (const action of article.actions) assert.ok(ACTION_BY_ID.has(action.actionId));
});

test("evidence is visibly typed and cannot become runtime content", () => {
  const current = model();
  for (const article of current.articles) {
    for (const entry of article.evidence) {
      assert.ok(entry.status);
      assert.equal(entry.runtimeEligible, false);
      assert.ok(entry.sourceId);
      assert.ok(entry.licenseId);
      assert.ok(entry.redistributionPolicy);
    }
    assert.equal(article.satiricalNote, article.satiricalNote.trim());
  }
  assert.equal(LOREBOOK_CONTENT.includeCanonicalRuleEdges, true);
  assert.match(LOREBOOK_CONTENT.site.description, /authored human-logic mechanics/);
});

test("content validation catches dead relationship targets and duplicate article IDs", () => {
  const invalid = {
    ...LOREBOOK_CONTENT,
    articles: [...LOREBOOK_CONTENT.articles.slice(0, -1), { ...LOREBOOK_CONTENT.articles[0], keywordId: "OWES" }],
  };
  const invalidModel = buildLorebookModel({ content: invalid, illustrations: illustrationsModule });
  const errors = validateLorebookModel(invalidModel);
  assert.ok(errors.includes("duplicate_article_id"));
  assert.ok(errors.some((error) => error.startsWith("missing_article:")));
  const deadEdge = {
    ...LOREBOOK_CONTENT,
    articles: LOREBOOK_CONTENT.articles.map((article) => article.keywordId === "OWNS"
      ? { ...article, relationships: [...article.relationships, { targetId: "PHANTOM", type: "CO_OCCURS_WITH" }] }
      : article),
  };
  const deadModel = buildLorebookModel({ content: deadEdge, illustrations: illustrationsModule });
  assert.ok(validateLorebookModel(deadModel).some((error) => error.includes("unknown_relationship_target")));
});

test("model validation catches relationship drift and evidence-boundary mutations", () => {
  const current = model();
  const relationship = current.articles.find((article) => article.keywordId === "OWNS").relationships[0];
  const originalTarget = relationship.targetId;
  relationship.targetId = "NEEDS";
  assert.ok(validateLorebookModel(current).some((error) => error.startsWith("relationship_integrity_mismatch:OWNS:")));
  relationship.targetId = originalTarget;
  const directedEdge = current.articles.find((article) => article.keywordId === "HAS_LEVERAGE_OVER").relationships.find((edge) => edge.type === "DEPENDS_ON");
  const originalDirection = directedEdge.direction;
  directedEdge.direction = "BIDIRECTIONAL_BY_EXPLICIT_RULE";
  assert.ok(validateLorebookModel(current).some((error) => error.startsWith("relationship_direction:HAS_LEVERAGE_OVER:")));
  directedEdge.direction = originalDirection;
  const evidenceEntry = current.articles[0].evidence[0];
  const originalRuntime = evidenceEntry.runtimeEligible;
  evidenceEntry.runtimeEligible = true;
  assert.ok(validateLorebookModel(current).some((error) => error.startsWith("evidence_runtime_eligible:OWNS:")));
  evidenceEntry.runtimeEligible = originalRuntime;
  const originalStatus = evidenceEntry.status;
  evidenceEntry.status = "ACQUIRED_AND_INDEXED";
  assert.ok(validateLorebookModel(current).some((error) => error.startsWith("evidence_status_mismatch:OWNS:")));
  evidenceEntry.status = originalStatus;
  assert.deepEqual(validateLorebookModel(current), []);
});

test("two model builds and route manifests are byte-stable", async () => {
  const first = model();
  const second = model();
  const firstPages = [...renderAllPages(first).entries()];
  const secondPages = [...renderAllPages(second).entries()];
  assert.deepEqual(firstPages, secondPages);
  assert.deepEqual(buildRouteManifest(first), buildRouteManifest(second));
  const css = await readFile(new URL("../src/lorebook/lorebook.css", import.meta.url), "utf8");
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /max-width: 44rem/);
  assert.match(css, /data-relation/);
  const temp = await mkdtemp(join(tmpdir(), "trapstar-test-"));
  await rm(temp, { recursive: true, force: true });
});
