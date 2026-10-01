#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import { createConversation, resolveConversation, projectConversation } from "../src/conversation/runtime.mjs";
import { informationVariant, r17Interest } from "../src/encounter/marcus-world.mjs";
import { projectPlayerInformation, projectMarcusInformation } from "../src/encounter/marcus-world-adapter.mjs";
import { projectWorld } from "../src/world/projections.mjs";
import { r17ExtraFloor, r17StandardExtra } from "../src/encounter/constants.mjs";

const mode = { languageMode: "AUTHORING_PREVIEW" }, seeds = {};
for (let index = 0; Object.keys(seeds).length < 4 && index < 1000; index++) {
  const seed = `r17-proof-${index}`;
  seeds[`${informationVariant(seed)}:${r17Interest(seed)}`] ??= seed;
}
assert.equal(Object.keys(seeds).length, 4);
const terms = { units: 2, upfront: 70, repayment: 50, extra: 0, days: 7 };
const hint = { action: "ASK", topic: "R17_HINT" }, show = { action: "ASK", topic: "R17_SHOW" };
const deal = information => ({ action: "DEAL", terms, information });
const routes = [];
for (const [key, seed] of Object.entries(seeds)) {
  const [version, interest] = key.split(":"), cares = interest === "true";
  /** @type {Array<[string, Array<Record<string, any>>, number[]]>} */
  const scenarios = [
    ["HOARD", [deal("NONE")], [16]],
    ["SHOW", [show, deal("NONE"), deal("NONE")], [13, 13, 13]],
    ["HINT_TRADE", [hint, deal("OFFER_INFORMATION")], [16, cares ? 8 : 16]],
    ["BLIND_TRADE", [deal("OFFER_INFORMATION")], [cares ? 8 : 22]],
  ];
  if (cares) scenarios.push(["REMOVE_READD", [deal("OFFER_INFORMATION"), deal("NONE"), deal("OFFER_INFORMATION")], [8, 16, 8]]);
  else scenarios.push(["FAILURE_REPEAT_HINT_SHOW", [deal("OFFER_INFORMATION"), deal("OFFER_INFORMATION"), hint, show, deal("NONE")], [22, 22, 22, 19, 19]]);
  for (const [scenario, actions, expectedRates] of scenarios) {
    let state = createConversation("marcus", seed, `golden:${key}:${scenario}`);
    const observations = [];
    const observe = () => {
      const player = projectPlayerInformation(state), npc = projectMarcusInformation(state), view = projectConversation(state, "golden-csrf", mode), event = state.events.at(-1);
      return { turn: state.events.length, rate: view.play.extraChargeRate, card: view.play.edge.card, r17: player.r17,
        documentHolder: projectWorld(state.world).possession.R17, disclosure: npc.disclosure, sourceChecked: npc.sourceChecked,
        content: npc.content, bodyClaimIds: npc.bodyClaims.map(claim => claim.claimId),
        tradeOptionAvailable: view.options.informationOptions.find(option => option.id === "OFFER_INFORMATION").available,
        proposal: state.proposal, offer: state.counteroffer, status: state.status, metrics: view.play.metrics,
        standardExtra: state.counteroffer ? r17StandardExtra(state.counteroffer.terms.repayment) : null,
        saving: state.counteroffer ? r17StandardExtra(state.counteroffer.terms.repayment) - state.counteroffer.terms.extra : null,
        reaction: event?.reactionCause?.consequences?.r17Reaction ?? null, respondingFace: event?.faces?.responding?.presetId ?? null,
        marcusText: event?.marcusText ?? null, worldEventIds: event?.worldEventIds ?? [] };
    };
    const initial = observe();
    assert.equal(initial.disclosure, "NONE"); assert.equal(initial.bodyClaimIds.length, 0);
    for (const [index, fields] of actions.entries()) {
      state = resolveConversation(state, { requestId: `golden_${index}`, runId: state.runId, version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields }, mode);
      const observed = observe();
      assert.equal(observed.rate, expectedRates[index], `${key}:${scenario}:${index}`);
      if (fields.action === "DEAL") assert.equal(state.proposal.terms.extra, r17ExtraFloor(state.proposal.terms.repayment, expectedRates[index]));
      if (state.counteroffer) assert.equal(state.counteroffer.terms.extra, r17ExtraFloor(state.counteroffer.terms.repayment, expectedRates[index]));
      observations.push(observed);
    }
    if (["HINT_TRADE", "BLIND_TRADE"].includes(scenario) && cares) {
      assert.equal(observations.at(-1).documentHolder, "PLAYER");
      assert.equal(observations.at(-1).bodyClaimIds.length, 0);
      const offer = state.counteroffer;
      state = resolveConversation(state, { requestId: "golden_confirm", runId: state.runId, version: state.events.length, vibeId: "EA", intensity: "BALANCED", action: "ACCEPT", offerId: offer.id, offerVersion: offer.version }, mode);
      const completed = observe();
      assert.equal(completed.documentHolder, "MARCUS"); assert.equal(completed.card.id, "TRADED"); assert.equal(completed.card.physicallyHeld, false);
      observations.push(completed);
    }
    routes.push({ seed, version: version === "POSITIVE" ? "GOOD" : "BAD", cares, scenario, initial, actions, expectedRates, observations });
  }
}
const directory = new URL("../docs/marcus-information-exchange-v01/", import.meta.url);
mkdirSync(directory, { recursive: true });
writeFileSync(new URL("GOLDEN_RUNS.json", directory), JSON.stringify({ schemaVersion: "r17-golden-runs@0.1", seeds, terms, routes }, null, 2) + "\n");
console.log(`Verified ${routes.length} golden routes across all four content/interest combinations.`);
console.log(JSON.stringify(seeds));
