# Shared by mark-simplified.sh (writes) and .husky/pre-commit (verifies). ADR-0008.
SIMPLIFY_MARKER="$(git rev-parse --git-dir)/cortex-simplify-marker"

staged_hash() {
  git diff --cached --binary | shasum -a 256 | cut -d' ' -f1
}
