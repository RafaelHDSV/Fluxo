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
7. Orçamentos = categorias + metas de gasto; **regras de nome e categoria ficam em Importações**
8. Investimentos = ex-Metas (`fluxo_goals`) — caixinhas com progresso
9. Notion foi carga inicial histórica; **não é fonte operacional**
10. **Saldo das contas** é a âncora (editável; OFX pode atualizar via `LEDGERBAL`). Saldo inicial do mês corrente = saldo atual − movimento do mês até hoje — **não** a soma histórica do Notion
11. Importação: preview aplica regras de rename → categoria; **stepper** revisa descrição/categoria das linhas novas antes do commit
12. **Crédito:** `date` = data da compra; `due_date` = vencimento da fatura (ciclo `closing_day` + `due_day` do cartão). Resultado, orçamentos e filtros de período usam a data efetiva (`coalesce` do vencimento no crédito). Histórico antigo sem `due_date` continua em `date`

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

*Atualizado em 2026-08-02 — crédito com data de compra + vencimento.*
