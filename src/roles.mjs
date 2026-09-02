const roles = [
  ["creditor", "debtor", "CREDITOR", "DEBTOR"], ["lender", "borrower", "LENDER", "BORROWER"], ["landlord", "tenant", "LANDLORD", "TENANT"], ["employer", "worker", "EMPLOYER", "WORKER"], ["supervisor", "subordinate", "SUPERVISOR", "SUBORDINATE"], ["buyer", "seller", "BUYER", "SELLER"], ["supplier", "customer", "SUPPLIER", "CUSTOMER"], ["owner", "property_borrower", "OWNER", "PROPERTY_BORROWER"], ["promisor", "promise_recipient", "PROMISOR", "PROMISE_RECIPIENT"], ["favor_giver", "favor_receiver", "FAVOR_GIVER", "FAVOR_RECEIVER"], ["authority", "subject", "AUTHORITY", "SUBJECT"], ["guardian", "dependent", "GUARDIAN", "DEPENDENT"], ["protector", "protected_person", "PROTECTOR", "PROTECTED_PERSON"], ["host", "guest", "HOST", "GUEST"], ["friend", "friend", "FRIEND", "FRIEND"], ["ally", "ally", "ALLY", "ALLY"], ["rival", "rival", "RIVAL", "RIVAL"], ["confidant", "secret_holder", "CONFIDANT", "SECRET_HOLDER"], ["witness", "observed_actor", "WITNESS", "OBSERVED_ACTOR"], ["information_holder", "information_seeker", "INFORMATION_HOLDER", "INFORMATION_SEEKER"], ["blackmailer", "pressure_target", "BLACKMAILER", "PRESSURE_TARGET"], ["negotiator", "counterpart", "NEGOTIATOR", "COUNTERPART"], ["parent", "child", "PARENT", "CHILD"], ["sibling", "sibling", "SIBLING", "SIBLING"],
];

const roleId = (source, target) => `emp.role.${source}_${target}.v1`;

export const RELATIONSHIP_ROLE_CORE = Object.freeze(roles.map(([sourceName, targetName, source, target]) => ({
  rolePairId: roleId(sourceName, targetName),
  name: `${sourceName.replaceAll("_", " ")} and ${targetName.replaceAll("_", " ")}`,
  directional: !["friend", "ally", "rival", "sibling"].includes(sourceName),
  roles: { source, target },
  relationshipFact: sourceName === "creditor" ? "OWED_BY" : sourceName === "owner" ? "CONTROLS" : "ROLE_ASSOCIATION",
  defaultOnly: true,
  suggestedStats: sourceName === "creditor" ? ["obligation", "trust", "respect", "leverage", "resentment"] : ["trust", "respect", "familiarity"],
  commonObligations: sourceName === "creditor" ? ["debt term is satisfied by the authored condition"] : [],
  commonPermissions: sourceName === "landlord" || sourceName === "owner" ? ["access may be granted or revoked by an authored rule"] : [],
  possibleAskActions: sourceName === "creditor" ? ["REQUEST_EXTENSION", "REQUEST_EVIDENCE"] : ["REQUEST_SUPPORT"],
  possibleDealActions: sourceName === "creditor" ? ["OFFER_CASH_FOR_EXTENSION", "OFFER_PARTIAL_PAYMENT"] : ["RENEGOTIATE_TERMS"],
  possiblePressureActions: sourceName === "creditor" || sourceName === "blackmailer" ? ["INVOKE_CONSEQUENCE"] : [],
  blockersAndDefeaters: ["role_is_not_a_fact_of_current_obligation", "specific_context_or_contract_may_override_default"],
  sourceAndProjectProvenance: [{ sourceId: "project-role-core", sourceVersion: "0.1", sourceRecordId: roleId(sourceName, targetName), transformVersion: "role-core@0.1", licenseId: "PROJECT_AUTHORED" }],
  authorQuestions: ["What concrete fact establishes this role here?", "Which obligations, permissions, or leverage are actually authored?", "What would defeat or end this role?"],
})));

export function validateRoleCore(entries = RELATIONSHIP_ROLE_CORE) {
  const errors = [];
  if (entries.length < 20) errors.push("starter_role_pairs_missing");
  const ids = entries.map((entry) => entry.rolePairId);
  if (new Set(ids).size !== ids.length) errors.push("duplicate_role_pair_id");
  entries.forEach((entry) => {
    if (!entry.defaultOnly) errors.push(`${entry.rolePairId}:not_default_only`);
    if (!entry.sourceAndProjectProvenance?.length) errors.push(`${entry.rolePairId}:missing_provenance`);
  });
  return errors;
}
