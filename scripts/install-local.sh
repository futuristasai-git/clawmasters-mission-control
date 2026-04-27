#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

echo "Clawmasters Mission Control is ready."
echo "Run: npm start"
echo "Open: http://127.0.0.1:3020"
echo "macOS persistent service: scripts/install-mac-launchd.sh"
