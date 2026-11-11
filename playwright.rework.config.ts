import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /rework\.spec\.ts$/,
  outputDir: "out/rework/test-results",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "out/rework/test-report.json" }]],
});
