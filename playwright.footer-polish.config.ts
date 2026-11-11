import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests", testMatch: /footer-polish\.spec\.ts$/,
  outputDir: "out/footer-polish/test-results", workers: 1,
  timeout: 900000, expect: { timeout: 15000 },
  reporter: [["list"], ["json", { outputFile: "out/footer-polish/browser-report.json" }]],
  use: { baseURL: process.env.FOOTER_POLISH_URL ?? "http://127.0.0.1:3150", browserName: "chromium", viewport: {width:1440,height:1000}, reducedMotion: "reduce", trace: "retain-on-failure" },
});
