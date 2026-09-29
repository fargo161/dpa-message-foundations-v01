import test from "node:test";
import { projectMarcusLore } from "../src/encounter/marcus-world-adapter.mjs";
import assert from "node:assert/strict";
import { createState } from "../src/encounter/state.mjs";
import { transition, projectState } from "../src/encounter/engine.mjs";
import { selectQuirk } from "../src/encounter/marcus-profile.mjs";

const seed = "5e13a70495eb";
const terms = { units: 2, upfront: 40, repayment: 80, extra: 10, days: 7 };
const start = () => createState(seed, "polish-regression", selectQuirk(seed));
const input = (state, fields) => ({ requestId: `polish_${state.events.length}`, runId: state.runId,
  version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields });
const step = (state, fields) => transition(state, input(state, fields));
const ask = (state, topic, delivery = {}) => step(state, { action: "ASK", topic, ...delivery });
const deal = state => step(state, { action: "DEAL", terms, information: "NONE" });
const acceptance = state => input(state, { action: "ACCEPT", offerId: state.counteroffer.id, offerVersion: state.counteroffer.version });
const economy = state => Object.fromEntries(["cash", "debt", "marcusStock", "playerStock"].map(key => [key, state.metrics[key]]));
function evidenceRoute() {
  let state = start();
  state = ask(state, "TERMS", { vibeId: "SA", intensity: "SUBTLE" });
  state = ask(state, "VERIFY_SOURCE", { vibeId: "SA", intensity: "SUBTLE" });
  state = ask(state, "PROBE_USEFULNESS");
  state = ask(state, "QUESTION_RECORD", { vibeId: "AE", intensity: "OVERT" });
  return ask(state, "DISCLOSE_FULL", { vibeId: "SA" });
}

test("polish: observed seven-turn route approves before transferring and settles exactly once", () => {
  const ready = evidenceRoute();
  assert.equal(projectMarcusLore(ready).variant, "NEGATIVE");
  assert.equal(ready.events.length, 5);
  assert.equal(projectMarcusLore(ready).disclosure, "FULL");
  const proposed = deal(ready);
  assert.equal(proposed.events.at(-1).outcome, "ACCEPT");
  assert.equal(proposed.status, "OPEN");
  assert.deepEqual(proposed.counteroffer.terms, terms);
  assert.deepEqual(economy(proposed), economy(start()));
  const accepted = transition(proposed, acceptance(proposed));
  assert.equal(accepted.events.length, 7);
  assert.equal(accepted.status, "AGREED");
  assert.equal(accepted.counteroffer, null);
  assert.deepEqual(accepted.agreement.terms, terms);
  assert.deepEqual(economy(accepted), { cash: 40, debt: 340, marcusStock: 6, playerStock: 2 });
  assert.deepEqual(accepted.obligations, { existing: 250, principal: 80, extra: 10, days: 7 });
  const before = structuredClone(accepted);
  assert.throws(() => transition(accepted, acceptance(proposed)));
  assert.throws(() => step(accepted, { action: "ACCEPT", offerId: proposed.counteroffer.id, offerVersion: proposed.counteroffer.version }));
  assert.deepEqual(accepted, before);
});

test("polish: same-seed three-turn no-information route preserves counteroffer through clarification", () => {
  const proposed = deal(start());
  assert.equal(proposed.events.at(-1).outcome, "COUNTER");
  assert.deepEqual(proposed.counteroffer.terms, { units: 2, upfront: 48, repayment: 72, extra: 11, days: 7 });
  assert.deepEqual(economy(proposed), economy(start()));
  const clarified = ask(proposed, "CLARIFY_OFFER");
  assert.deepEqual(clarified.counteroffer, proposed.counteroffer);
  assert.deepEqual(economy(clarified), economy(start()));
  assert.ok(clarified.metrics.patience < proposed.metrics.patience);
  const accepted = transition(clarified, acceptance(clarified));
  assert.equal(accepted.events.length, 3);
  assert.equal(accepted.status, "AGREED");
  assert.deepEqual(economy(accepted), { cash: 32, debt: 333, marcusStock: 6, playerStock: 2 });
  assert.equal(projectMarcusLore(accepted).disclosure, "NONE");
  assert.equal(projectMarcusLore(accepted).knowledge.marcus.includes(projectMarcusLore(accepted).privateFactId), false);
});

test("polish: intervening unrelated turn invalidates acceptance without altering the ledger", () => {
  const proposed = deal(start());
  const old = acceptance(proposed);
  const changed = ask(proposed, "DEBT");
  const before = structuredClone(changed);
  assert.equal(changed.counteroffer, null);
  assert.throws(() => transition(changed, old));
  assert.throws(() => step(changed, { action: "ACCEPT", offerId: old.offerId, offerVersion: old.offerVersion }));
  assert.deepEqual(changed, before);
  assert.deepEqual(economy(changed), economy(start()));
});

test("polish: repeated state projection and JSON transport cannot reapply settlement", () => {
  const proposed = deal(evidenceRoute());
  const accepted = transition(proposed, acceptance(proposed));
  const before = structuredClone(accepted);
  for (let n = 0; n < 3; n++) {
    const view = JSON.parse(JSON.stringify(projectState(accepted, "polish-csrf")));
    assert.deepEqual(view.play.metrics, { cash: 40, debt: 340, marcusStock: 6, playerStock: 2 });
    assert.equal(view.play.status, "AGREED");
    assert.deepEqual(view.play.agreement.terms, terms);
    assert.equal(view.play.obligations.existing + view.play.obligations.principal + view.play.obligations.extra, view.play.metrics.debt);
    for (const [key, value] of Object.entries(view.play.metrics)) assert.equal(view.debug.state.metrics[key], value);
  }
  assert.deepEqual(accepted, before);
});

test("polish: consumed or expired evidence cannot be renewed by repeating the reveal", () => {
  const ready = evidenceRoute();
  const openedAt = ready.informationLocal.negativeWindow.openedAt;
  const consumed = deal(ready);
  assert.ok(consumed.events.at(-1).derived.informationBonus > 0);
  const repeated = ask(consumed, "DISCLOSE_FULL", { vibeId: "SA" });
  assert.equal(repeated.informationLocal.negativeWindow.openedAt, openedAt);
  assert.equal(repeated.informationLocal.negativeWindow.consumedAt, consumed.informationLocal.negativeWindow.consumedAt);
  assert.equal(deal(repeated).events.at(-1).derived.informationBonus, 0);
  let expired = ready;
  for (const topic of ["SMALL_TALK", "ACK_MISSED", "DEBT"]) expired = ask(expired, topic);
  expired = ask(expired, "DISCLOSE_FULL", { vibeId: "SA" });
  assert.equal(expired.informationLocal.negativeWindow.openedAt, openedAt);
  assert.ok(expired.informationLocal.negativeWindow.expiredAt);
  assert.equal(projectMarcusLore(expired).disclosure, "FULL");
  assert.equal(deal(expired).events.at(-1).derived.informationBonus, 0);
});
