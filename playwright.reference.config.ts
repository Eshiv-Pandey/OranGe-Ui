import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /reference-expansion\.spec\.ts$/,
  outputDir: "out/iteration/reference-expansion/browser-results",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "out/iteration/reference-expansion/browser-report.json" }]],
});
