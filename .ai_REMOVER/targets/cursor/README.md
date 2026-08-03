# Cursor hub — workspace `repos/`

Central **rules**, **skills**, and **references** for the multi-repo workspace.

> **Generated folder — do not edit `.cursor/` by hand.**
>
> The single source is the **`.ai/`** hub: skills in `.ai/skills/`, rules in `.ai/rules/`, this file in `.ai/targets/cursor/README.md`. Run `vieira ai build` to regenerate `.claude/`, `.cursor/`, and `.opencode/`; `vieira ai build --check` flags manual edits. How to add a skill or rule: [`.ai/README.md`](../.ai/README.md).
>
> Rules here are `.mdc` with frontmatter, skills use the Cursor tool vocabulary (`stitch*:*`, `web_fetch`, `Question`), and `md-to-wiki` lands as `skills/wikis/` — all of that is produced from the hub by the transformations declared in `.ai/ai-hub.json`.

## Language policy

| Layer | Language |
|-------|----------|
| Hub instructions (rules, skills, README) | **English** (lower token cost) |
| Generated artifacts (daily, LinkedIn, `.issues/`, `.reviews/`, Vieira epics) | **pt-BR** unless specified |
| Board issue titles and daily few-shots in references | **pt-BR** (canonical board text) |

## Rules vs skills

| | **Rules** (`.mdc`) | **Skills** (`SKILL.md`) |
|---|-------------------|-------------------------|
| **When they apply** | Always (`alwaysApply`) or when working on scoped files (`globs`) | On demand — user request or `description` discovery |
| **Role** | Policies, constraints, stack patterns | Playbooks with defined deliverable (artifact or formatted text) |
| **Examples** | git, secrets, style, workflow in `.issues/` | daily, LinkedIn, PR review, Vieira epic |

## Structure

```
.cursor/
├── README.md                 # this file
├── rules/*.mdc               # fixed-scope rules (always-on or globs)
├── skills/*/SKILL.md         # discoverable hub skills
├── skills-lib/
│   ├── stitch/               # Stitch sub-skills (via stitch-workflow)
│   └── caveman/              # Caveman vendor pack (via caveman-workflow only)
├── skills-lock.json          # lockfile for npx skills (caveman)
├── references/               # long docs referenced by skills
│   └── roster-agx.md         # nickname -> GitHub login for the 15 team devs
└── perfil-rafael-vieira.md   # Rafael's hand-written dossier (voice/calibration)
```

### Two profile formats — do not mix

| File | What it is | Read by |
|------|-----------|---------|
| `.perfils/<login>.md` (workspace root, **not** in this folder) | **Operational**: repos, features and cards with numbers, per dev. Local cache written by `new-task`; 365-day bootstrap + 30-day incremental refresh | `new-task`, `triagem-tickets` |
| `perfil-rafael-vieira.md` (here) | **Calibration and voice**: Rafael's hand-written dossier. No login, no numbers, never regenerated | `perfil-rafael`, `linkedin-posts` |

Identity (nickname → login) lives in `references/roster-agx.md`. Only `new-task` writes `.perfils/`.

### Third-party packs (`skills-lib/`)

| Pack | Role | Discovery |
|------|------|-----------|
| `stitch/` | Sub-skills loaded only via `stitch-workflow` | Not auto-discovered |
| `caveman/` | Communication/compress/review pack from JuliusBrussee/caveman | Loaded only via `caveman-workflow` (no per-skill junctions) |

Canonical files live in `skills-lib/<pack>/`. After `npx skills add JuliusBrussee/caveman`, keep sources under `skills-lib/caveman/` and route through `caveman-workflow`.

## Rules (`rules/*.mdc`) — fixed scope

| Rule | alwaysApply | Globs | Role |
|------|-------------|-------|------|
| `ai-context.mdc` | yes | — | Read `docs/context.md` if present |
| `security-secrets.mdc` | yes | — | Never commit `.env`/tokens |
| `git-github.mdc` | yes | — | Commits/PR only on request; use `gh`; no AI attribution in commits/PRs |
| `pr-review-readonly.mdc` | yes | — | PR review → `.reviews/` only; no GitHub approve/comment |
| `writing-style-rafael.mdc` | no | — | pt-BR/EN voice (README, docs, LinkedIn, daily, `.issues/`) |
| `ai-development-workflow.mdc` | no | `current-task.md`, `.issues/**` | Gate: proposal before coding |
| `stack-vieira-front.mdc` | no | `templates/front/**`, `frontend/**` | Vieira front patterns |
| `stack-vieira-fullstack.mdc` | no | `templates/full-*/**`, `backend/**`, `frontend/**` | Vieira monorepo patterns |
| `daily-standup.mdc` | no | — | Full-team daily output when user asks daily/standup |

### GitHub overrides (not interchangeable)

| Intent | Example phrases | Effect |
|--------|-----------------|--------|
| Allow local git / remote write | `commit this`, `push`, `you may push`, `ignore git-github` | Lifts `git-github` primary lock for that action |
| Publish PR review on GitHub | `approve this PR`, `comment on the PR`, `ignore security locks` | Lifts `pr-review-readonly` (still needs explicit action) |
| Vague approval | `LGTM`, `go ahead`, `implement the plan` | Does **not** unlock commit, push, or GitHub review publish |

**User Rules tip:** prefer a short pointer to `.cursor/rules/git-github.mdc` instead of duplicating the full git/PR text in Cursor Settings.

## Discoverable skills (`skills/`)

| Skill | Trigger |
|-------|---------|
| `daily-standup` | Daily, standup, published board result (rule `daily-standup.mdc` reinforces full-team output) |
| `linkedin-posts` | LinkedIn post, course, certificate, launch |
| `especificacao-cards` | Epic / spec for GitHub Project Vieira |
| `pr-review` | Review PR → `.reviews/` (read-only) |
| `triagem-tickets` | Triagem de ticket/issue → recomendação de responsável (reads `.perfils/`) |
| `new-task` | Próxima tarefa de um DEV → card livre no board. Owns `.perfils/` (bootstrap 365d + incremental 30d) |
| `perfil-rafael` | Prioritization, scope, tone calibration (see `perfil-rafael-vieira.md`) |
| `frontend-design` | Local UI polish / Tailwind / `docs/DESIGN.md` **without** Stitch MCP |
| `stitch-workflow` | Stitch, Google design tool, upload mockup, code-to-design |
| `shadcn-ui` | Install/customize shadcn/ui components |
| `md-to-wiki` | Wiki, publish specs, MkDocs, Mermaid (format playbooks in `skills/wikis/references/`). Invoke name is `md-to-wiki` per `SKILL.md` frontmatter; the directory is still `skills/wikis/` |
| `commit` | User asks for commit / commit message |
| `skill-discovery` | Find external skill (skills.rest) |
| `caveman-workflow` | Caveman terse mode / compress — router into `skills-lib/caveman/`. The `cavecrew` sub-skill is **broken**: its three subagents were never vendored (see below) |
| `teach` | Stateful learning workspace (MISSION + lessons); manual invoke only (`disable-model-invocation`) |

### UI / DESIGN.md ownership

| Skill | Owns | Does not own |
|-------|------|--------------|
| `frontend-design` | Local aesthetic direction, anti-generic UI, `docs/DESIGN.md` without Stitch | Stitch MCP, mockup upload |
| `stitch-workflow` | Google Stitch MCP, screen gen, upload, code↔design | Pure local Tailwind polish without Stitch |
| `shadcn-ui` | Component install, registry, shadcn setup | Overall visual identity / Stitch |

Stitch sub-skills in `skills-lib/stitch/` — load via `stitch-workflow`.
Caveman pack in `skills-lib/caveman/` — load via `caveman-workflow` only; hub PR review stays `pr-review` (`.reviews/`); `caveman-review` is comment *style*.

**`cavecrew` does not work.** It routes to `cavecrew-investigator`, `cavecrew-builder`, and `cavecrew-reviewer`, but those agent files were never vendored — there is no `skills-lib/agents/` here and no `.claude/agents/` on the Claude side. This predates the Claude Code migration. Use `Explore` or the main thread instead. To restore it, vendor the three agent `.md` files from the upstream caveman pack.

## Quick flows

```
Daily AGX           -> daily-standup (+ references/daily-standup-*)
Review PR           -> pr-review
Ticket triagem      -> triagem-tickets (ticket -> pessoa; reads .perfils/)
Card para um DEV    -> new-task (pessoa -> card; owns .perfils/)
Vieira epic         -> especificacao-cards + Panorama
Code + proposal     -> ai-development-workflow (rule; globs .issues/)
Local UI / DESIGN   -> frontend-design
Stitch / Google UI  -> stitch-workflow
shadcn components   -> shadcn-ui
Spec wiki           -> md-to-wiki (dir: skills/wikis/)
Commit              -> ask commit (commit + git-github rule)
LinkedIn post       -> linkedin-posts
Calibrate profile   -> perfil-rafael
Terse / caveman     -> caveman-workflow
Learn a topic       -> teach (MISSION + lessons + learning-records)
```

## References (`references/`)

| File | Used by |
|------|---------|
| `daily-standup-issues.md` | AGX board issue table |
| `daily-standup-patterns.md` | Historical patterns post-board (English metadata) |
| `daily-standup-examples.md` | Full published examples (pt-BR fences) |

After publishing a daily on the board: update **references**, do not bloat the `daily-standup` skill.

**Daily pitfalls (26/06):** never output a single-person block — always date + every person from the draft, one blank line between people, paste-ready markdown only. Canonical shape: skill `daily-standup` § Canonical full example (26/06).

## Maintenance

- Hub instructions: English UTF-8; generated artifacts: pt-BR when applicable.
- New on-demand flow → **skill**; new policy or glob → **rule**.
- New Vieira project: fill `docs/context.md`.
- Do not duplicate hub in subprojects — this root workspace hub is enough.
- After template changes: sync to the active hub `.cursor/` at the Vieira repo root.

CLI docs: `docs/contexto.md` (Cursor IDE section).
