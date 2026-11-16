---
name: fix-ci
description: Diagnose and fix GitHub Actions failures on cortex by reproducing them locally.
---

## Steps

1. `gh run list --limit 5` then `gh run view <id> --log-failed`.
2. Categorize and reproduce locally with the same command:

| Failure | Local command |
|---------|---------------|
| Install / lockfile | `pnpm install --frozen-lockfile` |
| Lint / format | `pnpm lint` (fix with `pnpm format`) |
| Typecheck | `pnpm typecheck` |
| Unit / coverage | `pnpm test` |
| Deterministic evals | `pnpm eval` |
| E2E | `pnpm test:e2e` |
| Real-model evals | `pnpm exec eve eval --strict` with `ANTHROPIC_API_KEY` set (costs money; ask first) |

3. Fix with a failing test where it applies, commit through the `commit` skill, `git push`.
4. `gh run watch` until green.

## Common causes

| Symptom | Fix |
|---------|-----|
| `ERR_PNPM_OUTDATED_LOCKFILE` | `pnpm install`, commit `pnpm-lock.yaml` |
| Node version error | CI must use `.nvmrc` (Node 26) via `actions/setup-node` `node-version-file` |
| Passes locally, fails in CI | Env var only set locally; container must fall back to in-memory adapters |
| Playwright browsers missing | `pnpm exec playwright install --with-deps chromium` step |
| Real-model eval flaky | Tighten instructions or the assertion; never retry until green |
