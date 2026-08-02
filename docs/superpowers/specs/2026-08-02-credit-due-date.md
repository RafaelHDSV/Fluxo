# Spec: data da compra + vencimento no crédito

**Data:** 2026-08-02  
**Status:** implementado

## Objetivo

Separar **data da compra** e **vencimento da fatura** em despesas de cartão, para que resultado, orçamentos e filtros de período usem o mês do vencimento.

## Modelo

| Campo | Significado |
|-------|-------------|
| `date` | Compra (crédito) ou lançamento (débito/receita) |
| `due_date` | Vencimento da fatura (só `payment_method = 'credit'`) |
| Data efetiva | `coalesce(case when credit then due_date end, date)` |

Histórico antigo sem `due_date` continua filtrando por `date`.

## Ciclo do cartão

Conta `credit_card` com `closing_day` + `due_day`:

1. Se `day(compra) <= closing_day` → fechamento no mês da compra; senão no mês seguinte.
2. `due_date` = primeiro `due_day` estritamente após o fechamento.

Exemplos (fecha 28, vence 10): 15/08 → 10/09; 30/08 → 10/10.

## API

- Create/update crédito: exige `card_account_id`; calcula `due_date` (override opcional no body).
- Listagem e relatórios: filtro/agregação pela data efetiva.

## UI

- Contas: fechamento + vencimento no cadastro de cartão.
- Transações: meio crédito → cartão + vencimento editável; listagem “compra · vence …”.

## Fora de escopo

- Migrar datas reais de compra do Notion.
- Import OFX/PDF de fatura de cartão.
