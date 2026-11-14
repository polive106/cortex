# E1-US01: pnpm workspace, Node 26, Biome, TypeScript, Vitest coverage

**User Story**: As a developer (human or agent), I want one consistent workspace with fast lint, typecheck, and test commands so that every package is held to the same deterministic bar.

**Acceptance Criteria**:
- [x] `pnpm-workspace.yaml` includes `packages/*` and `apps/*`; `pnpm install` works on Node 26 (`.nvmrc`)
- [x] `packages/domain` (`@cortex/domain`) and `packages/adapters` (`@cortex/adapters`) exist as workspace packages
- [x] Biome handles lint and format; `noRestrictedImports` prevents `@cortex/domain` from importing anything external
- [x] Root scripts: `lint`, `format`, `typecheck`, `test`, `check`, `eval`
- [x] Vitest coverage thresholds are enforced: 100% for domain, 95% for adapters and agent tools
- [x] `pnpm check` passes on a clean checkout

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Tooling | Workspace config, Node pin, pnpm | `pnpm-workspace.yaml`, `.nvmrc`, `package.json` |
| Tooling | Biome config with import boundaries | `biome.json` |
| Domain | Package skeleton, Vitest config with a 100% threshold | `packages/domain/*` |
| Adapters | Package skeleton, Vitest config with a 95% threshold | `packages/adapters/*` |

**Dependencies**: None

**Complexity**: M

**Status**: Done

**Test Scenarios**:
```gherkin
Scenario: Domain import boundary
  Given a file in packages/domain imports "zod"
  When I run pnpm lint
  Then Biome reports a noRestrictedImports error

Scenario: Coverage threshold
  Given a domain function without a test
  When I run pnpm test
  Then the run fails on the 100% coverage threshold
```
