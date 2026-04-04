import { useCallback, useState } from "react";
import { api } from "../api";

type UploadRow = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  patientId: string | null;
};

export default function Upload() {
  const [patientId, setPatientId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [recent, setRecent] = useState<UploadRow[]>([]);

  const refresh = useCallback(async () => {
    try {
      const rows = await api<UploadRow[]>("/api/uploads");
      setRecent(rows.slice(0, 8));
    } catch {
      /* ignore */
    }
  }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage(null);
    const fd = new FormData();
    fd.append("file", file);
    if (patientId.trim()) fd.append("patientId", patientId.trim());
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const row = (await res.json()) as UploadRow;
      setMessage({ type: "ok", text: `Stored as ${row.originalName} (${row.id})` });
      await refresh();
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <h1>Upload</h1>
      <p className="lead">
        Files are saved under the repo&apos;s <code>uploads/</code> folder. Optionally
        link to a patient id after you have created one.
      </p>

      {message && (
        <div className={`msg ${message.type === "ok" ? "ok" : "err"}`}>{message.text}</div>
      )}

      <div className="card">
        <h2>File</h2>
        <div className="field-grid">
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="pid">Patient ID (optional)</label>
            <input
              id="pid"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="uuid after patient entry"
            />
          </div>
          <div className="field">
            <label htmlFor="f">Choose file</label>
            <input id="f" type="file" disabled={busy} onChange={onFile} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Recent uploads</h2>
        <button type="button" className="btn btn-ghost" onClick={refresh} style={{ marginBottom: "1rem" }}>
          Refresh list
        </button>
        <div className="row-list">
          {recent.length === 0 && <p className="lead">No uploads yet.</p>}
          {recent.map((u) => (
            <div key={u.id} className="row-item">
              <div>
                <strong>{u.originalName}</strong>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {u.mimeType} · {(u.sizeBytes / 1024).toFixed(1)} KB
                </div>
                {u.patientId && (
                  <span className="tag" style={{ marginTop: "0.35rem" }}>
                    patient {u.patientId.slice(0, 8)}…
                  </span>
                )}
              </div>
              <a className="btn btn-ghost" href={`/api/uploads/${u.id}/file`} target="_blank" rel="noreferrer">
                Open
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
