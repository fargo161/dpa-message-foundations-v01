/** Authored discourse atoms: presentation only; no promises, deadlines, threats or knowledge claims. */
export const DELIVERY_RECIPES = Object.freeze({
  BA: ["Look", "Well"], BS: ["So", "Well"], BE: ["Well", "Look"], BD: ["Well", "So"],
  AB: ["Look", "So"], AS: ["All right", "Okay"], AE: ["Okay", "All right"], AD: ["So", "Okay"],
  SB: ["Well", "So"], SA: ["All right", "Well"], SE: ["Well", "Okay"], SD: ["So", "Well"],
  EB: ["All right", "Okay"], EA: ["Okay", "All right"], ES: ["Well", "All right"], ED: ["Well", "So"],
  DB: ["So", "Well"], DA: ["Well", "So"], DS: ["So", "Well"], DE: ["Well", "Okay"],
});

// These coordinates deliberately avoid inventing the leverage, lie, deadline or
// personal judgment that a more specific realization of the vibe could imply.
export const CONTEXT_NEUTRAL_VIBES = Object.freeze(["BA", "BS", "BE", "BD", "AB", "AD", "DB", "DA", "DS", "DE"]);

export function deterministicVariant(seed, count = 2) {
  if (typeof seed === "number" && Number.isSafeInteger(seed)) return ((seed % count) + count) % count;
  const turnIndex = typeof seed === "string" ? seed.match(/:(\d+)$/)?.[1] : undefined;
  if (turnIndex !== undefined && Number.isSafeInteger(Number(turnIndex))) return Number(turnIndex) % count;
  let hash = 2166136261;
  for (const character of String(seed ?? 0)) hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  return hash % count;
}

export function presentPlayerText(core, vibeId, intensity, variant) {
  const atom = DELIVERY_RECIPES[vibeId][variant];
  // Lead cue sets the opening beat; second cue sets the pause before the
  // unchanged sentence. These are written signals, never an extra claim.
  // Context-neutral coordinates remain explicitly marked by the realizer.
  const lead = vibeId[0];
  const follow = vibeId[1];
  const balancedPause = { B: ". ", A: "—", S: ", ", E: "… ", D: "…\n" }[follow];
  if (intensity === "SUBTLE") return `${atom.toLowerCase()}. ${core}`;
  const opening = lead === "A" ? `${atom}.` : lead === "E" ? `${atom}…` : atom;
  if (intensity === "BALANCED") return `${opening}${lead === "A" || lead === "E" ? " " : balancedPause}${core}`;
  // Preserve every semantic character, including numbers and authored qualifiers.
  // The pause and paragraph boundary intensify presentation, never conditions.
  const overtBeat = lead === "A" ? "!" : lead === "E" || lead === "D" ? "…" : "—";
  return `${atom.toUpperCase()}${overtBeat}\n${core}`;
}
