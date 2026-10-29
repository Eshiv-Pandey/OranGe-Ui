import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testDir: "./tests",
  testMatch: /(?:launch(?:-forms|-navigation-ai)?|theme-copy)\.spec\.ts$/,
  outputDir: "out/iteration/launch-results",
  timeout: 180_000,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["html", { outputFolder: "out/iteration/launch-report", open: "never" }]],
});
