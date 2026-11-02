import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /reference-motion\.spec\.ts$/,
  outputDir: "out/iteration/landing-motion/test-results",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "out/iteration/landing-motion/browser-report.json" }]],
  use: { ...viewport.use, reducedMotion: "no-preference", video: "on" },
});
