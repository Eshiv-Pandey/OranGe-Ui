import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /visual-revamp\.spec\.ts$/,
  outputDir: "out/iteration/visual-revamp/test-results",
  workers: 1,
  fullyParallel: false,
  timeout: 180_000,
  reporter: [["list"], ["json", { outputFile: "out/iteration/visual-revamp/browser-report.json" }]],
  use: { ...viewport.use, reducedMotion: "reduce", channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
});
