import { canonicalQuestion } from "./claims.mjs";
import { detached } from "./event-contract.mjs";

export function projectWorld(ledger) {
  const view = {resources:{},obligations:{},possession:{},documents:{},activities:{},attitudes:{}};
  for (const event of ledger.events) {
    const p = event.payload;
    if (event.kind === "TRANSACTION") for (const effect of p.hardEffects) {
      if (effect.kind === "RESOURCE_DELTA") {
        view.resources[effect.holderId] ??= {};
        view.resources[effect.holderId][effect.resourceId] = (view.resources[effect.holderId][effect.resourceId] ?? 0) + effect.delta;
      } else {
        const {obligationId,kind: ignored,...value} = effect;
        view.obligations[obligationId] = detached(value);
      }
    }
    if (event.kind === "DOCUMENT_ISSUED") {
      view.documents[p.documentId] = detached({issuerId:p.issuerId,parts:p.parts});
      view.possession[p.documentId] = p.issuerId;
    }
    if (event.kind === "DOCUMENT_TRANSFERRED") view.possession[p.documentId] = p.toId;
    if (event.kind === "ACTIVITY_STARTED") view.activities[p.activityId] = detached(event);
    if (event.kind === "ACTIVITY_ENDED") delete view.activities[p.activityId];
    if (event.kind === "ATTITUDE_SET") {
      view.attitudes[p.holderId] ??= [];
      const key = canonicalQuestion(p.assertion);
      view.attitudes[p.holderId] = view.attitudes[p.holderId].filter(a => canonicalQuestion(a) !== key);
      view.attitudes[p.holderId].push(detached(p.assertion));
    }
  }
  return view;
}
