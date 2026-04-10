import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";

/** Full patient payload from GET /api/patients/:id (subset used in chunks 1–2). */
type PatientDetail = {
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
};

function parseGivenNames(givenJson: string): string[] {
  try {
    const v = JSON.parse(givenJson) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function displayName(p: PatientDetail): string {
  const given = parseGivenNames(p.given);
  const g = given.join(" ");
  if (g && p.family) return `${g} ${p.family}`.trim();
  return g || p.family || "Unknown patient";
}

function patientInitials(p: PatientDetail): string {
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

function formatAddressLine(p: PatientDetail): string {
  const parts = [p.addressLine, p.city, p.state, p.postalCode, p.country].filter(
    (x) => x && String(x).trim(),
  ) as string[];
  return parts.length ? parts.join(", ") : "—";
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

export default function PatientSummary() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id?.trim()) {
      setPhase("error");
      setErrorMessage("Missing patient id in URL.");
      return;
    }

    let cancelled = false;
    setPhase("loading");
    setPatient(null);

    void (async () => {
      try {
        const p = await api<PatientDetail>(`/api/patients/${encodeURIComponent(id)}`);
        if (cancelled) return;
        setPatient(p);
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
  }, [id]);

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
            Check the id or return to the{" "}
            <Link to="/patients">Patient Directory</Link>.
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
            <Link to="/patients">Back to Patient Directory</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!patient) return null;

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
      <div className="patient-summary-inner">
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
          <span className="ps-top-label">FHIR patient record</span>
          <span className="ps-fhir-chip">R4 · FHIR native</span>
        </div>

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

            <p className="ps-chunk-placeholder">
              Clinical sections (encounters, observations, medications, …) follow in later chunks.
            </p>
            <p className="ps-nav-links">
              <Link to="/patients">Patient Directory</Link>
              {" · "}
              <Link to={`/patient`}>Manual Patient Entry</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatGender(code: string): string {
  const c = code.toLowerCase();
  if (c === "male") return "Male";
  if (c === "female") return "Female";
  if (c === "other") return "Other";
  if (c === "unknown") return "Unknown";
  return code;
}
