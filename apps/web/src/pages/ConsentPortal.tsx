import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CONSENT_RESOURCE_META,
  CONSENT_RESOURCE_TYPES,
  type ConsentResourceType,
} from "../consent/consentTypes";
import {
  countPermitted,
  countRestricted,
  loadConsentScopes,
  saveConsentScopes,
} from "../consent/consentStorage";

function useToast() {
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);
  return { toast, showToast: setToast };
}

export default function ConsentPortal() {
  const [scopes, setScopes] = useState<Record<ConsentResourceType, boolean>>(loadConsentScopes);
  const [auditOpen, setAuditOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { toast, showToast } = useToast();

  const permitted = useMemo(() => countPermitted(scopes), [scopes]);
  const restricted = useMemo(() => countRestricted(scopes), [scopes]);
  const total = CONSENT_RESOURCE_TYPES.length;

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

  const handleSave = useCallback(() => {
    saveConsentScopes(scopes);
    showToast({ msg: "Consent preferences saved. Patient summary will reflect these choices.", kind: "ok" });
  }, [scopes, showToast]);

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
              <div className="cp-summary-num">0</div>
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
              <div className="cp-summary-num">{total}</div>
              <div className="cp-summary-label">Total resource types</div>
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
            choices. The patient summary view will only show sections for resource types you permit. This demo
            does not sync to a server.
          </div>
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

        <div className="cp-footer-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            Consent choices apply to how data is shown in this application. They do not replace legal{" "}
            <code>Consent</code> resources or institutional policies. For production use, connect this flow to your
            FHIR Consent store and identity provider.
          </div>
        </div>
      </div>

      {auditOpen && (
        <div
          className="cp-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Audit log"
          onClick={(e) => e.target === e.currentTarget && setAuditOpen(false)}
        >
          <div className="cp-modal">
            <div className="cp-modal-header">
              <h2 className="cp-modal-title">Consent audit log</h2>
              <button type="button" className="cp-modal-close" onClick={() => setAuditOpen(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="cp-modal-body">
              <p className="cp-modal-lead">
                A full audit trail would list each change with actor, time, and scope. This demo shows a static
                preview only.
              </p>
              <ul className="cp-audit-list">
                <li>Portal preferences updated (browser storage)</li>
                <li>Patient summary reflects saved consent scopes</li>
              </ul>
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
                Use <Link to="/patients">Patient Directory</Link> → <strong>View</strong> on a patient, then open{" "}
                <strong>FHIR bundle</strong> for a machine-readable export. PDF summary is not implemented in this
                demo.
              </p>
            </div>
            <div className="cp-modal-footer">
              <button type="button" className="cp-btn cp-btn-outline" onClick={() => setExportOpen(false)}>
                Cancel
              </button>
              <button type="button" className="cp-btn cp-btn-primary" onClick={() => setExportOpen(false)}>
                Done
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
