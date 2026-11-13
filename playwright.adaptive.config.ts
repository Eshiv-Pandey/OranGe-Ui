import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";
export default defineConfig(viewport, {
  testMatch: /adaptive\.spec\.ts$/,
  outputDir: ".impeccable/review/adaptive-input/results",
  fullyParallel: false, workers: 1,
  reporter: [["list"], ["json", { outputFile: ".impeccable/review/adaptive-input/report.json" }]],
});
