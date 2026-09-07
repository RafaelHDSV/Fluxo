import { queryOne } from './db.js'
import { T } from './tables.js'

export type GoalDirection = 'to_goal' | 'from_goal'

/** Normaliza direção; default aporte (conta → caixinha). */
export function normalizeGoalDirection(value: unknown): GoalDirection {
  return value === 'from_goal' ? 'from_goal' : 'to_goal'
}

/**
 * Efeito na caixinha.
 * Transferência + goal: to_goal sobe, from_goal desce.
 * (Legado expense/income com goal_id deixa de ser suportado na API.)
 */
export function goalAmountDelta(input: {
  type: string
  amount: number
  goalId: string | null | undefined
  goalDirection?: GoalDirection | null
}): number {
  if (!input.goalId || input.type !== 'transfer') return 0
  const dir = normalizeGoalDirection(input.goalDirection)
  return dir === 'from_goal' ? -input.amount : input.amount
}

/**
 * Efeito na conta corrente de uma transferência ligada a caixinha.
 * to_goal: sai da conta; from_goal: entra na conta.
 */
export function goalTransferAccountDelta(input: {
  type: string
  amount: number
  goalId: string | null | undefined
  goalDirection?: GoalDirection | null
}): number {
  if (!input.goalId || input.type !== 'transfer') return 0
  const dir = normalizeGoalDirection(input.goalDirection)
  return dir === 'from_goal' ? input.amount : -input.amount
}

export async function applyGoalAmountDelta(
  userId: string,
  goalId: string,
  delta: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(delta) || delta === 0) return { ok: true }

  if (delta < 0) {
    const updated = await queryOne(
      `update ${T.goals}
       set current_amount = current_amount + $3
       where id = $1 and user_id = $2 and current_amount + $3 >= -0.001
       returning id`,
      [goalId, userId, delta],
    )
    if (!updated) {
      const row = await queryOne<{ current_amount: string }>(
        `select current_amount from ${T.goals} where id = $1 and user_id = $2`,
        [goalId, userId],
      )
      if (!row) return { ok: false, error: 'Caixinha não encontrada' }
      return { ok: false, error: 'Saldo da caixinha insuficiente' }
    }
    return { ok: true }
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
