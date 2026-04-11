import type { ConsentResourceType } from "./consentTypes.js";

/** Map consent resource type → patient JSON key on full patient include payload. */
const MAP: { key: ConsentResourceType; field: string }[] = [
  { key: "Encounter", field: "encounters" },
  { key: "Observation", field: "observations" },
  { key: "Condition", field: "conditions" },
  { key: "DiagnosticReport", field: "diagnosticReports" },
  { key: "Procedure", field: "procedures" },
  { key: "AllergyIntolerance", field: "allergyIntolerances" },
  { key: "MedicationRequest", field: "medicationRequests" },
  { key: "MedicationAdministration", field: "medicationAdministrations" },
  { key: "MedicationDispense", field: "medicationDispenses" },
  { key: "MedicationStatement", field: "medicationStatements" },
  { key: "Medication", field: "medications" },
  { key: "Immunization", field: "immunizations" },
  { key: "Coverage", field: "coverages" },
  { key: "FamilyMemberHistory", field: "familyMemberHistories" },
];

export function filterPatientPayloadByConsent<T extends Record<string, unknown>>(
  patient: T,
  scopes: Record<ConsentResourceType, boolean>,
): T {
  const out = { ...patient } as Record<string, unknown>;
  for (const { key, field } of MAP) {
    if (scopes[key] === false) {
      out[field] = [];
    }
  }
  return out as T;
}
