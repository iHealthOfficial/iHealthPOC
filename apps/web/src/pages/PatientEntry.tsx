import { useEffect, useState } from "react";
import { api } from "../api";

type LabRow = {
  code: string;
  valueQuantity: string;
  valueQuantityUnit: string;
  effectiveDateTime: string;
  /** Index into ingest `encounters` array (only rows that will be saved). */
  encounterIndex: string;
};

type ObsRow = {
  category: string;
  code: string;
  valueString: string;
  effectiveDateTime: string;
  encounterIndex: string;
};

type CondRow = {
  code: string;
  clinicalStatus: string;
  verificationStatus: string;
  onsetDateTime: string;
  recordedDate: string;
  encounterIndex: string;
};

type ProcedureRow = {
  status: string;
  code: string;
  performedDateTime: string;
  bodySite: string;
  encounterIndex: string;
};

type AllergyRow = {
  clinicalStatus: string;
  verificationStatus: string;
  type: string;
  category: string;
  code: string;
  reaction: string;
  onsetDateTime: string;
  encounterIndex: string;
};

type EncounterRow = {
  status: string;
  classCode: string;
  typeText: string;
  periodStart: string;
  periodEnd: string;
  /** Index in ingest `practitioners` array (only rows with given names), or "" for none */
  practitionerIndex: string;
};

/** Maps to API Coverage model (patient insurance capture). */
type CoverageRow = {
  status: string;
  insurerName: string;
  planName: string;
  subscriberId: string;
  memberId: string;
  relationshipText: string;
  periodStart: string;
  periodEnd: string;
};

type PractitionerRow = {
  family: string;
  given: string;
  phone: string;
  email: string;
  identifierSystem: string;
  identifierValue: string;
  specialty: string;
  encounterIndex: string;
};

/** FHIR DiagnosticReport — report-level metadata (lab values are Observations with category laboratory). */
type DiagnosticReportRow = {
  status: string;
  code: string;
  conclusion: string;
  effectiveDateTime: string;
  issued: string;
  encounterIndex: string;
};

type MedicationRequestRow = {
  status: string;
  intent: string;
  medicationCode: string;
  dosageText: string;
  authoredOn: string;
  requesterText: string;
  encounterIndex: string;
};

type MedicationAdministrationRow = {
  status: string;
  medicationCode: string;
  effectiveDateTime: string;
  doseText: string;
  routeText: string;
  encounterIndex: string;
};

type MedicationDispenseRow = {
  status: string;
  medicationCode: string;
  whenHandedOver: string;
  quantityText: string;
  daysSupply: string;
  encounterIndex: string;
};

type MedicationStatementRow = {
  status: string;
  medicationCode: string;
  effectiveDateTime: string;
  dosageText: string;
  encounterIndex: string;
};

type MedicationProductRow = {
  code: string;
  status: string;
  form: string;
  strength: string;
  encounterIndex: string;
};

type ImmunizationRow = {
  status: string;
  vaccineCode: string;
  occurrenceDateTime: string;
  lotNumber: string;
  manufacturerText: string;
  encounterIndex: string;
};

const emptyLab = (): LabRow => ({
  code: "",
  valueQuantity: "",
  valueQuantityUnit: "",
  effectiveDateTime: "",
  encounterIndex: "",
});

const emptyObs = (): ObsRow => ({
  category: "vital-signs",
  code: "",
  valueString: "",
  effectiveDateTime: "",
  encounterIndex: "",
});

const emptyCond = (): CondRow => ({
  code: "",
  clinicalStatus: "active",
  verificationStatus: "confirmed",
  onsetDateTime: "",
  recordedDate: "",
  encounterIndex: "",
});

const emptyProcedure = (): ProcedureRow => ({
  status: "completed",
  code: "",
  performedDateTime: "",
  bodySite: "",
  encounterIndex: "",
});

const emptyAllergy = (): AllergyRow => ({
  clinicalStatus: "active",
  verificationStatus: "confirmed",
  type: "allergy",
  category: "medication",
  code: "",
  reaction: "",
  onsetDateTime: "",
  encounterIndex: "",
});

const emptyEncounter = (): EncounterRow => ({
  status: "",
  classCode: "",
  typeText: "",
  periodStart: "",
  periodEnd: "",
  practitionerIndex: "",
});

const emptyCoverage = (): CoverageRow => ({
  status: "",
  insurerName: "",
  planName: "",
  subscriberId: "",
  memberId: "",
  relationshipText: "",
  periodStart: "",
  periodEnd: "",
});

const emptyPractitioner = (): PractitionerRow => ({
  family: "",
  given: "",
  phone: "",
  email: "",
  identifierSystem: "",
  identifierValue: "",
  specialty: "",
  encounterIndex: "",
});

const emptyDiagnosticReport = (): DiagnosticReportRow => ({
  status: "final",
  code: "",
  conclusion: "",
  effectiveDateTime: "",
  issued: "",
  encounterIndex: "",
});

const emptyMedicationRequest = (): MedicationRequestRow => ({
  status: "active",
  intent: "order",
  medicationCode: "",
  dosageText: "",
  authoredOn: "",
  requesterText: "",
  encounterIndex: "",
});

const emptyMedicationAdministration = (): MedicationAdministrationRow => ({
  status: "completed",
  medicationCode: "",
  effectiveDateTime: "",
  doseText: "",
  routeText: "",
  encounterIndex: "",
});

const emptyMedicationDispense = (): MedicationDispenseRow => ({
  status: "completed",
  medicationCode: "",
  whenHandedOver: "",
  quantityText: "",
  daysSupply: "",
  encounterIndex: "",
});

const emptyMedicationStatement = (): MedicationStatementRow => ({
  status: "active",
  medicationCode: "",
  effectiveDateTime: "",
  dosageText: "",
  encounterIndex: "",
});

const emptyMedicationProduct = (): MedicationProductRow => ({
  code: "",
  status: "active",
  form: "",
  strength: "",
  encounterIndex: "",
});

const emptyImmunization = (): ImmunizationRow => ({
  status: "completed",
  vaccineCode: "",
  occurrenceDateTime: "",
  lotNumber: "",
  manufacturerText: "",
  encounterIndex: "",
});

const MED_SUB_TABS = [
  { id: "request" as const, label: "MedicationRequest" },
  { id: "administration" as const, label: "MedicationAdministration" },
  { id: "dispense" as const, label: "MedicationDispense" },
  { id: "statement" as const, label: "MedicationStatement" },
  { id: "medication" as const, label: "Medication" },
  { id: "immunization" as const, label: "Immunization" },
] as const;

type MedSubTabId = (typeof MED_SUB_TABS)[number]["id"];

/** Main FHIR resource tabs (chunk 3: UI + state only; chunk 4 wires section visibility). */
const MAIN_TABS = [
  { id: "patient" as const, label: "Patient" },
  { id: "practitioner" as const, label: "Practitioner" },
  { id: "observation" as const, label: "Observation" },
  { id: "diagnosticReport" as const, label: "Diagnostic report" },
  { id: "condition" as const, label: "Condition" },
  { id: "procedure" as const, label: "Procedure" },
  { id: "allergy" as const, label: "Allergy intolerance" },
  { id: "encounter" as const, label: "Encounter" },
  { id: "insurance" as const, label: "Insurance" },
  { id: "medication" as const, label: "Medication & vaccine" },
];

type MainTabId = (typeof MAIN_TABS)[number]["id"];

/** Indices match the order of practitioners sent to ingest (rows without given names are skipped). */
function practitionerPayloadOptions(rows: PractitionerRow[]): { index: number; label: string }[] {
  const options: { index: number; label: string }[] = [];
  let idx = 0;
  for (const row of rows) {
    const g = row.given
      .split(/[,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (g.length === 0) continue;
    const label =
      [row.family.trim(), g.join(" ")].filter(Boolean).join(", ") || `Practitioner ${idx + 1}`;
    options.push({ index: idx, label });
    idx++;
  }
  return options;
}

const DRAFT_STORAGE_KEY = "ihealth-patient-entry-draft-v1";

function encountersInPayloadOrder(rows: EncounterRow[]): EncounterRow[] {
  return rows.filter(
    (en) =>
      en.status.trim() ||
      en.classCode.trim() ||
      en.typeText.trim() ||
      en.periodStart ||
      en.periodEnd ||
      en.practitionerIndex !== "",
  );
}

/** Option index matches ingest `encounters[]` order (only rows that will be saved). */
function encounterPayloadOptions(rows: EncounterRow[]): { index: number; label: string }[] {
  return encountersInPayloadOrder(rows).map((row, index) => ({
    index,
    label:
      [row.typeText.trim(), row.status.trim(), row.classCode.trim()].filter(Boolean).join(" · ") ||
      `Encounter ${index + 1}`,
  }));
}

function payloadEncounterIndex(encounterIndex: string): number | undefined {
  if (encounterIndex === "") return undefined;
  const n = Number.parseInt(encounterIndex, 10);
  if (Number.isNaN(n) || n < 0) return undefined;
  return n;
}

function EncounterSelect({
  encounterRows,
  value,
  onChange,
}: {
  encounterRows: EncounterRow[];
  value: string;
  onChange: (v: string) => void;
}) {
  const opts = encounterPayloadOptions(encounterRows);
  if (opts.length === 0) {
    return (
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label>Encounter (optional)</label>
        <p className="lead" style={{ margin: 0, fontSize: "0.9rem" }}>
          Add encounters on the Encounter tab to link this row to a saved visit.
        </p>
      </div>
    );
  }
  return (
    <div className="field" style={{ gridColumn: "1 / -1" }}>
      <label>Encounter (optional)</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">— None —</option>
        {opts.map((opt) => (
          <option key={opt.index} value={String(opt.index)}>
            {opt.label} (payload index {opt.index})
          </option>
        ))}
      </select>
    </div>
  );
}

export default function PatientEntry() {
  const [family, setFamily] = useState("");
  const [given, setGiven] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [patientActive, setPatientActive] = useState(true);
  const [country, setCountry] = useState("US");
  const [identifierSystem, setIdentifierSystem] = useState("");
  const [identifierValue, setIdentifierValue] = useState("");

  const [practitionerRows, setPractitionerRows] = useState<PractitionerRow[]>([]);

  const [labs, setLabs] = useState<LabRow[]>([emptyLab()]);
  const [diagnosticReports, setDiagnosticReports] = useState<DiagnosticReportRow[]>([]);
  const [observations, setObservations] = useState<ObsRow[]>([]);
  const [conditions, setConditions] = useState<CondRow[]>([]);
  const [procedures, setProcedures] = useState<ProcedureRow[]>([]);
  const [allergies, setAllergies] = useState<AllergyRow[]>([]);
  const [encounters, setEncounters] = useState<EncounterRow[]>([]);
  const [coverageRows, setCoverageRows] = useState<CoverageRow[]>([]);

  const [activeMedSubTab, setActiveMedSubTab] = useState<MedSubTabId>("request");
  const [medicationRequests, setMedicationRequests] = useState<MedicationRequestRow[]>([]);
  const [medicationAdministrations, setMedicationAdministrations] = useState<MedicationAdministrationRow[]>([]);
  const [medicationDispenses, setMedicationDispenses] = useState<MedicationDispenseRow[]>([]);
  const [medicationStatements, setMedicationStatements] = useState<MedicationStatementRow[]>([]);
  const [medicationProducts, setMedicationProducts] = useState<MedicationProductRow[]>([]);
  const [immunizations, setImmunizations] = useState<ImmunizationRow[]>([]);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeMainTab, setActiveMainTab] = useState<MainTabId>("patient");
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Record<string, unknown>;
      if (d.v !== 1) return;
      const mt = d.activeMainTab;
      if (typeof mt === "string" && MAIN_TABS.some((t) => t.id === mt)) {
        setActiveMainTab(mt as MainTabId);
      }
      const mst = d.activeMedSubTab;
      if (typeof mst === "string" && MED_SUB_TABS.some((t) => t.id === mst)) {
        setActiveMedSubTab(mst as MedSubTabId);
      }
      const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : undefined);
      const b = (k: string) => (typeof d[k] === "boolean" ? (d[k] as boolean) : undefined);
      if (s("family") !== undefined) setFamily(s("family")!);
      if (s("given") !== undefined) setGiven(s("given")!);
      if (s("gender") !== undefined) setGender(s("gender")!);
      if (s("birthDate") !== undefined) setBirthDate(s("birthDate")!);
      if (s("phone") !== undefined) setPhone(s("phone")!);
      if (s("email") !== undefined) setEmail(s("email")!);
      if (s("addressLine") !== undefined) setAddressLine(s("addressLine")!);
      if (s("city") !== undefined) setCity(s("city")!);
      if (s("state") !== undefined) setState(s("state")!);
      if (s("postalCode") !== undefined) setPostalCode(s("postalCode")!);
      if (b("patientActive") !== undefined) setPatientActive(b("patientActive")!);
      if (s("country") !== undefined) setCountry(s("country")!);
      if (s("identifierSystem") !== undefined) setIdentifierSystem(s("identifierSystem")!);
      if (s("identifierValue") !== undefined) setIdentifierValue(s("identifierValue")!);
      if (Array.isArray(d.practitionerRows)) setPractitionerRows(d.practitionerRows as PractitionerRow[]);
      if (Array.isArray(d.labs)) setLabs(d.labs as LabRow[]);
      if (Array.isArray(d.diagnosticReports)) setDiagnosticReports(d.diagnosticReports as DiagnosticReportRow[]);
      if (Array.isArray(d.observations)) setObservations(d.observations as ObsRow[]);
      if (Array.isArray(d.conditions)) setConditions(d.conditions as CondRow[]);
      if (Array.isArray(d.procedures)) setProcedures(d.procedures as ProcedureRow[]);
      if (Array.isArray(d.allergies)) setAllergies(d.allergies as AllergyRow[]);
      if (Array.isArray(d.encounters)) setEncounters(d.encounters as EncounterRow[]);
      if (Array.isArray(d.coverageRows)) setCoverageRows(d.coverageRows as CoverageRow[]);
      if (Array.isArray(d.medicationRequests)) setMedicationRequests(d.medicationRequests as MedicationRequestRow[]);
      if (Array.isArray(d.medicationAdministrations))
        setMedicationAdministrations(d.medicationAdministrations as MedicationAdministrationRow[]);
      if (Array.isArray(d.medicationDispenses)) setMedicationDispenses(d.medicationDispenses as MedicationDispenseRow[]);
      if (Array.isArray(d.medicationStatements)) setMedicationStatements(d.medicationStatements as MedicationStatementRow[]);
      if (Array.isArray(d.medicationProducts)) setMedicationProducts(d.medicationProducts as MedicationProductRow[]);
      if (Array.isArray(d.immunizations)) setImmunizations(d.immunizations as ImmunizationRow[]);
      setDraftMessage("Restored local draft from this browser.");
      window.setTimeout(() => setDraftMessage(null), 5000);
    } catch {
      /* ignore corrupt draft */
    }
  }, []);

  function saveDraft() {
    try {
      const payload = {
        v: 1 as const,
        activeMainTab,
        activeMedSubTab,
        family,
        given,
        gender,
        birthDate,
        phone,
        email,
        addressLine,
        city,
        state,
        postalCode,
        patientActive,
        country,
        identifierSystem,
        identifierValue,
        practitionerRows,
        labs,
        diagnosticReports,
        observations,
        conditions,
        procedures,
        allergies,
        encounters,
        coverageRows,
        medicationRequests,
        medicationAdministrations,
        medicationDispenses,
        medicationStatements,
        medicationProducts,
        immunizations,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setError(null);
      setDraftMessage("Draft saved in this browser. Use Save patient & clinical data on the last tab to send to the server.");
      window.setTimeout(() => setDraftMessage(null), 6000);
    } catch {
      setError("Could not save draft (storage may be full or disabled).");
    }
  }

  function goNextTab() {
    const idx = MAIN_TABS.findIndex((t) => t.id === activeMainTab);
    if (idx >= 0 && idx < MAIN_TABS.length - 1) {
      setActiveMainTab(MAIN_TABS[idx + 1]!.id);
    }
  }

  async function ingestSubmit() {
    setBusy(true);
    setError(null);
    setResult(null);
    const givenNames = given
      .split(/[,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (givenNames.length === 0) {
      setError("Enter at least one given name.");
      setBusy(false);
      return;
    }

    const practitionersPayload = practitionerRows
      .map((row) => {
        const g = row.given
          .split(/[,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (g.length === 0) return null;
        return {
          family: row.family.trim() || undefined,
          given: g,
          phone: row.phone.trim() || undefined,
          email: row.email.trim() || undefined,
          identifierSystem: row.identifierSystem.trim() || undefined,
          identifierValue: row.identifierValue.trim() || undefined,
          specialty: row.specialty.trim() || undefined,
          encounterIndex: payloadEncounterIndex(row.encounterIndex),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);

    const body = {
      patient: {
        family: family || undefined,
        given: givenNames,
        gender: gender || undefined,
        birthDate: birthDate || undefined,
        active: patientActive,
        phone: phone || undefined,
        email: email || undefined,
        addressLine: addressLine || undefined,
        city: city || undefined,
        state: state || undefined,
        postalCode: postalCode || undefined,
        country: country.trim() || undefined,
        identifierSystem: identifierSystem.trim() || undefined,
        identifierValue: identifierValue.trim() || undefined,
      },
      practitioners: practitionersPayload,
      labs: labs
        .filter((l) => l.code.trim())
        .map((l) => ({
          code: l.code.trim(),
          valueQuantity: l.valueQuantity ? Number(l.valueQuantity) : undefined,
          valueQuantityUnit: l.valueQuantityUnit || undefined,
          effectiveDateTime: l.effectiveDateTime
            ? new Date(l.effectiveDateTime).toISOString()
            : undefined,
          encounterIndex: payloadEncounterIndex(l.encounterIndex),
        })),
      diagnosticReports: diagnosticReports
        .filter((dr) => dr.code.trim())
        .map((dr) => ({
          status: dr.status.trim() || undefined,
          code: dr.code.trim(),
          conclusion: dr.conclusion.trim() || undefined,
          effectiveDateTime: dr.effectiveDateTime
            ? new Date(dr.effectiveDateTime).toISOString()
            : undefined,
          issued: dr.issued ? new Date(dr.issued).toISOString() : undefined,
          encounterIndex: payloadEncounterIndex(dr.encounterIndex),
        })),
      observations: observations
        .filter((o) => o.code.trim())
        .map((o) => ({
          category: o.category || "survey",
          code: o.code.trim(),
          valueString: o.valueString || undefined,
          effectiveDateTime: o.effectiveDateTime
            ? new Date(o.effectiveDateTime).toISOString()
            : undefined,
          encounterIndex: payloadEncounterIndex(o.encounterIndex),
        })),
      conditions: conditions
        .filter((c) => c.code.trim())
        .map((c) => ({
          code: c.code.trim(),
          clinicalStatus: c.clinicalStatus || undefined,
          verificationStatus: c.verificationStatus || undefined,
          onsetDateTime: c.onsetDateTime ? new Date(c.onsetDateTime).toISOString() : undefined,
          recordedDate: c.recordedDate ? new Date(c.recordedDate).toISOString() : undefined,
          encounterIndex: payloadEncounterIndex(c.encounterIndex),
        })),
      procedures: procedures
        .filter((p) => p.code.trim())
        .map((p) => ({
          status: p.status.trim() || undefined,
          code: p.code.trim(),
          performedDateTime: p.performedDateTime
            ? new Date(p.performedDateTime).toISOString()
            : undefined,
          bodySite: p.bodySite.trim() || undefined,
          encounterIndex: payloadEncounterIndex(p.encounterIndex),
        })),
      allergyIntolerances: allergies
        .filter((a) => a.code.trim())
        .map((a) => ({
          clinicalStatus: a.clinicalStatus.trim() || undefined,
          verificationStatus: a.verificationStatus.trim() || undefined,
          type: a.type.trim() || undefined,
          category: a.category.trim() || undefined,
          code: a.code.trim(),
          reaction: a.reaction.trim() || undefined,
          onsetDateTime: a.onsetDateTime ? new Date(a.onsetDateTime).toISOString() : undefined,
          encounterIndex: payloadEncounterIndex(a.encounterIndex),
        })),
      encounters: encounters
        .filter(
          (en) =>
            en.status.trim() ||
            en.classCode.trim() ||
            en.typeText.trim() ||
            en.periodStart ||
            en.periodEnd ||
            en.practitionerIndex !== "",
        )
        .map((en) => {
          const pi =
            en.practitionerIndex === ""
              ? undefined
              : Number.parseInt(en.practitionerIndex, 10);
          return {
            status: en.status.trim() || undefined,
            classCode: en.classCode.trim() || undefined,
            typeText: en.typeText.trim() || undefined,
            periodStart: en.periodStart ? new Date(en.periodStart).toISOString() : undefined,
            periodEnd: en.periodEnd ? new Date(en.periodEnd).toISOString() : undefined,
            practitionerIndex:
              pi != null && !Number.isNaN(pi) && pi >= 0 ? pi : undefined,
          };
        }),
      coverages: coverageRows
        .filter(
          (c) =>
            c.status.trim() ||
            c.insurerName.trim() ||
            c.planName.trim() ||
            c.subscriberId.trim() ||
            c.memberId.trim() ||
            c.relationshipText.trim() ||
            c.periodStart ||
            c.periodEnd,
        )
        .map((c) => ({
          status: c.status.trim() || undefined,
          insurerName: c.insurerName.trim() || undefined,
          planName: c.planName.trim() || undefined,
          subscriberId: c.subscriberId.trim() || undefined,
          memberId: c.memberId.trim() || undefined,
          relationshipText: c.relationshipText.trim() || undefined,
          periodStart: c.periodStart ? new Date(c.periodStart).toISOString() : undefined,
          periodEnd: c.periodEnd ? new Date(c.periodEnd).toISOString() : undefined,
        })),
      medicationRequests: medicationRequests
        .filter((m) => m.medicationCode.trim())
        .map((m) => ({
          status: m.status.trim() || undefined,
          intent: m.intent.trim() || undefined,
          medicationCode: m.medicationCode.trim(),
          dosageText: m.dosageText.trim() || undefined,
          authoredOn: m.authoredOn ? new Date(m.authoredOn).toISOString() : undefined,
          requesterText: m.requesterText.trim() || undefined,
          encounterIndex: payloadEncounterIndex(m.encounterIndex),
        })),
      medicationAdministrations: medicationAdministrations
        .filter((m) => m.medicationCode.trim())
        .map((m) => ({
          status: m.status.trim() || undefined,
          medicationCode: m.medicationCode.trim(),
          effectiveDateTime: m.effectiveDateTime
            ? new Date(m.effectiveDateTime).toISOString()
            : undefined,
          doseText: m.doseText.trim() || undefined,
          routeText: m.routeText.trim() || undefined,
          encounterIndex: payloadEncounterIndex(m.encounterIndex),
        })),
      medicationDispenses: medicationDispenses
        .filter((m) => m.medicationCode.trim())
        .map((m) => {
          const ds = m.daysSupply.trim();
          const days = ds === "" ? undefined : Number.parseInt(ds, 10);
          return {
            status: m.status.trim() || undefined,
            medicationCode: m.medicationCode.trim(),
            whenHandedOver: m.whenHandedOver ? new Date(m.whenHandedOver).toISOString() : undefined,
            quantityText: m.quantityText.trim() || undefined,
            daysSupply: days != null && !Number.isNaN(days) ? days : undefined,
            encounterIndex: payloadEncounterIndex(m.encounterIndex),
          };
        }),
      medicationStatements: medicationStatements
        .filter((m) => m.medicationCode.trim())
        .map((m) => ({
          status: m.status.trim() || undefined,
          medicationCode: m.medicationCode.trim(),
          effectiveDateTime: m.effectiveDateTime
            ? new Date(m.effectiveDateTime).toISOString()
            : undefined,
          dosageText: m.dosageText.trim() || undefined,
          encounterIndex: payloadEncounterIndex(m.encounterIndex),
        })),
      medications: medicationProducts
        .filter((m) => m.code.trim())
        .map((m) => ({
          code: m.code.trim(),
          status: m.status.trim() || undefined,
          form: m.form.trim() || undefined,
          strength: m.strength.trim() || undefined,
          encounterIndex: payloadEncounterIndex(m.encounterIndex),
        })),
      immunizations: immunizations
        .filter((im) => im.vaccineCode.trim())
        .map((im) => ({
          status: im.status.trim() || undefined,
          vaccineCode: im.vaccineCode.trim(),
          occurrenceDateTime: im.occurrenceDateTime
            ? new Date(im.occurrenceDateTime).toISOString()
            : undefined,
          lotNumber: im.lotNumber.trim() || undefined,
          manufacturerText: im.manufacturerText.trim() || undefined,
          encounterIndex: payloadEncounterIndex(im.encounterIndex),
        })),
    };

    try {
      const saved = await api<{ id: string }>("/api/patients/ingest", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(saved.id);
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="patient-entry-page">
      <div className="patient-entry-inner">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (activeMainTab !== "medication") return;
            void ingestSubmit();
          }}
        >
      <h1>Manual patient entry</h1>
      <p className="lead">
        Use the tabs in any order; nothing is required until you finish. <strong>Save as draft</strong> stores your work in
        this browser (works offline). <strong>Save and next</strong> moves to the next tab. On the last tab,{" "}
        <strong>Save patient &amp; clinical data</strong> sends everything to the server in one request.
      </p>

      {error && <div className="msg err">{error}</div>}
      {draftMessage && <div className="msg ok">{draftMessage}</div>}
      {result && (
        <div className="msg ok">
          Saved patient id <code>{result}</code> — you can paste this id on the Upload
          page.
        </div>
      )}

      <div
        className="pe-main-tabs"
        role="tablist"
        aria-label="FHIR resource sections"
      >
        {MAIN_TABS.map((tab) => {
          const selected = activeMainTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`pe-panel-${tab.id}`}
              id={`pe-tab-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={["pe-main-tab", `pe-main-tab--${tab.id}`, selected ? "pe-main-tab--active" : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActiveMainTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="pe-panel-patient"
        aria-labelledby="pe-tab-patient"
        hidden={activeMainTab !== "patient"}
      >
      <div className="card">
        <h2>Patient (FHIR Patient)</h2>
        <div className="field-grid">
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label className="pe-inline-check">
              <input
                type="checkbox"
                checked={patientActive}
                onChange={(e) => setPatientActive(e.target.checked)}
              />
              Active record (Patient.active)
            </label>
          </div>
          <div className="field">
            <label>Family name</label>
            <input value={family} onChange={(e) => setFamily(e.target.value)} />
          </div>
          <div className="field">
            <label>Given names (comma-separated)</label>
            <input
              value={given}
              onChange={(e) => setGiven(e.target.value)}
              placeholder="Jane, Q"
            />
          </div>
          <div className="field">
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">—</option>
              <option value="female">female</option>
              <option value="male">male</option>
              <option value="other">other</option>
              <option value="unknown">unknown</option>
            </select>
          </div>
          <div className="field">
            <label>Birth date</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Address</label>
            <input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
          </div>
          <div className="field">
            <label>City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label>State</label>
            <input value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="field">
            <label>Postal code</label>
            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </div>
          <div className="field">
            <label>Country</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="US"
              maxLength={8}
            />
          </div>
          <div className="field">
            <label>Identifier system (URI)</label>
            <input
              value={identifierSystem}
              onChange={(e) => setIdentifierSystem(e.target.value)}
              placeholder="http://hospital.example.org/mrn"
            />
          </div>
          <div className="field">
            <label>Identifier value</label>
            <input value={identifierValue} onChange={(e) => setIdentifierValue(e.target.value)} placeholder="MRN-123" />
          </div>
        </div>
      </div>
      </div>

      <div
        role="tabpanel"
        id="pe-panel-observation"
        aria-labelledby="pe-tab-observation"
        hidden={activeMainTab !== "observation"}
      >
      <div className="card">
        <h2>Observations (FHIR Observation)</h2>
        {observations.length === 0 && (
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Vitals, surveys, exam findings, etc.—each row is one Observation. Laboratory results belong under the{" "}
            <strong>Diagnostic report</strong> tab (stored as <code>laboratory</code> Observations).
          </p>
        )}
        {observations.map((row, i) => (
          <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
            <div className="field">
              <label>Category</label>
              <select
                value={row.category}
                onChange={(e) =>
                  setObservations(observations.map((r, j) => (j === i ? { ...r, category: e.target.value } : r)))
                }
              >
                <option value="vital-signs">vital-signs</option>
                <option value="exam">exam</option>
                <option value="survey">survey</option>
                <option value="procedure">procedure</option>
                <option value="other">other</option>
              </select>
            </div>
            <div className="field">
              <label>Code / name</label>
              <input
                value={row.code}
                onChange={(e) =>
                  setObservations(observations.map((r, j) => (j === i ? { ...r, code: e.target.value } : r)))
                }
              />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Value (text)</label>
              <input
                value={row.valueString}
                onChange={(e) =>
                  setObservations(observations.map((r, j) => (j === i ? { ...r, valueString: e.target.value } : r)))
                }
              />
            </div>
            <div className="field">
              <label>Effective datetime</label>
              <input
                type="datetime-local"
                value={row.effectiveDateTime}
                onChange={(e) =>
                  setObservations(
                    observations.map((r, j) => (j === i ? { ...r, effectiveDateTime: e.target.value } : r)),
                  )
                }
              />
            </div>
            <EncounterSelect
              encounterRows={encounters}
              value={row.encounterIndex}
              onChange={(v) =>
                setObservations(observations.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)))
              }
            />
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => setObservations([...observations, emptyObs()])}>
          Add observation
        </button>
      </div>
      </div>

      <div
        role="tabpanel"
        id="pe-panel-condition"
        aria-labelledby="pe-tab-condition"
        hidden={activeMainTab !== "condition"}
      >
      <div className="card">
        <h2>Condition (FHIR Condition)</h2>
        {conditions.length === 0 && (
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Add problem or diagnosis rows (each is a Condition), or leave empty. Rows without a code are not saved.
          </p>
        )}
        {conditions.map((row, i) => (
          <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Condition code / description (ICD-10, SNOMED, or text)</label>
              <input
                value={row.code}
                onChange={(e) =>
                  setConditions(conditions.map((r, j) => (j === i ? { ...r, code: e.target.value } : r)))
                }
              />
            </div>
            <div className="field">
              <label>Clinical status</label>
              <select
                value={row.clinicalStatus}
                onChange={(e) =>
                  setConditions(conditions.map((r, j) => (j === i ? { ...r, clinicalStatus: e.target.value } : r)))
                }
              >
                <option value="active">active</option>
                <option value="recurrence">recurrence</option>
                <option value="inactive">inactive</option>
                <option value="remission">remission</option>
                <option value="resolved">resolved</option>
              </select>
            </div>
            <div className="field">
              <label>Verification status</label>
              <select
                value={row.verificationStatus}
                onChange={(e) =>
                  setConditions(
                    conditions.map((r, j) => (j === i ? { ...r, verificationStatus: e.target.value } : r)),
                  )
                }
              >
                <option value="confirmed">confirmed</option>
                <option value="provisional">provisional</option>
                <option value="differential">differential</option>
                <option value="unconfirmed">unconfirmed</option>
              </select>
            </div>
            <div className="field">
              <label>Onset (datetime)</label>
              <input
                type="datetime-local"
                value={row.onsetDateTime}
                onChange={(e) =>
                  setConditions(conditions.map((r, j) => (j === i ? { ...r, onsetDateTime: e.target.value } : r)))
                }
              />
            </div>
            <div className="field">
              <label>Recorded (datetime)</label>
              <input
                type="datetime-local"
                value={row.recordedDate}
                onChange={(e) =>
                  setConditions(conditions.map((r, j) => (j === i ? { ...r, recordedDate: e.target.value } : r)))
                }
              />
            </div>
            <EncounterSelect
              encounterRows={encounters}
              value={row.encounterIndex}
              onChange={(v) => setConditions(conditions.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)))}
            />
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => setConditions([...conditions, emptyCond()])}>
          Add condition
        </button>
      </div>
      </div>

      <div
        role="tabpanel"
        id="pe-panel-practitioner"
        aria-labelledby="pe-tab-practitioner"
        hidden={activeMainTab !== "practitioner"}
      >
        <div className="card">
          <h2>Practitioner (FHIR Practitioner)</h2>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Add one row per practitioner linked to this patient. Given name is required for each row you want saved;
            empty rows are skipped.
          </p>
          {practitionerRows.length === 0 && (
            <p className="lead" style={{ marginBottom: "1rem" }}>
              No practitioners yet — use &quot;Add practitioner&quot; below.
            </p>
          )}
          {practitionerRows.map((row, i) => (
            <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
              <div className="field">
                <label>Family name</label>
                <input
                  value={row.family}
                  onChange={(e) =>
                    setPractitionerRows(practitionerRows.map((r, j) => (j === i ? { ...r, family: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Given names (comma-separated, required to save row)</label>
                <input
                  value={row.given}
                  onChange={(e) =>
                    setPractitionerRows(practitionerRows.map((r, j) => (j === i ? { ...r, given: e.target.value } : r)))
                  }
                  placeholder="Alex, J."
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input
                  value={row.phone}
                  onChange={(e) =>
                    setPractitionerRows(practitionerRows.map((r, j) => (j === i ? { ...r, phone: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={row.email}
                  onChange={(e) =>
                    setPractitionerRows(practitionerRows.map((r, j) => (j === i ? { ...r, email: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field">
                <label>Identifier system</label>
                <input
                  value={row.identifierSystem}
                  onChange={(e) =>
                    setPractitionerRows(
                      practitionerRows.map((r, j) => (j === i ? { ...r, identifierSystem: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Identifier value</label>
                <input
                  value={row.identifierValue}
                  onChange={(e) =>
                    setPractitionerRows(
                      practitionerRows.map((r, j) => (j === i ? { ...r, identifierValue: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Specialty / qualification (text)</label>
                <input
                  value={row.specialty}
                  onChange={(e) =>
                    setPractitionerRows(practitionerRows.map((r, j) => (j === i ? { ...r, specialty: e.target.value } : r)))
                  }
                />
              </div>
              <EncounterSelect
                encounterRows={encounters}
                value={row.encounterIndex}
                onChange={(v) =>
                  setPractitionerRows(practitionerRows.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)))
                }
              />
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setPractitionerRows([...practitionerRows, emptyPractitioner()])}
          >
            Add practitioner
          </button>
        </div>
      </div>

      <div
        role="tabpanel"
        id="pe-panel-diagnosticReport"
        aria-labelledby="pe-tab-diagnosticReport"
        hidden={activeMainTab !== "diagnosticReport"}
      >
        <div className="card">
          <h2>Report (FHIR DiagnosticReport)</h2>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Each row is a DiagnosticReport resource (title/code, conclusion, timing). Lab analyte rows below are saved as
            FHIR Observations with category <code>laboratory</code>.
          </p>
          {diagnosticReports.length === 0 && (
            <p className="lead" style={{ marginBottom: "1rem" }}>
              No reports yet — use &quot;Add diagnostic report&quot; or enter lab rows only.
            </p>
          )}
          {diagnosticReports.map((row, i) => (
            <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
              <div className="field">
                <label>Status</label>
                <select
                  value={row.status}
                  onChange={(e) =>
                    setDiagnosticReports(
                      diagnosticReports.map((r, j) => (j === i ? { ...r, status: e.target.value } : r)),
                    )
                  }
                >
                  <option value="final">final</option>
                  <option value="preliminary">preliminary</option>
                  <option value="amended">amended</option>
                  <option value="corrected">corrected</option>
                  <option value="cancelled">cancelled</option>
                  <option value="entered-in-error">entered-in-error</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Report code / title</label>
                <input
                  value={row.code}
                  onChange={(e) =>
                    setDiagnosticReports(diagnosticReports.map((r, j) => (j === i ? { ...r, code: e.target.value } : r)))
                  }
                  placeholder="CBC panel, metabolic panel…"
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Conclusion</label>
                <textarea
                  value={row.conclusion}
                  onChange={(e) =>
                    setDiagnosticReports(
                      diagnosticReports.map((r, j) => (j === i ? { ...r, conclusion: e.target.value } : r)),
                    )
                  }
                  rows={2}
                />
              </div>
              <div className="field">
                <label>Effective datetime</label>
                <input
                  type="datetime-local"
                  value={row.effectiveDateTime}
                  onChange={(e) =>
                    setDiagnosticReports(
                      diagnosticReports.map((r, j) => (j === i ? { ...r, effectiveDateTime: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Issued</label>
                <input
                  type="datetime-local"
                  value={row.issued}
                  onChange={(e) =>
                    setDiagnosticReports(diagnosticReports.map((r, j) => (j === i ? { ...r, issued: e.target.value } : r)))
                  }
                />
              </div>
              <EncounterSelect
                encounterRows={encounters}
                value={row.encounterIndex}
                onChange={(v) =>
                  setDiagnosticReports(diagnosticReports.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)))
                }
              />
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setDiagnosticReports([...diagnosticReports, emptyDiagnosticReport()])}
          >
            Add diagnostic report
          </button>
        </div>

        <div className="card">
          <h2>Lab results (FHIR Observation · laboratory)</h2>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Each row becomes an Observation with category <code>laboratory</code>, typically referenced from a
            DiagnosticReport in real FHIR; here they are captured alongside the report tab for convenience.
          </p>
          {labs.map((row, i) => (
            <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
              <div className="field">
                <label>Test code / name</label>
                <input
                  value={row.code}
                  onChange={(e) =>
                    setLabs(labs.map((r, j) => (j === i ? { ...r, code: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field">
                <label>Value (numeric)</label>
                <input
                  value={row.valueQuantity}
                  onChange={(e) =>
                    setLabs(labs.map((r, j) => (j === i ? { ...r, valueQuantity: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field">
                <label>Unit</label>
                <input
                  value={row.valueQuantityUnit}
                  onChange={(e) =>
                    setLabs(labs.map((r, j) => (j === i ? { ...r, valueQuantityUnit: e.target.value } : r)))
                  }
                  placeholder="mg/dL"
                />
              </div>
              <div className="field">
                <label>Effective datetime</label>
                <input
                  type="datetime-local"
                  value={row.effectiveDateTime}
                  onChange={(e) =>
                    setLabs(labs.map((r, j) => (j === i ? { ...r, effectiveDateTime: e.target.value } : r)))
                  }
                />
              </div>
              <EncounterSelect
                encounterRows={encounters}
                value={row.encounterIndex}
                onChange={(v) => setLabs(labs.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)))}
              />
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setLabs([...labs, emptyLab()])}>
            Add lab row
          </button>
        </div>
      </div>

      <div
        role="tabpanel"
        id="pe-panel-procedure"
        aria-labelledby="pe-tab-procedure"
        hidden={activeMainTab !== "procedure"}
      >
        <div className="card">
          <h2>Procedure (FHIR Procedure)</h2>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            One row per procedure. Code / description is required to save the row; performed time and body site are
            optional.
          </p>
          {procedures.length === 0 && (
            <p className="lead" style={{ marginBottom: "1rem" }}>
              No procedures yet — use &quot;Add procedure&quot; below.
            </p>
          )}
          {procedures.map((row, i) => (
            <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
              <div className="field">
                <label>Status</label>
                <select
                  value={row.status}
                  onChange={(e) =>
                    setProcedures(procedures.map((r, j) => (j === i ? { ...r, status: e.target.value } : r)))
                  }
                >
                  <option value="preparation">preparation</option>
                  <option value="in-progress">in-progress</option>
                  <option value="not-done">not-done</option>
                  <option value="on-hold">on-hold</option>
                  <option value="stopped">stopped</option>
                  <option value="completed">completed</option>
                  <option value="entered-in-error">entered-in-error</option>
                  <option value="unknown">unknown</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Procedure code / description</label>
                <input
                  value={row.code}
                  onChange={(e) =>
                    setProcedures(procedures.map((r, j) => (j === i ? { ...r, code: e.target.value } : r)))
                  }
                  placeholder="CPT, SNOMED, or free text"
                />
              </div>
              <div className="field">
                <label>Performed (datetime)</label>
                <input
                  type="datetime-local"
                  value={row.performedDateTime}
                  onChange={(e) =>
                    setProcedures(
                      procedures.map((r, j) => (j === i ? { ...r, performedDateTime: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Body site (text)</label>
                <input
                  value={row.bodySite}
                  onChange={(e) =>
                    setProcedures(procedures.map((r, j) => (j === i ? { ...r, bodySite: e.target.value } : r)))
                  }
                />
              </div>
              <EncounterSelect
                encounterRows={encounters}
                value={row.encounterIndex}
                onChange={(v) => setProcedures(procedures.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)))}
              />
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setProcedures([...procedures, emptyProcedure()])}>
            Add procedure
          </button>
        </div>
      </div>

      <div
        role="tabpanel"
        id="pe-panel-allergy"
        aria-labelledby="pe-tab-allergy"
        hidden={activeMainTab !== "allergy"}
      >
        <div className="card">
          <h2>Allergy intolerance (FHIR AllergyIntolerance)</h2>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Substance / code is required to save a row. Use reaction for free-text manifestations or notes.
          </p>
          {allergies.length === 0 && (
            <p className="lead" style={{ marginBottom: "1rem" }}>
              No rows yet — use &quot;Add allergy or intolerance&quot; below.
            </p>
          )}
          {allergies.map((row, i) => (
            <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Substance / code (text)</label>
                <input
                  value={row.code}
                  onChange={(e) =>
                    setAllergies(allergies.map((r, j) => (j === i ? { ...r, code: e.target.value } : r)))
                  }
                  placeholder="Penicillin, latex, code or display…"
                />
              </div>
              <div className="field">
                <label>Type</label>
                <select
                  value={row.type}
                  onChange={(e) =>
                    setAllergies(allergies.map((r, j) => (j === i ? { ...r, type: e.target.value } : r)))
                  }
                >
                  <option value="allergy">allergy</option>
                  <option value="intolerance">intolerance</option>
                </select>
              </div>
              <div className="field">
                <label>Category</label>
                <select
                  value={row.category}
                  onChange={(e) =>
                    setAllergies(allergies.map((r, j) => (j === i ? { ...r, category: e.target.value } : r)))
                  }
                >
                  <option value="medication">medication</option>
                  <option value="food">food</option>
                  <option value="environment">environment</option>
                  <option value="biologic">biologic</option>
                </select>
              </div>
              <div className="field">
                <label>Clinical status</label>
                <select
                  value={row.clinicalStatus}
                  onChange={(e) =>
                    setAllergies(allergies.map((r, j) => (j === i ? { ...r, clinicalStatus: e.target.value } : r)))
                  }
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="resolved">resolved</option>
                </select>
              </div>
              <div className="field">
                <label>Verification status</label>
                <select
                  value={row.verificationStatus}
                  onChange={(e) =>
                    setAllergies(allergies.map((r, j) => (j === i ? { ...r, verificationStatus: e.target.value } : r)))
                  }
                >
                  <option value="unconfirmed">unconfirmed</option>
                  <option value="presumed">presumed</option>
                  <option value="confirmed">confirmed</option>
                  <option value="refuted">refuted</option>
                  <option value="entered-in-error">entered-in-error</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Reaction (text)</label>
                <input
                  value={row.reaction}
                  onChange={(e) =>
                    setAllergies(allergies.map((r, j) => (j === i ? { ...r, reaction: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field">
                <label>Onset (datetime)</label>
                <input
                  type="datetime-local"
                  value={row.onsetDateTime}
                  onChange={(e) =>
                    setAllergies(allergies.map((r, j) => (j === i ? { ...r, onsetDateTime: e.target.value } : r)))
                  }
                />
              </div>
              <EncounterSelect
                encounterRows={encounters}
                value={row.encounterIndex}
                onChange={(v) => setAllergies(allergies.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)))}
              />
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setAllergies([...allergies, emptyAllergy()])}>
            Add allergy or intolerance
          </button>
        </div>
      </div>

      <div
        role="tabpanel"
        id="pe-panel-encounter"
        aria-labelledby="pe-tab-encounter"
        hidden={activeMainTab !== "encounter"}
      >
        <div className="card">
          <h2>Encounter (FHIR Encounter)</h2>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Class uses ActCode values (e.g. AMB ambulatory, EMER emergency). Participant links to a practitioner row
            from this form (same order as saved practitioners — add them on the Practitioner tab first).
          </p>
          {encounters.length === 0 && (
            <p className="lead" style={{ marginBottom: "1rem" }}>
              No encounters yet — use &quot;Add encounter&quot; below.
            </p>
          )}
          {encounters.map((row, i) => (
            <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
              <div className="field">
                <label>Status</label>
                <select
                  value={row.status}
                  onChange={(e) =>
                    setEncounters(encounters.map((r, j) => (j === i ? { ...r, status: e.target.value } : r)))
                  }
                >
                  <option value="">—</option>
                  <option value="planned">planned</option>
                  <option value="arrived">arrived</option>
                  <option value="triaged">triaged</option>
                  <option value="in-progress">in-progress</option>
                  <option value="onleave">onleave</option>
                  <option value="finished">finished</option>
                  <option value="cancelled">cancelled</option>
                  <option value="entered-in-error">entered-in-error</option>
                  <option value="unknown">unknown</option>
                </select>
              </div>
              <div className="field">
                <label>Class (ActCode)</label>
                <select
                  value={row.classCode}
                  onChange={(e) =>
                    setEncounters(encounters.map((r, j) => (j === i ? { ...r, classCode: e.target.value } : r)))
                  }
                >
                  <option value="">—</option>
                  <option value="AMB">AMB — ambulatory</option>
                  <option value="EMER">EMER — emergency</option>
                  <option value="IMP">IMP — inpatient</option>
                  <option value="ACUTE">ACUTE — acute</option>
                  <option value="NONAC">NONAC — non-acute</option>
                  <option value="OBSENC">OBSENC — observation</option>
                  <option value="PRENC">PRENC — pre-admission</option>
                  <option value="SS">SS — short stay</option>
                  <option value="VR">VR — virtual</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Type (text)</label>
                <input
                  value={row.typeText}
                  onChange={(e) =>
                    setEncounters(encounters.map((r, j) => (j === i ? { ...r, typeText: e.target.value } : r)))
                  }
                  placeholder="Office visit, follow-up…"
                />
              </div>
              <div className="field">
                <label>Period start</label>
                <input
                  type="datetime-local"
                  value={row.periodStart}
                  onChange={(e) =>
                    setEncounters(encounters.map((r, j) => (j === i ? { ...r, periodStart: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field">
                <label>Period end</label>
                <input
                  type="datetime-local"
                  value={row.periodEnd}
                  onChange={(e) =>
                    setEncounters(encounters.map((r, j) => (j === i ? { ...r, periodEnd: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Participant (practitioner from this entry)</label>
                <select
                  value={row.practitionerIndex}
                  onChange={(e) =>
                    setEncounters(encounters.map((r, j) => (j === i ? { ...r, practitionerIndex: e.target.value } : r)))
                  }
                >
                  <option value="">— None —</option>
                  {practitionerPayloadOptions(practitionerRows).map((opt) => (
                    <option key={opt.index} value={String(opt.index)}>
                      {opt.label} (index {opt.index})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setEncounters([...encounters, emptyEncounter()])}>
            Add encounter
          </button>
        </div>
      </div>

      <div
        role="tabpanel"
        id="pe-panel-insurance"
        aria-labelledby="pe-tab-insurance"
        hidden={activeMainTab !== "insurance"}
      >
        <div className="card">
          <h2>Insurance (FHIR Coverage)</h2>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            One row per coverage record. Fill any fields you have; completely empty rows are not saved.
          </p>
          {coverageRows.length === 0 && (
            <p className="lead" style={{ marginBottom: "1rem" }}>
              No coverage rows yet — use &quot;Add coverage&quot; below.
            </p>
          )}
          {coverageRows.map((row, i) => (
            <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
              <div className="field">
                <label>Status</label>
                <select
                  value={row.status}
                  onChange={(e) =>
                    setCoverageRows(coverageRows.map((r, j) => (j === i ? { ...r, status: e.target.value } : r)))
                  }
                >
                  <option value="">—</option>
                  <option value="active">active</option>
                  <option value="cancelled">cancelled</option>
                  <option value="draft">draft</option>
                  <option value="entered-in-error">entered-in-error</option>
                </select>
              </div>
              <div className="field">
                <label>Insurer / payor name</label>
                <input
                  value={row.insurerName}
                  onChange={(e) =>
                    setCoverageRows(coverageRows.map((r, j) => (j === i ? { ...r, insurerName: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Plan name</label>
                <input
                  value={row.planName}
                  onChange={(e) =>
                    setCoverageRows(coverageRows.map((r, j) => (j === i ? { ...r, planName: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field">
                <label>Subscriber ID</label>
                <input
                  value={row.subscriberId}
                  onChange={(e) =>
                    setCoverageRows(coverageRows.map((r, j) => (j === i ? { ...r, subscriberId: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field">
                <label>Member ID</label>
                <input
                  value={row.memberId}
                  onChange={(e) =>
                    setCoverageRows(coverageRows.map((r, j) => (j === i ? { ...r, memberId: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Relationship to subscriber (text)</label>
                <input
                  value={row.relationshipText}
                  onChange={(e) =>
                    setCoverageRows(
                      coverageRows.map((r, j) => (j === i ? { ...r, relationshipText: e.target.value } : r)),
                    )
                  }
                  placeholder="self, spouse, child…"
                />
              </div>
              <div className="field">
                <label>Coverage period start</label>
                <input
                  type="datetime-local"
                  value={row.periodStart}
                  onChange={(e) =>
                    setCoverageRows(coverageRows.map((r, j) => (j === i ? { ...r, periodStart: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field">
                <label>Coverage period end</label>
                <input
                  type="datetime-local"
                  value={row.periodEnd}
                  onChange={(e) =>
                    setCoverageRows(coverageRows.map((r, j) => (j === i ? { ...r, periodEnd: e.target.value } : r)))
                  }
                />
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setCoverageRows([...coverageRows, emptyCoverage()])}>
            Add coverage
          </button>
        </div>
      </div>

      <div
        role="tabpanel"
        id="pe-panel-medication"
        aria-labelledby="pe-tab-medication"
        hidden={activeMainTab !== "medication"}
      >
        <div className="card">
          <h2>Medication &amp; vaccine</h2>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Use the sub-tabs for each FHIR resource. Medication code (or vaccine code) is required to save a row in that
            section.
          </p>

          <div className="pe-med-tabs" role="tablist" aria-label="Medication and immunization resource types">
            {MED_SUB_TABS.map((tab) => {
              const sel = activeMedSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={sel}
                  className={["pe-med-tab", `pe-med-tab--${tab.id}`, sel ? "pe-med-tab--active" : ""]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setActiveMedSubTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div hidden={activeMedSubTab !== "request"}>
            <h3 className="pe-med-section-title">MedicationRequest</h3>
            {medicationRequests.length === 0 && (
              <p className="lead" style={{ marginBottom: "1rem" }}>
                No rows — use Add below.
              </p>
            )}
            {medicationRequests.map((row, i) => (
              <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
                <div className="field">
                  <label>Status</label>
                  <select
                    value={row.status}
                    onChange={(e) =>
                      setMedicationRequests(
                        medicationRequests.map((r, j) => (j === i ? { ...r, status: e.target.value } : r)),
                      )
                    }
                  >
                    <option value="active">active</option>
                    <option value="on-hold">on-hold</option>
                    <option value="cancelled">cancelled</option>
                    <option value="completed">completed</option>
                    <option value="entered-in-error">entered-in-error</option>
                    <option value="stopped">stopped</option>
                    <option value="draft">draft</option>
                    <option value="unknown">unknown</option>
                  </select>
                </div>
                <div className="field">
                  <label>Intent</label>
                  <select
                    value={row.intent}
                    onChange={(e) =>
                      setMedicationRequests(
                        medicationRequests.map((r, j) => (j === i ? { ...r, intent: e.target.value } : r)),
                      )
                    }
                  >
                    <option value="proposal">proposal</option>
                    <option value="plan">plan</option>
                    <option value="order">order</option>
                    <option value="original-order">original-order</option>
                    <option value="reflex-order">reflex-order</option>
                    <option value="filler-order">filler-order</option>
                    <option value="instance-order">instance-order</option>
                    <option value="option">option</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Medication (code / name)</label>
                  <input
                    value={row.medicationCode}
                    onChange={(e) =>
                      setMedicationRequests(
                        medicationRequests.map((r, j) => (j === i ? { ...r, medicationCode: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Dosage instruction (text)</label>
                  <input
                    value={row.dosageText}
                    onChange={(e) =>
                      setMedicationRequests(
                        medicationRequests.map((r, j) => (j === i ? { ...r, dosageText: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>Authored on</label>
                  <input
                    type="datetime-local"
                    value={row.authoredOn}
                    onChange={(e) =>
                      setMedicationRequests(
                        medicationRequests.map((r, j) => (j === i ? { ...r, authoredOn: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Requester (text)</label>
                  <input
                    value={row.requesterText}
                    onChange={(e) =>
                      setMedicationRequests(
                        medicationRequests.map((r, j) => (j === i ? { ...r, requesterText: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <EncounterSelect
                  encounterRows={encounters}
                  value={row.encounterIndex}
                  onChange={(v) =>
                    setMedicationRequests(
                      medicationRequests.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)),
                    )
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setMedicationRequests([...medicationRequests, emptyMedicationRequest()])}
            >
              Add MedicationRequest
            </button>
          </div>

          <div hidden={activeMedSubTab !== "administration"}>
            <h3 className="pe-med-section-title">MedicationAdministration</h3>
            {medicationAdministrations.length === 0 && (
              <p className="lead" style={{ marginBottom: "1rem" }}>
                No rows — use Add below.
              </p>
            )}
            {medicationAdministrations.map((row, i) => (
              <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
                <div className="field">
                  <label>Status</label>
                  <select
                    value={row.status}
                    onChange={(e) =>
                      setMedicationAdministrations(
                        medicationAdministrations.map((r, j) => (j === i ? { ...r, status: e.target.value } : r)),
                      )
                    }
                  >
                    <option value="in-progress">in-progress</option>
                    <option value="not-done">not-done</option>
                    <option value="on-hold">on-hold</option>
                    <option value="completed">completed</option>
                    <option value="entered-in-error">entered-in-error</option>
                    <option value="stopped">stopped</option>
                    <option value="unknown">unknown</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Medication (code / name)</label>
                  <input
                    value={row.medicationCode}
                    onChange={(e) =>
                      setMedicationAdministrations(
                        medicationAdministrations.map((r, j) => (j === i ? { ...r, medicationCode: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>Effective (datetime)</label>
                  <input
                    type="datetime-local"
                    value={row.effectiveDateTime}
                    onChange={(e) =>
                      setMedicationAdministrations(
                        medicationAdministrations.map((r, j) => (j === i ? { ...r, effectiveDateTime: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>Dose (text)</label>
                  <input
                    value={row.doseText}
                    onChange={(e) =>
                      setMedicationAdministrations(
                        medicationAdministrations.map((r, j) => (j === i ? { ...r, doseText: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Route (text)</label>
                  <input
                    value={row.routeText}
                    onChange={(e) =>
                      setMedicationAdministrations(
                        medicationAdministrations.map((r, j) => (j === i ? { ...r, routeText: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <EncounterSelect
                  encounterRows={encounters}
                  value={row.encounterIndex}
                  onChange={(v) =>
                    setMedicationAdministrations(
                      medicationAdministrations.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)),
                    )
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                setMedicationAdministrations([...medicationAdministrations, emptyMedicationAdministration()])
              }
            >
              Add MedicationAdministration
            </button>
          </div>

          <div hidden={activeMedSubTab !== "dispense"}>
            <h3 className="pe-med-section-title">MedicationDispense</h3>
            {medicationDispenses.length === 0 && (
              <p className="lead" style={{ marginBottom: "1rem" }}>
                No rows — use Add below.
              </p>
            )}
            {medicationDispenses.map((row, i) => (
              <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
                <div className="field">
                  <label>Status</label>
                  <select
                    value={row.status}
                    onChange={(e) =>
                      setMedicationDispenses(
                        medicationDispenses.map((r, j) => (j === i ? { ...r, status: e.target.value } : r)),
                      )
                    }
                  >
                    <option value="preparation">preparation</option>
                    <option value="in-progress">in-progress</option>
                    <option value="cancelled">cancelled</option>
                    <option value="on-hold">on-hold</option>
                    <option value="completed">completed</option>
                    <option value="entered-in-error">entered-in-error</option>
                    <option value="stopped">stopped</option>
                    <option value="declined">declined</option>
                    <option value="unknown">unknown</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Medication (code / name)</label>
                  <input
                    value={row.medicationCode}
                    onChange={(e) =>
                      setMedicationDispenses(
                        medicationDispenses.map((r, j) => (j === i ? { ...r, medicationCode: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>When handed over</label>
                  <input
                    type="datetime-local"
                    value={row.whenHandedOver}
                    onChange={(e) =>
                      setMedicationDispenses(
                        medicationDispenses.map((r, j) => (j === i ? { ...r, whenHandedOver: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>Quantity (text)</label>
                  <input
                    value={row.quantityText}
                    onChange={(e) =>
                      setMedicationDispenses(
                        medicationDispenses.map((r, j) => (j === i ? { ...r, quantityText: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>Days supply (integer)</label>
                  <input
                    value={row.daysSupply}
                    onChange={(e) =>
                      setMedicationDispenses(
                        medicationDispenses.map((r, j) => (j === i ? { ...r, daysSupply: e.target.value } : r)),
                      )
                    }
                    inputMode="numeric"
                  />
                </div>
                <EncounterSelect
                  encounterRows={encounters}
                  value={row.encounterIndex}
                  onChange={(v) =>
                    setMedicationDispenses(medicationDispenses.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)))
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setMedicationDispenses([...medicationDispenses, emptyMedicationDispense()])}
            >
              Add MedicationDispense
            </button>
          </div>

          <div hidden={activeMedSubTab !== "statement"}>
            <h3 className="pe-med-section-title">MedicationStatement</h3>
            {medicationStatements.length === 0 && (
              <p className="lead" style={{ marginBottom: "1rem" }}>
                No rows — use Add below.
              </p>
            )}
            {medicationStatements.map((row, i) => (
              <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
                <div className="field">
                  <label>Status</label>
                  <select
                    value={row.status}
                    onChange={(e) =>
                      setMedicationStatements(
                        medicationStatements.map((r, j) => (j === i ? { ...r, status: e.target.value } : r)),
                      )
                    }
                  >
                    <option value="active">active</option>
                    <option value="completed">completed</option>
                    <option value="entered-in-error">entered-in-error</option>
                    <option value="intended">intended</option>
                    <option value="stopped">stopped</option>
                    <option value="on-hold">on-hold</option>
                    <option value="unknown">unknown</option>
                    <option value="not-taken">not-taken</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Medication (code / name)</label>
                  <input
                    value={row.medicationCode}
                    onChange={(e) =>
                      setMedicationStatements(
                        medicationStatements.map((r, j) => (j === i ? { ...r, medicationCode: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>Effective (datetime)</label>
                  <input
                    type="datetime-local"
                    value={row.effectiveDateTime}
                    onChange={(e) =>
                      setMedicationStatements(
                        medicationStatements.map((r, j) => (j === i ? { ...r, effectiveDateTime: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Dosage (text)</label>
                  <input
                    value={row.dosageText}
                    onChange={(e) =>
                      setMedicationStatements(
                        medicationStatements.map((r, j) => (j === i ? { ...r, dosageText: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <EncounterSelect
                  encounterRows={encounters}
                  value={row.encounterIndex}
                  onChange={(v) =>
                    setMedicationStatements(
                      medicationStatements.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)),
                    )
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setMedicationStatements([...medicationStatements, emptyMedicationStatement()])}
            >
              Add MedicationStatement
            </button>
          </div>

          <div hidden={activeMedSubTab !== "medication"}>
            <h3 className="pe-med-section-title">Medication (product)</h3>
            {medicationProducts.length === 0 && (
              <p className="lead" style={{ marginBottom: "1rem" }}>
                No rows — use Add below.
              </p>
            )}
            {medicationProducts.map((row, i) => (
              <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Medication code / name</label>
                  <input
                    value={row.code}
                    onChange={(e) =>
                      setMedicationProducts(medicationProducts.map((r, j) => (j === i ? { ...r, code: e.target.value } : r)))
                    }
                  />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select
                    value={row.status}
                    onChange={(e) =>
                      setMedicationProducts(medicationProducts.map((r, j) => (j === i ? { ...r, status: e.target.value } : r)))
                    }
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="entered-in-error">entered-in-error</option>
                  </select>
                </div>
                <div className="field">
                  <label>Form (text)</label>
                  <input
                    value={row.form}
                    onChange={(e) =>
                      setMedicationProducts(medicationProducts.map((r, j) => (j === i ? { ...r, form: e.target.value } : r)))
                    }
                  />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Strength (text)</label>
                  <input
                    value={row.strength}
                    onChange={(e) =>
                      setMedicationProducts(
                        medicationProducts.map((r, j) => (j === i ? { ...r, strength: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <EncounterSelect
                  encounterRows={encounters}
                  value={row.encounterIndex}
                  onChange={(v) =>
                    setMedicationProducts(medicationProducts.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)))
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setMedicationProducts([...medicationProducts, emptyMedicationProduct()])}
            >
              Add Medication
            </button>
          </div>

          <div hidden={activeMedSubTab !== "immunization"}>
            <h3 className="pe-med-section-title">Immunization</h3>
            {immunizations.length === 0 && (
              <p className="lead" style={{ marginBottom: "1rem" }}>
                No rows — use Add below.
              </p>
            )}
            {immunizations.map((row, i) => (
              <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
                <div className="field">
                  <label>Status</label>
                  <select
                    value={row.status}
                    onChange={(e) =>
                      setImmunizations(immunizations.map((r, j) => (j === i ? { ...r, status: e.target.value } : r)))
                    }
                  >
                    <option value="completed">completed</option>
                    <option value="entered-in-error">entered-in-error</option>
                    <option value="not-done">not-done</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Vaccine code / name</label>
                  <input
                    value={row.vaccineCode}
                    onChange={(e) =>
                      setImmunizations(immunizations.map((r, j) => (j === i ? { ...r, vaccineCode: e.target.value } : r)))
                    }
                  />
                </div>
                <div className="field">
                  <label>Occurrence (datetime)</label>
                  <input
                    type="datetime-local"
                    value={row.occurrenceDateTime}
                    onChange={(e) =>
                      setImmunizations(
                        immunizations.map((r, j) => (j === i ? { ...r, occurrenceDateTime: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>Lot number</label>
                  <input
                    value={row.lotNumber}
                    onChange={(e) =>
                      setImmunizations(immunizations.map((r, j) => (j === i ? { ...r, lotNumber: e.target.value } : r)))
                    }
                  />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Manufacturer (text)</label>
                  <input
                    value={row.manufacturerText}
                    onChange={(e) =>
                      setImmunizations(
                        immunizations.map((r, j) => (j === i ? { ...r, manufacturerText: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <EncounterSelect
                  encounterRows={encounters}
                  value={row.encounterIndex}
                  onChange={(v) =>
                    setImmunizations(immunizations.map((r, j) => (j === i ? { ...r, encounterIndex: v } : r)))
                  }
                />
              </div>
            ))}
            <button type="button" className="btn btn-ghost" onClick={() => setImmunizations([...immunizations, emptyImmunization()])}>
              Add Immunization
            </button>
          </div>
        </div>
      </div>

      <div className="pe-tab-actions">
        <button type="button" className="btn btn-ghost" onClick={saveDraft}>
          Save as draft
        </button>
        {activeMainTab === "medication" ? (
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Saving…" : "Save patient & clinical data"}
          </button>
        ) : (
          <button type="button" className="btn" onClick={goNextTab}>
            Save and next
          </button>
        )}
      </div>
        </form>
      </div>
    </div>
  );
}
