import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testDir: "./tests",
  testMatch: /motorsport(?:-physics|-geometry)?\.spec\.ts$/,
  outputDir: "out/iteration/task2-motorsport-results",
  timeout: 120_000,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["html", { outputFolder: "out/iteration/task2-motorsport-report", open: "never" }]],
});
