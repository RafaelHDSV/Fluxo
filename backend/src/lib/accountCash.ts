import { query } from './db.js'
import { T } from './tables.js'

/** Despesa no crédito não altera saldo da conta corrente. */
export function isCheckingCashExpense(type: string, paymentMethod: string | null | undefined, paid: boolean) {
  return type === 'expense' && paid && paymentMethod !== 'credit'
}

export function isCheckingCashIncome(type: string) {
  return type === 'income' || type === 'adjustment'
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

/** Delta de caixa na conta corrente causado por um lançamento. */
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
