import { KEYWORD_BY_ID, KEYWORD_IDS } from "../keywords.mjs";

/**
 * The Trapstar illustration grammar is deliberately small: two people, one
 * stake, and one directional relation. A keyword-specific mark makes the
 * stake legible without turning the picture into a second semantic model.
 */
export const ILLUSTRATION_VERSION = "trapstar-illustration@0.1";
export const ILLUSTRATION_VIEWBOX = "0 0 640 360";

export const ILLUSTRATION_PALETTE = Object.freeze({
  ink: "#24221f",
  paper: "#f4eddf",
  paperDeep: "#e2d5c0",
  red: "#a83b32",
  gold: "#b77a20",
  signal: "#476f7e",
  smoke: "#6f6a61",
  white: "#fffaf0",
});

const SVG_NS = "http://www.w3.org/2000/svg";
const DIRECTIONS = new Set(["forward", "reverse", "bidirectional"]);
const SYMBOL_SIZE = 54;

const KEYWORD_SYMBOLS = Object.freeze({
  OWNS: `
    <path d="M-22-3h27v25h-27zM-15-3v-8h13l7 8" />
    <circle cx="-10" cy="9" r="3" />
    <path d="M-4 9h9m-4 0v5m4-5v5" />
  `,
  OWES: `
    <rect x="-23" y="-23" width="31" height="43" rx="3" />
    <path d="M-16-13H1M-16-4H1M-16 5h8" />
    <circle cx="15" cy="10" r="10" />
    <path d="M15 3v14M19 6c-1-2-7-2-7 1 0 4 7 1 7 5 0 3-6 4-8 1" />
  `,
  NEEDS: `
    <path d="M-22-15h44v32h-44z" />
    <path d="M-22-7h44M-12-15v8M12-15v8" />
    <path d="M0-1v16M-8 7H8" />
  `,
  CONTROLS: `
    <path d="M-23 18h46M-16 18V4h32v14" />
    <path d="M0 4v-25" />
    <circle cx="0" cy="-24" r="6" />
    <path d="M-13-11h26" />
  `,
  PROMISED_TO: `
    <path d="M-22-5l8-8 12 12-8 8zM22 5l-8 8-12-12 8-8z" />
    <path d="M-11 4l4 4c3 3 7 3 10 0l8-8M11-4l-4-4c-3-3-7-3-10 0l-8 8" />
  `,
  PERMITTED: `
    <path d="M-25-14h50v29h-50z" />
    <path d="M-13-14v7M13-14v7M-13 8v7M13 8v7" />
    <path d="M-11 0l7 7L13-10" />
  `,
  PROHIBITED: `
    <rect x="-18" y="-5" width="36" height="25" rx="3" />
    <path d="M-11-5v-8a11 11 0 0 1 22 0v8M-25-24l50 48" />
    <circle cx="0" cy="7" r="3" />
  `,
  DEPENDS_ON: `
    <path d="M-22-14a8 8 0 0 1 11 0l5 5a8 8 0 0 1-11 11l-5-5" />
    <path d="M22 14a8 8 0 0 1-11 0l-5-5a8 8 0 0 1 11-11l5 5" />
    <path d="M-12 8L12-8" />
  `,
  KNOWS_SECRET_ABOUT: `
    <path d="M-25 0s9-15 25-15S25 0 25 0 16 15 0 15-25 0-25 0z" />
    <circle cx="0" cy="0" r="7" />
    <path d="M0-3v7M-3 1h6" />
  `,
  BELIEVES: `
    <path d="M-24-8a14 14 0 0 1 14-14h18a14 14 0 0 1 14 14v6a14 14 0 0 1-14 14H-1l-11 10 2-10h-1A14 14 0 0 1-24-2z" />
    <path d="M0-13l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
  `,
  TRUSTS: `
    <path d="M-27 14h54M-21 14V5l9-12 12 12 12-12 9 12v9" />
    <path d="M-12-7h24M0-7v21" />
    <path d="M-24-2h9M15-2h9" />
  `,
  FEARS: `
    <path d="M-25 0s9-14 25-14S25 0 25 0 16 14 0 14-25 0-25 0z" />
    <circle cx="0" cy="0" r="7" />
    <path d="M0-3v7M-3 1h6" />
    <path d="M21-21l7 7m0-7-7 7" />
  `,
  RESENTS: `
    <path d="M-23 19l12-24 6 10 8-22 7 18 12-6-10 24z" />
    <path d="M-10 3h5m4-8h5" />
  `,
  HAS_LEVERAGE_OVER: `
    <path d="M-27 17h54M-20-13h40M0-13v30" />
    <path d="M-20-13l-10 30h20zM20-13L10 17h20z" />
    <circle cx="0" cy="-13" r="5" />
  `,
});

for (const keywordId of KEYWORD_IDS) {
  if (!KEYWORD_SYMBOLS[keywordId]) {
    throw new Error(`MISSING_KEYWORD_ILLUSTRATION_SYMBOL:${keywordId}`);
  }
}

const nonEmptyText = (value, fallback) => {
  if (typeof value !== "string" || value.trim().length === 0) return fallback;
  return value.trim();
};

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const safeDomId = (value) => String(value)
  .trim()
  .toLowerCase()
  .replaceAll(/[^a-z0-9_-]+/g, "-")
  .replaceAll(/^-+|-+$/g, "") || "keyword";

const safeClassTokens = (value) => String(value ?? "")
  .split(/\s+/u)
  .map((token) => token.trim())
  .filter((token) => /^[a-z][a-z0-9_-]*$/u.test(token));

const relationToken = (value) => String(value)
  .trim()
  .toLowerCase()
  .replaceAll("_", "-")
  .replaceAll(/[^a-z0-9-]+/g, "-")
  .replaceAll(/^-+|-+$/g, "") || "co-occurs-with";

const textLabel = (value, fallback) => escapeXml(nonEmptyText(value, fallback));

const directionLabel = (direction) => ({
  forward: "ACTOR -> TARGET",
  reverse: "TARGET -> ACTOR",
  bidirectional: "ACTOR <-> TARGET",
}[direction]);

const symbolFor = (keywordId) => {
  if (!KEYWORD_BY_ID.has(keywordId)) throw new Error(`UNKNOWN_KEYWORD_ILLUSTRATION:${keywordId}`);
  return KEYWORD_SYMBOLS[keywordId];
};

/**
 * Return the stable, content-facing description of an illustration. The
 * caller can override labels for a specific scenario without changing the
 * underlying keyword or inventing a new visual grammar.
 */
export function getKeywordIllustrationSpec(keywordId, options = {}) {
  const keyword = KEYWORD_BY_ID.get(keywordId);
  if (!keyword) throw new Error(`UNKNOWN_KEYWORD_ILLUSTRATION:${keywordId}`);

  const direction = options.direction ?? "forward";
  if (!DIRECTIONS.has(direction)) throw new Error(`INVALID_ILLUSTRATION_DIRECTION:${direction}`);

  const displayName = nonEmptyText(options.displayName, keyword.displayName);
  const actorLabel = nonEmptyText(options.actorLabel, "ACTOR");
  const targetLabel = nonEmptyText(options.targetLabel, "TARGET");
  const stakeLabel = nonEmptyText(options.stakeLabel, displayName);
  const relationshipType = nonEmptyText(options.relationshipType, keywordId);
  const transitionLabel = nonEmptyText(options.transitionLabel, "AUTHORED RELATION");
  const stateLabel = nonEmptyText(options.stateLabel, "FACT / STATE");
  const description = nonEmptyText(
    options.description,
    `${displayName}: ${actorLabel} and ${targetLabel} are connected by the ${stakeLabel} stake.`,
  );

  return Object.freeze({
    keywordId,
    displayName,
    actorLabel,
    targetLabel,
    stakeLabel,
    relationshipType,
    transitionLabel,
    stateLabel,
    description,
    direction,
    symbol: symbolFor(keywordId),
  });
}

const renderNode = ({ role, label, x }) => `
    <g class="tf-node tf-node--${role}" data-node-role="${role}" transform="translate(${x} 220)">
      <circle class="tf-node__body" r="42" />
      <circle class="tf-node__core" r="8" />
      <path class="tf-node__axis" d="M0-24v48M-24 0h48" />
      <text class="tf-node__role" x="0" y="61" text-anchor="middle">${textLabel(label, role.toUpperCase())}</text>
    </g>`;

const renderStake = (spec) => `
    <g class="tf-stake" data-stake-keyword="${escapeXml(spec.keywordId)}" transform="translate(320 101)">
      <rect class="tf-stake__body" x="-105" y="-42" width="210" height="84" rx="9" />
      <path class="tf-stake__rule" d="M-91 23H91" />
      <g class="tf-keyword-symbol" aria-hidden="true" transform="scale(${SYMBOL_SIZE / 54})">
        ${spec.symbol}
      </g>
      <text class="tf-stake__label" x="0" y="-51" text-anchor="middle">STAKE // ${textLabel(spec.stakeLabel, spec.displayName)}</text>
      <text class="tf-stake__keyword" x="0" y="30" text-anchor="middle">${textLabel(spec.displayName, spec.keywordId)}</text>
    </g>`;

const renderEdge = (spec) => {
  const markerAttributes = spec.direction === "forward"
    ? `marker-end="url(#${safeDomId(spec.keywordId)}-arrow)"`
    : spec.direction === "reverse"
      ? `marker-start="url(#${safeDomId(spec.keywordId)}-arrow)"`
      : `marker-start="url(#${safeDomId(spec.keywordId)}-arrow)" marker-end="url(#${safeDomId(spec.keywordId)}-arrow)"`;
  return `
    <g class="tf-relation" data-direction="${escapeXml(spec.direction)}" data-relation="${relationToken(spec.relationshipType)}">
      <path class="tf-edge tf-edge--${escapeXml(spec.direction)}" d="M132 220H508" ${markerAttributes} />
      <text class="tf-edge__label" x="320" y="184" text-anchor="middle">${textLabel(spec.transitionLabel, "AUTHORED RELATION")}</text>
      <text class="tf-edge__direction" x="320" y="205" text-anchor="middle">${directionLabel(spec.direction)}</text>
    </g>`;
};

/**
 * Render the shared Trapstar SVG grammar for a canonical keyword.
 *
 * The function accepts either `(keywordId, options)` or one object containing
 * `keywordId` and the options. The returned SVG is self-contained and uses
 * only repository-authored paths and CSS classes.
 */
export function renderKeywordIllustration(keywordIdOrOptions, options = {}) {
  const input = typeof keywordIdOrOptions === "string"
    ? { ...options, keywordId: keywordIdOrOptions }
    : { ...(keywordIdOrOptions ?? {}) };
  const spec = getKeywordIllustrationSpec(input.keywordId, input);
  const baseId = safeDomId(input.id ?? `${spec.keywordId}-${spec.direction}`);
  const extraClasses = safeClassTokens(input.className);
  const classes = ["tf-illustration", `tf-illustration--${safeDomId(spec.keywordId)}`, ...extraClasses].join(" ");
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const markerId = `${baseId}-arrow`;

  return `<svg xmlns="${SVG_NS}" class="${classes}" data-illustration-version="${ILLUSTRATION_VERSION}" data-keyword-id="${escapeXml(spec.keywordId)}" data-direction="${escapeXml(spec.direction)}" viewBox="${ILLUSTRATION_VIEWBOX}" role="img" aria-labelledby="${titleId} ${descriptionId}">
  <title id="${titleId}">${textLabel(spec.displayName, spec.keywordId)} — human logic relation</title>
  <desc id="${descriptionId}">${textLabel(spec.description, `${spec.displayName} relation illustration.`)}</desc>
  <defs>
    <marker id="${markerId}" class="tf-arrowhead" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto-start-reverse" markerUnits="strokeWidth">
      <path class="tf-arrowhead__shape" d="M0 0L9 4.5L0 9z" />
    </marker>
  </defs>
  <rect class="tf-illustration__backdrop" x="8" y="8" width="624" height="344" rx="12" />
  <path class="tf-illustration__registration" d="M28 28h18M28 28v18M612 28h-18M612 28v18M28 332h18M28 332v-18M612 332h-18M612 332v-18" />
  <text class="tf-illustration__kicker" x="30" y="48">TRAPSTAR FIELD NOTE // ${textLabel(spec.keywordId, "KEYWORD")}</text>
  ${renderStake(spec)}
  ${renderEdge(spec)}
  ${renderNode({ role: "actor", label: spec.actorLabel, x: 90 })}
  ${renderNode({ role: "target", label: spec.targetLabel, x: 550 })}
  <text class="tf-state-label" x="320" y="315" text-anchor="middle">STATE // ${textLabel(spec.stateLabel, "FACT / STATE")}</text>
</svg>`;
}

export const KEYWORD_ILLUSTRATION_SYMBOLS = KEYWORD_SYMBOLS;

const illustrationEntry = (keywordId) => {
  const spec = getKeywordIllustrationSpec(keywordId);
  const alt = `Diagram of ${spec.displayName}: an actor, a target, and the ${spec.displayName.toLowerCase()} stake are joined by a directional relation.`;
  return Object.freeze({
    illustrationId: `ILLUSTRATION_${keywordId}`,
    svg: renderKeywordIllustration(keywordId, {
      id: `illustration-${keywordId}`,
      description: alt,
    }),
    alt,
    altText: alt,
    description: alt,
  });
};

/**
 * A ready-to-consume map for static builders. It is generated from the same
 * renderer as ad-hoc scenario illustrations, so every canonical term keeps
 * the same viewBox, nodes, stake, edge, symbol, title, and description.
 */
export const ILLUSTRATIONS = Object.freeze(Object.fromEntries(
  KEYWORD_IDS.map((keywordId) => [keywordId, illustrationEntry(keywordId)]),
));

export const illustrations = ILLUSTRATIONS;
