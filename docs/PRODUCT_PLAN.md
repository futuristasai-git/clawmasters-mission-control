# Product Plan

## Product

Clawmasters Mission Control is a public, student-friendly dashboard for turning OpenClaw into an understandable operating system.

## Core principle

Do not copy someone else's Mission Control. Teach students how to create their own.

## Personas

- Beginner student: wants a visual map of agents and tasks.
- Operator: wants to run OpenClaw daily with confidence.
- Builder: wants to create custom workflows, automations, integrations, and subagents.

## Modules

1. Dashboard
2. Agent Command Center
3. Task Board
4. Calendar / Cron
5. Projects
6. Content Pipeline
7. Memory Journal
8. Docs Library
9. Team / Org Chart
10. Cost & Model Tracker
11. Integration Hub

## MVP Acceptance Criteria

- Runs locally without external services.
- Has demo mode.
- Reads local OpenClaw config when present.
- Displays a complete student-facing UI.
- Escapes local OpenClaw text before rendering it in the browser.
- Shows pricing coverage from `workspace/config/model-prices.json`.
- Ships with docs and examples.
- Can be safely published to GitHub.
