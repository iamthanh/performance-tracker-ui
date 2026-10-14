/// <reference types="vitest" />
import { hostname } from "node:os";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The backend (`fitness-hub serve-api`) listens on 127.0.0.1:8801. Proxying /api keeps the
// browser on one origin; the proxy passes the browser's Host and Origin on, so for the local
// network (`npm run dev:lan`) the API must run in LAN mode too (`serve-api --host 0.0.0.0`).
const API_TARGET = process.env.FITNESS_HUB_API ?? "http://127.0.0.1:8801";

// Vite answers IP addresses and localhost; other names must be listed (DNS-rebinding protection).
// This machine's name, bare and mDNS, matches what the API accepts; add more with UI_ALLOWED_HOSTS.
const machine = hostname().toLowerCase().split(".")[0]!;
const ALLOWED_HOSTS = [
  machine,
  `${machine}.local`,
  ...(process.env.UI_ALLOWED_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean),
];

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    allowedHosts: ALLOWED_HOSTS,
    proxy: { "/api": { target: API_TARGET } },
  },
  build: {
    rollupOptions: {
      output: {
        // Libraries change rarely: separate chunks stay cached across app updates.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
          charts: ["recharts"],
        },
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    allowedHosts: ALLOWED_HOSTS,
    proxy: { "/api": { target: API_TARGET } },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test-setup.ts"],
  },
});
