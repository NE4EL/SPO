import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost',   // Docker запущен на 80
    headless: false,               // показывать браузер (поставь true для CI)
    launchOptions: { slowMo: 1200 }, // пауза 600 мс между каждым действием
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
