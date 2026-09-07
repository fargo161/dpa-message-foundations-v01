// Browser-safe convenience data only. This module never owns conversation state.
export const DELIVERY_PREFERENCE_KEY = "trapstar.delivery-preferences.v1";
export const STARTER_VIBES = Object.freeze(["EA", "SA", "AE"]);

export function emptyDeliveryPreferences() {
  return { version: 1, mode: "RECENT", sequence: 0, usage: {}, runs: {} };
}

export function normalizeDeliveryPreferences(value, allowedIds) {
  const result = emptyDeliveryPreferences();
  if (!value || value.version !== 1) return result;
  result.mode = value.mode === "FREQUENT" ? "FREQUENT" : "RECENT";
  for (const id of allowedIds) {
    const entry = value.usage?.[id];
    if (entry && Number.isSafeInteger(entry.count) && entry.count > 0 && Number.isSafeInteger(entry.last) && entry.last > 0) {
      result.usage[id] = { count: entry.count, last: entry.last };
      result.sequence = Math.max(result.sequence, entry.last);
    }
  }
  if (Number.isSafeInteger(value.sequence) && value.sequence >= result.sequence) result.sequence = value.sequence;
  for (const [runId, index] of Object.entries(value.runs ?? {})) {
    if (validRunId(runId) && Number.isSafeInteger(index) && index >= 0) {
      Object.defineProperty(result.runs, runId, { value: index, enumerable: true, writable: true, configurable: true });
    }
  }
  return result;
}

function validRunId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 200 && !["__proto__", "constructor", "prototype"].includes(value);
}

/** Notify in committed event order; a per-run high-water mark rejects replay. */
export function recordCommittedDelivery(preferences, turn, allowedIds) {
  const next = normalizeDeliveryPreferences(preferences, allowedIds);
  if (!turn || !["ASK", "DEAL"].includes(turn.action) || !allowedIds.includes(turn.vibeId)
    || !validRunId(turn.runId) || !Number.isSafeInteger(turn.index) || turn.index < 0) return next;
  if (Object.hasOwn(next.runs, turn.runId) && next.runs[turn.runId] >= turn.index) return next;
  if (next.sequence >= Number.MAX_SAFE_INTEGER || (next.usage[turn.vibeId]?.count ?? 0) >= Number.MAX_SAFE_INTEGER) return next;
  next.sequence += 1;
  next.usage[turn.vibeId] = { count: (next.usage[turn.vibeId]?.count ?? 0) + 1, last: next.sequence };
  next.runs[turn.runId] = turn.index;
  return next;
}

export function deliveryShortcuts(preferences, allowedIds, mode = preferences.mode) {
  const safe = normalizeDeliveryPreferences(preferences, allowedIds);
  const used = allowedIds.filter((id) => safe.usage[id]);
  used.sort((a, b) => {
    const frequency = mode === "FREQUENT" ? safe.usage[b].count - safe.usage[a].count : 0;
    return frequency || safe.usage[b].last - safe.usage[a].last || allowedIds.indexOf(a) - allowedIds.indexOf(b);
  });
  const entries = used.slice(0, 3).map((vibeId) => ({ vibeId, source: "USED", count: safe.usage[vibeId].count }));
  for (const vibeId of STARTER_VIBES) {
    if (entries.length < 3 && allowedIds.includes(vibeId) && !entries.some((entry) => entry.vibeId === vibeId)) {
      entries.push({ vibeId, source: "STARTER", count: 0 });
    }
  }
  return entries;
}

// Keep replay cursors on reset: old transcript events must not refill the bank.
export function resetDeliveryPreferences(preferences, allowedIds) {
  return { ...emptyDeliveryPreferences(), runs: normalizeDeliveryPreferences(preferences, allowedIds).runs };
}

export function readDeliveryPreferences(storage, allowedIds) {
  try {
    return normalizeDeliveryPreferences(JSON.parse(storage?.getItem(DELIVERY_PREFERENCE_KEY) ?? "null"), allowedIds);
  } catch { return emptyDeliveryPreferences(); }
}

export function writeDeliveryPreferences(storage, preferences) {
  try {
    if (!storage) return false;
    storage.setItem(DELIVERY_PREFERENCE_KEY, JSON.stringify(preferences));
    return true;
  } catch { return false; }
}
