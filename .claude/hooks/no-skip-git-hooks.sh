#!/usr/bin/env bash
# PreToolUse(Bash): agents must not skip husky, because .husky/pre-commit is where the
# simplify marker is verified against the exact index being committed (ADR-0008).
set -euo pipefail

COMMAND=$(jq -r '.tool_input.command // empty')
case "$COMMAND" in *commit*) ;; *) exit 0 ;; esac

# Drop quoted strings (commit messages) before looking for flags.
UNQUOTED=$(printf '%s' "$COMMAND" | sed -E "s/\"[^\"]*\"//g; s/'[^']*'//g")
if printf '%s' "$UNQUOTED" | grep -qE -- '--no-verify|core\.hooksPath|HUSKY=0|(^|[[:space:]])-[A-Za-z]*n[A-Za-z]*([[:space:]]|$)'; then
  echo "Commit blocked: agents may not skip git hooks (--no-verify, -n, core.hooksPath, HUSKY=0). Use the commit skill." >&2
  exit 2
fi
