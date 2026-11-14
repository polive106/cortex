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
    ],
    coverage: {
      provider: "v8",
      include: [
        "packages/*/src/**/*.ts",
        "agents/*/agent/tools/**/*.ts",
        "apps/web/src/features/**",
        "apps/web/lib/safe-markdown-url.ts",
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/index.ts"],
      thresholds: {
        "packages/domain/src/**": at(100),
        "packages/adapters/src/**": at(95),
        "agents/*/agent/tools/**": at(95),
        "apps/web/src/features/**": at(90),
        "apps/web/lib/safe-markdown-url.ts": at(100),
      },
    },
  },
});
