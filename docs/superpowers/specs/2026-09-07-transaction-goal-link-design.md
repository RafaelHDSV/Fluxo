# Spec: vínculo transação ↔ caixinha (investimento)

**Data:** 2026-09-07  
**Status:** implementado  
**Abordagem:** `goal_id` na transação (despesa = aporte, receita = resgate)

## Objetivo

Permitir que um lançamento no Santander (manual ou OFX) seja vinculado a uma **caixinha** (`fluxo_goals`), atualizando `current_amount` automaticamente.

Fluxo mental do usuário: origem conta corrente ↔ destino/origem investimento, sem baixar o saldo do banco **duas vezes** quando o extrato OFX já refletiu a aplicação/resgate.

## Decisões fechadas

| Tema | Decisão |
|------|----------|
| Saldos no aporte/resgate manual | Conta **e** caixinha se movem (criar despesa/receita já com efeito de caixa atual) |
| OFX | A linha do extrato **é** o movimento; vincular `goal_id` depois só move a caixinha |
| Resgate | Sim, no mesmo modelo (`income` + `goal_id`) |
| Marcar pago | Continua **sem** alterar saldo da conta (regra vigente) |
| Caixinha sobe/desce | Ao salvar com `goal_id`, **independente** de `paid` |
| Resgate > saldo da caixinha | **Bloquear** (400) |
| Aporte via UI Investimentos | Fora: o aporte é a transação |

## Modelo de dados

Migration `009_transaction_goal_id.sql`:

```sql
alter table public.fluxo_transactions
  add column if not exists goal_id uuid references public.fluxo_goals (id) on delete set null;

create index if not exists fluxo_transactions_user_goal_idx
  on public.fluxo_transactions (user_id, goal_id)
  where goal_id is not null;
```

`fluxo_goals.current_amount` permanece coluna materializada, atualizada no write path das transações (não recalcular a tela só por soma em todo GET).

## Semântica

| `type` | Conta | `goal_id` | Conta corrente | Caixinha |
|--------|-------|-----------|----------------|----------|
| `expense` (não crédito) | Santander (etc.) | caixinha X | regras de caixa atuais (débito pago na criação, etc.) | **+** amount |
| `income` | Santander (etc.) | caixinha X | regras de caixa atuais | **−** amount |
| `transfer` / `adjustment` / despesa crédito | — | — | — | **proibido** (`goal_id` → 400) |

**Update:** reverte efeito antigo na caixinha (se havia `goal_id`/valor/tipo) e aplica o novo.  
**Delete:** reverte efeito na caixinha; `on delete set null` se a caixinha for apagada (não recoloca dinheiro na conta).  
**PUT só `goal_id` em despesa já existente (OFX):** apenas ± caixinha; não reaplica delta de conta além das regras normais de update (toggle paid continua sem mexer saldo).

## API

`POST/PUT /api/transactions`:

- Body opcional: `goal_id: uuid | null`
- Validar goal do mesmo `user_id`
- Só `expense` | `income`
- Despesa com `payment_method = 'credit'` **não** pode ter `goal_id` (aporte/resgate é movimento de conta corrente / OFX)
- Resgate: se `current_amount < amount` (após reverter efeito antigo no update) → 400
- Helper: `applyGoalAmountDelta(userId, goalId, delta)`

Listagem: retornar `goal_id` e `goal_name` (join no BFF) para a UI.

## UI

**Transações**

- Select **Caixinha** se tipo = despesa ou receita (opção “Nenhuma”)
- Coluna/badge com nome da caixinha na lista
- Editar lançamento OFX → escolher caixinha e salvar

**Investimentos**

- Continua exibindo `current_amount` (alimentado pelas txs)
- Sem “adicionar valor” manual neste escopo

## Edge cases

- Goal de outro usuário / inexistente → 404/400
- Trocar `expense`↔`income` com `goal_id` → reverte e reaplica
- Delete da caixinha → txs ficam com `goal_id` null; histórico de conta intacto
- Histórico pré-feature: `current_amount` atual das caixinhas **não** é recalculado em massa neste MVP (opcional script one-shot fora do escopo)

## Testes

- Create expense + goal → `current_amount` sobe
- Create income + goal → desce; insuficiente → 400
- Update amount / trocar goal / clear goal → deltas corretos
- Delete → reverte caixinha
- `goal_id` em transfer → 400

## Docs

Atualizar `docs/context.md`: investimentos ligados a transações via `goal_id`.

## Fora de escopo

- Auto-detectar caixinha na importação OFX
- Transfer conta↔conta misturada com goal
- Conta `type = investment` espelhando cada caixinha
- UI de aporte direto na página Investimentos
- Recalcular `current_amount` histórico em lote
