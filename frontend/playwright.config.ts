import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './tests',
    /* Run tests in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Reporter to use */
    reporter: 'html',
    /* Shared settings for all the projects below */
    use: {
        /* Base URL to use in actions like `await page.goto('/')` */
        baseURL: 'http://localhost:3000',
        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Run local dev servers before starting the tests (frontend + backend) */
    webServer: [
        {
            // Backend Socket.io + API server
            command: 'npm run dev',
            cwd: '../backend',
            url: 'http://127.0.0.1:3001/health',
            reuseExistingServer: !process.env.CI,
            timeout: 120 * 1000,
        },
        {
            // Frontend Next.js app
            command: 'npm run dev',
            url: 'http://localhost:3000',
            reuseExistingServer: !process.env.CI,
            timeout: 120 * 1000,
        },
    ],
});
