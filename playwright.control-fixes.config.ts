import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /control-fixes\.spec\.ts$/,
  outputDir: "out/control-fixes/results",
  fullyParallel: false,
  workers: 1,
  use: { ...viewport.use, reducedMotion: "no-preference" },
  reporter: [["list"], ["json", { outputFile: "out/control-fixes/report.json" }]],
});
