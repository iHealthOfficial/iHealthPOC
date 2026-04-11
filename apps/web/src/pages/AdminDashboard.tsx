import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { IconBell } from "../components/NavIcons";

type Summary = {
  patientCount: number;
  userCount: number;
  feedbackUnreadCount: number;
  recentEvents: {
    id: string;
    createdAt: string;
    action: string;
    detail: string;
    actorEmail: string | null;
    patientId: string | null;
    metaJson: string | null;
  }[];
};

export default function AdminDashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deletePatientId, setDeletePatientId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const s = await api<Summary>("/api/admin/summary");
      setData(s);
    } catch (e) {
      setData(null);
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function deletePatient() {
    const id = deletePatientId.trim();
    setDeleteMsg(null);
    if (!id) {
      setDeleteMsg({ type: "err", text: "Enter a patient UUID." });
      return;
    }
    if (deleteConfirm.trim() !== "DELETE") {
      setDeleteMsg({ type: "err", text: 'Type DELETE in the confirmation field to proceed.' });
      return;
    }
    setDeleteBusy(true);
    try {
      await api<{ ok: boolean; deletedId: string }>(`/api/admin/patients/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setDeleteMsg({ type: "ok", text: `Patient ${id} was permanently removed.` });
      setDeletePatientId("");
      setDeleteConfirm("");
      await load();
    } catch (e) {
      let msg = e instanceof Error ? e.message : "Delete failed";
      try {
        const j = JSON.parse(msg) as { error?: string };
        if (j.error) msg = j.error;
      } catch {
        /* plain text */
      }
      setDeleteMsg({ type: "err", text: msg });
    } finally {
      setDeleteBusy(false);
    }
  }

  const unread = data?.feedbackUnreadCount ?? 0;

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-inner">
        <div className="admin-dashboard-top">
          <h1 className="admin-dashboard-title">Admin dashboard</h1>
          <Link to="/admin/notifications" className="admin-dashboard-bell" aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}>
            <IconBell className="admin-dashboard-bell-icon" />
            {unread > 0 && (
              <span className="admin-dashboard-bell-badge">{unread > 99 ? "99+" : unread}</span>
            )}
          </Link>
        </div>
        <p className="admin-dashboard-lead">
          Overview of repository activity. Patient views for admins use merged consent from every user account
          linked to that patient (intersection of saved consent scopes).
        </p>

        {err && (
          <p className="admin-dashboard-err" role="alert">
            {err}
          </p>
        )}

        {data && (
          <>
            <div className="admin-stats">
              <div className="admin-stat-card">
                <div className="admin-stat-value">{data.patientCount}</div>
                <div className="admin-stat-label">Patients</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">{data.userCount}</div>
                <div className="admin-stat-label">Accounts</div>
              </div>
            </div>

            <h2 className="admin-section-title">Delete patient record</h2>
            <div className="admin-delete-panel">
              <p className="admin-dashboard-lead" style={{ marginBottom: "0.75rem" }}>
                Permanently removes the patient and all linked clinical data. User accounts keep their login but are
                unlinked from this patient. Upload files stay on disk with no patient link. This cannot be undone.
              </p>
              {deleteMsg && (
                <p
                  className={deleteMsg.type === "ok" ? "admin-dashboard-lead" : "admin-dashboard-err"}
                  role={deleteMsg.type === "err" ? "alert" : undefined}
                  style={{ marginBottom: "0.75rem" }}
                >
                  {deleteMsg.text}
                </p>
              )}
              <div className="admin-delete-fields">
                <label className="field" style={{ flex: "1 1 220px" }}>
                  <span className="admin-mono" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    Patient UUID
                  </span>
                  <input
                    className="admin-mono"
                    value={deletePatientId}
                    onChange={(e) => setDeletePatientId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
                <label className="field" style={{ flex: "0 1 140px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Type DELETE</span>
                  <input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
              </div>
              <button
                type="button"
                className="btn admin-delete-btn"
                disabled={deleteBusy}
                onClick={() => void deletePatient()}
              >
                {deleteBusy ? "Deleting…" : "Delete patient permanently"}
              </button>
            </div>

            <h2 className="admin-section-title">Recent activity</h2>
            <div className="table-scroll admin-table-wrap">
              <table className="data-table admin-activity-table">
                <thead>
                  <tr>
                    <th>When (UTC)</th>
                    <th>Action</th>
                    <th>Detail</th>
                    <th>Actor</th>
                    <th>Patient</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="admin-table-empty">
                        No events yet.
                      </td>
                    </tr>
                  ) : (
                    data.recentEvents.map((e) => (
                      <tr key={e.id}>
                        <td className="admin-mono">{e.createdAt.slice(0, 19).replace("T", " ")}</td>
                        <td>{e.action}</td>
                        <td>{e.detail}</td>
                        <td>{e.actorEmail ?? "—"}</td>
                        <td className="admin-mono">{e.patientId ? `${e.patientId.slice(0, 8)}…` : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
