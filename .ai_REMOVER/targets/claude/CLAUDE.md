# Workspace `repos/` — instruções do hub

> **Arquivo gerado. Não edite `.claude/` à mão.**
>
> A fonte única é o hub **`.ai/`**: skills em `.ai/skills/`, rules em `.ai/rules/`, e este arquivo em `.ai/targets/claude/CLAUDE.md`. Rode `vieira ai build` para regerar `.claude/`, `.cursor/` e `.opencode/`; `vieira ai build --check` acusa edição manual. Como adicionar skill ou rule: [`.ai/README.md`](.ai/README.md).

> **Sobre este arquivo:** os cabeçalhos e as condições de escopo estão em pt-BR; **o corpo das regras foi preservado em inglês, verbatim**, conforme a política de idioma do hub (instruções em inglês = menor custo de token). Nada de conteúdo novo foi inventado.

## Política de idioma

| Camada | Idioma |
|--------|--------|
| Instruções do hub (regras, skills, README) | **Inglês** (menor custo de token) |
| Artefatos gerados (daily, LinkedIn, `.issues/`, `.reviews/`, epics Vieira) | **pt-BR** salvo indicação contrária |
| Títulos de issue do board e few-shots de daily nas references | **pt-BR** (texto canônico do board) |

---

# Parte 1 — Regras sempre ativas

Estas quatro regras eram `alwaysApply: true` no Cursor. Valem em **toda** requisição, sem exceção.

## 1.1 Project context

> Origem: `.cursor/rules/ai-context.mdc` (`alwaysApply: true`)

On every request, check for `docs/context.md` in the project.

If it exists, use its content as primary context to interpret, answer, or execute the task, unless explicitly told to ignore it.

Projects generated with Vieira CLI receive this file via `templates/common/docs/context.md`.

## 1.2 Security and secrets

> Origem: `.cursor/rules/security-secrets.mdc` (`alwaysApply: true`)

### Never commit

- `.env`, `.env.local`, `.env.*.local` with real values
- API keys, production JWT tokens, passwords, connection strings with credentials
- Credential manager files, `*.pem`, `id_rsa`, service account JSON
- Contents of `~/.vieira/` or user-local paths

### Vieira template standard

- Only **`.env.example`** with placeholders and documented variable names.
- Secrets configured manually after scaffold (`cp .env.example .env`).

### In code and logs

- Do not hardcode tokens; use `process.env` / `import.meta.env` with validation at startup when appropriate.
- Do not print `MONGO_URL`, `DATABASE_URL`, `JWT_SECRET` values in success logs.

### Private repository

- Vieira templates may include personal Cursor rules; keep the repo **private** if not reviewed for public release.

### If the user asks to commit a sensitive file

- Refuse and suggest `.gitignore` + `.env.example`; warn about leak risk.

## 1.3 Git and GitHub

> Origem: `.cursor/rules/git-github.mdc` (`alwaysApply: true`)

### Primary lock — GitHub writes

**Forbidden without explicit user request** (in the current message or documented override below):

| Action | Examples |
|--------|----------|
| Local commit | `git commit`, `git commit --amend` |
| Push / publish to remote | `git push`, `git push -u origin …` |
| Create repository | `gh repo create`, API `repos/{org}/{repo}`, scaffold that creates a repo in the org |
| Open PR / merge / close issue | `gh pr create`, `gh pr merge`, PR/issue comments |
| Change remote settings | Actions permissions, branch protection, GitHub secrets |

**Planning requests do not authorize writes.** Markdown-only deliverables (`.issues/`, `.cursor/plans/`, `docs/`, chat proposals) **do not** permit commit, push, remote branch, PR, or repository creation — even if the plan says "Phase 1: create repo" or "publish workflow".

**"Implement the plan"** authorizes **local** workspace changes only; it does **not** authorize commit, push, repository creation, or any GitHub write unless separately and explicitly requested (e.g. "commit this", "push", "create the repo in AGX").

### Commits

- **Do not create commits** unless the user explicitly asks. If ambiguous, ask first.
- Message: 1-2 sentences on **why**; match the repo's `git log` style.
- Do not use `git commit --amend` unless the user asks and the commit was not pushed.
- Do not skip hooks (`--no-verify`, `--no-gpg-sign`) unless explicitly requested.
- Never commit `.env`, credentials, tokens, or secret files (see § 1.2).

### No AI attribution in commits and PRs

When creating or drafting **commit messages** and **pull requests** (title, body, description), **never** identify Cursor, Claude, an AI model, an agent, or any automated assistant as author, co-author, or contributor.

Applies to: commits created by the agent, suggested commit messages, and any PR text (title, body, checklist, summary). Does **not** apply to chat replies, local docs, or non-git artifacts unless the user asks those texts to be commit/PR-ready.

| Forbidden | Examples |
|-----------|----------|
| Name the tool in the message | "Cursor", "Claude", "AI", "agent", "assistant", "LLM", "Copilot", model names |
| Git trailers / metadata | `Co-authored-by: …`, `Signed-off-by: …`, `Generated-by: …`, `Assisted-by: …` |
| Footers or disclaimers | "made with Cursor", "generated by AI", "AI-assisted", similar notes |
| Sign as the tool | Commit or PR signed in the name of any assistant |

Write commits and PRs as if authored **only by the human developer** of the repository. Focus on the **why** and the **impact** — never on which tool helped produce it. Commit playbook: skill `commit`.

> **Nota de migração:** esta regra **sobrepõe** o padrão do Claude Code de adicionar `Co-Authored-By: Claude …` em commits e `🤖 Generated with Claude Code` em PRs. Não adicionar essas linhas neste workspace.

### Push and branches

- **Do not** `git push` (including `-u origin`) without explicit user request.
- **Do not** `git push --force` on `main`/`master`; warn if the user asks.
- Do not create or delete **remote branches** (`git push origin …`, `git push --delete`) without explicit request.
- Do not update the user's `git config`.
- Avoid interactive commands (`git rebase -i`, `git add -i`).

### Repository creation — hard block

**Never** create a GitHub repository (personal account, `AGX-Software` org, or any other) without explicit override.

Includes, with no exception for "part of implementation":

- `gh repo create`
- GitHub MCP / repository creation API
- Templates or CLI that automatically provision a remote repo

If the user asks to create a repo, **stop** and follow [Conflict with this rule](#conflict-with-this-rule) before running any command.

### Pull requests and issues

- Use **`gh`** for PRs, issues, checks, and releases when the user asks for GitHub actions — **read-only** unless explicit write is requested.
- PR: bullet summary, test plan checklist; clear title.
- Do not open PRs or push to remote without explicit request.

### Conflict with this rule

When a request **conflicts** with this rule (e.g. "create the repository", "implement and publish", "push to production"), **do not** run the blocked action.

1. **Stop** before commit, push, `gh repo create`, or equivalent.
2. **State** which section of this rule would be violated (cite the section: e.g. *Repository creation*, *Push and branches*, *Primary lock*).
3. **Ask** whether the user wants to ignore this rule — use `AskUserQuestion` or a direct chat question.
4. Proceed only if the user responds **explicitly**, for example:
   - "ignore git-github" / "ignore git locks"
   - "you may create the repository" / "you may push" (specific to that action)

Vague phrases are **not** overrides: "implement the plan", "go ahead", "LGTM", "approved" (in `.issues/` or plan context) **do not** allow commit, push, or repo creation.

### PR review (read-only)

When reviewing PRs (skill `pr-review`), follow § 1.4 — always-on security lock:

- **Deliverable:** markdown only in `.reviews/<YYYY-MM-DD-HH-MM-SS>-<repo>-pr-<N>.md`
- **Forbidden:** approve, request changes, comment, merge, or any GitHub write — even if analysis is positive
- **Override:** only when the user explicitly ignores security locks or asks to publish on GitHub

Data chain: MCP preferred, `git` fallback on clone, final `gh` read-only.

### Vieira documentation flow

- Board epic spec: skill `especificacao-cards`.
- Incremental implementation: § 2.2 (AI Development Workflow) + `.issues/` + approval before coding — proposal approval **does not** replace explicit commit/push/repo request (see [Primary lock](#primary-lock--github-writes)).

## 1.4 PR review — read-only security lock

> Origem: `.cursor/rules/pr-review-readonly.mdc` (`alwaysApply: true`)

Applies whenever the user asks to **review PR(s)**, cites **skill `pr-review`**, or the agent follows the PR review workflow (`.reviews/` artifact).

### Single deliverable (one file per PR)

The **only** allowed outcome of a PR review session is one or more markdown files under `.reviews/`, with **at most one canonical file per PR**:

```
.reviews/<YYYY-MM-DD-HH-MM-SS>-<repo-slug>-pr-<N>.md
```

| Situation | Action |
|-----------|--------|
| No file for `<repo-slug>-pr-<N>` | **Create** a new timestamped file |
| One or more files already match `*-<repo-slug>-pr-<N>.md` | **Update in-place** the **newest** (highest timestamp in the filename); do **not** create another file for that PR |
| Legacy duplicates already on disk | Leave older files untouched unless the user explicitly asks to delete them |

The user reads these files and **manually** decides what to do on GitHub.

### Forbidden without explicit override

Do **not** take any write action on GitHub — even if the analysis concludes the PR is good or bad:

| Forbidden | Examples |
|-----------|----------|
| Approve PR | GitHub **Approve** review, `APPROVE` event, `gh pr review --approve` |
| Request changes | **Request changes** review, `gh pr review --request-changes` |
| Comment on PR | PR conversation comment, review summary comment, inline review comment |
| Merge / close / edit PR | `gh pr merge`, `gh pr close`, change title/body/labels |
| MCP GitHub writes | `github__pull_request_review_write`, merge/update/comment tools |

**Preliminary verdict** inside `.reviews/*.md` (`aprovar`, `request_changes`, etc.) is **analysis for the human reviewer only** — it is **not** permission to act on GitHub.

### Required chat confirmation

After saving `.reviews/` file(s), state clearly that **no action was taken on GitHub** and the user should use the markdown for manual review.

### Override (exception)

These locks stay in force **unless** the user **explicitly** says one of:

- ignore security locks / ignore travas de segurança / ignorar travas
- publish the review on GitHub / approve this PR / comment on the PR / request changes on GitHub

Vague approval in chat ("looks good", "LGTM") or a positive **preliminary verdict** in the artifact **does not** override this rule.

---

# Parte 2 — Regras condicionais

No Cursor estas regras tinham `alwaysApply: false` + `globs`/`description`, ou seja, **só carregavam no contexto certo**. Para preservar esse comportamento, o texto integral de cada uma está em `.claude/rules/`, e **você deve ler o arquivo indicado quando a condição abaixo for satisfeita** — antes de produzir a saída.

## 2.1 Ao escrever ou revisar texto user-facing (pt-BR/EN)

**Quando:** README, `docs/**`, posts de LinkedIn, daily standup, `.issues/**`, e-mails, descrições narrativas de PR/commit, ou quando o usuário pedir voz/tom/acentuação.

**Leia:** `.claude/rules/writing-style-rafael.md`

Pontos não negociáveis (verbatim):

- Use **Brazilian Portuguese (pt-BR)**. **Avoid European Portuguese** vocabulary and morphology.
- **Accents (mandatory):** in pt-BR user-facing text use **cultured pt-BR with correct diacritics** (ação, não, você, após, repositório, máquinas, então, versão, etc.). Do **not** omit accents for ASCII habit or convenience.
- Save text files as **UTF-8**. Avoid curly typographic quotes; prefer `"` or `'`.

## 2.2 Ao implementar features / mexer em `current-task.md` ou `.issues/**`

**Quando:** globs `**/current-task.md`, `.issues/**/*.md` — ou o usuário cita `@current-task.md`, pede proposta de implementação, feature, ou fix de escopo amplo.

**Leia:** `.claude/rules/ai-development-workflow.md`

Gate não negociável (verbatim):

> Before any line of code, the assistant **must** produce a **detailed proposal document** and **wait for explicit user approval** before step 6. Without approval, **do not implement**.

- Proposta em `.issues/<YYYY-MM-DD>-<short-task-slug>.md`, UTF-8, pt-BR acentuado, com as **15 seções obrigatórias** (títulos em pt-BR) descritas no arquivo.
- O ciclo só encerra quando o usuário escrever explicitamente **"aprovado"**, **"pode implementar"** ou equivalente. Aprovação parcial libera só a parte aprovada.

## 2.3 Ao mexer em front-end Vieira

**Quando:** globs `**/templates/front/**/*.{ts,tsx}`, `**/templates/front/**/vite.config.{ts,mts}`, `**/frontend/**/*.{ts,tsx}`, `**/frontend/**/vite.config.{ts,mts}`.

**Leia:** `.claude/rules/stack-vieira-front.md`

Essenciais (verbatim): Node >= 22 · **Yarn** · React 18+, TypeScript strict, Vite 7+, SASS · dev port **3333** · alias `@` → `src/`.

## 2.4 Ao mexer em monorepo full-stack Vieira

**Quando:** globs `**/templates/full-*/**/backend/**`, `**/templates/full-*/**/frontend/**`, `**/backend/**`, `**/frontend/**`.

**Leia:** `.claude/rules/stack-vieira-fullstack.md`

Essenciais (verbatim): Yarn na raiz · Node ESM + Express 5 + `tsx watch` · back port **3693** · `.env.example` only, never commit `.env` · dentro de `frontend/`, seguir também § 2.3.

## 2.5 Quando o usuário pedir daily / standup

**Quando:** o usuário disser *daily*, *standup*, *formata a daily*, ou trouxer resultado publicado no board para atualizar references.

**Leia:** `.claude/rules/daily-standup.md` **e**, antes de qualquer saída, os três arquivos de referência (`daily-standup-issues.md`, `daily-standup-patterns.md`, `daily-standup-examples.md`).

Hard rules (verbatim):

1. Include **every** person from the user draft — never a single-person or partial block.
2. First line `*DD/MM/YYYY*`; per person `**name**` + exactly 2 bullets (feito, plano).
3. **No blank lines** within a person block (date → name → bullets). **One blank line** between people (after plano, before next `**name**`).
4. Paste-ready markdown only — no intro or meta unless requested.
5. Match the canonical full example shape in the skill (see 26/06/2026).

## 2.6 Quando o usuário pedir card para um DEV, ou triagem de ticket

**Quando:** `/new-task`, *próxima tarefa*, *card para o X*, *refresh-profile*; ou triagem de ticket (`triagem-tickets`) que precise decidir responsável.

**Leia:** `.claude/rules/new-task-readonly.md` (é `alwaysApply: true` e já carrega em toda sessão) **e** `.perfils/README.md` antes de tocar em perfil.

Hard rules:

1. **Nenhuma escrita no GitHub** nesses fluxos — sem assignee, comentário, label ou mudança de status. Nem "porque a recomendação ficou clara".
2. **Só `new-task` escreve `.perfils/`.** `triagem-tickets` lê. Perfil velho não autoriza gerar: sugerir `/new-task refresh-profile <dev>`.
3. **Identidade vem do roster** (`.claude/references/roster-agx.md`), não do nome no board. 15 devs entre 32 membros da org.
4. **Arqueologia de git é o sinal primário** na triagem; o perfil desempata e filtra atividade, mas não inverte evidência de causador.
5. Autor fora do roster, ou perfil `status: inativo` → não recomendar como principal; citar como dono histórico e indicar sucessor.
6. Ao final, dizer explicitamente que **nenhuma ação foi tomada no GitHub**.

---

# Parte 3 — Overrides de GitHub (não intercambiáveis)

> Origem: `.cursor/README.md` § GitHub overrides

| Intenção | Frases de exemplo | Efeito |
|----------|-------------------|--------|
| Liberar git local / escrita no remoto | `commit this`, `push`, `you may push`, `ignore git-github` | Levanta o *primary lock* de § 1.3 para aquela ação |
| Publicar review de PR no GitHub | `approve this PR`, `comment on the PR`, `ignore security locks` | Levanta § 1.4 (ainda exige ação explícita) |
| Aprovação vaga | `LGTM`, `go ahead`, `implement the plan` | **Não** libera commit, push nem publicação de review |

---

# Parte 4 — Índice de skills e fluxos

> As 15 skills e os packs de `skills-lib/` vivem **uma vez** em `.ai/`. `vieira ai build` gera `.claude/skills/`, `.cursor/skills/` e `.opencode/skills/` aplicando as diferenças de plataforma declaradas em `.ai/ai-hub.json` (`mcp__stitch__*` → `stitch*:*`, `WebFetch` → `web_fetch`, caminhos, `md-to-wiki` → `wikis`). **Ao alterar um pack, alterar só o `.ai/`** — nunca os dois lados à mão.

| Fluxo | Skill |
|-------|-------|
| Daily AGX | `daily-standup` (+ `references/daily-standup-*`) |
| Review de PR → `.reviews/` (read-only) | `pr-review` |
| Triagem de ticket/issue (ticket → pessoa) | `triagem-tickets` (lê `.perfils/`) |
| Próxima tarefa de um DEV (pessoa → card) | `new-task` (dono de `.perfils/`) |
| Epic / spec do GitHub Project Vieira | `especificacao-cards` |
| Cherry-pick de PR para branches de ambiente | `cherry-pick-env-prs` |
| Código + proposta em `.issues/` | § 2.2 (regra, não skill) |
| UI local / Tailwind / `docs/DESIGN.md` sem Stitch | `frontend-design` |
| Stitch / Google design tool | `stitch-workflow` → `skills-lib/stitch/` |
| Componentes shadcn/ui | `shadcn-ui` |
| Wiki / publicar specs / MkDocs / Mermaid | `md-to-wiki` (no Cursor e no opencode a pasta sai como `skills/wikis/`) |
| Commit | `commit` (+ § 1.3) |
| Post de LinkedIn | `linkedin-posts` |
| Priorização / calibração de perfil | `perfil-rafael` (→ `perfil-rafael-vieira.md` na raiz da pasta de IA) |
| Modo terso / caveman | `caveman-workflow` → `skills-lib/caveman/` (sub-skill `cavecrew` → `.claude/agents/`) |
| Aprender um tópico | `teach` (invocação manual apenas) |
| Achar skill externa (skills.rest) | `skill-discovery` |

> **`cavecrew` funciona no Claude Code e no Cursor.** Os três subagents estão em `.claude/agents/` (`cavecrew-investigator`, `cavecrew-builder`, `cavecrew-reviewer`) — um único conjunto de arquivos: o Cursor varre `.claude/agents/` nativamente desde a v2.4. Não duplicar em `.cursor/agents/` nem em `skills-lib/agents/`.
>
> Não vieram do pacote caveman upstream — esse fonte nunca existiu neste repositório; foram escritos localmente contra os contratos de saída de `skills-lib/caveman/cavecrew/SKILL.md`. Ao mudar um contrato lá, atualizar o prompt do agente correspondente.
>
> Diferenças no Cursor: `tools:` é campo do Claude Code e é **ignorado** — lá o subagent herda todas as ferramentas do pai. A única restrição que o Cursor aplica é `readonly: true`, presente no `investigator` e no `reviewer`. O `builder` precisa editar, então não pode ser `readonly`: no Cursor ele tem Bash de verdade e a proibição de git (§ 1.3) é sustentada só pelo prompt. `model: haiku` é alias do Claude Code; se não resolver no Cursor, pegar o ID exato no seletor de modelo ou remover a linha.

## Perfis de desenvolvedor

Dois formatos, papéis distintos — não confundir:

| Arquivo | O que é | Quem lê |
|---------|---------|---------|
| `.perfils/<login>.md` | **Operacional**: repos, features e cards com número, por dev. Cache local, gerado por `new-task`, bootstrap de 365 dias + refresh incremental de 30 | `new-task`, `triagem-tickets` |
| `perfil-rafael-vieira.md` | **Calibração e voz**: dossiê do Rafael, escrito à mão, sem número e sem login | `perfil-rafael`, `linkedin-posts` |

Identidade (apelido → login) é o roster em `.claude/references/roster-agx.md`: 15 devs entre os 32 membros da org. Apelido de daily **não** é login. Só `new-task` escreve `.perfils/`; ver § 2.6.

## Propriedade de UI / DESIGN.md

| Skill | É dona de | Não é dona de |
|-------|-----------|---------------|
| `frontend-design` | Direção estética local, UI anti-genérica, `docs/DESIGN.md` sem Stitch | Stitch MCP, upload de mockup |
| `stitch-workflow` | Stitch MCP, geração de tela, upload, code↔design | Polish Tailwind puramente local |
| `shadcn-ui` | Instalação de componente, registry, setup shadcn | Identidade visual geral / Stitch |

---

# Parte 5 — Manutenção

**Toda edição acontece em `.ai/`.** `.claude/`, `.cursor/` e `.opencode/` são geradas por `vieira ai build` e qualquer alteração direta nelas é perdida no próximo build. Detalhes de layout, vocabulário canônico e ordem das transformações: [`.ai/README.md`](.ai/README.md).

| Quero… | Onde |
|--------|------|
| Nova skill | `.ai/skills/<nome>/SKILL.md` + entrada na Parte 4 deste arquivo e no `README.md` do Cursor |
| Nova rule | `.ai/rules/<nome>.md` com frontmatter (`description`, `globs`, `alwaysApply`, `emit`) + entrada na Parte 2 |
| Nova rule sempre ativa | idem, com `emit: [cursor, opencode]` + seção nova na Parte 1 deste arquivo |
| Mudar este arquivo | `.ai/targets/claude/CLAUDE.md` |
| Mudar o índice do Cursor | `.ai/targets/cursor/README.md` (e o par em `targets/opencode/`) |
| Novo nome de ferramenta MCP | `targets['.cursor'].replace` em `.ai/ai-hub.json` |
| Novo subagent | `.ai/agents/<nome>.md` — só vai para `.claude/agents/`, que o Cursor lê nativamente |

- Instruções do hub: inglês UTF-8; artefatos gerados: pt-BR quando aplicável.
- Novo projeto Vieira: preencher `docs/context.md`.
- Não duplicar o hub em subprojetos — este hub na raiz do workspace basta.
- Depois de editar o hub: `vieira ai build`, e `vieira ai push` para publicar em `templates/ai/` do PERSONAL-Vieira (commit e push seguem manuais, § 1.3).
- `vieira ai build --check` no início de uma sessão detecta pasta derivada editada à mão.
