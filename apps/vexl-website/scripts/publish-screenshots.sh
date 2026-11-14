#!/usr/bin/env bash
# Usage: pnpm --filter vexl-website publish-screenshots
# Pushes .screenshots/ to refs/website-screenshots/<branch> on origin, a ref
# clones don't fetch, and prints a before/after table per screenshot name for
# the PR description, with image links pinned to that commit.
set -euo pipefail
cd "$(dirname "$0")/.."
shots=.screenshots
[ -d "$shots" ] || {
  echo "No screenshots in apps/vexl-website/$shots" >&2
  exit 1
}

branch="$(git branch --show-current)"
ref="refs/website-screenshots/$branch"
repo="$(git remote get-url origin | sed -E 's#^.*github\.com[:/]##; s#\.git$##')"

GIT_INDEX_FILE="$(mktemp -u)"
export GIT_INDEX_FILE
trap 'rm -f "$GIT_INDEX_FILE"' EXIT
find "$shots" -type f -name '*.png' | while read -r file; do
  git update-index --add --cacheinfo \
    "100644,$(git hash-object -w "$file"),${file#"$shots"/}"
done

tree="$(git write-tree)"
if git fetch --quiet origin "$ref" 2>/dev/null; then
  commit="$(git commit-tree "$tree" -p FETCH_HEAD -m "Screenshots for $branch")"
else
  commit="$(git commit-tree "$tree" -m "Screenshots for $branch")"
fi
git push --quiet origin "$commit:$ref"

cell() {
  if [ -f "$shots/$1/$2.png" ]; then
    echo "![$1 $2](https://raw.githubusercontent.com/$repo/$commit/$1/$2.png)"
  else
    echo "none"
  fi
}
for dir in "$shots"/*/; do
  name="$(basename "$dir")"
  printf '\n**%s**\n\n| | Before | After |\n|---|---|---|\n' "$name"
  echo "| Desktop | $(cell "$name" before-desktop) | $(cell "$name" after-desktop) |"
  echo "| Mobile | $(cell "$name" before-mobile) | $(cell "$name" after-mobile) |"
done
