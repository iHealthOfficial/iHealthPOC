import { useState } from "react";
import { api } from "../api";

type LabRow = {
  code: string;
  valueQuantity: string;
  valueQuantityUnit: string;
  effectiveDateTime: string;
};

type ObsRow = {
  category: string;
  code: string;
  valueString: string;
  effectiveDateTime: string;
};

type CondRow = {
  code: string;
  clinicalStatus: string;
  verificationStatus: string;
  onsetDateTime: string;
  recordedDate: string;
};

type ProcedureRow = {
  status: string;
  code: string;
  performedDateTime: string;
  bodySite: string;
};

type PractitionerRow = {
  family: string;
  given: string;
  phone: string;
  email: string;
  identifierSystem: string;
  identifierValue: string;
  specialty: string;
};

/** FHIR DiagnosticReport — report-level metadata (lab values are Observations with category laboratory). */
type DiagnosticReportRow = {
  status: string;
  code: string;
  conclusion: string;
  effectiveDateTime: string;
  issued: string;
};

const emptyLab = (): LabRow => ({
  code: "",
  valueQuantity: "",
  valueQuantityUnit: "",
  effectiveDateTime: "",
});

const emptyObs = (): ObsRow => ({
  category: "vital-signs",
  code: "",
  valueString: "",
  effectiveDateTime: "",
});

const emptyCond = (): CondRow => ({
  code: "",
  clinicalStatus: "active",
  verificationStatus: "confirmed",
  onsetDateTime: "",
  recordedDate: "",
});

const emptyProcedure = (): ProcedureRow => ({
  status: "completed",
  code: "",
  performedDateTime: "",
  bodySite: "",
});

const emptyPractitioner = (): PractitionerRow => ({
  family: "",
  given: "",
  phone: "",
  email: "",
  identifierSystem: "",
  identifierValue: "",
  specialty: "",
});

const emptyDiagnosticReport = (): DiagnosticReportRow => ({
  status: "final",
  code: "",
  conclusion: "",
  effectiveDateTime: "",
  issued: "",
});

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

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeMainTab, setActiveMainTab] = useState<MainTabId>("patient");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
        })),
      conditions: conditions
        .filter((c) => c.code.trim())
        .map((c) => ({
          code: c.code.trim(),
          clinicalStatus: c.clinicalStatus || undefined,
          verificationStatus: c.verificationStatus || undefined,
          onsetDateTime: c.onsetDateTime ? new Date(c.onsetDateTime).toISOString() : undefined,
          recordedDate: c.recordedDate ? new Date(c.recordedDate).toISOString() : undefined,
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
        })),
    };

    try {
      const saved = await api<{ id: string }>("/api/patients/ingest", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(saved.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="patient-entry-page">
      <div className="patient-entry-inner">
        <form onSubmit={submit}>
      <h1>Manual patient entry</h1>
      <p className="lead">
        Use the tabs to move between FHIR resource areas. All entered data is saved together when you submit.{" "}
        <strong>Patient</strong>, <strong>Practitioner</strong>, <strong>Observation</strong> (non-laboratory),{" "}
        <strong>Diagnostic report</strong> (report metadata plus lab results as Observations), <strong>Condition</strong>, and{" "}
        <strong>Procedure</strong> have fields; other tabs are placeholders until their chunks land.
      </p>

      {error && <div className="msg err">{error}</div>}
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
              className={["pe-main-tab", selected ? "pe-main-tab--active" : ""].filter(Boolean).join(" ")}
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
              required
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
          <p className="lead" style={{ marginBottom: 0 }}>
            Allergy and intolerance rows will be added in a later chunk.
          </p>
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
          <p className="lead" style={{ marginBottom: 0 }}>
            Visit or encounter rows will be added in a later chunk.
          </p>
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
          <p className="lead" style={{ marginBottom: 0 }}>
            Coverage and plan fields will be added in a later chunk (aligned to patient insurance capture).
          </p>
        </div>
      </div>

      <div
        role="tabpanel"
        id="pe-panel-medication"
        aria-labelledby="pe-tab-medication"
        hidden={activeMainTab !== "medication"}
      >
        <div className="card">
          <h2>Medication &amp; vaccine (FHIR medication resources)</h2>
          <p className="lead" style={{ marginBottom: 0 }}>
            Sub-tabs for MedicationRequest, administration, dispense, statement, Medication, and Immunization will be
            added in later chunks.
          </p>
        </div>
      </div>

      <button type="submit" className="btn" disabled={busy}>
        {busy ? "Saving…" : "Save patient & clinical data"}
      </button>
        </form>
      </div>
    </div>
  );
}
