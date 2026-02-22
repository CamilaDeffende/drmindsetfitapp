import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testDir: "./tests/visual",
  testMatch: /.*\.(spec|test)\.(ts|tsx|js)$/,
});
