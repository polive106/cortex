---
name: commit
description: The only way to commit in cortex. Runs simplify, review, the deterministic checks, stages explicitly, marks the staged diff as simplified, then commits with a conventional message.
disable-model-invocation: true
---

Husky `pre-commit` blocks every agent commit whose index does not match the marker written by `.claude/hooks/mark-simplified.sh`, and a `PreToolUse` hook stops attempts to skip husky. Follow these steps in order. If **anything** changes after step 5 (a fix, a format, a new file), go back to step 1.

## Steps

1. **Simplify**: run the `simplify` skill on the pending changes. Apply its fixes.
2. **Review**: run the `review` skill. Fix every unchecked item or explain to the user why it doesn't apply.
3. **Check**: `pnpm check` (Biome lint, typecheck, unit tests with coverage thresholds). This is exactly what husky pre-commit runs, so fix failures now.
4. **Stage explicitly**: `git add <path> <path> …`. Never `git add -A` / `git add .` blindly; inspect `git status` and stage only files that belong to this logical change.
5. **Mark**: `.claude/hooks/mark-simplified.sh` (records the sha of `git diff --cached`).
6. **Commit**:

   ```bash
   git commit -m "feat(E3-US02): add GitHub wiki store adapter" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
   ```

## Forbidden

- `git commit -a`, `git commit <pathspec>`, `git commit --amend` without re-running steps 1–5
- `--no-verify` (husky must run)
- Committing a diff that was edited after marking

## Conventional commits

| Type       | When                        |
| ---------- | --------------------------- |
| `feat`     | New behavior                |
| `fix`      | Bug fix                     |
| `refactor` | No behavior change          |
| `test`     | Tests only                  |
| `docs`     | Docs, ADRs, backlog, skills |
| `chore`    | Tooling, deps, CI           |

Scope is the story ID when one exists (`feat(E2-US03): …`), otherwise the area (`chore(ci): …`). Keep commits atomic: one logical change each.

## If the hook blocks you

The message means the staged diff differs from what was simplified. Re-run steps 1–5; do not edit the marker by hand.
