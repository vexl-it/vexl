#!/usr/bin/env bash
# Prepares a laptop or a cloud dev environment (Cursor) to run and screenshot
# the website. Installs only the website's part of the monorepo. Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/../../.."

fail() {
  echo "setup: $1" >&2
  exit 1
}

required_node="$(cat .node-version)"
command -v node >/dev/null ||
  fail "install Node.js $required_node or newer (https://nodejs.org), then re-run"
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge "$required_node" ] ||
  fail "Node.js $required_node or newer is needed, this machine has $(node -v)"

if ! command -v pnpm >/dev/null; then
  pnpm_version="$(node -p 'require("./package.json").packageManager')"
  corepack enable pnpm 2>/dev/null || npm install --global "$pnpm_version"
fi

pnpm install --filter 'vexl-website...'

# Linux VMs also need the browser's system libraries, which only root can install
if [ "$(uname)" = Linux ] && [ "$(id -u)" = 0 ]; then
  pnpm --filter vexl-website exec playwright install --with-deps chromium
else
  pnpm --filter vexl-website exec playwright install chromium
fi

if ! command -v gh >/dev/null || ! gh auth status >/dev/null 2>&1; then
  echo "setup: GitHub CLI is missing or logged out. Install it (https://cli.github.com) and run 'gh auth login' to open pull requests from here."
fi

echo "setup: done. Start the site with: pnpm --filter vexl-website dev:prod-data"
