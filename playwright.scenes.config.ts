import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: /scenes\.spec\.ts$/, outputDir: "out/scenes/results", workers: 1,
  timeout: 90000, expect: { timeout: 15000 },
  reporter: [["list"], ["json", { outputFile: "out/scenes/browser-report.json" }]],
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3112", browserName: "chromium", trace: "retain-on-failure" },
});
