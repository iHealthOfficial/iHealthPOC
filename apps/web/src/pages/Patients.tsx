import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";

type PatientRow = {
  id: string;
  active: boolean;
  family: string | null;
  given: string;
  gender: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  _count: {
    observations: number;
    conditions: number;
    uploads: number;
    laboratories: number;
  };
};

type Filters = {
  active: "" | "true" | "false";
  family: string;
  gender: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  birthDateFrom: string;
  birthDateTo: string;
};

const emptyFilters: Filters = {
  active: "",
  family: "",
  gender: "",
  phone: "",
  email: "",
  addressLine: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  birthDateFrom: "",
  birthDateTo: "",
};

const SEARCH_FIELD_OPTIONS = [
  { value: "", label: "— Field search —" },
  { value: "family", label: "name.family (string)" },
  { value: "given", label: "name.given (JSON string)" },
  { value: "gender", label: "gender" },
  { value: "phone", label: "telecom phone" },
  { value: "email", label: "telecom email" },
  { value: "addressLine", label: "address.line" },
  { value: "city", label: "address.city" },
  { value: "state", label: "address.state" },
  { value: "postalCode", label: "address.postalCode" },
  { value: "country", label: "address.country" },
  { value: "active", label: "active (true/false/yes/no)" },
] as const;

function formatGiven(givenJson: string): string {
  try {
    const v = JSON.parse(givenJson) as unknown;
    return Array.isArray(v) ? v.join(", ") : givenJson;
  } catch {
    return givenJson;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function buildQueryString(f: Filters, sf: string, sv: string): string {
  const p = new URLSearchParams();
  if (f.active === "true" || f.active === "false") p.set("active", f.active);
  const strKeys: (keyof Filters)[] = [
    "family",
    "gender",
    "phone",
    "email",
    "addressLine",
    "city",
    "state",
    "postalCode",
    "country",
  ];
  for (const k of strKeys) {
    const v = f[k].trim();
    if (v) p.set(k, v);
  }
  if (f.birthDateFrom.trim()) p.set("birthDateFrom", f.birthDateFrom.trim());
  if (f.birthDateTo.trim()) p.set("birthDateTo", f.birthDateTo.trim());
  if (sf && sv.trim()) {
    p.set("searchField", sf);
    p.set("search", sv.trim());
  }
  const q = p.toString();
  return q ? `?${q}` : "";
}

export default function Patients() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [searchField, setSearchField] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [appliedSearchField, setAppliedSearchField] = useState("");
  const [appliedSearchValue, setAppliedSearchValue] = useState("");
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [fhirOpen, setFhirOpen] = useState(false);
  const [fhirJson, setFhirJson] = useState("");
  const [fhirLoading, setFhirLoading] = useState(false);

  const querySuffix = useMemo(
    () => buildQueryString(applied, appliedSearchField, appliedSearchValue),
    [applied, appliedSearchField, appliedSearchValue],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await api<PatientRow[]>(`/api/patients${querySuffix}`);
      setRows(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [querySuffix]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setApplied({ ...filters });
    setAppliedSearchField(searchField);
    setAppliedSearchValue(searchValue);
  }

  function clearAll() {
    setFilters(emptyFilters);
    setApplied(emptyFilters);
    setSearchField("");
    setSearchValue("");
    setAppliedSearchField("");
    setAppliedSearchValue("");
  }

  async function openFhirBundle(patientId: string) {
    setFhirOpen(true);
    setFhirJson("");
    setFhirLoading(true);
    try {
      const obj = await api<Record<string, unknown>>(`/api/patients/${patientId}/fhir`);
      setFhirJson(JSON.stringify(obj, null, 2));
    } catch (e) {
      setFhirJson(e instanceof Error ? e.message : "Failed to load FHIR bundle");
    } finally {
      setFhirLoading(false);
    }
  }

  const nonLabObs = (r: PatientRow) =>
    Math.max(0, r._count.observations - (r._count.laboratories ?? 0));

  return (
    <>
      <h1>Patient directory</h1>
      <p className="lead">
        FHIR-aligned columns (R4-style naming). Filters apply to all patient fields{" "}
        <strong>except identifiers</strong>. Use field search for a substring on one chosen field.
        <strong> Harmonized bundle</strong> opens a FHIR <code>Bundle</code> (Patient + Observations +
        Conditions + DocumentReferences for files).
      </p>

      {err && <div className="msg err">{err}</div>}

      <div className="card">
        <h2>Filters (identifiers excluded)</h2>
        <div className="filter-grid">
          <div className="field">
            <label>active</label>
            <select
              value={filters.active}
              onChange={(e) =>
                setFilters((f) => ({ ...f, active: e.target.value as Filters["active"] }))
              }
            >
              <option value="">Any</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
          <div className="field">
            <label>name.family</label>
            <input value={filters.family} onChange={(e) => setFilters((f) => ({ ...f, family: e.target.value }))} />
          </div>
          <div className="field">
            <label>gender</label>
            <input value={filters.gender} onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))} />
          </div>
          <div className="field">
            <label>birthDate from</label>
            <input
              type="date"
              value={filters.birthDateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, birthDateFrom: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>birthDate to</label>
            <input
              type="date"
              value={filters.birthDateTo}
              onChange={(e) => setFilters((f) => ({ ...f, birthDateTo: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>telecom phone</label>
            <input value={filters.phone} onChange={(e) => setFilters((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="field">
            <label>telecom email</label>
            <input value={filters.email} onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>address.line</label>
            <input
              value={filters.addressLine}
              onChange={(e) => setFilters((f) => ({ ...f, addressLine: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>address.city</label>
            <input value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div className="field">
            <label>address.state</label>
            <input value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))} />
          </div>
          <div className="field">
            <label>address.postalCode</label>
            <input
              value={filters.postalCode}
              onChange={(e) => setFilters((f) => ({ ...f, postalCode: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>address.country</label>
            <input
              value={filters.country}
              onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
            />
          </div>
        </div>
        <h2 style={{ marginTop: "1.25rem" }}>Search one field (substring)</h2>
        <div className="field-grid" style={{ alignItems: "end" }}>
          <div className="field">
            <label>Field</label>
            <select value={searchField} onChange={(e) => setSearchField(e.target.value)}>
              {SEARCH_FIELD_OPTIONS.map((o) => (
                <option key={o.value || "empty"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ gridColumn: "span 2" }}>
            <label>String</label>
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Substring match"
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={applyFilters}>
            Apply filters &amp; search
          </button>
          <button type="button" className="btn btn-ghost" onClick={clearAll}>
            Clear all
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <h2 style={{ padding: "1rem 1.25rem 0", margin: 0 }}>Patient list</h2>
        <p className="lead" style={{ padding: "0 1.25rem", marginBottom: "0.75rem", fontSize: "0.85rem" }}>
          {loading ? "Loading…" : `${rows.length} row(s)`}
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>active</th>
                <th>name.family</th>
                <th>name.given</th>
                <th>gender</th>
                <th>birthDate</th>
                <th>telecom</th>
                <th>address</th>
                <th>city / state / postal</th>
                <th>country</th>
                <th>Labs</th>
                <th>Obs (other)</th>
                <th>Cond</th>
                <th>Files</th>
                <th>Harmonized</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{String(r.active)}</td>
                    <td>{r.family ?? "—"}</td>
                    <td>{formatGiven(r.given)}</td>
                    <td>{r.gender ?? "—"}</td>
                    <td>{formatDate(r.birthDate)}</td>
                    <td className="cell-mono">
                      {[r.phone, r.email].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td>{r.addressLine ?? "—"}</td>
                    <td className="cell-mono">
                      {[r.city, r.state, r.postalCode].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td>{r.country ?? "—"}</td>
                    <td>{r._count.laboratories ?? 0}</td>
                    <td>{nonLabObs(r)}</td>
                    <td>{r._count.conditions}</td>
                    <td>{r._count.uploads}</td>
                    <td>
                      <button type="button" className="btn btn-ghost" onClick={() => void openFhirBundle(r.id)}>
                        FHIR Bundle
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {fhirOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="FHIR bundle">
          <div className="modal-panel">
            <div className="modal-head">
              <h2>FHIR Bundle (collection)</h2>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setFhirOpen(false);
                  setFhirJson("");
                }}
              >
                Close
              </button>
            </div>
            {fhirLoading ? (
              <p className="lead">Loading…</p>
            ) : (
              <textarea className="modal-json" readOnly value={fhirJson} spellCheck={false} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
