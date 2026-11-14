import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// E2E runs the whole Vercel service graph locally (web plus every agent) with the UI pointed at
// the mockModel double, so it costs no tokens and needs no ANTHROPIC_API_KEY (E2-US05).
export default defineConfig({
  testDir: "e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec vercel dev --local --listen ${PORT}`,
    env: { NEXT_PUBLIC_WEB_CHAT_AGENT: "companion-test" },
    url: `http://localhost:${PORT}/eve/companion-test/v1/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // vercel dev stops its eve and Next.js children only on a graceful signal; SIGKILL orphans them.
    gracefulShutdown: { signal: "SIGTERM", timeout: 15_000 },
  },
});
