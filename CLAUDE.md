@AGENTS.md

## Claude Code specifics

- Skills live in `.claude/skills/` (a symlink to `.agents/skills/`).
- Hooks in `.claude/settings.json`:
  - `no-skip-git-hooks.sh` (PreToolUse/Bash) stops agents from bypassing husky, where `.husky/pre-commit` verifies the simplify marker (ADR-0008);
  - the backlog and doc-sync hooks run after Edit/Write;
  - `check-backlog-drift.sh` runs at session start.
