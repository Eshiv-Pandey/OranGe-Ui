import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /github-graph\.spec\.ts$/,
  outputDir: ".impeccable/review/github-graph/results",
  fullyParallel: false,
  workers: 1,
  use: { ...viewport.use, reducedMotion: "no-preference" },
  reporter: [["list"], ["json", { outputFile: ".impeccable/review/github-graph/report.json" }]],
});
