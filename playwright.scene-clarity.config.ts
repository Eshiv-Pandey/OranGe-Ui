import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', testMatch: /(?:chai-film-craft|scene-clarity|scene-film|scenes|navbar-film)\.spec\.ts$/,
  outputDir: 'out/iteration/scene-clarity-results', workers: 1, timeout: 60000,
  expect: { timeout: 15000 },
  reporter: [['list'], ['json', { outputFile: 'out/iteration/scene-clarity-browser-report.json' }]],
  use: { baseURL: 'http://127.0.0.1:3134', viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', trace: 'off' },
});
