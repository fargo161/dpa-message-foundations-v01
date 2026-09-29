import { detached } from "./event-contract.mjs";

/** Generic authoring helper. Marcus retains its pre-existing information and quirk hashes. */
export function selectOpenTruth(seed, definition, resolved = {}) {
  const fail = message => { throw new Error(`WORLD_OPEN_TRUTH:${message}`); };
  if (!definition || typeof definition.openTruthId !== "string" || !definition.openTruthId || typeof definition.salt !== "string" || !Array.isArray(definition.variants) || definition.variants.length < 2) fail("definition");
  if (Object.hasOwn(resolved, definition.openTruthId)) fail("already resolved");
  if (definition.when) {
    const { openTruthId, variantId } = definition.when;
    if (!Object.hasOwn(resolved, openTruthId)) fail("unresolved dependency");
    const dependency = typeof resolved[openTruthId] === "string" ? resolved[openTruthId] : resolved[openTruthId]?.variantId;
    if (dependency !== variantId) return null;
  }
  if (definition.variants.some(variant => typeof variant.variantId !== "string" || !variant.variantId || !Array.isArray(variant.events)) || new Set(definition.variants.map(variant => variant.variantId)).size !== definition.variants.length) fail("variants");
  let hash = 2166136261;
  for (const character of `${definition.salt}${String(seed)}`) hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  const selected = detached(definition.variants[hash % definition.variants.length]);
  return { openTruthId: definition.openTruthId, variantId: selected.variantId, events: selected.events.map(event => ({ ...event, provenance: { kind: "SEED", sourceRef: `${definition.openTruthId}:${selected.variantId}` } })) };
}
