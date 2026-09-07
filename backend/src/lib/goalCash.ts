import { queryOne } from './db.js'
import { T } from './tables.js'

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
    // Atomic guard: never go negative even under concurrent updates
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
