import { defineConfig, devices } from "@playwright/test";

const usesExternalTestServer = process.env.NEST_E2E_EXTERNAL_SERVER === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{
    name: "desktop",
    use: {
      ...devices["Desktop Chrome"],
      channel: process.env.CI ? undefined : "chrome",
      contextOptions: { reducedMotion: "reduce" },
      viewport: { width: 1440, height: 900 },
    },
  }],
  webServer: usesExternalTestServer ? undefined : {
    command: "node tests/serve-dist.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
