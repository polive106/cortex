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
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Hosts with a preinstalled Chromium that doesn't match this Playwright (cloud sandboxes)
    // point at it here; everywhere else Playwright uses its own browser.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec vercel dev --local --listen ${PORT}`,
    // The in-memory brain and session index, so E2E never writes to the real brain or Upstash,
    // and the sample pages, so it never fetches from the web.
    env: {
      NEXT_PUBLIC_WEB_CHAT_AGENT: "companion-test",
      BRAIN_STORE: "memory",
      SESSIONS_STORE: "memory",
      SOURCE_FETCHER: "memory",
    },
    url: `http://localhost:${PORT}/eve/companion-test/v1/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // vercel dev stops its eve and Next.js children only on a graceful signal; SIGKILL orphans them.
    gracefulShutdown: { signal: "SIGTERM", timeout: 15_000 },
  },
});
