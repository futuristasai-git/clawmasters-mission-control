# Architecture

## Current v0.1

```txt
Browser UI -> Node HTTP server -> read-only OpenClaw adapter
```

The current version intentionally avoids dependencies so students can understand every line.

## Local Service

On macOS, `scripts/install-mac-launchd.sh` creates a LaunchAgent that runs the app on `127.0.0.1:3020`, starts it at login, and relaunches it if the Node process exits.

On Linux VPS environments, `scripts/install-linux-systemd.sh` creates a user-level systemd service with the same defaults. The recommended VPS posture is to bind to `127.0.0.1` and access the app through an SSH tunnel or a protected reverse proxy.

## Configuration

The server loads `.env` from the project root before reading runtime settings. Explicit environment variables still win over `.env` values.

```txt
HOST=127.0.0.1
PORT=3020
OPENCLAW_STATE_DIR=/home/student/.openclaw
OPENCLAW_CONFIG_PATH=/home/student/.openclaw/openclaw.json
OPENCLAW_HIDE_AGENT_IDS=skill-installer,lala
```

## API

- `GET /api/health`
- `GET /api/mission`
- `GET /api/integration`

The integration endpoint validates the detected OpenClaw fleet dynamically by default. If `CLAWMASTERS_EXPECTED_AGENTS` is set, validation becomes strict and checks that exact comma-separated list of agent names. It is read-only and does not expose secrets.

## Data Sources

1. Local OpenClaw config:
   - `OPENCLAW_CONFIG_PATH`
   - `OPENCLAW_STATE_DIR`
2. Demo data embedded in the server.

## Future

```txt
Browser UI
  -> API server
  -> SQLite
  -> OpenClaw adapter
  -> event stream
  -> optional integrations
```

Recommended future packages:

- `packages/openclaw-adapter`
- `packages/db`
- `packages/templates`
- `packages/workflows`
- `packages/ui`
