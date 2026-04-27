# Public Release Checklist

Run this checklist before making the repository public.

## Code

```bash
node --check server/server.js
node --check server/check.js
node --check public/app.js
npm run check
npm run check:security
git diff --check
```

## Secret Scan

```bash
git grep -n -E '(sk-[A-Za-z0-9_-]+|AIza[0-9A-Za-z_-]+|xox[baprs]-|ghp_[0-9A-Za-z_]+|github_pat_)' -- .
git grep -n -E '(/Users/|/private/var/|BEGIN (RSA|OPENSSH|PRIVATE) KEY)' -- .
```

Expected result: no real secrets or local private paths in tracked files.

## Runtime Validation

```bash
npm start
curl http://127.0.0.1:3020/api/health
curl http://127.0.0.1:3020/api/mission
```

Then open:

```txt
http://127.0.0.1:3020
```

Check:

- Dashboard loads.
- Agents screen reflects the local OpenClaw installation.
- Org chart adapts to the detected agents.
- Cost coverage is visible.
- No browser console errors.

## Documentation

- `README.md` explains local and VPS installation.
- `docs/HOSTINGER_VPS.md` covers Hostinger/Ubuntu deployment.
- `SECURITY.md` explains what is read and what must not be committed.
- `docs/screenshots/` contains sanitized screenshots.

## Git Hygiene

```bash
git status --short
git ls-files
```

Do not publish ignored local files, logs, `.env`, OpenClaw private state, session JSONL files, or real user memory exports.
