import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3108);
const managedUrl = `http://127.0.0.1:${port}`;

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
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? managedUrl,
    browserName: "chromium",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: managedUrl,
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
