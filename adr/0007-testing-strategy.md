# ADR-0007: Testing strategy, coverage thresholds, and mockModel tiers

## Status

Accepted (2026-11-14)

## Context

We want very high confidence while every commit stays fast, free, and deterministic. LLM behavior is non-deterministic and costs money. eve provides `mockModel` (scripted model replies and tool calls) and tool stubs for `eve eval`.

## Decision

**TDD is mandatory** (red → green → refactor). Tiers:

| Tier | Tool | Model | Runs |
|---|---|---|---|
| Domain unit | Vitest | none | pre-commit |
| Adapters | Vitest + msw (fake HTTP) | none | pre-commit |
| Agent tools | Vitest with in-memory adapters | none | pre-commit |
| Agent flows | `eve eval` + `mockModel` | scripted | pre-commit |
| Web | Vitest + Testing Library (hooks / widgets / ui) | none | pre-commit |
| E2E | Playwright with `data-testid` | mock agent | pre-push + CI |
| Behavior evals | `eve eval` + real model | real (paid) | manually + CI on `main` |

**Coverage thresholds**, enforced by Vitest and failing the run when missed:

| Scope | Lines / branches / functions / statements |
|---|---|
| `@cortex/domain` | 100% |
| `@cortex/adapters`, agent tools | 95% |
| `apps/web/src/features` | 90% |

Excluded: barrels (`index.ts`), vendored `components/ui` and `components/ai-elements`, and thin `app/` routes.

## Consequences

### Positive
- Pre-commit never calls a paid model and stays fast.
- Behavior regressions are caught by evals before they reach users.

### Negative
- Writing scripted `mockModel` flows takes effort.
- Real-model evals cost money and can be noisy, so they assert behavior and avoid exact wording.

## Alternatives Considered
- **Real-model tests on every commit**: slow, costly, flaky.
- **No coverage thresholds**: "maximal coverage" without enforcement erodes.
