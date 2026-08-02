# AI Development Workflow

> **Escopo (globs):** `**/current-task.md`, `.issues/**/*.md`
>
> **Quando:** Incremental feature workflow: understand task (current-task.md), consult docs and code, write proposal in .issues/, wait for explicit approval before implementing. Use for features, broad-scope fixes, or when user cites current-task.md or asks for an implementation proposal.

## Mandatory trigger

When the user **cites** `@current-task.md`, **attaches** `current-task.md`, or **`current-task.md`** is in conversation context, the assistant **must run the full workflow below** **before** writing code. Do not skip steps or start implementing without completing understanding, documentation, and planning as described.

The same workflow is **default behavior** for feature development in this workspace when the task involves code implementation.

## Context

Work with company code and documentation (application repos, `docs`, and current task in `current-task.md`). Goal: adherence to business rules, patterns, and architecture — not just "write code". Prioritize depth and accuracy.

## Required workflow

### 1. Task understanding

- Read `current-task.md` fully when it is the session focus or cited.
- Extract feature goal, business rules, technical requirements, and acceptance criteria.
- If anything is ambiguous, **ask before** implementing.

### 2. Documentation analysis

- Consult the repo or `docs`, `agx-docs.wiki`, `optimus`, and task-related documentation.
- Prioritize business rules, existing flows, and implementation patterns.
- Cross-check task scope with documentation and map impacts on other areas.

### 3. Existing code analysis

- Locate relevant repos and modules.
- Identify reusable components, services, hooks, utils, and architecture patterns.
- Avoid recreating what exists; follow project naming, structure, and organization.

### 4. Implementation planning

Before coding, define strategy, files to create or change, side effects, and dependencies. Complex tasks: split into smaller steps.

### 5. Proposal document and validation (mandatory gate)

Before any line of code, the assistant **must** produce a **detailed proposal document** and **wait for explicit user approval** before step 6. Without approval, **do not implement**.

#### 5.1. Where to save

- Create the file at `.issues/<YYYY-MM-DD>-<short-task-slug>.md` (create the folder if missing).
- When `current-task.md` is active, reference it at the top of the document.
- If the user asks to view inline in chat only, still save the file for history.
- **Required encoding for proposal files (`.issues/*.md`):**
  - Always save as **UTF-8** with **accented pt-BR** (cultured norm) for all narrative content.
  - Code identifiers, paths, and API names stay as in the project.

#### 5.2. Minimum document structure

The document must cover **all** sections below. When a section does not apply, write `Não se aplica` with justification — do not omit. **Use these section headings in pt-BR in the generated file.**

1. **Resumo executivo** — 2 to 5 lines with feature/fix goal and expected outcome.
2. **Contexto e referências** — link to `current-task.md`, board cards (`https://github.com/AGX-Software/board/issues/NNNN`), `agx-docs.wiki` pages, internal RFCs, or related PRs.
3. **Regras de negócio** — from docs and task, as a list, no invention. Mark gaps as **dúvida aberta**.
4. **Critérios de aceitação** — verifiable list (`[ ]`), mirroring task requirements and actual delivery.
5. **Análise do código existente** — repos, modules, components, services, hooks, utils reused or impacted, with file paths. Justify not recreating existing pieces.
6. **Arquitetura proposta** — text diagram or flow bullets (input, processing, persistence, output). Layers crossed (UI, service, API, DB, queue, etc.).
7. **Mudanças por arquivo** — table with columns `Arquivo`, `Tipo` (`criar` / `alterar` / `remover`), `Descrição da mudança`. Estimate change size.
8. **Contratos e tipos** — function signatures, interfaces, API schemas, payloads, DB models, relevant migrations.
9. **Impactos colaterais e dependências** — other screens, endpoints, integrations, jobs, permissions, _feature flags_, environments (`HML`, `prod`), affected teams.
10. **Plano de execução em etapas** — ordered sequence of _commits_ or PRs, lowest to highest risk, allowing incremental review.
11. **Riscos, _trade-offs_ e alternativas consideradas** — discarded paths and why.
12. **Plano de testes** — unit, integration, manual, regression scenarios. Cite test data and users or environments needed.
13. **Observabilidade e _rollback_** — logs, metrics, alerts, _toggles_, safe revert path.
14. **Dúvidas em aberto** — numbered questions for the user. Each with context, options considered, and decision impact.
15. **Aprovação** — final block with `Status: aguardando aprovação`, updated to `Aprovado em <data> por <usuário>` when the user approves.

#### 5.3. Q&A cycle

- Whenever there is ambiguity, missing rule, product decision, or relevant _trade-off_, the assistant **must ask before assuming**.
- Put questions in **Dúvidas em aberto** and summarize them numbered in chat for direct answers.
- Avoid trivial, repeated, or doc-answered questions. Exhaust `agx-docs.wiki`, `optimus`, `docs`, and code first.
- Group related questions in one block to reduce back-and-forth.
- After each user answer, **update the document** (rules, criteria, architecture, changes) and mark the question resolved with the recorded decision.
- Cycle continues until the user explicitly writes **"aprovado"**, **"pode implementar"**, or equivalent. Partial approval releases only the approved part.

#### 5.4. Chat output

When the first document version is ready, reply in chat with:

- Path to the created file.
- Short summary (up to 10 lines) of main decisions.
- Numbered **Dúvidas em aberto** list.
- A closing line asking for validation, e.g. _"Posso seguir para a implementação assim que você aprovar este documento ou responder às dúvidas acima."_ (pt-BR is fine in user-facing chat when the user writes in Portuguese).

### 6. Implementation

- Start only after explicit approval of the step 5 document.
- Follow the approved **Plano de execução em etapas** faithfully. Deviations require document update and new confirmation.
- Clean code aligned with the project: single responsibility, reuse, strong typing when applicable.
- Avoid hacks and improvised solutions.

### 7. Validation

- Acceptance criteria met, logic aligned with docs, no obvious regressions.
- Check step 5 document item by item before closing; mark `Status: implementado` at the end.
- Update `docs/context.md` if it exists with new content.
- Review before closing.

## Do not

- Code without full context.
- Ignore documentation or invent business rules without validation.
- Introduce new patterns without need.
- **Skip step 5**: never start implementation without proposal delivered and **explicitly approved**.
- Accumulate silent assumptions: when in doubt, ask and record in the document.

## Final goal

Deliverables integrated into the existing system, less rework and bugs, faster quality development.

## Principle

> "Is this implementation consistent with the rest of the system or does it create an isolated pattern?"

If isolated, revise.
