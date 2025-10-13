import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  use: {
    baseURL: 'https://ananya-staging.myshopify.com/',
    headless: true, // set to false if you want to see the browser
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
