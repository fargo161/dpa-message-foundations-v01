import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { FACE_CATALOG } from "../src/conversation/face/catalog.mjs";
import { FACE_PRESETS, FACE_SLOTS, FACE_LAYER_ORDER, SAFE_EYES } from "../src/conversation/face/presets.mjs";
import { openingFace, buildFaceTurn } from "../src/conversation/face/policy.mjs";
import { faceTransition, validateSnapshot } from "../src/conversation/face/transitions.mjs";
import { createState } from "../src/encounter/state.mjs";
import { transition } from "../src/encounter/engine.mjs";

const event = (patch = {}) => ({ intent: { action: "ASK", topic: "DEBT", vibeId: "EA", intensity: "BALANCED" }, outcome: "ANSWER",
  deltas: { confidence: 2, tension: -1 }, reactionCause: { turnRef: { runId: "face-unit", index: 1 },
    continuity: { status: "OPEN", currentOffer: null }, consequences: { transfersCommitted: false } }, ...patch });

test("face pack is actual supplied bytes; runtime eyes are centered G13 only", () => {
  const provenance = JSON.parse(readFileSync(new URL("../src/conversation/face/source-provenance.json", import.meta.url), "utf8"));
  assert.equal(provenance.sourceAssetCount, 76);
  assert.equal(new Set(FACE_CATALOG.assets.map(a => a.assetId)).size, FACE_CATALOG.assets.length);
  for (const asset of FACE_CATALOG.assets) {
    const source = provenance.assets.find(a => a.id === asset.assetId);
    const bytes = readFileSync(new URL(`../public/encounter${asset.src}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), source.sha256);
    assert.equal(bytes.subarray(0, 4).toString(), "RIFF");
    assert.equal(bytes.subarray(8, 12).toString(), "WEBP");
    assert.equal(source.slot, asset.slot);
    assert.ok(source.included);
    assert.ok(asset.x >= 0 && asset.y >= 0 && asset.x + asset.width <= FACE_CATALOG.canvas.width && asset.y + asset.height <= FACE_CATALOG.canvas.height);
    if (asset.slot.endsWith("eye")) assert.equal(asset.assetId, SAFE_EYES[asset.slot]);
  }
  assert.deepEqual(readdirSync(new URL("../public/encounter/assets/marcus/", import.meta.url)).sort(),
    ["base.webp", ...FACE_CATALOG.assets.map(a => `${a.assetId}.webp`)].sort());
  const base = readFileSync(new URL("../public/encounter/assets/marcus/base.webp", import.meta.url));
  assert.equal(createHash("sha256").update(base).digest("hex"), provenance.sourceBase.sha256);
  assert.equal(FACE_CATALOG.base.x, 0);
  assert.equal(FACE_CATALOG.base.y, 0);
  assert.equal(FACE_CATALOG.base.width, FACE_CATALOG.canvas.width);
  assert.equal(FACE_CATALOG.base.height, FACE_CATALOG.canvas.height);
  assert.ok(FACE_LAYER_ORDER.indexOf("left_brow") > FACE_LAYER_ORDER.indexOf("left_eye"));
  assert.ok(FACE_LAYER_ORDER.indexOf("right_brow") > FACE_LAYER_ORDER.indexOf("right_eye"));
});

test("every deliberate preset transition has exactly five validated HOLD/CHANGE operations", () => {
  for (const target of Object.keys(FACE_PRESETS)) {
    for (const previous of Object.keys(FACE_PRESETS)) {
      const before = faceTransition(previous);
      const after = faceTransition(target, before);
      assert.deepEqual(after.slots.map(s => s.slot), FACE_SLOTS);
      assert.equal(validateSnapshot(after), after);
      for (const [index, operation] of after.slots.entries()) assert.equal(operation.fromAssetId, before.slots[index].assetId);
      const held = faceTransition(target, after);
      assert.ok(held.slots.every(slot => slot.operation === "HOLD"));
    }
  }
  assert.ok(openingFace().slots.every(s => s.operation === "HOLD" && s.assetId === null));
  assert.ok(faceTransition("COMPOSED_BASE", faceTransition("ATTENTIVE")).slots.every(s => s.assetId === null && s.operation === "CHANGE"));
});

test("reception does not read future outcome, applied deltas, withheld information, or BASED", () => {
  const previous = faceTransition("GUARDED");
  const base = event({ intent: { action: "DEAL", information: "OFFER_INFORMATION" } });
  const expected = buildFaceTurn(base, previous).receiving;
  for (const outcome of ["ACCEPT", "COUNTER", "REJECT", "END"]) {
    const altered = structuredClone(base);
    altered.outcome = outcome;
    altered.deltas = { confidence: -80, tension: 99 };
    altered.intent.vibeId = "BA";
    altered.intent.intensity = "OVERT";
    altered.intent.terms = { upfront: 80 };
    altered.intent.information = "NONE";
    altered.privateFact = "A secret was forged.";
    altered.quirk = "recognition";
    altered.reactionCause.consequences = { transfersCommitted: true, privateDetail: "another private promise", informationCauses: [{ kind: "DISCLOSURE_BACKLASH" }] };
    assert.deepEqual(buildFaceTurn(altered, previous).receiving, expected);
  }
});

test("publicly equivalent resolved turns have identical faces regardless of hidden cause data", () => {
  const input = event();
  const expected = buildFaceTurn(input);
  const altered = structuredClone(input);
  altered.intent.vibeId = "DE";
  altered.intent.intensity = "OVERT";
  altered.reactionCause.involvedFactIds = ["secret-absence"];
  altered.reactionCause.observedEvidence = [{ id: "hidden-evidence" }];
  altered.reactionCause.consequences.reasons = ["secret score is 14.2"];
  altered.before = { confidence: 0 };
  altered.after = { confidence: 100 };
  altered.derived = { acceptThreshold: 1, meaningfulProgress: false };
  assert.deepEqual(buildFaceTurn(altered), expected);
  assert.doesNotMatch(JSON.stringify(expected), /secret|acceptThreshold|"EA"|"BALANCED"|confidence/);
});

test("approval is not closure; closure requires committed acceptance and terminal agreement", () => {
  const approved = event({ intent: { action: "DEAL" }, outcome: "ACCEPT" });
  approved.reactionCause.continuity.currentOffer = { id: "offer", version: 1 };
  assert.equal(buildFaceTurn(approved).responding.presetId, "READY_TO_AGREE");
  const confirmed = structuredClone(approved);
  confirmed.intent.action = "ACCEPT";
  confirmed.outcome = "AGREED";
  confirmed.reactionCause.continuity.status = "AGREED";
  confirmed.reactionCause.consequences.transfersCommitted = true;
  assert.equal(buildFaceTurn(confirmed).responding.presetId, "AGREEMENT_CLOSURE");
  confirmed.reactionCause.consequences.transfersCommitted = false;
  assert.notEqual(buildFaceTurn(confirmed).responding.presetId, "AGREEMENT_CLOSURE");
});

test("clarification holds both beats until an actual public ending supersedes it", () => {
  const prior = faceTransition("READY_TO_AGREE");
  const input = event({ intent: { action: "ASK", topic: "CLARIFY_OFFER" }, deltas: { confidence: 0, tension: 0 } });
  input.reactionCause.continuity.currentOffer = { id: "offer", version: 1 };
  input.reactionCause.continuity.clarificationPreservedOffer = true;
  const result = buildFaceTurn(input, prior);
  assert.ok(result.receiving.slots.every(s => s.operation === "HOLD"));
  assert.ok(result.responding.slots.every(s => s.operation === "HOLD"));
  input.outcome = "END";
  input.reactionCause.continuity.status = "ENDED";
  assert.equal(buildFaceTurn(input, prior).responding.presetId, "DRAWING_BOUNDARY");
  assert.deepEqual(buildFaceTurn(input, prior).receiving, result.receiving);
});

test("deterministic full real-event replay is pure and maintains reception/response continuity", () => {
  let state = createState("independent-lore-2", "face-replay", "recognition");
  for (const fields of [{ action: "ASK", topic: "VERIFY_SOURCE" }, { action: "ASK", topic: "PROBE_USEFULNESS" },
    { action: "DEAL", terms: { units: 2, upfront: 41, repayment: 79, extra: 0, days: 7 }, information: "OFFER_INFORMATION" }]) {
    state = transition(state, { requestId: `face_request_${state.events.length}`, runId: state.runId, version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields });
  }
  state = transition(state, { requestId: "face-accept", runId: state.runId, version: state.events.length, action: "ACCEPT", offerId: state.counteroffer.id, offerVersion: state.counteroffer.version, vibeId: "EA", intensity: "BALANCED" });
  const saved = structuredClone(state);
  const replay = () => {
    let previous = openingFace();
    return state.events.map(e => {
      const faces = buildFaceTurn(e, previous);
      for (const [index, slot] of faces.receiving.slots.entries()) assert.equal(slot.fromAssetId, previous.slots[index].assetId);
      for (const [index, slot] of faces.responding.slots.entries()) assert.equal(slot.fromAssetId, faces.receiving.slots[index].assetId);
      previous = faces.responding;
      return faces;
    });
  };
  const first = replay();
  assert.deepEqual(first, replay());
  assert.deepEqual(state, saved);
  assert.equal(first.at(-1).responding.presetId, "AGREEMENT_CLOSURE");
});

test("invalid asset snapshots and broken event references fail closed", () => {
  const wrong = openingFace();
  wrong.slots[0].assetId = SAFE_EYES.left_eye;
  assert.throws(() => buildFaceTurn(event(), wrong), /face target/);
  assert.throws(() => buildFaceTurn({ intent: { action: "ASK" } }), /turn reference/);
  const broken = event();
  broken.reactionCause.continuity.previousTurnRef = { runId: "wrong-run", index: 99 };
  assert.throws(() => buildFaceTurn(broken), /continuity/);
});

test("non-Marcus fixture never borrows Marcus artwork or pretends new art exists", () => {
  const neutral = openingFace("avery");
  assert.ok(neutral.slots.every(s => s.assetId === null));
  assert.match(neutral.visibleCaption, /no expression artwork/);
  const faces = buildFaceTurn({ ...event(), characterId: "avery" }, neutral);
  assert.deepEqual(faces.receiving, neutral);
  assert.deepEqual(faces.responding, neutral);
});
