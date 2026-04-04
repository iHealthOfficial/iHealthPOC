import { useEffect, useState } from "react";
import { api } from "../api";

type Manifest = {
  title: string;
  pages: { id: string; title: string; file: string }[];
};

export default function Manual() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [html, setHtml] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await api<Manifest>("/api/manual/manifest");
        if (cancelled) return;
        setManifest(m);
        if (m.pages[0]) setActive(m.pages[0].id);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load manual");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/manual/section/${active}`);
        const text = await res.text();
        if (!cancelled) {
          if (!res.ok) setErr(text);
          else {
            setErr(null);
            setHtml(text);
          }
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Load error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  if (err && !manifest) {
    return (
      <>
        <h1>Manual</h1>
        <div className="msg err">{err}</div>
      </>
    );
  }

  if (!manifest) {
    return (
      <>
        <h1>Manual</h1>
        <p className="lead">Loading…</p>
      </>
    );
  }

  return (
    <>
      <h1>{manifest.title}</h1>
      <p className="lead">
        Content lives in the Git repo under <code>manual/</code>. The API serves these
        pages; edit HTML, commit, and push to update what you see here.
      </p>
      {err && <div className="msg err">{err}</div>}
      <div className="manual-layout">
        <nav aria-label="Manual sections">
          <ul className="manual-toc">
            {manifest.pages.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={active === p.id ? "active" : undefined}
                  onClick={() => setActive(p.id)}
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <article
          className="manual-body card"
          style={{ marginBottom: 0 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </>
  );
}
