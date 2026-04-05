import type { Condition, Observation, Patient, UploadArtifact } from "@prisma/client";

type PatientWithRelations = Patient & {
  observations: Observation[];
  conditions: Condition[];
  uploads: UploadArtifact[];
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
    effectiveDateTime: o.effectiveDateTime?.toISOString(),
    valueString: o.valueString ?? undefined,
    valueQuantity,
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
    onsetDateTime: c.onsetDateTime?.toISOString(),
    recordedDate: c.recordedDate?.toISOString(),
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
  for (const o of p.observations) {
    entries.push({ resource: toFhirObservation(o) });
  }
  for (const c of p.conditions) {
    entries.push({ resource: toFhirCondition(c) });
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
