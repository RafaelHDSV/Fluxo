import { Router } from 'express'
import { query, queryOne } from '../../lib/db.js'
import { T } from '../../lib/tables.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const rows = await query(`select * from ${T.goals} where user_id = $1 order by created_at desc`, [req.userId])
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { name, target_amount, current_amount = 0, deadline, account_id } = req.body ?? {}
  if (!name) {
    return res.status(400).json({ error: 'name é obrigatório' })
  }
  const target = target_amount == null || target_amount === '' ? 0 : target_amount
  const row = await queryOne(
    `insert into ${T.goals} (user_id, name, target_amount, current_amount, deadline, account_id)
     values ($1,$2,$3,$4,$5,$6) returning *`,
    [req.userId, name, target, current_amount, deadline ?? null, account_id ?? null],
  )
  res.status(201).json(row)
})

router.put('/:id', async (req, res) => {
  const body = req.body ?? {}
  const { name, target_amount, current_amount, deadline, account_id } = body
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({ error: 'name é obrigatório' })
  }

  const existing = await queryOne<{ id: string }>(
    `select id from ${T.goals} where id = $1 and user_id = $2`,
    [req.params.id, req.userId],
  )
  if (!existing) return res.status(404).json({ error: 'Caixinha não encontrada' })

  const row = await queryOne(
    `update ${T.goals} set
      name = coalesce($3, name),
      target_amount = coalesce($4, target_amount),
      current_amount = coalesce($5, current_amount),
      deadline = case when $6::boolean then $7::date else deadline end,
      account_id = case when $8::boolean then $9::uuid else account_id end
     where id = $1 and user_id = $2 returning *`,
    [
      req.params.id,
      req.userId,
      name != null && String(name).trim() ? String(name).trim() : null,
      target_amount !== undefined && target_amount !== null && target_amount !== ''
        ? Number(target_amount)
        : target_amount === '' || target_amount === null
          ? 0
          : null,
      current_amount !== undefined && current_amount !== null && current_amount !== ''
        ? Number(current_amount)
        : null,
      body.deadline !== undefined,
      body.deadline ? String(body.deadline).slice(0, 10) : null,
      body.account_id !== undefined,
      body.account_id || null,
    ],
  )
  if (!row) return res.status(404).json({ error: 'Caixinha não encontrada' })
  res.json(row)
})

router.delete('/:id', async (req, res) => {
  const row = await queryOne(`delete from ${T.goals} where id = $1 and user_id = $2 returning id`, [
    req.params.id,
    req.userId,
  ])
  if (!row) return res.status(404).json({ error: 'Meta não encontrada' })
  res.status(204).send()
})

export default router
