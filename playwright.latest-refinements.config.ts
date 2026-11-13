import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";
export default defineConfig(viewport, {
  testMatch: /latest-refinements\.spec\.ts$/,
  outputDir: "out/latest-refinements/results",
  fullyParallel: false,
  workers: 1,
  use: { ...viewport.use, reducedMotion: "no-preference" },
  reporter: [["list"], ["json", { outputFile: "out/latest-refinements/report.json" }]],
});
