import { FACE_CATALOG } from "./catalog.mjs";
import { FACE_PRESETS, FACE_SLOTS } from "./presets.mjs";

/** Validate absolute target identity before using a prior snapshot for continuity. */
export function validateSnapshot(snapshot) {
  const preset = FACE_PRESETS[snapshot?.presetId];
  if (!preset || snapshot.catalogVersion !== FACE_CATALOG.version || !Array.isArray(snapshot.slots)
      || snapshot.slots.length !== FACE_SLOTS.length) throw new Error("Invalid face snapshot.");
  for (const [index, slot] of FACE_SLOTS.entries()) {
    const operation = snapshot.slots[index];
    if (operation.slot !== slot || operation.assetId !== preset.targets[slot]) throw new Error("Invalid anatomical face target.");
    for (const assetId of [operation.assetId, operation.fromAssetId]) {
      if (assetId !== null && !FACE_CATALOG.assets.some(asset => asset.assetId === assetId && asset.slot === slot)) {
        throw new Error("Unknown or wrong-slot face asset.");
      }
    }
    if (operation.operation !== (operation.assetId === operation.fromAssetId ? "HOLD" : "CHANGE")) {
      throw new Error("Invalid face operation.");
    }
  }
  return snapshot;
}

/** Absolute targets make replay independent of browser animation timing. */
export function faceTransition(presetId, previous = null) {
  const target = FACE_PRESETS[presetId];
  if (!target) throw new Error("Unknown face preset.");
  if (previous) validateSnapshot(previous);
  return {
    catalogVersion: FACE_CATALOG.version,
    presetId,
    slots: FACE_SLOTS.map((slot, index) => {
      const fromAssetId = previous ? previous.slots[index].assetId : null;
      const assetId = target.targets[slot];
      return { slot, assetId, fromAssetId, operation: fromAssetId === assetId ? "HOLD" : "CHANGE" };
    }),
    visibleCaption: target.visibleCaption,
  };
}
