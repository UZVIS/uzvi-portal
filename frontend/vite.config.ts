import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
// NOTE: added the /utilization and /expenses proxy entries below (M1 and
// M4). Their backend routers are mounted without an /api prefix
// (prefix="/utilization", prefix="/expenses" in router.py), unlike the
// directory/teams/documents/onboarding routes which live under /api/v1/...
// and go through the existing /api rule + apiGet/apiPost in src/api/client.ts.
// Worth a team decision on whether M1/M4 should move under /api too for
// consistency - flagging rather than changing router.py unilaterally.
//
// /receipts is also added below - this serves uploaded expense receipt
// files (FR-EXP-01), mounted via StaticFiles in main.py, separate from
// the /expenses API router itself.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import tailwindcss from "@tailwindcss/vite";

  // https://vite.dev/config/
  export default defineConfig({
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
        "/health": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
        "/utilization": {
          target: "http://localhost:8000",
          "/utilization": {
            target: "http://127.0.0.1:8000",
            changeOrigin: true,
          },
          "/expenses": {
            target: "http://localhost:8000",
            "/expenses": {
              target: "http://127.0.0.1:8000",
              changeOrigin: true,
            },
            "/receipts": {
              target: "http://localhost:8000",
              "/receipts": {
                target: "http://127.0.0.1:8000",
                changeOrigin: true,
              },
            },
          },
        });