import { projectMarcusLore } from "../src/encounter/marcus-world-adapter.mjs";
import { withoutFact, alterPrivateClaim, setOldDebt, setResources, prepareInformation, rewriteMarcusHistory } from "./helpers/marcus-world-interventions.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { BASED_VIBES, DELIVERY_INTENSITIES } from "../src/based.mjs";
import { createState } from "../src/encounter/state.mjs";
import { playerMessage, marcusMessage } from "../src/encounter/messages.mjs";
import { informationEligibility, privateInformation } from "../src/encounter/knowledge.mjs";
import { LORE_TOPICS } from "../src/encounter/history-content.mjs";
import { QUESTIONS, describeTerms } from "../src/conversation/language/frames.mjs";
import { NPC_REPLY_FAMILIES } from "../src/conversation/language/npc-lines.mjs";
import { deterministicVariant } from "../src/conversation/language/player-lines.mjs";
import { buildPlayerFrame, renderPlayerFrame, buildNpcFrame, renderNpcFrame, renderAuthoredFixtureLine, LANGUAGE_READINESS } from "../src/conversation/language/realizer.mjs";

const terms = { units: 2, upfront: 50, repayment: 70, extra: 4, days: 7 };
const fresh = variant => {
  for (let index = 0; index < 100; index += 1) {
    const state = createState(`language-review-${index}`, "language-review-run");
    if (projectMarcusLore(state).variant === variant) return state;
  }
  throw new Error("missing deterministic variant fixture");
};
const delivery = { vibeId: "EA", intensity: "BALANCED" };
const options = { ...delivery, mode: "AUTHORING_PREVIEW" };
const prepared = () => {
  const state = fresh("POSITIVE");
  prepareInformation(state);
  return state;
};

test("language: all 60 delivery coordinates preserve every canonical clause and exact proposal numbers", () => {
  const state = prepared();
  const before = structuredClone(state);
  const intents = [
    ...[...Object.keys(QUESTIONS), ...LORE_TOPICS.map(topic => topic.id)].filter(topic => topic !== "CLARIFY_OFFER" && informationEligibility(state, { action: "ASK", topic }).allowed).map(topic => ({ action: "ASK", topic })),
    { action: "DEAL", terms }, { action: "DEAL", terms, information: "OFFER_INFORMATION" }, { action: "WALK" },
  ];
  for (const intent of intents) {
    const frame = buildPlayerFrame(state, intent);
    const original = structuredClone(frame);
    for (const vibe of BASED_VIBES) for (const intensity of DELIVERY_INTENSITIES) for (const variantSeed of [0, 1]) {
      const result = renderPlayerFrame(frame, { vibeId: vibe.vibeId, intensity, mode: "AUTHORING_PREVIEW", variantSeed });
      assert.ok(result.text.includes(frame.text), `${intent.topic ?? intent.action} ${vibe.vibeId}/${intensity} lost core`);
      assert.deepEqual(result.text.match(/\d+/g), frame.text.match(/\d+/g));
      assert.match(result.readiness, /^AUTHORING_PREVIEW/);
    }
    assert.deepEqual(frame, original);
  }
  assert.deepEqual(state, before);
});

test("language: preview source, hint and conditional trade never reveal the operative detail", () => {
  for (const variant of ["POSITIVE", "NEGATIVE"]) {
    const state = variant === "POSITIVE" ? prepared() : fresh(variant);
    const secret = privateInformation(state).proposition;
    const topics = ["VERIFY_SOURCE", "PROBE_USEFULNESS", "DISCLOSE_PARTIAL"];
    for (const topic of topics) {
      const frame = buildPlayerFrame(state, { action: "ASK", topic });
      assert.ok(!JSON.stringify(frame).includes(secret));
      assert.ok(!renderPlayerFrame(frame, options).text.includes(secret));
    }
    if (variant === "POSITIVE") {
      const frame = buildPlayerFrame(state, { action: "DEAL", terms, information: "OFFER_INFORMATION" });
      assert.equal(frame.semanticFacts.disclosure, "CONDITIONAL_ONLY");
      assert.ok(!JSON.stringify(frame).includes(secret));
      assert.match(frame.text, /free to decline/);
    }
    const disclosed = buildPlayerFrame(state, { action: "ASK", topic: "DISCLOSE_FULL" });
    assert.equal(disclosed.semanticFacts.disclosure, "FULL");
    assert.ok(disclosed.text.includes(secret));
    withoutFact(state, projectMarcusLore(state).privateFactId);
    assert.throws(() => buildPlayerFrame(state, { action: "ASK", topic: "DISCLOSE_FULL" }), /Language frame/);
  }
});

test("language: confirmation binds current exact offer and discloses the actual known proposition only then", () => {
  const state = prepared();
  const secret = privateInformation(state).proposition;
  state.counteroffer = { id: "offer:3", version: 3, terms, informationExchange: { factId: projectMarcusLore(state).privateFactId, summary: "Exact depot collection instructions: gate, time window and docket; delivered on acceptance." } };
  const clarify = buildPlayerFrame(state, { action: "ASK", topic: "CLARIFY_OFFER" });
  assert.equal(clarify.semanticFacts.offerId, "offer:3");
  assert.ok(!JSON.stringify(clarify).includes(secret));
  const frame = buildPlayerFrame(state, { action: "ACCEPT" });
  assert.equal(frame.semanticFacts.oldDebt, 250);
  assert.deepEqual(frame.semanticFacts.terms, terms);
  assert.equal(frame.semanticFacts.offerVersion, 3);
  assert.equal(frame.semanticFacts.disclosure, "FULL_ON_CONFIRMATION");
  assert.ok(frame.text.includes(describeTerms(terms)));
  assert.ok(frame.text.includes(secret));
  assert.ok(renderPlayerFrame(frame, { mode: "PRODUCTION" }).text.includes(secret));
  assert.equal(state.metrics.debt, 250);
  assert.equal(projectMarcusLore(state).disclosure, "PARTIAL");
  state.counteroffer.informationExchange.factId = "UNKNOWN_FACT";
  assert.throws(() => buildPlayerFrame(state, { action: "ACCEPT" }), /Language frame/);
});

test("language: production stays authored fallback; legacy signatures still work", () => {
  const state = fresh("POSITIVE");
  const intent = { action: "ASK", topic: "DEBT", ...delivery };
  const frame = buildPlayerFrame(state, intent);
  assert.equal(playerMessage(intent, { state }), `[Boundaried / BALANCED] ${QUESTIONS.DEBT}`);
  assert.equal(renderPlayerFrame(frame).text, QUESTIONS.DEBT);
  assert.equal(renderPlayerFrame(frame).readiness, "PRODUCTION_SAFETY_FALLBACK");
  assert.equal(playerMessage(intent, { state, ...options }), renderPlayerFrame(frame, options).text);
  assert.equal(LANGUAGE_READINESS.productionEligible, false);
  assert.equal(LANGUAGE_READINESS.foundationRuntimeProtocolsAdded, 0);
  const decision = { outcome: "ANSWER", derived: {}, based: {}, social: {} };
  assert.equal(marcusMessage(state, intent, decision), renderNpcFrame(buildNpcFrame(state, intent, decision)).text);
});

test("language: malformed, unknown and altered frames fail closed", () => {
  const state = fresh("POSITIVE");
  assert.throws(() => buildPlayerFrame(state, { action: "PRESSURE" }), /unsupported action/);
  assert.throws(() => buildPlayerFrame(state, { action: "ASK", topic: "UNKNOWN" }), /unsupported question/);
  assert.throws(() => buildPlayerFrame(state, { action: "ACCEPT" }), /offer/);
  assert.throws(() => buildPlayerFrame(state, { action: "DEAL", terms: { ...terms, upfront: NaN } }), /terms/);
  const frame = buildPlayerFrame(state, { action: "ASK", topic: "DEBT" });
  for (const change of [
    value => { value.text += " Or else."; },
    value => { value.actorId = "MARCUS"; },
    value => { value.semanticFacts.oldDebt = -1; },
    value => { value.semanticFacts.newSecret = "injected"; },
    value => { value.semanticFacts.schemaVersion = "foundation-authority"; },
    value => { value.semanticFacts.topic = "FAKE"; value.semanticFacts.informationText = value.text; value.id = "player:ASK:FAKE"; },
  ]) {
    const malformed = structuredClone(frame); change(malformed);
    assert.throws(() => renderPlayerFrame(malformed, options), /Language frame/);
  }
  assert.throws(() => renderPlayerFrame(frame, { mode: "APPROVED" }), /unknown language mode/);
  assert.throws(() => renderPlayerFrame(frame, { vibeId: "EE" }), /coordinate/);
  assert.throws(() => renderPlayerFrame(frame, { intensity: "STRONG" }), /coordinate/);
});

test("language: all authored NPC families have two distinct deterministic review phrasings", () => {
  const context = { terms: describeTerms(terms), exchange: "Exact collection instructions delivered on confirmation", debt: 250, r17Rate: 19, positive: true };
  assert.equal(Object.keys(NPC_REPLY_FAMILIES).length, 37);
  for (const [family, realize] of Object.entries(NPC_REPLY_FAMILIES)) {
    const alternatives = realize(context);
    assert.equal(alternatives.length, 2);
    assert.equal(new Set(alternatives).size, 2, family);
    assert.deepEqual(alternatives[0].match(/\d+/g), alternatives[1].match(/\d+/g), `${family} changed numbers`);
    if (["CLARIFY", "APPROVED_PROPOSAL", "COUNTER"].includes(family)) assert.ok(alternatives.every(line => line.includes(context.terms)));
    const frame = { id: `marcus:${family}`, actorId: "MARCUS", targetId: "PLAYER", family, context, suffixes: [], text: alternatives[0], alternatives };
    assert.equal(renderNpcFrame(frame).text, alternatives[0]);
    assert.equal(renderNpcFrame(frame, { mode: "AUTHORING_PREVIEW", variantSeed: "run:1" }).text, alternatives[1]);
    assert.equal(renderNpcFrame(frame, { mode: "AUTHORING_PREVIEW", variantSeed: "run:2" }).text, alternatives[0]);
    frame.alternatives[1] += " You owe me $900.";
    assert.throws(() => renderNpcFrame(frame), /authored family/);
  }
});

test("language: NPC family selection follows resolved public reply, never player vibe or private operative detail", () => {
  const state = fresh("POSITIVE");
  const intent = { action: "ASK", topic: "PROBE_USEFULNESS", ...delivery };
  const decision = { outcome: "ANSWER", derived: {}, informationCauses: [{ evidenceIds: ["RELEVANCE_OBSERVED"], factIds: ["PICKUP_NEED"] }] };
  const frame = buildNpcFrame(state, intent, decision);
  assert.equal(frame.family, "RELEVANCE_PICKUP");
  const changed = structuredClone(state);
  rewriteMarcusHistory(changed, event => event, claim => { if (claim.claimId === "R17:body:2") claim.proposition.args.value = "SECRET UNDISCLOSED FACT"; return claim; });
  assert.deepEqual(buildNpcFrame(changed, { ...intent, vibeId: "DB" }, decision), frame);
  for (const variantSeed of [0, 1]) assert.ok(!renderNpcFrame(frame, { mode: "AUTHORING_PREVIEW", variantSeed }).text.includes(privateInformation(state).proposition));
  assert.notEqual(buildNpcFrame(state, intent, { ...decision, outcome: "END" }).family, frame.family);
});

test("language: sequential seed scheduling alternates without style drift on replay", () => {
  for (let index = 0; index < 25; index += 1) {
    assert.notEqual(deterministicVariant(`seed:${index}`), deterministicVariant(`seed:${index + 1}`));
    assert.equal(deterministicVariant(`seed:${index}`), deterministicVariant(`seed:${index}`));
  }
});

test("language: second-character shared presentation accepts exact registered fixture lines only", () => {
  const line = "You said you would meet me, but you did not arrive. What happened?";
  for (const vibe of BASED_VIBES) for (const intensity of DELIVERY_INTENSITIES) {
    const result = renderAuthoredFixtureLine(line, { ...options, vibeId: vibe.vibeId, intensity });
    assert.ok(result.text.includes(line));
    assert.ok(!/Contra|Marcus|\$/.test(result.text));
  }
  assert.equal(renderAuthoredFixtureLine(line).text, line);
  assert.throws(() => renderAuthoredFixtureLine(`${line} You owe me money.`, options), /unregistered/);
});
