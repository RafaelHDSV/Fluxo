# Design: vínculo transação ↔ caixinha

**Data:** 2026-09-07 (remodelado: transferência)

**Abordagem:** `goal_id` + `goal_direction` em **transferência** (`to_goal` = aporte, `from_goal` = resgate). Não usa despesa/receita — assim o movimento não infla Despesas; o **Saldo do mês** do dashboard cai no aporte e sobe no resgate.

## Decisões

| Tema | Decisão |
|------|--------|
| Tipo | Somente `type = transfer` |
| Destino | Caixinha **ou** conta destino — mutuamente exclusivos |
| Direção | `to_goal` (conta → caixinha) / `from_goal` (caixinha → conta) |
| Conta corrente | Move saldo (± amount conforme direção) |
| Caixinha | `current_amount` ± amount conforme direção |
| Despesas / receitas | Sem `goal_id` (API rejeita) |
| Relatórios | Transferência com caixinha **não** entra em Despesas; entra no **Saldo do mês** (aporte negativo). Cartão **não** entra no Saldo do mês (só caixa da corrente) |
| CRUD caixinha | Investimentos: criar, editar e excluir direto |
| OFX | Linha do extrato pode ser convertida para transferência + caixinha |

## Schema

- `009_transaction_goal_id.sql` — `goal_id`
- `010_goal_direction.sql` — `goal_direction` (`to_goal` \| `from_goal`)

## API

- Body: `goal_id`, `goal_direction` (default `to_goal` se houver goal)
- `transfer_account_id` e `goal_id` juntos → 400
- Listagem: `goal_id`, `goal_direction`, `goal_name`

## UI (Transações)

- Tipo **Transferência**: select Caixinha + Direção; Conta destino só se sem caixinha

## Fora de escopo

- UI de aporte direto em Investimentos
- Backfill de despesas antigas “Reserva…” → transfer
