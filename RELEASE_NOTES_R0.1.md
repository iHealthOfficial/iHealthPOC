# Release notes — R0.1

Regular release notes for the iHealth POC manual patient entry and API.

---

## Patient entry (web)

1. **Draft workflow** — Save progress in the browser with **Save as draft** (localStorage); restore on return. Draft format version 2 includes edit mode fields.
2. **Tab navigation** — **Save and next** advances main tabs without posting to the server. No tab is required before moving on.
3. **Final save** — **Save patient & clinical data** (or **Update patient & clinical data** when editing) runs only from the **Medication & vaccine** tab; Enter on other tabs does not submit.
4. **Update existing patient** — New **Update existing** tab: enter patient UUID, **Load patient** to hydrate all sections from the server; **Clear loaded patient** returns to create-only flow.
5. **Encounter linking** — Optional **Encounter** dropdown on each clinical row (all main resource areas except Patient, Insurance, and the Encounter tab itself), including Practitioner and all medication sub-tabs. Indices match server ingest order for saved encounter rows.
6. **Legacy encounter identifiers** — On the **Encounter** tab, optional **Legacy identifier system** (URI) and **Legacy encounter identifier value** for source-system visit IDs; stored and exported to FHIR as `Encounter.identifier` (not auto-generated).
7. **UI** — Tab action bar (draft / next / final save), main-tab styling for **Update existing**, intro copy updated for draft and update flows.

---

## API & data model

1. **Ingest** — `POST /api/patients/ingest` refactored: encounters created after practitioners; optional `encounterIndex` on rows resolves to `encounterId`; practitioners may set `contextEncounterId` via `encounterIndex`.
2. **Patient replace** — `PUT /api/patients/:id` with the same JSON body as ingest: replaces all clinical child data for that patient, updates patient demographics, **does not** delete upload artifacts.
3. **Schema (SQLite / Prisma)** — Optional `encounterId` on clinical resources; `Practitioner.contextEncounterId`; `Encounter.legacyIdentifierSystem` and `Encounter.legacyIdentifierValue`. Migrations: encounter links, then legacy encounter identifier columns.
4. **FHIR export** — `encounter` / `context` references where appropriate; Medication (product) and Practitioner use extensions where the base resource has no native encounter field; Encounter includes `identifier` when legacy fields are set.

---

## Operations / developer notes

1. **Local dev** — Web (`apps/web`) proxies `/api` to the API on port **4000**; run **both** `npm run dev` in `apps/api` and `apps/web` (or rebuild `dist` if serving the SPA from the API).
2. **Database** — Apply migrations after pull: `npm run db:migrate --workspace=@ihealth/api` (or `prisma migrate deploy` from `apps/api`).

---

*Release R0.1 — manual patient entry, encounter context, legacy encounter IDs, draft UX, and full patient clinical replace.*
