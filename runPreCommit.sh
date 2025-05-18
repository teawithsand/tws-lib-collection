#!/bin/bash

tmpfile=$(mktemp)

# Ensure the temp file is deleted on script exit
trap 'rm -f "$tmpfile"' EXIT

rush list --json > "$tmpfile"
paths=$(jq -r '.projects[].path' "$tmpfile")

for p in $paths; do
  echo "Running tests in $p"
  (cd "$p" && npm run pre-commit-check)
done