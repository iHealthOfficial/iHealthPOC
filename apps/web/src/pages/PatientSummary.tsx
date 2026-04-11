import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import type { ConsentResourceType } from "../consent/consentTypes";
import {
  isMainTabConsentVisible,
  isMedSubTabConsentVisible,
} from "../consent/patientSummaryConsent";
import { useConsentScopes } from "../consent/useConsentScopes";

/** GET /api/patients/:id includes full clinical graph (Prisma JSON dates as ISO strings). */
type PractitionerRef = {
  id: string;
  family: string | null;
  given: string;
};

type OrganizationRef = {
  id: string;
  name: string;
};

type EncounterRow = {
  id: string;
  status: string | null;
  classCode: string | null;
  typeText: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  legacyIdentifierSystem: string | null;
  legacyIdentifierValue: string | null;
  practitioner: PractitionerRef | null;
  serviceProviderOrganization: OrganizationRef | null;
};

type ObservationRow = {
  id: string;
  category: string;
  code: string;
  valueString: string | null;
  valueQuantity: number | null;
  valueQuantityUnit: string | null;
  effectiveDateTime: string | null;
};

type ConditionRow = {
  id: string;
  clinicalStatus: string | null;
  verificationStatus: string | null;
  code: string;
  onsetDateTime: string | null;
  recordedDate: string | null;
};

type DiagnosticReportRow = {
  id: string;
  status: string;
  code: string;
  conclusion: string | null;
  effectiveDateTime: string | null;
  issued: string | null;
};

type ProcedureRow = {
  id: string;
  status: string | null;
  code: string;
  performedDateTime: string | null;
  bodySite: string | null;
};

type AllergyRow = {
  id: string;
  clinicalStatus: string | null;
  verificationStatus: string | null;
  type: string | null;
  category: string | null;
  code: string;
  reaction: string | null;
  onsetDateTime: string | null;
};

type MedicationRequestRow = {
  id: string;
  status: string | null;
  intent: string | null;
  medicationCode: string;
  dosageText: string | null;
  authoredOn: string | null;
  requesterText: string | null;
};

type MedicationAdminRow = {
  id: string;
  status: string | null;
  medicationCode: string;
  effectiveDateTime: string | null;
  doseText: string | null;
  routeText: string | null;
};

type MedicationDispenseRow = {
  id: string;
  status: string | null;
  medicationCode: string;
  whenHandedOver: string | null;
  quantityText: string | null;
  daysSupply: number | null;
};

type MedicationStatementRow = {
  id: string;
  status: string | null;
  medicationCode: string;
  effectiveDateTime: string | null;
  dosageText: string | null;
};

type MedicationProductRow = {
  id: string;
  code: string;
  status: string | null;
  form: string | null;
  strength: string | null;
};

type ImmunizationRow = {
  id: string;
  status: string | null;
  vaccineCode: string;
  occurrenceDateTime: string | null;
  lotNumber: string | null;
  manufacturerText: string | null;
};

type CoverageRow = {
  id: string;
  status: string | null;
  insurerName: string | null;
  planName: string | null;
  subscriberId: string | null;
  memberId: string | null;
  relationshipText: string | null;
  periodStart: string | null;
  periodEnd: string | null;
};

type FamilyConditionRow = { id: string; code: string; outcomeText: string | null };
type FamilyProcedureRow = { id: string; code: string; outcomeText: string | null };

type FamilyMemberHistoryRow = {
  id: string;
  identifierSystem: string | null;
  identifierValue: string | null;
  status: string | null;
  dataAbsentReasonText: string | null;
  dataAbsentReasonCode: string | null;
  date: string | null;
  name: string | null;
  relationshipText: string | null;
  relationshipCode: string | null;
  sex: string | null;
  ageString: string | null;
  deceasedBoolean: boolean | null;
  deceasedDate: string | null;
  reasonText: string | null;
  reasonCode: string | null;
  conditions: FamilyConditionRow[];
  procedures: FamilyProcedureRow[];
};

type PatientFull = {
  id: string;
  active: boolean;
  family: string | null;
  given: string;
  gender: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  identifierSystem: string | null;
  identifierValue: string | null;
  updatedAt: string;
  encounters: EncounterRow[];
  observations: ObservationRow[];
  conditions: ConditionRow[];
  diagnosticReports: DiagnosticReportRow[];
  procedures: ProcedureRow[];
  allergyIntolerances: AllergyRow[];
  medicationRequests: MedicationRequestRow[];
  medicationAdministrations: MedicationAdminRow[];
  medicationDispenses: MedicationDispenseRow[];
  medicationStatements: MedicationStatementRow[];
  medications: MedicationProductRow[];
  immunizations: ImmunizationRow[];
  coverages: CoverageRow[];
  familyMemberHistories: FamilyMemberHistoryRow[];
};

/** Chunk 3: main read-only clinical tabs (labels + state). */
const PS_MAIN_TABS = [
  { id: "encounters" as const, label: "Encounters" },
  { id: "clinical" as const, label: "Clinical overview" },
  { id: "medications" as const, label: "Medications & vaccines" },
  { id: "insurance" as const, label: "Insurance" },
  { id: "family" as const, label: "Family history" },
] as const;

type PsMainTabId = (typeof PS_MAIN_TABS)[number]["id"];

/** Chunk 5: medication / vaccine sub-tabs (aligned with Manual Patient Entry). */
const PS_MED_SUB_TABS = [
  { id: "request" as const, label: "MedicationRequest" },
  { id: "administration" as const, label: "MedicationAdministration" },
  { id: "dispense" as const, label: "MedicationDispense" },
  { id: "statement" as const, label: "MedicationStatement" },
  { id: "medication" as const, label: "Medication" },
  { id: "immunization" as const, label: "Immunization" },
] as const;

type PsMedSubTabId = (typeof PS_MED_SUB_TABS)[number]["id"];

function mainTabCount(
  p: PatientFull,
  tab: PsMainTabId,
  scopes: Record<ConsentResourceType, boolean>,
): number {
  switch (tab) {
    case "encounters":
      return scopes.Encounter ? p.encounters.length : 0;
    case "clinical": {
      let n = 0;
      if (scopes.Observation) n += p.observations.length;
      if (scopes.Condition) n += p.conditions.length;
      if (scopes.DiagnosticReport) n += p.diagnosticReports.length;
      if (scopes.Procedure) n += p.procedures.length;
      if (scopes.AllergyIntolerance) n += p.allergyIntolerances.length;
      return n;
    }
    case "medications": {
      let n = 0;
      if (scopes.MedicationRequest) n += p.medicationRequests.length;
      if (scopes.MedicationAdministration) n += p.medicationAdministrations.length;
      if (scopes.MedicationDispense) n += p.medicationDispenses.length;
      if (scopes.MedicationStatement) n += p.medicationStatements.length;
      if (scopes.Medication) n += p.medications.length;
      if (scopes.Immunization) n += p.immunizations.length;
      return n;
    }
    case "insurance":
      return scopes.Coverage ? p.coverages.length : 0;
    case "family":
      return scopes.FamilyMemberHistory ? p.familyMemberHistories.length : 0;
  }
}

function parseGivenNames(givenJson: string): string[] {
  try {
    const v = JSON.parse(givenJson) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function practitionerDisplay(pr: PractitionerRef | null): string {
  if (!pr) return "—";
  const given = parseGivenNames(pr.given);
  const g = given.join(" ");
  if (g && pr.family) return `${g} ${pr.family}`.trim();
  return g || pr.family || "—";
}

function displayName(p: Pick<PatientFull, "family" | "given">): string {
  const given = parseGivenNames(p.given);
  const g = given.join(" ");
  if (g && p.family) return `${g} ${p.family}`.trim();
  return g || p.family || "Unknown patient";
}

function patientInitials(p: Pick<PatientFull, "family" | "given">): string {
  const given = parseGivenNames(p.given);
  const g0 = given[0]?.trim() ?? "";
  const fam = p.family?.trim() ?? "";
  const a = g0 ? g0[0] : "";
  const b = fam ? fam[0] : given[1]?.[0] ?? "";
  const s = `${a}${b}`.toUpperCase();
  return s.length ? s : "?";
}

function formatBirthDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPeriod(start: string | null, end: string | null): string {
  const a = formatDateTime(start);
  const b = formatDateTime(end);
  if (a === "—" && b === "—") return "—";
  if (b === "—" || start === end) return a;
  return `${a} → ${b}`;
}

function formatAddressLine(p: PatientFull): string {
  const parts = [p.addressLine, p.city, p.state, p.postalCode, p.country].filter(
    (x) => x && String(x).trim(),
  ) as string[];
  return parts.length ? parts.join(", ") : "—";
}

function observationValue(o: ObservationRow): string {
  if (o.valueString?.trim()) return o.valueString.trim();
  if (o.valueQuantity != null) {
    const u = o.valueQuantityUnit?.trim() ? ` ${o.valueQuantityUnit.trim()}` : "";
    return `${o.valueQuantity}${u}`;
  }
  return "—";
}

function isNotFoundError(message: string): boolean {
  if (/404|not\s*found/i.test(message)) return true;
  try {
    const j = JSON.parse(message) as { error?: string };
    return j.error === "Not found";
  } catch {
    return false;
  }
}

function formatGender(code: string): string {
  const c = code.toLowerCase();
  if (c === "male") return "Male";
  if (c === "female") return "Female";
  if (c === "other") return "Other";
  if (c === "unknown") return "Unknown";
  return code;
}

function emptyArr<T>(x: T[] | undefined): T[] {
  return Array.isArray(x) ? x : [];
}

export default function PatientSummary({
  embeddedPatientId,
  myHealthMode = false,
}: {
  embeddedPatientId?: string;
  myHealthMode?: boolean;
} = {}) {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const id = (embeddedPatientId ?? params.id)?.trim() ?? "";
  const consentScopes = useConsentScopes(id?.trim() ?? "");
  const [patient, setPatient] = useState<PatientFull | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<PsMainTabId>("encounters");
  const [medSubTab, setMedSubTab] = useState<PsMedSubTabId>("request");
  const [fhirOpen, setFhirOpen] = useState(false);
  const [fhirJson, setFhirJson] = useState("");
  const [fhirLoading, setFhirLoading] = useState(false);

  type JourneyEvent = {
    id: string;
    createdAt: string;
    action: string;
    detail: string;
    actorEmail: string | null;
  };
  const [journeyEvents, setJourneyEvents] = useState<JourneyEvent[] | null>(null);

  const showJourney = user?.role === "admin" && !myHealthMode;

  useEffect(() => {
    if (!id || myHealthMode || user?.role !== "admin") {
      setJourneyEvents(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await api<{ events: JourneyEvent[] }>(
          `/api/admin/patients/${encodeURIComponent(id)}/activity`,
        );
        if (!cancelled) setJourneyEvents(data.events);
      } catch {
        if (!cancelled) setJourneyEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, myHealthMode, user?.role]);

  useEffect(() => {
    if (!id?.trim()) {
      setPhase("error");
      setErrorMessage(
        myHealthMode ? "No patient record is linked to your account yet." : "Missing patient id in URL.",
      );
      return;
    }

    let cancelled = false;
    setPhase("loading");
    setPatient(null);

    void (async () => {
      try {
        const path =
          user?.role === "admin"
            ? `/api/admin/patients/${encodeURIComponent(id)}`
            : `/api/patients/${encodeURIComponent(id)}`;
        const raw = await api<PatientFull & { _adminConsent?: unknown }>(path);
        if (cancelled) return;
        const { _adminConsent: _ac, ...p } = raw;
        void _ac;
        setPatient({
          ...p,
          encounters: emptyArr(p.encounters),
          observations: emptyArr(p.observations),
          conditions: emptyArr(p.conditions),
          diagnosticReports: emptyArr(p.diagnosticReports),
          procedures: emptyArr(p.procedures),
          allergyIntolerances: emptyArr(p.allergyIntolerances),
          medicationRequests: emptyArr(p.medicationRequests),
          medicationAdministrations: emptyArr(p.medicationAdministrations),
          medicationDispenses: emptyArr(p.medicationDispenses),
          medicationStatements: emptyArr(p.medicationStatements),
          medications: emptyArr(p.medications),
          immunizations: emptyArr(p.immunizations),
          coverages: emptyArr(p.coverages),
          familyMemberHistories: emptyArr(p.familyMemberHistories).map((fh) => ({
            ...fh,
            conditions: emptyArr(fh.conditions),
            procedures: emptyArr(fh.procedures),
          })),
        });
        setPhase("ready");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Request failed";
        if (isNotFoundError(msg)) setPhase("notfound");
        else {
          setPhase("error");
          setErrorMessage(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, myHealthMode, user?.role]);

  const sortedEncounters = useMemo(() => {
    if (!patient?.encounters) return [];
    return [...patient.encounters].sort((a, b) => {
      const ta = a.periodStart ? new Date(a.periodStart).getTime() : 0;
      const tb = b.periodStart ? new Date(b.periodStart).getTime() : 0;
      return tb - ta;
    });
  }, [patient?.encounters]);

  const labObs = useMemo(
    () => patient?.observations.filter((o) => o.category === "laboratory") ?? [],
    [patient?.observations],
  );
  const otherObs = useMemo(
    () => patient?.observations.filter((o) => o.category !== "laboratory") ?? [],
    [patient?.observations],
  );

  const visibleMainTabs = useMemo(
    () => PS_MAIN_TABS.filter((t) => isMainTabConsentVisible(consentScopes, t.id)),
    [consentScopes],
  );

  const visibleMedSubTabs = useMemo(
    () => PS_MED_SUB_TABS.filter((t) => isMedSubTabConsentVisible(consentScopes, t.id)),
    [consentScopes],
  );

  useEffect(() => {
    if (visibleMainTabs.length === 0) return;
    if (!visibleMainTabs.some((t) => t.id === activeTab)) {
      setActiveTab(visibleMainTabs[0]!.id);
    }
  }, [visibleMainTabs, activeTab]);

  useEffect(() => {
    if (visibleMedSubTabs.length === 0) return;
    if (!visibleMedSubTabs.some((t) => t.id === medSubTab)) {
      setMedSubTab(visibleMedSubTabs[0]!.id);
    }
  }, [visibleMedSubTabs, medSubTab]);

  async function openFhirBundle() {
    if (!id?.trim()) return;
    setFhirOpen(true);
    setFhirJson("");
    setFhirLoading(true);
    try {
      const obj = await api<Record<string, unknown>>(`/api/patients/${encodeURIComponent(id)}/fhir`);
      setFhirJson(JSON.stringify(obj, null, 2));
    } catch (e) {
      setFhirJson(e instanceof Error ? e.message : "Failed to load FHIR bundle");
    } finally {
      setFhirLoading(false);
    }
  }

  if (phase === "loading") {
    return (
      <div className="patient-summary-app">
        <div className="patient-summary-inner">
          <p className="patient-summary-lead">Loading patient…</p>
        </div>
      </div>
    );
  }

  if (phase === "notfound") {
    return (
      <div className="patient-summary-app">
        <div className="patient-summary-inner">
          <p className="patient-summary-lead">Patient not found.</p>
          <p className="patient-summary-muted">
            {myHealthMode ? (
              <>
                Check your linked id or return to{" "}
                <Link to="/my-health">My health data</Link>.
              </>
            ) : (
              <>
                Check the id or return to the{" "}
                <Link to="/patients">Patient Directory</Link>.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="patient-summary-app">
        <div className="patient-summary-inner">
          <p className="patient-summary-lead">Could not load patient.</p>
          <p className="patient-summary-muted">{errorMessage}</p>
          <p className="patient-summary-muted">
            {myHealthMode ? (
              <Link to="/my-health">Back to My health data</Link>
            ) : (
              <Link to="/patients">Back to Patient Directory</Link>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (!patient) return null;

  function journeyLabelShort(ev: JourneyEvent): string {
    const map: Record<string, string> = {
      auth_login: "User signed in",
      auth_register: "Account signup completed",
      consent_saved: "Consent preferences saved",
      patient_link: "Account linked to record",
      patient_unlink: "Patient record unlinked",
      patient_ingested: "New patient record created",
      patient_updated: "Clinical data updated",
    };
    return map[ev.action] ?? ev.detail;
  }

  function formatJourneyTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const name = displayName(patient);
  const initials = patientInitials(patient);
  const idShort = patient.id.length > 12 ? `${patient.id.slice(0, 8)}…` : patient.id;
  const mrnLine =
    patient.identifierValue?.trim() &&
    `MRN ${patient.identifierValue.trim()} · Last updated ${formatUpdatedAt(patient.updatedAt)}`;
  const subLine =
    mrnLine ||
    `Patient id ${idShort} · Last updated ${formatUpdatedAt(patient.updatedAt)}`;

  return (
    <div className="patient-summary-app">
      <div className={`patient-summary-inner${showJourney ? " patient-summary-inner--with-journey" : ""}`}>
        <div className="ps-admin-main">
        <div className="ps-top-bar">
          <svg
            className="ps-top-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="ps-top-label">{myHealthMode ? "My health data" : "FHIR patient record"}</span>
          <span className="ps-fhir-chip">R4 · FHIR native</span>
          <button type="button" className="btn btn-ghost ps-fhir-bundle-btn" onClick={() => void openFhirBundle()}>
            FHIR bundle
          </button>
        </div>

        <nav className="ps-breadcrumb" aria-label="Breadcrumb">
          {myHealthMode ? (
            <>
              <Link to="/">Home</Link>
              <span className="ps-breadcrumb-sep" aria-hidden>
                /
              </span>
              <span className="ps-breadcrumb-current">My health data</span>
              <span className="ps-breadcrumb-sep" aria-hidden>
                /
              </span>
              <span className="ps-breadcrumb-current">{name}</span>
            </>
          ) : (
            <>
              <Link to="/patients">Patient Directory</Link>
              <span className="ps-breadcrumb-sep" aria-hidden>
                /
              </span>
              <span className="ps-breadcrumb-current">{name}</span>
            </>
          )}
        </nav>

        <div className="ps-patient-header">
          <div className="ps-avatar" aria-hidden>
            {initials}
          </div>
          <div className="ps-header-main">
            <div className="ps-name-row">
              <h1 className="ps-patient-name">{name}</h1>
              <span className="ps-pid-badge" title={patient.id}>
                {idShort}
              </span>
              {patient.active ? (
                <span className="ps-status-badge ps-s-active">
                  <span className="ps-status-dot ps-status-dot--on" />
                  Active
                </span>
              ) : (
                <span className="ps-status-badge ps-s-inactive">
                  <span className="ps-status-dot ps-status-dot--off" />
                  Inactive
                </span>
              )}
            </div>
            <div className="ps-patient-sub">
              <svg
                className="ps-sub-icon"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {subLine}
            </div>

            <div className="ps-patient-meta">
              <div className="ps-meta-item">
                <div className="ps-meta-icon ps-meta-icon--blue">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <div>
                  <div className="ps-meta-label">Date of birth</div>
                  <div className="ps-meta-value">{formatBirthDate(patient.birthDate)}</div>
                </div>
              </div>
              <div className="ps-meta-item">
                <div className="ps-meta-icon ps-meta-icon--green">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <div className="ps-meta-label">Gender</div>
                  <div className="ps-meta-value">{patient.gender ? formatGender(patient.gender) : "—"}</div>
                </div>
              </div>
              <div className="ps-meta-item">
                <div className="ps-meta-icon ps-meta-icon--amber">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.13 6.13l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <div className="ps-meta-label">Phone</div>
                  <div className="ps-meta-value">{patient.phone?.trim() || "—"}</div>
                </div>
              </div>
              <div className="ps-meta-item">
                <div className="ps-meta-icon ps-meta-icon--violet">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                </div>
                <div>
                  <div className="ps-meta-label">Email</div>
                  <div className="ps-meta-value">{patient.email?.trim() || "—"}</div>
                </div>
              </div>
              <div className="ps-meta-item ps-meta-item--wide">
                <div className="ps-meta-icon ps-meta-icon--pin">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="ps-meta-label">Address</div>
                  <div className="ps-meta-value">{formatAddressLine(patient)}</div>
                </div>
              </div>
            </div>

            <p className="ps-consent-hint">
              Clinical sections follow your <Link to="/consent">Consent portal</Link> settings (saved in this
              browser).
            </p>

            {/* Chunk 3: consent-filtered main tabs · counts respect permitted resource types */}
            {visibleMainTabs.length === 0 ? (
              <p className="ps-consent-blocked">
                No clinical categories are permitted under your current consent settings.{" "}
                <Link to="/consent">Open Consent portal</Link> to allow at least one resource type.
              </p>
            ) : (
              <>
                <nav className="ps-main-tabs" aria-label="Clinical record sections">
                  {visibleMainTabs.map((tab) => {
                    const cnt = mainTabCount(patient, tab.id, consentScopes);
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        className={`ps-main-tab ps-main-tab--${tab.id}${activeTab === tab.id ? " ps-main-tab--active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                        aria-pressed={activeTab === tab.id}
                      >
                        <span className="ps-main-tab-text">{tab.label}</span>
                        <span className="ps-tab-count" aria-label={`${cnt} items`}>
                          {cnt}
                        </span>
                      </button>
                    );
                  })}
                </nav>

                <div className="ps-panels">
              {activeTab === "encounters" && (
                <section className="ps-panel" aria-labelledby="ps-encounters-heading">
                  <h2 id="ps-encounters-heading" className="ps-panel-title">
                    Encounters
                  </h2>
                  {sortedEncounters.length === 0 ? (
                    <p className="ps-panel-empty">No encounters recorded.</p>
                  ) : (
                    <div className="table-scroll ps-table-wrap">
                      <table className="data-table ps-data-table">
                        <thead>
                          <tr>
                            <th>Period</th>
                            <th>Status</th>
                            <th>Class</th>
                            <th>Type</th>
                            <th>Practitioner</th>
                            <th>Service provider</th>
                            <th>Legacy id</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedEncounters.map((row) => (
                            <tr key={row.id}>
                              <td className="cell-mono">{formatPeriod(row.periodStart, row.periodEnd)}</td>
                              <td>{row.status?.trim() || "—"}</td>
                              <td>{row.classCode?.trim() || "—"}</td>
                              <td>{row.typeText?.trim() || "—"}</td>
                              <td>{practitionerDisplay(row.practitioner)}</td>
                              <td>{row.serviceProviderOrganization?.name?.trim() || "—"}</td>
                              <td className="cell-mono">
                                {row.legacyIdentifierValue?.trim()
                                  ? [row.legacyIdentifierSystem, row.legacyIdentifierValue].filter(Boolean).join(" | ")
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {activeTab === "clinical" && (
                <section className="ps-panel ps-panel--clinical" aria-labelledby="ps-clinical-heading">
                  <h2 id="ps-clinical-heading" className="visually-hidden">
                    Clinical overview
                  </h2>
                  <div className="ps-clinical-grid">
                    {consentScopes.Observation && (
                    <div className="ps-clinical-card">
                      <h3 className="ps-clinical-card-title">Laboratory</h3>
                      {labObs.length === 0 ? (
                        <p className="ps-panel-empty">No laboratory results.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Code</th>
                                <th>Value</th>
                                <th>Effective</th>
                              </tr>
                            </thead>
                            <tbody>
                              {labObs.map((o) => (
                                <tr key={o.id}>
                                  <td>{o.code}</td>
                                  <td className="cell-mono">{observationValue(o)}</td>
                                  <td className="cell-mono">{formatDateTime(o.effectiveDateTime)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    )}
                    {consentScopes.Observation && (
                    <div className="ps-clinical-card">
                      <h3 className="ps-clinical-card-title">Observations (non-lab)</h3>
                      {otherObs.length === 0 ? (
                        <p className="ps-panel-empty">No other observations.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Category</th>
                                <th>Code</th>
                                <th>Value</th>
                                <th>Effective</th>
                              </tr>
                            </thead>
                            <tbody>
                              {otherObs.map((o) => (
                                <tr key={o.id}>
                                  <td>{o.category}</td>
                                  <td>{o.code}</td>
                                  <td className="cell-mono">{observationValue(o)}</td>
                                  <td className="cell-mono">{formatDateTime(o.effectiveDateTime)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    )}
                    {consentScopes.Condition && (
                    <div className="ps-clinical-card">
                      <h3 className="ps-clinical-card-title">Conditions</h3>
                      {patient.conditions.length === 0 ? (
                        <p className="ps-panel-empty">No conditions.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Code</th>
                                <th>Clinical</th>
                                <th>Recorded</th>
                                <th>Onset</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patient.conditions.map((c) => (
                                <tr key={c.id}>
                                  <td>{c.code}</td>
                                  <td>{c.clinicalStatus?.trim() || "—"}</td>
                                  <td className="cell-mono">{formatDateTime(c.recordedDate)}</td>
                                  <td className="cell-mono">{formatDateTime(c.onsetDateTime)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    )}
                    {consentScopes.DiagnosticReport && (
                    <div className="ps-clinical-card">
                      <h3 className="ps-clinical-card-title">Diagnostic reports</h3>
                      {patient.diagnosticReports.length === 0 ? (
                        <p className="ps-panel-empty">No diagnostic reports.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Code</th>
                                <th>Conclusion</th>
                                <th>Effective</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patient.diagnosticReports.map((dr) => (
                                <tr key={dr.id}>
                                  <td>{dr.code}</td>
                                  <td>{dr.conclusion?.trim() || "—"}</td>
                                  <td className="cell-mono">{formatDateTime(dr.effectiveDateTime)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    )}
                    {consentScopes.Procedure && (
                    <div className="ps-clinical-card">
                      <h3 className="ps-clinical-card-title">Procedures</h3>
                      {patient.procedures.length === 0 ? (
                        <p className="ps-panel-empty">No procedures.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Code</th>
                                <th>Status</th>
                                <th>Performed</th>
                                <th>Body site</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patient.procedures.map((pr) => (
                                <tr key={pr.id}>
                                  <td>{pr.code}</td>
                                  <td>{pr.status?.trim() || "—"}</td>
                                  <td className="cell-mono">{formatDateTime(pr.performedDateTime)}</td>
                                  <td>{pr.bodySite?.trim() || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    )}
                    {consentScopes.AllergyIntolerance && (
                    <div className="ps-clinical-card">
                      <h3 className="ps-clinical-card-title">Allergies</h3>
                      {patient.allergyIntolerances.length === 0 ? (
                        <p className="ps-panel-empty">No allergy intolerances.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Code</th>
                                <th>Clinical</th>
                                <th>Reaction</th>
                                <th>Onset</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patient.allergyIntolerances.map((a) => (
                                <tr key={a.id}>
                                  <td>{a.code}</td>
                                  <td>{a.clinicalStatus?.trim() || "—"}</td>
                                  <td>{a.reaction?.trim() || "—"}</td>
                                  <td className="cell-mono">{formatDateTime(a.onsetDateTime)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                </section>
              )}

              {/* Chunk 5: medication & vaccine sub-tabs (immunization included) */}
              {activeTab === "medications" && (
                <section className="ps-panel" aria-labelledby="ps-med-heading">
                  <h2 id="ps-med-heading" className="ps-panel-title">
                    Medications & vaccines
                  </h2>
                  <div className="pe-med-tabs" role="tablist" aria-label="Medication and immunization resource types">
                    {visibleMedSubTabs.map((tab) => {
                      const sel = medSubTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={sel}
                          className={["pe-med-tab", `pe-med-tab--${tab.id}`, sel ? "pe-med-tab--active" : ""]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => setMedSubTab(tab.id)}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {medSubTab === "request" && (
                    <div className="ps-med-panel" role="tabpanel">
                      <h3 className="pe-med-section-title">MedicationRequest</h3>
                      {patient.medicationRequests.length === 0 ? (
                        <p className="ps-panel-empty">None.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Medication</th>
                                <th>Status</th>
                                <th>Intent</th>
                                <th>Dosage</th>
                                <th>Requester</th>
                                <th>Authored</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patient.medicationRequests.map((m) => (
                                <tr key={m.id}>
                                  <td>{m.medicationCode}</td>
                                  <td>{m.status?.trim() || "—"}</td>
                                  <td>{m.intent?.trim() || "—"}</td>
                                  <td>{m.dosageText?.trim() || "—"}</td>
                                  <td>{m.requesterText?.trim() || "—"}</td>
                                  <td className="cell-mono">{formatDateTime(m.authoredOn)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {medSubTab === "administration" && (
                    <div className="ps-med-panel" role="tabpanel">
                      <h3 className="pe-med-section-title">MedicationAdministration</h3>
                      {patient.medicationAdministrations.length === 0 ? (
                        <p className="ps-panel-empty">None.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Medication</th>
                                <th>Status</th>
                                <th>Effective</th>
                                <th>Dose</th>
                                <th>Route</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patient.medicationAdministrations.map((m) => (
                                <tr key={m.id}>
                                  <td>{m.medicationCode}</td>
                                  <td>{m.status?.trim() || "—"}</td>
                                  <td className="cell-mono">{formatDateTime(m.effectiveDateTime)}</td>
                                  <td>{m.doseText?.trim() || "—"}</td>
                                  <td>{m.routeText?.trim() || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {medSubTab === "dispense" && (
                    <div className="ps-med-panel" role="tabpanel">
                      <h3 className="pe-med-section-title">MedicationDispense</h3>
                      {patient.medicationDispenses.length === 0 ? (
                        <p className="ps-panel-empty">None.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Medication</th>
                                <th>Status</th>
                                <th>When handed over</th>
                                <th>Quantity</th>
                                <th>Days supply</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patient.medicationDispenses.map((m) => (
                                <tr key={m.id}>
                                  <td>{m.medicationCode}</td>
                                  <td>{m.status?.trim() || "—"}</td>
                                  <td className="cell-mono">{formatDateTime(m.whenHandedOver)}</td>
                                  <td>{m.quantityText?.trim() || "—"}</td>
                                  <td>{m.daysSupply != null ? String(m.daysSupply) : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {medSubTab === "statement" && (
                    <div className="ps-med-panel" role="tabpanel">
                      <h3 className="pe-med-section-title">MedicationStatement</h3>
                      {patient.medicationStatements.length === 0 ? (
                        <p className="ps-panel-empty">None.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Medication</th>
                                <th>Status</th>
                                <th>Effective</th>
                                <th>Dosage</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patient.medicationStatements.map((m) => (
                                <tr key={m.id}>
                                  <td>{m.medicationCode}</td>
                                  <td>{m.status?.trim() || "—"}</td>
                                  <td className="cell-mono">{formatDateTime(m.effectiveDateTime)}</td>
                                  <td>{m.dosageText?.trim() || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {medSubTab === "medication" && (
                    <div className="ps-med-panel" role="tabpanel">
                      <h3 className="pe-med-section-title">Medication (product)</h3>
                      {patient.medications.length === 0 ? (
                        <p className="ps-panel-empty">None.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Code</th>
                                <th>Form</th>
                                <th>Strength</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patient.medications.map((m) => (
                                <tr key={m.id}>
                                  <td>{m.code}</td>
                                  <td>{m.form?.trim() || "—"}</td>
                                  <td>{m.strength?.trim() || "—"}</td>
                                  <td>{m.status?.trim() || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {medSubTab === "immunization" && (
                    <div className="ps-med-panel" role="tabpanel">
                      <h3 className="pe-med-section-title">Immunization</h3>
                      {patient.immunizations.length === 0 ? (
                        <p className="ps-panel-empty">No immunizations.</p>
                      ) : (
                        <div className="table-scroll ps-table-wrap">
                          <table className="data-table ps-data-table">
                            <thead>
                              <tr>
                                <th>Vaccine</th>
                                <th>Status</th>
                                <th>Occurrence</th>
                                <th>Lot</th>
                                <th>Manufacturer</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patient.immunizations.map((im) => (
                                <tr key={im.id}>
                                  <td>{im.vaccineCode}</td>
                                  <td>{im.status?.trim() || "—"}</td>
                                  <td className="cell-mono">{formatDateTime(im.occurrenceDateTime)}</td>
                                  <td>{im.lotNumber?.trim() || "—"}</td>
                                  <td>{im.manufacturerText?.trim() || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "insurance" && (
                <section className="ps-panel" aria-labelledby="ps-cov-heading">
                  <h2 id="ps-cov-heading" className="ps-panel-title">
                    Insurance & coverage
                  </h2>
                  {patient.coverages.length === 0 ? (
                    <p className="ps-panel-empty">No coverage rows.</p>
                  ) : (
                    <div className="table-scroll ps-table-wrap">
                      <table className="data-table ps-data-table">
                        <thead>
                          <tr>
                            <th>Insurer</th>
                            <th>Plan</th>
                            <th>Subscriber</th>
                            <th>Member</th>
                            <th>Period</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patient.coverages.map((c) => (
                            <tr key={c.id}>
                              <td>{c.insurerName?.trim() || "—"}</td>
                              <td>{c.planName?.trim() || "—"}</td>
                              <td className="cell-mono">{c.subscriberId?.trim() || "—"}</td>
                              <td className="cell-mono">{c.memberId?.trim() || "—"}</td>
                              <td className="cell-mono">
                                {formatPeriod(c.periodStart, c.periodEnd)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {activeTab === "family" && (
                <section className="ps-panel" aria-labelledby="ps-fmh-heading">
                  <h2 id="ps-fmh-heading" className="ps-panel-title">
                    Family history
                  </h2>
                  {patient.familyMemberHistories.length === 0 ? (
                    <p className="ps-panel-empty">No family member history rows.</p>
                  ) : (
                    <ul className="ps-fmh-list">
                      {patient.familyMemberHistories.map((fh) => (
                        <li key={fh.id} className="ps-fmh-card">
                          <div className="ps-fmh-head">
                            <span className="ps-fmh-name">{fh.name?.trim() || "Relative"}</span>
                            {fh.relationshipText?.trim() && (
                              <span className="ps-fmh-rel">{fh.relationshipText.trim()}</span>
                            )}
                          </div>
                          <dl className="ps-fmh-dl">
                            {(fh.identifierValue?.trim() || fh.identifierSystem?.trim()) && (
                              <>
                                <dt>Identifier</dt>
                                <dd className="cell-mono">
                                  {[fh.identifierSystem, fh.identifierValue].filter(Boolean).join(" | ") || "—"}
                                </dd>
                              </>
                            )}
                            {fh.date && (
                              <>
                                <dt>Date</dt>
                                <dd>{formatDateTime(fh.date)}</dd>
                              </>
                            )}
                            {fh.sex?.trim() && (
                              <>
                                <dt>Sex</dt>
                                <dd>{fh.sex}</dd>
                              </>
                            )}
                            {fh.ageString?.trim() && (
                              <>
                                <dt>Age</dt>
                                <dd>{fh.ageString}</dd>
                              </>
                            )}
                            {fh.deceasedBoolean != null && (
                              <>
                                <dt>Deceased</dt>
                                <dd>{fh.deceasedBoolean ? "Yes" : "No"}</dd>
                              </>
                            )}
                            {fh.deceasedDate && (
                              <>
                                <dt>Deceased date</dt>
                                <dd>{formatDateTime(fh.deceasedDate)}</dd>
                              </>
                            )}
                            {fh.reasonText?.trim() && (
                              <>
                                <dt>Reason</dt>
                                <dd>{fh.reasonText.trim()}</dd>
                              </>
                            )}
                          </dl>
                          {fh.conditions.length > 0 && (
                            <div className="ps-fmh-sub">
                              <div className="ps-fmh-subtitle">Conditions</div>
                              <ul>
                                {fh.conditions.map((c) => (
                                  <li key={c.id}>{c.code}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {fh.procedures.length > 0 && (
                            <div className="ps-fmh-sub">
                              <div className="ps-fmh-subtitle">Procedures</div>
                              <ul>
                                {fh.procedures.map((p) => (
                                  <li key={p.id}>{p.code}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
                </div>
              </>
            )}

            <p className="ps-nav-links">
              {myHealthMode ? (
                <>
                  <Link to="/consent">Consent portal</Link>
                  {" · "}
                  <Link to="/">Home</Link>
                </>
              ) : (
                <>
                  <Link to="/patients">Patient Directory</Link>
                  {" · "}
                  <Link to="/patient">Manual Patient Entry</Link>
                </>
              )}
            </p>
          </div>
        </div>
        </div>

        {showJourney && (
          <aside className="ps-journey-rail" aria-label="Patient journey timeline">
            <h2 className="ps-journey-title">Patient journey</h2>
            <p className="ps-journey-hint">Key events for this record and linked accounts (oldest first).</p>
            {journeyEvents === null ? (
              <p className="ps-journey-loading">Loading timeline…</p>
            ) : journeyEvents.length === 0 ? (
              <p className="ps-journey-empty">No journey events yet.</p>
            ) : (
              <ul className="ps-journey-list">
                {journeyEvents.map((ev, idx) => (
                  <li key={ev.id} className="ps-journey-item">
                    <div className="ps-journey-track">
                      <span
                        className={`ps-journey-dot${idx === 0 ? " ps-journey-dot--first" : ""}`}
                        aria-hidden
                      />
                      {idx < journeyEvents.length - 1 && <span className="ps-journey-line" aria-hidden />}
                    </div>
                    <div className="ps-journey-body">
                      <time className="ps-journey-time" dateTime={ev.createdAt}>
                        {formatJourneyTime(ev.createdAt)}
                      </time>
                      <p className="ps-journey-desc">{journeyLabelShort(ev)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}

        {fhirOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="FHIR bundle">
            <div className="modal-panel">
              <div className="modal-head">
                <h2>FHIR Bundle (collection)</h2>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setFhirOpen(false);
                    setFhirJson("");
                  }}
                >
                  Close
                </button>
              </div>
              {fhirLoading ? (
                <p className="lead">Loading…</p>
              ) : (
                <textarea className="modal-json" readOnly value={fhirJson} spellCheck={false} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
