---
name: triagem-tickets
description: >-
  Use when the user pastes a GitHub issue/ticket URL, asks for triagem, assignee,
  "quem passa esse ticket", "para quem atribuo", or cites skill triagem-tickets.
---

# Triagem de tickets → recomendação de responsável

Skill de **triagem**: o usuário envia a **URL do ticket** (issue GitHub) e o agente devolve **quem é a pessoa ideal** para receber o ticket — com evidência e confiança.

Seguir [git-github.mdc](../../rules/git-github.mdc): **somente leitura** no remoto. **Não** atribuir (`assignee`), comentar, editar labels nem mover o card no board, salvo pedido explícito do usuário.

## Locale

| Superfície | Idioma |
|------------|--------|
| Esta skill (instruções) | **pt-BR** com acentos |
| Resposta no chat | **pt-BR** com acentos |
| Identificadores GitHub (login, paths) | como no remoto |

## Quando usar

- Usuário cola URL de issue / ticket (`github.com/.../issues/N`, board AGX, etc.)
- Pede triagem, assignee, “para quem passo”, “quem é o ideal”, “quem mexeu nisso”
- Cita `triagem-tickets`

## Quando não usar

- Review de PR → skill `pr-review`
- Daily / standup → skill `daily-standup`
- Implementar o ticket → fluxo de implementação (não esta skill)

## Entrada

Campo obrigatório: **Ticket**.

```markdown
## Pedido de triagem
- **Ticket:** <URL ou owner/repo#N>
- **Repo local:** <opcional — pasta no workspace se o clone existir>
- **Contexto extra:** <opcional — produto, ambiente, suspeita de causa>
```

Sem ticket → **uma** pergunta objetiva. Não inventar responsável sem alvo.

---

## Fluxo obrigatório

Copiar e marcar progresso:

```
Triagem:
- [ ] 1. Ler o ticket
- [ ] 2. Extrair área / arquivos / palavras-chave
- [ ] 3. Mapear PRs e commits ligados
- [ ] 4. Coletar sinais de autoria (causa / recente / volume)
- [ ] 5. Ler .perfils/ dos candidatos e checar o roster (do time? ativo?)
- [ ] 6. Aplicar regra de decisão
- [ ] 7. Responder no formato padrão
```

### 1. Ler o ticket

Preferência de dados (somente leitura):

1. MCP GitHub (`user-Toolbox`) — issue, comentários, timeline, PRs ligados
2. Fallback: `gh issue view <url> --comments --json ...`
3. Se houver clone local do repo de produto citado → `git log` / `git blame` no caminho relevante

Extrair:

- Título, corpo, labels, milestone
- Mentions, assignees atuais, autores de comentários técnicos
- Links para PRs, commits, outros issues, paths de arquivo, stack traces, nomes de tela/módulo
- Produto / repo alvo (ex.: `uxvision-web`, `core`, `indiky-server`, board → card que aponta para outro repo)

### 2. Extrair área / feature

Derivar **escopo de código** a partir do ticket:

- Paths explícitos (`src/...`)
- Nomes de componente, rota, endpoint, tabela, feature flag
- Termos do título/corpo (ex.: “composição contemplada”, “NF”, “Seller”)

Se o escopo ficar ambíguo → dizer o que falta e, se possível, listar **2–3 hipóteses** de área com o responsável de cada uma. Não chutar um único nome sem evidência.

### 3. Mapear histórico

No repo relevante (local ou via `gh` / API):

| Sinal | Como obter | O que responde |
|-------|------------|----------------|
| **Causa provável** | Commit/PR que introduziu o comportamento; `git blame` na linha/arquivo; PR revertido; “regression since …” | Quem **causou** o problema |
| **Mais recente** | `git log -n … -- <paths>` / últimos PRs merged na área | Quem **mexeu por último** |
| **Mais volume** | Contagem de commits/PRs na área (janela razoável, ex. 6–12 meses) | Quem **mais mexeu** na feature |
| **Contexto de card** | Assignees/histórico do board, autores de PRs linkados ao card | Quem já **carregou** o assunto |
| **Perfil** | [`.perfils/<login>.md`](../../../.perfils/README.md) — `## Features / áreas por atuação`, `## Repositórios por atuação`, `## Notas manuais` | O que a pessoa **domina hoje**, com número |

Ignorar bots (`dependabot[bot]`, `github-actions[bot]`, etc.) na recomendação, salvo se forem o único sinal (aí reportar e pedir humano).

### Quem é do time

O roster é [`.opencode/references/roster-agx.md`](../../references/roster-agx.md) — 15 devs entre os 32 membros da org. Não deduzir do nome do autor.

| Situação do autor | O que fazer |
|---|---|
| No roster, perfil `status: ativo` | Candidato normal |
| No roster, perfil `status: inativo` | **Não** recomendar como principal. Citar como dono histórico (com os números do perfil) e indicar sucessor por volume no mesmo repo/feature |
| Fora do roster (ex-membro, conta de serviço, externo) | Apontar que não é do time atual e sugerir sucessor por volume/recente. Não existe perfil para citar |

### Sem `.perfils/` na máquina

`.perfils/` é cache local e pode não existir. Nesse caso: seguir com arqueologia de git pura, **dizer no output que o sinal de perfil não estava disponível**, e sugerir `/new-task refresh-profile --all --bootstrap`. Não travar e não inventar perfil.

### 4. Regra de decisão (prioridade)

Aplicar **nesta ordem** — a primeira regra com evidência suficiente vence:

1. **Causador do problema** — se houver evidência clara de quem introduziu o bug/regressão (blame, commit bisectável, PR que quebrou o fluxo), **recomendar essa pessoa**.
2. **Mais recente na feature** — se não houver causador claro, quem alterou por último o escopo relevante.
3. **Maior volume na feature** — se “recente” for fraco (ex.: só um commit trivial de formatação) ou empatado, quem historicamente mais trabalhou na área.
4. **Empate / conflito** — explicar o conflito (ex.: causador ≠ dono atual da feature) e **desempatar com o perfil**, não devolver o critério ao humano:
   - Comparar `## Features / áreas por atuação` dos empatados: quem tem mais mudanças na área do ticket vence.
   - Comparar `## Repositórios por atuação`: quem tem mais atuação no repo do ticket.
   - `## Notas manuais` (`Bom fit` / `Evitar como primeira opção`) vence os números — é instrução humana explícita.
   - Sobrou empate real → **Recomendação principal** + **Alternativa** (1 pessoa) + o que falta para decidir.

**Ordem de precedência, não negociável:** a arqueologia de git (causador → recente → volume) é o sinal **primário**. O perfil desempata e filtra atividade; **não** inverte evidência clara de causador. Se o perfil apontar outra pessoa que o `git blame`, dizer os dois e explicar a divergência.

**Não** atribuir automaticamente no GitHub. Só **recomendar**.

### 5. Confiança

| Nível | Quando |
|-------|--------|
| Alta | Causa clara **ou** overlap forte recente + volume na mesma pessoa — **e** o perfil confirma a área |
| Média | Sinais convergentes, mas sem commit/PR inequívoco; ou perfil ausente/desatualizado |
| Baixa | Escopo vago, poucos commits, só comentários no board; ou perfil aponta outra pessoa que o blame |

Com confiança **baixa**, ainda assim sugerir alguém **e** o próximo passo de investigação (qual path olhar, qual PR reabrir).

Perfil **convergente** com a arqueologia sobe a confiança; **divergente** obriga a explicitar o conflito no output em vez de escolher em silêncio.

---

## Formato de resposta (obrigatório)

Resposta curta e acionável em pt-BR:

```markdown
## Triagem — <owner/repo#N ou título curto>

**Recomendação:** <Nome ou login>
**Confiança:** Alta | Média | Baixa
**Motivo principal:** <1–2 frases — regra que venceu: causa / recente / volume>

### Evidências
- **Causa:** <pessoa ou “não identificada”> — <evidência>
- **Mais recente:** <pessoa> — <PR/commit/data>
- **Mais volume:** <pessoa> — <resumo quantificado se possível>
- **Perfil:** <pessoa> — <área/repo com número, ex.: “NIO 75 mudanças, `core` 203 PRs”; `updatedAt`> | _perfil não disponível_
- **Área:** `<paths ou módulo>`

### Alternativa
- <pessoa> — <quando faria sentido>

### Próximo passo (triagem)
- <ex.: atribuir no board; pedir contexto de ambiente; abrir o PR #N>
```

Não inventar métricas (“87% dos commits”). Números só quando vierem do perfil ou de contagem real — citando a fonte e a data (`updatedAt`). Sem contagem real, usar linguagem qualitativa (“maioria dos PRs recentes na pasta X”).

---

## Travas

| Permitido | Proibido (sem pedido explícito) |
|-----------|----------------------------------|
| Ler issue, PRs, commits, blame | `gh issue edit` / assignee |
| Analisar clone local | Comentar no ticket |
| **Ler** `.perfils/` e o roster | **Escrever** `.perfils/` — quem escreve é só `new-task` |
| Recomendar no chat | Mover card no Project / board |
| Pedir URL/repo se faltar | Inventar responsável sem evidência |

Esta skill é **leitora** de `.perfils/`. Perfil velho ou ausente não autoriza gerar: sugerir `/new-task refresh-profile <dev>` ao usuário. Ver [`new-task-readonly`](../../rules/new-task-readonly.md).

Override de escrita no GitHub só com frase explícita do usuário (ex.: “pode atribuir no GitHub”, “ignore git-github para assignee”).

## Checklist final

- [ ] Ticket lido (não só o título)
- [ ] Área/feature identificada ou ambiguidade declarada
- [ ] Ordem causa → recente → volume aplicada, com o perfil só desempatando
- [ ] Autor conferido no roster (do time? `status` ativo?)
- [ ] Evidências citadas (PR, commit, path ou comentário) + linha de Perfil preenchida ou marcada como indisponível
- [ ] Resposta no formato padrão, pt-BR com acentos
- [ ] Nenhuma escrita no remoto nem em `.perfils/`
