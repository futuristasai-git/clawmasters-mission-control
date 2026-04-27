# Hostinger VPS Install Guide

This guide is for Clawmasters students deploying Mission Control on a Linux VPS, such as Ubuntu on Hostinger.

## Requirements

- Ubuntu 22.04 or newer.
- Node.js 22 or newer.
- Git.
- OpenClaw installed on the same VPS, or demo mode if OpenClaw is not installed yet.

## 1. Clone

```bash
git clone https://github.com/futuristasai-git/clawmasters-mission-control.git
cd clawmasters-mission-control
```

If OpenClaw is connected to Telegram on the VPS, students can also use the guided prompt in [TELEGRAM_INSTALL_PROMPT.md](TELEGRAM_INSTALL_PROMPT.md).

## 2. Configure

```bash
cp .env.example .env
nano .env
```

Recommended private local setup:

```env
CLAWMASTERS_MODE=auto
HOST=127.0.0.1
PORT=3020
OPENCLAW_HIDE_AGENT_IDS=skill-installer,lala
# Defaults already use /home/YOUR_USER/.openclaw on a VPS.
# Uncomment only if your OpenClaw is in another location.
# OPENCLAW_STATE_DIR=/home/YOUR_USER/.openclaw
# OPENCLAW_CONFIG_PATH=/home/YOUR_USER/.openclaw/openclaw.json
```

Use `HOST=0.0.0.0` only if you understand the security tradeoff and have firewall/auth/proxy protection in front of the app.

## 3. Run Once

```bash
npm start
```

Open from the VPS itself:

```txt
http://127.0.0.1:3020
```

If you are using an SSH tunnel from your computer:

```bash
ssh -L 3020:127.0.0.1:3020 YOUR_USER@YOUR_VPS_IP
```

Then open:

```txt
http://127.0.0.1:3020
```

## 4. Install as a Service

```bash
chmod +x scripts/install-linux-systemd.sh
scripts/install-linux-systemd.sh
```

Check status:

```bash
systemctl --user status clawmasters-mission-control
```

View logs:

```bash
journalctl --user -u clawmasters-mission-control -f
```

Enable user services after logout, if needed:

```bash
sudo loginctl enable-linger "$USER"
```

## 5. Validate

```bash
npm run check
curl http://127.0.0.1:3020/api/health
```

Expected connected mode with OpenClaw:

```txt
openclaw-readonly
```

If OpenClaw is not installed yet, the dashboard falls back to demo data.

## Different Agent Names

Students do not need to use the instructor's agent names. Mission Control reads the local `openclaw.json` and adapts automatically.

Optional strict validation:

```env
CLAWMASTERS_EXPECTED_AGENTS=Main,Research,Content,Ops
```

Leave `CLAWMASTERS_EXPECTED_AGENTS` empty for the easiest student setup.

## Optional Model Prices

If your OpenClaw logs token usage but not provider cost, copy the example pricing file:

```bash
mkdir -p ~/.openclaw/workspace/config
cp config/model-prices.example.json ~/.openclaw/workspace/config/model-prices.json
nano ~/.openclaw/workspace/config/model-prices.json
```

Adjust values to the providers and models used by your VPS.

## Security Notes

- Do not commit `.env`.
- Do not expose this app directly to the public internet without a reverse proxy and access control.
- Do not place API keys in this repo.
- The current app is read-only: it reads OpenClaw local files and HTTP status checks, but does not mutate OpenClaw.
