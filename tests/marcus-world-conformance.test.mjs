import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { createConversation, resolveConversation, projectConversation } from "../src/conversation/runtime.mjs";
import { createMarcusWorld, informationVariant, projectMarcusEconomy, worldAssertion } from "../src/encounter/marcus-world.mjs";
import { projectMarcusLore, projectPlayerInformation, projectMarcusInformation, marcusDecisionContext } from "../src/encounter/marcus-world-adapter.mjs";
import { selectQuirk } from "../src/encounter/marcus-profile.mjs";
import { evaluateTurn } from "../src/encounter/marcus-policy.mjs";
import { createLedger, createEvent, appendCommit } from "../src/world/ledger.mjs";
import { validateLedger } from "../src/world/event-validator.mjs";
import { projectWorld } from "../src/world/projections.mjs";
import { projectPerceptions } from "../src/world/perception.mjs";
import { projectNpcBeliefs, beliefOn } from "../src/world/beliefs.mjs";
import { canonicalQuestion } from "../src/world/claims.mjs";
import { validateProfiles, landDelivery } from "../src/world/profiles.mjs";
import { oracleSnapshot, replayOracleRun } from "./helpers/marcus-world-model-oracle.mjs";

const bytes = fs.readFileSync(new URL("./fixtures/marcus-world-model-baseline-v01.json", import.meta.url));
const historicalFixture = JSON.parse(bytes);
const fixture = JSON.parse(fs.readFileSync(new URL("./fixtures/marcus-r17-exchange-v01.json", import.meta.url)));
const mode = { languageMode: "AUTHORING_PREVIEW" };
const causes = ["CLERICAL_ERROR", "RUNNER_SHORTED", "DEPOT_MISCOUNT"];
const json = value => JSON.stringify(value);
function start(run, countCause) {
  const state = createConversation("marcus", run.seed, "frozen-marcus-oracle");
  if (countCause) Object.assign(state, createMarcusWorld(run.seed, state.quirk, { countCause }));
  return state;
}
function advance(state, run, index) {
  if (run.steps[index].control === "REMOVE_NEGATIVE_WINDOW") state.informationLocal.negativeWindow = null;
  return resolveConversation(state, run.inputs[index], mode);
}
function observation(state) {
  const view = projectConversation(state, "independent-csrf", mode);
  return { play: view.play, options: view.options, player: projectPlayerInformation(state), marcus: projectMarcusInformation(state), lore: projectMarcusLore(state) };
}
function rebuild(world) {
  let replay = createLedger({ seed: world.seed, entities: world.entities });
  for (let index = 0; index < world.events.length;) {
    const first = world.events[index++], batch = [first];
    if (first.commitGroup) while (index < world.events.length && world.events[index].commitGroup === first.commitGroup) batch.push(world.events[index++]);
    replay = appendCommit(replay, batch, world.claims.filter(claim => batch.some(event => event.eventId === claim.originEventId)));
  }
  return replay;
}

test("Independent C1/C2: immutable historical fixture and 127 explicit R-17 migrated snapshots", () => {
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "add6744c07ec5bcbaac77457c65f1381723642072657d21e7ade4865444acc46");
  assert.equal(fixture.runs.length, 23);
  assert.equal(historicalFixture.runs.length, 23);
  assert.equal(fixture.sourceFixtureSHA256, createHash("sha256").update(bytes).digest("hex"));
  let snapshots = 0;
  for (const run of fixture.runs) {
    const actual = replayOracleRun(run);
    assert.deepEqual(actual.inputs, run.inputs, run.id);
    assert.deepEqual(actual.snapshots, run.snapshots, run.id);
    snapshots += actual.snapshots.length;
  }
  assert.equal(snapshots, 127);
});

test("Independent C3/C8: every golden seed retains variant/quirk; collection ignorance is absent support until READ", () => {
  for (const run of fixture.runs) {
    const expected = run.snapshots[0].outcome;
    assert.equal(informationVariant(run.seed), expected.variant);
    assert.equal(selectQuirk(run.seed), expected.quirk);
    let state = start(run);
    if (expected.variant !== "POSITIVE") continue;
    const queries = state.world.claims.filter(claim => claim.carrier.documentId === "R17" && claim.carrier.partId === "body").map(claim => claim.question);
    assert.equal(queries.length, 3);
    for (let index = 0; index <= run.steps.length; index++) {
      const npc = projectMarcusInformation(state);
      const hasRead = npc.perceptions.some(record => record.channel === "READ" && record.act.documentId === "R17" && record.act.parts.some(part => part.partId === "body"));
      for (const question of queries) assert.equal(beliefOn(npc.beliefs, question).stance === "UNKNOWN", !hasRead);
      assert.ok(!state.world.claims.some(claim => claim.proposition.keywordId === "BELIEVES" && claim.proposition.args.subject === "MARCUS" && claim.proposition.polarity === "NEGATED"));
      if (index < run.steps.length) state = advance(state, run, index);
    }
  }
});

test("Independent C4: no mutable lore authority; compatibility mutations cannot affect next turn", () => {
  const run = fixture.runs[0], state = start(run), copy = structuredClone(state);
  assert.equal(Object.hasOwn(state, "lore"), false);
  assert.deepEqual(Object.keys(state.informationLocal).sort(), ["negativeWindow", "progressKeys"]);
  const projection = projectMarcusLore(copy);
  projection.knowledge.player.length = 0; projection.beliefs.source = "BROKEN"; projection.facts = {};
  assert.deepEqual(advance(state, run, 0), advance(copy, run, 0));
  const folders = ["encounter", "conversation"];
  const files = folders.flatMap(folder => fs.readdirSync(new URL(`../src/${folder}/`, import.meta.url), { recursive: true }).filter(name => name.endsWith(".mjs")).map(name => new URL(`../src/${folder}/${name.replaceAll("\\", "/")}`, import.meta.url)));
  for (const file of files) assert.ok(!/\b(?:state|next)\.lore\b/.test(fs.readFileSync(file, "utf8")), file.pathname);
});

test("Independent C5: all negative golden turns invariant across three hidden objective count causes", () => {
  for (const run of fixture.runs.filter(item => item.snapshots[0].outcome.variant === "NEGATIVE")) {
    const states = causes.map(cause => start(run, cause));
    assert.notEqual(json(states[0].world.events), json(states[1].world.events));
    for (let index = 0; index <= run.steps.length; index++) {
      const expected = json(observation(states[0]));
      for (const state of states.slice(1)) {
        const actual = json(observation(state));
        if (actual !== expected) {
          let first = 0; while (actual[first] === expected[first]) first++;
          assert.fail(`${run.id}:${index} hidden cause divergence at byte ${first}: ${actual.slice(first - 100, first + 180)} != ${expected.slice(first - 100, first + 180)}`);
        }
      }
      if (index < run.steps.length) for (let cause = 0; cause < states.length; cause++) states[cause] = advance(states[cause], run, index);
    }
  }
});

test("Independent C6: NPC context is narrowed; private attitude changes no player menu until a reply", () => {
  const run = fixture.runs.find(item => item.snapshots[0].outcome.variant === "POSITIVE"), state = start(run);
  const context = marcusDecisionContext(state);
  assert.deepEqual(Object.keys(context).sort(), ["events", "metrics", "profile", "quirk"]);
  const before = observation(state);
  const denial = { ...worldAssertion("independent:need-ended", "NEEDS", { subject: "MARCUS", object: "COLLECTION_ARRANGED" }), polarity: "NEGATED" };
  const event = createEvent(state.world, "ATTITUDE_SET", { holderId: "MARCUS", assertion: denial }, { placeId: "COUNTER", presentIds: ["MARCUS"], observability: "PRIVATE" });
  const changed = { ...state, world: appendCommit(state.world, [event]) };
  assert.deepEqual(projectPlayerInformation(changed), before.player);
  assert.deepEqual(projectConversation(changed, "independent-csrf", mode).options, before.options);
  assert.equal(projectMarcusInformation(state).relevant, true);
  assert.equal(projectMarcusInformation(changed).relevant, false);
  const forbidden = new Proxy({}, { get() { throw new Error("forbidden objective access"); } });
  const bounded = { ...context, world: forbidden, lore: forbidden, player: forbidden };
  const intent = { action: "ASK", topic: "TERMS", vibeId: "EA", intensity: "BALANCED" };
  assert.deepEqual(evaluateTurn(bounded, intent), evaluateTurn(context, intent));
  const engine = fs.readFileSync(new URL("../src/encounter/engine.mjs", import.meta.url), "utf8");
  assert.ok(engine.includes("structuredClone({ social: informationEffect.social, progressKey: informationEffect.progressKey, scoreBonus: informationEffect.scoreBonus, exchange: informationEffect.exchange, r17Rate: informationEffect.r17Rate })"), "policy auxiliary argument contains a resolved rate scalar, never world or player knowledge");
});

test("Independent C7: each golden world replay plus fixed profiles reproduces byte-identical derived state", () => {
  for (const run of fixture.runs) {
    let state = start(run);
    for (let index = 0; index <= run.steps.length; index++) {
      const world = rebuild(JSON.parse(json(state.world)));
      assert.equal(json(world), json(state.world));
      const replay = { ...state, world, worldProfiles: JSON.parse(json(state.worldProfiles)) };
      assert.equal(json(projectWorld(world)), json(projectWorld(state.world)));
      assert.equal(json(projectPerceptions(world)), json(projectPerceptions(state.world)));
      assert.equal(json(projectMarcusInformation(replay)), json(projectMarcusInformation(state)));
      assert.equal(json(projectPlayerInformation(replay)), json(projectPlayerInformation(state)));
      assert.equal(json(projectMarcusLore(replay)), json(projectMarcusLore(state)));
      if (index < run.steps.length) state = advance(state, run, index);
    }
  }
});

test("Independent C9: all twelve world/profile combinations validate and acquire two Contra", t => {
  const matrix = [];
  for (const run of fixture.runs.filter(item => item.id.startsWith("combination-") && item.id.endsWith("-EA"))) {
    const variant = run.snapshots[0].outcome.variant;
    for (const cause of variant === "POSITIVE" ? [null] : causes) {
      let state = start(run, cause);
      assert.equal(validateLedger(state.world), true); assert.equal(validateProfiles(state.worldProfiles), true);
      for (let index = 0; index < run.steps.length; index++) state = advance(state, run, index);
      assert.equal(state.status, "AGREED"); assert.equal(projectMarcusEconomy(state.world).metrics.playerStock, 2);
      assert.ok(state.obligations.principal > 0);
      matrix.push({ variant, cause, quirk: state.quirk, seed: run.seed, status: state.status, units: state.metrics.playerStock });
    }
  }
  assert.equal(matrix.length, 12); assert.equal(new Set(matrix.map(row => `${row.variant}/${row.cause}/${row.quirk}`)).size, 12);
  t.diagnostic(JSON.stringify(matrix));
});

test("Independent C10: player has perceptions/holdings and delivery effectiveness, never belief/attitude state", () => {
  const state = start(fixture.runs[0]), player = state.worldProfiles.find(profile => profile.role === "PLAYER");
  assert.deepEqual(Object.keys(player).sort(), ["effectiveness", "entityId", "role", "version"]);
  const view = projectPlayerInformation(state);
  for (const field of ["beliefs", "stance", "rank", "trust", "attitudes"]) assert.equal(Object.hasOwn(view, field), false);
  assert.throws(() => projectNpcBeliefs(state.world, projectPerceptions(state.world), player, []), /NPC/);
  assert.throws(() => validateProfiles([{ ...player, beliefs: [] }]), /unexpected/);
  for (const intensity of ["SUBTLE", "BALANCED", "OVERT"]) assert.equal(landDelivery(player, { vibeId: "EA", intensity }), 1);
  const assertion = worldAssertion("bad-player-attitude", "NEEDS", { subject: "PLAYER", object: "COLLECTION_ARRANGED" });
  assert.throws(() => appendCommit(state.world, [createEvent(state.world, "ATTITUDE_SET", { holderId: "PLAYER", assertion }, { placeId: "COUNTER", presentIds: ["PLAYER"], observability: "PRIVATE" })]), /NPC/);
});

test("Independent C11: event-only authority, derived questions, no BACKSTORY channel or economic cache authority", () => {
  const run = fixture.runs[0], state = start(run), dirty = structuredClone(state);
  Object.assign(dirty.metrics, { cash: 999, debt: 999, marcusStock: 99, playerStock: 99 }); dirty.obligations.existing = 999;
  assert.deepEqual(advance(state, run, 0), advance(dirty, run, 0));
  for (const item of fixture.runs) {
    const initial = start(item), projected = projectWorld(initial.world);
    for (const event of initial.world.events) for (const assertion of [...(event.payload.happened ?? []), ...(event.payload.holds ?? [])]) assert.ok(!["OWNS", "OWES"].includes(assertion.keywordId));
    for (const claim of initial.world.claims) assert.equal(claim.question, canonicalQuestion(claim.proposition));
    assert.ok(projectPerceptions(initial.world).every(record => record.channel !== "BACKSTORY"));
    assert.equal(projected.possession.R17, "PLAYER");
    assert.ok(projected.activities.LEDGER_CLOSING);
    if (item.snapshots[0].outcome.variant === "POSITIVE") assert.ok(projected.attitudes.MARCUS.some(a => a.keywordId === "NEEDS"));
    assert.deepEqual(projectWorld({ ...initial.world, events: [] }), { resources: {}, obligations: {}, possession: {}, documents: {}, activities: {}, attitudes: {} });
  }
});

test("Independent atomic acceptance: exchange/settlement/closure share one commit; failed runtime and final-event append roll back", () => {
  const run = fixture.runs.find(item => item.inputs.at(-1).action === "ACCEPT" && item.snapshots.at(-2).outcome.counteroffer?.informationExchange);
  assert.ok(run, "The migrated corpus must include a genuinely valuable confirmed exchange");
  let state = start(run);
  for (let index = 0; index < run.steps.length - 1; index++) state = advance(state, run, index);
  assert.equal(run.inputs.at(-1).action, "ACCEPT");
  const bytesBefore = json(state);
  const stale = { ...run.inputs.at(-1), offerVersion: -1 };
  assert.throws(() => resolveConversation(state, stale, mode), /stale|forged/);
  assert.equal(json(state), bytesBefore);
  // Identity equality accepts this deliberately malformed terminal context; the
  // nonempty encounterId check fails only after settlement/body events stage.
  const lateFailure = structuredClone(state); lateFailure.runId = "";
  const lateBefore = json(lateFailure), economyBefore = projectMarcusEconomy(lateFailure.world);
  const disclosureBefore = projectMarcusLore(lateFailure).disclosure;
  assert.throws(() => resolveConversation(lateFailure, { ...run.inputs.at(-1), runId: "" }, mode), /WORLD_VALIDATION:encounterId/);
  assert.equal(json(lateFailure), lateBefore);
  assert.deepEqual(projectMarcusEconomy(lateFailure.world), economyBefore);
  assert.equal(projectMarcusLore(lateFailure).disclosure, disclosureBefore);
  const accepted = advance(state, run, run.steps.length - 1), last = accepted.events.at(-1);
  const batch = accepted.world.events.filter(event => last.worldEventIds.includes(event.eventId));
  assert.equal(new Set(batch.map(event => event.commitGroup)).size, 1); assert.ok(batch[0].commitGroup);
  assert.ok(batch.some(event => event.kind === "TRANSACTION"));
  assert.ok(batch.some(event => event.kind === "DOCUMENT_PRESENTED" && event.payload.parts.includes("body")));
  assert.ok(batch.some(event => event.kind === "DOCUMENT_TRANSFERRED" && event.payload.documentId === "R17"));
  assert.equal(batch.at(-1).kind, "ENCOUNTER_CLOSED");
  const broken = structuredClone(batch); broken.at(-1).payload.outcome = "INVALID";
  assert.throws(() => appendCommit(state.world, broken, accepted.world.claims.filter(claim => batch.some(event => event.eventId === claim.originEventId))));
  assert.equal(json(state), bytesBefore);
  assert.equal(accepted.status, "AGREED"); assert.equal(projectMarcusLore(accepted).disclosure, "FULL");
  for (const event of accepted.events) assert.ok(event.worldEventIds.length >= 2 && event.worldEventIds.every(id => accepted.world.events.some(worldEvent => worldEvent.eventId === id)));
});
