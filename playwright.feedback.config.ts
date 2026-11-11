import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /component-feedback\.spec\.ts$/,
  outputDir: "out/iteration/component-feedback/test-results",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "out/iteration/component-feedback/test-report.json" }]],
  use: { ...viewport.use, reducedMotion: "no-preference", launchOptions: { args: ["--enable-unsafe-swiftshader"] } },
});
