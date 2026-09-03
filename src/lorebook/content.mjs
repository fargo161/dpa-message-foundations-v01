import {
  CROSS_KEYWORD_RULES,
  CONTRADICTION_RULES,
  KEYWORDS,
  KEYWORD_BY_ID,
  SCHEMA_VERSION,
} from "../keywords.mjs";
import { ACTION_BY_ID } from "../mechanics.mjs";
import { BASED_CUES, BASED_VIBES, DELIVERY_INTENSITIES } from "../based.mjs";
import { renderKeywordIllustration } from "./illustrations.mjs";

/**
 * Structured source for the Trapstar Human Logic Field Guide.
 *
 * This module is content, not runtime lore. It deliberately keeps
 * project-authored explanations, external research priors, and commentary
 * in separate fields so a renderer cannot mistake one class for another.
 */

export const LOREBOOK_CONTENT_SCHEMA_VERSION = "trapstar-lorebook-content@0.1";
export const LOREBOOK_SCHEMA_VERSION = "dpa-lorebook@0.1";
export const LOREBOOK_TITLE = "THE TRAPSTAR FIELD GUIDE TO HUMAN LOGIC";
export const LOREBOOK_SUBTITLE = "A practical catalogue of what people want, what they claim to want, and what they are likely to do about the difference.";

export const RELATIONSHIP_TYPES = Object.freeze([
  "enables",
  "depends_on",
  "blocks",
  "contradicts",
  "intensifies",
  "reduces",
  "reveals",
  "conceals",
  "substitutes_for",
  "commonly_co_occurs_with",
]);

export const RELATIONSHIP_DIRECTION_RULES = Object.freeze({
  enables: "OUTBOUND_FROM_THIS_TERM",
  depends_on: "OUTBOUND_FROM_THIS_TERM",
  blocks: "OUTBOUND_FROM_THIS_TERM",
  contradicts: "BIDIRECTIONAL_BY_EXPLICIT_RULE",
  intensifies: "OUTBOUND_FROM_THIS_TERM",
  reduces: "OUTBOUND_FROM_THIS_TERM",
  reveals: "OUTBOUND_FROM_THIS_TERM",
  conceals: "OUTBOUND_FROM_THIS_TERM",
  substitutes_for: "OUTBOUND_FROM_THIS_TERM",
  commonly_co_occurs_with: "CO_OCCURRENCE_ONLY",
});

export const EVIDENCE_SOURCES = Object.freeze({
  "project-keyword-core": {
    title: "Repository keyword definitions and mechanics contract",
    status: "PROJECT_AUTHORED",
    sourceVersion: "0.1",
    licenseId: "PROJECT_AUTHORED",
    redistributionPolicy: "REPOSITORY_SCOPE_ONLY",
    evidenceBoundary: "Canonical repository evidence. This source establishes the keyword definition, typed arguments, affordances, blockers, and provenance policy.",
  },
  "based-foundation": {
    title: "BASED cues, ordered Vibes, and delivery intensities",
    status: "PROJECT_AUTHORED",
    sourceVersion: "BASED_MESSAGE_BUILDER_180_TPL_MATRIX_V01",
    licenseId: "PROJECT_AUTHORED",
    redistributionPolicy: "REPOSITORY_SCOPE_ONLY",
    evidenceBoundary: "Presentation-coordinate foundation only. It does not create semantic facts or numeric cue mixtures.",
  },
  "atomic-2020": {
    title: "ATOMIC 2020",
    status: "ACQUIRED_AND_INDEXED",
    sourceVersion: "atomic2020_data-feb2021",
    licenseId: "CC-BY-UNVERSIONED",
    redistributionPolicy: "REFERENCE_ONLY",
    evidenceBoundary: "External evidence/prior only. No ATOMIC record is copied into this content source or promoted into mechanics, BASED, TPL, or runtime dialogue.",
  },
  "social-chemistry-101": {
    title: "Social Chemistry 101",
    status: "ACQUIRED_AND_INDEXED",
    sourceVersion: "v1.0",
    licenseId: "CC-BY-SA-4.0",
    redistributionPolicy: "REFERENCE_ONLY",
    evidenceBoundary: "External evidence/prior only. User-generated material and worker annotations remain subject to separate rights and review.",
  },
  "moral-stories": {
    title: "Moral Stories",
    status: "ACQUIRED_AND_INDEXED",
    sourceVersion: "main@329b83476b07d389ea035b98dddd876540519207",
    licenseId: "MIT",
    redistributionPolicy: "REFERENCE_ONLY",
    evidenceBoundary: "External evidence/prior only. Moral labels do not define mechanics or outcomes.",
  },
  "stanford-politeness-wikipedia": {
    title: "Stanford Politeness Corpus — Wikipedia",
    status: "ACQUIRED_AND_INDEXED",
    sourceVersion: "ConvoKit@1",
    licenseId: "CC-BY-4.0",
    redistributionPolicy: "REFERENCE_ONLY",
    evidenceBoundary: "External presentation-language prior only. It does not authorize copying utterances into runtime dialogue.",
  },
  "stanford-politeness-stack-exchange": {
    title: "Stanford Politeness Corpus — Stack Exchange",
    status: "ACQUIRED_AND_INDEXED",
    sourceVersion: "ConvoKit@1",
    licenseId: "CC-BY-4.0",
    redistributionPolicy: "REFERENCE_ONLY",
    evidenceBoundary: "External presentation-language prior only. It does not authorize copying utterances into runtime dialogue.",
  },
  casino: {
    title: "CaSiNo: Campsite Negotiation Dialogues",
    status: "ACQUIRED_AND_INDEXED",
    sourceVersion: "ConvoKit@1",
    licenseId: "CC-BY-4.0",
    redistributionPolicy: "REFERENCE_ONLY",
    evidenceBoundary: "External negotiation-language prior only. Demographics, preferences, and outcomes do not become runtime semantics.",
  },
  "persuasion-for-good": {
    title: "PersuasionForGood",
    status: "ACQUIRED_AND_INDEXED",
    sourceVersion: "master@90a3fd7b",
    licenseId: "APACHE-2.0",
    redistributionPolicy: "REFERENCE_ONLY",
    evidenceBoundary: "External persuasion-language prior only. It does not approve TPL protocols or populate dialogue.",
  },
  "tpl-ontology-luangrath-peck-barger": {
    title: "Textual Paralanguage and its Implications for Marketing Communications",
    status: "ACQUIRED_NOT_INDEXED",
    sourceVersion: "arXiv:1605.06799",
    licenseId: "PAPER_CONCEPTUAL_REFERENCE",
    redistributionPolicy: "REFERENCE_ONLY",
    evidenceBoundary: "Research authority only. The underlying social-media corpus is not claimed available or reusable.",
  },
});

const ACTION_NOTES = Object.freeze({
  REQUEST_EXTENSION: "Ask for a changed repayment deadline while preserving the authored obligation as the subject of the request.",
  OFFER_PARTIAL_PAYMENT: "Offer the authored partial cash resource in exchange for partial satisfaction of the debt term.",
  OFFER_CASH_FOR_EXTENSION: "Offer the authored cash resource in exchange for an authored repayment-deadline change.",
  REQUEST_ACCESS: "Ask for access to a controlled channel; permission and prohibition remain separate checks.",
  TRADE_INFORMATION: "Offer authored scoped information in exchange for the authored return shape; no disclosure is invented.",
  INVOKE_CONSEQUENCE: "Invoke only a fully linked, active, authored pressure contract; fear alone is insufficient.",
  CHALLENGE_DEBT_VALIDITY: "Ask to review a debt claim when the actor's conflicting belief and the relevant claim are authored.",
  REQUEST_EVIDENCE: "Ask for evidence about an authored knowledge claim without converting belief into actual truth.",
  REQUEST_SUPPORT: "Ask a trusted dependency provider for support; dependence does not force compliance.",
});

const relationship = (targetKeywordId, type, condition, note) => ({
  targetKeywordId,
  type,
  direction: RELATIONSHIP_DIRECTION_RULES[type],
  condition,
  note,
  status: "PROJECT_AUTHORED",
});

const evidence = (sourceId, claimScope, sourceRecordId = null) => {
  const source = EVIDENCE_SOURCES[sourceId];
  if (!source) throw new Error(`Unknown lorebook evidence source: ${sourceId}`);
  return {
    sourceId,
    sourceVersion: source.sourceVersion,
    sourceRecordId,
    status: source.status,
    licenseId: source.licenseId,
    redistributionPolicy: source.redistributionPolicy,
    claimScope,
    runtimeEligible: false,
  };
};

const canonicalActionConnections = (definition) => Object.entries(definition.possibleAffordances)
  .flatMap(([macroAct, actionIds]) => actionIds.map((actionId) => {
    const action = ACTION_BY_ID.get(actionId);
    const macroActMatches = !action || action.macroAct === macroAct;
    return {
      actionId,
      displayName: action?.displayName ?? actionId,
      macroAct,
      actualMacroAct: action?.macroAct ?? null,
      support: !macroActMatches
        ? "CANONICAL_AFFORDANCE_MACRO_MISMATCH"
        : action
          ? "CANONICAL_AFFORDANCE"
          : "CANONICAL_AFFORDANCE_UNIMPLEMENTED",
      implementationStatus: !macroActMatches
        ? "BLOCKED_CANONICAL_MACRO_MISMATCH"
        : action
          ? "IMPLEMENTED"
          : "NOT_IN_CURRENT_ACTION_DEFINITIONS",
      note: !macroActMatches
        ? `The keyword definition places this affordance under ${macroAct}, but the current action registry declares ${action.macroAct}; it is documented for repair and is not presented as a supported runtime path.`
        : action?.displayName
        ? ACTION_NOTES[actionId]
        : "The canonical keyword definition names this affordance, but the current action registry does not implement it; no runtime action is implied.",
      boundary: "An affordance is a candidate mechanic path. Availability still requires the action's authored checks, active context, temporal validity, and blockers.",
    };
  }));

const basedConnection = (vibeIds, cueReading) => {
  const vibeById = new Map(BASED_VIBES.map((entry) => [entry.vibeId, entry]));
  const cueById = new Map(BASED_CUES.map((entry) => [entry.cueId, entry]));
  const vibes = vibeIds.map((vibeId) => {
    const vibe = vibeById.get(vibeId);
    if (!vibe) throw new Error(`Unknown BASED Vibe ${vibeId}`);
    return {
      vibeId: vibe.vibeId,
      name: vibe.name,
      primaryCue: vibe.primaryCue,
      secondaryCue: vibe.secondaryCue,
      reading: `${vibe.fusionLogic} Editorially, this makes the keyword legible as a presentation emphasis, not a new fact.`,
      status: "EDITORIAL_INTERPRETATION",
    };
  });
  const cues = [...new Set(vibes.flatMap((vibe) => [vibe.primaryCue, vibe.secondaryCue]))].map((cueId) => ({
    cueId,
    name: cueById.get(cueId).name,
    reading: cueReading,
    status: "EDITORIAL_INTERPRETATION",
  }));
  const intensities = Object.fromEntries(DELIVERY_INTENSITIES.map((intensity) => [intensity, {
    signal: intensity === "SUBTLE"
      ? "The same fact is signaled with low visibility and more room for refusal."
      : intensity === "BALANCED"
        ? "The same fact is signaled clearly without changing its force or content."
        : "The same fact is made highly visible; it still cannot add a threat, promise, deadline, or knowledge claim.",
    semanticEffect: "NONE",
    status: "PROJECT_AUTHORED_BOUNDARY",
  }]));
  return {
    cues,
    vibes,
    intensities,
    invariant: "BASED governs interpersonal attitude and intensity governs visibility/force. Neither rewrites semantic facts, action slots, truth scope, or knowledge boundaries.",
  };
};

const illustration = (symbol, materialStake, transition, altText) => ({
  system: "TRAPSTAR_FIELD_GUIDE_ILLUSTRATION",
  grammarVersion: "trapstar-svg-grammar@0.1",
  viewBox: "0 0 640 360",
  strokeLanguage: "2px ink line, directional arrow, one evidence-red accent, one nicotine-gold stake",
  elements: [
    { role: "actor_node", label: "ACTOR" },
    { role: "target_node", label: "TARGET" },
    { role: "material_stake", label: materialStake },
    { role: "directional_transition", label: transition },
    { role: "keyword_symbol", label: symbol },
  ],
  altText,
  accessibility: "The SVG must repeat the actor, target, stake, and directional transition in text; color is never the only signal.",
});

const ARTICLE_SPECS = {
  OWNS: {
    streetDefinition: "Ownership is the recorded right to call an asset yours, even when the keys, cash, or immediate access are somewhere else.",
    technicalMechanicNote: "The subject is an OWNER and the object is an ASSET_OR_RESOURCE; possession and control are deliberately separate concepts.",
    whatThisChanges: "It makes a resource claim available to ownership-sensitive checks and can support a deal or an access request. It does not automatically open a door or move the resource.",
    mechanics: {
      inputs: ["subject actor", "object resource, object, or location", "optional quantity and unit", "active actual-scope assertion"],
      preconditions: ["The OWNS assertion validates against its typed arguments.", "Its context is selected and active when a mechanic consumes it.", "validFrom has arrived; validUntil is null or has not been reached."],
      stateChanges: ["No state changes merely because the assertion is read.", "A supported ownership transfer action may append OWNERSHIP_TRANSFERRED history."],
      outputs: ["An attributed ownership fact for deterministic checks.", "A possible DEAL affordance for partial payment or an ASK affordance for access."],
      blockers: ["ownership_expired", "explicit_transfer", "belief-only or disputed ownership", "control or permission requirements that are absent"],
    },
    materialRelationships: { actors: "owner", targets: "asset, resource, or place", objectsResources: "owned asset", ownership: "the keyword itself", obligations: "may coexist with debt", permissions: "does not imply permission", scarcity: "only when authored", deadlines: "only when authored", consequences: "none by itself", leverage: "possible only through an authored basis" },
    emotionalLeverage: { threatens: "loss of an owned stake", protects: "the owner's claim", offers: "a bounded transfer or resource deal", exposes: "the difference between title and access", repairs: "a conflict by separating ownership from possession" },
    relationships: [
      relationship("CONTROLS", "commonly_co_occurs_with", "Only where the same authored situation separately grants access authority.", "Ownership and control often appear together, but the source definition explicitly does not equate them."),
      relationship("PERMITTED", "commonly_co_occurs_with", "Only where a separate permission assertion exists.", "An owner may grant permission; ownership does not manufacture the grant."),
      relationship("NEEDS", "commonly_co_occurs_with", "The owner or another actor may separately need the asset or a state.", "A resource can be owned without being needed."),
    ],
    based: ["AS", "EA", "SD"],
    cueReading: "Ownership can read as authority, a firm boundary, or a socially negotiated claim, but the chosen presentation never creates title.",
    examples: { mechanics: "OWNS(Marcus, Apartment 305) can support an authored access or transfer path; it cannot prove that the player lacks the keys.", scenario: "Marcus owns the apartment. The player has a key, a fact of possession, and both parties now have a reason to stop using those words as synonyms." },
    confusedWith: [{ concept: "Possession", distinction: "Having or carrying a thing is not the authored ownership record." }, { concept: "CONTROLS", distinction: "Access authority is a separate keyword and may be revoked without changing ownership." }, { concept: "PERMITTED", distinction: "A grant to act is not proof of title." }],
    evidence: [evidence("atomic-2020", "External commonsense prior retained for review only; no ownership proposition is copied into the article."), evidence("moral-stories", "External normative prior retained for review only; moral labels do not define ownership mechanics.")],
    illustration: illustration("KEYRING_OVER_LEDGER", "ASSET / PLACE", "title -> access question", "Two labeled actor and target nodes face a ledger and keyring. A gold ownership line points to the asset while a separate dashed access line shows that ownership is not the same as permission."),
    satire: "The deed says ‘mine’; the locked door says ‘submit a ticket.’",
  },
  OWES: {
    streetDefinition: "A debt is an authored promise to transfer value or perform a specified return, with the uncomfortable feature that everyone can remember the amount differently.",
    technicalMechanicNote: "The subject is the DEBTOR, the object is the CREDITOR, and term is an OBLIGATION with optional amount, unit, due, and status.",
    whatThisChanges: "An active, in-scope debt can ground repayment, extension, challenge, or a fully linked pressure action. A claim remains defeasible until its authored evidence and temporal state support it.",
    mechanics: {
      inputs: ["debtor subject", "creditor object", "obligation term", "optional amount, unit, due, and status"],
      preconditions: ["The debt is asserted, active, actual-scope, and valid now.", "The selected context exists and is active.", "Any action-specific fact such as NEEDS or a conflicting BELIEVES claim is also authored."],
      stateChanges: ["Renegotiation, fulfilment, or breakage append history; prior history is not rewritten.", "A pressure action may proceed only when demand, leverage, fear, and consequence are linked in authored state."],
      outputs: ["A debt fact and its provenance.", "ASK and DEAL affordances, plus INVOKE_CONSEQUENCE where the explicit pressure contract is complete."],
      blockers: ["debt_fulfilled", "debt_expired", "debt_disputed_without_evidence", "belief-only scope", "missing context or action-specific preconditions"],
    },
    materialRelationships: { actors: "debtor and creditor", targets: "creditor or obligation", objectsResources: "owed value or return", ownership: "the debtor may own an offered resource separately", obligations: "primary relation", permissions: "not implied", scarcity: "only if separately authored", deadlines: "optional due field; exclusive validity rules apply", consequences: "must be authored and linked", leverage: "may be a basis, never an automatic right" },
    emotionalLeverage: { threatens: "loss, dispute, or an authored consequence", protects: "the creditor's expected return and the debtor's chance to renegotiate", offers: "partial payment or extension", exposes: "the gap between a ledger and a memory", repairs: "a dispute through evidence review or explicit renegotiation" },
    relationships: [
      relationship("NEEDS", "commonly_co_occurs_with", "Debt relief is a separate active need when the action requires it.", "The rule graph groups debt and need for relief paths; one does not silently create the other."),
      relationship("PROMISED_TO", "commonly_co_occurs_with", "A promise and a debt may describe related but distinct commitments.", "Do not collapse promise status into debt status."),
      relationship("BELIEVES", "commonly_co_occurs_with", "A belief about the debt may conflict with the authored debt claim.", "Belief scope remains separate from actual debt scope."),
      relationship("HAS_LEVERAGE_OVER", "depends_on", "Only when the leverage basis explicitly identifies this active debt.", "Leverage names its basis and cannot be inferred from the word debt alone."),
    ],
    based: ["AE", "BE", "SE"],
    cueReading: "Debt can be presented as urgency, judgment, or a cooperative route to relief; no presentation tone changes the ledger.",
    examples: { mechanics: "OWES(player, Marcus, debt_250_usd) with due tomorrow can support REQUEST_EXTENSION if NEEDS(player, debt_relief) is also active.", scenario: "The receipt is real, the deadline is tomorrow, and the argument about what ‘owed’ means has now acquired three witnesses and no additional money." },
    confusedWith: [{ concept: "PROMISED_TO", distinction: "A promise is a commitment; OWES is a debtor-creditor obligation with its own term and status." }, { concept: "NEEDS", distinction: "Need explains a shortage or goal; it does not establish who is owed." }, { concept: "HAS_LEVERAGE_OVER", distinction: "Leverage requires an attributable basis and still does not authorize coercion." }],
    evidence: [evidence("atomic-2020", "External event-effect prior retained as defeasible evidence; no debt fact is imported."), evidence("social-chemistry-101", "External social-norm prior retained for review; worker annotations do not become obligations."), evidence("casino", "External negotiation prior retained for review only; dialogue does not establish a debt here.")],
    illustration: illustration("LEDGER_WITH_TICKING_DUE_MARK", "OBLIGATION / VALUE", "claim -> repayment or review", "A ledger marked with an obligation and deadline sits between debtor and creditor nodes. Two arrows split toward repayment and evidence review, showing that a debt can be fulfilled or challenged without erasing history."),
    satire: "Every debt is simple until someone asks whether the spreadsheet is spiritually binding.",
  },
  NEEDS: {
    streetDefinition: "A need is an active shortage or goal that makes a resource, permission, or state materially relevant; it is not a personality quiz result.",
    technicalMechanicNote: "The subject is an ACTOR and the object is a RESOURCE_OR_STATE. A need is defeasible and actor-scoped.",
    whatThisChanges: "It supplies an action precondition where the action explicitly requires it, such as debt relief or access. It does not predict choice, urgency, or success by itself.",
    mechanics: {
      inputs: ["actor subject", "resource or state object", "active actual-scope assertion"],
      preconditions: ["The need is asserted, active, and valid in the selected context.", "The consuming action names this need as a required check."],
      stateChanges: ["A recognized or satisfied need may append history.", "Reading the need never mutates the resource or actor choice."],
      outputs: ["A shortage/goal fact for deterministic action checks.", "ASK or DEAL affordances supported by the keyword's authored affordances."],
      blockers: ["need_satisfied", "resource_unavailable", "belief or hypothetical scope", "an action that does not actually require this need"],
    },
    materialRelationships: { actors: "dependent or goal-bearing actor", targets: "resource, permission, or state", objectsResources: "needed resource or relief", ownership: "separate", obligations: "may make a debt-relief need relevant", permissions: "may make access relevant", scarcity: "shortage or goal is central", deadlines: "only if separately authored", consequences: "not automatic", leverage: "need can expose dependence but does not authorize coercion" },
    emotionalLeverage: { threatens: "continued shortage or stalled progress", protects: "a path toward a required state", offers: "a concrete reason to ask or negotiate", exposes: "what the actor cannot simply do without", repairs: "a plan that satisfies the need without inventing motives" },
    relationships: [
      relationship("OWES", "commonly_co_occurs_with", "Debt relief may be an active object of need.", "A need does not identify a creditor or prove the debt."),
      relationship("DEPENDS_ON", "commonly_co_occurs_with", "A need may be part of a separately authored dependency.", "Dependence adds a provider or condition; it is not a synonym."),
      relationship("CONTROLS", "commonly_co_occurs_with", "A need may concern a resource controlled by another actor.", "Control belongs to the controller, not to the need-holder."),
    ],
    based: ["AE", "ES", "EA"],
    cueReading: "A need can read as urgent, communal, or bounded; those are presentation readings, not evidence that the actor feels a particular emotion.",
    examples: { mechanics: "NEEDS(player, debt_relief) is required by REQUEST_EXTENSION; NEEDS(player, cash) alone does not make payment available.", scenario: "The player needs an extension to keep housing. The system records the need, then still asks whether the creditor, context, and debt are real and active." },
    confusedWith: [{ concept: "Want", distinction: "The keyword records a mechanically relevant shortage or goal, not every preference." }, { concept: "DEPENDS_ON", distinction: "A dependency names a provider, resource, or condition relied upon; a need names relevance or shortage." }, { concept: "FEARS", distinction: "Fear is a vulnerability response; need is a material or goal condition." }],
    evidence: [evidence("atomic-2020", "External intent/need prior retained for review only; no source language becomes an actor need."), evidence("moral-stories", "External action-consequence prior retained for review only; normative judgments do not create needs."), evidence("casino", "External negotiation prior retained for review only; participant preferences are not runtime facts.")],
    illustration: illustration("EMPTY_SLOT_WITH_TARGET_RESOURCE", "SHORTAGE / GOAL", "absence -> requested support", "An actor node points toward an empty resource slot and a target provider. A gold gap marks the shortage while a red boundary shows that the need does not itself force the provider to comply."),
    satire: "The need is documented, which is almost the same as being helped in certain institutions.",
  },
  CONTROLS: {
    streetDefinition: "Control is the authored ability to decide who gets through a door, channel, or resource—not proof that the controller owns the building.",
    technicalMechanicNote: "The subject is the CONTROLLER and the object is a RESOURCE_OR_ACCESS_CHANNEL; control is directed and not reciprocal by default.",
    whatThisChanges: "It can ground an access request or a pressure path when the action's other facts are present. It does not imply ownership, permission for a particular actor, or willingness to exercise authority.",
    mechanics: {
      inputs: ["controller subject", "resource, location, or access channel object", "active actual-scope assertion"],
      preconditions: ["The controller fact is active, valid now, and in the selected context.", "An access action must separately check PERMITTED and absence of PROHIBITED."],
      stateChanges: ["Access granted or revoked events may be appended by authored actions.", "Control itself is not mutated by a request that has not resolved."],
      outputs: ["An authority fact used by access and leverage checks.", "REQUEST_ACCESS and selected negotiation/pressure affordances."],
      blockers: ["control_revoked", "active_lock", "controller_unavailable", "specific prohibition", "ownership incorrectly substituted for control"],
    },
    materialRelationships: { actors: "controller", targets: "access-seeking actor or channel", objectsResources: "door, place, resource, or channel", ownership: "separate", obligations: "may be negotiated", permissions: "must be checked separately", scarcity: "access can be scarce when authored", deadlines: "only when authored", consequences: "may be authored for a blocked path", leverage: "control can be a basis when explicitly attributed" },
    emotionalLeverage: { threatens: "denied access or continued lockout", protects: "a boundary or scarce channel", offers: "a controlled grant or extension", exposes: "who actually holds the switch", repairs: "a conflict by naming authority and scope" },
    relationships: [
      relationship("PERMITTED", "commonly_co_occurs_with", "A separate grant names the actor, authority, term, and scope.", "Control can issue a permission without making every action permissible."),
      relationship("PROHIBITED", "commonly_co_occurs_with", "A separate restriction may cover the same channel and actor.", "The mechanics layer checks contradiction explicitly."),
      relationship("OWNS", "commonly_co_occurs_with", "Ownership and control may share a subject but are not equivalent.", "The source definition keeps title and access authority distinct."),
      relationship("DEPENDS_ON", "commonly_co_occurs_with", "An actor may depend on a resource or channel controlled by another.", "Dependence belongs to the dependent actor."),
    ],
    based: ["AS", "EA", "BD"],
    cueReading: "Control can be rendered as command, a boundary, or concealed leverage, but presentation cannot grant authority.",
    examples: { mechanics: "CONTROLS(Marcus, archive_door) plus PERMITTED(Marcus, player, archive_door) can support REQUEST_ACCESS when DEPENDS_ON is active and no PROHIBITED fact blocks it.", scenario: "Marcus controls the archive door. He may still have to explain whether the player is permitted to enter, because institutional comedy thrives on two separate keys." },
    confusedWith: [{ concept: "OWNS", distinction: "Title and access authority can belong to different actors." }, { concept: "PERMITTED", distinction: "Control is the capacity to grant or restrict; permission is the grant for a typed actor and term." }, { concept: "Leverage", distinction: "Control can be leverage basis, but leverage must identify its basis and target." }],
    evidence: [evidence("casino", "External negotiation prior retained for review only; no participant authority is imported."), evidence("stanford-politeness-stack-exchange", "External request-language prior retained for presentation review only; it cannot establish access permission."), evidence("social-chemistry-101", "External social-norm prior retained for review only; it does not define control." )],
    illustration: illustration("SWITCH_BEHIND_LOCKED_DOOR", "ACCESS CHANNEL", "authority -> grant or block", "A controller node sits beside a switch behind a locked door. A directional arrow branches to a permission gate and a prohibition gate, making the separate checks visible without relying on color."),
    satire: "Control is what you have when you can say ‘the system will not allow it’ and the system is, regrettably, you.",
  },
  PROMISED_TO: {
    streetDefinition: "A promise is an authored commitment aimed at someone, an action, a resource, or a condition; the universe records the verb and waits for the follow-through.",
    technicalMechanicNote: "The subject is the PROMISOR, object the RECIPIENT, and term the COMMITMENT, with optional status and append-only promise history.",
    whatThisChanges: "It can support renegotiation, extension, or consequence paths when the action requires the commitment. It does not prove acceptance or fulfilment.",
    mechanics: {
      inputs: ["promisor subject", "recipient object", "commitment term", "optional status"],
      preconditions: ["The commitment is authored, active, scoped, and valid now.", "The recipient is known where the action requires it.", "Any renegotiation or pressure action must carry its own checks."],
      stateChanges: ["PROMISE_MADE, PROMISE_FULFILLED, PROMISE_BROKEN, or superseding history may be appended.", "A new action cannot retroactively make a promise true."],
      outputs: ["A directional commitment with provenance.", "DEAL, PRESSURE, and ASK affordances declared by the keyword."],
      blockers: ["promise_expired", "recipient_not_known", "superseded_commitment", "a Vibe or tone mistaken for a promise"],
    },
    materialRelationships: { actors: "promisor and recipient", targets: "recipient or commitment", objectsResources: "promised action or resource", ownership: "separate", obligations: "may relate to OWES without collapsing into it", permissions: "not implied", scarcity: "only if promised resource is authored", deadlines: "only if commitment records one", consequences: "must be authored", leverage: "a broken commitment may be a basis when explicitly modeled" },
    emotionalLeverage: { threatens: "loss of trust or an authored consequence after breach", protects: "an expected future action", offers: "a renegotiated term", exposes: "the difference between speech and performance", repairs: "a broken expectation through fulfilment or explicit revision" },
    relationships: [
      relationship("OWES", "commonly_co_occurs_with", "A commitment can create or accompany an obligation, but the records remain distinct.", "Do not infer a monetary debt from a generic promise."),
      relationship("TRUSTS", "commonly_co_occurs_with", "Trust may be authored toward a promisor or recipient.", "A promise does not create trust automatically."),
      relationship("NEEDS", "commonly_co_occurs_with", "A commitment may address a separately authored need.", "Need and promise have different subjects and arguments."),
    ],
    based: ["EB", "EA", "SE"],
    cueReading: "Promises can read as steadfast, boundaried, or communal; the attitude remains a surface treatment over an authored commitment.",
    examples: { mechanics: "PROMISED_TO(player, Marcus, pay_ledger_term) can support RENEGOTIATE_TERMS; it does not prove Marcus accepted a changed deadline.", scenario: "The player promised to pay. The sentence is clear, the status is pending, and everyone agrees that pending is a very elegant word for not yet." },
    confusedWith: [{ concept: "OWES", distinction: "A promise names a commitment; a debt names debtor, creditor, and obligation term." }, { concept: "Trust", distinction: "Trust is a separate directional expectation and is not manufactured by a promise." }, { concept: "REQUEST", distinction: "An ASK can request a promise, but requesting is not committing." }],
    evidence: [evidence("moral-stories", "External action-consequence prior retained for review only; no story outcome creates a commitment."), evidence("social-chemistry-101", "External rule-of-thumb prior retained for review only; annotations do not become promises."), evidence("casino", "External negotiation prior retained for review only; participant utterances are not authored commitments here.")],
    illustration: illustration("SIGNED_CARD_WITH_OPEN_LOOP", "COMMITMENT", "promise -> fulfil, revise, or break", "A promisor and recipient node are connected by a signed card with an open loop. Three labeled paths—fulfil, revise, break—show append-only commitment history."),
    satire: "A promise is a small contract with excellent public relations and a later appointment with consequences.",
  },
  PERMITTED: {
    streetDefinition: "Permission is a specific authored ‘yes’ for an actor, action, resource, and condition—not merely a door that happens to be open.",
    technicalMechanicNote: "The subject is the GRANTOR, object the GRANTEE, and term an ACTION_OR_RESOURCE; the grant is directed and condition-sensitive.",
    whatThisChanges: "It can satisfy an action's permission check, but only in the matching scope and time. A more specific PROHIBITED assertion creates an explicit contradiction that blocks until authored resolution.",
    mechanics: {
      inputs: ["grantor subject", "grantee object", "action or resource term", "active context and time"],
      preconditions: ["The permission is asserted, active, actual-scope, and temporally valid.", "The actor, target, term, and context match the consuming action.", "No active matching PROHIBITED fact remains unresolved."],
      stateChanges: ["PERMISSION_GRANTED or PERMISSION_REVOKED history may be appended.", "The action may proceed only after all other checks pass."],
      outputs: ["An authorization fact for a typed action or resource.", "An ASK affordance for access and a DEAL affordance where authored."],
      blockers: ["permission_expired", "active_lock", "specific_prohibition", "wrong grantee or term", "belief-only permission"],
    },
    materialRelationships: { actors: "grantor and grantee", targets: "grantee, action, or resource", objectsResources: "authorized action/channel", ownership: "not required", obligations: "conditions may be attached", permissions: "primary relation", scarcity: "may gate access", deadlines: "validity and authored conditions", consequences: "a prohibition may block", leverage: "permission can be negotiated but not assumed" },
    emotionalLeverage: { threatens: "revocation or denied access", protects: "a bounded right to act", offers: "a clear path through an authority boundary", exposes: "the difference between courtesy and authorization", repairs: "a contradiction through explicit resolution" },
    relationships: [
      relationship("PROHIBITED", "contradicts", "Same canonical subject, object, and term with overlapping active time.", "The contract requires explicit authored resolution; it does not choose a winner by tone."),
      relationship("CONTROLS", "depends_on", "A grant usually requires a separately authored grantor authority where the action models it.", "Permission is not a universal consequence of control, but control can be its basis."),
      relationship("OWNS", "commonly_co_occurs_with", "An owner may be a grantor, but the permission record remains necessary.", "The open door remains an unreliable legal theory."),
      relationship("DEPENDS_ON", "commonly_co_occurs_with", "The grantee may depend on the permitted channel.", "Dependence describes the grantee's reliance, not the grant."),
    ],
    based: ["EA", "AS", "SE"],
    cueReading: "Permission can be presented as a firm boundary, command, or cooperative grant; none of those surfaces change the authorization record.",
    examples: { mechanics: "PERMITTED(Marcus, player, archive_door) can satisfy REQUEST_ACCESS only with matching CONTROLS, DEPENDS_ON, context, and no specific prohibition.", scenario: "Marcus says the player may enter. The ledger now has a grant; the lock, date, and contradictory memo still get a vote." },
    confusedWith: [{ concept: "CONTROLS", distinction: "Holding authority is not the same as granting this actor this action." }, { concept: "OWNS", distinction: "Ownership does not automatically authorize another actor." }, { concept: "Refusal", distinction: "A person's refusal is not necessarily a world-level PROHIBITED fact." }],
    evidence: [evidence("stanford-politeness-wikipedia", "External request-language prior retained for presentation review only; politeness cannot establish permission."), evidence("stanford-politeness-stack-exchange", "External request-language prior retained for presentation review only; no utterance is an authorization."), evidence("casino", "External negotiation prior retained for review only; dialogue outcomes do not become permissions.")],
    illustration: illustration("STAMPED_ACCESS_PASS", "AUTHORIZED ACTION", "grant -> allowed path", "A grantor node stamps an access pass for a grantee and a named channel. A red contradiction line from a prohibition memo ends at a review gate, showing why the yes is conditional."),
    satire: "Permission is a yes with a serial number, which is how freedom learns administrative procedure.",
  },
  PROHIBITED: {
    streetDefinition: "A prohibition is an authored ‘no’ attached to a particular actor, action, resource, and scope; it is not a moral fog machine.",
    technicalMechanicNote: "The subject is the AUTHORITY, object the ACTOR, and term an ACTION_OR_RESOURCE. It is directed, scoped, temporal, and mechanically checked before availability.",
    whatThisChanges: "A matching active prohibition blocks the affected action or forces explicit review. It does not prove that the actor knows the rule or that the rule is universally moral.",
    mechanics: {
      inputs: ["authority subject", "restricted actor object", "action or resource term", "active context and time"],
      preconditions: ["The prohibition is asserted, active, actual-scope, and valid now.", "The subject, actor, term, and context match the candidate action.", "Any PERMITTED contradiction is resolved by explicit authored state."],
      stateChanges: ["PROHIBITION_ISSUED or PROHIBITION_LIFTED history may be appended.", "The matching action becomes unavailable or review-bound."],
      outputs: ["A blocker with attributable provenance.", "A possible pressure or challenge affordance, never an automatic threat."],
      blockers: ["prohibition_revoked", "authorized_override", "authority_not_in_scope", "wrong actor or term", "belief-only prohibition"],
    },
    materialRelationships: { actors: "authority and restricted actor", targets: "actor or action/resource", objectsResources: "restricted channel or action", ownership: "not implied", obligations: "may be the subject of a review", permissions: "contradicts matching PERMITTED", scarcity: "restriction may create it", deadlines: "validity is explicit", consequences: "only if authored and linked", leverage: "a prohibition can be leverage basis only with attribution" },
    emotionalLeverage: { threatens: "loss of access or exposure to an authored consequence", protects: "a boundary or resource", offers: "a clear condition for review or release", exposes: "who claims authority and where it ends", repairs: "a disputed boundary through explicit override or lift" },
    relationships: [
      relationship("PERMITTED", "contradicts", "Same canonical subject, object, and term with overlapping active time.", "The mechanics contract blocks until explicit authored resolution."),
      relationship("CONTROLS", "commonly_co_occurs_with", "The authority may separately control the affected channel.", "Control is not necessary in every abstract prohibition, and it does not replace scope."),
      relationship("FEARS", "commonly_co_occurs_with", "A restricted actor may separately fear an authored consequence.", "Fear does not create the prohibition or grant a right to coerce."),
      relationship("HAS_LEVERAGE_OVER", "commonly_co_occurs_with", "A prohibition may be named as a basis only when the leverage record says so.", "A rule is not automatically leverage."),
    ],
    based: ["AB", "BE", "EA"],
    cueReading: "Prohibition can sound menacing, condemning, or boundaried; the rendering must preserve the exact scope and leave unsupported moral claims out.",
    examples: { mechanics: "PROHIBITED(Marcus, player, archive_door) blocks REQUEST_ACCESS even if a permission fact exists, until the contradiction has an authored resolution.", scenario: "The sign says no entry after six. It does not say the player knows, agrees, or has become a villain; bureaucracy declines to provide that subtext." },
    confusedWith: [{ concept: "PERMITTED", distinction: "A prohibition is a restriction; an active permission is a grant. Their overlap is an explicit contradiction state." }, { concept: "Fear", distinction: "Fear is a vulnerability response and does not create a rule." }, { concept: "Refusal", distinction: "A target's refusal is not automatically an actual-world prohibition." }],
    evidence: [evidence("moral-stories", "External normative prior retained for review only; moral labels do not create restrictions."), evidence("social-chemistry-101", "External rule-of-thumb prior retained for review only; annotations do not become authority."), evidence("stanford-politeness-wikipedia", "External language prior retained for presentation review only; a sentence does not establish a prohibition here.")],
    illustration: illustration("RED_RESTRICTION_STAMP", "RESTRICTED ACTION", "authority -> block or review", "An authority node points a red restriction stamp at an actor and named action. A permission card meets it at an explicit review gate, making contradiction visible without relying on red alone."),
    satire: "A prohibition is a boundary with paperwork, because apparently even the no needs a provenance trail.",
  },
  DEPENDS_ON: {
    streetDefinition: "Dependence means progress relies on a provider, resource, or condition; it is leverage-shaped without being a command.",
    technicalMechanicNote: "The subject is the DEPENDENT and the object is a PROVIDER_OR_RESOURCE. The relation is directed and defeasible.",
    whatThisChanges: "It can make support or access materially relevant to an action. It does not force the provider to help, and it can end when an alternate provider or satisfied dependency is authored.",
    mechanics: {
      inputs: ["dependent actor or goal", "provider, resource, or location", "active actual-scope assertion"],
      preconditions: ["The dependency is active, valid now, and in the action's context.", "The action must explicitly require the dependency or its provider."],
      stateChanges: ["DEPENDENCY_ESTABLISHED or DEPENDENCY_BROKEN history may be appended.", "Satisfying or replacing the provider changes future availability only through authored state."],
      outputs: ["A reliance edge for deterministic action checks.", "ASK, DEAL, and PRESSURE affordances declared by the keyword, subject to complete checks."],
      blockers: ["provider_unavailable", "dependency_satisfied", "alternate_provider_authored", "role label without a fact"],
    },
    materialRelationships: { actors: "dependent and provider", targets: "provider, resource, or condition", objectsResources: "needed support or channel", ownership: "separate", obligations: "may motivate a negotiated return", permissions: "may be needed from provider", scarcity: "reliance makes substitutes relevant", deadlines: "only if authored", consequences: "must be explicit", leverage: "provider position can be a basis only when recorded" },
    emotionalLeverage: { threatens: "stalled progress or loss of a needed provider", protects: "continuity and an escape route", offers: "support, access, or renegotiation", exposes: "who has alternatives", repairs: "dependency by authoring a substitute or satisfying the need" },
    relationships: [
      relationship("NEEDS", "commonly_co_occurs_with", "The dependent may need the resource or state separately.", "Need and dependence remain distinct fields."),
      relationship("CONTROLS", "commonly_co_occurs_with", "The provider may control the relevant channel.", "Control belongs to the provider, not automatically to the dependent."),
      relationship("TRUSTS", "commonly_co_occurs_with", "The dependent may have directional trust in the provider.", "Dependence does not create trust."),
      relationship("PERMITTED", "commonly_co_occurs_with", "The provider's permission may be required for access.", "Permission remains a separate authored grant."),
    ],
    based: ["SE", "AE", "SD"],
    cueReading: "Dependence can be rendered as care, urgency, or social coaxing; none of these makes the provider obligated without an authored fact.",
    examples: { mechanics: "DEPENDS_ON(player, archive_room) and PERMITTED(Marcus, player, archive_door) contribute to REQUEST_ACCESS; neither one alone is enough.", scenario: "The plan depends on Marcus's access channel. The plan is not a hostage note yet; it is a dependency with a provider, a scope, and several opportunities to fail." },
    confusedWith: [{ concept: "NEEDS", distinction: "A need names material relevance; dependence names the provider or condition relied upon." }, { concept: "Trust", distinction: "A dependent can distrust the provider; reliability expectation is a separate fact." }, { concept: "Leverage", distinction: "Dependence may become a leverage basis only when explicitly attributed and still defeasible." }],
    evidence: [evidence("casino", "External negotiation prior retained for review only; dialogue dependence is not imported as a fact."), evidence("persuasion-for-good", "External persuasion prior retained for presentation review only; survey or dialogue behavior does not establish dependency."), evidence("atomic-2020", "External intent/effect prior retained for review only; no dependency is inferred from a commonsense relation.")],
    illustration: illustration("BRIDGE_WITH_SINGLE_SUPPORT", "PROVIDER / CONDITION", "reliance -> support or break", "An actor node crosses a bridge supported by a provider/resource node. A second dotted route is marked authored substitute, showing that dependency is defeasible rather than destiny."),
    satire: "Dependence is not control, although both parties may discover the distinction at the same invoice.",
  },
  KNOWS_SECRET_ABOUT: {
    streetDefinition: "Scoped secret knowledge means an actor knows confidential information about a subject; it still does not come with a disclosure permit.",
    technicalMechanicNote: "The subject is the KNOWER, object the SECRET_SUBJECT, and secret the SECRET. Knowledge scope is distinct from belief, suspicion, truth, and permission to disclose.",
    whatThisChanges: "It can support an information trade, evidence request, or explicitly linked leverage path. It cannot authorize disclosure or turn suspicion into knowledge.",
    mechanics: {
      inputs: ["knower subject", "secret subject object", "scoped secret", "knowledge-scoped provenance"],
      preconditions: ["The knowledge assertion is active and scoped to the selected context.", "The secret remains non-public where the consuming action requires secrecy.", "A leverage or pressure path must identify this exact knowledge basis."],
      stateChanges: ["SECRET_LEARNED, SECRET_DISCLOSED, or SECRET_EXPOSED history may be appended.", "Exposure does not erase prior knowledge history."],
      outputs: ["A knowledge fact with a subject and secret boundary.", "TRADE_INFORMATION, REVEAL_NONPAYMENT, or REQUEST_EVIDENCE affordances as declared."],
      blockers: ["secret_public", "knowledge_expired", "speaker_only_suspects", "unauthorized knowledge addition", "missing subject or scope"],
    },
    materialRelationships: { actors: "knower and secret subject", targets: "subject of knowledge", objectsResources: "confidential proposition or information", ownership: "not implied", obligations: "may be offered in a deal", permissions: "disclosure is not permitted by knowing", scarcity: "secrecy can be a scarce boundary", deadlines: "only if authored", consequences: "must be authored", leverage: "may be a basis if the leverage record names it" },
    emotionalLeverage: { threatens: "exposure or loss of confidentiality", protects: "the subject's knowledge boundary", offers: "a scoped information exchange", exposes: "who knows what and under which scope", repairs: "trust through evidence and bounded disclosure" },
    relationships: [
      relationship("HAS_LEVERAGE_OVER", "enables", "Only when an active leverage assertion identifies the secret as its basis and target.", "Knowledge can be a basis; it is not automatic leverage."),
      relationship("BELIEVES", "commonly_co_occurs_with", "A belief about another actor's knowledge may be disputed.", "Belief never becomes actual knowledge merely by proximity."),
      relationship("FEARS", "commonly_co_occurs_with", "A subject may fear an authored exposure consequence.", "Fear does not prove the secret or authorize pressure."),
      relationship("TRUSTS", "commonly_co_occurs_with", "Confidentiality may be protected by a separate trust fact.", "Trust is not implied by secrecy."),
    ],
    based: ["BD", "DS", "DE"],
    cueReading: "Secret knowledge can be framed as extortive, insinuating, or feigning care; all such frames remain subordinate to the knowledge boundary.",
    examples: { mechanics: "KNOWS_SECRET_ABOUT(Marcus, player, unregistered_sublet) can support TRADE_INFORMATION only with matching leverage and PRIVATE_DISCLOSURE context.", scenario: "Marcus knows about the sublet. The record says who knows, about whom, and what kind of secret. It does not say ‘therefore reveal it.’" },
    confusedWith: [{ concept: "BELIEVES", distinction: "Belief is a scoped proposition that may differ from actual truth; knowledge is a separate authored boundary." }, { concept: "Suspicion", distinction: "A speaker who only suspects does not satisfy the knowledge fact." }, { concept: "HAS_LEVERAGE_OVER", distinction: "Leverage requires an attributable basis and target; secret knowledge alone is not coercive authority." }],
    evidence: [evidence("atomic-2020", "External knowledge/intent prior retained for review only; no secret proposition is imported."), evidence("stanford-politeness-wikipedia", "External presentation-language prior retained for review only; no corpus text is copied."), evidence("tpl-ontology-luangrath-peck-barger", "Conceptual TPL authority only; the underlying social-media corpus is not claimed available or reusable.")],
    illustration: illustration("SEALED_ENVELOPE_WITH_SCOPE_TAG", "CONFIDENTIAL INFORMATION", "knowledge -> bounded exchange", "A knower node holds a sealed envelope labeled with a secret subject and scope. A directional arrow reaches a bounded exchange gate, while a separate red exposure path is visibly not automatic."),
    satire: "A secret is information wearing a coat; the coat is not a license to remove it in public.",
  },
  BELIEVES: {
    streetDefinition: "Belief is what an entity holds to be so under a stated scope, which is useful precisely because the world may disagree.",
    technicalMechanicNote: "The subject is the BELIEVER and proposition is a PROPOSITION, with optional confidence. BELIEF scope never authorizes actual-world action by itself.",
    whatThisChanges: "It can ground a challenge or evidence request when an action names the belief. It cannot rewrite actual facts, grant knowledge, or prove a debt invalid without authored resolution.",
    mechanics: {
      inputs: ["believer subject", "proposition", "optional confidence", "belief or disputed scope"],
      preconditions: ["The belief is authored, active, and valid in its scope.", "The consuming action distinguishes BELIEF from ACTUAL truth.", "Evidence or challenge actions retain the proposition and provenance."],
      stateChanges: ["BELIEF_FORMED, BELIEF_REVISED, or BELIEF_WEAKENED history may be appended.", "A belief update does not mutate the actual ledger automatically."],
      outputs: ["A scoped proposition with defeasible confidence.", "ASK or DEAL affordances for challenge and evidence."],
      blockers: ["insufficient_evidence", "belief_revised", "speaker_lacks_scope", "using belief-scoped facts as actual authorization"],
    },
    materialRelationships: { actors: "believer", targets: "proposition subject or claim", objectsResources: "proposition, debt, or secret claim", ownership: "not implied", obligations: "may concern OWES", permissions: "belief cannot grant permission", scarcity: "not inherent", deadlines: "not inferred", consequences: "not inferred", leverage: "not actual leverage without an authored basis" },
    emotionalLeverage: { threatens: "certainty, credibility, or a claimed interpretation", protects: "the believer's current model", offers: "a path to evidence and revision", exposes: "the gap between perspective and world state", repairs: "disputes without making confidence a fact" },
    relationships: [
      relationship("OWES", "commonly_co_occurs_with", "A belief may concern a debt claim and conflict with actual OWES evidence.", "The two scopes must remain distinct."),
      relationship("KNOWS_SECRET_ABOUT", "commonly_co_occurs_with", "A belief may concern another actor's knowledge.", "It does not prove the knowledge claim."),
      relationship("TRUSTS", "commonly_co_occurs_with", "Trust may shape an authored expectation but is not reducible to belief.", "The keyword definitions keep them separate."),
      relationship("FEARS", "commonly_co_occurs_with", "A fear may be based on belief, but a false belief can be corrected.", "The fear record and proposition scope remain explicit."),
    ],
    based: ["EB", "ED", "SE"],
    cueReading: "Belief can be rendered as steadiness, deflection, or communal reasoning; presentation must not upgrade confidence into truth.",
    examples: { mechanics: "BELIEVES(player, debt_amount_300) plus an OWES claim can support CHALLENGE_DEBT_VALIDITY; it cannot authorize refusing a valid debt.", scenario: "The player believes the amount is 300. The ledger says 250. Both statements can exist in the same room without the renderer being asked to pick a winner." },
    confusedWith: [{ concept: "Actual fact", distinction: "Belief scope is not actual scope." }, { concept: "KNOWS_SECRET_ABOUT", distinction: "Belief about knowledge is not scoped knowledge." }, { concept: "Trust", distinction: "Trust is an expectation of reliability, not merely holding a proposition." }],
    evidence: [evidence("atomic-2020", "External intent/reaction prior retained for review only; no model output becomes a belief fact."), evidence("social-chemistry-101", "External annotated norm prior retained for review only; worker judgments do not become character beliefs."), evidence("moral-stories", "External moral-label prior retained for review only; labels do not determine truth scope.")],
    illustration: illustration("TWO_OVERLAPPING_LEDGER_LAYERS", "PROPOSITION / CONFIDENCE", "belief -> evidence or revision", "A believer node views a proposition card layered over a separate actual ledger. An arrow goes to evidence and revision gates, showing that belief is actionable as belief but cannot overwrite the world layer."),
    satire: "Belief is the document currently winning the meeting, pending discovery of the appendix.",
  },
  TRUSTS: {
    streetDefinition: "Trust is a directional expectation that someone or some source will act reliably here, not a friendship coupon or a guarantee.",
    technicalMechanicNote: "The subject is the TRUSTER and object the TRUSTED_TARGET. Trust is directed, context-sensitive, and not automatically reciprocal.",
    whatThisChanges: "It can support dependency assistance, extension, access, or renegotiation where an action explicitly requires it. It does not prove truth, compliance, or friendship.",
    mechanics: {
      inputs: ["truster subject", "trusted target or information source", "active context-scoped assertion"],
      preconditions: ["Trust is authored, active, and valid in the selected context.", "The action names trust as a required check.", "Any conflicting RESENTS record is handled as explicit tension, not automatic negation."],
      stateChanges: ["TRUST_EXTENDED or TRUST_REVISED history may be appended.", "Trust changes do not rewrite promises, permissions, or actual facts."],
      outputs: ["A directional reliability expectation.", "ASK or DEAL affordances for support and renegotiation."],
      blockers: ["trust_broken", "contrary_evidence", "relationship_ended", "friendly tone mistaken for a trust fact"],
    },
    materialRelationships: { actors: "truster and trusted target", targets: "target or source", objectsResources: "support, information, or promised performance", ownership: "not implied", obligations: "may accompany promises", permissions: "may support a request but cannot grant it", scarcity: "not inherent", deadlines: "context may be time-scoped", consequences: "not automatic", leverage: "trust can make dependence legible but is not coercion" },
    emotionalLeverage: { threatens: "reliability loss or broken expectation", protects: "a channel of cooperation", offers: "support, extension, or access request", exposes: "who is expected to carry risk", repairs: "a relationship through authored revision rather than sentiment alone" },
    relationships: [
      relationship("DEPENDS_ON", "commonly_co_occurs_with", "Trust may be directed at the provider of an active dependency.", "Dependence does not prove trust."),
      relationship("PROMISED_TO", "commonly_co_occurs_with", "A trust expectation may accompany a commitment.", "Promises do not create trust automatically."),
      relationship("NEEDS", "commonly_co_occurs_with", "A trusted provider may be relevant to an actor's need.", "Need remains a material fact."),
      relationship("RESENTS", "contradicts", "Same subject and target with overlapping active time.", "The result is a flagged tension without automatic negation."),
    ],
    based: ["SE", "ES", "SD"],
    cueReading: "Trust can read as compassionate, communal, or coaxing; none of these surface treatments promises that the target will comply.",
    examples: { mechanics: "TRUSTS(player, Imani) plus DEPENDS_ON(player, Imani) can support REQUEST_SUPPORT; the action still asks rather than compels.", scenario: "The player trusts Imani to keep the disclosure private. That is a fact with scope, not a magic spell against betrayal." },
    confusedWith: [{ concept: "Friendship", distinction: "The repository records reliability expectation, not a social label." }, { concept: "BELIEVES", distinction: "Trust concerns expected reliable action; belief concerns a proposition." }, { concept: "Permission", distinction: "Trust can motivate an ASK but does not grant the requested action." }],
    evidence: [evidence("social-chemistry-101", "External social-norm prior retained for review only; annotations do not create trust."), evidence("casino", "External negotiation prior retained for review only; dialogue behavior does not become a trust fact."), evidence("stanford-politeness-wikipedia", "External language prior retained for presentation review only; politeness is not proof of trust.")],
    illustration: illustration("BRIDGE_WITH_WITNESS_MARK", "RELIABILITY EXPECTATION", "trust -> support request", "A truster node and trusted target node face a bridge labeled with a context tag. The bridge reaches a request gate rather than a command gate, preserving the difference between trust and control."),
    satire: "Trust is a bridge inspected by history, contrary evidence, and one person who remembers the last bridge.",
  },
  FEARS: {
    streetDefinition: "Fear records a directional vulnerability toward a target, consequence, or exposure; it describes the exposed actor, not the target's entitlement.",
    technicalMechanicNote: "The subject is the VULNERABLE_ACTOR and object a TARGET_OR_CONSEQUENCE. Fear is authored, scoped, and defeasible.",
    whatThisChanges: "It can satisfy a vulnerability check inside an explicitly linked pressure contract. It cannot create a threat, authorize coercion, or select an unrelated consequence.",
    mechanics: {
      inputs: ["vulnerable actor subject", "target or consequence object", "active authored vulnerability assertion"],
      preconditions: ["Fear is active, actual or correctly scoped, and valid now.", "The feared object matches the pressure contract's consequence or exposure.", "The action also proves leverage, demand, context, and consequence linkage."],
      stateChanges: ["A consequence invocation may append history only after the complete contract passes.", "Resolving or correcting a fear can defeat it without rewriting prior history."],
      outputs: ["A vulnerability fact used by a bounded pressure check.", "INVOKE_CONSEQUENCE affordance where the source action and contract support it."],
      blockers: ["fear_resolved", "consequence_impossible", "false_belief_corrected", "unrelated target fear", "tone mistaken for fear"],
    },
    materialRelationships: { actors: "vulnerable actor", targets: "target, exposure, or consequence", objectsResources: "feared consequence or exposure", ownership: "not implied", obligations: "may be part of a pressure contract", permissions: "fear does not grant coercive permission", scarcity: "not inherent", deadlines: "only when authored", consequences: "must match exactly", leverage: "may be the target's vulnerability, not their right to be pressured" },
    emotionalLeverage: { threatens: "the authored feared exposure or consequence", protects: "the vulnerable actor when a repair removes the risk", offers: "a bounded route to avoid or address the consequence", exposes: "where leverage could matter", repairs: "the vulnerability through evidence correction or fulfilled obligation" },
    relationships: [
      relationship("HAS_LEVERAGE_OVER", "commonly_co_occurs_with", "A leverage record may target the actor's exact authored vulnerability.", "Fear alone does not make leverage."),
      relationship("PROHIBITED", "commonly_co_occurs_with", "A prohibition may be the authored consequence or context, but the link must be explicit.", "A fear does not create a prohibition."),
      relationship("KNOWS_SECRET_ABOUT", "commonly_co_occurs_with", "A feared exposure may concern a scoped secret.", "Knowledge and fear have different subjects and boundaries."),
      relationship("DEPENDS_ON", "commonly_co_occurs_with", "A dependency can make a specific consequence materially relevant.", "Dependence does not prove fear."),
    ],
    based: ["AE", "BD", "BE"],
    cueReading: "Fear can be rendered as urgent, extortive, or condemning; the renderer cannot invent the consequence that makes the fear relevant.",
    examples: { mechanics: "FEARS(player, public_exposure) supports pressure only when leverage, demand, consequence, context, and timing all point to public_exposure.", scenario: "The player fears public exposure. A target's unrelated fear of losing a bicycle is not a substitute, however dramatically the stationery is arranged." },
    confusedWith: [{ concept: "PROHIBITED", distinction: "Fear is a vulnerability response; prohibition is an authored restriction." }, { concept: "Leverage", distinction: "Fear may be evidence within a leverage contract, but does not itself establish the basis or right to coerce." }, { concept: "Threat", distinction: "A threatening sentence cannot create a fear or consequence fact." }],
    evidence: [evidence("atomic-2020", "External reaction prior retained for review only; no character vulnerability is imported."), evidence("social-chemistry-101", "External social-pressure prior retained for review only; annotations do not create fear."), evidence("moral-stories", "External consequence prior retained for review only; moral outcomes do not authorize pressure.")],
    illustration: illustration("EXPOSURE_LINE_AT_VULNERABLE_NODE", "VULNERABILITY / CONSEQUENCE", "basis -> bounded pressure check", "A vulnerable actor node has a labeled exposure line leading to an authored consequence card. A separate leverage chain must connect before the pressure gate opens; an unrelated fear is visibly disconnected."),
    satire: "Fear is evidence of vulnerability, not a notarized invitation to become awful.",
  },
  RESENTS: {
    streetDefinition: "Resentment is an authored grievance about a target or event tied to a perceived wrong or burden; it is not an automatic action plan.",
    technicalMechanicNote: "The subject is the GRIEVING_ACTOR and object a TARGET_OR_EVENT. It is directional, context-sensitive, and can tension with trust.",
    whatThisChanges: "It can support a debt-validity challenge, evidence request, or pressure affordance where action checks call for it. It does not prove wrongdoing, hatred, or inevitable retaliation.",
    mechanics: {
      inputs: ["grieving actor subject", "target or event object", "authored grievance evidence"],
      preconditions: ["The grievance is asserted, active, and valid in scope.", "The action names the relevant target, debt, or event.", "Contrary evidence or a resolution can defeat or address the grievance."],
      stateChanges: ["A grievance may be addressed, retracted, or superseded with append-only history.", "The fact does not mutate the target or create a punishment."],
      outputs: ["A directional grievance prior for a bounded action check.", "ASK, DEAL, or PRESSURE affordances declared by the keyword."],
      blockers: ["grievance_addressed", "target_unidentified", "evidence_retracted", "tone mistaken for a grievance"],
    },
    materialRelationships: { actors: "grieving actor", targets: "target or event", objectsResources: "burden, fee, debt, or wrong", ownership: "not implied", obligations: "may concern a disputed OWES claim", permissions: "not implied", scarcity: "burden may be material when authored", deadlines: "only if authored", consequences: "must be authored", leverage: "grievance can motivate review but does not authorize punishment" },
    emotionalLeverage: { threatens: "continued burden or relationship rupture", protects: "the actor's account of a wrong", offers: "review, evidence, or renegotiation", exposes: "where a burden became interpersonal", repairs: "the grievance by addressing its basis rather than mocking its intensity" },
    relationships: [
      relationship("OWES", "commonly_co_occurs_with", "The grievance may concern a debt claim or added fee.", "Resentment does not establish the debt or invalidate it."),
      relationship("BELIEVES", "commonly_co_occurs_with", "A grievance may depend on the actor's authored interpretation of an event.", "Belief and grievance remain separate records."),
      relationship("FEARS", "commonly_co_occurs_with", "A grievance and vulnerability may coexist.", "Neither one licenses an unrelated consequence."),
      relationship("TRUSTS", "contradicts", "Same subject and target with overlapping active time.", "The source rule records tension without automatic negation."),
    ],
    based: ["BE", "EB", "BD"],
    cueReading: "Resentment can read as condemnation, steadfast boundary, or concealed grievance; no Vibe changes the alleged event or burden.",
    examples: { mechanics: "RESENTS(player, Marcus_late_fee) plus an OWES claim and conflicting BELIEVES proposition can support CHALLENGE_DEBT_VALIDITY.", scenario: "The player resents a fee added late. The grievance is now a review lead, not a court verdict or a permission slip for revenge." },
    confusedWith: [{ concept: "Anger", distinction: "The keyword requires an authored grievance tied to a target or event; tone is not enough." }, { concept: "BELIEVES", distinction: "A belief may explain a grievance, but the records have different meanings." }, { concept: "FEARS", distinction: "Resentment concerns a perceived wrong or burden; fear concerns vulnerability." }],
    evidence: [evidence("social-chemistry-101", "External norm/grievance prior retained for review only; annotations do not create a grievance."), evidence("moral-stories", "External moral-action prior retained for review only; story judgments do not define resentment."), evidence("casino", "External negotiation prior retained for review only; dialogue sentiment is not an authored grievance.")],
    illustration: illustration("RED_MARK_ON_LEDGER_MARGIN", "GRIEVANCE / BURDEN", "perceived wrong -> review or rupture", "A grieving actor points to a red mark on a ledger margin connected to a target/event card. The path branches to evidence review and relationship tension, not directly to punishment."),
    satire: "Resentment is a complaint with a memory, which is why it survives every attempt to close the tab.",
  },
  HAS_LEVERAGE_OVER: {
    streetDefinition: "Leverage is an attributable source of influence over another actor's available choices, not a cape labeled ‘coercion authorized.’",
    technicalMechanicNote: "The subject is the LEVERAGE_HOLDER, object the TARGET, and basis the LEVERAGE_BASIS. The basis must remain explicit, active, scoped, and defeasible.",
    whatThisChanges: "It can ground a deal or a fully linked pressure action. The mechanics require the exact basis, target, demand, vulnerability, consequence, context, and temporal validity; leverage never supplies missing content.",
    mechanics: {
      inputs: ["leverage holder subject", "target object", "attributable debt, control, secret, or other authored basis", "matching demand and consequence where pressure is used"],
      preconditions: ["The leverage assertion is active, actual-scope, and valid now.", "The basis is independently authored and matches the target.", "PRESSURE additionally requires a linked demand, fear/vulnerability, consequence, context, and no blocker or prohibition."],
      stateChanges: ["A deal or consequence invocation appends history only after its semantic contract passes.", "Basis expiry, public exposure, or target independence can defeat the leverage record."],
      outputs: ["An attributed influence edge and deterministic trace.", "TRADE_INFORMATION, OFFER_CASH_FOR_EXTENSION, INVOKE_CONSEQUENCE, or REVEAL_NONPAYMENT affordances as declared."],
      blockers: ["basis_expired", "basis_public", "basis_unproven", "target_no_longer_depends", "secret basis silently treated as debt", "unrelated fear or consequence", "prohibited or disputed evidence"],
    },
    materialRelationships: { actors: "leverage holder and target", targets: "target's available choice", objectsResources: "basis: debt, control, secret, or authored vulnerability", ownership: "not implied", obligations: "may be basis", permissions: "does not grant coercive permission", scarcity: "may affect alternatives", deadlines: "only authored deadlines", consequences: "must be exact and authored", leverage: "primary relation with explicit basis" },
    emotionalLeverage: { threatens: "the exact authored vulnerability or consequence", protects: "the holder's negotiated position or the target's ability to choose knowingly", offers: "a bounded exchange or relief", exposes: "the operational motive behind an official request", repairs: "the relationship by replacing improvised coercion with explicit terms" },
    relationships: [
      relationship("OWES", "depends_on", "The debt must be the recorded basis of this leverage assertion.", "Debt pressure cannot be manufactured from a secret basis."),
      relationship("CONTROLS", "depends_on", "Control must be explicitly named as the basis.", "Control may be leverage-shaped but is not automatically leverage."),
      relationship("KNOWS_SECRET_ABOUT", "depends_on", "Scoped secret knowledge must identify the subject and basis.", "Knowledge alone does not establish the leverage record."),
      relationship("FEARS", "commonly_co_occurs_with", "The target's exact authored fear must match the pressure consequence.", "Any target fear is not sufficient."),
      relationship("PROHIBITED", "commonly_co_occurs_with", "A prohibition can be a separate blocker or authored basis only when explicitly connected.", "Leverage does not override prohibition."),
    ],
    based: ["BD", "DA", "AB"],
    cueReading: "Leverage can read as extortive, predatory, or menacing; these are editorial presentation readings and cannot supply a missing basis or threat.",
    examples: { mechanics: "HAS_LEVERAGE_OVER(Marcus, player, active_debt_250_usd) can support pressure only if the demand and consequence are linked to that same debt and the player fears that consequence.", scenario: "Marcus has a ledger, a secret, and a deadline. The system refuses to pour them into one convenient threat. Even the menace has to show its work." },
    confusedWith: [{ concept: "Control", distinction: "Control is authority over access; leverage is influence with an attributable basis and target." }, { concept: "Fear", distinction: "Fear describes vulnerability; leverage describes the holder's basis of influence." }, { concept: "Threat", distinction: "A threat is a presentation or action shape; it cannot create the leverage, demand, fear, or consequence facts." }],
    evidence: [evidence("atomic-2020", "External intent/reaction prior retained for review only; no leverage relation is imported."), evidence("social-chemistry-101", "External social-pressure prior retained for review only; annotations cannot create leverage."), evidence("casino", "External negotiation prior retained for review only; participant bargaining does not become a leverage fact."), evidence("tpl-ontology-luangrath-peck-barger", "Conceptual TPL authority only; underlying social-media material is not asserted available or reusable.")],
    illustration: illustration("THREE-LINKED_CHAIN_TO_CHOICE_GATE", "BASIS / VULNERABILITY", "basis -> influence -> bounded choice", "A holder node connects through a labeled basis chain to a target vulnerability and then to a choice gate. An unrelated fear and an unlinked consequence are shown outside the chain, making the grounding requirement readable."),
    satire: "Leverage is influence with receipts. Without the receipts it is just a person pointing dramatically at the weather.",
  },
};

const intensityBoundary = "Delivery Intensity changes written-signal salience only: SUBTLE, BALANCED, and OVERT are not semantic weights and cannot change the request, offer, return, demand, consequence, actor, target, timing, knowledge, leverage, condition, permission, prohibition, or outcome.";

function freezeArticle(keywordId, spec) {
  const definition = KEYWORD_BY_ID.get(keywordId);
  if (!definition) throw new Error(`No canonical keyword definition for lorebook article ${keywordId}`);
  return Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    contentSchemaVersion: LOREBOOK_CONTENT_SCHEMA_VERSION,
    keywordId,
    canonicalName: definition.displayName,
    category: definition.category,
    streetDefinition: spec.streetDefinition,
    technicalDefinition: definition.definition,
    technicalMechanicNote: spec.technicalMechanicNote,
    explicitNonMeanings: [...definition.explicitNonMeanings],
    canonicalShape: {
      arity: definition.arity,
      typedArgumentRoles: { ...definition.typedArgumentRoles },
      optionalArgumentKeys: [...definition.optionalArgumentKeys],
      directionality: definition.directionality,
      symmetry: definition.symmetry,
      reciprocity: definition.reciprocity,
      truthAndKnowledge: { ...definition.truthAndKnowledge },
      temporalValidity: { ...definition.temporalValidity },
    },
    whatThisChanges: spec.whatThisChanges,
    mechanics: {
      ...spec.mechanics,
      historyBehavior: definition.temporalityAndHistoryBehavior,
      contradictionPolicy: definition.contradictionPolicy.resolution,
    },
    materialRelationships: spec.materialRelationships,
    emotionalLeverage: spec.emotionalLeverage,
    relationships: spec.relationships,
    crossKeywordRuleRefs: CROSS_KEYWORD_RULES
      .filter((rule) => rule.keywords.includes(keywordId))
      .map((rule) => ({ ruleId: rule.ruleId, result: rule.result, status: "PROJECT_AUTHORED" })),
    contradictionRuleRefs: CONTRADICTION_RULES
      .filter((rule) => rule.leftKeywordId === keywordId || rule.rightKeywordId === keywordId)
      .map((rule) => ({ ruleId: rule.ruleId, resolution: rule.resolution, status: "PROJECT_AUTHORED" })),
    actionConnections: canonicalActionConnections(definition),
    based: basedConnection(spec.based, spec.cueReading),
    intensityBoundary,
    examples: spec.examples,
    commonlyConfusedWith: spec.confusedWith,
    evidence: [
      evidence("project-keyword-core", "Canonical definition, typed argument roles, affordances, blockers, and truth/temporal policy.", keywordId),
      ...spec.evidence,
    ],
    illustration: spec.illustration,
    satiricalNote: {
      label: "MARGINAL COMMENTARY — NOT A CANONICAL RULE",
      status: "COMMENTARY_ONLY",
      text: spec.satire,
    },
  });
}

export const CANONICAL_KEYWORD_IDS = Object.freeze(KEYWORDS.map((entry) => entry.keywordId));

export const KEYWORD_ARTICLES = Object.freeze(Object.fromEntries(
  CANONICAL_KEYWORD_IDS.map((keywordId) => [keywordId, freezeArticle(keywordId, ARTICLE_SPECS[keywordId])]),
));

export const KEYWORD_ARTICLE_LIST = Object.freeze(CANONICAL_KEYWORD_IDS.map((keywordId) => KEYWORD_ARTICLES[keywordId]));

export const READING_TRAILS = Object.freeze([
  {
    trailId: "MATERIAL_PRESSURE",
    title: "Material Pressure",
    editorialStatus: "EDITORIAL_INTERPRETATION",
    keywordIds: ["NEEDS", "OWES", "OWNS", "CONTROLS", "HAS_LEVERAGE_OVER"],
    rationale: "Follow shortage, obligation, title, access authority, and the requirement that leverage show its basis.",
  },
  {
    trailId: "RELATIONSHIP_RUPTURE",
    title: "Relationship Rupture",
    editorialStatus: "EDITORIAL_INTERPRETATION",
    keywordIds: ["PROMISED_TO", "TRUSTS", "RESENTS", "FEARS", "PROHIBITED"],
    rationale: "Follow commitments, reliability expectations, grievance, vulnerability, and explicit boundaries.",
  },
  {
    trailId: "REPAIR_NEGOTIATION",
    title: "Repair / Negotiation",
    editorialStatus: "EDITORIAL_INTERPRETATION",
    keywordIds: ["BELIEVES", "PERMITTED", "DEPENDS_ON", "NEEDS", "TRUSTS"],
    rationale: "Follow perspective, authorization, reliance, material need, and a request that preserves refusal space.",
  },
]);

export const LOREBOOK_METADATA = Object.freeze({
  schemaVersion: LOREBOOK_CONTENT_SCHEMA_VERSION,
  title: LOREBOOK_TITLE,
  subtitle: LOREBOOK_SUBTITLE,
  canonicalKeywordSource: "src/keywords.mjs",
  articleCount: KEYWORD_ARTICLE_LIST.length,
  canonicalKeywordIds: CANONICAL_KEYWORD_IDS,
  relationshipTypes: RELATIONSHIP_TYPES,
  basedBoundary: "BASED has five cues and twenty ordered two-cue Vibes; no numeric cue mixture authority is present.",
  tplBoundary: "TPL changes written presentation only. Runtime protocol approval and dynamic dialogue remain deferred.",
  evidenceBoundary: "Imported research is attributed, defeasible evidence/prior material. It is not mechanics, BASED mapping, TPL protocol, or runtime dialogue.",
  illustrationSystem: "TRAPSTAR_FIELD_GUIDE_ILLUSTRATION",
  licenseStatus: "UNLICENSED — project-owner license decision remains open.",
});

/**
 * Compatibility projection for src/lorebook/site.mjs. The canonical articles
 * above retain rich typed fields; this projection uses the site's stable
 * names (actions, targetId, uppercase relationship types, and scenario).
 * Illustration SVG is intentionally supplied by illustrations.mjs so the
 * content source cannot accidentally replace the shared visual grammar with
 * metadata that is not renderable SVG.
 */
export const LOREBOOK_CONTENT = Object.freeze({
  schemaVersion: LOREBOOK_SCHEMA_VERSION,
  evidenceSources: EVIDENCE_SOURCES,
  site: Object.freeze({
    title: LOREBOOK_TITLE,
    subtitle: LOREBOOK_SUBTITLE,
    description: "A living, nonlinear field guide to authored human-logic mechanics.",
  }),
  articles: Object.freeze(KEYWORD_ARTICLE_LIST.map((article) => ({
    ...article,
    actions: article.actionConnections.filter((action) => action.implementationStatus === "IMPLEMENTED"),
    unsupportedAffordances: article.actionConnections.filter((action) => action.implementationStatus !== "IMPLEMENTED"),
    relationships: article.relationships.map((edge) => ({
      targetId: edge.targetKeywordId,
      type: edge.type === "commonly_co_occurs_with" ? "CO_OCCURS_WITH" : edge.type.toUpperCase(),
      label: edge.type.replaceAll("_", " "),
      rationale: `${edge.condition} ${edge.note}`,
      direction: edge.type === "commonly_co_occurs_with"
        ? "CO_OCCURRENCE_ONLY"
        : edge.type === "contradicts"
          ? "BIDIRECTIONAL_BY_EXPLICIT_RULE"
          : "OUTBOUND_FROM_THIS_TERM",
    })),
    based: {
      vibes: article.based.vibes.map((vibe) => vibe.vibeId),
      intensities: [...DELIVERY_INTENSITIES],
      note: article.based.invariant,
    },
    scenario: article.examples.scenario,
    confusedWith: article.commonlyConfusedWith,
    evidence: article.evidence.map((reference) => ({
      ...reference,
      label: reference.claimScope,
    })),
    illustration: {
      illustrationId: `${article.keywordId}_TRAPSTAR_ILLUSTRATION`,
      svg: renderKeywordIllustration(article.keywordId, {
        displayName: article.canonicalName,
        stakeLabel: article.illustration.elements.find((element) => element.role === "material_stake")?.label,
        relationshipType: article.keywordId,
        transitionLabel: article.illustration.elements.find((element) => element.role === "directional_transition")?.label,
        stateLabel: "AUTHORED FACT / STATE",
        description: article.illustration.altText,
      }),
      alt: article.illustration.altText,
      description: article.illustration.altText,
      viewBox: article.illustration.viewBox,
    },
    illustrationMetadata: article.illustration,
    satiricalNote: article.satiricalNote.text,
  }))),
  trails: Object.freeze(READING_TRAILS.map((trail) => ({
    trailId: trail.trailId,
    name: trail.title,
    description: trail.rationale,
    keywordIds: [...trail.keywordIds],
  }))),
  includeCanonicalRuleEdges: true,
});

export function validateLorebookContent() {
  const errors = [];
  const canonicalIds = new Set(CANONICAL_KEYWORD_IDS);
  const articleIds = Object.keys(KEYWORD_ARTICLES);
  if (articleIds.length !== CANONICAL_KEYWORD_IDS.length) errors.push("article_count_mismatch");
  for (const keywordId of CANONICAL_KEYWORD_IDS) {
    const article = KEYWORD_ARTICLES[keywordId];
    if (!article) {
      errors.push(`${keywordId}:missing_article`);
      continue;
    }
    for (const field of ["streetDefinition", "technicalDefinition", "whatThisChanges", "mechanics", "materialRelationships", "emotionalLeverage", "relationships", "actionConnections", "based", "examples", "commonlyConfusedWith", "evidence", "illustration", "satiricalNote"]) {
      if (article[field] === undefined || article[field] === null) errors.push(`${keywordId}:missing_${field}`);
    }
    for (const edge of article.relationships) {
      if (!canonicalIds.has(edge.targetKeywordId)) errors.push(`${keywordId}:unknown_relationship_target:${edge.targetKeywordId}`);
      if (!RELATIONSHIP_TYPES.includes(edge.type)) errors.push(`${keywordId}:unknown_relationship_type:${edge.type}`);
      if (edge.direction !== RELATIONSHIP_DIRECTION_RULES[edge.type]) errors.push(`${keywordId}:relationship_direction:${edge.targetKeywordId}`);
    }
    for (const action of article.actionConnections) {
      if (action.implementationStatus === "IMPLEMENTED" && (!ACTION_BY_ID.has(action.actionId) || !action.macroAct || !definitionForAction(action.actionId)?.possibleAffordances[action.macroAct]?.includes(action.actionId))) {
        errors.push(`${keywordId}:action_affordance_mismatch:${action.actionId}`);
      }
    }
    for (const vibe of article.based.vibes) {
      if (!BASED_VIBES.some((entry) => entry.vibeId === vibe.vibeId)) errors.push(`${keywordId}:unknown_vibe:${vibe.vibeId}`);
    }
    if (article.based.intensities && JSON.stringify(Object.keys(article.based.intensities)) !== JSON.stringify(DELIVERY_INTENSITIES)) errors.push(`${keywordId}:intensity_coverage`);
    if (!article.illustration.altText?.trim() || article.illustration.viewBox !== "0 0 640 360") errors.push(`${keywordId}:illustration_accessibility`);
    if (article.satiricalNote.status !== "COMMENTARY_ONLY") errors.push(`${keywordId}:satire_boundary`);
    for (const reference of article.evidence) {
      if (!EVIDENCE_SOURCES[reference.sourceId]) errors.push(`${keywordId}:unknown_evidence:${reference.sourceId}`);
      if (reference.runtimeEligible !== false) errors.push(`${keywordId}:evidence_runtime_eligible`);
    }
  }
  for (const trail of READING_TRAILS) {
    for (const keywordId of trail.keywordIds) if (!canonicalIds.has(keywordId)) errors.push(`${trail.trailId}:unknown_keyword:${keywordId}`);
  }
  for (const articleId of articleIds) if (!canonicalIds.has(articleId)) errors.push(`unexpected_article:${articleId}`);
  return [...new Set(errors)];
}

function definitionForAction(actionId) {
  return KEYWORDS.find((definition) => Object.values(definition.possibleAffordances).some((actionIds) => actionIds.includes(actionId))) ?? null;
}

export const LOREBOOK_CONTENT_ERRORS = Object.freeze(validateLorebookContent());

if (LOREBOOK_CONTENT_ERRORS.length) {
  throw new Error(`Invalid lorebook content: ${LOREBOOK_CONTENT_ERRORS.join(", ")}`);
}
