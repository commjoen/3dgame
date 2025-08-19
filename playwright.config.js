import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Disable parallel to avoid resource issues in CI
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // Increase retries for CI stability
  workers: 1, // Use only 1 worker to avoid resource conflicts
  reporter: [
    ['list'], // Simple list reporter for CI
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Increase timeouts for CI environments
    actionTimeout: 20000,
    navigationTimeout: 45000,
  },
  // Enhanced project configuration for better CI compatibility
  projects: process.env.CI 
    ? [
        {
          name: 'chromium',
          use: { 
            ...devices['Desktop Chrome'],
            // Enhanced CI browser configuration
            launchOptions: {
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
              ]
            }
          }
        },
        {
          name: 'mobile',
          use: { 
            ...devices['iPhone 13'], 
            hasTouch: true,
            // Mobile uses chromium in CI with enhanced configuration
            browserName: 'chromium',
            launchOptions: {
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
              ]
            }
          }
        }
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] }
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] }
        },
        {
          name: 'mobile',
          use: { ...devices['iPhone 13'], hasTouch: true }
        }
      ],
  webServer: {
    command: 'npm run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 180000, // Increased timeout for CI
  }
})