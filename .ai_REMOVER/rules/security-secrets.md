---
description: Secrets, .env, and sensitive data — never commit credentials
alwaysApply: true
emit: [cursor, opencode]
---

# Security and secrets

## Never commit

- `.env`, `.env.local`, `.env.*.local` with real values
- API keys, production JWT tokens, passwords, connection strings with credentials
- Credential manager files, `*.pem`, `id_rsa`, service account JSON
- Contents of `~/.vieira/` or user-local paths

## Vieira template standard

- Only **`.env.example`** with placeholders and documented variable names.
- Secrets configured manually after scaffold (`cp .env.example .env`).

## In code and logs

- Do not hardcode tokens; use `process.env` / `import.meta.env` with validation at startup when appropriate.
- Do not print `MONGO_URL`, `DATABASE_URL`, `JWT_SECRET` values in success logs.

## Private repository

- Vieira templates may include personal Cursor rules; keep the repo **private** if not reviewed for public release.

## If the user asks to commit a sensitive file

- Refuse and suggest `.gitignore` + `.env.example`; warn about leak risk.
