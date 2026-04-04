# iHealth POC

Internal platform proof of concept: keep track of medical documents, support digitization, and align data with FHIR-style resources for family history and health workflows.

---

Local-first healthcare ingestion: **uploads**, **manual patient entry** (FHIR-aligned resources), and a **product manual** served by the backend from the `manual/` folder in this repository.

## Stack (cost: $0 locally)

- **Backend:** Node.js, Express, Prisma, **SQLite** (file database), local disk **uploads/** — optional **ClamAV** (`clamscan`) for malware scan; **Tesseract.js** (images) + **pdf-parse** (PDF text layer) for local OCR / text extraction (see [docs/LOCAL_SCAN_OCR.md](docs/LOCAL_SCAN_OCR.md))
- **Frontend:** React, TypeScript, Vite — **production build is served by Express** on the **same port** (default **4000**)
- **Manual:** HTML pages under `manual/`; metadata in `manual/manifest.json`; API exposes them to the React app

## FHIR-oriented data model

| Table / concept | FHIR `ResourceType` |
|-----------------|---------------------|
| `Patient` | Patient |
| `Observation` with `category = laboratory` | Observation (labs) |
| `Observation` with other categories | Observation |
| `Condition` | Condition (diagnosis) |

## Next step: run the app (one server)

You only need **Node.js 20+** installed. There are no separate “frontend” and “backend” processes for daily use—the **API and the React UI share http://localhost:4000**.

### First-time setup

```bash
cd iHealth
npm install
npm run db:migrate
```

`prisma` is **not** a global command. Use **`npm run db:migrate`** from the repo root (or `npx prisma migrate deploy` **after** `cd apps/api`). If you see **Unknown command: "prisma"**, you either skipped `npm install` or typed `prisma` by itself in the shell.

Optional: copy `apps/api/.env.example` to `apps/api/.env` if you want to change `PORT` or `DATABASE_URL`.

### Start (builds the web app, then starts Express + UI)

```bash
npm run serve
```

Open **http://localhost:4000** — you should see the iHealth UI. API routes stay under **`/api/*`** (e.g. **http://localhost:4000/api/health**).

If you only run `npm run dev --workspace=@ihealth/api` **without** building the frontend first, you will see a short HTML page explaining how to build the UI—that is expected.

### Production-style run (compiled API)

```bash
npm run start
```

### Optional: Vite dev server (hot reload for frontend only)

If you are actively editing React and want instant reload, you can still run the web app on port 5173 (with API proxy) in a **second** terminal:

```bash
npm run dev --workspace=@ihealth/web
```

Use **http://localhost:5173** in that mode; the default workflow above does **not** require this.

### Git remote (GitLab example)

```bash
cd iHealth
git remote add gitlab <your-gitlab-repo-url>
git push -u gitlab main
```

After push, GitLab runs **install → lint → build** (and **Pages** deploy on the default branch) from [.gitlab-ci.yml](.gitlab-ci.yml). Step-by-step push, CI, and hosting: [docs/GITLAB_CICD.md](docs/GITLAB_CICD.md).

## GitLab

1. Create a project on GitLab and add this folder as the repository root.
2. Push `main` (or your default branch); `.gitlab-ci.yml` runs **install → lint → build**.
3. Edit files under `manual/` and push; the **Manual** section in the app reflects those changes after deploy or local restart (no DB storage for manual content).

## Production notes

SQLite and local folders are for **development / POC** only. For production, switch Prisma to PostgreSQL and `uploads` to object storage; keep the same API shapes. Serve `apps/web/dist` via Express or any static host, with `/api` routed to your API.
