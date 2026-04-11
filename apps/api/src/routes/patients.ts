import type { Prisma } from "@prisma/client";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { logActivity } from "../activity/logActivity.js";
import { prisma } from "../db.js";
import { toFhirCollectionBundle } from "../fhir/mappers.js";
import { queryString } from "../queryParams.js";
import { paramString } from "../routeParams.js";
import { patientIncludeAll } from "./patientsIncludes.js";

const FILTER_STRING_FIELDS = [
  "family",
  "gender",
  "phone",
  "email",
  "addressLine",
  "city",
  "state",
  "postalCode",
  "country",
] as const;

const SEARCH_FIELDS = [...FILTER_STRING_FIELDS, "given", "active"] as const;
type SearchField = (typeof SEARCH_FIELDS)[number];

function collectPatientQuery(req: Request): Record<string, string | undefined> {
  const q = req.query;
  const out: Record<string, string | undefined> = {};
  const keys = [
    "active",
    ...FILTER_STRING_FIELDS,
    "birthDateFrom",
    "birthDateTo",
    "searchField",
    "search",
  ] as const;
  for (const k of keys) {
    out[k] = queryString(q[k]);
  }
  return out;
}

function buildPatientFilter(q: Record<string, string | undefined>): Prisma.PatientWhereInput {
  const and: Prisma.PatientWhereInput[] = [];

  if (q.active === "true") and.push({ active: true });
  if (q.active === "false") and.push({ active: false });

  for (const f of FILTER_STRING_FIELDS) {
    const v = q[f]?.trim();
    if (v) and.push({ [f]: { contains: v } } as Prisma.PatientWhereInput);
  }

  const bd: Prisma.DateTimeNullableFilter = {};
  const dFrom = q.birthDateFrom ? parseDate(q.birthDateFrom) : undefined;
  const dTo = q.birthDateTo ? parseDate(q.birthDateTo) : undefined;
  if (dFrom) bd.gte = dFrom;
  if (dTo) {
    const end = new Date(dTo);
    end.setUTCHours(23, 59, 59, 999);
    bd.lte = end;
  }
  if (Object.keys(bd).length) and.push({ birthDate: bd });

  const sf = q.searchField?.trim() as SearchField | undefined;
  const sv = q.search?.trim();
  if (sf && sv && (SEARCH_FIELDS as readonly string[]).includes(sf)) {
    if (sf === "given") {
      and.push({ given: { contains: sv } });
    } else if (sf === "active") {
      const low = sv.toLowerCase();
      if (["true", "yes", "1"].includes(low)) and.push({ active: true });
      else if (["false", "no", "0"].includes(low)) and.push({ active: false });
    } else {
      and.push({ [sf]: { contains: sv } } as Prisma.PatientWhereInput);
    }
  }

  return and.length ? { AND: and } : {};
}

const patientCore = z.object({
  family: z.string().optional(),
  given: z.array(z.string()).min(1, "At least one given name"),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  active: z.boolean().optional(),
  phone: z.string().optional(),
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  identifierSystem: z.string().optional(),
  identifierValue: z.string().optional(),
});

/** Index into the ingest `encounters` array (post-filter order must match client). */
const encounterIndexIn = z.number().int().nonnegative().optional();

const practitionerIn = z.object({
  family: z.string().optional(),
  given: z.array(z.string()).min(1),
  phone: z.string().optional(),
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  identifierSystem: z.string().optional(),
  identifierValue: z.string().optional(),
  specialty: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

const diagnosticReportIn = z.object({
  status: z.string().optional(),
  code: z.string().min(1),
  conclusion: z.string().optional(),
  effectiveDateTime: z.string().optional(),
  issued: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

const procedureIn = z.object({
  status: z.string().optional(),
  code: z.string().min(1),
  performedDateTime: z.string().optional(),
  bodySite: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

const allergyIntoleranceIn = z.object({
  clinicalStatus: z.string().optional(),
  verificationStatus: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  code: z.string().min(1),
  reaction: z.string().optional(),
  onsetDateTime: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

const organizationIn = z.object({
  identifierSystem: z.string().optional(),
  identifierValue: z.string().optional(),
  active: z.boolean().optional(),
  typeText: z.string().optional(),
  typeCode: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  contactAddressLine: z.string().optional(),
});

const encounterIn = z.object({
  status: z.string().optional(),
  classCode: z.string().optional(),
  typeText: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  practitionerIndex: z.number().int().nonnegative().nullable().optional(),
  /** Index into ingest `organizations` for FHIR Encounter.serviceProvider */
  serviceProviderOrganizationIndex: z.number().int().nonnegative().nullable().optional(),
  /** Business / legacy id from the source system (manual; not generated). */
  legacyIdentifierSystem: z.string().optional(),
  legacyIdentifierValue: z.string().optional(),
});

const coverageIn = z.object({
  status: z.string().optional(),
  insurerName: z.string().optional(),
  planName: z.string().optional(),
  subscriberId: z.string().optional(),
  memberId: z.string().optional(),
  relationshipText: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

const medicationRequestIn = z.object({
  status: z.string().optional(),
  intent: z.string().optional(),
  medicationCode: z.string().min(1),
  dosageText: z.string().optional(),
  authoredOn: z.string().optional(),
  requesterText: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

const medicationAdministrationIn = z.object({
  status: z.string().optional(),
  medicationCode: z.string().min(1),
  effectiveDateTime: z.string().optional(),
  doseText: z.string().optional(),
  routeText: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

const medicationDispenseIn = z.object({
  status: z.string().optional(),
  medicationCode: z.string().min(1),
  whenHandedOver: z.string().optional(),
  quantityText: z.string().optional(),
  daysSupply: z.number().int().optional(),
  encounterIndex: encounterIndexIn,
});

const medicationStatementIn = z.object({
  status: z.string().optional(),
  medicationCode: z.string().min(1),
  effectiveDateTime: z.string().optional(),
  dosageText: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

const medicationProductIn = z.object({
  code: z.string().min(1),
  status: z.string().optional(),
  form: z.string().optional(),
  strength: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

const immunizationIn = z.object({
  status: z.string().optional(),
  vaccineCode: z.string().min(1),
  occurrenceDateTime: z.string().optional(),
  lotNumber: z.string().optional(),
  manufacturerText: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

const observationIn = z.object({
  category: z.string(),
  code: z.string(),
  valueString: z.string().optional(),
  valueQuantity: z.number().optional(),
  valueQuantityUnit: z.string().optional(),
  effectiveDateTime: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

/** Labs payload omits category — always stored as `laboratory` Observation. */
const labObservationIn = z.object({
  code: z.string().min(1),
  valueString: z.string().optional(),
  valueQuantity: z.number().optional(),
  valueQuantityUnit: z.string().optional(),
  effectiveDateTime: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

const conditionIn = z.object({
  clinicalStatus: z.string().optional(),
  verificationStatus: z.string().optional(),
  code: z.string(),
  onsetDateTime: z.string().optional(),
  recordedDate: z.string().optional(),
  encounterIndex: encounterIndexIn,
});

const familyMemberHistoryConditionIn = z.object({
  code: z.string().min(1),
  outcomeText: z.string().optional(),
  outcomeCode: z.string().optional(),
  contributedToDeath: z.boolean().optional(),
});

const familyMemberHistoryProcedureIn = z.object({
  code: z.string().min(1),
  outcomeText: z.string().optional(),
  outcomeCode: z.string().optional(),
  contributedToDeath: z.boolean().optional(),
});

const familyMemberHistoryIn = z.object({
  identifierSystem: z.string().optional(),
  identifierValue: z.string().optional(),
  status: z.string().optional(),
  dataAbsentReasonText: z.string().optional(),
  dataAbsentReasonCode: z.string().optional(),
  date: z.string().optional(),
  name: z.string().optional(),
  relationshipText: z.string().optional(),
  relationshipCode: z.string().optional(),
  sex: z.string().optional(),
  ageString: z.string().optional(),
  deceasedBoolean: z.boolean().optional(),
  deceasedDate: z.string().optional(),
  reasonText: z.string().optional(),
  reasonCode: z.string().optional(),
  conditions: z.array(familyMemberHistoryConditionIn).optional().default([]),
  procedures: z.array(familyMemberHistoryProcedureIn).optional().default([]),
});

const ingestBody = z.object({
  patient: patientCore,
  practitioners: z.array(practitionerIn).optional().default([]),
  organizations: z.array(organizationIn).optional().default([]),
  labs: z.array(labObservationIn).optional().default([]),
  observations: z.array(observationIn).optional().default([]),
  conditions: z.array(conditionIn).optional().default([]),
  diagnosticReports: z.array(diagnosticReportIn).optional().default([]),
  procedures: z.array(procedureIn).optional().default([]),
  allergyIntolerances: z.array(allergyIntoleranceIn).optional().default([]),
  encounters: z.array(encounterIn).optional().default([]),
  coverages: z.array(coverageIn).optional().default([]),
  medicationRequests: z.array(medicationRequestIn).optional().default([]),
  medicationAdministrations: z.array(medicationAdministrationIn).optional().default([]),
  medicationDispenses: z.array(medicationDispenseIn).optional().default([]),
  medicationStatements: z.array(medicationStatementIn).optional().default([]),
  medications: z.array(medicationProductIn).optional().default([]),
  immunizations: z.array(immunizationIn).optional().default([]),
  familyMemberHistories: z.array(familyMemberHistoryIn).optional().default([]),
});

function parseDate(s: string | undefined): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

type IngestPayload = z.infer<typeof ingestBody>;

function encounterIdAt(index: number | undefined, encounterIds: string[]): string | undefined {
  if (index == null) return undefined;
  if (index < 0 || index >= encounterIds.length) return undefined;
  return encounterIds[index]!;
}

async function deletePatientClinicalChildren(tx: Prisma.TransactionClient, patientId: string): Promise<void> {
  await tx.observation.deleteMany({ where: { patientId } });
  await tx.condition.deleteMany({ where: { patientId } });
  await tx.diagnosticReport.deleteMany({ where: { patientId } });
  await tx.procedure.deleteMany({ where: { patientId } });
  await tx.allergyIntolerance.deleteMany({ where: { patientId } });
  await tx.medicationRequest.deleteMany({ where: { patientId } });
  await tx.medicationAdministration.deleteMany({ where: { patientId } });
  await tx.medicationDispense.deleteMany({ where: { patientId } });
  await tx.medicationStatement.deleteMany({ where: { patientId } });
  await tx.medication.deleteMany({ where: { patientId } });
  await tx.immunization.deleteMany({ where: { patientId } });
  await tx.encounter.deleteMany({ where: { patientId } });
  await tx.practitioner.deleteMany({ where: { patientId } });
  await tx.organization.deleteMany({ where: { patientId } });
  await tx.familyMemberHistory.deleteMany({ where: { patientId } });
  await tx.coverage.deleteMany({ where: { patientId } });
}

async function createPatientClinicalChildren(
  tx: Prisma.TransactionClient,
  patientId: string,
  {
    practitioners,
    organizations,
    labs,
    observations,
    conditions,
    diagnosticReports,
    procedures,
    allergyIntolerances,
    encounters,
    coverages,
    medicationRequests,
    medicationAdministrations,
    medicationDispenses,
    medicationStatements,
    medications,
    immunizations,
    familyMemberHistories,
  }: IngestPayload,
) {
  const practitionerIds: string[] = [];
  for (const pr of practitioners) {
    const row = await tx.practitioner.create({
      data: {
        patientId,
        family: pr.family,
        given: JSON.stringify(pr.given),
        phone: pr.phone,
        email: pr.email,
        identifierSystem: pr.identifierSystem,
        identifierValue: pr.identifierValue,
        specialty: pr.specialty,
      },
    });
    practitionerIds.push(row.id);
  }

  const organizationIds: string[] = [];
  for (const org of organizations) {
    const row = await tx.organization.create({
      data: {
        patientId,
        identifierSystem: org.identifierSystem,
        identifierValue: org.identifierValue,
        active: org.active ?? true,
        typeText: org.typeText,
        typeCode: org.typeCode,
        name: org.name.trim() || "",
        description: org.description,
        contactPhone: org.contactPhone,
        contactEmail: org.contactEmail,
        contactAddressLine: org.contactAddressLine,
      },
    });
    organizationIds.push(row.id);
  }

  const encounterIds: string[] = [];
  for (const enc of encounters) {
    const idx = enc.practitionerIndex;
    const practitionerId =
      idx != null && idx >= 0 && idx < practitionerIds.length ? practitionerIds[idx]! : undefined;
    const spIdx = enc.serviceProviderOrganizationIndex;
    const serviceProviderOrganizationId =
      spIdx != null && spIdx >= 0 && spIdx < organizationIds.length ? organizationIds[spIdx]! : undefined;
    const row = await tx.encounter.create({
      data: {
        patientId,
        practitionerId,
        serviceProviderOrganizationId,
        status: enc.status,
        classCode: enc.classCode,
        typeText: enc.typeText,
        periodStart: parseDate(enc.periodStart),
        periodEnd: parseDate(enc.periodEnd),
        legacyIdentifierSystem: enc.legacyIdentifierSystem,
        legacyIdentifierValue: enc.legacyIdentifierValue,
      },
    });
    encounterIds.push(row.id);
  }

  for (let i = 0; i < practitioners.length; i++) {
    const pr = practitioners[i]!;
    const eid = encounterIdAt(pr.encounterIndex, encounterIds);
    if (eid) {
      await tx.practitioner.update({
        where: { id: practitionerIds[i]! },
        data: { contextEncounterId: eid },
      });
    }
  }

  for (const lab of labs) {
    await tx.observation.create({
      data: {
        patientId,
        category: "laboratory",
        code: lab.code,
        valueString: lab.valueString,
        valueQuantity: lab.valueQuantity,
        valueQuantityUnit: lab.valueQuantityUnit,
        effectiveDateTime: parseDate(lab.effectiveDateTime),
        encounterId: encounterIdAt(lab.encounterIndex, encounterIds),
      },
    });
  }

  for (const obs of observations) {
    await tx.observation.create({
      data: {
        patientId,
        category: obs.category || "survey",
        code: obs.code,
        valueString: obs.valueString,
        valueQuantity: obs.valueQuantity,
        valueQuantityUnit: obs.valueQuantityUnit,
        effectiveDateTime: parseDate(obs.effectiveDateTime),
        encounterId: encounterIdAt(obs.encounterIndex, encounterIds),
      },
    });
  }

  for (const c of conditions) {
    await tx.condition.create({
      data: {
        patientId,
        clinicalStatus: c.clinicalStatus,
        verificationStatus: c.verificationStatus,
        code: c.code,
        onsetDateTime: parseDate(c.onsetDateTime),
        recordedDate: parseDate(c.recordedDate) ?? new Date(),
        encounterId: encounterIdAt(c.encounterIndex, encounterIds),
      },
    });
  }

  for (const dr of diagnosticReports) {
    await tx.diagnosticReport.create({
      data: {
        patientId,
        status: dr.status ?? "final",
        code: dr.code,
        conclusion: dr.conclusion,
        effectiveDateTime: parseDate(dr.effectiveDateTime),
        issued: parseDate(dr.issued),
        encounterId: encounterIdAt(dr.encounterIndex, encounterIds),
      },
    });
  }

  for (const proc of procedures) {
    await tx.procedure.create({
      data: {
        patientId,
        status: proc.status,
        code: proc.code,
        performedDateTime: parseDate(proc.performedDateTime),
        bodySite: proc.bodySite,
        encounterId: encounterIdAt(proc.encounterIndex, encounterIds),
      },
    });
  }

  for (const a of allergyIntolerances) {
    await tx.allergyIntolerance.create({
      data: {
        patientId,
        clinicalStatus: a.clinicalStatus,
        verificationStatus: a.verificationStatus,
        type: a.type,
        category: a.category,
        code: a.code,
        reaction: a.reaction,
        onsetDateTime: parseDate(a.onsetDateTime),
        encounterId: encounterIdAt(a.encounterIndex, encounterIds),
      },
    });
  }

  for (const cov of coverages) {
    await tx.coverage.create({
      data: {
        patientId,
        status: cov.status,
        insurerName: cov.insurerName,
        planName: cov.planName,
        subscriberId: cov.subscriberId,
        memberId: cov.memberId,
        relationshipText: cov.relationshipText,
        periodStart: parseDate(cov.periodStart),
        periodEnd: parseDate(cov.periodEnd),
      },
    });
  }

  for (const mr of medicationRequests) {
    await tx.medicationRequest.create({
      data: {
        patientId,
        status: mr.status,
        intent: mr.intent,
        medicationCode: mr.medicationCode,
        dosageText: mr.dosageText,
        authoredOn: parseDate(mr.authoredOn),
        requesterText: mr.requesterText,
        encounterId: encounterIdAt(mr.encounterIndex, encounterIds),
      },
    });
  }

  for (const ma of medicationAdministrations) {
    await tx.medicationAdministration.create({
      data: {
        patientId,
        status: ma.status,
        medicationCode: ma.medicationCode,
        effectiveDateTime: parseDate(ma.effectiveDateTime),
        doseText: ma.doseText,
        routeText: ma.routeText,
        encounterId: encounterIdAt(ma.encounterIndex, encounterIds),
      },
    });
  }

  for (const md of medicationDispenses) {
    await tx.medicationDispense.create({
      data: {
        patientId,
        status: md.status,
        medicationCode: md.medicationCode,
        whenHandedOver: parseDate(md.whenHandedOver),
        quantityText: md.quantityText,
        daysSupply: md.daysSupply,
        encounterId: encounterIdAt(md.encounterIndex, encounterIds),
      },
    });
  }

  for (const ms of medicationStatements) {
    await tx.medicationStatement.create({
      data: {
        patientId,
        status: ms.status,
        medicationCode: ms.medicationCode,
        effectiveDateTime: parseDate(ms.effectiveDateTime),
        dosageText: ms.dosageText,
        encounterId: encounterIdAt(ms.encounterIndex, encounterIds),
      },
    });
  }

  for (const med of medications) {
    await tx.medication.create({
      data: {
        patientId,
        code: med.code,
        status: med.status,
        form: med.form,
        strength: med.strength,
        encounterId: encounterIdAt(med.encounterIndex, encounterIds),
      },
    });
  }

  for (const im of immunizations) {
    await tx.immunization.create({
      data: {
        patientId,
        status: im.status,
        vaccineCode: im.vaccineCode,
        occurrenceDateTime: parseDate(im.occurrenceDateTime),
        lotNumber: im.lotNumber,
        manufacturerText: im.manufacturerText,
        encounterId: encounterIdAt(im.encounterIndex, encounterIds),
      },
    });
  }

  for (const fmh of familyMemberHistories) {
    await tx.familyMemberHistory.create({
      data: {
        patientId,
        identifierSystem: fmh.identifierSystem,
        identifierValue: fmh.identifierValue,
        status: fmh.status,
        dataAbsentReasonText: fmh.dataAbsentReasonText,
        dataAbsentReasonCode: fmh.dataAbsentReasonCode,
        date: parseDate(fmh.date),
        name: fmh.name,
        relationshipText: fmh.relationshipText,
        relationshipCode: fmh.relationshipCode,
        sex: fmh.sex,
        ageString: fmh.ageString,
        deceasedBoolean: fmh.deceasedBoolean,
        deceasedDate: parseDate(fmh.deceasedDate),
        reasonText: fmh.reasonText,
        reasonCode: fmh.reasonCode,
        conditions: {
          create: fmh.conditions.map((c) => ({
            code: c.code,
            outcomeText: c.outcomeText,
            outcomeCode: c.outcomeCode,
            contributedToDeath: c.contributedToDeath,
          })),
        },
        procedures: {
          create: fmh.procedures.map((proc) => ({
            code: proc.code,
            outcomeText: proc.outcomeText,
            outcomeCode: proc.outcomeCode,
            contributedToDeath: proc.contributedToDeath,
          })),
        },
      },
    });
  }

  return tx.patient.findUnique({
    where: { id: patientId },
    include: patientIncludeAll,
  });
}

export function registerPatientRoutes(app: Express): void {
  app.get("/api/patients", async (req: Request, res: Response) => {
    const q = collectPatientQuery(req);
    const where = buildPatientFilter(q);
    const list = await prisma.patient.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { observations: true, conditions: true, uploads: true } },
      },
    });
    const ids = list.map((p) => p.id);
    const labRows =
      ids.length > 0
        ? await prisma.observation.groupBy({
            by: ["patientId"],
            where: { category: "laboratory", patientId: { in: ids } },
            _count: { _all: true },
          })
        : [];
    const labMap = new Map(labRows.map((r) => [r.patientId, r._count._all]));
    const enriched = list.map((p) => ({
      ...p,
      _count: {
        ...p._count,
        laboratories: labMap.get(p.id) ?? 0,
      },
    }));
    res.json(enriched);
  });

  app.get("/api/patients/:id/fhir", async (req: Request, res: Response) => {
    const id = paramString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Missing id" });
      return;
    }
    const p = await prisma.patient.findUnique({
      where: { id },
      include: patientIncludeAll,
    });
    if (!p) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.type("json").json(toFhirCollectionBundle(p));
  });

  app.get("/api/patients/:id", async (req: Request, res: Response) => {
    const id = paramString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Missing id" });
      return;
    }
    const p = await prisma.patient.findUnique({
      where: { id },
      include: patientIncludeAll,
    });
    if (!p) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(p);
  });

  app.post("/api/patients/ingest", async (req: Request, res: Response) => {
    const parsed = ingestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { patient } = parsed.data;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const pat = await tx.patient.create({
          data: {
            family: patient.family,
            given: JSON.stringify(patient.given),
            gender: patient.gender,
            birthDate: parseDate(patient.birthDate),
            active: patient.active ?? true,
            phone: patient.phone,
            email: patient.email || undefined,
            addressLine: patient.addressLine,
            city: patient.city,
            state: patient.state,
            postalCode: patient.postalCode,
            country: patient.country,
            identifierSystem: patient.identifierSystem,
            identifierValue: patient.identifierValue,
          },
        });
        return createPatientClinicalChildren(tx, pat.id, parsed.data);
      });

      if (result?.id) {
        await logActivity({
          patientId: result.id,
          action: "patient_ingested",
          detail: "New patient record created",
        });
      }

      res.status(201).json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ingest failed" });
    }
  });

  /** Replace all clinical data for a patient (uploads unchanged). Same JSON body as POST /ingest. */
  app.put("/api/patients/:id", async (req: Request, res: Response) => {
    const id = paramString(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Missing id" });
      return;
    }
    const parsed = ingestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { patient } = parsed.data;

    try {
      const result = await prisma.$transaction(async (tx) => {
        await deletePatientClinicalChildren(tx, id);
        await tx.patient.update({
          where: { id },
          data: {
            family: patient.family,
            given: JSON.stringify(patient.given),
            gender: patient.gender,
            birthDate: parseDate(patient.birthDate),
            active: patient.active ?? true,
            phone: patient.phone,
            email: patient.email || undefined,
            addressLine: patient.addressLine,
            city: patient.city,
            state: patient.state,
            postalCode: patient.postalCode,
            country: patient.country,
            identifierSystem: patient.identifierSystem,
            identifierValue: patient.identifierValue,
          },
        });
        return createPatientClinicalChildren(tx, id, parsed.data);
      });

      await logActivity({
        patientId: id,
        action: "patient_updated",
        detail: "Patient clinical data replaced",
      });

      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Update failed" });
    }
  });
}
