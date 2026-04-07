import { defineConfig } from '@playwright/test';

const PORT = 3001;

export default defineConfig({
  testDir: './__tests__',
  testMatch: '**/*.spec.ts',
  timeout: 120000,
  expect: { timeout: 15000 },
  retries: 0,
  workers: 1,
  globalSetup: './__tests__/global-setup.ts',
  globalTeardown: './__tests__/global-teardown.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 120000,
    reuseExistingServer: true,
    env: {
      DATABASE_PATH: './data/test-db.sqlite',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
