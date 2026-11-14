# E1-US02: Husky hooks and the Claude Code simplify gate

**User Story**: As the repo owner, I want every commit checked deterministically, and every agent commit simplified first, so that quality doesn't depend on anyone remembering.

**Acceptance Criteria**:
- [x] Husky `pre-commit` runs `pnpm check` (lint, typecheck, unit tests with coverage)
- [x] Husky `pre-push` is added with E2E in E2-US05 (no no-op hook before then)
- [x] Hooks switch to Node 26 through nvm when needed, and fail loudly when Node 26 is missing
- [x] `.claude/hooks/mark-simplified.sh` records the sha of `git diff --cached`
- [x] Husky `pre-commit` blocks agent commits (`CLAUDECODE` set) when the index's hash doesn't match the marker, and explains what to do
- [x] A `PreToolUse` hook on Bash blocks attempts to skip husky (`--no-verify`, `-n`, `core.hooksPath`, `HUSKY=0`)
- [x] `git commit -a`, pathspec commits, and `--amend` fail the hash check because it runs on the real index
- [x] The marker lives inside `.git/`, so it is never committed

**Technical Tasks**:
| Layer | Task | File(s) |
|-------|------|---------|
| Tooling | Husky install and hooks | `.husky/pre-commit`, `.husky/_load-node.sh`, `package.json` (`prepare`) |
| Claude Code | Gate and mark scripts | `.claude/hooks/_simplify-lib.sh`, `.claude/hooks/mark-simplified.sh`, `.claude/hooks/no-skip-git-hooks.sh` |
| Claude Code | Hook registration | `.claude/settings.json` |

**Dependencies**: E1-US01

**Complexity**: M

**Status**: Done

**Test Scenarios**:
```gherkin
Scenario: Commit without simplify is blocked
  Given staged changes and no marker
  When the agent runs git commit
  Then husky pre-commit fails with "run the commit skill"

Scenario: Diff changed after marking
  Given the marker matches the staged diff
  When another file is staged
  And the agent runs git commit
  Then the hook blocks the commit

Scenario: Marked diff commits
  Given the marker matches the staged diff
  When the agent runs git commit -m "..."
  Then the hook allows it and husky runs pnpm check
```
