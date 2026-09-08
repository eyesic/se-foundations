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
  // Not `webServer`: `astro preview` returns as soon as its background server
  // is up, which Playwright reads as a server that died. tests/preview-server.ts
  // starts one over the current dist/ and stops it again afterwards.
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
});
