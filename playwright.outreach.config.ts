import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./tests", testMatch: /outreach-blocks\.spec\.ts$/, timeout: 120000, workers: 2, reporter: "list", outputDir: "out/outreach/results", use: { baseURL: "http://127.0.0.1:3153", browserName: "chromium", trace: "retain-on-failure" } });
