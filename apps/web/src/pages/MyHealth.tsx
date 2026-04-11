import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import PatientSummary from "./PatientSummary";

type UnlinkedTab = "link" | "details";

export default function MyHealth() {
  const { user, linkPatient } = useAuth();
  const [patientIdInput, setPatientIdInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<UnlinkedTab>("link");

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
          Link your FHIR patient record using the patient UUID. If you do not have this id yet, use <strong>Add details</strong> below.
        </p>

        <div className="my-health-tabs" role="tablist" aria-label="Link record or get help">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "link"}
            className={`my-health-tab${tab === "link" ? " my-health-tab--active" : ""}`}
            onClick={() => {
              setTab("link");
              setErr(null);
            }}
          >
            Link my record
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "details"}
            className={`my-health-tab${tab === "details" ? " my-health-tab--active" : ""}`}
            onClick={() => {
              setTab("details");
              setErr(null);
            }}
          >
            Add details
          </button>
        </div>

        {tab === "link" && (
          <div className="my-health-tab-panel" role="tabpanel">
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
        )}

        {tab === "details" && (
          <div className="my-health-tab-panel my-health-details" role="tabpanel">
            <h2 className="my-health-details-title">Where do I find my patient id?</h2>
            <p className="my-health-details-p">
              Your <strong>patient id</strong> is a unique identifier (a UUID) for your record in this platform. It is not the same as
              your insurance member number or medical record number unless your organization uses that as the linked id.
            </p>
            <ul className="my-health-details-list">
              <li>Ask your <strong>care team</strong> or clinic—they can confirm the id used for your chart in this system.</li>
              <li>Check any <strong>welcome email</strong> or patient portal message from your provider that references “patient id” or “record id.”</li>
              <li>If your organization has an <strong>administrator</strong> for this platform, they can look it up and share it with you securely.</li>
            </ul>
            <p className="my-health-details-p">
              Once you have the id, switch to <button type="button" className="my-health-inline-link" onClick={() => setTab("link")}>Link my record</button> and paste
              it into the field, then select <strong>Link my record</strong>.
            </p>
            <p className="my-health-details-p">
              Still stuck? Use <Link to="/feedback">Feedback</Link> to send a message to the platform team (include how we can reach you).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
