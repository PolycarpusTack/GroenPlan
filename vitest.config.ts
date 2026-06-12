// Losgekoppeld van vite.config.ts zodat de zware server-middleware plugins
// (autofill-api, tuinontwerp-api, plantnet-api) nooit door test-workers worden geladen.
// pool: "threads" gebruikt Worker Threads — deelt geheugen met het hoofdproces
// waardoor de /@vite/env RPC niet meer kan time-outen bij een koude cache.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
    pool: "threads",
  },
});
