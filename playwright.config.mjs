import { defineConfig, devices } from '@playwright/test'

// Phone-sized checks of the launchpad, the offline helper and the test game.
export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4180', serviceWorkers: 'allow' },
  projects: [
    { name: 'android', use: { ...devices['Pixel 7'] } },
    { name: 'iphone-size', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'small', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 640 } } },
  ],
  webServer: { command: 'python3 -m http.server 4180 --bind 127.0.0.1', port: 4180, reuseExistingServer: false, stdout: 'ignore', stderr: 'ignore' },
})
