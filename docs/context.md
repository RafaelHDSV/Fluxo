# fluxo — contexto do projeto

> Contexto primario para assistentes de IA (regra `ai-context.mdc`). Atualize este arquivo ao evoluir o produto.

**Pacote:** `fluxo` | **Ano:** 2026

---

## Objetivo

Fluxo é um controle financeiro pessoal web: entradas, saídas, contas, categorias, importação CSV/OFX, orçamentos, metas, wishlist, contas a pagar e dashboard analítico com Apache ECharts. Resolve a falta de clareza visual e o excesso de cadastro manual em planilhas.

---

## Stack

| Camada | Tecnologia / nota |
|--------|-------------------|
| Front | React 18, Vite, TypeScript, Tailwind CSS + shadcn/ui, SASS legado residual, React Router, ECharts |
| Back | Node, Express 5 (BFF) |
| Banco / Auth | PostgreSQL via Supabase (tabelas `fluxo_*`) + Auth + RLS |
| Tooling | Yarn, Node 22+ |

---

## Portas e URLs (desenvolvimento)

| Servico | Porta / URL |
|---------|-------------|
| Front | http://localhost:3333 |
| API | http://localhost:3693 |

---

## Decisoes fixas

1. Auth obrigatória no MVP (Supabase e-mail/senha)
2. Express BFF + Supabase Postgres/Storage (não front-only)
3. Moeda BRL; Open Finance fora do MVP (issue #10 em discussion)
4. Gráficos: Apache ECharts
5. Estilo v1.1: Tailwind + shadcn/ui com tema dark/light (tokens de `docs/DESIGN.md`); toggle no shell
6. Wishlist em tabela dedicada `fluxo_wishlist` (não misturada com metas)
7. Listagens de transações paginadas (`limit`/`offset` + total)

---

## Links

| Tipo | URL |
|------|-----|
| Repositorio | https://github.com/RafaelHDSV/Fluxo |
| Epic / board | https://github.com/RafaelHDSV/Fluxo/issues/1 |
| Documentacao | `docs/especificacao.md`, `docs/DESIGN.md`, `docs/superpowers/` |
| Gap Notion → Fluxo | `docs/superpowers/specs/2026-08-02-notion-fluxo-gap-analysis.md` |
| Import Notion (P0–P2) | `docs/superpowers/specs/2026-08-02-notion-import-design.md` |
| Proposta sub-issues | `.issues/2026-08-02-fluxo-sub-issues-v1.1.md` |

---

## Fora de escopo

- Open Finance / Pluggy / Belvo (até decisão em #10)
- Notion API nativa no BFF (dumps/CSV + scripts one-shot)
- App mobile e multi-moeda

---

*Atualizado em 2026-08-02 — entrega sub-issues #2–#9 e #11–#13.*
