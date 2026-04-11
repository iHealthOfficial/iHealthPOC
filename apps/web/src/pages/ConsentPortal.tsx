import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CONSENT_RESOURCE_META,
  CONSENT_RESOURCE_TYPES,
  type ConsentResourceType,
} from "../consent/consentTypes";
import { useAuth } from "../auth/AuthContext";
import {
  countPermitted,
  countRestricted,
  loadConsentSavedAt,
  loadConsentScopes,
  saveConsentScopes,
} from "../consent/consentStorage";

const DEMO_ACCESS_EVENTS = 24;

const PENDING_REQUESTS = [
  {
    id: "p1",
    variant: "amber" as const,
    title: "Apollo Research Institute — Clinical study access",
    sub: "Requested by Dr. Sunita Iyer · 02 Apr 2026 · Expires if not acted on by 16 Apr 2026",
    scopes: ["Observation", "DiagnosticReport", "Condition", "MedicationRequest"] as const,
  },
  {
    id: "p2",
    variant: "purple" as const,
    title: "Star Health Insurance — Annual claim verification",
    sub: "Requested by insurer portal · 01 Apr 2026 · One-time read access",
    scopes: ["Encounter", "Procedure", "MedicationAdministration"] as const,
  },
] as const;

const ACCESS_HISTORY_ROWS = [
  {
    who: "Dr. Priya Nair",
    org: "Apollo Hospitals",
    initials: "PN",
    grad: "linear-gradient(135deg,#9FE1CB,#0F6E56)",
    scopes: ["Observation", "MedicationRequest"],
    purpose: "Treatment review",
    when: "01 Apr 2026, 10:42",
    status: "ok" as const,
  },
  {
    who: "Dr. Rohan Mehta",
    org: "Fortis Noida",
    initials: "RM",
    grad: "linear-gradient(135deg,#B5D4F4,#185FA5)",
    scopes: ["DiagnosticReport", "Procedure", "Encounter"],
    purpose: "Post-procedure review",
    when: "31 Mar 2026, 15:18",
    status: "ok" as const,
  },
  {
    who: "Apollo Pharmacy",
    org: "Dispensing system",
    initials: "AP",
    grad: "linear-gradient(135deg,#FAC775,#854F0B)",
    scopes: ["MedicationDispense", "AllergyIntolerance"],
    purpose: "Dispensing check",
    when: "28 Mar 2026, 09:05",
    status: "ok" as const,
  },
  {
    who: "Star Health Portal",
    org: "Insurance system",
    initials: "SH",
    grad: "linear-gradient(135deg,#AFA9EC,#534AB7)",
    scopes: ["Observation"],
    purpose: "Claim verification",
    when: "25 Mar 2026, 14:30",
    status: "blocked" as const,
  },
] as const;

function useToast() {
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const tid = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(tid);
  }, [toast]);
  return { toast, showToast: setToast };
}

function formatSavedAt(iso: string | null): string {
  if (!iso) return "Not saved yet";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not saved yet";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConsentPortal() {
  const [scopes, setScopes] = useState<Record<ConsentResourceType, boolean>>(loadConsentScopes);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => loadConsentSavedAt());
  const [auditOpen, setAuditOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<string | null>(null);
  const [exportFmt, setExportFmt] = useState<"fhir" | "pdf">("fhir");
  const [pendingIds, setPendingIds] = useState<Set<string>>(
    () => new Set(PENDING_REQUESTS.map((p) => p.id)),
  );
  const { toast, showToast } = useToast();
  const { user, refreshUser } = useAuth();

  const permitted = useMemo(() => countPermitted(scopes), [scopes]);
  const restricted = useMemo(() => countRestricted(scopes), [scopes]);
  const total = CONSENT_RESOURCE_TYPES.length;

  const permittedLabels = useMemo(
    () => CONSENT_RESOURCE_TYPES.filter((t) => scopes[t]).map((t) => CONSENT_RESOURCE_META[t].title),
    [scopes],
  );

  const setType = useCallback((t: ConsentResourceType, value: boolean) => {
    setScopes((s) => ({ ...s, [t]: value }));
  }, []);

  const resetAllPermitted = useCallback(() => {
    setScopes(
      Object.fromEntries(CONSENT_RESOURCE_TYPES.map((t) => [t, true])) as Record<
        ConsentResourceType,
        boolean
      >,
    );
    showToast({ msg: "All resource types are now permitted (not saved until you click Save).", kind: "ok" });
  }, [showToast]);

  const handleSave = useCallback(async () => {
    saveConsentScopes(scopes);
    const at = loadConsentSavedAt();
    setLastSavedAt(at);
    let msg = "Consent preferences saved. Patient summary will reflect these choices.";
    if (user) {
      try {
        const token = localStorage.getItem("ihealth-auth-token-v1");
        const res = await fetch("/api/me/consent-scopes", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ scopes }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || "Could not sync consent to server");
        await refreshUser();
        msg += " Synced to your account (used for admin consent views).";
      } catch (e) {
        showToast({
          msg: e instanceof Error ? e.message : "Could not sync consent to server",
          kind: "err",
        });
        return;
      }
    }
    showToast({ msg, kind: "ok" });
  }, [scopes, showToast, user, refreshUser]);

  const dismissPending = useCallback(
    (id: string, approved: boolean) => {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast({
        msg: approved
          ? "Request approved (demo — not sent to a server)."
          : "Request denied (demo — not sent to a server).",
        kind: approved ? "ok" : "err",
      });
    },
    [showToast],
  );

  const pendingCount = pendingIds.size;

  return (
    <div className="consent-portal-app">
      <div className="cp-page">
        <header className="cp-page-header">
          <div className="cp-page-header-left">
            <div className="cp-eyebrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Consent portal
            </div>
            <h1 className="cp-page-title">Manage your data permissions</h1>
            <p className="cp-page-sub">
              Choose which FHIR resource types may appear in your patient record view. Changes apply after you
              save.
            </p>
          </div>
          <div className="cp-header-actions">
            <button type="button" className="cp-btn cp-btn-outline" onClick={() => setAuditOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Audit log
            </button>
            <button type="button" className="cp-btn cp-btn-primary" onClick={() => setExportOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export data
            </button>
          </div>
        </header>

        <div className="cp-summary-strip">
          <div className="cp-summary-card">
            <div className="cp-summary-icon cp-summary-icon--green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <div className="cp-summary-num">{permitted}</div>
              <div className="cp-summary-label">Permitted types</div>
            </div>
          </div>
          <div className="cp-summary-card">
            <div className="cp-summary-icon cp-summary-icon--amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <div className="cp-summary-num">{pendingCount}</div>
              <div className="cp-summary-label">Pending requests</div>
            </div>
          </div>
          <div className="cp-summary-card">
            <div className="cp-summary-icon cp-summary-icon--red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <div className="cp-summary-num">{restricted}</div>
              <div className="cp-summary-label">Restricted types</div>
            </div>
          </div>
          <div className="cp-summary-card">
            <div className="cp-summary-icon cp-summary-icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <div className="cp-summary-num">{DEMO_ACCESS_EVENTS}</div>
              <div className="cp-summary-label">Data access events (demo)</div>
            </div>
          </div>
        </div>

        <div className="cp-info-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="cp-info-banner-text">
            <strong>Preferences are stored in this browser only.</strong> Use &quot;Save&quot; to persist your
            choices. The patient summary view will only show sections for resource types you permit. Pending
            requests and access history below are <strong>illustrative</strong> for this demo.
          </div>
        </div>

        {/* Chunk 4: pending requests */}
        {PENDING_REQUESTS.some((p) => pendingIds.has(p.id)) && (
          <>
            <div className="cp-section-row">
              <div className="cp-section-icon cp-section-icon--amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="1.8">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <span className="cp-section-title">Pending requests</span>
              <div className="cp-section-line" />
              <span className="cp-badge cp-badge-amber cp-badge-inline">{pendingCount} awaiting review</span>
            </div>

            {PENDING_REQUESTS.filter((p) => pendingIds.has(p.id)).map((p) => (
              <div
                key={p.id}
                className={`cp-pending-card${p.variant === "purple" ? " cp-pending-card--purple" : ""}`}
              >
                <div className={`cp-pending-icon${p.variant === "purple" ? " cp-pending-icon--purple" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6M9 12h6M9 15h4" />
                  </svg>
                </div>
                <div className="cp-pending-body">
                  <div className="cp-pending-title">{p.title}</div>
                  <div className="cp-pending-sub">{p.sub}</div>
                  <div className="cp-pending-scope">
                    {p.scopes.map((s) => (
                      <span key={s} className="cp-pending-scope-tag">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="cp-pending-actions">
                    <button
                      type="button"
                      className="cp-btn cp-btn-success cp-btn-sm"
                      onClick={() => dismissPending(p.id, true)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="cp-btn cp-btn-danger cp-btn-sm"
                      onClick={() => dismissPending(p.id, false)}
                    >
                      Deny
                    </button>
                    {p.id === "p1" && (
                      <button
                        type="button"
                        className="cp-btn cp-btn-outline cp-btn-sm"
                        onClick={() => setDetailOpen("p1")}
                      >
                        View details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Chunk 4: active selection snapshot */}
        <div className="cp-section-row">
          <div className="cp-section-icon cp-section-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <span className="cp-section-title">Your portal selection</span>
          <div className="cp-section-line" />
        </div>

        <div className="cp-active-card">
          <div className="cp-active-card-head">
            <span className="cp-badge cp-badge-green">
              <span className="cp-badge-dot" />
              {permitted} of {total} types permitted
            </span>
            <span className="cp-active-saved">Last saved: {formatSavedAt(lastSavedAt)}</span>
          </div>
          <p className="cp-active-lead">
            Resource toggles below control the live patient summary. This summary lists permitted categories only.
          </p>
          <ul className="cp-active-list">
            {permittedLabels.slice(0, 8).map((label) => (
              <li key={label}>{label}</li>
            ))}
            {permittedLabels.length > 8 && <li>…and {permittedLabels.length - 8} more</li>}
            {permittedLabels.length === 0 && <li className="cp-active-empty">No types permitted — use toggles below.</li>}
          </ul>
        </div>

        <div className="cp-section-row">
          <div className="cp-section-icon cp-section-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <span className="cp-section-title">FHIR resource consent</span>
          <div className="cp-section-line" />
          <div className="cp-section-actions">
            <button type="button" className="cp-btn cp-btn-outline cp-btn-sm" onClick={resetAllPermitted}>
              Permit all
            </button>
            <button type="button" className="cp-btn cp-btn-primary cp-btn-sm" onClick={handleSave}>
              Save preferences
            </button>
          </div>
        </div>

        <p className="cp-resource-intro">
          Toggle each resource type. Restricted types are hidden from the{" "}
          <Link to="/patients">patient summary</Link> after you save.
        </p>

        <div className="cp-consent-grid">
          {CONSENT_RESOURCE_TYPES.map((t) => {
            const meta = CONSENT_RESOURCE_META[t];
            const on = scopes[t];
            return (
              <div key={t} className="cp-consent-card">
                <div className="cp-card-top">
                  <div className={`cp-card-top-icon ${on ? "cp-card-top-icon--on" : "cp-card-top-icon--off"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="cp-card-top-body">
                    <div className="cp-card-top-title">{meta.title}</div>
                    <div className="cp-card-top-sub">{meta.subtitle}</div>
                  </div>
                  <div className="cp-card-top-right">
                    <span className={`cp-badge ${on ? "cp-badge-green" : "cp-badge-red"}`}>
                      <span className="cp-badge-dot" />
                      {on ? "Permitted" : "Restricted"}
                    </span>
                    <label className="cp-toggle">
                      <input
                        type="checkbox"
                        className="cp-toggle-input"
                        checked={on}
                        onChange={(e) => setType(t, e.target.checked)}
                        aria-label={`Permit ${meta.title}`}
                      />
                      <span className="cp-toggle-ui">
                        <span className="cp-toggle-thumb" />
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cp-section-row">
          <div className="cp-section-icon cp-section-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <span className="cp-section-title">Resource access map</span>
          <div className="cp-section-line" />
        </div>

        <div className="cp-data-map">
          {CONSENT_RESOURCE_TYPES.map((t) => (
            <div
              key={t}
              className={`cp-data-map-item ${scopes[t] ? "cp-data-map-item--granted" : "cp-data-map-item--denied"}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                {scopes[t] ? (
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </>
                )}
              </svg>
              <span className="cp-data-map-label">{CONSENT_RESOURCE_META[t].title}</span>
            </div>
          ))}
        </div>

        {/* Chunk 4: access history table */}
        <div className="cp-section-row">
          <div className="cp-section-icon cp-section-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <span className="cp-section-title">Data access history (demo)</span>
          <div className="cp-section-line" />
        </div>

        <div className="cp-history-card">
          <div className="cp-history-scroll">
            <table className="cp-history-table">
              <thead>
                <tr>
                  <th>Accessor</th>
                  <th>Resources accessed</th>
                  <th>Purpose</th>
                  <th>Date &amp; time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ACCESS_HISTORY_ROWS.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div className="cp-requester-cell">
                        <div className="cp-requester-avatar" style={{ background: row.grad }}>
                          {row.initials}
                        </div>
                        <div>
                          <div className="cp-requester-name">{row.who}</div>
                          <div className="cp-requester-org">{row.org}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cp-scope-tags">
                        {row.scopes.map((s) => (
                          <span key={s} className="cp-scope-tag">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{row.purpose}</td>
                    <td>{row.when}</td>
                    <td>
                      {row.status === "ok" ? (
                        <span className="cp-badge cp-badge-green">Permitted</span>
                      ) : (
                        <span className="cp-badge cp-badge-red">Blocked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cp-footer-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            Consent choices here control how data is shown in this application. In production, decisions would be
            logged as FHIR <code>Consent</code> resources and audited under applicable law (e.g. DPDP Act 2023).
            Revoking display consent in this demo does not delete server data. Connect to your identity provider and
            FHIR Consent store for a full solution.
          </div>
        </div>
      </div>

      {detailOpen === "p1" && (
        <div
          className="cp-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Request details"
          onClick={(e) => e.target === e.currentTarget && setDetailOpen(null)}
        >
          <div className="cp-modal">
            <div className="cp-modal-header">
              <h2 className="cp-modal-title">Research access request</h2>
              <button type="button" className="cp-modal-close" onClick={() => setDetailOpen(null)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="cp-modal-body">
              <p className="cp-modal-lead">
                This request is for participation in the <strong>CARDIOFIT-2026</strong> observational study. No
                interventions are involved. Demo only — not a real study enrollment.
              </p>
              <p className="cp-modal-scope-heading">Resources requested</p>
              <ul className="cp-modal-detail-list">
                <li>Observation — vitals and lab values</li>
                <li>DiagnosticReport — ECG, lipid panel</li>
                <li>Condition — active diagnoses</li>
                <li>MedicationRequest — active prescriptions</li>
              </ul>
            </div>
            <div className="cp-modal-footer">
              <button type="button" className="cp-btn cp-btn-outline" onClick={() => setDetailOpen(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {auditOpen && (
        <div
          className="cp-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Audit log"
          onClick={(e) => e.target === e.currentTarget && setAuditOpen(false)}
        >
          <div className="cp-modal cp-modal--wide">
            <div className="cp-modal-header">
              <h2 className="cp-modal-title">Consent audit log</h2>
              <button type="button" className="cp-modal-close" onClick={() => setAuditOpen(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="cp-modal-body cp-modal-body--flush">
              <div className="cp-audit-timeline">
                <div className="cp-audit-entry">
                  <div className="cp-audit-dot-col">
                    <div className="cp-audit-dot" style={{ background: "#3b6d11" }} />
                    <div className="cp-audit-line" />
                  </div>
                  <div>
                    <div className="cp-audit-action">Preferences saved (browser storage)</div>
                    <div className="cp-audit-meta">Updates patient summary visibility · {formatSavedAt(lastSavedAt)}</div>
                  </div>
                </div>
                <div className="cp-audit-entry">
                  <div className="cp-audit-dot-col">
                    <div className="cp-audit-dot" style={{ background: "#854f0b" }} />
                    <div className="cp-audit-line" />
                  </div>
                  <div>
                    <div className="cp-audit-action">Pending request received (demo)</div>
                    <div className="cp-audit-meta">Illustrative · not sent to a backend</div>
                  </div>
                </div>
                <div className="cp-audit-entry">
                  <div className="cp-audit-dot-col">
                    <div className="cp-audit-dot" style={{ background: "#185fa5" }} />
                    <div className="cp-audit-line" />
                  </div>
                  <div>
                    <div className="cp-audit-action">Consent portal opened</div>
                    <div className="cp-audit-meta">This browser session</div>
                  </div>
                </div>
                <div className="cp-audit-entry">
                  <div className="cp-audit-dot-col">
                    <div className="cp-audit-dot" style={{ background: "#a32d2d" }} />
                  </div>
                  <div>
                    <div className="cp-audit-action">Access blocked (example)</div>
                    <div className="cp-audit-meta">When consent does not cover a requested resource type</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="cp-modal-footer">
              <button type="button" className="cp-btn cp-btn-primary" onClick={() => setAuditOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {exportOpen && (
        <div
          className="cp-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Export data"
          onClick={(e) => e.target === e.currentTarget && setExportOpen(false)}
        >
          <div className="cp-modal cp-modal--narrow">
            <div className="cp-modal-header">
              <h2 className="cp-modal-title">Export your data</h2>
              <button type="button" className="cp-modal-close" onClick={() => setExportOpen(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="cp-modal-body">
              <p className="cp-modal-lead">
                Choose a format. FHIR export uses the same bundle as the patient summary screen.
              </p>
              <div className="cp-export-options" role="radiogroup" aria-label="Export format">
                <label className={`cp-export-option ${exportFmt === "fhir" ? "cp-export-option--selected" : ""}`}>
                  <input
                    type="radio"
                    name="exportfmt"
                    checked={exportFmt === "fhir"}
                    onChange={() => setExportFmt("fhir")}
                  />
                  <div>
                    <div className="cp-export-option-title">FHIR Bundle (JSON)</div>
                    <div className="cp-export-option-sub">Machine-readable · open from Patient Directory → View → FHIR bundle</div>
                  </div>
                </label>
                <label className={`cp-export-option ${exportFmt === "pdf" ? "cp-export-option--selected" : ""}`}>
                  <input
                    type="radio"
                    name="exportfmt"
                    checked={exportFmt === "pdf"}
                    onChange={() => setExportFmt("pdf")}
                  />
                  <div>
                    <div className="cp-export-option-title">PDF summary report</div>
                    <div className="cp-export-option-sub">Not implemented in this demo</div>
                  </div>
                </label>
              </div>
            </div>
            <div className="cp-modal-footer">
              <button type="button" className="cp-btn cp-btn-outline" onClick={() => setExportOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="cp-btn cp-btn-primary"
                onClick={() => {
                  setExportOpen(false);
                  if (exportFmt === "fhir") {
                    showToast({ msg: "Open a patient from the directory, then use “FHIR bundle”.", kind: "ok" });
                  } else {
                    showToast({ msg: "PDF export is not available in this demo.", kind: "err" });
                  }
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`cp-toast cp-toast--${toast.kind}`} role="status">
          {toast.kind === "ok" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
