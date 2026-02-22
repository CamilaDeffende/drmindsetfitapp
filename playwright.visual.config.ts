import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  testMatch: ["**/*.spec.ts", "**/*.test.ts", "**/*.spec.tsx", "**/*.test.tsx"],

  // ✅ snapshots cross-platform (não usa -darwin/-linux/-win32)
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{-projectName}{-platform}{ext}",

  
  use: {
    // MF_VISUAL_HARDEN_V1
    baseURL: "http://localhost:8080",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },


  webServer: {
    command: "npm run dev -- --strictPort --port 8080",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
