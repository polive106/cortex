---
name: add-unit-tests
description: Write Vitest unit/integration tests at the right tier for each cortex layer, meeting the coverage thresholds.
---

Tests are colocated (`Foo.ts` → `Foo.test.ts`), no `__tests__/` folders. Write the test first and watch it fail.

## By layer

| Layer | What's real | What's faked | Threshold |
|-------|-------------|--------------|-----------|
| `packages/domain` | everything | ports via small hand-written fakes | 100% lines + branches |
| `packages/adapters` | adapter code | network via **msw** (GitHub REST, source URLs); shared contract test for each port | 95% |
| `agents/*/agent/tools` | tool + use-case + in-memory adapters | nothing else; call `execute()` directly | 95% |
| `apps/web/src/features` hooks | hook logic | `useEveAgent` / API module | 90% |
| widgets | rendering, DOM | nothing (props only) | 90% |
| `ui/` | hooks + widgets wired | `useEveAgent` boundary only | 90% |

Vendored `components/ui`, `components/ai-elements`, and thin `app/` routes are excluded from coverage.

## Rules

- Behavior over implementation: assert outputs, emitted changesets, rendered text — not private calls.
- One `describe` per unit; test names read as sentences (`it("rejects paths outside wiki/")`).
- Every branch: happy path, validation error, port failure.
- Adapters: run `describe<Port>Contract(factory)` against both the real adapter and its in-memory twin.
- No real network, no real model, no real GitHub in unit tests. Model behavior belongs in evals (`add-eval`).
- Never lower a threshold to make a commit pass.

## Commands

```bash
pnpm test                                        # all packages, with coverage
pnpm --filter @cortex/domain test -- --watch     # TDD loop
pnpm --filter @cortex/domain test -- src/wiki/use-cases/ReadPage.test.ts
```
