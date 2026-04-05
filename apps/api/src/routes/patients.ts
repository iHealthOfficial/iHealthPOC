import type { Prisma } from "@prisma/client";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { toFhirCollectionBundle } from "../fhir/mappers.js";
import { queryString } from "../queryParams.js";
import { paramString } from "../routeParams.js";

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

const observationIn = z.object({
  category: z.string(),
  code: z.string(),
  valueString: z.string().optional(),
  valueQuantity: z.number().optional(),
  valueQuantityUnit: z.string().optional(),
  effectiveDateTime: z.string().optional(),
});

const conditionIn = z.object({
  clinicalStatus: z.string().optional(),
  verificationStatus: z.string().optional(),
  code: z.string(),
  onsetDateTime: z.string().optional(),
  recordedDate: z.string().optional(),
});

const ingestBody = z.object({
  patient: patientCore,
  labs: z.array(observationIn).optional().default([]),
  observations: z.array(observationIn).optional().default([]),
  conditions: z.array(conditionIn).optional().default([]),
});

function parseDate(s: string | undefined): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
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
      include: { observations: true, conditions: true, uploads: true },
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
      include: { observations: true, conditions: true, uploads: true },
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
    const { patient, labs, observations, conditions } = parsed.data;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const pat = await tx.patient.create({
          data: {
            family: patient.family,
            given: JSON.stringify(patient.given),
            gender: patient.gender,
            birthDate: parseDate(patient.birthDate),
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

        for (const lab of labs) {
          await tx.observation.create({
            data: {
              patientId: pat.id,
              category: "laboratory",
              code: lab.code,
              valueString: lab.valueString,
              valueQuantity: lab.valueQuantity,
              valueQuantityUnit: lab.valueQuantityUnit,
              effectiveDateTime: parseDate(lab.effectiveDateTime),
            },
          });
        }

        for (const obs of observations) {
          await tx.observation.create({
            data: {
              patientId: pat.id,
              category: obs.category || "survey",
              code: obs.code,
              valueString: obs.valueString,
              valueQuantity: obs.valueQuantity,
              valueQuantityUnit: obs.valueQuantityUnit,
              effectiveDateTime: parseDate(obs.effectiveDateTime),
            },
          });
        }

        for (const c of conditions) {
          await tx.condition.create({
            data: {
              patientId: pat.id,
              clinicalStatus: c.clinicalStatus,
              verificationStatus: c.verificationStatus,
              code: c.code,
              onsetDateTime: parseDate(c.onsetDateTime),
              recordedDate: parseDate(c.recordedDate) ?? new Date(),
            },
          });
        }

        return tx.patient.findUnique({
          where: { id: pat.id },
          include: { observations: true, conditions: true },
        });
      });

      res.status(201).json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ingest failed" });
    }
  });
}
