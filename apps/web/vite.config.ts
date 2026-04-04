import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** GitLab Pages project sites use a subpath, e.g. /ihealth/. Set VITE_BASE in CI. */
const base = process.env.VITE_BASE?.trim() || "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});
