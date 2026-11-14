#!/usr/bin/env bash
# PostToolUse(Edit|Write): a story's status must match its row in the epic README.
set -euo pipefail
. "$(dirname "$0")/_backlog-lib.sh"

FILE_PATH=$(jq -r '.tool_input.file_path // empty')
is_story_file "$FILE_PATH" || exit 0
[ -f "$FILE_PATH" ] || exit 0

ID=$(story_id "$FILE_PATH")
EPIC_README="$(dirname "$FILE_PATH")/README.md"

if [ ! -f "$EPIC_README" ] || ! grep -qF "$ID" "$EPIC_README"; then
  echo "$ID is not listed in $EPIC_README: add it to the story table." >&2
  exit 2
fi
PRD="$(git rev-parse --show-toplevel)/docs/backlog/README.md"
if [ -f "$PRD" ] && ! grep -qF "$ID" "$PRD"; then
  echo "$ID is not referenced in docs/backlog/README.md: add it to the implementation order." >&2
  exit 2
fi

STORY=$(story_status "$FILE_PATH")
README=$(readme_status "$ID" "$EPIC_README")
if [ -n "$STORY" ] && [ -n "$README" ] && [ "$STORY" != "$README" ]; then
  echo "Status mismatch for $ID: story says '$STORY', $EPIC_README says '$README'." >&2
  exit 2
fi
