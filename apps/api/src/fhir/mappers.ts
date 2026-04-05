import type {
  AllergyIntolerance,
  Condition,
  Coverage,
  DiagnosticReport,
  Encounter,
  Immunization,
  Medication,
  MedicationAdministration,
  MedicationDispense,
  MedicationRequest,
  MedicationStatement,
  Observation,
  Patient,
  Practitioner,
  Procedure,
  UploadArtifact,
} from "@prisma/client";

type EncounterWithPractitioner = Encounter & { practitioner: Practitioner | null };

export type PatientWithRelations = Patient & {
  observations: Observation[];
  conditions: Condition[];
  uploads: UploadArtifact[];
  practitioners: Practitioner[];
  diagnosticReports: DiagnosticReport[];
  procedures: Procedure[];
  allergyIntolerances: AllergyIntolerance[];
  encounters: EncounterWithPractitioner[];
  coverages: Coverage[];
  medicationRequests: MedicationRequest[];
  medicationAdministrations: MedicationAdministration[];
  medicationDispenses: MedicationDispense[];
  medicationStatements: MedicationStatement[];
  medications: Medication[];
  immunizations: Immunization[];
};

function parseGiven(given: string): string[] {
  try {
    const v = JSON.parse(given) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function toFhirPatient(p: Patient): Record<string, unknown> {
  const given = parseGiven(p.given);
  const telecom: { system: string; value: string; use?: string }[] = [];
  if (p.phone) telecom.push({ system: "phone", value: p.phone, use: "mobile" });
  if (p.email) telecom.push({ system: "email", value: p.email });

  const lines: string[] = [];
  if (p.addressLine) lines.push(p.addressLine);

  const address =
    lines.length || p.city || p.state || p.postalCode || p.country
      ? [
          {
            line: lines.length ? lines : undefined,
            city: p.city ?? undefined,
            state: p.state ?? undefined,
            postalCode: p.postalCode ?? undefined,
            country: p.country ?? undefined,
          },
        ]
      : undefined;

  const identifier =
    p.identifierSystem && p.identifierValue
      ? [{ system: p.identifierSystem, value: p.identifierValue }]
      : undefined;

  return {
    resourceType: "Patient",
    id: p.id,
    meta: { lastUpdated: p.updatedAt.toISOString() },
    active: p.active,
    identifier,
    name: p.family || given.length
      ? [{ family: p.family ?? undefined, given: given.length ? given : undefined }]
      : undefined,
    telecom: telecom.length ? telecom : undefined,
    gender: p.gender ?? undefined,
    birthDate: p.birthDate ? p.birthDate.toISOString().slice(0, 10) : undefined,
    address,
  };
}

export function toFhirPractitioner(pr: Practitioner): Record<string, unknown> {
  const given = parseGiven(pr.given);
  const telecom: { system: string; value: string }[] = [];
  if (pr.phone) telecom.push({ system: "phone", value: pr.phone });
  if (pr.email) telecom.push({ system: "email", value: pr.email });
  const identifier =
    pr.identifierSystem && pr.identifierValue
      ? [{ system: pr.identifierSystem, value: pr.identifierValue }]
      : undefined;
  const extension =
    pr.contextEncounterId != null
      ? [
          {
            url: "http://hl7.org/fhir/StructureDefinition/event-encounter",
            valueReference: { reference: `Encounter/${pr.contextEncounterId}` },
          },
        ]
      : undefined;

  return {
    resourceType: "Practitioner",
    id: pr.id,
    meta: { lastUpdated: pr.updatedAt.toISOString() },
    identifier,
    name:
      pr.family || given.length
        ? [{ family: pr.family ?? undefined, given: given.length ? given : undefined }]
        : undefined,
    telecom: telecom.length ? telecom : undefined,
    qualification: pr.specialty
      ? [{ code: { text: pr.specialty } }]
      : undefined,
    extension,
  };
}

export function toFhirObservation(o: Observation): Record<string, unknown> {
  const valueQuantity =
    o.valueQuantity != null
      ? { value: o.valueQuantity, unit: o.valueQuantityUnit ?? undefined }
      : undefined;
  return {
    resourceType: "Observation",
    id: o.id,
    status: o.status,
    category: [{ coding: [{ display: o.category }] }],
    code: { text: o.code },
    subject: { reference: `Patient/${o.patientId}` },
    encounter: o.encounterId ? { reference: `Encounter/${o.encounterId}` } : undefined,
    effectiveDateTime: o.effectiveDateTime?.toISOString(),
    valueString: o.valueString ?? undefined,
    valueQuantity,
  };
}

export function toFhirDiagnosticReport(dr: DiagnosticReport): Record<string, unknown> {
  return {
    resourceType: "DiagnosticReport",
    id: dr.id,
    meta: { lastUpdated: dr.updatedAt.toISOString() },
    status: dr.status,
    code: { text: dr.code },
    subject: { reference: `Patient/${dr.patientId}` },
    encounter: dr.encounterId ? { reference: `Encounter/${dr.encounterId}` } : undefined,
    conclusion: dr.conclusion ?? undefined,
    effectiveDateTime: dr.effectiveDateTime?.toISOString(),
    issued: dr.issued?.toISOString(),
  };
}

export function toFhirCondition(c: Condition): Record<string, unknown> {
  return {
    resourceType: "Condition",
    id: c.id,
    clinicalStatus: c.clinicalStatus
      ? { coding: [{ code: c.clinicalStatus }] }
      : undefined,
    verificationStatus: c.verificationStatus
      ? { coding: [{ code: c.verificationStatus }] }
      : undefined,
    code: { text: c.code },
    subject: { reference: `Patient/${c.patientId}` },
    encounter: c.encounterId ? { reference: `Encounter/${c.encounterId}` } : undefined,
    onsetDateTime: c.onsetDateTime?.toISOString(),
    recordedDate: c.recordedDate?.toISOString(),
  };
}

export function toFhirProcedure(proc: Procedure): Record<string, unknown> {
  return {
    resourceType: "Procedure",
    id: proc.id,
    meta: { lastUpdated: proc.updatedAt.toISOString() },
    status: proc.status ?? undefined,
    code: { text: proc.code },
    subject: { reference: `Patient/${proc.patientId}` },
    encounter: proc.encounterId ? { reference: `Encounter/${proc.encounterId}` } : undefined,
    performedDateTime: proc.performedDateTime?.toISOString(),
    bodySite: proc.bodySite ? [{ text: proc.bodySite }] : undefined,
  };
}

export function toFhirAllergyIntolerance(a: AllergyIntolerance): Record<string, unknown> {
  return {
    resourceType: "AllergyIntolerance",
    id: a.id,
    meta: { lastUpdated: a.updatedAt.toISOString() },
    clinicalStatus: a.clinicalStatus
      ? { coding: [{ code: a.clinicalStatus }] }
      : undefined,
    verificationStatus: a.verificationStatus
      ? { coding: [{ code: a.verificationStatus }] }
      : undefined,
    type: a.type ?? undefined,
    category: a.category ? [a.category] : undefined,
    code: { text: a.code },
    patient: { reference: `Patient/${a.patientId}` },
    encounter: a.encounterId ? { reference: `Encounter/${a.encounterId}` } : undefined,
    reaction: a.reaction
      ? [{ manifestation: [{ text: a.reaction }] }]
      : undefined,
    onsetDateTime: a.onsetDateTime?.toISOString(),
  };
}

export function toFhirEncounter(e: EncounterWithPractitioner): Record<string, unknown> {
  const participant =
    e.practitionerId && e.practitioner
      ? [
          {
            actor: { reference: `Practitioner/${e.practitioner.id}` },
          },
        ]
      : undefined;
  return {
    resourceType: "Encounter",
    id: e.id,
    meta: { lastUpdated: e.updatedAt.toISOString() },
    status: e.status ?? undefined,
    class: e.classCode
      ? {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: e.classCode,
        }
      : undefined,
    type: e.typeText ? [{ text: e.typeText }] : undefined,
    subject: { reference: `Patient/${e.patientId}` },
    participant,
    period: {
      start: e.periodStart?.toISOString(),
      end: e.periodEnd?.toISOString(),
    },
  };
}

export function toFhirCoverage(cov: Coverage): Record<string, unknown> {
  return {
    resourceType: "Coverage",
    id: cov.id,
    meta: { lastUpdated: cov.updatedAt.toISOString() },
    status: cov.status ?? undefined,
    beneficiary: { reference: `Patient/${cov.patientId}` },
    subscriberId: cov.subscriberId ?? undefined,
    relationship: cov.relationshipText ? { text: cov.relationshipText } : undefined,
    period: {
      start: cov.periodStart?.toISOString(),
      end: cov.periodEnd?.toISOString(),
    },
    payor: cov.insurerName ? [{ display: cov.insurerName }] : undefined,
    class: cov.planName
      ? [
          {
            type: { text: "plan" },
            name: cov.planName,
            value: cov.memberId ?? undefined,
          },
        ]
      : undefined,
  };
}

export function toFhirMedicationRequest(mr: MedicationRequest): Record<string, unknown> {
  return {
    resourceType: "MedicationRequest",
    id: mr.id,
    meta: { lastUpdated: mr.updatedAt.toISOString() },
    status: mr.status ?? undefined,
    intent: mr.intent ?? undefined,
    subject: { reference: `Patient/${mr.patientId}` },
    encounter: mr.encounterId ? { reference: `Encounter/${mr.encounterId}` } : undefined,
    medicationCodeableConcept: { text: mr.medicationCode },
    dosageInstruction: mr.dosageText ? [{ text: mr.dosageText }] : undefined,
    authoredOn: mr.authoredOn?.toISOString(),
    requester: mr.requesterText ? { display: mr.requesterText } : undefined,
  };
}

export function toFhirMedicationAdministration(ma: MedicationAdministration): Record<string, unknown> {
  return {
    resourceType: "MedicationAdministration",
    id: ma.id,
    meta: { lastUpdated: ma.updatedAt.toISOString() },
    status: ma.status ?? undefined,
    subject: { reference: `Patient/${ma.patientId}` },
    context: ma.encounterId ? { reference: `Encounter/${ma.encounterId}` } : undefined,
    medication: { concept: { text: ma.medicationCode } },
    effectiveDateTime: ma.effectiveDateTime?.toISOString(),
    dosage: ma.doseText ? { text: ma.doseText } : undefined,
    route: ma.routeText ? { text: ma.routeText } : undefined,
  };
}

export function toFhirMedicationDispense(md: MedicationDispense): Record<string, unknown> {
  const noteParts: string[] = [];
  if (md.quantityText) noteParts.push(`Quantity: ${md.quantityText}`);
  if (md.daysSupply != null) noteParts.push(`Days supply: ${md.daysSupply}`);
  return {
    resourceType: "MedicationDispense",
    id: md.id,
    meta: { lastUpdated: md.updatedAt.toISOString() },
    status: md.status ?? undefined,
    subject: { reference: `Patient/${md.patientId}` },
    context: md.encounterId ? { reference: `Encounter/${md.encounterId}` } : undefined,
    medication: { concept: { text: md.medicationCode } },
    whenHandedOver: md.whenHandedOver?.toISOString(),
    note: noteParts.length ? [{ text: noteParts.join("; ") }] : undefined,
  };
}

export function toFhirMedicationStatement(ms: MedicationStatement): Record<string, unknown> {
  return {
    resourceType: "MedicationStatement",
    id: ms.id,
    meta: { lastUpdated: ms.updatedAt.toISOString() },
    status: ms.status ?? undefined,
    subject: { reference: `Patient/${ms.patientId}` },
    context: ms.encounterId ? { reference: `Encounter/${ms.encounterId}` } : undefined,
    medication: { concept: { text: ms.medicationCode } },
    effectiveDateTime: ms.effectiveDateTime?.toISOString(),
    dosage: ms.dosageText ? [{ text: ms.dosageText }] : undefined,
  };
}

export function toFhirMedication(m: Medication): Record<string, unknown> {
  const extension =
    m.encounterId != null
      ? [
          {
            url: "http://hl7.org/fhir/StructureDefinition/event-encounter",
            valueReference: { reference: `Encounter/${m.encounterId}` },
          },
        ]
      : undefined;
  return {
    resourceType: "Medication",
    id: m.id,
    meta: { lastUpdated: m.updatedAt.toISOString() },
    code: { text: m.code },
    status: m.status ?? undefined,
    doseForm: m.form ? { text: m.form } : undefined,
    ingredient: m.strength ? [{ item: { concept: { text: m.strength } } }] : undefined,
    extension,
  };
}

export function toFhirImmunization(im: Immunization): Record<string, unknown> {
  return {
    resourceType: "Immunization",
    id: im.id,
    meta: { lastUpdated: im.updatedAt.toISOString() },
    status: im.status ?? undefined,
    patient: { reference: `Patient/${im.patientId}` },
    encounter: im.encounterId ? { reference: `Encounter/${im.encounterId}` } : undefined,
    vaccineCode: { text: im.vaccineCode },
    occurrenceDateTime: im.occurrenceDateTime?.toISOString(),
    lotNumber: im.lotNumber ?? undefined,
    manufacturer: im.manufacturerText ? { display: im.manufacturerText } : undefined,
  };
}

export function toFhirDocumentReference(u: UploadArtifact, patientId: string): Record<string, unknown> {
  return {
    resourceType: "DocumentReference",
    id: u.id,
    status: "current",
    subject: { reference: `Patient/${patientId}` },
    content: [
      {
        attachment: {
          contentType: u.mimeType,
          title: u.originalName,
          size: u.sizeBytes,
          url: `/api/uploads/${u.id}/file`,
        },
      },
    ],
    description: `Stored artifact; scan=${u.scanStatus ?? "n/a"}, ocr=${u.ocrStatus ?? "n/a"}`,
  };
}

export function toFhirCollectionBundle(p: PatientWithRelations): Record<string, unknown> {
  const entries: { resource: Record<string, unknown> }[] = [{ resource: toFhirPatient(p) }];

  for (const pr of p.practitioners) {
    entries.push({ resource: toFhirPractitioner(pr) });
  }

  for (const o of p.observations) {
    entries.push({ resource: toFhirObservation(o) });
  }

  for (const dr of p.diagnosticReports) {
    entries.push({ resource: toFhirDiagnosticReport(dr) });
  }

  for (const c of p.conditions) {
    entries.push({ resource: toFhirCondition(c) });
  }

  for (const proc of p.procedures) {
    entries.push({ resource: toFhirProcedure(proc) });
  }

  for (const a of p.allergyIntolerances) {
    entries.push({ resource: toFhirAllergyIntolerance(a) });
  }

  for (const e of p.encounters) {
    entries.push({ resource: toFhirEncounter(e) });
  }

  for (const cov of p.coverages) {
    entries.push({ resource: toFhirCoverage(cov) });
  }

  for (const mr of p.medicationRequests) {
    entries.push({ resource: toFhirMedicationRequest(mr) });
  }

  for (const ma of p.medicationAdministrations) {
    entries.push({ resource: toFhirMedicationAdministration(ma) });
  }

  for (const md of p.medicationDispenses) {
    entries.push({ resource: toFhirMedicationDispense(md) });
  }

  for (const ms of p.medicationStatements) {
    entries.push({ resource: toFhirMedicationStatement(ms) });
  }

  for (const m of p.medications) {
    entries.push({ resource: toFhirMedication(m) });
  }

  for (const im of p.immunizations) {
    entries.push({ resource: toFhirImmunization(im) });
  }

  for (const u of p.uploads) {
    entries.push({ resource: toFhirDocumentReference(u, p.id) });
  }

  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: entries,
  };
}
