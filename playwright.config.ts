import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__',
  testMatch: '**/*.spec.ts',
  timeout: 120000,
  expect: { timeout: 15000 },
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
