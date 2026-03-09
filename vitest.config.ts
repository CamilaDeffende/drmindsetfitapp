import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // MF_VITEST_SCOPE_UNIT_ONLY_V1
    environment: "node",
    globals: true,

    // ✅ Só unit tests dentro de src/
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "src/**/__tests__/**/*.{test,spec}.{ts,tsx}",
    ],

    // ❌ Excluir tudo que não é unit (Playwright/E2E/visual/backups/scan/ci scratch)
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{git,cache,temp,output}/**",

      // repositório: backups e scans nunca entram em teste unit
      "**/.backups/**",
      "**/.scan/**",
      "**/.mf_master/**",

      // Playwright & e2e
      "**/playwright/**",
      "**/tests/e2e/**",
      "**/tests/mf/**",
      "**/tests/visual/**",
      "**/tests/smoke.spec.ts",

      // padrões comuns e2e
      "**/*.e2e.{ts,tsx,js,jsx}",
      "**/*.pw.{ts,tsx,js,jsx}",
    ],
  },
});
