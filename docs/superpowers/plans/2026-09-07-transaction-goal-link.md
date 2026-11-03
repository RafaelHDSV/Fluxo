# Transaction ↔ Goal (caixinha) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vincular transações (`expense`/`income`) a caixinhas (`fluxo_goals`) via `goal_id`, atualizando `current_amount` no write path, com UI em Transações.

**Architecture:** Coluna `goal_id` em `fluxo_transactions`; helper `applyGoalAmountDelta` + `goalCashDelta` no backend; create/update/delete de transações sincronizam a caixinha; listagem devolve `goal_name`; formulário de Transações ganha select Caixinha.

**Tech Stack:** Postgres/Supabase, Express BFF (`backend/src`), React + TypeScript (`frontend/src`), testes com `tsx` (padrão `*.test.ts` do backend).

**Spec:** `docs/superpowers/specs/2026-09-07-transaction-goal-link-design.md`

## Global Constraints

- Commits locais/push só com pedido explícito do usuário (`git-github.mdc`) — **não** rodar `git commit` nos steps salvo o usuário pedir.
- `paid` toggle não move saldo de conta (regra já vigente).
- `goal_id` proibido em `transfer`, `adjustment` e despesa `payment_method = 'credit'`.
- Resgate (`income` + `goal_id`) com valor > `current_amount` (após reverter efeito antigo) → 400.
- Não recalcular histórico em massa das caixinhas neste plano.
- Prefixo tabelas `fluxo_*`; migration nova `009_transaction_goal_id.sql`.

## File map

| File | Responsibility |
|------|----------------|
| `backend/migrations/009_transaction_goal_id.sql` | Schema `goal_id` + índice |
| `backend/src/lib/goalCash.ts` | Delta de caixinha (+ expense / − income) + `applyGoalAmountDelta` |
| `backend/src/lib/goalCash.test.ts` | Testes unitários do helper |
| `backend/src/modules/transactions/transactionsRoutes.ts` | Validar `goal_id`, sync caixinha no CRUD, join `goal_name` no GET |
| `frontend/src/pages/TransactionsPage.tsx` | Select Caixinha + badge/coluna na lista |
| `docs/context.md` | Decisão de produto |

---

### Task 1: Migration `goal_id`

**Files:**
- Create: `backend/migrations/009_transaction_goal_id.sql`
- Modify: `docs/context.md` (linha da tabela Migrations + decisão investimentos)

**Interfaces:**
- Produces: coluna `fluxo_transactions.goal_id uuid null` FK → `fluxo_goals(id) on delete set null`

- [ ] **Step 1: Criar migration**

Conteúdo exato:

```sql
-- Vínculo transação → caixinha (aporte/resgate)
alter table public.fluxo_transactions
  add column if not exists goal_id uuid references public.fluxo_goals (id) on delete set null;

create index if not exists fluxo_transactions_user_goal_idx
  on public.fluxo_transactions (user_id, goal_id)
  where goal_id is not null;
```

- [ ] **Step 2: Aplicar no Supabase do projeto Fluxo**

Via SQL Editor ou MCP `apply_migration` no project `vexgvejsimlfenyboszy`, name `transaction_goal_id`, mesma query.

- [ ] **Step 3: Atualizar `docs/context.md`**

Na tabela Migrations, adicionar:

`| \`009_transaction_goal_id.sql\` | \`goal_id\` em transações → caixinha |`

Na decisão 8 / Investimentos, acrescentar que aporte/resgate é via transação com `goal_id` (despesa/receita).

- [ ] **Step 4: Verificar coluna**

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'fluxo_transactions' and column_name = 'goal_id';
```

Expected: uma linha `goal_id` / `uuid`.

---

### Task 2: Helper `goalCash` (TDD)

**Files:**
- Create: `backend/src/lib/goalCash.ts`
- Create: `backend/src/lib/goalCash.test.ts`

**Interfaces:**
- Produces:
  - `goalAmountDelta(input: { type: string; amount: number; goalId: string | null | undefined }): number`  
    — `expense` + goal → `+amount`; `income` + goal → `-amount`; sem goal ou outros types → `0`
  - `applyGoalAmountDelta(userId: string, goalId: string, delta: number): Promise<{ ok: true } | { ok: false; error: string }>`  
    — `update fluxo_goals set current_amount = current_amount + delta where id/user`; se resgate deixaria `< 0`, retorna erro sem atualizar

- [ ] **Step 1: Escrever teste falhando**

`backend/src/lib/goalCash.test.ts`:

```typescript
import assert from 'node:assert/strict'
import { goalAmountDelta } from './goalCash.js'

assert.equal(goalAmountDelta({ type: 'expense', amount: 100, goalId: 'g1' }), 100)
assert.equal(goalAmountDelta({ type: 'income', amount: 40, goalId: 'g1' }), -40)
assert.equal(goalAmountDelta({ type: 'expense', amount: 100, goalId: null }), 0)
assert.equal(goalAmountDelta({ type: 'transfer', amount: 100, goalId: 'g1' }), 0)

console.log('goalCash.test.ts ok')
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `cd backend; npx --yes tsx src/lib/goalCash.test.ts`  
Expected: falha (módulo/export inexistente).

- [ ] **Step 3: Implementar `goalCash.ts`**

```typescript
import { query, queryOne } from './db.js'
import { T } from './tables.js'
import { toNumber } from './money.js'

export function goalAmountDelta(input: {
  type: string
  amount: number
  goalId: string | null | undefined
}): number {
  if (!input.goalId) return 0
  if (input.type === 'expense') return input.amount
  if (input.type === 'income') return -input.amount
  return 0
}

export async function applyGoalAmountDelta(
  userId: string,
  goalId: string,
  delta: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(delta) || delta === 0) return { ok: true }

  if (delta < 0) {
    const row = await queryOne<{ current_amount: string }>(
      `select current_amount from ${T.goals} where id = $1 and user_id = $2`,
      [goalId, userId],
    )
    if (!row) return { ok: false, error: 'Caixinha não encontrada' }
    if (toNumber(row.current_amount) + delta < -0.001) {
      return { ok: false, error: 'Saldo da caixinha insuficiente' }
    }
  }

  const updated = await queryOne(
    `update ${T.goals}
     set current_amount = current_amount + $3
     where id = $1 and user_id = $2
     returning id`,
    [goalId, userId, delta],
  )
  if (!updated) return { ok: false, error: 'Caixinha não encontrada' }
  return { ok: true }
}
```

(Remover import `query` se não usado.)

- [ ] **Step 4: Rodar testes**

Run: `cd backend; npx --yes tsx src/lib/goalCash.test.ts`  
Expected: `goalCash.test.ts ok`

---

### Task 3: Backend transactions — validação + sync caixinha

**Files:**
- Modify: `backend/src/modules/transactions/transactionsRoutes.ts`

**Interfaces:**
- Consumes: `goalAmountDelta`, `applyGoalAmountDelta` de `../../lib/goalCash.js`
- Produces: CRUD aceita `goal_id`; GET lista com `goal_name`

- [ ] **Step 1: Helper local de resolução/validação**

No topo do routes (após imports), adicionar:

```typescript
async function resolveGoalId(input: {
  userId: string
  goalId: unknown
  type: string
  paymentMethod: string | null
}): Promise<{ goal_id: string | null; error?: string }> {
  if (input.goalId === undefined) return { goal_id: null } // caller decide keep-existing no PUT
  if (input.goalId === null || input.goalId === '') return { goal_id: null }
  if (typeof input.goalId !== 'string') return { goal_id: null, error: 'goal_id inválido' }
  if (input.type !== 'expense' && input.type !== 'income') {
    return { goal_id: null, error: 'goal_id só permitido em despesa ou receita' }
  }
  if (input.type === 'expense' && input.paymentMethod === 'credit') {
    return { goal_id: null, error: 'Despesa no crédito não pode vincular caixinha' }
  }
  const goal = await queryOne(`select id from ${T.goals} where id = $1 and user_id = $2`, [
    input.goalId,
    input.userId,
  ])
  if (!goal) return { goal_id: null, error: 'Caixinha não encontrada' }
  return { goal_id: input.goalId }
}
```

Nota: no PUT, se `body.goal_id === undefined`, manter `existing.goal_id`.

- [ ] **Step 2: GET list — join goal_name**

Trocar o `select *` da listagem por algo equivalente a:

```sql
select t.*, (${EFF})::text as effective_date, g.name as goal_name
from ${T.transactions} t
left join ${T.goals} g on g.id = t.goal_id
where ... -- mesmos filtros em t.
```

Ajustar aliases/`where` para prefixar `t.` onde necessário (`user_id`, colunas filtradas).

- [ ] **Step 3: POST create — persistir e aplicar delta**

Após validar campos obrigatórios e `resolvedMethod` / `paid`:

1. Resolver `goal_id` com `resolveGoalId` (se `body.goal_id` definido; senão `null`).
2. Incluir `goal_id` no `insert`.
3. Após insert + `applyAccountBalanceDelta` (existente), chamar:

```typescript
const gDelta = goalAmountDelta({ type, amount: amountNum, goalId: resolvedGoalId })
if (gDelta !== 0 && resolvedGoalId) {
  const r = await applyGoalAmountDelta(req.userId!, resolvedGoalId, gDelta)
  if (!r.ok) {
    // ideal: deletar a tx recém-criada ou usar transação SQL; mínimo aceitável neste plano:
    await queryOne(`delete from ${T.transactions} where id = $1 and user_id = $2`, [row.id, req.userId])
    await applyAccountBalanceDelta(req.userId!, account_id, -checkingCashDelta({ type, amount: amountNum, paid, paymentMethod: resolvedMethod }))
    return res.status(400).json({ error: r.error })
  }
}
```

Preferível: checar saldo da caixinha **antes** do insert no caso `income` + goal (mesmo critério de `applyGoalAmountDelta`).

- [ ] **Step 4: PUT update — reverter + reaplicar**

1. Ler `existing.goal_id`.
2. Novo `goal_id`: `body.goal_id === undefined ? existing.goal_id : resolve...`
3. `oldGoalDelta = goalAmountDelta({ type: existing.type, amount: toNumber(existing.amount), goalId: existing.goal_id })`
4. `newGoalDelta = goalAmountDelta({ type, amount, goalId: newGoalId })`
5. Se `existing.goal_id` e `oldGoalDelta`: `applyGoalAmountDelta(..., -oldGoalDelta)` primeiro (libera saldo no resgate→aporte).
6. Se `newGoalId` e `newGoalDelta`: `applyGoalAmountDelta(..., newGoalDelta)`; se falhar, **reaplicar** `oldGoalDelta` e retornar 400.
7. Persistir `goal_id` no `update` SQL.

- [ ] **Step 5: DELETE e bulk-delete — reverter caixinha**

Antes/depois do delete de cada row (junto ao cash da conta):

```typescript
const gDelta = goalAmountDelta({
  type: row.type,
  amount: toNumber(row.amount),
  goalId: row.goal_id,
})
if (gDelta !== 0 && row.goal_id) {
  await applyGoalAmountDelta(req.userId!, row.goal_id, -gDelta)
}
```

Incluir `goal_id` no `select` dos deletes.

- [ ] **Step 6: Smoke manual (API)**

Com servidor up: criar despesa + `goal_id`, conferir `current_amount`; criar receita maior que saldo → 400; limpar `goal_id` via PUT e ver caixinha voltar.

---

### Task 4: UI Transações — select e lista

**Files:**
- Modify: `frontend/src/pages/TransactionsPage.tsx`

**Interfaces:**
- Consumes: `GET /api/goals` → `{ id, name }[]`; txs com `goal_id` / `goal_name`
- Produces: form envia `goal_id: string | null`

- [ ] **Step 1: Tipos e form**

Em `type Tx`, adicionar `goal_id?: string | null` e `goal_name?: string | null`.  
Em `emptyForm`, `goal_id: ''`.  
Estado: carregar `goals` com `api.get('/api/goals')` no mesmo `load`/effect das contas.

- [ ] **Step 2: Campo no formulário**

Após o bloco de Conta (ou perto de tipo), se `form.type === 'expense' || form.type === 'income'`, e se `form.payment_method !== 'credit'`:

```tsx
<div className="space-y-2">
  <Label>Caixinha</Label>
  <Select
    value={form.goal_id || '__none__'}
    onValueChange={(v) => setForm({ ...form, goal_id: v === '__none__' ? '' : v })}
  >
    <SelectTrigger className="h-10">
      <SelectValue placeholder="Nenhuma" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__none__">Nenhuma</SelectItem>
      {goals.map((g) => (
        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

Ao mudar tipo para `transfer`/`adjustment` ou meio para `credit`, limpar `goal_id`.

- [ ] **Step 3: Submit / edit**

No payload create/update: `goal_id: form.goal_id || null` (só expense/income não-crédito; senão `null`).  
No `startEdit`: `goal_id: tx.goal_id || ''`.

- [ ] **Step 4: Coluna/badge na tabela**

Na listagem, mostrar `tx.goal_name` (Badge outline) quando presente — coluna “Caixinha” ou sob a descrição.

- [ ] **Step 5: Verificar no browser**

`yarn` / front em `:3333`: criar aporte manual; editar tx OFX e só setar caixinha; resgate; conferir página Investimentos.

---

### Task 5: Spec status + context final

**Files:**
- Modify: `docs/superpowers/specs/2026-09-07-transaction-goal-link-design.md` (status → implementado, quando tudo ok)
- Modify: `docs/context.md` se ainda faltar a menção

- [ ] **Step 1: Marcar spec como implementada** após Tasks 1–4 verdes.
- [ ] **Step 2: Pedir commit ao usuário** se quiser versionar (não commitar sozinho).

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| Migration `goal_id` | 1 |
| Helper delta + bloqueio resgate | 2–3 |
| CRUD sync + validação credit/transfer | 3 |
| GET `goal_name` | 3 |
| UI select + lista | 4 |
| Docs context | 1 / 5 |
| Sem aporte UI Investimentos / sem backfill | respeitado (fora) |

## Placeholder scan

Nenhum TBD nos steps; commits condicionados ao pedido do usuário.
