import test from "node:test";
import assert from "node:assert/strict";
import { BASED_VIBES, DELIVERY_INTENSITIES } from "../src/based.mjs";
import {
  DELIVERY_PREFERENCE_KEY, emptyDeliveryPreferences, normalizeDeliveryPreferences,
  deliveryShortcuts, recordCommittedDelivery, resetDeliveryPreferences,
  readDeliveryPreferences, writeDeliveryPreferences,
} from "../src/conversation/delivery-options.mjs";

const ids = BASED_VIBES.map((vibe) => vibe.vibeId);
const record = (preferences, vibeId, index, action = "ASK", runId = "run-a") => recordCommittedDelivery(preferences, { runId, index, action, vibeId }, ids);

test("delivery covers the canonical 20 ordered vibes and three intensities without changing canonical data", () => {
  assert.equal(ids.length, 20);
  assert.equal(new Set(ids).size, 20);
  assert.deepEqual(DELIVERY_INTENSITIES, ["SUBTLE", "BALANCED", "OVERT"]);
  let preferences = emptyDeliveryPreferences();
  for (const [index, id] of ids.entries()) preferences = record(preferences, id, index);
  assert.equal(Object.keys(preferences.usage).length, 20);
  assert.ok(ids.every((id) => preferences.usage[id].count === 1));
  assert.equal(BASED_VIBES.find((vibe) => vibe.vibeId === "EA").name, "Boundaried");
});

test("cold and partial history distinguish starters from actual use without duplicates", () => {
  const cold = deliveryShortcuts(emptyDeliveryPreferences(), ids);
  assert.deepEqual(cold.map((entry) => entry.vibeId), ["EA", "SA", "AE"]);
  assert.ok(cold.every((entry) => entry.source === "STARTER" && entry.count === 0));
  const partial = deliveryShortcuts(record(emptyDeliveryPreferences(), "SA", 0), ids);
  assert.deepEqual(partial.map((entry) => entry.vibeId), ["SA", "EA", "AE"]);
  assert.deepEqual(partial.map((entry) => entry.source), ["USED", "STARTER", "STARTER"]);
  assert.equal(new Set(partial.map((entry) => entry.vibeId)).size, 3);
});

test("recent and frequency ordering diverge correctly with deterministic latest-use ties", () => {
  let preferences = emptyDeliveryPreferences();
  for (const [index, id] of ["EA", "EA", "EA", "SA", "SA", "AE", "EB"].entries()) preferences = record(preferences, id, index);
  assert.deepEqual(deliveryShortcuts(preferences, ids, "RECENT").map((entry) => entry.vibeId), ["EB", "AE", "SA"]);
  assert.deepEqual(deliveryShortcuts(preferences, ids, "FREQUENT").map((entry) => entry.vibeId), ["EA", "SA", "EB"]);
  const tied = normalizeDeliveryPreferences({ version: 1, usage: { EA: { count: 2, last: 4 }, SA: { count: 2, last: 4 } } }, ids);
  assert.deepEqual(deliveryShortcuts(tied, ids, "FREQUENT").slice(0, 2).map((entry) => entry.vibeId), ["SA", "EA"]);
});

test("only committed speaking notifications count and duplicate/replayed positions cannot inflate usage", () => {
  const original = emptyDeliveryPreferences();
  const first = record(original, "EA", 1, "DEAL");
  assert.deepEqual(original, emptyDeliveryPreferences());
  for (const action of ["ACCEPT", "WALK", "PRESSURE", "PREVIEW", "HOVER", "REJECTED"])
    assert.deepEqual(record(first, "SA", 2, action), first);
  assert.deepEqual(record(first, "SA", 1), first);
  assert.deepEqual(record(first, "SA", 0), first);
  assert.deepEqual(record(first, "UNKNOWN", 2), first);
  assert.deepEqual(record(first, "SA", -1), first);
  const secondRun = record(first, "EA", 1, "ASK", "run-b");
  assert.equal(secondRun.usage.EA.count, 2);
  assert.equal(secondRun.sequence, 2);
});

test("serialized preferences preserve replay identity and reset retains it without fabricated history", () => {
  const map = new Map();
  const storage = { getItem: (key) => map.get(key), setItem: (key, value) => map.set(key, value) };
  const used = record(emptyDeliveryPreferences(), "EA", 4);
  assert.equal(writeDeliveryPreferences(storage, used), true);
  assert.ok(map.has(DELIVERY_PREFERENCE_KEY));
  const restored = readDeliveryPreferences(storage, ids);
  assert.deepEqual(restored, used);
  assert.deepEqual(record(restored, "EA", 4), used);
  const reset = resetDeliveryPreferences(restored, ids);
  assert.deepEqual(reset.usage, {});
  assert.equal(reset.mode, "RECENT");
  assert.deepEqual(record(reset, "EA", 4), reset);
  assert.equal(record(reset, "SA", 5).usage.SA.count, 1);
  assert.ok(deliveryShortcuts(reset, ids).every((entry) => entry.source === "STARTER"));
});

test("storage failure, corrupt versions and malicious preference keys do not block or pollute the game", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("full"); } };
  assert.deepEqual(readDeliveryPreferences(blocked, ids), emptyDeliveryPreferences());
  assert.equal(writeDeliveryPreferences(blocked, emptyDeliveryPreferences()), false);
  assert.equal(writeDeliveryPreferences(null, emptyDeliveryPreferences()), false);
  assert.deepEqual(readDeliveryPreferences({ getItem: () => "{" }, ids), emptyDeliveryPreferences());
  assert.deepEqual(normalizeDeliveryPreferences({ version: 2, usage: { EA: { count: 99, last: 10 } } }, ids), emptyDeliveryPreferences());
  const hostile = JSON.parse('{"version":1,"mode":"SECRET","usage":{"EA":{"count":-1,"last":4},"SA":{"count":2,"last":2},"BOGUS":{"count":100,"last":100}},"runs":{"__proto__":5,"constructor":6,"run-a":2}}');
  const normalized = normalizeDeliveryPreferences(hostile, ids);
  assert.deepEqual(normalized.usage, { SA: { count: 2, last: 2 } });
  assert.deepEqual(normalized.runs, { "run-a": 2 });
  assert.equal(normalized.mode, "RECENT");
  assert.equal({}.polluted, undefined);
  const inMemory = record(readDeliveryPreferences(blocked, ids), "EA", 0);
  assert.equal(inMemory.usage.EA.count, 1);
});
