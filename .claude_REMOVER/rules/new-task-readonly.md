# new-task — read-only security lock

> **Sempre ativa** — vale em toda requisição.
> **Escopo:** ativada por descrição (sem globs).
>
> **Quando:** new-task security lock — skill new-task is analysis-only; never assignee, comment, or change board status on GitHub

Applies whenever the user runs **`/new-task`**, asks for **próxima tarefa / card para um DEV**, **refresh-profile / atualizar perfil**, or the agent follows skill **`new-task`**.

## Deliverables (local only)

| Modo | Artefato permitido |
|------|-------------------|
| **A — recommend** | `.new-tasks/<YYYY-MM-DD-HH-MM-SS>-<login>.md` (+ `.perfils/<login>.md` se cache miss ou `--refresh-profile`) |
| **B — refresh-profile** | **Somente** `.perfils/<login>.md` (não criar `.new-tasks/`; não consultar boards) |
| **B — `--all`** | `.perfils/<login>.md` para os logins do roster; nada além |

## Quem escreve `.perfils/`

**Só `new-task`.** Outras skills leem.

| Skill | Acesso a `.perfils/` |
|-------|----------------------|
| `new-task` | leitura e escrita |
| `triagem-tickets` | **leitura apenas** — perfil velho ou ausente não autoriza gerar; sugerir `/new-task refresh-profile <dev>` |

Perfil preserva `## Estilo de trabalho` e `## Notas manuais` em qualquer refresh. Roster de identidade: `.claude/references/roster-agx.md`.

## Forbidden (always)

Do **not** take any write action on GitHub in this skill — even if the analysis names a clear best card:

| Forbidden | Examples |
|-----------|----------|
| Assign | `gh issue edit --add-assignee`, MCP `issue_write` com assignees |
| Comment | `gh issue comment`, MCP `add_issue_comment` |
| Status / project fields | `gh project item-edit`, MCP `projects_write` |
| Create / close / edit issue | `gh issue create`, fechar card, mudar título/labels |
| "Helpful" follow-up writes | Atribuir "só pra facilitar", comentar a recomendação no card |

Recommendation text in `.new-tasks/*.md` is **for the human** — not permission to act on GitHub.

## Required chat confirmation

After finishing Modo A or B, state clearly that **no action was taken on GitHub**.

## Related

- Skill: `.claude/skills/new-task/SKILL.md` (gerada do hub `.ai/skills/new-task/`)
- Cache: `.perfils/` (schema e contrato de merge em `.perfils/README.md`)
- Roster: `.claude/references/roster-agx.md`
- Consumidora (leitura): `.claude/skills/triagem-tickets/SKILL.md`
- Artefatos: `.new-tasks/`
- Git policy: `CLAUDE.md` § 1.3
