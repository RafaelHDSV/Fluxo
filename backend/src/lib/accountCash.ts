import { query, queryOne } from './db.js'
import { T } from './tables.js'

/**
 * Caixa na conta corrente (âncora `fluxo_accounts.balance`).
 *
 * Sem OFX/LEDGERBAL, o lançamento manual é a fonte da verdade:
 * - Receita / ajuste: sempre move saldo.
 * - Despesa (débito ou crédito): move saldo quando `paid` é true.
 *   No crédito, a conta de pagamento deve ser corrente; se `account_id` for o cartão,
 *   usa a primeira conta não-cartão do usuário.
 * - Alternar pago/não pago (PUT ou bulk-paid) reaplica o delta.
 */
export function isCheckingCashExpense(
  type: string,
  _paymentMethod: string | null | undefined,
  paid: boolean,
) {
  return type === 'expense' && paid
}

export function isCheckingCashIncome(type: string) {
  return type === 'income' || type === 'adjustment'
}

/** Conta onde o delta de caixa deve cair (nunca cartão). */
export async function resolveFundingAccountId(
  userId: string,
  accountId: string,
): Promise<string | null> {
  const acc = await queryOne<{ id: string; type: string }>(
    `select id, type from ${T.accounts} where id = $1 and user_id = $2`,
    [accountId, userId],
  )
  if (!acc) return null
  if (acc.type !== 'credit_card') return acc.id
  const checking = await queryOne<{ id: string }>(
    `select id from ${T.accounts}
     where user_id = $1 and archived = false and type <> 'credit_card'
     order by case when name ilike '%santander%' then 0 else 1 end, name
     limit 1`,
    [userId],
  )
  return checking?.id ?? null
}

/** Ajusta saldo da conta (exceto cartão). delta positivo aumenta o saldo. */
export async function applyAccountBalanceDelta(userId: string, accountId: string, delta: number) {
  if (!Number.isFinite(delta) || delta === 0) return
  await query(
    `update ${T.accounts}
     set balance = balance + $3
     where id = $1 and user_id = $2 and type <> 'credit_card'`,
    [accountId, userId, delta],
  )
}

/** Como `applyAccountBalanceDelta`, mas redireciona cartão → conta corrente de pagamento. */
export async function applyFundingBalanceDelta(userId: string, accountId: string, delta: number) {
  if (!Number.isFinite(delta) || delta === 0) return
  const fundingId = await resolveFundingAccountId(userId, accountId)
  if (!fundingId) return
  await applyAccountBalanceDelta(userId, fundingId, delta)
}

/** Delta de caixa na conta corrente causado por um lançamento (estrutura + paid “de caixa”). */
export function checkingCashDelta(input: {
  type: string
  amount: number
  paid: boolean
  paymentMethod: string | null | undefined
}): number {
  if (isCheckingCashIncome(input.type)) return input.amount
  if (isCheckingCashExpense(input.type, input.paymentMethod, input.paid)) return -input.amount
  return 0
}
