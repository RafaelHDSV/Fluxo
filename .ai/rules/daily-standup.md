---
description: >-
  When the user asks for daily, standup, or formatação da daily AGX, follow the
  skill daily-standup completely — read all three reference files, output every
  person from the draft, blank line between people, board-ready markdown only.
alwaysApply: false
---

# Daily AGX

Triggers: _daily_, _standup_, _formata a daily_, published board result to update references.

**Skill:** `.claude/skills/daily-standup/SKILL.md`

**Before output:** read `.claude/references/daily-standup-issues.md`, `daily-standup-patterns.md`, and `daily-standup-examples.md`.

**Hard rules:**

1. Include **every** person from the user draft — never a single-person or partial block.
2. First line `*DD/MM/YYYY*`; per person `**name**` + exactly 2 bullets (feito, plano).
3. **No blank lines** within a person block (date → name → bullets). **One blank line** between people (after plano, before next `**name**`).
4. Paste-ready markdown only — no intro or meta unless requested.
5. Match the canonical full example shape in the skill (see 26/06/2026).
6. **Discord ≤2000 hard** — count characters before delivering; if over, trim feito (never omit a person).
7. **Density balance** — similar feito weight per person (1–2 short sentences + one-sentence plano); no tiny vs long blocks on the same day. With 6 people, aim ≈280–320 chars per person block.
8. **Card lookup hard** — resolve every named card via issues table + GitHub before writing; never invent titles from product names alone; never leave known board cards as plain bold without link on first mention.

After the user publishes on the board, update the reference files — not the skill body.
