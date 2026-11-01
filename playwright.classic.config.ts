import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /landing\.spec\.ts$/,
  outputDir: "out/iteration/six-task/classic-results",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "out/iteration/six-task/classic-report.json" }]],
});
