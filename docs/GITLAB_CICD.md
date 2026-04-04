# GitLab: push your code and use CI/CD

You (or anyone with access) must push from your machine—this repo cannot push to GitLab on your behalf.

## 1. Put the project on GitLab

1. On GitLab, create a **new blank project** (note the **HTTPS** or **SSH** clone URL).
2. On your PC, in the project folder:

```powershell
cd D:\iHealth
git init
git add .
git commit -m "Initial iHealth POC"
git branch -M main
git remote add origin https://gitlab.com/<your-group-or-user>/<your-project>.git
git push -u origin main
```

Use your real URL. For SSH, replace the `remote add` line with your SSH URL.

If GitLab shows existing files, use `git pull origin main --allow-unrelated-histories` once, resolve conflicts, then `git push`.

## 2. What CI/CD does on every push

The pipeline in [`.gitlab-ci.yml`](../.gitlab-ci.yml) runs on pushes and merge requests:

| Stage   | What it does |
|---------|----------------|
| **install** | `npm install` (workspaces) |
| **lint**    | Typecheck API + web |
| **build**   | Prisma generate, compile API, Vite build web |
| **deploy**  | On the **default branch** only: **GitLab Pages** job copies `apps/web/dist` → `public` |

Open **Build → Pipelines** in your GitLab project to see runs and logs.

## 3. See the frontend from GitLab (Pages)

After a successful pipeline on **`main`** (or whatever your default branch is):

1. Go to **Deploy → Pages** in the GitLab project.
2. GitLab shows the **Pages URL**, usually:

   `https://<namespace>.gitlab.io/<project-name>/`

The first deploy can take a minute after the pipeline finishes.

### If assets or routes 404

Set a CI/CD variable **`VITE_BASE_OVERRIDE`** to your exact site path (must start and end with `/`), e.g. `/ihealth/`, then run the pipeline again.

### If API calls fail on Pages

GitLab Pages only hosts **static files**. Your **Express + SQLite API does not run there**.

To use Patient entry / Upload against a real API you must either:

- Deploy the API somewhere public (Railway, Render, Fly.io, a VM, etc.) and set a CI/CD variable **`VITE_API_URL`** to that base URL (no trailing slash), **or**
- Keep using **http://localhost:4000** with `npm run serve` for full stack locally.

The web app reads `VITE_API_URL` at **build** time. After changing it in GitLab, trigger a new pipeline (e.g. empty commit or **Run pipeline**).

## 4. Local change → push → see updates

1. Edit code locally (e.g. `apps/web/src/...`).
2. Commit and push:

```powershell
git add .
git commit -m "Describe your change"
git push origin main
```

3. Wait for the pipeline on `main` to finish.
4. Refresh the **Pages** URL (hard refresh if needed).

That updates the **hosted** frontend. It does **not** deploy the backend unless you add a deploy job or separate hosting for the API.

## 5. Optional: personal access token (HTTPS push)

If GitLab asks for a password over HTTPS, use a **[Personal Access Token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)** with `write_repository` as the password.

## Summary

| Goal | How |
|------|-----|
| Run CI on push | Push to GitLab; `.gitlab-ci.yml` runs automatically |
| Hosted frontend | Default branch pipeline → **Pages** URL |
| Full app with API | Run `npm run serve` locally, **or** host API + set `VITE_API_URL` for Pages builds |
