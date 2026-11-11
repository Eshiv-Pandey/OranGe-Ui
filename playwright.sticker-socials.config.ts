import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: /sticker-socials\.spec\.ts$/, outputDir: "out/navbar-fixes/sticker-results",
  timeout: 90_000, expect: { timeout: 10_000 }, workers: 1,
  reporter: [["list"], ["json", { outputFile: "out/navbar-fixes/sticker-browser-report.json" }]],
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3110", browserName: "chromium", reducedMotion: "reduce", trace: "retain-on-failure" },
});
