/** Deliberately authored combinations, never a Cartesian or BASED lookup.
 * These forward-eye revisions are local implementation review candidates.
 * Owner production approval is separate; see FACE_REVIEW.md.
 */
export const FACE_SLOTS = Object.freeze(["left_brow", "right_brow", "left_eye", "right_eye", "mouth"]);
export const FACE_LAYER_ORDER = Object.freeze(["mouth", "right_eye", "left_eye", "right_brow", "left_brow"]);
export const SAFE_EYES = Object.freeze({ left_eye: "2eff921f4373", right_eye: "f1b2a234411e" });

function preset(id, brows, mouth, visibleCaption, base = false) {
  return Object.freeze({
    id,
    readiness: "LOCAL_VISUAL_REVIEW_CANDIDATE",
    visibleCaption,
    targets: Object.freeze({ left_brow: brows[0], right_brow: brows[1], left_eye: base ? null : SAFE_EYES.left_eye,
      right_eye: base ? null : SAFE_EYES.right_eye, mouth }),
  });
}

export const FACE_PRESETS = Object.freeze({
  COMPOSED_BASE: preset("COMPOSED_BASE", [null, null], null,
    "Both brows rest evenly; the eyes face forward and the mouth stays closed.", true),
  ATTENTIVE: preset("ATTENTIVE", ["eaf78aba4500", "17819208494c"], "d7539d5a444c",
    "The eyes face forward beneath level brows; a small closed smile appears."),
  LEANING_IN: preset("LEANING_IN", ["733593494a7c", "9a3e97194b21"], "ac828fd34c48",
    "Both brows lift above forward-looking eyes; the mouth holds a restrained smile."),
  WEIGHING_IT: preset("WEIGHING_IT", ["de7784334fed", "4fa0a4b148bb"], "f21caae74891",
    "Both brows arch upward; the eyes face forward and the mouth rounds slightly open."),
  GUARDED: preset("GUARDED", ["ceefa6b3492e", "67698d854967"], "6621b7ed4871",
    "Both brows flatten above forward-looking eyes; one corner of the mouth turns down."),
  DRAWING_BOUNDARY: preset("DRAWING_BOUNDARY", ["ceefa6b3492e", "ceb0aad442fe"], "d12c9e0046fb",
    "The brows form an uneven angle; the eyes face forward and one side of the mouth tenses."),
  READY_TO_AGREE: preset("READY_TO_AGREE", ["f7fe836846eb", "9d7b9872448a"], "f4da8539472a",
    "The brows settle level above forward-looking eyes; a small closed smile forms."),
  AGREEMENT_CLOSURE: preset("AGREEMENT_CLOSURE", ["ceefa6b3492e", "67698d854967"], "452baeec4abf",
    "The brows stay low above forward-looking eyes; the mouth opens into a broad toothy smile."),
  HEARING_TERMS: preset("HEARING_TERMS", ["f7fe836846eb", "9d7b9872448a"], null,
    "The eyes stay forward beneath level brows; the mouth remains closed."),
  DETAIL_RECEIVED: preset("DETAIL_RECEIVED", ["733593494a7c", "9a3e97194b21"], null,
    "Both brows rise; the eyes face forward while the mouth stays closed."),
  QUESTIONING: preset("QUESTIONING", ["050cabb84a37", "1011968143f6"], "a7c89e534711",
    "The inner brows rise above forward-looking eyes; the lips form a small rounded opening."),
  CONCERNED: preset("CONCERNED", ["ad9db06848b5", "d1f3bb9f4b10"], "eb848f5f4100",
    "The inner brows slope upward; the eyes face forward and the closed mouth turns down."),
  WARM_ACKNOWLEDGMENT: preset("WARM_ACKNOWLEDGMENT", ["f7fe836846eb", "9d7b9872448a"], "a08a9da64b16",
    "The brows rest level above forward-looking eyes; a small smile shows the teeth."),
});
