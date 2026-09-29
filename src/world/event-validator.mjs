import { EVENT_KINDS, ENTITY_TYPES, PAYLOAD_FIELDS, WORLD_SCHEMA_VERSION, HARD_KEYWORDS, ATTITUDE_KEYWORDS, eventIdFor, actorForEvent } from "./event-contract.mjs";
import { createClaim, validateWorldAssertion } from "./claims.mjs";
import { projectWorld } from "./projections.mjs";

const fail = message => { throw new Error(`WORLD_VALIDATION:${message}`); };
const record = v => v !== null && typeof v === "object" && !Array.isArray(v);
const string = v => typeof v === "string" && v.trim().length > 0;
const check = (condition,message) => { if (!condition) fail(message); };
const fields = (v,keys,optional=[]) => check(record(v) && keys.every(k=>Object.hasOwn(v,k)) && Object.keys(v).every(k=>keys.includes(k)||optional.includes(k)),`fields ${keys.join()}`);
const list = (v,label) => check(Array.isArray(v),`array ${label}`);
const ids = (v,label) => { list(v,label); check(v.every(string) && new Set(v).size === v.length,`ids ${label}`); };
const bounded = v => Number.isSafeInteger(v) && Math.abs(v) <= 1000000;

export function validateEvent(ledger,event,newClaims=[]) {
  fields(event,["eventId","kind","seq","time","placeId","presentIds","observability","provenance","causedBy","commitGroup","payload"]);
  check(EVENT_KINDS.includes(event.kind),"event kind");
  check(event.seq === ledger.events.length+1 && event.eventId === eventIdFor(ledger.seed,event.seq),"event identity/order");
  check(!ledger.events.some(e=>e.eventId===event.eventId),"duplicate event");
  const time=event.time;
  check(record(time),"time");
  if (Object.hasOwn(time,"at")) { fields(time,["at"]); check(string(time.at),"time at"); }
  else { fields(time,["windowFrom","windowUntil"]); check(string(time.windowFrom)&&string(time.windowUntil)&&time.windowFrom<time.windowUntil,"time window"); }
  fields(event.provenance,["kind","sourceRef"]);
  check(["AUTHORED","BACKSTORY","SEED","ENCOUNTER_TURN"].includes(event.provenance.kind)&&string(event.provenance.sourceRef),"provenance");
  check(event.causedBy === null || string(event.causedBy),"causedBy");
  if (event.causedBy?.startsWith("world:")) check(ledger.events.some(e=>e.eventId===event.causedBy),"causedBy missing prior event");
  check(event.commitGroup===null || string(event.commitGroup),"commitGroup");
  check(["PARTICIPANTS","PRESENT","PRIVATE"].includes(event.observability),"observability");
  const entities=new Map(ledger.entities.map(e=>[e.entityId,e]));
  const ref=(id,types=null)=>{check(string(id)&&entities.has(id),`entity ${id}`); if(types)check(types.includes(entities.get(id).type),`entity type ${id}`);};
  const actor=id=>ref(id,["ACTOR"]);
  ref(event.placeId,["LOCATION"]); ids(event.presentIds,"presentIds"); event.presentIds.forEach(actor);
  const present=id=>{actor(id);check(event.presentIds.includes(id),`not present ${id}`);};
  const subset=(v,label)=>{ids(v,label);v.forEach(present);};
  const p=event.payload; fields(p,PAYLOAD_FIELDS[event.kind]);
  const prior=projectWorld(ledger);
  const claimMap=new Map([...ledger.claims,...newClaims].map(c=>[c.claimId,c]));
  const newClaimIds=new Set();
  for(const raw of newClaims){const claim=createClaim(raw);validateWorldAssertion(claim.proposition,ledger.entities);check(claim.originEventId===event.eventId&&!ledger.claims.some(c=>c.claimId===claim.claimId)&&!newClaimIds.has(claim.claimId),"new claim origin/duplicate");newClaimIds.add(claim.claimId);if(event.kind==="STATEMENT")check(claim.carrier.actorId===p.speakerId&&p.claimIds.includes(claim.claimId),"new statement claim linkage");else if(event.kind==="DOCUMENT_ISSUED")check(claim.carrier.documentId===p.documentId&&p.parts.some(part=>part.partId===claim.carrier.partId&&part.claimIds.includes(claim.claimId)),"new document claim linkage");else fail("new claim origin kind");}
  const claims=v=>{ids(v,"claimIds");v.forEach(id=>check(claimMap.has(id),`missing claim ${id}`));};
  const assertion=(a,actual=false)=>{validateWorldAssertion(a,ledger.entities);if(actual)check(a.scope==="ACTUAL","actual assertion scope");};
  const nonHard=a=>{assertion(a,true);check(!HARD_KEYWORDS.includes(a.keywordId),"hard proposition outside transaction");};
  if(event.kind==="OCCURRENCE") {
    present(p.actorId); list(p.participants,"participants"); const seen=new Set();
    for(const participant of p.participants){fields(participant,["entityId","access"]);present(participant.entityId);if(participant.access!=="ALL")ids(participant.access,"participant access");check(!seen.has(participant.entityId),"duplicate participant");seen.add(participant.entityId);}
    ids(p.objectIds,"objectIds");p.objectIds.forEach(id=>ref(id));list(p.happened,"happened");p.happened.forEach(nonHard);
    check(new Set(p.happened.map(a=>a.assertionId)).size===p.happened.length,"duplicate happened assertion");
    for(const participant of p.participants)if(participant.access!=="ALL")check(participant.access.every(id=>p.happened.some(a=>a.assertionId===id)),"access must name happened assertionIds");
    check(!p.happened.some(a=>ATTITUDE_KEYWORDS.includes(a.keywordId)),"attitudes require ATTITUDE_SET");
  }
  if(event.kind==="TRANSACTION") {
    present(p.fromId);present(p.toId);list(p.hardEffects,"hardEffects");check(p.hardEffects.length>0,"empty hardEffects");
    const balances=prior.resources;
    for(const effect of p.hardEffects){
      if(effect.kind==="RESOURCE_DELTA") {fields(effect,["kind","holderId","resourceId","delta"]);actor(effect.holderId);ref(effect.resourceId,["RESOURCE","OBJECT"]);check(bounded(effect.delta),"delta");check([p.fromId,p.toId].includes(effect.holderId),"effect holder not participant");balances[effect.holderId]??={};const amount=(balances[effect.holderId][effect.resourceId]??0)+effect.delta;check(bounded(amount)&&amount>=0,"negative/overflow resource balance");balances[effect.holderId][effect.resourceId]=amount;}
      else {fields(effect,["kind","obligationId","debtorId","creditorId","principal","extra","days","status"]);check(effect.kind==="OBLIGATION_SET","effect kind");ref(effect.obligationId,["OBLIGATION"]);actor(effect.debtorId);actor(effect.creditorId);check(effect.debtorId!==effect.creditorId,"self obligation");check(bounded(effect.principal)&&effect.principal>=0&&bounded(effect.extra)&&effect.extra>=0,"obligation amount");check(effect.days===null||(Number.isSafeInteger(effect.days)&&effect.days>=1&&effect.days<=36500),"obligation days");check(["OPEN","FULFILLED","CANCELLED"].includes(effect.status),"obligation status");check([p.fromId,p.toId].includes(effect.debtorId)&&[p.fromId,p.toId].includes(effect.creditorId),"obligation parties");}
    }
    if(event.provenance.kind==="ENCOUNTER_TURN") { const totals={};for(const e of p.hardEffects)if(e.kind==="RESOURCE_DELTA")totals[e.resourceId]=(totals[e.resourceId]??0)+e.delta;check(Object.values(totals).every(v=>v===0),"unbalanced live transaction"); }
  }
  if(event.kind==="DOCUMENT_ISSUED") {
    present(p.issuerId);ref(p.documentId,["OBJECT"]);check(!prior.documents[p.documentId],"document reissued");list(p.parts,"document parts");check(p.parts.length>0,"empty document");const partIds=new Set();
    for(const part of p.parts){fields(part,["partId","claimIds","authenticating"],["markId"]);check(string(part.partId)&&!partIds.has(part.partId),"part id");partIds.add(part.partId);check(typeof part.authenticating==="boolean","authenticating");check(part.authenticating?string(part.markId):!Object.hasOwn(part,"markId"),"markId");claims(part.claimIds);for(const id of part.claimIds){const c=claimMap.get(id);check(c.originEventId===event.eventId&&c.carrier.documentId===p.documentId&&c.carrier.partId===part.partId,"document claim carrier");}}
  }
  if(["DOCUMENT_TRANSFERRED","DOCUMENT_READ","DOCUMENT_PRESENTED"].includes(event.kind)) {
    ref(p.documentId,["OBJECT"]);check(prior.documents[p.documentId],"document not issued");
    const holder=p.fromId??p.readerId??p.holderId;present(holder);check(prior.possession[p.documentId]===holder,"document possession");
    if(event.kind==="DOCUMENT_TRANSFERRED")present(p.toId);
    else {ids(p.parts,"parts");check(p.parts.length>0,"empty read");p.parts.forEach(id=>check(prior.documents[p.documentId].parts.some(part=>part.partId===id),"unknown document part"));}
    if(event.kind==="DOCUMENT_PRESENTED"){subset(p.audienceIds,"audienceIds");subset(p.sightlineIds,"sightlineIds");}
  }
  if(event.kind==="STATEMENT") {
    present(p.speakerId);subset(p.audienceIds,"audienceIds");subset(p.earshotIds,"earshotIds");claims(p.claimIds);check(["EXACT","CATEGORY"].includes(p.resolution),"resolution");fields(p.delivery,["vibeId","intensity","landed"]);check(string(p.delivery.vibeId)&&["SUBTLE","BALANCED","OVERT"].includes(p.delivery.intensity)&&Number.isFinite(p.delivery.landed)&&p.delivery.landed>=0,"delivery");
    for(const id of p.claimIds){const c=claimMap.get(id);if(c.originEventId===event.eventId)check(c.carrier.actorId===p.speakerId,"statement carrier");}
  }
  if(event.kind==="COMMITMENT_MADE") {check(string(p.commitmentId)&&!ledger.events.some(e=>e.kind==="COMMITMENT_MADE"&&e.payload.commitmentId===p.commitmentId),"commitment id");present(p.promisorId);present(p.promiseeId);check(Object.hasOwn(time,"windowFrom"),"commitment window");assertion(p.assertion,true);check(p.assertion.keywordId==="PROMISED_TO"&&p.assertion.args.subject===p.promisorId&&p.assertion.args.object===p.promiseeId,"commitment assertion");}
  if(event.kind==="COMMITMENT_WINDOW_CLOSED") {const made=ledger.events.find(e=>e.kind==="COMMITMENT_MADE"&&e.payload.commitmentId===p.commitmentId);check(made&&!ledger.events.some(e=>e.kind==="COMMITMENT_WINDOW_CLOSED"&&e.payload.commitmentId===p.commitmentId),"commitment not open");list(p.parties,"parties");check(p.parties.length===2&&new Set(p.parties.map(x=>x.entityId)).size===2,"commitment parties");for(const party of p.parties){fields(party,["entityId","attendance"]);check([made.payload.promisorId,made.payload.promiseeId].includes(party.entityId)&&["PRESENT","ABSENT"].includes(party.attendance),"attendance");if(party.attendance==="PRESENT")present(party.entityId);else check(!event.presentIds.includes(party.entityId),"absent party present");}check(typeof p.kept==="boolean","kept");}
  if(event.kind==="ACTIVITY_STARTED") {present(p.actorId);check(string(p.activityId)&&string(p.label)&&!ledger.events.some(e=>e.kind==="ACTIVITY_STARTED"&&e.payload.activityId===p.activityId),"activity id/label");list(p.holds,"holds");p.holds.forEach(a=>{nonHard(a);check(!ATTITUDE_KEYWORDS.includes(a.keywordId),"activity attitude");});}
  if(event.kind==="ACTIVITY_ENDED") {present(p.actorId);check(prior.activities[p.activityId]?.payload.actorId===p.actorId,"activity not active/owner");}
  if(event.kind==="ATTITUDE_SET") {present(p.holderId);check(entities.get(p.holderId).role==="NPC"&&event.observability==="PRIVATE","NPC private attitude only");assertion(p.assertion,true);check(ATTITUDE_KEYWORDS.includes(p.assertion.keywordId)&&p.assertion.args.subject===p.holderId,"attitude assertion");}
  if(event.kind==="ENCOUNTER_CLOSED") {check(string(p.encounterId),"encounterId");subset(p.participantIds,"participantIds");check(["AGREED","WITHDRAWN","ENDED"].includes(p.outcome),"outcome");check(event.observability!=="PRIVATE","actorless PRIVATE event");}
  if(event.observability==="PRIVATE")check(actorForEvent(ledger,event)!==null,"PRIVATE actor");
  return true;
}

export function validateLedger(ledger) {
  fields(ledger,["schemaVersion","seed","entities","events","claims"]);check(ledger.schemaVersion===WORLD_SCHEMA_VERSION&&string(ledger.seed),"ledger version/seed");list(ledger.entities,"entities");list(ledger.events,"events");list(ledger.claims,"claims");
  const entityIds=new Set();for(const entity of ledger.entities){fields(entity,["entityId","type"],["role"]);check(string(entity.entityId)&&!entityIds.has(entity.entityId)&&ENTITY_TYPES.includes(entity.type),"entity registry");check(!["__proto__","constructor","prototype"].includes(entity.entityId),"unsafe entity id");entityIds.add(entity.entityId);if(entity.role!==undefined)check(entity.type==="ACTOR"&&["PLAYER","NPC"].includes(entity.role),"entity role");}
  const claimIds=new Set();for(const raw of ledger.claims){const claim=createClaim(raw);check(!claimIds.has(claim.claimId),"duplicate claim");claimIds.add(claim.claimId);validateWorldAssertion(claim.proposition,ledger.entities);const origin=ledger.events.find(e=>e.eventId===claim.originEventId);check(origin&&["STATEMENT","DOCUMENT_ISSUED"].includes(origin.kind),"orphan claim");if(origin.kind==="STATEMENT")check(origin.payload.speakerId===claim.carrier.actorId&&origin.payload.claimIds.includes(claim.claimId),"origin statement linkage");else check(origin.payload.documentId===claim.carrier.documentId&&origin.payload.parts.some(p=>p.partId===claim.carrier.partId&&p.claimIds.includes(claim.claimId)),"origin document linkage");}
  const replay={...ledger,events:[],claims:[]};const closedGroups=new Set();let currentGroup=null;
  for(const event of ledger.events){if(event.commitGroup!==currentGroup){if(currentGroup!==null)closedGroups.add(currentGroup);check(!closedGroups.has(event.commitGroup),"noncontiguous commitGroup");currentGroup=event.commitGroup;}const newClaims=ledger.claims.filter(c=>c.originEventId===event.eventId);validateEvent(replay,event,newClaims);replay.events.push(event);replay.claims.push(...newClaims);}
  return true;
}
