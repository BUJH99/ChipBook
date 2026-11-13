const path = require('node:path');
const { defineConfig } = require('@playwright/test');
const root = path.resolve(__dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(root, '.artifacts/cache/playwright');
module.exports = defineConfig({
    testDir: path.join(__dirname, 'browser'),
    timeout: 60000,
    expect: { timeout: 15000 },
    fullyParallel: false,
    workers: 1,
    outputDir: path.join(root, '.artifacts/qa/browser-results'),
    reporter: [['list'], ['json', { outputFile: path.join(root, '.artifacts/qa/browser-results.json') }]],
    use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'http', use: { baseURL: 'http://127.0.0.1:8766/' } },
        { name: 'file' },
        { name: 'mobile', testMatch: /responsive\.spec\.cjs/, use: { baseURL: 'http://127.0.0.1:8766/', viewport: { width: 390, height: 844 } } },
    ],
    webServer: {
        command: 'python -m http.server 8766 --bind 127.0.0.1 --directory .artifacts/site',
        cwd: root,
        url: 'http://127.0.0.1:8766/',
        reuseExistingServer: !process.env.CI,
        stdout: 'ignore',
        stderr: 'ignore',
    },
});
