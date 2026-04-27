#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="${SERVICE_NAME:-clawmasters-mission-control}"
PORT="${PORT:-3020}"
HOST="${HOST:-127.0.0.1}"
NODE_BIN="${NODE_BIN:-$(command -v node)}"
OPENCLAW_STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
OPENCLAW_CONFIG_PATH="${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json}"
SERVICE_FILE="$HOME/.config/systemd/user/$SERVICE_NAME.service"

mkdir -p "$HOME/.config/systemd/user"

if [[ ! -f "$ROOT/.env" ]]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
fi

cat > "$SERVICE_FILE" <<SERVICE
[Unit]
Description=Clawmasters Mission Control
After=network.target

[Service]
Type=simple
WorkingDirectory=$ROOT
ExecStart=$NODE_BIN $ROOT/server/server.js
Restart=always
RestartSec=3
Environment=HOST=$HOST
Environment=PORT=$PORT
Environment=OPENCLAW_STATE_DIR=$OPENCLAW_STATE_DIR
Environment=OPENCLAW_CONFIG_PATH=$OPENCLAW_CONFIG_PATH
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
SERVICE

systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NAME"
systemctl --user restart "$SERVICE_NAME"

echo "Installed $SERVICE_NAME"
echo "Local URL: http://$HOST:$PORT"
echo "Check: systemctl --user status $SERVICE_NAME"
