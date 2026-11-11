import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /shader-stability\.spec\.ts$/,
  outputDir: "out/iteration/effects-fix/test-results",
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  reporter: [["list"], ["json", { outputFile: "out/iteration/effects-fix/browser-report.json" }]],
  use: { ...viewport.use, reducedMotion: "no-preference", channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
});
