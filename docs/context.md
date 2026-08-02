# fluxo — contexto do projeto

> Contexto primario para assistentes de IA (regra `ai-context.mdc`). Atualize este arquivo ao evoluir o produto.

**Pacote:** `fluxo` | **Ano:** 2026

---

## Objetivo

Fluxo é um controle financeiro pessoal web: entradas, saídas, contas, categorias, **importação mensal OFX (Santander)**, orçamentos por categoria, investimentos (caixinhas), wishlist, contas a pagar e dashboard/relatórios com Apache ECharts.

---

## Stack

| Camada | Tecnologia / nota |
|--------|-------------------|
| Front | React 18, Vite, TypeScript, Tailwind + shadcn/ui, React Router, ECharts, Lucide |
| Back | Node, Express 5 (BFF) |
| Banco / Auth | PostgreSQL via Supabase (`fluxo_*`) + Auth + RLS |
| Tooling | Yarn, Node 22+ |

---

## Portas e URLs (desenvolvimento)

| Servico | Porta / URL |
|---------|-------------|
| Front | http://localhost:3333 |
| API | http://localhost:3693 |

---

## Decisoes fixas

1. Auth obrigatória (Supabase e-mail/senha)
2. Express BFF + Supabase Postgres
3. Moeda BRL; **Open Finance fora** (custo de agregador)
4. Gráficos: Apache ECharts
5. Tailwind + shadcn com tema dark/light
6. **Entrada de dados mensal:** OFX da conta Santander (Money 2000+); CSV/OFX genérico também
7. Orçamentos = categorias + metas de gasto + regras de categorização (auto-sugestão na importação)
8. Investimentos = ex-Metas (`fluxo_goals`) — caixinhas com progresso
9. Notion foi carga inicial histórica; **não é fonte operacional**

---

## Links

| Tipo | URL |
|------|-----|
| Repositorio | https://github.com/RafaelHDSV/Fluxo |
| Epic | https://github.com/RafaelHDSV/Fluxo/issues/1 |
| Specs | `docs/superpowers/specs/` |
| Proposta v1.2 | `.issues/2026-08-02-fluxo-v1.2-ux-import.md` |

---

## Fora de escopo

- Open Finance / Pluggy / Belvo
- Parser de PDF consolidado / fatura cartão automática (follow-up)
- Notion API / sync contínuo
- App mobile e multi-moeda

---

*Atualizado em 2026-08-02 — v1.2 UX + OFX Santander.*
