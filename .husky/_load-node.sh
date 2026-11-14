# Git hooks run in non-interactive shells: switch to the Node major pinned in .nvmrc when needed.
if [ "$(node -v 2>/dev/null | cut -d. -f1)" != "v$(cat .nvmrc)" ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use --silent >/dev/null 2>&1
fi
if [ "$(node -v 2>/dev/null | cut -d. -f1)" != "v$(cat .nvmrc)" ]; then
  echo "Node $(cat .nvmrc) is required (found $(node -v 2>/dev/null || echo none)). Run: nvm install $(cat .nvmrc)" >&2
  exit 1
fi
