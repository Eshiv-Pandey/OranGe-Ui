import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testDir: "./tests",
  testMatch: /avatar-redesign\.spec\.ts$/,
  outputDir: "out/iteration/avatar-redesign-results",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "out/iteration/avatar-redesign-report", open: "never" }]],
});
