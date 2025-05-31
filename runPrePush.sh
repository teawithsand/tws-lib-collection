#!/bin/bash
set -e

tmpfile=$(mktemp)

# Ensure the temp file is deleted on script exit
trap 'rm -f "$tmpfile"' EXIT

rush build

rush list --json > "$tmpfile"
paths=$(jq -r '.projects[].path' "$tmpfile")

for p in $paths; do
  echo "Running tests in $p"
  (cd "$p" && npm run pre-push-check)
done