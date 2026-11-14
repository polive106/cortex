#!/usr/bin/env bash
# PostToolUse(Edit|Write): story files must contain every required section.
set -euo pipefail
. "$(dirname "$0")/_backlog-lib.sh"

FILE_PATH=$(jq -r '.tool_input.file_path // empty')
is_story_file "$FILE_PATH" || exit 0
[ -f "$FILE_PATH" ] || exit 0

MISSING=()
for SECTION in "User Story" "Acceptance Criteria" "Technical Tasks" "Dependencies" "Complexity" "Status" "Test Scenarios"; do
  grep -q "^\*\*$SECTION\*\*" "$FILE_PATH" || MISSING+=("$SECTION")
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "Story $FILE_PATH is missing required sections: ${MISSING[*]}" >&2
  exit 2
fi
