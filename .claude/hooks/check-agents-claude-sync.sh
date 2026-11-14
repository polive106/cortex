#!/usr/bin/env bash
# PostToolUse(Edit|Write): every skill in .agents/skills must be listed in AGENTS.md,
# and CLAUDE.md must stay a pointer to AGENTS.md.
set -euo pipefail

FILE_PATH=$(jq -r '.tool_input.file_path // empty')
case "$FILE_PATH" in
  */AGENTS.md | */CLAUDE.md | */.agents/skills/*) ;;
  *) exit 0 ;;
esac

ROOT=$(git rev-parse --show-toplevel)
PROBLEMS=()
for SKILL_DIR in "$ROOT"/.agents/skills/*/; do
  NAME=$(basename "$SKILL_DIR")
  grep -qF "\`$NAME\`" "$ROOT/AGENTS.md" || PROBLEMS+=("skill '$NAME' is missing from the AGENTS.md skills table")
done
grep -qF "@AGENTS.md" "$ROOT/CLAUDE.md" || PROBLEMS+=("CLAUDE.md must import @AGENTS.md")

if [ ${#PROBLEMS[@]} -gt 0 ]; then
  printf 'Agent docs out of sync:\n' >&2
  printf '  - %s\n' "${PROBLEMS[@]}" >&2
  exit 2
fi
