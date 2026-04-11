import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type FeedbackItem = {
  id: string;
  createdAt: string;
  kind: string;
  title: string;
  description: string;
  readAt: string | null;
  user: { id: string; email: string; displayName: string | null };
};

export default function AdminNotifications() {
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markAllBusy, setMarkAllBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const data = await api<{ items: FeedbackItem[] }>("/api/admin/feedback");
      setItems(data.items);
    } catch (e) {
      setItems(null);
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    setBusyId(id);
    setErr(null);
    try {
      await api(`/api/admin/feedback/${encodeURIComponent(id)}/read`, { method: "PATCH" });
      setItems((prev) =>
        prev?.map((it) =>
          it.id === id ? { ...it, readAt: new Date().toISOString() } : it,
        ) ?? null,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    setMarkAllBusy(true);
    setErr(null);
    try {
      await api("/api/admin/feedback/mark-all-read", { method: "POST" });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update");
    } finally {
      setMarkAllBusy(false);
    }
  }

  const unread = items?.filter((i) => !i.readAt).length ?? 0;

  return (
    <div className="admin-notifications-page">
      <div className="admin-notifications-inner">
        <p className="admin-notifications-back">
          <Link to="/admin">← Admin dashboard</Link>
        </p>
        <div className="admin-notifications-header">
          <h1 className="admin-notifications-title">Notifications</h1>
          {items && items.length > 0 && unread > 0 && (
            <button type="button" className="btn btn-ghost admin-notifications-markall" disabled={markAllBusy} onClick={() => void markAllRead()}>
              {markAllBusy ? "Updating…" : "Mark all as read"}
            </button>
          )}
        </div>
        <p className="admin-notifications-lead">Bug reports and suggestions submitted by users.</p>

        {err && (
          <p className="admin-dashboard-err" role="alert">
            {err}
          </p>
        )}

        {items && items.length === 0 && <p className="admin-notifications-empty">No feedback yet.</p>}

        {items && items.length > 0 && (
          <ul className="admin-notifications-list">
            {items.map((it) => {
              const isUnread = !it.readAt;
              const label = it.kind === "bug" ? "Bug" : "Suggestion";
              return (
                <li key={it.id} className={`admin-notifications-card${isUnread ? " admin-notifications-card--unread" : ""}`}>
                  <div className="admin-notifications-card-head">
                    <span className={`admin-notifications-kind admin-notifications-kind--${it.kind}`}>{label}</span>
                    <time className="admin-notifications-time" dateTime={it.createdAt}>
                      {new Date(it.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </div>
                  <h2 className="admin-notifications-item-title">{it.title}</h2>
                  <p className="admin-notifications-meta">
                    From {it.user.displayName ? `${it.user.displayName} · ` : ""}
                    <span className="admin-mono">{it.user.email}</span>
                  </p>
                  <p className="admin-notifications-body">{it.description}</p>
                  {isUnread && (
                    <button
                      type="button"
                      className="btn admin-notifications-readbtn"
                      disabled={busyId === it.id}
                      onClick={() => void markRead(it.id)}
                    >
                      {busyId === it.id ? "…" : "Mark as read"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
