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
});

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

  const [labs, setLabs] = useState<LabRow[]>([emptyLab()]);
  const [observations, setObservations] = useState<ObsRow[]>([]);
  const [conditions, setConditions] = useState<CondRow[]>([]);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    const body = {
      patient: {
        family: family || undefined,
        given: givenNames,
        gender: gender || undefined,
        birthDate: birthDate || undefined,
        phone: phone || undefined,
        email: email || undefined,
        addressLine: addressLine || undefined,
        city: city || undefined,
        state: state || undefined,
        postalCode: postalCode || undefined,
      },
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
    <form onSubmit={submit}>
      <h1>Patient &amp; clinical entry</h1>
      <p className="lead">
        Maps to FHIR <strong>Patient</strong>, <strong>Observation</strong> (labs use
        category <code>laboratory</code> automatically), and <strong>Condition</strong>{" "}
        (diagnosis).
      </p>

      {error && <div className="msg err">{error}</div>}
      {result && (
        <div className="msg ok">
          Saved patient id <code>{result}</code> — you can paste this id on the Upload
          page.
        </div>
      )}

      <div className="card">
        <h2>Patient (FHIR Patient)</h2>
        <div className="field-grid">
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
        </div>
      </div>

      <div className="card">
        <h2>Labs (FHIR Observation · laboratory)</h2>
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

      <div className="card">
        <h2>Other observations (FHIR Observation)</h2>
        {observations.length === 0 && (
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Optional vitals, surveys, exam findings—each row is one Observation.
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

      <div className="card">
        <h2>Diagnosis (FHIR Condition)</h2>
        {conditions.length === 0 && (
          <p className="lead" style={{ marginBottom: "1rem" }}>
            Add at least one diagnosis row, or leave empty.
          </p>
        )}
        {conditions.map((row, i) => (
          <div key={i} className="field-grid" style={{ marginBottom: "1rem" }}>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Code / description (ICD-10 or text)</label>
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
                <option value="inactive">inactive</option>
                <option value="resolved">resolved</option>
              </select>
            </div>
            <div className="field">
              <label>Verification</label>
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
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => setConditions([...conditions, emptyCond()])}>
          Add diagnosis
        </button>
      </div>

      <button type="submit" className="btn" disabled={busy}>
        {busy ? "Saving…" : "Save patient & clinical data"}
      </button>
    </form>
  );
}
