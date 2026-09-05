import test from "node:test";
import assert from "node:assert/strict";
import { createState } from "../src/encounter/state.mjs";
import { transition, projectState } from "../src/encounter/engine.mjs";
import { selectQuirk } from "../src/encounter/marcus-profile.mjs";
import { HISTORY_CONTENT } from "../src/encounter/history-content.mjs";
import { informationEligibility } from "../src/encounter/knowledge.mjs";

const input = (state, fields) => ({ requestId: `information_${state.events.length}`, runId: state.runId,
  version: state.events.length, vibeId: "EA", intensity: "BALANCED", ...fields });
const ask = (state, topic, extra = {}) => transition(state, input(state, { action: "ASK", topic, ...extra }));
const deal = (state, terms, information = "NONE") => transition(state, input(state, { action: "DEAL", terms, information }));
const accept = state => transition(state, input(state, { action: "ACCEPT", offerId: state.counteroffer.id, offerVersion: state.counteroffer.version }));
const privateId = variant => variant === "POSITIVE" ? "POSITIVE_ROUTE" : "NEGATIVE_DISCREPANCY";
function start(variant = "POSITIVE", quirk = "recognition") {
  for (let n = 0; n < 300; n++) {
    const seed = `independent-lore-${n}`; const state = createState(seed, "information-review", selectQuirk(seed));
    if (state.lore.privateFactId === privateId(variant) && state.quirk === quirk) return state;
  }
  assert.fail(`Unreachable combination ${variant}/${quirk}`);
}
const prepare = state => ask(ask(state, "VERIFY_SOURCE"), "PROBE_USEFULNESS");
const terms = { units: 2, upfront: 40, repayment: 80, extra: 0, days: 7 };

test("information: all six combinations reproduce and opening knows own detail without hidden priorities", t => {
  const seeds = [];
  for (const variant of ["POSITIVE", "NEGATIVE"]) for (const quirk of ["final_say", "plain_dealing", "recognition"]) {
    const state = start(variant, quirk); seeds.push({ variant, quirk, seed: state.seed });
    assert.deepEqual(prepare(state), prepare(start(variant, quirk)));
    const view = projectState(state, "csrf"); const text = JSON.stringify(view.play.lore);
    assert.ok(text.includes(HISTORY_CONTENT[state.lore.privateFactId].proposition));
    assert.ok(text.includes("250"));
    assert.deepEqual(Object.keys(view.play.metrics).sort(), ["cash", "debt", "marcusStock", "playerStock"].sort());
    for (const fact of Object.values(HISTORY_CONTENT).filter(f => !f.playerVisible)) assert.ok(!text.includes(fact.proposition));
    assert.equal(state.lore.knowledge.marcus.includes(state.lore.privateFactId), false);
    assert.ok(state.lore.knowledge.player.includes(state.lore.privateFactId));
    assert.ok(!/negativeWindow|progressKeys|scoreBonus|acceptThreshold|reactionCause/.test(text));
    assert.equal(view.play.events.length, 0); assert.ok(view.debug.state.lore);
  }
  t.diagnostic(JSON.stringify(seeds));
});

test("information: every meaningful lore fact has a present/absent gameplay pair", () => {
  const pairs = {
    OLD_ACCOUNT: ["POSITIVE", "DEBT"], STOCK_TITLE: ["POSITIVE", "RISK"],
    MISSED_CHECKIN: ["POSITIVE", "ACK_MISSED"], SHARED_LOADING_SHIFT: ["POSITIVE", "SMALL_TALK"],
    DIRECT_RECEIPT: ["POSITIVE", "VERIFY_SOURCE"], LEDGER_CLOSING: ["POSITIVE", "PROBE_USEFULNESS"],
    POSITIVE_ROUTE: ["POSITIVE", "DISCLOSE_PARTIAL"], NEGATIVE_DISCREPANCY: ["NEGATIVE", "DISCLOSE_PARTIAL"],
    RECORD_ASSERTION: ["NEGATIVE", "QUESTION_RECORD"],
  };
  for (const [fact, [variant, topic]] of Object.entries(pairs)) {
    const present = start(variant); assert.doesNotThrow(() => ask(present, topic), `${fact} present`);
    const absent = structuredClone(present); delete absent.lore.facts[fact]; const before = structuredClone(absent);
    assert.throws(() => ask(absent, topic), `${fact} absent still authorizes ${topic}`); assert.deepEqual(absent, before);
    if (fact === "OLD_ACCOUNT") assert.equal(absent.obligations.existing, 250);
  }
  const need = start(); const noNeed = structuredClone(need); delete noNeed.lore.facts.PICKUP_NEED;
  const ready = prepare(need); const irrelevant = prepare(noNeed);
  const exchange = { action: "DEAL", terms, information: "OFFER_INFORMATION" };
  assert.equal(informationEligibility(ready, input(ready, exchange)).allowed, true);
  assert.equal(informationEligibility(irrelevant, input(irrelevant, exchange)).allowed, false);
  assert.throws(() => deal(irrelevant, terms, "OFFER_INFORMATION"));
  assert.deepEqual([...Object.keys(pairs), "PICKUP_NEED"].sort(), Object.keys(HISTORY_CONTENT).sort());
});

test("information: a positive exchange improves actual terms and only acceptance delivers detail", () => {
  const matched = { units: 2, upfront: 41, repayment: 79, extra: 0, days: 7 };
  const ready = prepare(start()); const plain = deal(ready, matched); const exchange = deal(ready, matched, "OFFER_INFORMATION");
  assert.equal(plain.events.at(-1).outcome, "COUNTER"); assert.equal(exchange.events.at(-1).outcome, "ACCEPT");
  assert.deepEqual(exchange.counteroffer.terms, matched); assert.ok(exchange.counteroffer.informationExchange);
  assert.ok(!JSON.stringify(projectState(exchange, "csrf").play).includes("POSITIVE_ROUTE"));
  assert.equal(exchange.lore.knowledge.marcus.includes("POSITIVE_ROUTE"), false);
  const clarified = ask(exchange, "CLARIFY_OFFER"); assert.deepEqual(clarified.counteroffer, exchange.counteroffer);
  for (const factId of ["STOCK_TITLE", "DIRECT_RECEIPT", "PICKUP_NEED", "POSITIVE_ROUTE"]) {
    const noLongerEligible = structuredClone(clarified); delete noLongerEligible.lore.facts[factId];
    const original = structuredClone(noLongerEligible); assert.throws(() => accept(noLongerEligible));
    assert.deepEqual(noLongerEligible, original, `${factId} failed acceptance changed state`);
  }
  const accepted = accept(clarified); assert.equal(accepted.status, "AGREED"); assert.ok(accepted.lore.knowledge.marcus.includes("POSITIVE_ROUTE"));
  assert.ok(!JSON.stringify(projectState(accepted, "csrf").play).includes("POSITIVE_ROUTE"));
  assert.equal(accepted.metrics.debt, 329); assert.equal(accepted.metrics.cash, 39);
  const withdrawn = transition(exchange, input(exchange, { action: "WALK" }));
  assert.equal(withdrawn.lore.knowledge.marcus.includes("POSITIVE_ROUTE"), false);
  const rejected = deal(ready, { units: 8, upfront: 0, repayment: 480, extra: 0, days: 30 }, "OFFER_INFORMATION");
  assert.equal(rejected.events.at(-1).outcome, "REJECT"); assert.equal(rejected.lore.knowledge.marcus.includes("POSITIVE_ROUTE"), false);
});

test("information: partial evidence is not full knowledge; early giveaway loses trade value permanently", () => {
  const partial = ask(start(), "DISCLOSE_PARTIAL"); assert.equal(partial.lore.knowledge.marcus.includes("POSITIVE_ROUTE"), false);
  const verified = ask(partial, "VERIFY_SOURCE"); assert.equal(verified.lore.knowledge.marcus.includes("POSITIVE_ROUTE"), false);
  const full = ask(start(), "DISCLOSE_FULL"); assert.ok(full.lore.knowledge.marcus.includes("POSITIVE_ROUTE"));
  const late = prepare(full); assert.throws(() => deal(late, terms, "OFFER_INFORMATION"));
  assert.equal(informationEligibility(late, input(late, { action: "DEAL", terms, information: "OFFER_INFORMATION" })).allowed, false);
  const before = structuredClone(late);
  let repeated;
  try { repeated = ask(late, "DISCLOSE_FULL", { vibeId: "SE", intensity: "OVERT" }); }
  catch { assert.deepEqual(late, before); }
  if (repeated) {
    assert.ok(repeated.metrics.confidence <= before.metrics.confidence); assert.ok(repeated.metrics.tension >= before.metrics.tension);
  }
});

test("information: negative disclosure gives one bounded useful opportunity or backlash according to preparation", () => {
  let prepared = prepare(start("NEGATIVE")); prepared = ask(prepared, "QUESTION_RECORD");
  const useful = ask(prepared, "DISCLOSE_FULL"); assert.ok(useful.lore.negativeWindow);
  const noOpening = structuredClone(useful); noOpening.lore.negativeWindow = null;
  let paired;
  for (let upfront = 24; upfront <= 80; upfront++) {
    const proposal = { units: 2, upfront, repayment: 120 - upfront, extra: 0, days: 7 };
    const withInfo = deal(useful, proposal); const without = deal(noOpening, proposal);
    if (withInfo.events.at(-1).outcome === "ACCEPT" && without.events.at(-1).outcome !== "ACCEPT") { paired = { withInfo, without, proposal }; break; }
  }
  assert.ok(paired, "Negative opportunity changed no actual approval outcome"); assert.equal(accept(paired.withInfo).status, "AGREED");
  const spent = deal(useful, { ...terms, upfront: 24, repayment: 96 });
  assert.ok(spent.lore.negativeWindow.consumedAt !== null); const repeat = deal(spent, terms);
  assert.equal(repeat.events.at(-1).derived.informationBonus, 0);
  const early = ask(start("NEGATIVE"), "DISCLOSE_FULL", { vibeId: "BA", intensity: "OVERT" });
  assert.equal(early.lore.negativeWindow, null); assert.ok(early.metrics.tension > start("NEGATIVE").metrics.tension);
  const latePreparation = ask(prepare(early), "QUESTION_RECORD");
  assert.equal(latePreparation.lore.negativeWindow, null); assert.ok(early.lore.knowledge.marcus.includes("NEGATIVE_DISCREPANCY"));
  const texts = [prepared, useful, early, paired.withInfo].flatMap(s => s.events.map(e => `${e.playerText} ${e.marcusText}`)).join(" ");
  assert.ok(!/or I (?:expose|reveal)|unless you|give me.*or else/i.test(texts));
});

test("information: late source checking updates belief without restoring spent private value", () => {
  for (const variant of ["POSITIVE", "NEGATIVE"]) {
    let state = ask(start(variant), "DISCLOSE_FULL");
    assert.equal(state.lore.beliefs.content, "RECEIVED_UNVERIFIED");
    state = ask(state, "VERIFY_SOURCE"); assert.equal(state.lore.beliefs.content, "DOCUMENT_SUPPORTED");
    state = ask(state, "PROBE_USEFULNESS");
    assert.equal(state.lore.disclosure, "FULL"); assert.ok(state.lore.knowledge.marcus.includes(state.lore.privateFactId));
    assert.ok(!/still yours to disclose or retain/i.test(state.events.at(-1).feedback));
    assert.equal(state.lore.negativeWindow, null);
    if (variant === "POSITIVE") assert.throws(() => deal(state, terms, "OFFER_INFORMATION"));
    else assert.equal(state.lore.beliefs.record, "DISPUTED");
  }
});

test("information: negative opportunity expires and repeated disclosure never reopens it", () => {
  let state = ask(ask(prepare(start("NEGATIVE")), "QUESTION_RECORD"), "DISCLOSE_FULL");
  const expiry = state.lore.negativeWindow.expiresAt;
  for (const topic of ["SMALL_TALK", "ACK_MISSED", "DEBT"]) state = ask(state, topic);
  assert.equal(state.events.length, expiry);
  state = deal(state, terms); assert.equal(state.events.at(-1).derived.informationBonus, 0);
  assert.ok(state.lore.negativeWindow.expiredAt > expiry);
  const openedAt = state.lore.negativeWindow.openedAt;
  state = ask(state, "DISCLOSE_FULL", { vibeId: "SE" });
  assert.equal(state.lore.negativeWindow.openedAt, openedAt);
  assert.ok(state.lore.negativeWindow.expiredAt); assert.equal(state.lore.disclosure, "FULL");
});

test("information: each variant and quirk supports a seeded useful information route without forced Vibe", t => {
  const results = [];
  for (const variant of ["POSITIVE", "NEGATIVE"]) for (const quirk of ["final_say", "plain_dealing", "recognition"]) {
    for (const vibeId of ["EA", "SE"]) {
      let state = start(variant, quirk);
      for (const topic of ["VERIFY_SOURCE", "PROBE_USEFULNESS"]) state = ask(state, topic, { vibeId });
      if (variant === "NEGATIVE") for (const topic of ["QUESTION_RECORD", "DISCLOSE_FULL"]) state = ask(state, topic, { vibeId });
      const proposal = { units: 2, upfront: 50, repayment: 70, extra: 4, days: 7 };
      state = transition(state, input(state, { action: "DEAL", terms: proposal, information: variant === "POSITIVE" ? "OFFER_INFORMATION" : "NONE", vibeId }));
      assert.ok(state.events.at(-1).derived.informationBonus > 0); assert.ok(state.counteroffer);
      state = accept(state); assert.equal(state.status, "AGREED");
      assert.ok(state.metrics.playerStock >= 2); assert.ok(state.obligations.principal > 0);
      results.push({ variant, quirk, seed: state.seed, vibeId, metrics: state.metrics, terms: state.agreement.terms });
    }
  }
  t.diagnostic(JSON.stringify(results));
});

test("information: first broad probe is ambiguous across quirks and undisclosed detail never appears in Marcus speech", () => {
  const clues = [];
  for (const quirk of ["final_say", "plain_dealing", "recognition"]) {
    const probed = ask(start("POSITIVE", quirk), "PRIORITIES", { vibeId: "SE" }); clues.push(probed.clues);
    assert.ok(!JSON.stringify(projectState(probed, "csrf").play).includes(quirk));
  }
  assert.deepEqual(clues[0], clues[1]); assert.deepEqual(clues[1], clues[2]);
  for (const variant of ["POSITIVE", "NEGATIVE"]) {
    const state = prepare(ask(start(variant), "DISCLOSE_PARTIAL"));
    const phrases = variant === "POSITIVE" ? ["gate C", "07:00", "07:30"] : ["six crates", "two-crate", "L-42"];
    for (const event of state.events) for (const phrase of phrases) assert.ok(!event.marcusText.includes(phrase));
    assert.equal(state.lore.knowledge.marcus.includes(state.lore.privateFactId), false);
  }
});
