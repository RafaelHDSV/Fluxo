---
name: daily-standup
description: >-
  Use when the user asks for daily, standup, formatação da daily AGX, or returns
  a published board result to update references.
---

# AGX daily (standup)

When the user asks for **daily**, **standup**, or team-format text, produce **Portuguese (pt-BR)** output following this skill.

## Mandatory workflow (do not skip)

1. **Read** [daily-standup-issues.md](../../references/daily-standup-issues.md), [daily-standup-patterns.md](../../references/daily-standup-patterns.md), and [daily-standup-examples.md](../../references/daily-standup-examples.md) **before** writing.
2. **Resolve every named card/task** in the draft **before** writing: match `daily-standup-issues.md`; if missing, search GitHub `AGX-Software/board` (`gh` or MCP) by title/keywords. Use the **official issue title**. Do **not** invent a card from a product name alone (_Indiky_, _PWA_, _TORQ_). If still unresolved after search: short descriptive text, **no** invented `#NNNN`.
3. **List every person** in the user draft (e.g. adriano, gueff, rob, vieira — plus fernanda, nicolas when present). The output **must include all of them**, in the same order as the draft.
4. **Never** deliver a partial daily: missing date, missing people, only one person, only feito without plano, or commentary instead of the board block.
5. **Output** only the board-ready markdown (date + all people + bullets). No preamble (_"Segue a daily"_), no postscript, no meta notes — unless the user explicitly asked for commentary.
6. When the user returns the **published board** text, update `daily-standup-patterns.md`, `daily-standup-examples.md`, or `daily-standup-issues.md` — **do not** bloat this skill.

## Pre-output checklist

Verify **every** item before sending:

- [ ] First line: `*DD/MM/YYYY*`
- [ ] **Every** person from the draft has a block: `**name**` + **exactly 2** bullets (feito + plano)
- [ ] **Layout:** no blank line between date, name, and bullets of the same person; **one** blank line between people (after plano, before next `**name**`)
- [ ] Feito bullet in **chronological** order (_de manhã_ → _à tarde_ → _depois_ → _ao final do dia_)
- [ ] Plano bullet starts with _Hoje pretende…_ / _Hoje está…_ / _Hoje o foco é…_ (or equivalent)
- [ ] First mention of each card/ticket: **link**. Repeats: **bold** short title only, no relink
- [ ] Every named card resolved (linked with official title, or confirmed absent after GitHub search)
- [ ] No semicolons (`;`)
- [ ] **≤2000 characters** total (Discord hard limit — count before delivering)
- [ ] **Similar density** across people (no 1-line block next to a 3–4-sentence block)

## Output locale

All board text: **pt-BR** with accents (cultured norm). Section labels below are the exact output format — keep them in Portuguese.

## Structure

- Date line: `*DD/MM/YYYY*`
- Per person: `**name**` lowercase (**adriano**, **fernanda**, **gueff**, **nicolas**, **rob**, **vieira**)
- **Layout:** data, nome e bullets da mesma pessoa **sem linha em branco** entre si; **uma** linha em branco entre o plano de uma pessoa e o `**nome**` da próxima
- **Two bullets** per person:
  1. **Feito** — **chronological** order when multiple activities
  2. **Plano** — _Hoje pretende…_ / _Hoje está…_ / _Hoje de manhã pretende…_
- **Chronology:** use _de manhã_, _à tarde_, _depois_, _ao final do dia_. Wrong: _fez X, Y e Z_ as parallel list.
- ***Ontem*:** only when the board publishes yesterday's work under today's header. If draft says _ontem_ but board puts it in today's **feito**, **do not** use *Ontem*.
- **Absence:** blockquote `>` immediately before `**name**`; with async submission, two bullets follow.
- **Concise version:** prioritize main delivery; omit inconclusive test details and dead ends unless the board keeps them. See patterns in reference.
- **Discord ≤2000 (hard):** count characters of the final markdown **before** delivering. If over, trim **feito** first — never omit a person. Drop secondary details (ajuda pontual, exploração de tools, anedotas) before main delivery.
- **Density balance:** every person gets similar feito weight (typically **1–2 short sentences** joined by _depois_ / _ao final do dia_) and a **one-sentence** plano. Forbidden: one person with a tiny bullet and another with 3–4 long sentences on the same day.
- **Budget by N:** with **6** people, aim ≈ **280–320** chars per person block (name + 2 bullets). With **5+**, compress harder; with **4**, slightly longer feito is fine if still ≤2000.

## Formatting

- **Card lookup (hard):** resolve issue number + official title before first mention; never invent titles from product names alone; never leave a known board card as plain bold on first mention.
- Card/ticket link **not bold** in link text. Label **Ticket** bold + `[Title](url)`.
- **GitHub board:** `[Title](https://github.com/AGX-Software/board/issues/NNNN)` ou `[#NNNN](url)` quando vários tickets forem listados juntos
- **Primeira menção** de cada card/ticket na daily: **link**. **Repetição** do mesmo card: só **negrito** (título curto), sem relink — vale **por card** e **no mesmo bullet** (ex.: primeiro card linkado, segundo só **Presentation PDF**)
- Products: **BEVI**, **ConeXia**, **SaaS**. Repos: `` `core` ``, `` `chat-web` ``, `` `indiky-server` ``. Environments: `` `HML` ``, `` `produção` ``.
- People in body: _Zarco_, _Gueff_, _Rob_, _Samira_, etc. (italic). Person header: lowercase (**gueff**).
- _Review_ / _feature review_ in italic when action noun.
- Translation block: first mention `[PRs de tradução](https://github.com/AGX-Software/board/issues/164)`.
- **Do not** use semicolon (;)
- Per-card/ticket/date patterns: see [daily-standup-patterns.md](../../references/daily-standup-patterns.md) (English metadata, pt-BR quoted output).

## Style

- Objective. **No** meta notes in board-pasted text.
- Cultured pt-BR with accents (rule `.claude/rules/writing-style-rafael.md`).
- Label **PRs de tradução** (plural).
- Consistent backticks in code.
- Third person in feito (_Começou o dia…_, _Realizou…_) even when the draft is first person.

## Canonical full example (required shape)

**Always** match this structure: date, then **every** person, blank line between people, two bullets each. Do **not** output a single-person fragment.

```markdown
*26/06/2026*
**adriano**
- Terminou algumas pendências do [Tesseract](https://github.com/AGX-Software/board/issues/7143) que já tinha iniciado, mas não finalizou completamente os pontos relatados na _feature review_. À tarde começou o card [Bloqueio de usuário por inatividade](https://github.com/AGX-Software/board/issues/7426) e conversou com a _Samira_ para mais especificações
- Hoje pretende seguir com o mesmo card

**gueff**
- Começou o dia abrindo os PRs do [Presentation PDF](https://github.com/AGX-Software/board/issues/7384) para `produção`. Depois foi testar o card [Pdf na emissão de NF](https://github.com/AGX-Software/board/issues/7410) em `HML`. Em seguida foi pro card [Importação de Leads para o Seller](https://github.com/AGX-Software/board/issues/7477)
- Hoje pretende continuar com o card **Importação de Leads para o Seller** fazendo ajustes e testes. Além disso, aguardar os testes do **Presentation PDF** em `produção`

**rob**
- Realizou o deploy de alguns PRs da **Órion** ([CND Line](https://github.com/AGX-Software/board/issues/3470), **Presentation PDF** e [Props faltantes em `locations`](https://github.com/AGX-Software/board/issues/7458)). Na tarefa de **Locations** descobriu que faltaram alterações no `indiky-server` e desenvolveu elas
- Hoje pretende focar no **SaaS**, fazendo integração com o front e ajustes do fluxo

**vieira**
- Começou o dia revisando os PRs e acompanhando as subidas dos 3 cards da **Órion** que subiram ontem. Depois de tudo revisado, voltou ao **SaaS**, mas teve que parar porque surgiram várias RCs no PR do **Presentation PDF** do _Nicolas_. Em paralelo, também se preparou para a gravação que tinha no final do dia e, ao final do dia, fez a gravação
- Hoje o foco é o **SaaS**, fazendo a integração do back e front
```

More published examples: [daily-standup-examples.md](../../references/daily-standup-examples.md).
