# `.ai/` — hub centralizado de skills e rules

Fonte única de verdade para as configurações de IA do workspace. `.claude/`, `.cursor/` e `.opencode/` são **artefatos derivados**: `vieira ai build` as gera a partir daqui.

> **Não edite `.claude/`, `.cursor/` nem `.opencode/` à mão.** O próximo build sobrescreve. `vieira ai build --check` acusa quem editou.

## Fluxo

```
.ai/  (aqui)
  |  vieira ai build
  v
.claude/   .cursor/   .opencode/
  |  vieira ai push
  v
PERSONAL-Vieira/templates/ai/   ->  git  ->  vieira update --ai  ->  vieira ai  (outra máquina)
```

## Layout

| Caminho | Papel |
|---------|-------|
| `ai-hub.json` | Manifest: targets e transformações. Nunca é copiado para um target |
| `README.md` | Este arquivo. Nunca é copiado para um target |
| `rules/*.md` | Rules com frontmatter completo (`description`, `globs`, `alwaysApply`, `emit`) |
| `skills/<nome>/SKILL.md` | Skills, com nome canônico (`md-to-wiki`, não `wikis`) |
| `skills-lib/{caveman,stitch}/` | Packs de sub-skills, roteados por skill, não descobertos automaticamente |
| `agents/*.md` | Subagents cavecrew. Só vão para `.claude/` — o Cursor varre `.claude/agents/` nativamente |
| `references/*.md` | Insumos da daily |
| `perfil-rafael-vieira.md` | Perfil usado pela skill `perfil-rafael` |
| `targets/<ia>/` | Overlay **verbatim** de cada IA: `claude/CLAUDE.md`, `cursor/README.md`, `opencode/README.md` |

## Vocabulário canônico

O hub escreve na **forma Claude**, porque as transformações correm hub → Cursor/opencode:

| No hub | Vira no `.cursor`/`.opencode` |
|--------|-------------------------------|
| `mcp__stitch__*` | `stitch*:*` |
| `mcp__shadcn__*` | `shadcn*:*` + `mcp_shadcn*` |
| `WebFetch` | `web_fetch` |
| `AskUserQuestion` | `Question` |
| `` `Toolbox` (tools `mcp__Toolbox__*`) `` | `` `user-Toolbox` `` |
| `` `CLAUDE.md` § 1.3 `` | `` `git-github.mdc` `` |
| `.claude/` (auto-referência) | `.cursor/` / `.opencode/` |
| `skills/md-to-wiki/` | `skills/wikis/` |
| `rules/x.md` + frontmatter | `rules/x.mdc` + frontmatter |

`.claude/` é o **token de auto-referência**: escreva sempre `.claude/skills/...` ao apontar para a própria pasta de IA, e o build reescreve por target. A exceção é `.claude/agents/`, que é caminho real e cross-tool — está em `selfPathKeep` e sobrevive intacto.

## Adicionar uma skill

1. Criar `.ai/skills/<nome>/SKILL.md` com frontmatter `name` + `description`.
2. Se usar MCP, escrever os nomes na forma Claude (`mcp__servidor__*`) e conferir se o mapeamento existe em `ai-hub.json`; se não, adicionar em `targets['.cursor'].replace`.
3. `vieira ai build`.
4. Registrar no índice: `targets/claude/CLAUDE.md` (Parte 4) e `targets/cursor/README.md`.

## Adicionar uma rule

1. Criar `.ai/rules/<nome>.md` com frontmatter:

```yaml
---
description: >-
  Quando usar esta rule.
globs: '**/algum/**/*.ts'     # opcional
alwaysApply: false
emit: [cursor, opencode]      # opcional; ausente = todos os targets
---

# Título

Corpo.
```

2. Se `alwaysApply: true`, o texto também precisa entrar como seção em `targets/claude/CLAUDE.md` (Parte 1) e a rule deve declarar `emit: [cursor, opencode]` — no Claude ela vive inlinada no `CLAUDE.md`, não como arquivo em `rules/`.
3. `vieira ai build`.

O `.claude` não lê frontmatter de rule, então o build converte o frontmatter num blockquote de escopo abaixo do H1. Não escreva esse blockquote à mão: ele é gerado.

## `.opencode` hoje

O target `.opencode` herda a spec do `.cursor` (`extends`) e só troca `selfPath` e o overlay: sai com rules `.mdc`, `skills/wikis/` e vocabulário do Cursor. É o formato que essa pasta sempre carregou, agora gerado — o que já elimina a drift que existia (o `pr-review` estava uma feature atrás, faltava `new-task-readonly`, as references perderam um lote).

Emitir conveções opencode-nativas (`AGENTS.md` ou `opencode.json` com `instructions`, `command/*.md`, `agent/*.md`) é trabalho separado: exige pesquisar o formato atual do opencode e escrever um emitter novo, não portar o existente.

## Ordem das transformações

`ai-hub.json` → `replace[]` roda **na ordem declarada**, então regra específica vem antes da genérica (`` `stitch` (tools `mcp__stitch__*`) `` antes de `mcp__stitch__*`). Depois vem `selfPath`, depois o frontmatter da rule, e por último o overlay — que é sempre verbatim.

`\n` no campo `to` de um `replace` vira o EOL do arquivo, o que permite uma substituição virar duas linhas sem quebrar CRLF.

## Comandos

```bash
vieira ai build            # gera as três pastas
vieira ai build --cursor   # só um target
vieira ai build --check    # compara sem escrever; exit 1 se divergir
vieira ai                  # pull: traz hub + pastas do template
vieira ai push             # publica hub + pastas em templates/ai/ do PERSONAL-Vieira
```
