# RELEASE_NOTES_R0.3

## Release version R0.3

## Highlights

R0.3 introduces **authenticated access** with **JWT-based sessions**, **role-aware navigation** (patient-facing vs staff vs admin), and a full **Admin** area: dashboard with repository stats and recent activity, **consent-filtered** patient inspection for linked accounts, **activity log** and **patient journey timeline**, and **feedback** triage with unread notifications. **My health data** lets signed-in users link a **patient UUID** to view their record under saved consent scopes. **Feedback** (bugs and suggestions) is stored server-side with an admin list API. The **Patient Directory** is aligned with the **Upload / About** visual shell, shows each row’s **patient UUID**, and staff flows remain behind **RequireStaff** / **RequireAdmin** guards. Admins can **permanently delete a patient record** via a guarded **DELETE** API and dashboard control (with typed **DELETE** confirmation). The **platform how-to** guide and **Upload** page share unified styling; optional **Prisma seed** can provision a demo admin user from environment variables.

**Navigation (site header)**

- **Overview** — marketing / hub landing at `/home` (role-based entry from `/` unchanged in purpose).
- **Upload** — same document pipeline; styling matches the platform guide shell.
- **My health data** — authenticated; link patient UUID, consent-scoped content, help tab (admin).
- **Feedback** — authenticated; submit bug/suggestion reports.
- **Patient Directory** — staff; directory table includes **Patient UUID**; summary links unchanged.
- **Manual Patient Entry** — staff; existing manual entry workflow.
- **Consent Portal** — browser-stored scopes (R0.2 behavior retained).
- **About the Platform** — static manual / platform guide styling alignment.
- **Admin** — admins only; dashboard, notifications (feedback unread), **delete patient** panel, links to deeper admin views where present.

**Authentication & roles**

- **Login** at `/login`; JWT stored for API calls (`Authorization: Bearer`).
- **Roles** drive **RequireAuth**, **RequireStaff**, **RequireAdmin** route guards and tab visibility.

**Admin (high level)**

- Summary: patient count, user count, **feedback unread** count, recent **activity** table.
- **Patient delete:** `DELETE /api/admin/patients/:id` — removes patient and cascaded clinical data; unlinks user accounts; uploads remain on disk with patient link cleared; audit event **admin_patient_delete** recorded after deletion.
- Consent-filtered patient payload and **activity** / **journey** endpoints (see API) for admin review.

**Feedback**

- Users POST **FeedbackReport** rows; admins GET list and mark read; bell badge on admin for unread count.

**API & database (high level)**

- **User** authentication fields (from prior migrations on this branch), **linkedPatientId**, consent JSON; **ActivityEvent**; **FeedbackReport** with optional patient link.
- Run **all** migrations through R0.3 when upgrading; seed optional via `apps/api` env-driven admin user.

ℹ️ **Upgrade / deploy procedure:** After pulling R0.3, apply database migrations from the API workspace (`npm run db:migrate --workspace=@ihealth/api` or `prisma migrate deploy` from `apps/api` with `DATABASE_URL` set). Configure **`JWT_SECRET`** (and related auth env vars) for the API. Set **`VITE_API_URL`** on the hosted web build so the static UI reaches your API. Run **both** API and web for local development (web proxies `/api` to the API in dev). Consent data remains browser **localStorage** from R0.2. If you use a frozen `node_modules`, run `npx prisma generate` in `apps/api` after install. **GitLab Pages** (see `.gitlab-ci.yml`) publishes the **web** build on pushes to the **default branch** only; merge R0.3 to `main` (or your default branch) to refresh hosted static assets. Backend hosting is separate unless you add a deploy job.

### Fixes and improvements

- **Web:** Patient Directory **flush** main layout and **guide** shell parity with Upload/About; **UUID** column on the directory table.
- **Web:** Feedback nav **hover** styling aligned with the feedback page.
- **Web:** Entry route and **overview** path cleanup; **login** page without stray platform overview link.
- **Web:** **My health** — validation and patient UUID input normalization.
- **Web:** **Vite** dev server may listen on **LAN** (`host: true`) for mobile testing.
- **API:** Optional **Prisma seed** for admin credentials via env.
- **Docs:** **Cloudflare tunnel** cold-start notes (`docs/Cloudflare-setup-IG.md`).

## New documentation

- **This file** — `RELEASE_NOTES_R0.3.md` (release narrative for R0.3).
- **`docs/Cloudflare-setup-IG.md`** — tunnel / cold-start guidance (where present on branch).
- **`RELEASE_NOTES_R0.2.md`** — prior milestone (patient summary, consent portal, Organization & FamilyMemberHistory).

## Components changelog

Monorepo packages remain at **0.1.0**; R0.3 is a milestone on branch **`R0.3`**. There are no separate per-package `CHANGELOG.md` files in the repository; see commit history on the branch for detail.

- **[@ihealth/web@0.1.0](https://gitlab.com/ihealth_official-group/iHealthPOC/-/tree/R0.3/apps/web?ref_type=heads)** — Auth shell, admin dashboard, feedback, My health, Patient Directory styling and UUID column, unified Upload/About/guide styling, role-based nav.
- **[@ihealth/api@0.1.0](https://gitlab.com/ihealth_official-group/iHealthPOC/-/tree/R0.3/apps/api?ref_type=heads)** — JWT auth, users, linked patient, activity events, feedback reports, admin routes including patient delete, consent-filtered admin patient access.

## CLI changelog

<!-- This project does not ship a standalone CLI in R0.3. The npm scripts under `apps/web` and `apps/api` (e.g. `dev`, `build`, `db:migrate`, seed) follow each workspace’s `package.json` on branch R0.3. -->

---

*Release R0.3 — authentication, admin dashboard and patient delete, feedback, My health linking, Patient Directory polish, and unified platform styling.*
