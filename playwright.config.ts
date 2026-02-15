import { defineConfig } from "@playwright/test";

export default defineConfig({
  // MF_CI_TRACE_ELITE_V1
  ...(process.env.CI ? {
    use: {
      trace: "retain-on-failure",
      screenshot: "only-on-failure",
      video: "retain-on-failure",
    },
  } : {}),

  // MF_CI_FORCE_CHROMIUM_V1
  ...(process.env.CI ? { projects: [{ name: "chromium", use: { browserName: "chromium" } }] } : {}),

  testDir: "tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:8080",
    headless: true,
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // MF_PW_WEBSERVER_V1 — Playwright sobe o Vite automaticamente (porta 8080)
  webServer: {
    command: "npm run dev -- --strictPort --port 8080",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },

});
