#!/usr/bin/env bash
# PreToolUse(Bash): stop agents from skipping husky, where the simplify marker is verified (ADR-0008).
set -euo pipefail

IFS= read -r -d '' INPUT || true
case "$INPUT" in *commit*) ;; *) exit 0 ;; esac # cheap prefilter: most Bash calls never reach jq
COMMAND=$(jq -r '.tool_input.command // empty' <<<"$INPUT")

# --no-verify (or an abbreviation), -n alone/combined/quoted, hook path overrides (git config keys are
# case-insensitive; also via --config-env or GIT_CONFIG_*), HUSKY/CLAUDECODE tampering.
# Text matching can't see through shell expansion (e.g. --no-$X): CI is the backstop (ADR-0008).
SKIP='--no-v|[[:space:]"'"'"']-[A-Za-z]*n|core\.hookspath|--config-env|git_config_|husky=|claudecode'
shopt -s nocasematch
if [[ $COMMAND == *commit* && $COMMAND =~ $SKIP ]]; then
  echo "Commit blocked: agents may not skip git hooks or alter HUSKY/CLAUDECODE. Use the commit skill." >&2
  exit 2
fi
