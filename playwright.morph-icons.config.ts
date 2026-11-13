import { defineConfig } from "@playwright/test";

const evidence = process.env.MORPH_EVIDENCE_DIR ?? ".impeccable/review/morph-icons";
export default defineConfig({
  testDir: "./tests",
  testMatch: /morph-icons\.spec\.ts$/,
  outputDir: `${evidence}/test-results`,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: `${evidence}/browser-report.json` }]],
  use: { baseURL: process.env.MORPH_PREVIEW_URL ?? "http://127.0.0.1:3160", browserName: "chromium", reducedMotion: "no-preference", trace: "retain-on-failure" },
});
