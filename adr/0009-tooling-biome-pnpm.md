# ADR-0009: Tooling: pnpm workspaces without Turbo, Biome, Node 26

## Status

Accepted (2026-11-14)

## Context

eve 1.0 requires Node 24 or newer, and its scaffold targets Node 26 and TypeScript 7 (the native compiler, which has no JavaScript API). The workspace is small: two packages, one web app, and the agents.

## Decision

- **Node 26** (`.nvmrc` and `engines`), **pnpm 10** workspaces (`packages/*`, `apps/*`). Agents are not pnpm packages (ADR-0001).
- **No Turbo**: `pnpm -r --if-present <script>` is enough at this size. Revisit when builds need caching.
- **Biome** for lint, format, and import ordering, *and* for architecture boundaries (`noRestrictedImports` overrides per package). ESLint is out because `typescript-eslint` depends on the TypeScript JS API, which TypeScript 7 doesn't ship.
- **Vitest** with V8 coverage: one root `vitest.config.ts` with `test.projects` and glob-keyed thresholds, so ADR-0007's table lives in one place and also covers agent tools (agents aren't pnpm packages).
- Root scripts: `lint`, `format`, `typecheck`, `test`, and `check` (all three, used by husky).

## Consequences

### Positive
- One fast tool for lint and format, and boundary rules live in config, not in reviews.

### Negative
- Biome has fewer rules than the ESLint ecosystem, and no type-aware lint rules.

## Alternatives Considered
- **ESLint + Prettier**: incompatible with TypeScript 7's API today.
- **Turbo**: caching we don't need yet.
- **dependency-cruiser for boundaries**: another tool, while Biome covers it.
