# cavecrew

> **Status: working in Claude Code and in Cursor.** The three agents live in `.claude/agents/` — one set of files, both tools.
>
> Cursor has had native subagents since v2.4 and scans `.claude/agents/` alongside `.cursor/agents/`, so no duplicate copy is needed. Do **not** re-create a mirror under `skills-lib/agents/`: that path is not scanned by either tool and only invites drift.
>
> They were **not** vendored from the upstream caveman pack — that source was never available in this repo. They were authored locally against the output contracts in [`SKILL.md`](./SKILL.md), so the contracts and the prompts must be kept in sync by hand.
>
> **Cursor differences to know about:**
>
> - `tools:` is a Claude Code field. Cursor ignores it and gives every subagent the parent's full toolset. Tool restriction in Cursor is the single boolean `readonly: true`, which `cavecrew-investigator` and `cavecrew-reviewer` both set. `cavecrew-builder` cannot use it — it has to edit — so its git prohibition is prompt-enforced there, not sandboxed.
> - `model: haiku` is a Claude Code alias. Cursor uses IDs like `composer-2.5` and `claude-opus-5`. If the pin fails to resolve in Cursor, read the exact ID off the model picker in Cursor Settings, or drop the line to inherit the parent's model.

Decision guide. When to delegate to caveman subagents instead of doing the work inline.

## What it does

Tells the main thread when to spawn a caveman-style subagent versus the vanilla equivalent. The win: subagent tool-results inject back into main context verbatim, and caveman output is roughly 1/3 the size of vanilla prose. Across 20 delegations in one session, that is the difference between context exhaustion and finishing the task.

Three subagents:

| Subagent | Job | Use when |
|----------|-----|----------|
| `cavecrew-investigator` | Locate code (read-only) | "Where is X defined / what calls Y / list uses of Z" |
| `cavecrew-builder` | Surgical edit, 1-2 files | Scope is obvious, ≤2 files. Refuses 3+ file scope. |
| `cavecrew-reviewer` | Diff/file review | One-line findings with severity emoji |

Use vanilla `Explore` or `Code Reviewer` when you want prose, architecture commentary, or rationale. Use main thread directly for one-line answers and 3+ file refactors.

This skill is a decision guide, not a slash command. It activates when the conversation mentions delegation.

## How to invoke

Triggers on phrases like "delegate to subagent", "use cavecrew", "spawn investigator", "save context", "compressed agent output".

## Example chaining

Locate → fix → verify (most common):

1. `cavecrew-investigator` returns site list (`path:line — symbol — note`)
2. Main thread picks 1-2 sites, hands paths to `cavecrew-builder`
3. `cavecrew-reviewer` audits the resulting diff

Parallel scout: spawn 2-3 `cavecrew-investigator` calls in one message with different angles (defs, callers, tests). Aggregate in main.

## Model overrides

By default, `cavecrew-reviewer` and `cavecrew-investigator` pin `model: haiku` in their frontmatter; `cavecrew-builder` has no `model:` line (uses the API session default). Set env vars in your shell before launching Claude Code to override per-agent:

| Env var | Agent |
|---|---|
| `CAVECREW_REVIEWER_MODEL` | `cavecrew-reviewer` |
| `CAVECREW_BUILDER_MODEL` | `cavecrew-builder` |
| `CAVECREW_INVESTIGATOR_MODEL` | `cavecrew-investigator` |

Example — run reviewer on sonnet, keep others on default:

```sh
export CAVECREW_REVIEWER_MODEL=sonnet
```

Use the same model name strings you'd use in any Claude Code agent frontmatter (e.g. `haiku`, `sonnet`, `opus`).

Overrides patch only the `model:` line in the installed agent's frontmatter; the prompt body is untouched and keeps receiving upstream updates. Plugin installs only — standalone hook installs have no local agent files to patch. Unset or blank = no change. The patch persists in the installed file until the plugin is updated or reinstalled.

## See also

- [`SKILL.md`](./SKILL.md) — full decision matrix and output contracts
- [`cavecrew-investigator.md`](../../../../.claude/agents/cavecrew-investigator.md) — locate code, `readonly`, `model: haiku`
- [`cavecrew-builder.md`](../../../../.claude/agents/cavecrew-builder.md) — 1-2 file edit, no model pin (session default)
- [`cavecrew-reviewer.md`](../../../../.claude/agents/cavecrew-reviewer.md) — diff review, `readonly`, `model: haiku`

`.claude/agents/` is the single live location, read by both Claude Code and Cursor.
