import { createLedger,createEvent,appendCommit } from "../../src/world/ledger.mjs";
import { createClaim } from "../../src/world/claims.mjs";
export const entities=[{entityId:"player",type:"ACTOR",role:"PLAYER"},{entityId:"marcus",type:"ACTOR",role:"NPC"},{entityId:"room",type:"LOCATION"},{entityId:"gate_c",type:"LOCATION"},{entityId:"cash",type:"RESOURCE"},{entityId:"contra",type:"RESOURCE"},{entityId:"doc",type:"OBJECT"},{entityId:"intake",type:"OBJECT"},{entityId:"old_account",type:"OBLIGATION"},{entityId:"checkin",type:"ACTION"}];
export function assertion(keywordId,args,overrides={}) {return {assertionId:`assertion:${keywordId}`,keywordId,args,scope:"ACTUAL",polarity:"ASSERTED",status:"ACTIVE",contextIds:[],validFrom:"2026-09-01T00:00:00Z",validUntil:null,provenance:{sourceId:"kernel-fixture",sourceVersion:"1",sourceRecordId:keywordId,transformVersion:"1",licenseId:"PROJECT_AUTHORED"},...overrides};}
export function options(extra={}) {return {placeId:"room",presentIds:["player","marcus"],time:{at:"today"},...extra};}
export function append(ledger,kind,payload,opts={},claims=[]) {const event=createEvent(ledger,kind,payload,options(opts));return appendCommit(ledger,[event],claims.map(c=>({...c,originEventId:event.eventId})));}
export function createAllKindsLedger() {
  let ledger=createLedger({seed:"kernel-fixture",entities});
  ledger=append(ledger,"OCCURRENCE",{actorId:"marcus",participants:[{entityId:"player",access:"ALL"},{entityId:"marcus",access:"ALL"}],objectIds:["intake"],happened:[assertion("HAS_ATTRIBUTE",{subject:"intake",attribute:"crates",value:6})]});
  ledger=append(ledger,"TRANSACTION",{fromId:"marcus",toId:"player",hardEffects:[{kind:"RESOURCE_DELTA",holderId:"player",resourceId:"cash",delta:80},{kind:"RESOURCE_DELTA",holderId:"marcus",resourceId:"contra",delta:8},{kind:"OBLIGATION_SET",obligationId:"old_account",debtorId:"player",creditorId:"marcus",principal:250,extra:0,days:null,status:"OPEN"}]});
  const issue=createEvent(ledger,"DOCUMENT_ISSUED",{issuerId:"marcus",documentId:"doc",parts:[{partId:"header",claimIds:["issued"],authenticating:true,markId:"depot_mark"},{partId:"body",claimIds:["count"],authenticating:false}]},options());
  const make=(claimId,partId,proposition)=>createClaim({claimId,proposition,category:{categoryId:"record",label:"Intake record"},carrier:{documentId:"doc",partId},originEventId:issue.eventId});
  ledger=appendCommit(ledger,[issue],[make("issued","header",assertion("ISSUED_BY",{subject:"doc",object:"marcus"})),make("count","body",assertion("HAS_ATTRIBUTE",{subject:"intake",attribute:"crates",value:6}))]);
  ledger=append(ledger,"DOCUMENT_TRANSFERRED",{documentId:"doc",fromId:"marcus",toId:"player"});
  ledger=append(ledger,"DOCUMENT_READ",{readerId:"player",documentId:"doc",parts:["header","body"]});
  ledger=append(ledger,"DOCUMENT_PRESENTED",{holderId:"player",documentId:"doc",parts:["header"],audienceIds:["marcus"],sightlineIds:[]});
  ledger=append(ledger,"STATEMENT",{speakerId:"player",audienceIds:["marcus"],earshotIds:[],claimIds:["count"],resolution:"CATEGORY",delivery:{vibeId:"BA",intensity:"BALANCED",landed:1}});
  ledger=append(ledger,"COMMITMENT_MADE",{commitmentId:"meeting",promisorId:"player",promiseeId:"marcus",assertion:assertion("PROMISED_TO",{subject:"player",object:"marcus",term:"checkin"})},{time:{windowFrom:"09:00",windowUntil:"10:00"}});
  ledger=append(ledger,"COMMITMENT_WINDOW_CLOSED",{commitmentId:"meeting",parties:[{entityId:"player",attendance:"ABSENT"},{entityId:"marcus",attendance:"PRESENT"}],kept:false},{presentIds:["marcus"]});
  ledger=append(ledger,"ACTIVITY_STARTED",{activityId:"closing",actorId:"marcus",label:"Closing ledger",holds:[]},{observability:"PRIVATE"});
  ledger=append(ledger,"ACTIVITY_ENDED",{activityId:"closing",actorId:"marcus"});
  ledger=append(ledger,"ATTITUDE_SET",{holderId:"marcus",assertion:assertion("TRUSTS",{subject:"marcus",object:"player"})},{observability:"PRIVATE"});
  ledger=append(ledger,"ENCOUNTER_CLOSED",{encounterId:"fixture",participantIds:["player","marcus"],outcome:"ENDED"});
  return ledger;
}
