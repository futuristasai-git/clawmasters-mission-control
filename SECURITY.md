# Security Policy

Clawmasters Mission Control is designed as a local, read-only dashboard for OpenClaw.

## What the App Reads

- `~/.openclaw/openclaw.json`
- `~/.openclaw/agents/*/sessions/*.jsonl`
- `~/.openclaw/cron/jobs.json`
- `~/.openclaw/workspace/tasks/index.json`
- `~/.openclaw/workspace/PROJETOS.md`
- `~/.openclaw/workspace/memory/*.md`
- `~/.openclaw/workspace/artifacts/*`

## What the App Does Not Do

- It does not write to OpenClaw files.
- It does not send data to third-party services.
- It does not require API keys.
- It does not need database credentials.

## Deployment Guidance

Recommended VPS setup:

- Bind to `127.0.0.1`.
- Access via SSH tunnel, Tailscale, Cloudflare Access, or a protected reverse proxy.
- Do not expose the dashboard publicly without authentication.
- Keep `.env` out of Git.

## Files That Must Never Be Committed

- `.env`
- OpenClaw config files with tokens
- session logs
- memory dumps
- private screenshots from a real production OpenClaw
- any file containing API keys, OAuth tokens, cookies, or personal data

## Reporting Issues

If you find a security issue, do not publish sensitive details in a public issue. Contact the project maintainer privately first.
