# Notion → Fluxo — design da importação (P0–P2)

**Data:** 2026-08-02  
**Pré-requisito:** [gap analysis](2026-08-02-notion-fluxo-gap-analysis.md)  
**Status:** implementado (carga one-shot em 2026-08-02: 1196 txs)

## Decisões

| Tema | Decisão |
|------|---------|
| Escopo | Schema + UI + categorias Notion + carga ~1.196 lançamentos |
| Destino | `user_id = f8eebe9e-d8a8-459f-807f-f0d6398251ae` |
| Crédito/Débito | `payment_method` ∈ {`debit`,`credit`}; conta Santander `checking` |
| Pago | `paid boolean` + filtro/view A Pagar |
| Orçamentos | Só categorias com gasto no mês corrente; limite = média dos 3 meses anteriores |
| Carga | One-shot (JSON dump + script); sem sync Notion no produto |
| Fora | Wishlist, dimensão Meses, conta cartão, Notion API no BFF |

## Schema

Migration `002_paid_payment_method`:

- `fluxo_transactions.paid boolean not null default true`
- `fluxo_transactions.payment_method text null check (in debit, credit)`
- `fluxo_transactions.source_ref text null` + unique `(user_id, source_ref)` where not null
- Seed de novos users: taxonomia Notion (expense) + Salário/Freelance (income)

## Mapeamento

| Notion | Fluxo |
|--------|-------|
| Ganhos / Gastos | `income` / `expense` |
| Débito / Crédito | `payment_method` |
| Pago | `paid` |
| Banco Santander | `fluxo_accounts` checking |
| Categorias | upsert por nome |
| page URL/id | `source_ref` (idempotência) |

## Pipeline

1. Dump Notion → `backend/scripts/data/notion-financeiro.json`
2. Aplicar migration 002
3. `tsx backend/scripts/import-notion.ts`
4. UI/BFF consomem campos novos

## Verificação

- Contagens ≈ 1196 / 157 income / 1039 expense
- Gastos credit ≈ 334, debit ≈ 705
- A Pagar filtra `expense` + `paid=false`
