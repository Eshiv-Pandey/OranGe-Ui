import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testDir: "./tests",
  testMatch: /artwork-customizers\.spec\.ts$/,
  outputDir: "out/iteration/task1-customizers-results",
  timeout: 120_000,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["html", { outputFolder: "out/iteration/task1-customizers-report", open: "never" }]],
});
