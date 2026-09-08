import { defineConfig, devices } from '@playwright/test';

// Runs against the real build output, served by `astro preview`, because these
// tests check the shipped HTML and the self-hosted WASM runtimes.
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:4321/se-foundations/',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321/se-foundations/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
