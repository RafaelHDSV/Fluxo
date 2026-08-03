---
name: commit
description: >-
  Use when the user asks to commit, save changes with git commit, or write a
  commit message. Follow git-github rule; analyze diff and git log before committing.
---

# Git commit (workspace)

Follow [git-github.mdc](../../rules/git-github.mdc) first. **Only commit when the user explicitly asks.**

## Before committing

Run in parallel:

```bash
git status
git diff
git log -5 --oneline
```

- Do not commit `.env`, credentials, or secrets.
- Match commit message style to recent `git log` of the repo.
- Message: 1-2 sentences focused on **why**, not a file list.

## Branch safety

```bash
git branch --show-current
```

- Do not commit on `main`/`master` unless the user explicitly asked.
- Do not `git push --force` on `main`/`master`.
- Do not use `git commit --amend` unless user asked and commit was not pushed.
- Do not skip hooks (`--no-verify`) unless user asked.

## Commit command

Pass message via HEREDOC (PowerShell: equivalent safe quoting):

```bash
git add <relevant-files>
git commit -m "$(cat <<'EOF'
Why this change matters.

EOF
)"
git status
```

## Optional conventions

If the repo already uses conventional commits (`feat:`, `fix:`), follow that pattern. Do not impose Sentry-specific types or footers unless the repo already uses them.

## Issue references

If the user or branch names an issue (e.g. board `#7394`), mention it in the message when it helps traceability.

## After failed hook

If pre-commit hook fails: fix the issue and create a **new** commit — do not amend unless rules above allow it.
