import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";
export default defineConfig(viewport, {
  testMatch: /refinement\.spec\.ts$/,
  outputDir: "out/refinement/results",
  fullyParallel: false, workers: 1,
  use: { ...viewport.use, reducedMotion: "no-preference", launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] } },
  reporter: [["list"], ["json", { outputFile: "out/refinement/report.json" }]],
});
