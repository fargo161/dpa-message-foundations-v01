import test from "node:test";
import assert from "node:assert/strict";
import { projectPerceptions } from "../src/world/perception.mjs";
import { projectNpcBeliefs, beliefOn } from "../src/world/beliefs.mjs";
import { projectExposure } from "../src/world/exposure.mjs";
import { compileBackstory } from "../src/world/backstory.mjs";
import { selectOpenTruth } from "../src/world/open-truths.mjs";
import { validateProfiles, neutralPlayerProfile, landDelivery } from "../src/world/profiles.mjs";
import { canonicalQuestion, createClaim } from "../src/world/claims.mjs";
import { validateLedger } from "../src/world/event-validator.mjs";
import { projectWorld } from "../src/world/projections.mjs";
import { createAllKindsLedger } from "./helpers/world-kernel-fixture.mjs";
import { emptyWorld, npcProfile, profileSamples, assertion, append, issue, transfer, read, show, say } from "./helpers/world-subjective-fixture.mjs";

const count = value => assertion("HAS_ATTRIBUTE", { subject: "intake", attribute: "crates", value });
const countQuestion = canonicalQuestion(count(6));
const beliefs = (ledger, profile = npcProfile(), attitudes = []) => projectNpcBeliefs(ledger, projectPerceptions(ledger), profile, attitudes);
const countBelief = ledger => beliefOn(beliefs(ledger), countQuestion);
const occurrence = (ledger, observability = "PARTICIPANTS", access = "ALL") => append(ledger, "OCCURRENCE", { actorId: "player", participants: [{ entityId: "player", access: "ALL" }, { entityId: "marcus", access }], objectIds: ["intake"], happened: [count(6)] }, { presentIds: ["player", "marcus", "dee"], observability });

test("P1 present roles/access, P2 all room facts, P3 actor-only observations", () => {
  const restricted = occurrence(emptyWorld(), "PARTICIPANTS", []);
  let records = projectPerceptions(restricted);
  assert.deepEqual(records.map(record => record.holder), ["player", "marcus"]);
  assert.equal(records.find(record => record.holder === "marcus").act.propositions.length, 0);
  records = projectPerceptions(occurrence(emptyWorld(), "PRESENT", []));
  assert.equal(records.length, 3);
  assert.ok(records.every(record => record.rule === "P2" && record.act.propositions.length === 1));
  records = projectPerceptions(occurrence(emptyWorld(), "PRIVATE"));
  assert.deepEqual(records.map(record => [record.holder, record.rule]), [["player", "P3"]]);
});

test("P4/P5 distinguish addressed and overheard; speaker learns addressed exposure only", () => {
  const ledger = say(emptyWorld(), count(6), { speakerId: "marcus", audienceIds: ["player"], earshotIds: ["player", "dee"] });
  const records = projectPerceptions(ledger);
  assert.equal(records.find(record => record.holder === "player").channel, "TOLD");
  assert.equal(records.find(record => record.holder === "dee").channel, "HEARD");
  assert.equal(records.filter(record => record.holder === "player").length, 1);
  const exposure = projectExposure(ledger, records, "marcus");
  assert.deepEqual(exposure.map(item => [item.entityId, item.direction]), [["player", "RECEIVED"]]);
  assert.equal(beliefs(ledger).length, 0, "speaking does not itself add belief");
});

test("P6 READ and P6b act-seen preserve sightline/content firewall", () => {
  const ledger = show(transfer(issue(emptyWorld())));
  const records = projectPerceptions(ledger).filter(record => record.eventId === ledger.events.at(-1).eventId);
  assert.equal(records.find(record => record.holder === "marcus").rule, "P6");
  const dee = records.find(record => record.holder === "dee");
  assert.equal(dee.rule, "P6b");
  assert.deepEqual(dee.portion, []);
  assert.deepEqual(dee.claimsReceived, []);
  assert.ok(!JSON.stringify(dee).includes('"value":6'));
  assert.equal(beliefs(ledger, npcProfile("dee")).length, 0);
  const exposure = projectExposure(ledger, projectPerceptions(ledger), "marcus");
  assert.deepEqual(exposure.map(item => [item.entityId, item.channel, item.direction]), [["player", "SHOWN", "PROVIDED"]]);
  assert.ok(!projectPerceptions(ledger).some(record => record.holder === "player" && record.channel === "READ"), "presenter never read");
});

test("DOCUMENT issuance/transfer and P1-P3 ALL never read contents; P7 does", () => {
  let ledger = transfer(issue(emptyWorld()));
  assert.ok(projectPerceptions(ledger).every(record => record.claimsReceived.length === 0));
  ledger = read(ledger, "player", ["body"]);
  const records = projectPerceptions(ledger).filter(record => record.channel === "READ");
  assert.equal(records.length, 1); assert.equal(records[0].rule, "P7");
  assert.deepEqual(records[0].claimsReceived.map(claim => claim.claimId), ["doc:count"]);
});

test("P8 absent party infers only after perceived commitment; attendance stays act data", () => {
  const ledger = createAllKindsLedger(), records = projectPerceptions(ledger).filter(record => record.rule === "P8");
  assert.deepEqual(records.map(record => [record.holder, record.channel]), [["player", "INFERRED"], ["marcus", "SEEN"]]);
  assert.ok(records.every(record => record.act.kept === false && record.act.attendance.length === 2 && record.act.propositions.length === 0));
  let hidden = append(emptyWorld(), "COMMITMENT_MADE", { commitmentId: "c", promisorId: "marcus", promiseeId: "player", assertion: assertion("PROMISED_TO", { subject: "marcus", object: "player", term: "checkin" }) }, { presentIds: ["marcus", "player"], observability: "PRIVATE", time: { windowFrom: "09:00", windowUntil: "10:00" } });
  hidden = append(hidden, "COMMITMENT_WINDOW_CLOSED", { commitmentId: "c", parties: [{ entityId: "marcus", attendance: "PRESENT" }, { entityId: "player", attendance: "ABSENT" }], kept: false }, { presentIds: ["marcus"] });
  assert.ok(!projectPerceptions(hidden).some(record => record.rule === "P8" && record.holder === "player"));
});

test("V1 authenticating parts require full read union, recognized marks and visible issuer", () => {
  let ledger = show(transfer(issue(emptyWorld())), ["header"]);
  const q = canonicalQuestion(assertion("ISSUED_BY", { subject: "doc", object: "issuer" }));
  assert.equal(beliefOn(beliefs(ledger), q).stance, "UNKNOWN");
  ledger = show(ledger, ["signature"]);
  assert.equal(beliefOn(beliefs(ledger), q).rank, 3);
  assert.equal(beliefOn(beliefs(ledger, npcProfile("marcus", [])), q).stance, "UNKNOWN");
  assert.equal(countBelief(ledger).stance, "UNKNOWN", "source parts never reveal body");
});

test("V1 forgery fools recognized marks but never consults actual issuer truth", () => {
  const ledger = show(transfer(issue(emptyWorld(), { issuerId: "forger", apparentIssuer: "issuer" }), "doc", "forger"), ["header", "signature", "body"]);
  const source = beliefOn(beliefs(ledger), canonicalQuestion(assertion("ISSUED_BY", { subject: "doc", object: "issuer" })));
  assert.equal(source.stance, "BELIEVED"); assert.equal(source.rank, 3); assert.equal(source.heldClaim, "doc:issuer");
  assert.equal(countBelief(ledger).rank, 3);
});

test("R1/R2 new and equivalent repeated claims retain support without conflict", () => {
  const ledger = say(say(emptyWorld(), count(6)), count(6));
  const result = countBelief(ledger);
  assert.equal(result.stance, "BELIEVED"); assert.equal(result.rank, 1); assert.equal(result.challenged, false);
  assert.equal(result.supportedBy.length, 2); assert.deepEqual(result.competing, []);
});

test("R3 weaker then stronger switches cleanly; R5 stronger then weaker challenges", () => {
  const upgraded = occurrence(say(emptyWorld(), count(8)));
  const winner = countBelief(upgraded);
  assert.equal(winner.stance, "BELIEVED"); assert.equal(winner.rank, 4); assert.equal(winner.challenged, false);
  assert.equal(winner.heldClaim, `${upgraded.events.at(-1).eventId}:observed:0`);
  assert.equal(winner.supportedBy.length, 2);
  const challenged = countBelief(say(occurrence(emptyWorld()), count(8)));
  assert.equal(challenged.stance, "BELIEVED"); assert.equal(challenged.rank, 4); assert.equal(challenged.challenged, true);
  assert.equal(challenged.competing.length, 1);
});

test("R4 equal conflicting sources dispute; R6 late source check upgrades weaker challenger", () => {
  let ledger = issue(emptyWorld(), { documentId: "other_doc", count: 8 });
  ledger = read(transfer(ledger, "other_doc", "issuer", "marcus"), "marcus", ["header", "signature", "body"], "other_doc");
  ledger = show(transfer(issue(ledger)), ["body"]);
  let result = countBelief(ledger);
  assert.equal(result.stance, "BELIEVED"); assert.equal(result.heldClaim, "other_doc:count"); assert.equal(result.challenged, true);
  ledger = show(ledger, ["header", "signature"]);
  result = countBelief(ledger);
  assert.equal(result.stance, "DISPUTED"); assert.equal(result.rank, 3); assert.equal(result.heldClaim, null);
  assert.deepEqual(result.competing, ["other_doc:count", "doc:count"]);
  assert.ok(result.supportedBy.some(id => id.startsWith(ledger.events.at(-1).eventId)));
  assert.deepEqual(beliefs(structuredClone(ledger)), beliefs(ledger));
});

test("R6 rechecks at authentication time after an intervening stronger observation", () => {
  let ledger = show(transfer(issue(emptyWorld())), ["body"]);
  ledger = append(ledger, "OCCURRENCE", { actorId: "marcus", participants: [{ entityId: "marcus", access: "ALL" }], objectIds: ["intake"], happened: [count(8)] });
  const before = countBelief(ledger);
  assert.equal(before.rank, 4); assert.equal(before.challenged, false);
  ledger = show(ledger, ["header", "signature"]);
  const after = countBelief(ledger);
  assert.equal(after.stance, "BELIEVED"); assert.equal(after.heldClaim, before.heldClaim); assert.equal(after.rank, 4);
  assert.equal(after.challenged, true); assert.deepEqual(after.competing, ["doc:count"]);
  assert.ok(after.supportedBy.some(id => id.startsWith(ledger.events.at(-1).eventId)));
});

test("V1 hypothetical issuer assertions cannot authenticate actual document contents", () => {
  const ledger = structuredClone(show(transfer(issue(emptyWorld())), ["header", "signature", "body"]));
  const issuerClaim = ledger.claims.find(claim => claim.claimId === "doc:issuer");
  issuerClaim.proposition.scope = "HYPOTHETICAL"; issuerClaim.question = canonicalQuestion(issuerClaim.proposition);
  assert.equal(countBelief(ledger).rank, 1);
  assert.equal(beliefOn(beliefs(ledger), issuerClaim.question).stance, "UNKNOWN");
});

test("V1 conflicting recognized authenticating issuers stay DISPUTED without upgrading the body", () => {
  const ledger = structuredClone(show(transfer(issue(emptyWorld())), ["header", "signature", "body"]));
  const origin = ledger.events.find(event => event.kind === "DOCUMENT_ISSUED");
  origin.payload.parts.find(part => part.partId === "signature").claimIds.push("doc:rival-issuer");
  ledger.claims.push(createClaim({ claimId: "doc:rival-issuer", proposition: assertion("ISSUED_BY", { subject: "doc", object: "forger" }), category: { categoryId: "issuer", label: "Document source" }, carrier: { documentId: "doc", partId: "signature" }, originEventId: origin.eventId }));
  assert.equal(validateLedger(ledger), true);
  const source = beliefOn(beliefs(ledger), canonicalQuestion(assertion("ISSUED_BY", { subject: "doc", object: "issuer" })));
  assert.equal(source.stance, "DISPUTED"); assert.equal(source.rank, 3);
  assert.deepEqual(source.competing, ["doc:issuer", "doc:rival-issuer"]);
  assert.equal(countBelief(ledger).rank, 1);
});

function challengeDocumentSource(ledger) {
  let changed = show(transfer(issue(ledger, { documentId: "other_doc" }), "other_doc"), ["header", "signature", "body"], ["marcus"], ["marcus"], "other_doc");
  changed = structuredClone(changed);
  const rival = changed.claims.find(claim => claim.claimId === "other_doc:count");
  rival.proposition = assertion("ISSUED_BY", { subject: "doc", object: "forger" });
  rival.question = canonicalQuestion(rival.proposition);
  assert.equal(validateLedger(changed), true);
  return changed;
}

test("R6 later source dispute downgrades previous body support instead of leaving stale rank3", () => {
  const original = show(transfer(issue(emptyWorld())), ["header", "signature", "body"]);
  assert.equal(countBelief(original).rank, 3);
  const challenged = challengeDocumentSource(original);
  const source = beliefOn(beliefs(challenged), canonicalQuestion(assertion("ISSUED_BY", { subject: "doc", object: "issuer" })));
  assert.equal(source.stance, "DISPUTED"); assert.equal(source.rank, 3);
  const body = countBelief(challenged);
  assert.equal(body.stance, "BELIEVED"); assert.equal(body.rank, 1); assert.equal(body.heldClaim, "doc:count");
  assert.ok(body.supportedBy.some(id => id.startsWith(challenged.events.at(-1).eventId)));
});

test("R6 carrier downgrade preserves independent trusted statement support", () => {
  let ledger = show(transfer(issue(emptyWorld())), ["header", "signature", "body"]);
  ledger = say(ledger, count(8), { claimId: "independent-count" });
  const own = [assertion("TRUSTS", { subject: "marcus", object: "player" })];
  assert.equal(beliefOn(beliefs(ledger, npcProfile(), own), countQuestion).rank, 3);
  ledger = challengeDocumentSource(ledger);
  const result = beliefOn(beliefs(ledger, npcProfile(), own), countQuestion);
  assert.equal(result.stance, "BELIEVED"); assert.equal(result.rank, 2); assert.equal(result.heldClaim, "independent-count");
  assert.equal(result.challenged, true); assert.deepEqual(result.competing, ["doc:count"]);
});

test("R6 stronger observed denial of the issuer cannot count as positive authenticity", () => {
  let ledger = show(transfer(issue(emptyWorld())), ["header", "signature", "body"]);
  ledger = append(ledger, "OCCURRENCE", { actorId: "marcus", participants: [{ entityId: "marcus", access: "ALL" }], objectIds: ["doc"], happened: [assertion("ISSUED_BY", { subject: "doc", object: "issuer" }, { polarity: "NEGATED" })] });
  assert.equal(countBelief(ledger).rank, 1);
});

test("NPC presenter observes recipient exposure using only previously read displayed content", () => {
  let ledger = read(transfer(issue(emptyWorld()), "doc", "issuer", "marcus"), "marcus", ["body"]);
  ledger = show(ledger, ["body"], ["player", "dee"], ["player"], "doc", "marcus");
  const exposure = projectExposure(ledger, projectPerceptions(ledger), "marcus");
  assert.deepEqual(exposure.map(item => [item.entityId, item.claimId, item.channel, item.direction]), [["player", "doc:count", "READ", "RECEIVED"]]);
  const unread = show(transfer(issue(emptyWorld()), "doc", "issuer", "marcus"), ["body"], ["player"], ["player"], "doc", "marcus");
  assert.deepEqual(projectExposure(unread, projectPerceptions(unread), "marcus"), []);
  const covered = show(read(transfer(issue(emptyWorld()), "doc", "issuer", "marcus"), "marcus", ["body"]), ["header"], ["player"], ["player"], "doc", "marcus");
  assert.deepEqual(projectExposure(covered, projectPerceptions(covered), "marcus"), []);
});

test("trust raises TOLD only; foreign attitudes rejected", () => {
  const ledger = say(emptyWorld(), count(6)), own = [assertion("TRUSTS", { subject: "marcus", object: "player" })];
  assert.equal(beliefOn(beliefs(ledger, npcProfile(), own), countQuestion).rank, 2);
  assert.equal(countBelief(ledger).rank, 1);
  assert.throws(() => beliefs(ledger, npcProfile(), [assertion("TRUSTS", { subject: "dee", object: "player" })]), /foreign/);
});

test("CATEGORY redacts proposition and exact question; own-holder filtering rejects hidden access", () => {
  const ledger = say(emptyWorld(), count(9876), { resolution: "CATEGORY" }), records = projectPerceptions(ledger);
  const marcus = records.filter(record => record.holder === "marcus");
  assert.ok(!JSON.stringify(marcus).includes("9876"));
  assert.ok(marcus.every(record => record.claimsReceived.every(claim => !claim.proposition && !claim.question && !claim.carrier)));
  assert.equal(countBelief(ledger).stance, "UNKNOWN");
  assert.equal(beliefs(ledger)[0].resolution, "CATEGORY");
  assert.equal(beliefs(ledger, npcProfile("dee")).length, 0);
});

test("rank0 INFERRED exact synthetic projector input remains real belief, unlike UNKNOWN", () => {
  // Synthetic input tests rank semantics independently; P8 attendance is intentionally not a keyword.
  const ledger = occurrence(emptyWorld()), records = projectPerceptions(ledger).filter(record => record.holder === "marcus").map(record => ({ ...record, channel: "INFERRED" }));
  const result = projectNpcBeliefs(ledger, records, npcProfile(), []);
  assert.equal(result[0].rank, 0); assert.equal(result[0].stance, "BELIEVED");
  assert.equal(beliefOn([], countQuestion).stance, "UNKNOWN");
});

test("player never receives projected beliefs/exposure; nested BELIEVES remains excluded", () => {
  const ledger = say(emptyWorld(), assertion("BELIEVES", { subject: "player", proposition: count(6) }));
  assert.deepEqual(beliefs(ledger), []);
  assert.throws(() => projectNpcBeliefs(ledger, projectPerceptions(ledger), neutralPlayerProfile(), []), /NPC/);
  assert.throws(() => projectExposure(ledger, projectPerceptions(ledger), "player"), /NPC/);
});

test("observed genesis totals and subsequent known deltas; missed baseline never invents OWNS", () => {
  const effects = [{ kind: "RESOURCE_DELTA", holderId: "player", resourceId: "cash", delta: 80 }];
  let ledger = append(emptyWorld(), "TRANSACTION", { fromId: "marcus", toId: "player", hardEffects: effects }, { provenance: { kind: "AUTHORED", sourceRef: "genesis" } });
  let records = projectPerceptions(ledger).filter(record => record.holder === "marcus");
  assert.equal(records[0].act.propositions[0].args.quantity, 80);
  ledger = append(ledger, "TRANSACTION", { fromId: "marcus", toId: "player", hardEffects: [{ ...effects[0], delta: 20 }] });
  assert.equal(projectPerceptions(ledger).filter(record => record.holder === "marcus").at(-1).act.propositions[0].args.quantity, 100);
  const ownQuestion = canonicalQuestion(assertion("OWNS", { subject: "player", object: "cash", quantity: 100 }));
  const current = beliefOn(beliefs(ledger), ownQuestion);
  assert.equal(current.stance, "BELIEVED"); assert.equal(current.challenged, false);
  assert.equal(current.heldClaim, `${ledger.events.at(-1).eventId}:observed:0`);
  const hidden = append(occurrence(emptyWorld(), "PRIVATE"), "TRANSACTION", { fromId: "marcus", toId: "player", hardEffects: effects }, { provenance: { kind: "AUTHORED", sourceRef: "genesis" } });
  records = projectPerceptions(hidden).filter(record => record.holder === "marcus");
  assert.deepEqual(records[0].act.propositions, []); assert.equal(records[0].act.resourceTransfers[0].delta, 80);
});

test("observed obligation updates supersede snapshots; unseen hard changes do not rewrite beliefs", () => {
  const effect = { kind: "OBLIGATION_SET", obligationId: "old_account", debtorId: "player", creditorId: "marcus", principal: 250, extra: 0, days: null, status: "OPEN" };
  let ledger = append(emptyWorld(), "TRANSACTION", { fromId: "player", toId: "marcus", hardEffects: [effect] }, { provenance: { kind: "AUTHORED", sourceRef: "genesis" } });
  ledger = append(ledger, "TRANSACTION", { fromId: "player", toId: "marcus", hardEffects: [{ ...effect, principal: 200 }] });
  const question = canonicalQuestion(assertion("OWES", { subject: "player", object: "marcus", term: "old_account", amount: 200 }));
  const visible = beliefOn(beliefs(ledger), question);
  assert.equal(visible.stance, "BELIEVED"); assert.equal(visible.heldClaim, `${ledger.events.at(-1).eventId}:observed:0`);
  ledger = append(ledger, "TRANSACTION", { fromId: "player", toId: "marcus", hardEffects: [{ ...effect, principal: 100 }] }, { observability: "PRIVATE" });
  assert.deepEqual(beliefOn(beliefs(ledger), question), visible);
});

test("P6 shared readers yield received exposure only where the holder could read", () => {
  const ledger = show(transfer(issue(emptyWorld())), ["body"], ["marcus", "dee"], ["marcus", "dee"]);
  const exposure = projectExposure(ledger, projectPerceptions(ledger), "marcus");
  assert.ok(exposure.some(item => item.entityId === "dee" && item.channel === "READ" && item.direction === "RECEIVED"));
  const other = show(transfer(issue(emptyWorld())), ["body"], ["marcus", "dee"], ["marcus"]);
  assert.ok(!projectExposure(other, projectPerceptions(other), "marcus").some(item => item.entityId === "dee"));
});

test("backstory TOLD/READ/SEEN compile ordinary records, reject immutable rewrites/hard duplication", () => {
  let ledger = compileBackstory(emptyWorld(), [{ holder: "marcus", via: "TOLD", from: "player", proposition: count(6) }]);
  assert.equal(ledger.events[0].provenance.kind, "BACKSTORY"); assert.equal(countBelief(ledger).rank, 1);
  ledger = compileBackstory(emptyWorld(), [{ holder: "marcus", via: "SEEN", proposition: count(6) }]);
  assert.equal(countBelief(ledger).rank, 4);
  assert.equal(compileBackstory(ledger, [{ holder: "marcus", via: "SEEN", proposition: count(6) }]).events.length, 1);
  assert.throws(() => compileBackstory(ledger, [{ holder: "player", via: "SEEN", eventId: ledger.events[0].eventId, proposition: count(6) }]), /committed/);
  assert.throws(() => compileBackstory(emptyWorld(), [{ holder: "marcus", via: "SEEN", proposition: assertion("OWNS", { subject: "marcus", object: "contra", quantity: 8 }) }]), /hard state/);
  ledger = transfer(issue(emptyWorld()), "doc", "issuer", "marcus");
  ledger = compileBackstory(ledger, [{ holder: "marcus", via: "READ", documentId: "doc", parts: ["header", "signature", "body"] }]);
  assert.equal(countBelief(ledger).rank, 3);
  assert.ok(projectPerceptions(ledger).every(record => record.channel !== "BACKSTORY"));
});

test("backstory staged SEEN augments uncommitted occurrence and attitude shortcut is event-backed", () => {
  let ledger = compileBackstory(emptyWorld(), [{ holder: "marcus", via: "SEEN", proposition: count(6), stagedEvent: { kind: "OCCURRENCE", payload: { actorId: "player", participants: [{ entityId: "player", access: "ALL" }], objectIds: ["intake"], happened: [count(6)] }, options: { presentIds: ["player"] } } }]);
  assert.equal(ledger.events.length, 1); assert.equal(countBelief(ledger).rank, 4);
  ledger = compileBackstory(ledger, [{ holder: "marcus", kind: "ATTITUDE_SET", proposition: assertion("TRUSTS", { subject: "marcus", object: "player" }) }]);
  assert.equal(projectWorld(ledger).attitudes.marcus.length, 1);
  assert.throws(() => compileBackstory(ledger, [{ holder: "player", kind: "ATTITUDE_SET", proposition: assertion("TRUSTS", { subject: "player", object: "marcus" }) }]), /NPC private attitude/);
});

test("fixed versioned profiles enforce neutral delivery and reject subjective fields", () => {
  assert.equal(validateProfiles(profileSamples), true);
  for (const intensity of ["SUBTLE", "BALANCED", "OVERT"]) assert.equal(landDelivery(neutralPlayerProfile(), { vibeId: "EA", intensity }), 1);
  assert.throws(() => validateProfiles([{ ...neutralPlayerProfile(), beliefs: [] }]), /unexpected/);
  assert.throws(() => validateProfiles([{ ...npcProfile(), recognizes: ["same", "same"] }]), /recognizes/);
  assert.throws(() => landDelivery(npcProfile(), { vibeId: "EA", intensity: "BALANCED" }), /player/);
});

test("open truths resolve once deterministically, conditional variants discard alternatives", () => {
  const definition = { openTruthId: "COUNT_CAUSE", salt: "count:", when: { openTruthId: "CONTENT", variantId: "NEGATIVE" }, variants: [{ variantId: "a", events: [{ kind: "OCCURRENCE" }] }, { variantId: "b", events: [{ kind: "OCCURRENCE" }] }] };
  assert.equal(selectOpenTruth("seed", definition, { CONTENT: "POSITIVE" }), null);
  const chosen = selectOpenTruth("seed", definition, { CONTENT: "NEGATIVE" });
  assert.deepEqual(chosen, selectOpenTruth("seed", definition, { CONTENT: "NEGATIVE" }));
  assert.equal(chosen.events.length, 1); assert.equal(chosen.events[0].provenance.kind, "SEED");
  assert.throws(() => selectOpenTruth("seed", definition, {}), /dependency/);
  assert.throws(() => selectOpenTruth("seed", definition, { COUNT_CAUSE: chosen, CONTENT: "NEGATIVE" }), /already resolved/);
});
