# Clawmasters Mission Control

Open source Mission Control for learning and operating OpenClaw systems.

This project is designed for Clawmasters students: it starts in demo mode, then can connect read-only to a local OpenClaw installation.

![Clawmasters Mission Control dashboard](docs/screenshots/dashboard.png)

## Why this exists

OpenClaw becomes much easier to understand when students can see:

- agents and subagents;
- tasks and project progress;
- recurring jobs;
- memory and documents;
- cost/model usage;
- integrations with local OpenClaw and Claw3D status.

## Quick Start

```bash
cp .env.example .env
npm start
```

Open:

```txt
http://127.0.0.1:3020
```

No dependencies are required beyond Node.js 22+.

On macOS, install it as a persistent local service:

```bash
scripts/install-mac-launchd.sh
```

On a Hostinger VPS or other Linux server, use the systemd user service:

```bash
chmod +x scripts/install-linux-systemd.sh
scripts/install-linux-systemd.sh
```

Full VPS guide: [docs/HOSTINGER_VPS.md](docs/HOSTINGER_VPS.md).

Telegram/OpenClaw install prompt: [docs/TELEGRAM_INSTALL_PROMPT.md](docs/TELEGRAM_INSTALL_PROMPT.md).

Screenshots: [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md).

## Modes

- `demo`: works without OpenClaw and uses example data.
- `openclaw-readonly`: reads a local `openclaw.json` when available.

The app does not mutate OpenClaw in this first version. It reads local files and HTTP status only.

## Works With Different Student Setups

Each student can have different agent names and different OpenClaw structures. By default, Mission Control runs in dynamic mode:

- it reads whatever agents exist in the student's `openclaw.json`;
- it hides only internal IDs configured through `OPENCLAW_HIDE_AGENT_IDS`;
- it adapts the org chart to the detected agents;
- it does not require the instructor's agent names.

For cohorts that want a strict expected fleet, set:

```env
CLAWMASTERS_EXPECTED_AGENTS=Main,Research,Content,Ops
```

## Deployment Target

This repository is intended to be published on GitHub for Clawmasters students. The reference deployments are:

- local Mac mini for the instructor;
- Hostinger VPS or Ubuntu VPS for students;
- demo mode when OpenClaw is not installed yet;
- read-only OpenClaw mode when `~/.openclaw/openclaw.json` exists.

## Roadmap

- SQLite persistence.
- Richer task ingestion and editing workflows.
- Real cron/job history.
- Period filters for token/cost accounting.
- GitHub publishing workflow.
- Optional Claw3D/Office integration.
- Student template marketplace.

## Safety

Never commit `.env`, OpenClaw secrets, memory dumps, private logs, or local user paths.

See [SECURITY.md](SECURITY.md) and [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) before publishing.
