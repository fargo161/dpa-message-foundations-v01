import { detached } from "./event-contract.mjs";

export const PROFILE_VERSION = "world-profile@0.1";
const cues = ["B", "A", "S", "E", "D"];
const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const fail = message => { throw new Error(`WORLD_PROFILE:${message}`); };

/** Fixed inputs, never subjective state. Player effectiveness is read only by landDelivery. */
export function validateProfiles(profiles) {
  if (!Array.isArray(profiles)) fail("profiles must be an array");
  const seen = new Set();
  for (const profile of profiles) {
    if (!record(profile) || profile.version !== PROFILE_VERSION || typeof profile.entityId !== "string" || !profile.entityId || seen.has(profile.entityId)) fail("identity/version");
    seen.add(profile.entityId);
    const allowed = profile.role === "PLAYER" ? ["version", "entityId", "role", "effectiveness"] : ["version", "entityId", "role", "recognizes", "reception", "policy", "variant"];
    if (Object.keys(profile).some(key => !allowed.includes(key))) fail("unexpected profile field");
    if (profile.role === "PLAYER") {
      if (profile.effectiveness !== undefined && (!record(profile.effectiveness) || Object.keys(profile.effectiveness).length !== cues.length || cues.some(cue => !Number.isFinite(profile.effectiveness[cue]) || profile.effectiveness[cue] < 0 || profile.effectiveness[cue] > 1))) fail("effectiveness");
    } else if (profile.role === "NPC") {
      if (!Array.isArray(profile.recognizes) || profile.recognizes.some(mark => typeof mark !== "string" || !mark) || new Set(profile.recognizes).size !== profile.recognizes.length) fail("recognizes");
      if (!record(profile.reception) || !record(profile.policy) || typeof profile.variant !== "string") fail("NPC policy/reception/variant");
    } else fail("role");
  }
  return true;
}

export function landDelivery(profile, { vibeId, intensity }) {
  validateProfiles([profile]);
  if (profile.role !== "PLAYER") fail("only player effectiveness supplies landed delivery");
  if (typeof vibeId !== "string" || vibeId.length !== 2 || vibeId[0] === vibeId[1] || [...vibeId].some(cue => !cues.includes(cue)) || !["SUBTLE", "BALANCED", "OVERT"].includes(intensity)) fail("delivery");
  const effectiveness = profile.effectiveness ?? Object.fromEntries(cues.map(cue => [cue, 1]));
  return (effectiveness[vibeId[0]] + effectiveness[vibeId[1]]) / 2;
}

export function neutralPlayerProfile(entityId = "player") {
  return detached({ version: PROFILE_VERSION, entityId, role: "PLAYER", effectiveness: Object.fromEntries(cues.map(cue => [cue, 1])) });
}
