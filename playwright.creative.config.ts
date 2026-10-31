import { defineConfig } from "@playwright/test";
import viewport from "./playwright.viewport.config";

export default defineConfig(viewport, {
  testMatch: /creative\.spec\.ts$/,
  outputDir: process.env.ORANGEUI_EVIDENCE_DIR ? `${process.env.ORANGEUI_EVIDENCE_DIR}/test-results` : "out/batch-2/browser-results",
  timeout: 180_000,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: process.env.ORANGEUI_EVIDENCE_DIR ? `${process.env.ORANGEUI_EVIDENCE_DIR}/test-report.json` : "out/batch-2/browser-report.json" }]],
  use: {
    actionTimeout: 10_000,
    launchOptions: { args: ["--mute-audio", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] },
  },
});
