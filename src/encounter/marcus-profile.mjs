import { PRICE } from "./state.mjs";

const freeze = (value) => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

// Encounter reactions, not BASED cue weights or registry compatibility approvals.
// Each pair is [confidence, tension] for business, accountability, and probing.
export const PERSONALITY = freeze({
  name: "Marcus",
  description: "Practical, proud and guarded. Unpaid debt matters; credible terms and respectful directness help.",
  quirks: {
    final_say: { name: "Final say", welcomeTopic: "FINAL_SAY", unwelcomeTopic: "ENTITLEMENT", clue: "He relaxes when he has room to name his own terms." },
    plain_dealing: { name: "Plain dealing", welcomeTopic: "DEBT", unwelcomeTopic: "GUARANTEE", clue: "He listens more closely when the old debt and uncertain returns are named plainly." },
    recognition: { name: "Recognition", welcomeTopic: "RISK", unwelcomeTopic: "ENTITLEMENT", clue: "Acknowledging that it is his stock and money at risk gets his attention." },
  },
  policy: {
    price: PRICE, acceptThreshold: 22, counterThreshold: 4,
    maximumNewPrincipal: 180, maximumExposure: 650, maximumCreditDays: 14,
    minimumUpfrontShare: 0.2, counterUpfrontShare: 0.4,
    maximumTension: 82, positiveTurnBudget: 3,
    intensitySalience: { SUBTLE: 0.5, BALANCED: 1, OVERT: 1.5 },
  },
  reactions: {
    BA: { business: [-5, 7], accountability: [-4, 8], probing: [-3, 6], reading: "Rash opposition makes him guard the stock." },
    BS: { business: [-4, 6], accountability: [-5, 7], probing: [-3, 5], reading: "Provocation makes this feel like a performance at his expense." },
    BE: { business: [-3, 6], accountability: [-5, 8], probing: [-4, 7], reading: "Moral accusation puts him on the defensive." },
    BD: { business: [-7, 9], accountability: [-6, 8], probing: [-5, 8], reading: "Ambiguous leverage sounds coercive; it supplies no actual leverage." },
    AB: { business: [-5, 8], accountability: [-4, 7], probing: [-4, 6], reading: "The threatening advance makes him resist being rushed." },
    AS: { business: [2, 2], accountability: [-1, 3], probing: [-2, 4], reading: "Direction can organize a proposal, but ordering his answers grates." },
    AE: { business: [3, 1], accountability: [1, 2], probing: [0, 3], reading: "Recognizable stakes focus business; urgency does not improve his security." },
    AD: { business: [-5, 6], accountability: [-4, 5], probing: [-3, 4], reading: "Hustling makes him scrutinize the stated terms instead of hurrying." },
    SB: { business: [-1, 3], accountability: [-3, 5], probing: [0, 2], reading: "A little irreverence is easier to hear away from the unpaid account." },
    SA: { business: [3, -1], accountability: [0, 1], probing: [2, 0], reading: "Confident charm helps momentum, but cannot explain away debt." },
    SE: { business: [1, -2], accountability: [3, -3], probing: [2, -2], reading: "Sincere care settles the exchange more than it secures a loan." },
    SD: { business: [-2, 1], accountability: [-3, 2], probing: [0, 1], reading: "Gentle steering feels slippery when money is on the table." },
    EB: { business: [2, 2], accountability: [2, 1], probing: [0, 3], reading: "An understood but immovable position is clearer, and harder to bargain with." },
    EA: { business: [4, -1], accountability: [2, -2], probing: [1, 0], reading: "A clear limit or next step gives him something concrete to assess." },
    ES: { business: [0, -1], accountability: [2, -2], probing: [3, -2], reading: "Shared concerns open discussion; shared feeling is not shared financial risk." },
    ED: { business: [-3, 2], accountability: [-5, 4], probing: [-1, 1], reading: "Redirecting attention is especially unwelcome around existing debt." },
    DB: { business: [-6, 7], accountability: [-5, 6], probing: [-4, 5], reading: "A projected threat earns resistance, not belief in an unstated threat." },
    DA: { business: [-7, 6], accountability: [-6, 5], probing: [-5, 4], reading: "Concealed pursuit of weakness makes him protect his position." },
    DS: { business: [-3, 2], accountability: [-4, 3], probing: [-2, 1], reading: "Friendly implication leaves him wanting a straight question." },
    DE: { business: [-4, 2], accountability: [-5, 3], probing: [-3, 1], reading: "Performed understanding does not reassure him." },
  },
});

export function selectQuirk(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  return Object.keys(PERSONALITY.quirks)[hash % 3];
}
