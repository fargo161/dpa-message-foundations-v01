import test from "node:test";
import assert from "node:assert/strict";
import { createState } from "../src/encounter/state.mjs";
import { transition, projectState, validateTerms } from "../src/encounter/engine.mjs";
import { selectQuirk } from "../src/encounter/marcus-profile.mjs";

const start = () => createState("engine-test", "test-run", selectQuirk("engine-test"));
const intent = (s, fields) => ({ requestId: `request_${s.events.length}`, runId: s.runId, version: s.events.length, vibeId: "EA", intensity: "BALANCED", ...fields });
const terms = { units: 2, upfront: 60, repayment: 60, extra: 12, days: 7 };

test("approved proposal requires confirmation; acceptance transfers once and preserves old debt", () => {
  const s = start();
  const proposed = transition(s, intent(s, { action: "DEAL", terms }));
  assert.ok(proposed.counteroffer);
  for (const key of ["cash", "debt", "marcusStock", "playerStock"]) assert.equal(proposed.metrics[key], s.metrics[key]);
  const t = proposed.counteroffer.terms;
  const accepted = transition(proposed, intent(proposed, { action: "ACCEPT", offerId: proposed.counteroffer.id, offerVersion: proposed.counteroffer.version }));
  assert.equal(accepted.status, "AGREED");
  assert.equal(accepted.metrics.cash, 80 - t.upfront);
  assert.equal(accepted.metrics.playerStock, t.units);
  assert.equal(accepted.metrics.marcusStock, 8 - t.units);
  assert.equal(accepted.metrics.debt, 250 + t.repayment + t.extra);
  assert.equal(accepted.obligations.existing, 250);
  assert.throws(() => transition(accepted, intent(accepted, { action: "ACCEPT", offerId: proposed.counteroffer.id, offerVersion: proposed.counteroffer.version })));
  assert.deepEqual(s, start());
});

test("hard invalid terms never produce a turn or mutate state", () => {
  const s = start();
  for (const patch of [{ units: -1 }, { units: 9 }, { units: 1.5 }, { upfront: 81 }, { upfront: NaN }, { extra: Infinity }, { repayment: -1 }, { repayment: 0 }, { days: 0 }, { extra: 10001 }]) {
    assert.throws(() => transition(s, intent(s, { action: "DEAL", terms: { ...terms, ...patch } })));
    assert.deepEqual(s, start());
  }
  const highDebt = start(); highDebt.obligations.existing = 100000;
  assert.throws(() => validateTerms(highDebt, terms));
});

test("stale versions, offer identity, and client state injection fail closed", () => {
  const s = start();
  const p = transition(s, intent(s, { action: "DEAL", terms }));
  assert.throws(() => transition(p, intent(s, { action: "WALK" })));
  assert.throws(() => transition(p, intent(p, { action: "ACCEPT", offerId: "forged", offerVersion: 1 })));
  assert.throws(() => transition(p, { ...intent(p, { action: "ASK", topic: "DEBT" }), metrics: { cash: 999 } }));
  assert.throws(() => transition(p, { ...intent(p, { action: "ASK", topic: "DEBT" }), terms }));
  const asked = transition(p, intent(p, { action: "ASK", topic: "DEBT" }));
  assert.throws(() => transition(asked, intent(asked, { action: "ACCEPT", offerId: p.counteroffer.id, offerVersion: p.counteroffer.version })));
});

test("Play projection omits exact social values and matches Debug economy", () => {
  const s = start();
  const view = projectState(s, "csrf-test");
  assert.deepEqual(Object.keys(view.play.metrics), ["cash", "debt", "marcusStock", "playerStock"]);
  assert.equal(Object.keys(view.debug.state.metrics).length, 7);
  for (const [key, value] of Object.entries(view.play.metrics)) assert.equal(value, view.debug.state.metrics[key]);
  assert.equal(view.options.vibes.length, 20);
});
