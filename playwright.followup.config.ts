import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /followup\.spec\.ts$/,
  outputDir: "out/rework-followup/test-results",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "out/rework-followup/test-report.json" }]],
});
