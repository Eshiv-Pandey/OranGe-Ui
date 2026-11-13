import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /orb-media\.spec\.ts$/,
  outputDir: ".impeccable/review/orb-media-corrections/results",
  fullyParallel: false, workers: 1,
  use: { ...viewport.use, launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] } },
  reporter: [["list"], ["json", { outputFile: ".impeccable/review/orb-media-corrections/report.json" }]],
});
