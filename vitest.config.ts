import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Coverage thresholds from ADR-0007, enforced in one place for every project.
const at = (percent: number) => ({
  lines: percent,
  branches: percent,
  functions: percent,
  statements: percent,
});

export default defineConfig({
  test: {
    projects: [
      "packages/*",
      { test: { name: "web", include: ["apps/web/{lib,app}/**/*.test.{ts,tsx}"] } },
      {
        // Web feature slices (ADR-0003): React hooks and widgets in a DOM.
        resolve: { alias: { "@": fileURLToPath(new URL("./apps/web", import.meta.url)) } },
        test: {
          name: "web-features",
          include: ["apps/web/src/**/*.test.{ts,tsx}"],
          environment: "happy-dom",
        },
      },
      { test: { name: "agents", include: ["agents/*/agent/**/*.test.ts"] } },
    ],
    coverage: {
      provider: "v8",
      include: [
        "packages/*/src/**/*.ts",
        "agents/*/agent/tools/**/*.ts",
        "apps/web/src/features/**",
        "apps/web/lib/safe-markdown-url.ts",
        "apps/web/lib/approval-summary.ts",
        "apps/web/lib/session-route.ts",
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/index.ts", "**/testing/**", "**/ports/**"],
      thresholds: {
        "packages/domain/src/**": at(100),
        "packages/adapters/src/**": at(95),
        "agents/*/agent/tools/**": at(95),
        "apps/web/src/features/**": at(90),
        "apps/web/lib/safe-markdown-url.ts": at(100),
        "apps/web/lib/approval-summary.ts": at(100),
        "apps/web/lib/session-route.ts": at(100),
      },
    },
  },
});
