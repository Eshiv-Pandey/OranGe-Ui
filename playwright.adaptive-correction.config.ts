import { defineConfig } from "@playwright/test";
import adaptive from "./playwright.adaptive.config";
export default defineConfig(adaptive, {
  testMatch: /adaptive(?:-correction)?\.spec\.ts$/,
  outputDir: ".impeccable/review/adaptive-correction/results",
  reporter: [["list"], ["json", { outputFile: ".impeccable/review/adaptive-correction/report.json" }]],
});
