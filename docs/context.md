# fluxo — contexto do projeto

> Contexto primario para assistentes de IA (regra `ai-context.mdc`). Atualize este arquivo ao evoluir o produto.

**Pacote:** `fluxo` | **Ano:** 2026

---

## Objetivo

Fluxo é um controle financeiro pessoal web: entradas, saídas, contas, categorias, importação CSV/OFX, orçamentos, metas e dashboard analítico com Apache ECharts. Resolve a falta de clareza visual e o excesso de cadastro manual em planilhas.

---

## Stack

| Camada | Tecnologia / nota |
|--------|-------------------|
| Front | React 18, Vite, TypeScript, SASS, React Router, ECharts |
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
3. Moeda BRL; Open Finance fora do MVP
4. Gráficos: Apache ECharts
5. Estilo: SASS (sem Tailwind na v1)

---

## Links

| Tipo | URL |
|------|-----|
| Repositorio | https://github.com/RafaelHDSV/Fluxo |
| Epic / board | https://github.com/RafaelHDSV/Fluxo/issues/1 |
| Documentacao | `docs/especificacao.md`, `docs/DESIGN.md`, `docs/superpowers/` |

---

## Fora de escopo

- Open Finance / Pluggy / Belvo
- Notion API nativa (apenas CSV export)
- App mobile e multi-moeda

---

*Atualizado no MVP Fluxo (2026-08-02).*
