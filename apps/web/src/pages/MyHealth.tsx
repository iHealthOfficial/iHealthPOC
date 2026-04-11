import { FormEvent, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import PatientSummary from "./PatientSummary";

export default function MyHealth() {
  const { user, linkPatient } = useAuth();
  const [patientIdInput, setPatientIdInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const linked = user?.linkedPatientId?.trim();

  async function handleLink(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const id = patientIdInput.trim();
    if (!id) {
      setErr("Enter a patient id.");
      return;
    }
    setBusy(true);
    try {
      await linkPatient(id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not link patient");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlink() {
    setErr(null);
    setBusy(true);
    try {
      await linkPatient(null);
      setPatientIdInput("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not unlink");
    } finally {
      setBusy(false);
    }
  }

  if (linked) {
    return (
      <>
        <div className="my-health-linked-bar">
          <span className="my-health-linked-text">Viewing your linked patient record.</span>
          <button type="button" className="btn btn-ghost my-health-unlink" disabled={busy} onClick={() => void handleUnlink()}>
            {busy ? "…" : "Unlink record"}
          </button>
        </div>
        <PatientSummary embeddedPatientId={linked} myHealthMode />
      </>
    );
  }

  return (
    <div className="my-health-page">
      <div className="my-health-inner">
        <h1 className="my-health-title">My health data</h1>
        <p className="my-health-lead">
          Link your FHIR patient record using the patient UUID (for example from your care team or an administrator).
        </p>
        <form className="my-health-form" onSubmit={handleLink}>
          <label className="my-health-label" htmlFor="my-health-pid">
            Patient id
          </label>
          <input
            id="my-health-pid"
            className="my-health-input"
            type="text"
            autoComplete="off"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={patientIdInput}
            onChange={(e) => setPatientIdInput(e.target.value)}
            disabled={busy}
          />
          <button type="submit" className="btn my-health-submit" disabled={busy}>
            {busy ? "Linking…" : "Link my record"}
          </button>
        </form>
        {err && (
          <p className="my-health-err" role="alert">
            {err}
          </p>
        )}
      </div>
    </div>
  );
}
