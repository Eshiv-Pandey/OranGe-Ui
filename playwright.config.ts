import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "out/test-results",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "out/playwright-report", open: "never" }]],
  use: { browserName: "chromium", trace: "retain-on-failure" },
  projects: [
    { name: "landing", testMatch: /landing\.spec\.ts$/, use: { baseURL: "http://127.0.0.1:3107" } },
    { name: "library", testMatch: /library\.spec\.ts$/, use: { baseURL: "http://127.0.0.1:3107" } },
    { name: "stories", testMatch: /storybook\.spec\.ts$/, use: { baseURL: "http://127.0.0.1:6006" } },
  ],
  webServer: [
    { command: "npm run start -- --hostname 127.0.0.1 --port 3107", url: "http://127.0.0.1:3107", timeout: 120_000, reuseExistingServer: false },
    { command: "npm run storybook -- --ci --host 127.0.0.1", url: "http://127.0.0.1:6006/index.json", timeout: 120_000, reuseExistingServer: true },
  ],
});
