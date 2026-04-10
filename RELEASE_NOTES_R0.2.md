# RELEASE_NOTES_R0.2

## Release version R0.2

## Highlights

R0.2 extends the manual **Patient** workflow with full **Organization** and **FamilyMemberHistory** capture, links **Encounter** rows to a **service provider** organization, and adds a read-only **Patient summary** experience with tabbed clinical navigation, per-section counts, and optional **FHIR JSON** export. A new **Consent portal** (browser-only `localStorage`) lets users toggle which FHIR resource types are permitted; the summary view **hides or zeroes** gated sections to match those choices.

**Navigation (site header)**

- **Manual Patient Entry** — expanded FHIR tab model (see below).
- **Patient Directory** — open a patient’s **summary** from the directory flow (`/patient/summary/:id`).
- **Consent Portal** — `/consent`; CareOS-style UI, resource toggles, save with **last-saved timestamp** (`savedAt` in stored JSON).

**Manual Patient Entry — main resource tabs (`MAIN_TABS`)**

| Tab | Purpose |
| --- | --- |
| Patient | Demographics and identifiers (incl. country, active, telecom, address). |
| Update existing | Load patient by UUID for edit / replace workflow (from R0.1; unchanged role in R0.2). |
| Practitioner | Practitioner rows + encounter context. |
| **Organization** | **New** — patient-scoped organizations; used as **Encounter service provider**. |
| Observation | Labs vs other observations grouping. |
| Diagnostic report | Report-level rows. |
| Condition | Onset / recorded fields. |
| Procedure | Procedure rows. |
| Allergy intolerance | Allergy rows. |
| **Family history** | **New** — `FamilyMemberHistory` with nested conditions and procedures. |
| Encounter | Encounters; **service provider** ties to an Organization row. |
| Insurance | Coverage (insurance) rows. |
| Medication & vaccine | **Sub-tabs:** MedicationRequest, MedicationAdministration, MedicationDispense, MedicationStatement, Medication (product), Immunization. |

**Patient summary — main tabs (`PS_MAIN_TABS`)**

- **Encounters** — encounter list (gated by consent **Encounter**).
- **Clinical overview** — observations, conditions, diagnostic reports, procedures, allergies (each gated by matching consent type).
- **Medications & vaccines** — **sub-tabs:** MedicationRequest, MedicationAdministration, MedicationDispense, MedicationStatement, Medication, Immunization (each gated by consent).
- **Insurance** — coverage rows (gated by **Coverage**).
- **Family history** — family history rows (gated by **FamilyMemberHistory**).

**Consent portal — `ConsentResourceType` (all gate the patient summary)**

These are the resource type keys stored under `ihealth-consent-scopes-v1` and honored in the summary:

- Encounter  
- Observation  
- Condition  
- DiagnosticReport  
- Procedure  
- AllergyIntolerance  
- MedicationRequest  
- MedicationAdministration  
- MedicationDispense  
- MedicationStatement  
- Medication  
- Immunization  
- Coverage  
- FamilyMemberHistory  

**Consent portal (chunk 4) — demo / UX**

- Summary strip: permitted, **pending** (mock requests, live count), restricted, fixed **data access events (demo)** count.
- Illustrative **pending requests** with Approve / Deny / View details (modal).
- **Your portal selection** card with permitted count, **last saved** time, and permitted resource titles.
- **Data access history** table (static demo rows), **Audit log** and **Export** modals (export format choice + toast; no server round-trip).

**API & database (high level)**

- **Organization** model (patient-scoped), ingest and FHIR export; **Encounter.serviceProvider** → Organization.
- **FamilyMemberHistory** model with **FamilyMemberHistoryCondition** and **FamilyMemberHistoryProcedure**; ingest, GET payload enrichment, FHIR export.
- Patient ingest / replace payloads extended for `organizations`, `familyMemberHistories`, and encounter `serviceProvider` selection.

ℹ️ **Upgrade / deploy procedure:** After pulling R0.2, apply database migrations from the API workspace (`npm run db:migrate --workspace=@ihealth/api` or equivalent `prisma migrate deploy` with `DATABASE_URL` set). Run **both** the API and the web app for local development (web proxies `/api` to the API). Consent data lives only in the browser; existing stored scopes remain valid, and new types default to **permitted** until the user changes them. If you use a frozen `node_modules`, run `prisma generate` in `apps/api` after install.

### Fixes and improvements

- **Web:** Exported **IconShield** for Consent Portal nav (build fix).
- **Web:** Patient summary **tab counts** and **consent-aware** tab lists; medication **sub-tab** parity with manual entry.
- **Web:** Manual entry **per-tab hover/active tint** styling for main and medication sub-tabs.
- **Web:** Consent portal **chunk 4** styling (`cp-*` classes), **savedAt** on save, TypeScript fix for pending-request ID set typing.
- **API (prior R0.2-related):** Database URL loading / monorepo cwd behavior for Prisma (developer ergonomics).

## New documentation

- **This file** — `RELEASE_NOTES_R0.2.md` (release narrative for R0.2).
- Existing **`RELEASE_NOTES_R0.1.md`** remains the reference for R0.1 (draft workflow, encounter linking, PUT replace, legacy encounter identifiers).

## Components changelog

Monorepo packages remain at **0.1.0**; R0.2 is a milestone on branch **`R0.2`**. There are no separate per-package `CHANGELOG.md` files in the repository; see commit history on the branch for detail.

- **[@ihealth/web@0.1.0](https://gitlab.com/ihealth_official-group/iHealthPOC/-/tree/R0.2/apps/web?ref_type=heads)** — Patient summary, consent portal, Organization & Family history manual entry, medication sub-tabs UI, styling and polish.
- **[@ihealth/api@0.1.0](https://gitlab.com/ihealth_official-group/iHealthPOC/-/tree/R0.2/apps/api?ref_type=heads)** — Organization and FamilyMemberHistory persistence, ingest, and FHIR export; encounter service provider linkage.

## CLI changelog

<!-- This project does not ship a standalone CLI in R0.2. The npm scripts under `apps/web` and `apps/api` (e.g. `dev`, `build`, `db:migrate`) are unchanged in purpose; see each workspace’s `package.json` on branch R0.2. -->

---

*Release R0.2 — patient summary, consent-scoped views, Organization & FamilyMemberHistory, encounter service provider, and consent portal polish.*
