import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /viewport\.spec\.ts$/,
  outputDir: "out/iteration/viewport-results",
  timeout: 180_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 2,
  reporter: [["list"], ["html", { outputFolder: "out/iteration/viewport-report", open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3108",
    browserName: "chromium",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "npm run start -- --hostname 127.0.0.1 --port 3108",
    url: "http://127.0.0.1:3108",
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
