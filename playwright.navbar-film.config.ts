import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: /navbar-film\.spec\.ts$/, outputDir: "out/navbar-fixes/results",
  timeout: 120_000, expect: { timeout: 15_000 }, workers: 1,
  reporter: [["list"], ["json", { outputFile: "out/navbar-fixes/browser-report.json" }]],
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3110", browserName: "chromium", reducedMotion: "reduce", trace: "retain-on-failure" },
});
