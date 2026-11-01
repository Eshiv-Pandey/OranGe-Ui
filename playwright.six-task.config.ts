import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /six-task\.spec\.ts$/,
  outputDir: "out/iteration/six-task/test-results",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "out/iteration/six-task/browser-report.json" }]],
});
