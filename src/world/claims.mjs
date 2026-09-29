import { KEYWORD_BY_ID, validateKeywordAssertion, CONTRADICTION_RULES } from "../keywords.mjs";
import { ATTRIBUTE_REGISTRY, detached, freezeTree, stableStringify } from "./event-contract.mjs";

const fail = message => { throw new Error(`WORLD_ASSERTION:${message}`); };
const string = value => typeof value === "string" && value.trim().length > 0;
const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
export function validateWorldAssertion(assertion, entities) {
  const errors = validateKeywordAssertion(assertion);
  if (errors.length) fail(errors.join(","));
  const allowed = ["assertionId","keywordId","args","scope","polarity","status","contextIds","validFrom","validUntil","provenance"];
  if (Object.keys(assertion).some(k => !allowed.includes(k))) fail("unexpected assertion field");
  const byId = new Map(entities.map(e => [e.entityId,e]));
  const ref = (id, types = null) => { if (!string(id) || !byId.has(id) || (types && !types.includes(byId.get(id).type))) fail(`invalid entity ${id}`); };
  const a = assertion.args;
  ref(a.subject, assertion.keywordId === "HAS_ATTRIBUTE" ? null : assertion.keywordId === "ISSUED_BY" ? ["OBJECT"] : ["ACTOR"]);
  if (assertion.keywordId === "HAS_ATTRIBUTE") {
    if (!Object.hasOwn(ATTRIBUTE_REGISTRY,a.attribute)) fail("unregistered attribute");
    if (a.attribute === "crates" && (!Number.isSafeInteger(a.value) || a.value < 0 || a.value > 1000000)) fail("crates type");
    if (a.attribute === "collection_place") ref(a.value,["LOCATION"]);
    if (a.attribute === "docket" && !string(a.value)) fail("docket type");
    if (a.attribute === "collection_window" && (!record(a.value) || Object.keys(a.value).sort().join() !== "from,until" || !string(a.value.from) || !string(a.value.until) || a.value.from >= a.value.until)) fail("collection window type/order");
  } else {
    const argumentTypes = {
      OWNS: {object:["RESOURCE","OBJECT","LOCATION"]}, OWES:{object:["ACTOR"],term:["OBLIGATION"]},
      PROMISED_TO:{object:["ACTOR"],term:["ACTION","OBLIGATION"]},
      PERMITTED:{object:["ACTOR"],term:["ACTION","RESOURCE","OBJECT"]}, PROHIBITED:{object:["ACTOR"],term:["ACTION","RESOURCE","OBJECT"]},
      KNOWS_SECRET_ABOUT:{object:["ACTOR"],secret:["SECRET"]}, BELIEVES:{proposition:["PROPOSITION"]},
      TRUSTS:{object:["ACTOR"]}, HAS_LEVERAGE_OVER:{object:["ACTOR"]}, ISSUED_BY:{object:["ACTOR"]},
    };
    for (const key of KEYWORD_BY_ID.get(assertion.keywordId).argumentKeys.filter(k => k !== "subject")) {
      if (key === "proposition" && record(a[key])) validateWorldAssertion(a[key], entities);
      else ref(a[key], argumentTypes[assertion.keywordId]?.[key] ?? null);
    }
  }
  for (const key of ["quantity","amount"]) if (key in a && (!Number.isSafeInteger(a[key]) || a[key] < 0 || a[key] > 1000000)) fail(`${key} type`);
  for (const key of ["unit","due","status"]) if (key in a && !string(a[key])) fail(`${key} type`);
  return true;
}

export function canonicalQuestion(assertion) {
  const keyword = KEYWORD_BY_ID.get(assertion.keywordId);
  if (!keyword) fail("unknown keyword");
  const args = {...assertion.args};
  if (keyword.valueSlot !== null) delete args[keyword.valueSlot];
  return stableStringify({keywordId: assertion.keywordId, args, scope: assertion.scope});
}
export function assertionsConflict(a,b) {
  if (canonicalQuestion(a) === canonicalQuestion(b)) {
    if (a.polarity !== b.polarity) return true;
    const slot = KEYWORD_BY_ID.get(a.keywordId).valueSlot;
    return slot !== null && stableStringify(a.args[slot]) !== stableStringify(b.args[slot]);
  }
  return a.scope === b.scope && a.polarity === "ASSERTED" && b.polarity === "ASSERTED" &&
    CONTRADICTION_RULES.some(rule => ((rule.leftKeywordId === a.keywordId && rule.rightKeywordId === b.keywordId) || (rule.rightKeywordId === a.keywordId && rule.leftKeywordId === b.keywordId)) && rule.sameCanonicalArgumentKeys.every(key => stableStringify(a.args[key]) === stableStringify(b.args[key])));
}
export function createClaim(input) {
  if (!record(input) || Object.keys(input).some(k => !["claimId","proposition","category","carrier","originEventId","question"].includes(k))) fail("claim fields");
  const {claimId,proposition,category,carrier,originEventId} = input;
  if (!string(claimId) || !string(originEventId)) fail("claim id/origin");
  if (validateKeywordAssertion(proposition).length) fail("claim proposition");
  if (!["ACTUAL","HYPOTHETICAL"].includes(proposition.scope)) fail("claim scope");
  if (!record(category) || Object.keys(category).sort().join() !== "categoryId,label" || !string(category.categoryId) || !string(category.label)) fail("claim category");
  if (!record(carrier) || !((Object.keys(carrier).join() === "actorId" && string(carrier.actorId)) || (Object.keys(carrier).sort().join() === "documentId,partId" && string(carrier.documentId) && string(carrier.partId)))) fail("claim carrier");
  const question = canonicalQuestion(proposition);
  if ("question" in input && input.question !== question) fail("authored question override");
  return freezeTree(detached({claimId,proposition,category,carrier,originEventId,question}));
}
export function deriveClaimRegistry(ledger) {
  return Object.fromEntries(ledger.claims.map(claim => [claim.claimId,createClaim(claim)]));
}
