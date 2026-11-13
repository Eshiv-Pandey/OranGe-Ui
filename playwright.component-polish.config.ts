import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /component-polish\.spec\.ts$/,
  outputDir: ".impeccable/review/nov6-next/results",
  fullyParallel: false,
  workers: 1,
  use: { ...viewport.use, reducedMotion: "no-preference" },
  reporter: [["list"], ["json", { outputFile: ".impeccable/review/nov6-next/report.json" }]],
});
