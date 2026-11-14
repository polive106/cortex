# Shared helpers for the backlog hooks (portable: no GNU grep -P).

# Status written in a story file: "**Status**: In Progress" -> "In Progress"
story_status() {
  sed -nE 's/^\*\*Status\*\*:[[:space:]]*(.*[^[:space:]])[[:space:]]*$/\1/p' "$1" | head -1
}

# Status of a story ID in an epic README table row.
readme_status() {
  grep -F "$1" "$2" | grep -oE '\|[[:space:]]*(Pending|In Progress|Done|Blocked)[[:space:]]*\|' | head -1 | tr -d '|' | xargs
}

story_id() {
  basename "$1" | grep -oE 'E[0-9]+-US[0-9]+' || true
}

# True for story files: docs/backlog/epic-*/E<n>-US<n>-<slug>.md
is_story_file() {
  [[ "$1" =~ docs/backlog/epic-[^/]+/E[0-9]+-US[0-9]+-[^/]*\.md$ ]]
}
