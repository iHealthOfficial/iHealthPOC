import type { Express, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

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
  app.get("/api/patients", async (_req: Request, res: Response) => {
    const list = await prisma.patient.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { observations: true, conditions: true, uploads: true } },
      },
    });
    res.json(list);
  });

  app.get("/api/patients/:id", async (req: Request, res: Response) => {
    const p = await prisma.patient.findUnique({
      where: { id: req.params.id },
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
