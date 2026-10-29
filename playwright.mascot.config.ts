import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testDir: "./tests",
  testMatch: /mascot\.spec\.ts$/,
  outputDir: "out/iteration/mascot-browser-results",
  timeout: 60_000,
  workers: 2,
  reporter: [["list"], ["html", { outputFolder: "out/iteration/mascot-browser-report", open: "never" }]],
});
