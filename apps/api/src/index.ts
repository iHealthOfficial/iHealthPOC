import "./loadEnv.js";
import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import { ensureUploadsDir, webDistDir } from "./paths.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerManualRoutes } from "./routes/manual.js";
import { registerPatientRoutes } from "./routes/patients.js";
import { registerUploadRoutes } from "./routes/upload.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

ensureUploadsDir();

app.use(
  cors({
    origin: [/localhost:\d+$/, /^127\.0\.0\.1:\d+$/],
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ihealth-api" });
});

registerAuthRoutes(app);
registerManualRoutes(app);
registerPatientRoutes(app);
registerUploadRoutes(app);

/** Single-port app: serve the React SPA from apps/web/dist (same origin as /api/*). */
if (fs.existsSync(webDistDir)) {
  app.use(express.static(webDistDir, { index: ["index.html"] }));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    if (path.extname(req.path) !== "") return next();
    res.sendFile(path.join(webDistDir, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.type("html").send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>iHealth</title></head><body style="font-family:system-ui;max-width:40rem;margin:2rem auto;padding:0 1rem">
<h1>iHealth API is running</h1>
<p>The web UI is not built yet. From the repo root run:</p>
<pre style="background:#f4f4f4;padding:1rem">npm run build --workspace=@ihealth/web</pre>
<p>Then restart the server and open this URL again, or run everything with:</p>
<pre style="background:#f4f4f4;padding:1rem">npm run serve</pre>
<p><a href="/api/health">/api/health</a></p>
</body></html>`);
  });
}

app.listen(port, () => {
  const ui = fs.existsSync(webDistDir) ? ` + UI http://localhost:${port}` : "";
  console.log(`iHealth http://localhost:${port}${ui}`);
});
