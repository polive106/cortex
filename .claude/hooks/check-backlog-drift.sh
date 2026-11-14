#!/usr/bin/env bash
# SessionStart: report stories whose status disagrees with their epic README or their checked criteria.
set -euo pipefail
. "$(dirname "$0")/_backlog-lib.sh"

BACKLOG="$(git rev-parse --show-toplevel 2>/dev/null || echo .)/docs/backlog"
[ -d "$BACKLOG" ] || exit 0

WARNINGS=()
for STORY_FILE in "$BACKLOG"/epic-*/E*-US*.md; do
  [ -f "$STORY_FILE" ] || continue
  ID=$(story_id "$STORY_FILE")
  STATUS=$(story_status "$STORY_FILE")
  README=$(readme_status "$ID" "$(dirname "$STORY_FILE")/README.md" 2>/dev/null || true)
  if [ -n "$README" ] && [ "$STATUS" != "$README" ]; then
    WARNINGS+=("$ID: story says '$STATUS', epic README says '$README'")
  fi
  CHECKED=$(grep -c '^- \[x\]' "$STORY_FILE" || true)
  UNCHECKED=$(grep -c '^- \[ \]' "$STORY_FILE" || true)
  if [ "$STATUS" != "Done" ] && [ "$CHECKED" -gt 0 ] && [ "$UNCHECKED" -eq 0 ]; then
    WARNINGS+=("$ID: all $CHECKED acceptance criteria are checked but status is '$STATUS'")
  fi
done

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo "Backlog drift detected (run the review-backlog or story-complete skill):"
  printf '  - %s\n' "${WARNINGS[@]}"
fi
