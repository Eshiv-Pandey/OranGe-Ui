import { defineConfig } from "@playwright/test";

const evidence = process.env.DOCS_EVIDENCE_DIR ?? "P:/codex-tmp/orangeui-main/docs-navigation";

// The caller starts the verified production build before running this suite.
export default defineConfig({
  testDir: "./tests",
  testMatch: /docs-navigation\.spec\.ts$/,
  outputDir: `${evidence}/test-results`,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: `${evidence}/browser-report.json` }],
    ["html", { outputFolder: `${evidence}/browser-report`, open: "never" }],
  ],
  use: {
    baseURL: process.env.DOCS_PREVIEW_URL ?? "http://127.0.0.1:3170",
    browserName: "chromium",
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
