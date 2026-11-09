import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: /(?:scene-film|scenes|navbar-film)\.spec\.ts$/,
  outputDir: 'out/iteration/scene-film-results', workers: 1, timeout: 60000,
  expect: { timeout: 15000 },
  reporter: [['list'], ['json', { outputFile: 'out/iteration/scene-film-browser-report.json' }]],
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3134', viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', trace: 'off' },
});
