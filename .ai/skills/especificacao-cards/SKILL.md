---
name: especificacao-cards
description: >-
  Use when the user asks for an epic, Vieira spec, spec card, or cites GitHub
  Project Vieira / Project 8. Do not use for .issues/ implementation proposals.
---

# Specification epic — GitHub Project Vieira

Skill **exclusive** to turn a **short overview** into a **complex development specification** ready to **copy and paste** as issue/epic on [Project Vieira](https://github.com/users/RafaelHDSV/projects/8/views/1).

**Canonical reference epic:** issue `#1` in `RafaelHDSV/PERSONAL-Vieira` (label `epic`) — body = structure of `docs/especificacao.md`.

**Out of scope:**
- Implementation proposal in `.issues/` (15 sections, per-file table, TS snippets) → rule `.claude/rules/ai-development-workflow.md`
- Coding, PR, commits, or automatic `docs/contexto.md` updates

**Project flow:**
```
Overview → [this skill] → epic body on GitHub (full spec)
       → epic approval
       → increments / partials → .claude/rules/ai-development-workflow.md → .issues/
```

---

## Trigger

Activate when user asks for: **epic**, **board specification**, **spec card**, **Vieira spec**, or cites Project 8 / GitHub epic.

**Never** mix this skill's output with a `.issues/` document in the same turn, unless explicitly asked for both artifacts separately.

---

## Input: epic overview

Normalize to this format. Required fields: **Título**, **Problema**, **Solução**, **Escopo da epic**.

```markdown
## Panorama
- **Título:** <nome da epic>
- **Versão alvo:** v1.0 | v1.1 | v2 | ...
- **Problema:** <por que existe>
- **Solução:** <o que o sistema passa a fazer>
- **Escopo da epic:** <comandos, módulos, templates, integrações>
- **Fora do escopo:** <bullets ou nenhum>
- **Referências:** <repos irmãos, epic #N, docs/especificacao.md>
- **Decisões já tomadas:** <tabela ou bullets numerados>
- **Fases (rascunho):** <opcional — nomes das fases>
- **Dúvidas:** <bullets ou nenhuma>
```

One round of questions if required fields missing. Do not expand before that.

---

## Output locale

**Epic body (section B): pt-BR** with accents (UTF-8). Use section headings in pt-BR as in the table below.

## Output: single copy-paste artifact

Deliver **only** in chat, in this order:

### A. Issue metadata (short block above markdown)

```
Título: <título da epic>
Repositório: RafaelHDSV/PERSONAL-Vieira
Labels: epic
Project: Vieira (https://github.com/users/RafaelHDSV/projects/8)
```

### B. Full epic body (markdown)

Follow **all** sections below. Mirror depth of epic `#1` / `docs/especificacao.md`: **product and architecture** spec, not PR checklist.

| Section | Required content |
|---------|------------------|
| **Cabeçalho** | H1 title, one-line blockquote, metadata: Versão, Data (today DD/MM/YYYY), Repositório, Uso, Referências |
| **1. Resumo executivo** | Paragraph + command/feature table + **Princípios** (bullets) |
| **2. Decisões registradas** | Table `# \| Tema \| Decisão` — include overview decisions; gaps → section 11 |
| **3. Visão do produto** | 3.1 Problema, 3.2 Solução (numbered steps), 3.3 Fora do escopo (bullets) |
| **4. Arquitetura** | Relevant directory tree + stack table + internal flow (ASCII or pseudocode) |
| **5. Especificação detalhada** | **One subsection per command/module** (5.1, 5.2...): Objetivo, Uso (`bash`), Prompts, Estrutura gerada, Tabelas incluir/excluir, Regras de destino, Critério de aceite |
| **6. Mecanismos compartilhados** | Engine, `{{}}` variables, terminal output — if applicable; else `Não se aplica` |
| **7. Instalação e distribuição** | How to install/update what the epic describes — if applicable |
| **8. Roadmap de implementação** | Phases with `[ ]`, day estimate per phase, total |
| **9. Critérios de aceite (epic completa)** | Grouped (CLI, front, full, cursor, update, geral...) with verifiable `[ ]` |
| **10. Riscos e mitigações** | Table |
| **11. Evolução futura (pós-versão)** | Bullets — backlog, not current scope |
| **12. Anexo** | Optional: diff vs reference (e.g. MedIT vs template), diagram, links |

Footer: `*Documento vivo — atualizar quando ...*`

---

## Detail level (epic vs implementation)

| Topic | This skill (epic) | ai-development-workflow (.issues) |
|-------|-------------------|-----------------------------------|
| Problem / solution / principles | Yes, full | 2-5 line summary |
| Commands and UX | Usage, prompts, folder structure | Behavior + files to change |
| Architecture | Repo, stack, global flow | New algorithm, fine pseudocode |
| Per-file changes | **No** (folder tree at most) | File/Type/Size table |
| TypeScript contracts | **No** (except product constants in decisions table) | Snippets and types |
| Unit test plan | e2e/manual acceptance in epic only | Detailed test plan |
| Approval / Status | Implicit on board | Section 15 with status |

---

## Content rules

1. **Do not invent** business rules: use overview, `docs/especificacao.md`, `docs/contexto.md`, and repo code for Vieira CLI epics.
2. For **Vieira CLI** epic, inherit documented principles unless overview contradicts:
   - skip existing; no Docker; no git commit/init in scaffolds
   - Yarn; Node >= 22; front port **3333** (v1.1+)
   - templates in `~/.vieira/templates/`; update via `PERSONAL-Vieira`
3. **Language:** pt-BR in epic body (accents OK on GitHub). UTF-8 accented pt-BR.
4. **Depth:** section 5 must be largest — each scope item at epic `#1` level (tables, bash examples, local acceptance).
5. **Questions:** list in section 11 (future evolution) or note at end of section 2 as "Decisão pendente #N" — repeat numbered in chat.

---

## After generating

Close chat with:

1. Reminder: paste section **B** in issue body; label `epic`; add to Project Vieira.
2. **Dúvidas em aberto** (if any).
3. One line: *"Para implementar um incremento desta epic, use `.claude/rules/ai-development-workflow.md` e gere `.issues/` — não implemente código neste fluxo."*

---

## Usage example

```
skill especificacao-cards

## Panorama
- Título: Vieira lib — scaffold de biblioteca TS
...
```

**Expected output:** metadata (A) + full epic sections 1-12 (B) — **no** `.issues/` file.

---

## Do not

- Generate `.issues/` or call it the "complete delivery" document.
- Summarize epic in 20 lines — value is paste once on GitHub.
- Duplicate the 15 sections of `.claude/rules/ai-development-workflow.md`.
- Implement code or ask for implementation approval (gate is in dev workflow).
