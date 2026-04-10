import type { ConsentResourceType } from "./consentTypes";

/** Patient summary main tab ids (must match `PS_MAIN_TABS` in PatientSummary). */
export type ConsentPatientMainTab =
  | "encounters"
  | "clinical"
  | "medications"
  | "insurance"
  | "family";

export const CONSENT_RESOURCES_BY_MAIN_TAB: Record<ConsentPatientMainTab, ConsentResourceType[]> = {
  encounters: ["Encounter"],
  clinical: [
    "Observation",
    "Condition",
    "DiagnosticReport",
    "Procedure",
    "AllergyIntolerance",
  ],
  medications: [
    "MedicationRequest",
    "MedicationAdministration",
    "MedicationDispense",
    "MedicationStatement",
    "Medication",
    "Immunization",
  ],
  insurance: ["Coverage"],
  family: ["FamilyMemberHistory"],
};

/** Med sub-tab id → FHIR resource (must match `PS_MED_SUB_TABS` in PatientSummary). */
export const CONSENT_RESOURCE_BY_MED_SUBTAB = {
  request: "MedicationRequest",
  administration: "MedicationAdministration",
  dispense: "MedicationDispense",
  statement: "MedicationStatement",
  medication: "Medication",
  immunization: "Immunization",
} as const satisfies Record<string, ConsentResourceType>;

export type ConsentMedSubTabId = keyof typeof CONSENT_RESOURCE_BY_MED_SUBTAB;

export function isMainTabConsentVisible(
  scopes: Record<ConsentResourceType, boolean>,
  tab: ConsentPatientMainTab,
): boolean {
  return CONSENT_RESOURCES_BY_MAIN_TAB[tab].some((r) => scopes[r]);
}

export function isMedSubTabConsentVisible(
  scopes: Record<ConsentResourceType, boolean>,
  sub: ConsentMedSubTabId,
): boolean {
  return scopes[CONSENT_RESOURCE_BY_MED_SUBTAB[sub]];
}
