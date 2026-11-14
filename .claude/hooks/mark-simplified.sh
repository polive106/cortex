#!/usr/bin/env bash
# Records that /simplify ran on exactly the currently staged diff.
# Called by the `commit` skill after simplify + review + `pnpm check` + `git add`.
set -euo pipefail
. "$(dirname "$0")/_simplify-lib.sh"

if git diff --cached --quiet; then
  echo "Nothing is staged; stage your changes before marking them as simplified." >&2
  exit 1
fi

staged_hash > "$SIMPLIFY_MARKER"
echo "Marked the staged diff as simplified."
