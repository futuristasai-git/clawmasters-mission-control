#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

patterns=(
  'sk-[A-Za-z0-9_-]{20,}'
  'AIza[0-9A-Za-z_-]{20,}'
  'ghp_[0-9A-Za-z_]{20,}'
  'github_pat_[0-9A-Za-z_]+'
  'xox[baprs]-[0-9A-Za-z-]+'
  'BEGIN (RSA|OPENSSH|PRIVATE) KEY'
)

for pattern in "${patterns[@]}"; do
  if git grep -n -E "$pattern" -- . ':!docs/RELEASE_CHECKLIST.md' ':!scripts/security-scan.sh'; then
    echo "Potential secret matched pattern: $pattern" >&2
    exit 1
  fi
done

if git grep -n -E '/Users/|/private/var/' -- . ':!docs/RELEASE_CHECKLIST.md' ':!scripts/security-scan.sh'; then
  echo "Potential local private path found." >&2
  exit 1
fi

echo "security scan ok"
