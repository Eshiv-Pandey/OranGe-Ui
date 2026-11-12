import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: /sections\.spec\.ts$/,
  outputDir: "out/section-expansion/test-results", workers: 1,
  timeout: 900000, expect: { timeout: 15000 },
  reporter: [["list"], ["json", { outputFile: "out/section-expansion/browser-report.json" }]],
  use: { baseURL: process.env.SECTIONS_URL ?? "http://127.0.0.1:3162", browserName: "chromium", viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", trace: "off" },
});
