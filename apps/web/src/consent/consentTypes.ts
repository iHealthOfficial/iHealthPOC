/** FHIR resource types that the patient summary can gate on consent (chunks 2–3). */
export const CONSENT_RESOURCE_TYPES = [
  "Encounter",
  "Observation",
  "Condition",
  "DiagnosticReport",
  "Procedure",
  "AllergyIntolerance",
  "MedicationRequest",
  "MedicationAdministration",
  "MedicationDispense",
  "MedicationStatement",
  "Medication",
  "Immunization",
  "Coverage",
  "FamilyMemberHistory",
] as const;

export type ConsentResourceType = (typeof CONSENT_RESOURCE_TYPES)[number];

export const CONSENT_RESOURCE_META: Record<
  ConsentResourceType,
  { title: string; subtitle: string }
> = {
  Encounter: { title: "Encounter", subtitle: "Visits, admissions, and care episodes" },
  Observation: { title: "Observation", subtitle: "Labs, vitals, and other observations" },
  Condition: { title: "Condition", subtitle: "Diagnoses and problem list" },
  DiagnosticReport: { title: "DiagnosticReport", subtitle: "Reports and imaging summaries" },
  Procedure: { title: "Procedure", subtitle: "Procedures and interventions" },
  AllergyIntolerance: { title: "AllergyIntolerance", subtitle: "Allergies and intolerances" },
  MedicationRequest: { title: "MedicationRequest", subtitle: "Prescriptions and orders" },
  MedicationAdministration: { title: "MedicationAdministration", subtitle: "Doses given" },
  MedicationDispense: { title: "MedicationDispense", subtitle: "Dispensing records" },
  MedicationStatement: { title: "MedicationStatement", subtitle: "Medication use statements" },
  Medication: { title: "Medication (product)", subtitle: "Medication product / catalog rows" },
  Immunization: { title: "Immunization", subtitle: "Immunization events" },
  Coverage: { title: "Coverage", subtitle: "Insurance and coverage" },
  FamilyMemberHistory: { title: "FamilyMemberHistory", subtitle: "Family history" },
};
