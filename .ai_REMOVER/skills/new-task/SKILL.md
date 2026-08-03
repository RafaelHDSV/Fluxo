---
name: new-task
description: >-
  Recommends the best available board card for a developer (profile × Órion #18
  and Board Principal #26: Tarefa Pendente, no assignee). Use when the user runs
  /new-task, asks for próxima tarefa, card disponível, card para um DEV, or
  refresh-profile / atualizar perfil. Writes only local .perfils/ and
  .new-tasks/ — never assignee, comment, or status on GitHub.
---

# new-task — DEV → card disponível (read-only)

Inverso de [`triagem-tickets`](../triagem-tickets/SKILL.md) (ticket→pessoa): aqui a entrada é o **DEV** e a saída é o **melhor card** aberto e livre nos boards.

Seguir [`new-task-readonly`](../../rules/new-task-readonly.mdc) e [`git-github`](../../rules/git-github.mdc). **Nunca** escrever no GitHub neste fluxo.

## Locale

| Superfície | Idioma |
|------------|--------|
| Esta skill | **pt-BR** com acentos |
| Resposta no chat | **pt-BR** com acentos |
| Logins / paths GitHub | como no remoto |

## Quando usar

- `/new-task <dev>`, “próxima tarefa do X”, “card para o X”, “o que o X pode pegar”
- `/new-task refresh-profile <dev>`, “atualizar perfil do X”, “regenerar perfil”
- Cita skill `new-task`

## Quando não usar

- Ticket → responsável → `triagem-tickets`
- Review de PR → `pr-review`
- Implementar o card → ai-development-workflow / `.issues/` de produto
- Atribuir no board → **fora de escopo**; humano faz manualmente

---

## Golden rule (non-negotiable)

| Allowed | Forbidden |
|---------|-----------|
| Ler issues/PRs/projects via MCP / `gh` (read-only) | Assignee, comentário, labels, milestone |
| Criar/atualizar `.perfils/<login>.md` | Mudar Status no Project (`item-edit`, `projects_write`) |
| Criar `.new-tasks/<timestamp>-<login>.md` (Modo A) | Criar/editar/fechar issue no remoto |
| Resumo no chat + lembrete read-only | Qualquer write GitHub “porque a recomendação ficou clara” |

**Erro comum:** concluir o card ideal e atribuir/comentar — **proibido**. Só análise local.

---

## Roteamento de modos

Antes de qualquer análise, escolher o modo:

| Entrada | Modo |
|---------|------|
| `/new-task <dev>`, “próxima tarefa”, “card para o X” | **A — recommend** |
| `/new-task refresh-profile <dev>`, `/new-task --refresh-profile <dev>`, “atualizar/regenerar perfil do X” | **B — refresh-profile** |
| `/new-task <dev> --refresh-profile` | **A**, forçando rebuild do perfil **antes** dos boards |

Sem `<dev>` → **uma** pergunta objetiva. Não inventar login.

```
## Pedido new-task
- **Modo:** recommend | refresh-profile
- **Dev:** <nome, apelido ou login>
- **Flag:** --refresh-profile (opcional, só Modo A)
```

---

## Resolver identidade

1. Se já parece login GitHub (`cardosoGu`, `meirelleshugo`) → usar.
2. Senão, mapear apelido → login pelo **roster**: [`.claude/references/roster-agx.md`](../../references/roster-agx.md). É a fonte única; apelido de daily **não** é login (`adriano` é `abertanha`, `romulo` é `RomuuloGoncalves`).
3. Fallback: campo `aliases` dos próprios `.perfils/*.md`.
4. Login que não está no roster → **parar e perguntar**. Não inventar, e não tratar membro da org como dev do time: o roster lista 15 devs entre 32 membros.

Arquivo de perfil: `.perfils/<login>.md` (raiz do workspace `repos`).

---

## Modo B — refresh-profile

**Só perfil.** Não consulta boards. Não grava `.new-tasks/`.

Dois sub-modos. O padrão é o **incremental**; o bootstrap é para perfil novo ou quando se quer refazer a janela inteira.

| Invocação | Sub-modo | Janela buscada |
|-----------|----------|----------------|
| `refresh-profile <dev>` | incremental | `created:>=<updatedAt>` — só o delta |
| `refresh-profile <dev> --bootstrap` | bootstrap | 365 dias; **reseta** `historySince` |
| perfil ausente ou sem `historySince` | bootstrap | idem, automático |
| `refresh-profile --all [--bootstrap]` | lote | itera os 15 logins do roster |

```
new-task (refresh-profile):
- [ ] 1. Resolver login pelo roster
- [ ] 2. Ler .perfils/<login>.md: guardar ## Estilo de trabalho e ## Notas manuais
- [ ] 3. Decidir sub-modo (historySince presente? flag --bootstrap?)
- [ ] 4. Coletar PRs read-only na janela do sub-modo
- [ ] 5. Agregar e MESCLAR nos contadores existentes (nunca substituir no incremental)
- [ ] 6. Gravar; restaurar as duas seções escritas à mão
- [ ] 7. Chat: path + o que mudou; boards não consultados; nada no GitHub
```

### Fontes (read-only)

Dois scripts versionados no hub, rodados **da raiz do workspace**:

```bash
# 1. coletar (read-only) -> .perfils/.raw/<login>.json
node .claude/skills/new-task/scripts/collect-prs.mjs <login> <since> [until]

# 2. montar o markdown, preservando as seções escritas à mão
node .claude/skills/new-task/scripts/build-profile.mjs [login...]
```

`collect-prs.mjs` usa `gh api graphql` com `search(type: ISSUE)` e `is:pr author:<login> org:AGX-Software`. Escolha deliberada: GraphQL custa ~1 ponto por 100 PRs (5000/hora), enquanto a search REST dá **30 requisições/minuto** e estoura no lote — o bootstrap dos 15 devs sai por ~65 pontos. Acima de 1000 resultados o script fatia a janela por semestre, porque o teto da search API é 1000.

`build-profile.mjs` lê o JSON, mescla com o perfil que já existe e grava. Aceita `TODAY`, `HISTORY_SINCE`, `PERFILS_DIR` e `RAW_DIR` por variável de ambiente; sem elas, usa hoje e `<cwd>/.perfils`.

Saída da coleta: `repos`, `cards`, `ccScopes`, `termos`, `portPRs`, `mudancasLogicas`.

**Como o script mede** (importa para ler as tabelas):

- **Card** sai do título, que tem 6 convenções na org: `[7639] - [TICKET] …`, `[PRODUCTION] 7384 …`, `3470 …`, `fix(bhs): …`, `7614-fix(auth): …`, `… - #8522`.
- **Mudança lógica** = título distinto. O mesmo trabalho portado para 4 branches é 1 mudança, não 4.
- **PR de port** (`Main to Production`, `Merges X to Y`) é contado à parte: é volume, não atuação em feature.
- **Feature** exige atravessar 2+ cards ou 4+ repos. Termo de um título único não é feature — a tabela pode ficar vazia.

**Complementos locais:** `.claude/references/daily-standup-examples.md` e `analise-orion` se houver métricas. Servem para `## Estilo de trabalho`, não para os números.

### Merge incremental

```
delta        = PRs com created >= updatedAt
por repo:      PRs += delta;  Último PR = max(atual, delta)
por feature:   Mudanças += delta;  Evidência += cards novos
tarefas:       prepend(delta);  manter 25 mais recentes + "… e N anteriores"
prsNaJanela   += |delta|
updatedAt      = hoje
historySince   = INALTERADO
status         = |delta| > 0 ? ativo : inativo
```

Deduplicar por `<repo>#<número de PR>` e por número de card — rodar o refresh duas vezes seguidas tem de ser **no-op** na segunda.

### Chat (Modo B)

- Path: `.perfils/<login>.md` e sub-modo usado
- Diff resumido: PRs somados, repos que mudaram de posição, cards novos, mudança de `status`
- Aviso: próximo `/new-task <dev>` usará este cache (TTL 30 dias)
- No lote: quantos perfis foram feitos, quantos saltados, e `gh api rate_limit` ao fim

---

## Modo A — recommend

```
new-task (recommend):
- [ ] 1. Resolver login
- [ ] 2. Carregar ou montar perfil (.perfils/)
- [ ] 3. Listar boards 18 e 26 (read-only)
- [ ] 4. Filtrar Tarefa Pendente sem assignee
- [ ] 5. Ranquear → #1 + alternativas
- [ ] 6. Gravar .new-tasks/ + chat
- [ ] 7. Confirmar: nenhuma ação no GitHub
```

### 2. Perfil

| Condição | Ação |
|----------|------|
| Existe `.perfils/<login>.md`, `updatedAt` &lt; 30 dias, **sem** `--refresh-profile` | Ler cache; **não** rebuild |
| `updatedAt` &gt;= 30 dias, ou flag `--refresh-profile` | Refresh **incremental** (Modo B), depois seguir |
| Ausente, ou sem `historySince` | **Bootstrap** de 365 dias (Modo B), depois seguir |

Ler do perfil: `## Repositórios por atuação` e `## Features / áreas por atuação` (fit), `## Tarefas desenvolvidas` (continuidade), `## Notas manuais` (fit e anti-fit escritos à mão), e o campo `status`.

### 3–4. Boards (somente leitura)

Projects:

- [Equipe 3 - Órion #18](https://github.com/orgs/AGX-Software/projects/18)
- [Board Principal #26](https://github.com/orgs/AGX-Software/projects/26)

Preferência de dados:

1. MCP GitHub Toolbox — `projects_list` / get (**read**)
2. Fallback: `gh project item-list <N> --owner AGX-Software --limit 1000 --format json --query "…"`

Filtro alvo:

- Status: **`Tarefa Pendente`**
- Sem assignee (`no:assignee` / `assignees` vazio)
- Issue open

Deduplicar entre 18 e 26 por `content.number` (preferir URL do board).

**Não** usar `gh project item-edit`, `gh issue edit`, `gh issue comment`, nem MCP `issue_write` / `projects_write` / `add_issue_comment`.

### 5. Ranqueamento

Ordenar candidatos por:

1. **Fit** — casar título/labels/corpo do card com `## Features / áreas por atuação` e `## Repositórios por atuação`. Citar o número: "`core` 34 PRs", "NIO 75 mudanças". Fit por tabela vence fit por impressão.
2. **Continuidade** — card ligado a um card de `## Tarefas desenvolvidas` (mesmo número, ou escopo vizinho).
3. **Escopo** — preferir fechado (minor-fix) vs epic sem spec; cruzar com `## Estilo de trabalho`.
4. **Urgência** — labels/gravidade quando explícitas.
5. **Blockers** — descartar ou rebaixar se depende de outro DEV/ambiente externo sem progresso.
6. **Notas manuais** — `Bom fit` / `Evitar como primeira opção` são instrução humana explícita: respeitar acima dos números.

Ajustes obrigatórios:

- `status: inativo` no perfil → **não** recomendar. Dizer que o dev não tem PR na última janela e perguntar se ele voltou.
- `prsDePort` alto em relação a `prsNaJanela` (ex.: 68%) → o volume é release, não feature. Não inferir domínio a partir de contagem de PR bruta nesse caso; usar `Mudanças`.
- Perfil com `updatedAt` de mais de 30 dias e que não pôde ser atualizado → dizer a data e tratar o fit como indício, não como fato.

Entregar:

- **#1 recomendado** com justificativa
- **1–2 alternativas**
- **Descartados** curtos (por que não agora)

### 6. Artefato `.new-tasks/`

```text
.new-tasks/<YYYY-MM-DD-HH-MM-SS>-<login>.md
```

Template mínimo:

```markdown
# new-task — <Nome> (`<login>`)

| Campo | Valor |
|-------|--------|
| Data | … |
| Modo | recommend |
| Perfil | `.perfils/<login>.md` |
| Boards | 18, 26 |
| Filtro | Tarefa Pendente + sem assignee |

## Perfil (resumo)

…

## Candidatos fortes

| # | Card | Fit | Escopo | Notas |
|---|------|-----|--------|-------|

## Recomendação #1

…

## Alternativas

…

## O que não pegar agora

…

## Confirmação read-only

Nenhuma ação foi tomada no GitHub (sem assignee, comentário ou mudança de status).
```

### Chat (Modo A)

- Path do `.new-tasks/…`
- Recomendação #1 em 3–6 linhas
- Frase fixa: **nenhuma ação foi tomada no GitHub**

---

## O que esta skill não faz

- Não implementa o card
- Não atribui / comenta / move status
- Não consulta boards no Modo B
- Não regenera perfil em todo Modo A se o cache for fresco (salvo flag)
- Não usa outros project numbers salvo o usuário pedir explicitamente no pedido
