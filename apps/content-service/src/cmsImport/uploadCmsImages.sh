#!/usr/bin/env bash
# Copies the Webflow images listed in cmsImages.tsv to the resources bucket
# (served at https://resources.vexl.it). Safe to re-run.
# Usage: ./uploadCmsImages.sh <bucket-name>   (uses your usual aws cli credentials)
set -euo pipefail

bucket="${1:?Usage: $0 <bucket-name>}"
manifest="$(dirname "$0")/cmsImages.tsv"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

while IFS=$'\t' read -r source key; do
  content_type="$(curl -fsSL -o "$tmp/file" -w '%{content_type}' "$source")"
  aws s3 cp "$tmp/file" "s3://$bucket/$key" \
    --content-type "$content_type" \
    --cache-control 'public, max-age=31536000, immutable' \
    --only-show-errors
  echo "uploaded $key"
done < "$manifest"

while IFS=$'\t' read -r _ key; do
  curl -fsS -o /dev/null "https://resources.vexl.it/$key" || echo "NOT SERVED: $key"
done < "$manifest"
