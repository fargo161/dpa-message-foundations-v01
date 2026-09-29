import { WORLD_SCHEMA_VERSION, eventIdFor, detached, freezeTree } from "./event-contract.mjs";
import { createClaim } from "./claims.mjs";
import { validateLedger } from "./event-validator.mjs";

export function createLedger({seed,entities}) {
  const ledger={schemaVersion:WORLD_SCHEMA_VERSION,seed:String(seed),entities:detached(entities),events:[],claims:[]};
  validateLedger(ledger);return freezeTree(ledger);
}
export function createEvent(ledger,kind,payload,options={}) {
  const seq=ledger.events.length+1+(options.offset??0);
  if(!Number.isSafeInteger(seq)||seq<1)throw new Error("WORLD_EVENT:invalid offset");
  for(const key of Object.keys(options))if(!["time","placeId","presentIds","observability","provenance","causedBy","commitGroup","offset"].includes(key))throw new Error(`WORLD_EVENT:unknown option ${key}`);
  return freezeTree(detached({eventId:eventIdFor(ledger.seed,seq),kind,seq,time:options.time??{at:"world-start"},placeId:options.placeId??ledger.entities.find(e=>e.type==="LOCATION")?.entityId,presentIds:options.presentIds??[],observability:options.observability??"PARTICIPANTS",provenance:options.provenance??{kind:"AUTHORED",sourceRef:"world-authoring"},causedBy:options.causedBy??null,commitGroup:options.commitGroup??null,payload}));
}
export function appendCommit(ledger,events,newClaims=[]) {
  validateLedger(ledger);
  if(!Array.isArray(events)||events.length===0)throw new Error("WORLD_COMMIT:empty events");
  if(events.length>1 && (events[0].commitGroup===null||events.some(e=>e.commitGroup!==events[0].commitGroup)))throw new Error("WORLD_COMMIT:compound group required");
  if(events[0].commitGroup!==null&&ledger.events.some(e=>e.commitGroup===events[0].commitGroup))throw new Error("WORLD_COMMIT:group already committed");
  const originIds=new Set(events.map(e=>e.eventId));
  if(newClaims.some(c=>!originIds.has(c.originEventId)))throw new Error("WORLD_COMMIT:claim origin outside commit");
  const next=detached({...ledger,events:[...ledger.events,...events],claims:[...ledger.claims,...newClaims.map(createClaim)]});
  validateLedger(next);return freezeTree(next);
}
