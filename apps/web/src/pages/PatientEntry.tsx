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
  /** Index in ingest `organizations` array (only rows with a name), or "" for none */
  serviceProviderOrganizationIndex: string;
  /** Legacy / source-system encounter id (manual; not the internal UUID). */
  legacyIdentifierSystem: string;
  legacyIdentifierValue: string;
};

/** Maps to API Organization model (Encounter.serviceProvider). */
type OrganizationRow = {
  identifierSystem: string;
  identifierValue: string;
  active: boolean;
  typeText: string;
  typeCode: string;
  name: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  contactAddressLine: string;
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

/** Nested row for FamilyMemberHistory.condition */
type FamilyMemberHistoryConditionRow = {
  code: string;
  outcomeText: string;
  outcomeCode: string;
  contributedToDeath: boolean;
};

/** Nested row for FamilyMemberHistory.procedure */
type FamilyMemberHistoryProcedureRow = {
  code: string;
  outcomeText: string;
  outcomeCode: string;
  contributedToDeath: boolean;
};

/** Maps to API FamilyMemberHistory + nested condition/procedure tables */
type FamilyMemberHistoryRow = {
  identifierSystem: string;
  identifierValue: string;
  status: string;
  dataAbsentReasonText: string;
  dataAbsentReasonCode: string;
  date: string;
  name: string;
  relationshipText: string;
  relationshipCode: string;
  sex: string;
  ageString: string;
  /** "" | "true" | "false" — omit from payload when "" */
  deceasedBoolean: string;
  deceasedDate: string;
  reasonText: string;
  reasonCode: string;
  conditions: FamilyMemberHistoryConditionRow[];
  procedures: FamilyMemberHistoryProcedureRow[];
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
  serviceProviderOrganizationIndex: "",
  legacyIdentifierSystem: "",
  legacyIdentifierValue: "",
});

const emptyOrganization = (): OrganizationRow => ({
  identifierSystem: "",
  identifierValue: "",
  active: true,
  typeText: "",
  typeCode: "",
  name: "",
  description: "",
  contactPhone: "",
  contactEmail: "",
  contactAddressLine: "",
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

const emptyFmhCondition = (): FamilyMemberHistoryConditionRow => ({
  code: "",
  outcomeText: "",
  outcomeCode: "",
  contributedToDeath: false,
});

const emptyFmhProcedure = (): FamilyMemberHistoryProcedureRow => ({
  code: "",
  outcomeText: "",
  outcomeCode: "",
  contributedToDeath: false,
});

const emptyFamilyMemberHistory = (): FamilyMemberHistoryRow => ({
  identifierSystem: "",
  identifierValue: "",
  status: "completed",
  dataAbsentReasonText: "",
  dataAbsentReasonCode: "",
  date: "",
  name: "",
  relationshipText: "",
  relationshipCode: "",
  sex: "",
  ageString: "",
  deceasedBoolean: "",
  deceasedDate: "",
  reasonText: "",
  reasonCode: "",
  conditions: [],
  procedures: [],
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
  { id: "updateExisting" as const, label: "Update existing" },
  { id: "practitioner" as const, label: "Practitioner" },
  { id: "organization" as const, label: "Organization" },
  { id: "observation" as const, label: "Observation" },
  { id: "diagnosticReport" as const, label: "Diagnostic report" },
  { id: "condition" as const, label: "Condition" },
  { id: "procedure" as const, label: "Procedure" },
  { id: "allergy" as const, label: "Allergy intolerance" },
  { id: "familyHistory" as const, label: "Family history" },
  { id: "encounter" as const, label: "Encounter" },
  { id: "insurance" as const, label: "Insurance" },
  { id: "medication" as const, label: "Medication & vaccine" },
];

type MainTabId = (typeof MAIN_TABS)[number]["id"];

/** Indices match the order of organizations sent to ingest (rows without a name are skipped). */
function organizationPayloadOptions(rows: OrganizationRow[]): { index: number; label: string }[] {
  const options: { index: number; label: string }[] = [];
  let idx = 0;
  for (const row of rows) {
    if (!row.name.trim()) continue;
    const label = row.name.trim() || `Organization ${idx + 1}`;
    options.push({ index: idx, label });
    idx++;
  }
  return options;
}

function organizationRowIncludedInPayload(org: OrganizationRow): boolean {
  return org.name.trim() !== "";
}

function familyMemberHistoryRowIncludedInPayload(row: FamilyMemberHistoryRow): boolean {
  if (row.name.trim() || row.identifierSystem.trim() || row.identifierValue.trim() || row.status.trim()) return true;
  if (row.dataAbsentReasonText.trim() || row.dataAbsentReasonCode.trim()) return true;
  if (row.date || row.relationshipText.trim() || row.relationshipCode.trim()) return true;
  if (row.sex || row.ageString.trim()) return true;
  if (row.deceasedDate) return true;
  if (row.deceasedBoolean !== "") return true;
  if (row.reasonText.trim() || row.reasonCode.trim()) return true;
  if (row.conditions.some((c) => c.code.trim())) return true;
  if (row.procedures.some((p) => p.code.trim())) return true;
  return false;
}

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

function encounterRowIncludedInPayload(en: EncounterRow): boolean {
  return (
    en.status.trim() !== "" ||
    en.classCode.trim() !== "" ||
    en.typeText.trim() !== "" ||
    en.periodStart !== "" ||
    en.periodEnd !== "" ||
    en.practitionerIndex !== "" ||
    en.serviceProviderOrganizationIndex !== "" ||
    en.legacyIdentifierSystem.trim() !== "" ||
    en.legacyIdentifierValue.trim() !== ""
  );
}

function encountersInPayloadOrder(rows: EncounterRow[]): EncounterRow[] {
  return rows.filter(encounterRowIncludedInPayload);
}

/** Option index matches ingest `encounters[]` order (only rows that will be saved). */
function encounterPayloadOptions(rows: EncounterRow[]): { index: number; label: string }[] {
  return encountersInPayloadOrder(rows).map((row, index) => ({
    index,
    label:
      [
        row.legacyIdentifierValue.trim() && `Legacy ID: ${row.legacyIdentifierValue.trim()}`,
        row.typeText.trim(),
        row.status.trim(),
        row.classCode.trim(),
      ]
        .filter(Boolean)
        .join(" · ") || `Encounter ${index + 1}`,
  }));
}

function payloadEncounterIndex(encounterIndex: string): number | undefined {
  if (encounterIndex === "") return undefined;
  const n = Number.parseInt(encounterIndex, 10);
  if (Number.isNaN(n) || n < 0) return undefined;
  return n;
}

function isoToDatetimeLocal(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const t = d.getTime() - d.getTimezoneOffset() * 60000;
  return new Date(t).toISOString().slice(0, 16);
}

function givenArrayToCommaInput(stored: string): string {
  try {
    const v = JSON.parse(stored) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").join(", ") : "";
  } catch {
    return "";
  }
}

function dateOnlyInput(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
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

function OrganizationSelect({
  organizationRows,
  value,
  onChange,
}: {
  organizationRows: OrganizationRow[];
  value: string;
  onChange: (v: string) => void;
}) {
  const opts = organizationPayloadOptions(organizationRows);
  if (opts.length === 0) {
    return (
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label>Service provider organization (optional)</label>
        <p className="lead" style={{ margin: 0, fontSize: "0.9rem" }}>
          Add organizations on the Organization tab (name required) to link this encounter to a saved organization.
        </p>
      </div>
    );
  }
  return (
    <div className="field" style={{ gridColumn: "1 / -1" }}>
      <label>Service provider organization (optional)</label>
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
  const [organizationRows, setOrganizationRows] = useState<OrganizationRow[]>([]);

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
  const [familyMemberHistories, setFamilyMemberHistories] = useState<FamilyMemberHistoryRow[]>([]);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeMainTab, setActiveMainTab] = useState<MainTabId>("patient");
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [loadPatientIdInput, setLoadPatientIdInput] = useState("");
  const [loadPatientBusy, setLoadPatientBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Record<string, unknown>;
      if (d.v !== 1 && d.v !== 2 && d.v !== 3 && d.v !== 4) return;
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
      if (Array.isArray(d.organizationRows)) setOrganizationRows(d.organizationRows as OrganizationRow[]);
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
      if (Array.isArray(d.familyMemberHistories))
        setFamilyMemberHistories(d.familyMemberHistories as FamilyMemberHistoryRow[]);
      if (typeof d.editingPatientId === "string" && d.editingPatientId.trim()) {
        setEditingPatientId(d.editingPatientId.trim());
      }
      if (typeof d.loadPatientIdInput === "string") setLoadPatientIdInput(d.loadPatientIdInput);
      setDraftMessage("Restored local draft from this browser.");
      window.setTimeout(() => setDraftMessage(null), 5000);
    } catch {
      /* ignore corrupt draft */
    }
  }, []);

  function saveDraft() {
    try {
      const payload = {
        v: 4 as const,
        activeMainTab,
        editingPatientId,
        loadPatientIdInput,
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
        organizationRows,
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
        familyMemberHistories,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setError(null);
      setDraftMessage(
        "Draft saved in this browser. On the last tab, use the save button to create or update the server record.",
      );
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

  function clearLoadedPatient() {
    setEditingPatientId(null);
    setLoadPatientIdInput("");
    setError(null);
    setDraftMessage(null);
  }

  function encPayloadIdx(
    encIdToPayloadIdx: Map<string, number>,
    encounterId: unknown,
  ): string {
    if (encounterId == null || encounterId === "") return "";
    const id = String(encounterId);
    return encIdToPayloadIdx.has(id) ? String(encIdToPayloadIdx.get(id)) : "";
  }

  async function loadExistingPatient() {
    const id = loadPatientIdInput.trim();
    if (!id) {
      setError("Enter a patient id (UUID from a previous save or the patient list).");
      return;
    }
    setLoadPatientBusy(true);
    setError(null);
    setResult(null);
    try {
      const p = (await api(`/api/patients/${encodeURIComponent(id)}`)) as Record<string, unknown>;
      if (typeof p.id !== "string") {
        setError("Invalid patient response.");
        return;
      }

      const prList = (Array.isArray(p.practitioners) ? p.practitioners : []) as Record<string, unknown>[];
      prList.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

      const idToPrPayloadIdx = new Map<string, number>();
      {
        let pidx = 0;
        for (const pr of prList) {
          const g = givenArrayToCommaInput(String(pr.given ?? "[]"))
            .split(/[,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
          if (g.length === 0) continue;
          idToPrPayloadIdx.set(String(pr.id), pidx);
          pidx++;
        }
      }

      const orgList = (Array.isArray(p.organizations) ? p.organizations : []) as Record<string, unknown>[];
      orgList.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

      const idToOrgPayloadIdx = new Map<string, number>();
      {
        let oidx = 0;
        for (const o of orgList) {
          const nm = typeof o.name === "string" ? o.name.trim() : "";
          if (!nm) continue;
          idToOrgPayloadIdx.set(String(o.id), oidx);
          oidx++;
        }
      }

      const orgRows: OrganizationRow[] = orgList.map((o) => ({
        identifierSystem: typeof o.identifierSystem === "string" ? o.identifierSystem : "",
        identifierValue: typeof o.identifierValue === "string" ? o.identifierValue : "",
        active: o.active === false ? false : true,
        typeText: typeof o.typeText === "string" ? o.typeText : "",
        typeCode: typeof o.typeCode === "string" ? o.typeCode : "",
        name: typeof o.name === "string" ? o.name : "",
        description: typeof o.description === "string" ? o.description : "",
        contactPhone: typeof o.contactPhone === "string" ? o.contactPhone : "",
        contactEmail: typeof o.contactEmail === "string" ? o.contactEmail : "",
        contactAddressLine: typeof o.contactAddressLine === "string" ? o.contactAddressLine : "",
      }));

      const encList = (Array.isArray(p.encounters) ? p.encounters : []) as Record<string, unknown>[];
      encList.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

      const encRows: EncounterRow[] = encList.map((e) => {
        const pid = e.practitionerId != null ? String(e.practitionerId) : "";
        const pi = pid && idToPrPayloadIdx.has(pid) ? String(idToPrPayloadIdx.get(pid)) : "";
        const ospid =
          e.serviceProviderOrganizationId != null ? String(e.serviceProviderOrganizationId) : "";
        const spi =
          ospid && idToOrgPayloadIdx.has(ospid) ? String(idToOrgPayloadIdx.get(ospid)) : "";
        return {
          status: typeof e.status === "string" ? e.status : "",
          classCode: typeof e.classCode === "string" ? e.classCode : "",
          typeText: typeof e.typeText === "string" ? e.typeText : "",
          periodStart: isoToDatetimeLocal(e.periodStart as string | undefined),
          periodEnd: isoToDatetimeLocal(e.periodEnd as string | undefined),
          practitionerIndex: pi,
          serviceProviderOrganizationIndex: spi,
          legacyIdentifierSystem:
            typeof e.legacyIdentifierSystem === "string" ? e.legacyIdentifierSystem : "",
          legacyIdentifierValue:
            typeof e.legacyIdentifierValue === "string" ? e.legacyIdentifierValue : "",
        };
      });

      const encIdToPayloadIdx = new Map<string, number>();
      {
        let ei = 0;
        for (let i = 0; i < encList.length; i++) {
          const row = encRows[i]!;
          if (!encounterRowIncludedInPayload(row)) continue;
          encIdToPayloadIdx.set(String(encList[i]!.id), ei);
          ei++;
        }
      }

      const prRows: PractitionerRow[] = prList.map((pr) => {
        const ctx = pr.contextEncounterId != null ? String(pr.contextEncounterId) : "";
        const encIdx = encPayloadIdx(encIdToPayloadIdx, ctx || undefined);
        return {
          family: typeof pr.family === "string" ? pr.family : "",
          given: givenArrayToCommaInput(String(pr.given ?? "[]")),
          phone: typeof pr.phone === "string" ? pr.phone : "",
          email: typeof pr.email === "string" ? pr.email : "",
          identifierSystem: typeof pr.identifierSystem === "string" ? pr.identifierSystem : "",
          identifierValue: typeof pr.identifierValue === "string" ? pr.identifierValue : "",
          specialty: typeof pr.specialty === "string" ? pr.specialty : "",
          encounterIndex: encIdx,
        };
      });

      const obsAll = (Array.isArray(p.observations) ? p.observations : []) as Record<string, unknown>[];
      const labsFromApi = obsAll.filter((o) => o.category === "laboratory");
      const obsNonLab = obsAll.filter((o) => o.category !== "laboratory");

      setLabs(
        labsFromApi.length > 0
          ? labsFromApi.map((o) => ({
              code: String(o.code ?? ""),
              valueQuantity: o.valueQuantity != null ? String(o.valueQuantity) : "",
              valueQuantityUnit: typeof o.valueQuantityUnit === "string" ? o.valueQuantityUnit : "",
              effectiveDateTime: isoToDatetimeLocal(o.effectiveDateTime as string | undefined),
              encounterIndex: encPayloadIdx(encIdToPayloadIdx, o.encounterId),
            }))
          : [emptyLab()],
      );

      setObservations(
        obsNonLab.map((o) => ({
          category: typeof o.category === "string" ? o.category : "survey",
          code: String(o.code ?? ""),
          valueString: typeof o.valueString === "string" ? o.valueString : "",
          effectiveDateTime: isoToDatetimeLocal(o.effectiveDateTime as string | undefined),
          encounterIndex: encPayloadIdx(encIdToPayloadIdx, o.encounterId),
        })),
      );

      setConditions(
        (Array.isArray(p.conditions) ? p.conditions : []).map((c) => ({
          code: String(c.code ?? ""),
          clinicalStatus: typeof c.clinicalStatus === "string" ? c.clinicalStatus : "active",
          verificationStatus:
            typeof c.verificationStatus === "string" ? c.verificationStatus : "confirmed",
          onsetDateTime: isoToDatetimeLocal(c.onsetDateTime as string | undefined),
          recordedDate: isoToDatetimeLocal(c.recordedDate as string | undefined),
          encounterIndex: encPayloadIdx(encIdToPayloadIdx, c.encounterId),
        })),
      );

      setDiagnosticReports(
        (Array.isArray(p.diagnosticReports) ? p.diagnosticReports : []).map((dr) => ({
          status: typeof dr.status === "string" ? dr.status : "final",
          code: String(dr.code ?? ""),
          conclusion: typeof dr.conclusion === "string" ? dr.conclusion : "",
          effectiveDateTime: isoToDatetimeLocal(dr.effectiveDateTime as string | undefined),
          issued: isoToDatetimeLocal(dr.issued as string | undefined),
          encounterIndex: encPayloadIdx(encIdToPayloadIdx, dr.encounterId),
        })),
      );

      setProcedures(
        (Array.isArray(p.procedures) ? p.procedures : []).map((proc) => ({
          status: typeof proc.status === "string" ? proc.status : "completed",
          code: String(proc.code ?? ""),
          performedDateTime: isoToDatetimeLocal(proc.performedDateTime as string | undefined),
          bodySite: typeof proc.bodySite === "string" ? proc.bodySite : "",
          encounterIndex: encPayloadIdx(encIdToPayloadIdx, proc.encounterId),
        })),
      );

      setAllergies(
        (Array.isArray(p.allergyIntolerances) ? p.allergyIntolerances : []).map((a) => ({
          clinicalStatus: typeof a.clinicalStatus === "string" ? a.clinicalStatus : "active",
          verificationStatus:
            typeof a.verificationStatus === "string" ? a.verificationStatus : "confirmed",
          type: typeof a.type === "string" ? a.type : "allergy",
          category: typeof a.category === "string" ? a.category : "medication",
          code: String(a.code ?? ""),
          reaction: typeof a.reaction === "string" ? a.reaction : "",
          onsetDateTime: isoToDatetimeLocal(a.onsetDateTime as string | undefined),
          encounterIndex: encPayloadIdx(encIdToPayloadIdx, a.encounterId),
        })),
      );

      setEncounters(encRows);
      setOrganizationRows(orgRows);
      setPractitionerRows(prRows);

      setCoverageRows(
        (Array.isArray(p.coverages) ? p.coverages : []).map((c) => ({
          status: typeof c.status === "string" ? c.status : "",
          insurerName: typeof c.insurerName === "string" ? c.insurerName : "",
          planName: typeof c.planName === "string" ? c.planName : "",
          subscriberId: typeof c.subscriberId === "string" ? c.subscriberId : "",
          memberId: typeof c.memberId === "string" ? c.memberId : "",
          relationshipText: typeof c.relationshipText === "string" ? c.relationshipText : "",
          periodStart: isoToDatetimeLocal(c.periodStart as string | undefined),
          periodEnd: isoToDatetimeLocal(c.periodEnd as string | undefined),
        })),
      );

      setMedicationRequests(
        (Array.isArray(p.medicationRequests) ? p.medicationRequests : []).map((m) => ({
          status: typeof m.status === "string" ? m.status : "active",
          intent: typeof m.intent === "string" ? m.intent : "order",
          medicationCode: String(m.medicationCode ?? ""),
          dosageText: typeof m.dosageText === "string" ? m.dosageText : "",
          authoredOn: isoToDatetimeLocal(m.authoredOn as string | undefined),
          requesterText: typeof m.requesterText === "string" ? m.requesterText : "",
          encounterIndex: encPayloadIdx(encIdToPayloadIdx, m.encounterId),
        })),
      );

      setMedicationAdministrations(
        (Array.isArray(p.medicationAdministrations) ? p.medicationAdministrations : []).map((m) => ({
          status: typeof m.status === "string" ? m.status : "completed",
          medicationCode: String(m.medicationCode ?? ""),
          effectiveDateTime: isoToDatetimeLocal(m.effectiveDateTime as string | undefined),
          doseText: typeof m.doseText === "string" ? m.doseText : "",
          routeText: typeof m.routeText === "string" ? m.routeText : "",
          encounterIndex: encPayloadIdx(encIdToPayloadIdx, m.encounterId),
        })),
      );

      setMedicationDispenses(
        (Array.isArray(p.medicationDispenses) ? p.medicationDispenses : []).map((m) => ({
          status: typeof m.status === "string" ? m.status : "completed",
          medicationCode: String(m.medicationCode ?? ""),
          whenHandedOver: isoToDatetimeLocal(m.whenHandedOver as string | undefined),
          quantityText: typeof m.quantityText === "string" ? m.quantityText : "",
          daysSupply: m.daysSupply != null ? String(m.daysSupply) : "",
          encounterIndex: encPayloadIdx(encIdToPayloadIdx, m.encounterId),
        })),
      );

      setMedicationStatements(
        (Array.isArray(p.medicationStatements) ? p.medicationStatements : []).map((m) => ({
          status: typeof m.status === "string" ? m.status : "active",
          medicationCode: String(m.medicationCode ?? ""),
          effectiveDateTime: isoToDatetimeLocal(m.effectiveDateTime as string | undefined),
          dosageText: typeof m.dosageText === "string" ? m.dosageText : "",
          encounterIndex: encPayloadIdx(encIdToPayloadIdx, m.encounterId),
        })),
      );

      setMedicationProducts(
        (Array.isArray(p.medications) ? p.medications : []).map((m) => ({
          code: String(m.code ?? ""),
          status: typeof m.status === "string" ? m.status : "active",
          form: typeof m.form === "string" ? m.form : "",
          strength: typeof m.strength === "string" ? m.strength : "",
          encounterIndex: encPayloadIdx(encIdToPayloadIdx, m.encounterId),
        })),
      );

      setImmunizations(
        (Array.isArray(p.immunizations) ? p.immunizations : []).map((im) => ({
          status: typeof im.status === "string" ? im.status : "completed",
          vaccineCode: String(im.vaccineCode ?? ""),
          occurrenceDateTime: isoToDatetimeLocal(im.occurrenceDateTime as string | undefined),
          lotNumber: typeof im.lotNumber === "string" ? im.lotNumber : "",
          manufacturerText: typeof im.manufacturerText === "string" ? im.manufacturerText : "",
          encounterIndex: encPayloadIdx(encIdToPayloadIdx, im.encounterId),
        })),
      );

      const fmhApi = (Array.isArray(p.familyMemberHistories) ? p.familyMemberHistories : []) as Record<
        string,
        unknown
      >[];
      fmhApi.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
      setFamilyMemberHistories(
        fmhApi.map((fh) => {
          const conds = (Array.isArray(fh.conditions) ? fh.conditions : []) as Record<string, unknown>[];
          const procs = (Array.isArray(fh.procedures) ? fh.procedures : []) as Record<string, unknown>[];
          return {
            identifierSystem: typeof fh.identifierSystem === "string" ? fh.identifierSystem : "",
            identifierValue: typeof fh.identifierValue === "string" ? fh.identifierValue : "",
            status: typeof fh.status === "string" ? fh.status : "completed",
            dataAbsentReasonText:
              typeof fh.dataAbsentReasonText === "string" ? fh.dataAbsentReasonText : "",
            dataAbsentReasonCode:
              typeof fh.dataAbsentReasonCode === "string" ? fh.dataAbsentReasonCode : "",
            date: dateOnlyInput(fh.date as string | undefined),
            name: typeof fh.name === "string" ? fh.name : "",
            relationshipText: typeof fh.relationshipText === "string" ? fh.relationshipText : "",
            relationshipCode: typeof fh.relationshipCode === "string" ? fh.relationshipCode : "",
            sex: typeof fh.sex === "string" ? fh.sex : "",
            ageString: typeof fh.ageString === "string" ? fh.ageString : "",
            deceasedBoolean:
              fh.deceasedBoolean === true ? "true" : fh.deceasedBoolean === false ? "false" : "",
            deceasedDate: dateOnlyInput(fh.deceasedDate as string | undefined),
            reasonText: typeof fh.reasonText === "string" ? fh.reasonText : "",
            reasonCode: typeof fh.reasonCode === "string" ? fh.reasonCode : "",
            conditions: conds.map((c) => ({
              code: String(c.code ?? ""),
              outcomeText: typeof c.outcomeText === "string" ? c.outcomeText : "",
              outcomeCode: typeof c.outcomeCode === "string" ? c.outcomeCode : "",
              contributedToDeath: c.contributedToDeath === true,
            })),
            procedures: procs.map((pr) => ({
              code: String(pr.code ?? ""),
              outcomeText: typeof pr.outcomeText === "string" ? pr.outcomeText : "",
              outcomeCode: typeof pr.outcomeCode === "string" ? pr.outcomeCode : "",
              contributedToDeath: pr.contributedToDeath === true,
            })),
          };
        }),
      );

      setFamily(typeof p.family === "string" ? p.family : "");
      setGiven(givenArrayToCommaInput(String(p.given ?? "[]")));
      setGender(typeof p.gender === "string" ? p.gender : "");
      setBirthDate(dateOnlyInput(p.birthDate as string | undefined));
      setPhone(typeof p.phone === "string" ? p.phone : "");
      setEmail(typeof p.email === "string" ? p.email : "");
      setAddressLine(typeof p.addressLine === "string" ? p.addressLine : "");
      setCity(typeof p.city === "string" ? p.city : "");
      setState(typeof p.state === "string" ? p.state : "");
      setPostalCode(typeof p.postalCode === "string" ? p.postalCode : "");
      setPatientActive(p.active === true);
      setCountry(typeof p.country === "string" && p.country ? p.country : "US");
      setIdentifierSystem(typeof p.identifierSystem === "string" ? p.identifierSystem : "");
      setIdentifierValue(typeof p.identifierValue === "string" ? p.identifierValue : "");

      setEditingPatientId(String(p.id));
      setLoadPatientIdInput(String(p.id));
      setDraftMessage(
        `Loaded patient ${String(p.id)}. Edit on any tab, then use the button on Medication & vaccine to update the server.`,
      );
      window.setTimeout(() => setDraftMessage(null), 8000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load patient.");
    } finally {
      setLoadPatientBusy(false);
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
      organizations: organizationRows
        .filter((row) => organizationRowIncludedInPayload(row))
        .map((row) => ({
          identifierSystem: row.identifierSystem.trim() || undefined,
          identifierValue: row.identifierValue.trim() || undefined,
          active: row.active,
          typeText: row.typeText.trim() || undefined,
          typeCode: row.typeCode.trim() || undefined,
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          contactPhone: row.contactPhone.trim() || undefined,
          contactEmail: row.contactEmail.trim() || undefined,
          contactAddressLine: row.contactAddressLine.trim() || undefined,
        })),
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
      encounters: encounters.filter(encounterRowIncludedInPayload).map((en) => {
        const pi =
          en.practitionerIndex === "" ? undefined : Number.parseInt(en.practitionerIndex, 10);
        const spi =
          en.serviceProviderOrganizationIndex === ""
            ? undefined
            : Number.parseInt(en.serviceProviderOrganizationIndex, 10);
        return {
          status: en.status.trim() || undefined,
          classCode: en.classCode.trim() || undefined,
          typeText: en.typeText.trim() || undefined,
          periodStart: en.periodStart ? new Date(en.periodStart).toISOString() : undefined,
          periodEnd: en.periodEnd ? new Date(en.periodEnd).toISOString() : undefined,
          practitionerIndex: pi != null && !Number.isNaN(pi) && pi >= 0 ? pi : undefined,
          serviceProviderOrganizationIndex:
            spi != null && !Number.isNaN(spi) && spi >= 0 ? spi : undefined,
          legacyIdentifierSystem: en.legacyIdentifierSystem.trim() || undefined,
          legacyIdentifierValue: en.legacyIdentifierValue.trim() || undefined,
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
      familyMemberHistories: familyMemberHistories
        .filter((row) => familyMemberHistoryRowIncludedInPayload(row))
        .map((row) => ({
          identifierSystem: row.identifierSystem.trim() || undefined,
          identifierValue: row.identifierValue.trim() || undefined,
          status: row.status.trim() || undefined,
          dataAbsentReasonText: row.dataAbsentReasonText.trim() || undefined,
          dataAbsentReasonCode: row.dataAbsentReasonCode.trim() || undefined,
          date: row.date ? new Date(`${row.date}T12:00:00`).toISOString() : undefined,
          name: row.name.trim() || undefined,
          relationshipText: row.relationshipText.trim() || undefined,
          relationshipCode: row.relationshipCode.trim() || undefined,
          sex: row.sex.trim() || undefined,
          ageString: row.ageString.trim() || undefined,
          deceasedBoolean:
            row.deceasedBoolean === "" ? undefined : row.deceasedBoolean === "true",
          deceasedDate: row.deceasedDate
            ? new Date(`${row.deceasedDate}T12:00:00`).toISOString()
            : undefined,
          reasonText: row.reasonText.trim() || undefined,
          reasonCode: row.reasonCode.trim() || undefined,
          conditions: row.conditions
            .filter((c) => c.code.trim())
            .map((c) => ({
              code: c.code.trim(),
              outcomeText: c.outcomeText.trim() || undefined,
              outcomeCode: c.outcomeCode.trim() || undefined,
              contributedToDeath: c.contributedToDeath,
            })),
          procedures: row.procedures
            .filter((pr) => pr.code.trim())
            .map((pr) => ({
              code: pr.code.trim(),
              outcomeText: pr.outcomeText.trim() || undefined,
              outcomeCode: pr.outcomeCode.trim() || undefined,
              contributedToDeath: pr.contributedToDeath,
            })),
        })),
    };

    try {
      const saved = editingPatientId
        ? await api<{ id: string }>(`/api/patients/${encodeURIComponent(editingPatientId)}`, {
            method: "PUT",
            body: JSON.stringify(body),
          })
        : await api<{ id: string }>("/api/patients/ingest", {
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
        Use the tabs in any order; nothing is required until you finish. <strong>Update existing</strong> loads a patient by
        id so you can edit and replace their clinical data. <strong>Save as draft</strong> stores your work in this browser
        (works offline). <strong>Save and next</strong> moves to the next tab. On the last tab, save sends one request to the
        server (create or update if you loaded an existing patient).
      </p>

      {error && <div className="msg err">{error}</div>}
      {draftMessage && <div className="msg ok">{draftMessage}</div>}
      {result && (
        <div className="msg ok">
          {editingPatientId ? (
            <>
              Updated patient <code>{result}</code>.
            </>
          ) : (
            <>
              Saved patient id <code>{result}</code> — you can paste this id on the Upload page.
            </>
          )}
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
        id="pe-panel-updateExisting"
        aria-labelledby="pe-tab-updateExisting"
        hidden={activeMainTab !== "updateExisting"}
      >
        <div className="card">
          <h2>Update existing patient</h2>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Enter the patient UUID (from a previous save or the patient list), then load. All tabs will fill with current
            data; saving on the last tab replaces clinical data on the server (uploaded files for this patient are not
            removed).
          </p>
          {editingPatientId && (
            <p className="lead" style={{ marginBottom: "1rem" }}>
              Editing <code>{editingPatientId}</code> —{" "}
              <button type="button" className="btn btn-ghost" onClick={clearLoadedPatient}>
                Clear loaded patient
              </button>
            </p>
          )}
          <div className="field-grid">
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Patient id</label>
              <input
                value={loadPatientIdInput}
                onChange={(e) => setLoadPatientIdInput(e.target.value)}
                placeholder="e.g. uuid from last save"
                autoComplete="off"
              />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <button
                type="button"
                className="btn"
                disabled={loadPatientBusy}
                onClick={() => void loadExistingPatient()}
              >
                {loadPatientBusy ? "Loading…" : "Load patient"}
              </button>
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
        id="pe-panel-organization"
        aria-labelledby="pe-tab-organization"
        hidden={activeMainTab !== "organization"}
      >
        <div className="card">
          <h2>Organization (FHIR Organization)</h2>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Add care sites, departments, or teams linked to this patient. <strong>Name</strong> is required for each row you
            want saved; empty-name rows are skipped. On the Encounter tab, choose <strong>Service provider organization</strong>{" "}
            to set <code>Encounter.serviceProvider</code> (index matches saved organizations in order).
          </p>
          {organizationRows.length === 0 && (
            <p className="lead" style={{ marginBottom: "1rem" }}>
              No organizations yet — use &quot;Add organization&quot; below.
            </p>
          )}
          {organizationRows.map((row, i) => (
            <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="pe-inline-check">
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={(e) =>
                      setOrganizationRows(
                        organizationRows.map((r, j) => (j === i ? { ...r, active: e.target.checked } : r)),
                      )
                    }
                  />
                  Active (Organization.active)
                </label>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Name (required to save row)</label>
                <input
                  value={row.name}
                  onChange={(e) =>
                    setOrganizationRows(organizationRows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
                  }
                  placeholder="City General · Cardiology"
                />
              </div>
              <div className="field">
                <label>Type code (optional)</label>
                <input
                  value={row.typeCode}
                  onChange={(e) =>
                    setOrganizationRows(organizationRows.map((r, j) => (j === i ? { ...r, typeCode: e.target.value } : r)))
                  }
                  placeholder="prov, dept…"
                />
              </div>
              <div className="field">
                <label>Type display (optional)</label>
                <input
                  value={row.typeText}
                  onChange={(e) =>
                    setOrganizationRows(organizationRows.map((r, j) => (j === i ? { ...r, typeText: e.target.value } : r)))
                  }
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Description (optional)</label>
                <input
                  value={row.description}
                  onChange={(e) =>
                    setOrganizationRows(
                      organizationRows.map((r, j) => (j === i ? { ...r, description: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Identifier system (URI)</label>
                <input
                  value={row.identifierSystem}
                  onChange={(e) =>
                    setOrganizationRows(
                      organizationRows.map((r, j) => (j === i ? { ...r, identifierSystem: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Identifier value</label>
                <input
                  value={row.identifierValue}
                  onChange={(e) =>
                    setOrganizationRows(
                      organizationRows.map((r, j) => (j === i ? { ...r, identifierValue: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Contact phone</label>
                <input
                  value={row.contactPhone}
                  onChange={(e) =>
                    setOrganizationRows(
                      organizationRows.map((r, j) => (j === i ? { ...r, contactPhone: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Contact email</label>
                <input
                  type="email"
                  value={row.contactEmail}
                  onChange={(e) =>
                    setOrganizationRows(
                      organizationRows.map((r, j) => (j === i ? { ...r, contactEmail: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Contact address line</label>
                <input
                  value={row.contactAddressLine}
                  onChange={(e) =>
                    setOrganizationRows(
                      organizationRows.map((r, j) => (j === i ? { ...r, contactAddressLine: e.target.value } : r)),
                    )
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setOrganizationRows([...organizationRows, emptyOrganization()])}
          >
            Add organization
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
        id="pe-panel-familyHistory"
        aria-labelledby="pe-tab-familyHistory"
        hidden={activeMainTab !== "familyHistory"}
      >
        <div className="card">
          <h2>Family history (FHIR FamilyMemberHistory)</h2>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            One block per relative or family history record. The <strong>patient</strong> reference is always the person you
            are entering on this form. Add nested <strong>condition</strong> and <strong>procedure</strong> rows with a code;
            empty top-level rows (no fields and no nested codes) are not saved.
          </p>
          {familyMemberHistories.length === 0 && (
            <p className="lead" style={{ marginBottom: "1rem" }}>
              No family history rows yet — use &quot;Add family history&quot; below.
            </p>
          )}
          {familyMemberHistories.map((row, i) => (
            <div
              key={i}
              className="field-grid"
              style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="field">
                <label>Status</label>
                <select
                  value={row.status}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, status: e.target.value } : r)),
                    )
                  }
                >
                  <option value="partial">partial</option>
                  <option value="completed">completed</option>
                  <option value="entered-in-error">entered-in-error</option>
                  <option value="health-unknown">health-unknown</option>
                </select>
              </div>
              <div className="field">
                <label>Identifier system (URI)</label>
                <input
                  value={row.identifierSystem}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, identifierSystem: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Identifier value</label>
                <input
                  value={row.identifierValue}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, identifierValue: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Data absent reason (text)</label>
                <input
                  value={row.dataAbsentReasonText}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, dataAbsentReasonText: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Data absent reason (code)</label>
                <input
                  value={row.dataAbsentReasonCode}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, dataAbsentReasonCode: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Recorded date</label>
                <input
                  type="date"
                  value={row.date}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, date: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Relative name</label>
                <input
                  value={row.name}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Relationship (text)</label>
                <input
                  value={row.relationshipText}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, relationshipText: e.target.value } : r)),
                    )
                  }
                  placeholder="Father, mother, sibling…"
                />
              </div>
              <div className="field">
                <label>Relationship (code)</label>
                <input
                  value={row.relationshipCode}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, relationshipCode: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Sex (administrative)</label>
                <select
                  value={row.sex}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, sex: e.target.value } : r)),
                    )
                  }
                >
                  <option value="">—</option>
                  <option value="male">male</option>
                  <option value="female">female</option>
                  <option value="other">other</option>
                  <option value="unknown">unknown</option>
                </select>
              </div>
              <div className="field">
                <label>Age (text)</label>
                <input
                  value={row.ageString}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, ageString: e.target.value } : r)),
                    )
                  }
                  placeholder="e.g. 51a, or 40–50"
                />
              </div>
              <div className="field">
                <label>Deceased</label>
                <select
                  value={row.deceasedBoolean}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, deceasedBoolean: e.target.value } : r)),
                    )
                  }
                >
                  <option value="">— unknown —</option>
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
              </div>
              <div className="field">
                <label>Deceased date</label>
                <input
                  type="date"
                  value={row.deceasedDate}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, deceasedDate: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Reason (text)</label>
                <input
                  value={row.reasonText}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, reasonText: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="field">
                <label>Reason (code)</label>
                <input
                  value={row.reasonCode}
                  onChange={(e) =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) => (j === i ? { ...r, reasonCode: e.target.value } : r)),
                    )
                  }
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <h3 style={{ margin: "0.5rem 0 0.75rem", fontSize: "1rem" }}>Conditions</h3>
                {row.conditions.length === 0 && (
                  <p className="lead" style={{ margin: "0 0 0.4rem", fontSize: "0.9rem" }}>
                    No conditions — add below if needed.
                  </p>
                )}
                {row.conditions.map((c, ci) => (
                  <div
                    key={ci}
                    className="field-grid"
                    style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "rgba(0,0,0,0.03)", borderRadius: 8 }}
                  >
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                      <label>Condition code / text</label>
                      <input
                        value={c.code}
                        onChange={(e) =>
                          setFamilyMemberHistories(
                            familyMemberHistories.map((r, j) =>
                              j === i
                                ? {
                                    ...r,
                                    conditions: r.conditions.map((cc, cj) =>
                                      cj === ci ? { ...cc, code: e.target.value } : cc,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Outcome (text)</label>
                      <input
                        value={c.outcomeText}
                        onChange={(e) =>
                          setFamilyMemberHistories(
                            familyMemberHistories.map((r, j) =>
                              j === i
                                ? {
                                    ...r,
                                    conditions: r.conditions.map((cc, cj) =>
                                      cj === ci ? { ...cc, outcomeText: e.target.value } : cc,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Outcome (code)</label>
                      <input
                        value={c.outcomeCode}
                        onChange={(e) =>
                          setFamilyMemberHistories(
                            familyMemberHistories.map((r, j) =>
                              j === i
                                ? {
                                    ...r,
                                    conditions: r.conditions.map((cc, cj) =>
                                      cj === ci ? { ...cc, outcomeCode: e.target.value } : cc,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                      <label className="pe-inline-check">
                        <input
                          type="checkbox"
                          checked={c.contributedToDeath}
                          onChange={(e) =>
                            setFamilyMemberHistories(
                              familyMemberHistories.map((r, j) =>
                                j === i
                                  ? {
                                      ...r,
                                      conditions: r.conditions.map((cc, cj) =>
                                        cj === ci ? { ...cc, contributedToDeath: e.target.checked } : cc,
                                      ),
                                    }
                                  : r,
                              ),
                            )
                          }
                        />
                        Contributed to death
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: "0.25rem" }}
                  onClick={() =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) =>
                        j === i ? { ...r, conditions: [...r.conditions, emptyFmhCondition()] } : r,
                      ),
                    )
                  }
                >
                  Add condition
                </button>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <h3 style={{ margin: "0.75rem 0 0.75rem", fontSize: "1rem" }}>Procedures</h3>
                {row.procedures.length === 0 && (
                  <p className="lead" style={{ margin: "0 0 0.4rem", fontSize: "0.9rem" }}>
                    No procedures — add below if needed.
                  </p>
                )}
                {row.procedures.map((p, pi) => (
                  <div
                    key={pi}
                    className="field-grid"
                    style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "rgba(0,0,0,0.03)", borderRadius: 8 }}
                  >
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                      <label>Procedure code / text</label>
                      <input
                        value={p.code}
                        onChange={(e) =>
                          setFamilyMemberHistories(
                            familyMemberHistories.map((r, j) =>
                              j === i
                                ? {
                                    ...r,
                                    procedures: r.procedures.map((pp, pj) =>
                                      pj === pi ? { ...pp, code: e.target.value } : pp,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Outcome (text)</label>
                      <input
                        value={p.outcomeText}
                        onChange={(e) =>
                          setFamilyMemberHistories(
                            familyMemberHistories.map((r, j) =>
                              j === i
                                ? {
                                    ...r,
                                    procedures: r.procedures.map((pp, pj) =>
                                      pj === pi ? { ...pp, outcomeText: e.target.value } : pp,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Outcome (code)</label>
                      <input
                        value={p.outcomeCode}
                        onChange={(e) =>
                          setFamilyMemberHistories(
                            familyMemberHistories.map((r, j) =>
                              j === i
                                ? {
                                    ...r,
                                    procedures: r.procedures.map((pp, pj) =>
                                      pj === pi ? { ...pp, outcomeCode: e.target.value } : pp,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                      <label className="pe-inline-check">
                        <input
                          type="checkbox"
                          checked={p.contributedToDeath}
                          onChange={(e) =>
                            setFamilyMemberHistories(
                              familyMemberHistories.map((r, j) =>
                                j === i
                                  ? {
                                      ...r,
                                      procedures: r.procedures.map((pp, pj) =>
                                        pj === pi ? { ...pp, contributedToDeath: e.target.checked } : pp,
                                      ),
                                    }
                                  : r,
                              ),
                            )
                          }
                        />
                        Contributed to death
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: "0.25rem" }}
                  onClick={() =>
                    setFamilyMemberHistories(
                      familyMemberHistories.map((r, j) =>
                        j === i ? { ...r, procedures: [...r.procedures, emptyFmhProcedure()] } : r,
                      ),
                    )
                  }
                >
                  Add procedure
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setFamilyMemberHistories([...familyMemberHistories, emptyFamilyMemberHistory()])}
          >
            Add family history
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
            Class uses ActCode values (e.g. AMB ambulatory, EMER emergency). Participant links to a practitioner row from
            this form (same order as saved practitioners — add them on the Practitioner tab first). Service provider links to
            an organization row (same order as saved organizations — add them on the Organization tab first). Use{" "}
            <strong>Legacy encounter identifier</strong> for the business id from a prior system; it is stored and exported
            to FHIR as <code>Encounter.identifier</code> and is never auto-generated.
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
                <label>Legacy identifier system (optional URI)</label>
                <input
                  value={row.legacyIdentifierSystem}
                  onChange={(e) =>
                    setEncounters(
                      encounters.map((r, j) => (j === i ? { ...r, legacyIdentifierSystem: e.target.value } : r)),
                    )
                  }
                  placeholder="urn:oid:… or https://…"
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Legacy encounter identifier value (optional)</label>
                <input
                  value={row.legacyIdentifierValue}
                  onChange={(e) =>
                    setEncounters(
                      encounters.map((r, j) => (j === i ? { ...r, legacyIdentifierValue: e.target.value } : r)),
                    )
                  }
                  placeholder="VIS-2019-0042, CSN, etc."
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
              <OrganizationSelect
                organizationRows={organizationRows}
                value={row.serviceProviderOrganizationIndex}
                onChange={(v) =>
                  setEncounters(
                    encounters.map((r, j) => (j === i ? { ...r, serviceProviderOrganizationIndex: v } : r)),
                  )
                }
              />
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
            {busy
              ? "Saving…"
              : editingPatientId
                ? "Update patient & clinical data"
                : "Save patient & clinical data"}
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
