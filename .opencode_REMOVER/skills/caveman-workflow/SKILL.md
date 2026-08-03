---
name: caveman-workflow
description: >-
  Use when the user mentions caveman, /caveman, less tokens, terse output,
  caveman-commit, caveman-review, caveman-compress, cavecrew, or compressed agent
  output. Do not use for hub git commit (skill commit) or hub PR review into
  .reviews/ (skill pr-review).
---

# Caveman Workflow (meta-skill)

Sub-skills live in `.opencode/skills-lib/caveman/` (not auto-discovered). **Read the matching SKILL.md** before executing.

## Decision tree

| User intent | Read first |
|-------------|------------|
| Terse chat / “caveman mode” / less tokens / `/caveman` | [caveman/SKILL.md](../../skills-lib/caveman/caveman/SKILL.md) |
| Terse Conventional Commits message | [caveman-commit/SKILL.md](../../skills-lib/caveman/caveman-commit/SKILL.md) |
| Terse one-line PR / diff review comments | [caveman-review/SKILL.md](../../skills-lib/caveman/caveman-review/SKILL.md) |
| Compress CLAUDE.md / memory / prefs markdown | [caveman-compress/SKILL.md](../../skills-lib/caveman/caveman-compress/SKILL.md) |
| Quick reference of modes and commands | [caveman-help/SKILL.md](../../skills-lib/caveman/caveman-help/SKILL.md) |
| Delegate with compressed subagent output | [cavecrew/SKILL.md](../../skills-lib/caveman/cavecrew/SKILL.md) |
| Session token usage / savings (`/caveman-stats`) | [caveman-stats/SKILL.md](../../skills-lib/caveman/caveman-stats/SKILL.md) |

## Pipelines (chained)

**Long session, save context:** keep [caveman](../../skills-lib/caveman/caveman/SKILL.md) on the main thread; for locate / small edit / diff review, follow [cavecrew](../../skills-lib/caveman/cavecrew/SKILL.md) so tool results stay compressed.

**Unsure which mode:** show [caveman-help](../../skills-lib/caveman/caveman-help/SKILL.md) once, then load the matching sub-skill.

**Memory shrink:** [caveman-compress](../../skills-lib/caveman/caveman-compress/SKILL.md) only (scripts under that folder).

## Rules

- Follow the loaded sub-skill completely; do not skip steps it marks required.
- Scripts stay in each sub-skill folder under `skills-lib/caveman/` (notably `caveman-compress/scripts/`).
- Preserve the user’s dominant language; compress style, not language. Keep code, APIs, CLI, commit types, and exact errors verbatim.
- Deactivate caveman mode only on “stop caveman” / “normal mode”.
- `caveman-stats` depends on Claude Code hooks; in Cursor, say if stats cannot be computed and skip inventing numbers.
- For hub PR review into `.reviews/`, use skill `pr-review` — `caveman-review` is comment *style*, not the Vieira read-only PR workflow.
