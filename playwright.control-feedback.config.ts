import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /control-feedback\.spec\.ts$/,
  outputDir: "out/iteration/control-feedback/results",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "out/iteration/control-feedback/report.json" }]],
});
