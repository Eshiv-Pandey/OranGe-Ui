import { defineConfig } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

// Keep Chromium and Playwright temporary files on the workspace drive.
const temp = path.resolve("out/iteration/auth-expansion/tmp");
mkdirSync(temp, { recursive: true });
process.env.TEMP = temp;
process.env.TMP = temp;

export default defineConfig({
  testDir: "./tests",
  testMatch: /auth-expansion\.spec\.ts$/,
  outputDir: "out/iteration/auth-expansion/playwright-results",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "out/iteration/auth-expansion/playwright-report", open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3140",
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
});
