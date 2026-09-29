import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { KEYWORDS,KEYWORD_BY_ID,validateKeywordDefinition } from "../src/keywords.mjs";
import { validateDocument } from "../src/schema-validator.mjs";
import { EVENT_KINDS } from "../src/world/event-contract.mjs";
import { createLedger,createEvent,appendCommit } from "../src/world/ledger.mjs";
import { validateLedger } from "../src/world/event-validator.mjs";
import { projectWorld } from "../src/world/projections.mjs";
import { createClaim,canonicalQuestion,assertionsConflict,validateWorldAssertion,deriveClaimRegistry } from "../src/world/claims.mjs";
import { entities,assertion,options,append,createAllKindsLedger } from "./helpers/world-kernel-fixture.mjs";

test("world vocabulary has versioned definitions and typed registered attributes",()=>{
  assert.equal(KEYWORDS.length,16);for(const k of KEYWORDS)assert.deepEqual(validateKeywordDefinition(k),[]);
  assert.equal(KEYWORD_BY_ID.get("HAS_ATTRIBUTE").valueSlot,"value");assert.equal(KEYWORD_BY_ID.get("ISSUED_BY").valueSlot,"object");
  for(const [attribute,value] of [["crates",6],["collection_place","gate_c"],["collection_window",{from:"07:00",until:"07:30"}],["docket","R-17"]])assert.equal(validateWorldAssertion(assertion("HAS_ATTRIBUTE",{subject:"intake",attribute,value}),entities),true);
  for(const [attribute,value] of [["mood","good"],["crates","6"],["crates",-1],["collection_place","cash"],["collection_window",{from:"08:00",until:"07:00"}],["docket",7]])assert.throws(()=>validateWorldAssertion(assertion("HAS_ATTRIBUTE",{subject:"intake",attribute,value}),entities));
  assert.throws(()=>validateWorldAssertion(assertion("ISSUED_BY",{subject:"doc",object:"missing"}),entities));
});
test("canonical questions derive values and foundation contradictions",()=>{
  const six=assertion("HAS_ATTRIBUTE",{subject:"intake",attribute:"crates",value:6});const eight=assertion("HAS_ATTRIBUTE",{subject:"intake",attribute:"crates",value:8});
  assert.equal(canonicalQuestion(six),canonicalQuestion(eight));assert.equal(assertionsConflict(six,eight),true);assert.equal(assertionsConflict(six,{...six,assertionId:"other"}),false);
  const trust=assertion("TRUSTS",{subject:"marcus",object:"player"});assert.equal(assertionsConflict(trust,{...trust,polarity:"NEGATED"}),true);
  assert.equal(assertionsConflict(assertion("PERMITTED",{subject:"marcus",object:"player",term:"checkin"}),assertion("PROHIBITED",{subject:"marcus",object:"player",term:"checkin"})),true);
  assert.throws(()=>createClaim({claimId:"wrong",proposition:six,category:{categoryId:"count",label:"Count"},carrier:{actorId:"marcus"},originEventId:"e",question:"manual override"}));
});
test("all thirteen closed event payloads and claims pass JSON schemas and replay",()=>{
  const ledger=createAllKindsLedger();assert.equal(validateLedger(ledger),true);assert.deepEqual(ledger.events.map(e=>e.kind),EVENT_KINDS);
  const eventSchema=JSON.parse(readFileSync(new URL("../schemas/world-event.schema.json",import.meta.url),"utf8"));
  const claimSchema=JSON.parse(readFileSync(new URL("../schemas/world-claim.schema.json",import.meta.url),"utf8"));
  for(const event of ledger.events){assert.deepEqual(validateDocument(event,eventSchema),[],event.kind);const bad=structuredClone(event);bad.payload.unexpected=true;assert.notEqual(validateDocument(bad,eventSchema).length,0);assert.throws(()=>validateLedger({...ledger,events:ledger.events.map(e=>e.eventId===bad.eventId?bad:e)}));}
  for(const claim of ledger.claims)assert.deepEqual(validateDocument(claim,claimSchema),[]);
  const replay=JSON.parse(JSON.stringify(ledger));assert.equal(validateLedger(replay),true);assert.deepEqual(projectWorld(replay),projectWorld(ledger));assert.deepEqual(deriveClaimRegistry(replay),deriveClaimRegistry(ledger));
});
test("ledger append is immutable deterministic and atomically rolls back a bad last event",()=>{
  const ledger=createAllKindsLedger();const before=JSON.stringify(ledger);
  const a=createEvent(ledger,"STATEMENT",{speakerId:"player",audienceIds:["marcus"],earshotIds:[],claimIds:[],resolution:"EXACT",delivery:{vibeId:"BA",intensity:"BALANCED",landed:1}},options({commitGroup:"atomic"}));
  const b=createEvent(ledger,"DOCUMENT_READ",{readerId:"marcus",documentId:"doc",parts:["body"]},options({commitGroup:"atomic",offset:1}));
  assert.throws(()=>appendCommit(ledger,[a,b]),/possession/);assert.equal(JSON.stringify(ledger),before);
  const one=appendCommit(ledger,[a]);assert.equal(JSON.stringify(ledger),before);assert.ok(Object.isFrozen(one.events));assert.throws(()=>one.events.push(a));
  assert.equal(JSON.stringify(createAllKindsLedger()),before);assert.throws(()=>appendCommit(one,[a]));
});
test("resources obligations possession activities and attitudes have only event authority",()=>{
  let ledger=createAllKindsLedger();const view=projectWorld(ledger);assert.equal(view.resources.player.cash,80);assert.equal(view.obligations.old_account.principal,250);assert.equal(view.possession.doc,"player");assert.deepEqual(view.activities,{});assert.equal(view.attitudes.marcus.length,1);
  ledger=append(ledger,"ATTITUDE_SET",{holderId:"marcus",assertion:assertion("TRUSTS",{subject:"marcus",object:"player"},{polarity:"NEGATED"})},{observability:"PRIVATE"});assert.equal(projectWorld(ledger).attitudes.marcus.length,1);assert.equal(projectWorld(ledger).attitudes.marcus[0].polarity,"NEGATED");
  assert.throws(()=>append(ledger,"ATTITUDE_SET",{holderId:"player",assertion:assertion("TRUSTS",{subject:"player",object:"marcus"})},{observability:"PRIVATE"}),/NPC/);
  assert.throws(()=>append(ledger,"OCCURRENCE",{actorId:"marcus",participants:[],objectIds:[],happened:[assertion("OWNS",{subject:"marcus",object:"contra",quantity:99})]}),/hard proposition/);
  assert.throws(()=>append(ledger,"ACTIVITY_STARTED",{activityId:"bad",actorId:"marcus",label:"Bad",holds:[assertion("NEEDS",{subject:"marcus",object:"cash"})]}),/attitude/);
  assert.throws(()=>append(ledger,"ACTIVITY_ENDED",{activityId:"closing",actorId:"marcus"}),/not active/);
});
test("event validator rejects presence part identity and negative hard balances",()=>{
  const ledger=createAllKindsLedger();
  assert.throws(()=>append(ledger,"DOCUMENT_READ",{readerId:"player",documentId:"doc",parts:["absent"]}),/unknown document part/);
  assert.throws(()=>append(ledger,"DOCUMENT_PRESENTED",{holderId:"player",documentId:"doc",parts:["body"],audienceIds:["marcus"],sightlineIds:["marcus"]},{presentIds:["player"]}),/not present/);
  assert.throws(()=>append(ledger,"TRANSACTION",{fromId:"player",toId:"marcus",hardEffects:[{kind:"RESOURCE_DELTA",holderId:"player",resourceId:"cash",delta:-81}]}),/balance/);
  assert.throws(()=>append(ledger,"TRANSACTION",{fromId:"player",toId:"marcus",hardEffects:[{kind:"RESOURCE_DELTA",holderId:"player",resourceId:"cash",delta:1}]},{provenance:{kind:"ENCOUNTER_TURN",sourceRef:"turn1"}}),/unbalanced/);
  const bad=structuredClone(ledger);bad.events[0].eventId="random";assert.throws(()=>validateLedger(bad),/identity/);
});
test("claims reject orphans duplicate IDs mismatched carriers and truth fields",()=>{
  const ledger=createAllKindsLedger();const bad=structuredClone(ledger);bad.claims[0].carrier.documentId="intake";assert.throws(()=>validateLedger(bad),/linkage/);
  assert.throws(()=>validateLedger({...ledger,claims:[...ledger.claims,ledger.claims[0]]}),/duplicate/);
  assert.throws(()=>validateLedger({...ledger,claims:ledger.claims.map(c=>({...c,truth:true}))}),/claim fields/);
  const statement=createEvent(ledger,"STATEMENT",{speakerId:"player",audienceIds:["marcus"],earshotIds:[],claimIds:["new"],resolution:"EXACT",delivery:{vibeId:"BA",intensity:"BALANCED",landed:1}},options());
  const claim={claimId:"new",proposition:assertion("HAS_ATTRIBUTE",{subject:"intake",attribute:"crates",value:5}),category:{categoryId:"record",label:"Record"},carrier:{actorId:"marcus"},originEventId:statement.eventId};assert.throws(()=>appendCommit(ledger,[statement],[claim]),/linkage/);
});
