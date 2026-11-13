import { defineConfig } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const temp = path.resolve("out/iteration/footer-expansion/tmp");
mkdirSync(temp, { recursive: true });
process.env.TEMP = temp;
process.env.TMP = temp;

export default defineConfig({
  testDir: "./tests", testMatch: /footer-expansion\.spec\.ts$/,
  outputDir: "out/iteration/footer-expansion/playwright-results",
  timeout: 150000, expect: { timeout: 12000 }, workers: 1, fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "out/iteration/footer-expansion/browser-report.json" }]],
  use: { baseURL: "http://127.0.0.1:3140", browserName: "chromium", viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", trace: "retain-on-failure" },
});
