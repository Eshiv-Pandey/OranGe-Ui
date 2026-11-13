import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /adaptive(?:-correction)?\.spec\.ts$/,
  outputDir: ".impeccable/review/adaptive-cleanup/results",
  fullyParallel: false, workers: 1,
  reporter: [["list"], ["json", { outputFile: ".impeccable/review/adaptive-cleanup/report.json" }]],
});
