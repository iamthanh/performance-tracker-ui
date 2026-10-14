/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The backend (`fitness-hub serve-api`) listens on 127.0.0.1:8801. Proxying /api keeps the
// browser on one origin; the API accepts the dev server's Host (localhost) and Origin.
const API_TARGET = process.env.FITNESS_HUB_API ?? "http://127.0.0.1:8801";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
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
    proxy: { "/api": { target: API_TARGET } },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test-setup.ts"],
  },
});
