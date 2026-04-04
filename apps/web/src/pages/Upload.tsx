import { useCallback, useState } from "react";
import { api } from "../api";

type UploadListRow = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  patientId: string | null;
  scanStatus: string;
  scanMessage: string | null;
  ocrStatus: string;
  ocrMessage: string | null;
};

type UploadDetail = UploadListRow & {
  ocrText: string | null;
  storagePath: string;
};

function statusClass(kind: "scan" | "ocr", value: string): string {
  if (kind === "scan") {
    if (value === "clean") return "tag tag-ok";
    if (value === "infected") return "tag tag-bad";
    if (value === "skipped") return "tag tag-warn";
    return "tag";
  }
  if (value === "done") return "tag tag-ok";
  if (value === "skipped") return "tag tag-warn";
  if (value === "error") return "tag tag-bad";
  return "tag";
}

export default function Upload() {
  const [patientId, setPatientId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [recent, setRecent] = useState<UploadListRow[]>([]);
  const [detail, setDetail] = useState<UploadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const rows = await api<UploadListRow[]>("/api/uploads");
      setRecent(rows.slice(0, 12));
    } catch {
      /* ignore */
    }
  }, []);

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const row = await api<UploadDetail>(`/api/uploads/${id}`);
      setDetail(row);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage(null);
    const fd = new FormData();
    fd.append("file", file);
    if (patientId.trim()) fd.append("patientId", patientId.trim());
    try {
      setMessage({ type: "ok", text: "Uploading — running local malware scan and OCR (may take a minute)…" });
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const row = (await res.json()) as UploadDetail;
      const scan = row.scanStatus ?? "pending";
      const ocr = row.ocrStatus ?? "pending";
      setMessage({
        type: row.scanStatus === "infected" ? "err" : "ok",
        text: `Saved ${row.originalName}. Scan: ${scan}. OCR: ${ocr}.`,
      });
      await refresh();
      await loadDetail(row.id);
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
        Files go to <code>uploads/</code>.         Each upload runs a <strong>local ClamAV</strong> scan when{" "}
        <code>clamscan</code> is installed, then <strong>local OCR / text extraction</strong>{" "}
        (Tesseract.js for images, embedded text for PDFs). No paid APIs.
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
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.4rem" }}>
                  <span className={statusClass("scan", u.scanStatus)} title={u.scanMessage ?? ""}>
                    scan: {u.scanStatus}
                  </span>
                  <span className={statusClass("ocr", u.ocrStatus)} title={u.ocrMessage ?? ""}>
                    ocr: {u.ocrStatus}
                  </span>
                </div>
                {u.patientId && (
                  <span className="tag" style={{ marginTop: "0.35rem", display: "inline-block" }}>
                    patient {u.patientId.slice(0, 8)}…
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => loadDetail(u.id)}>
                  Text / details
                </button>
                <a className="btn btn-ghost" href={`/api/uploads/${u.id}/file`} target="_blank" rel="noreferrer">
                  Open file
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(detail || detailLoading) && (
        <div className="card">
          <h2>Extracted text &amp; processing notes</h2>
          {detailLoading && <p className="lead">Loading…</p>}
          {detail && !detailLoading && (
            <>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                <span className={statusClass("scan", detail.scanStatus)}>scan: {detail.scanStatus}</span>{" "}
                <span className={statusClass("ocr", detail.ocrStatus)}>ocr: {detail.ocrStatus}</span>
              </p>
              {detail.scanMessage && (
                <p className="lead" style={{ marginBottom: "0.5rem" }}>
                  <strong>Scan:</strong> {detail.scanMessage}
                </p>
              )}
              {detail.ocrMessage && (
                <p className="lead" style={{ marginBottom: "0.75rem" }}>
                  <strong>OCR / parse:</strong> {detail.ocrMessage}
                </p>
              )}
              <label className="field" style={{ display: "block", marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)" }}>
                  Text (copy-friendly)
                </span>
                <textarea
                  readOnly
                  value={detail.ocrText ?? "(no text stored)"}
                  style={{ width: "100%", minHeight: "200px", marginTop: "0.35rem", fontFamily: "var(--mono)" }}
                />
              </label>
              <button type="button" className="btn btn-ghost" style={{ marginTop: "0.75rem" }} onClick={() => setDetail(null)}>
                Close panel
              </button>
            </>
          )}
        </div>
      )}

      <div className="card">
        <h2>Local setup tips</h2>
        <ul className="lead" style={{ margin: 0, paddingLeft: "1.25rem" }}>
          <li>
            <strong>ClamAV (optional):</strong> install so <code>clamscan</code> runs; on Windows, default path is
            tried. Otherwise scan shows <code>skipped</code>.
          </li>
          <li>
            <strong>Tesseract.js:</strong> first OCR run may download the English model (cached afterward). Works
            offline after cache.
          </li>
          <li>
            <strong>PDFs:</strong> only text inside the PDF is extracted; scanned PDFs need an image workflow (not
            included yet).
          </li>
        </ul>
      </div>
    </>
  );
}
