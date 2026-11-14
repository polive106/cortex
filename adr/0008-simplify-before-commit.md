# ADR-0008: Simplify before every agent commit

## Status

Accepted (2026-11-14)

## Context

Agents write nearly all code in this repo. We want every change to pass Claude Code's `simplify` skill (reuse, simplification, efficiency) before it is committed. `simplify` is model-driven and edits code, so it can't run as a deterministic git hook.

## Decision

Three layers:

1. **The `commit` skill:** run `simplify` → `review` → `pnpm check` → `git add <paths>` → `.claude/hooks/mark-simplified.sh` (records the SHA-256 of `git diff --cached`) → `git commit -m "type(scope): …"`.
2. **Husky `pre-commit` verifies the marker for agent commits.** When `CLAUDECODE` is set (Claude Code sets it in its shells), the hook compares the hash of the index git is about to commit with the marker, and fails on a mismatch or a missing marker. Because the check runs on the real index, `-a`, `-i`, `-o`, pathspecs, and `--amend` are all covered without parsing commands. It then runs `pnpm check` (Biome, typecheck, tests with coverage thresholds) for **every** commit, human or agent.
3. **A Claude Code `PreToolUse` hook** (`.claude/hooks/no-skip-git-hooks.sh`) blocks attempts to skip husky: `--no-verify`, `-n`, `core.hooksPath`, `HUSKY=0`. **`pre-push`** runs E2E once it exists (E2).

## Consequences

### Positive
- The gate itself is deterministic and costs nothing. Changing anything after simplify forces another simplify pass.
- The check sits where git hands over the exact index, so no special cases are needed for commit flags.
- Human commits aren't slowed down by a model call.

### Negative
- Only commits made through Claude Code are gated. Human commits rely on husky only.
- The marker proves that the commit skill ran, not the quality of the simplify pass.
- The skip guard matches text in the command. It blocks the obvious and quoted bypasses (`--no-v*`, `-n`, `core.hooksPath`, `HUSKY=`, touching `CLAUDECODE`) and errs toward refusing, but it targets an agent cutting corners, not an adversary. CI runs `pnpm check` on every push as the backstop.

## Alternatives Considered
- **Husky running `claude -p "/simplify"`**: minutes per commit, token cost, and code mutated during the commit.
- **A rule in `AGENTS.md` only**: not enforced.
