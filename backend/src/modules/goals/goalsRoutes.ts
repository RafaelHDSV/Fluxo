import { Router } from 'express'
import { query, queryOne } from '../../lib/db.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const rows = await query(`select * from goals where user_id = $1 order by created_at desc`, [req.userId])
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { name, target_amount, current_amount = 0, deadline, account_id } = req.body ?? {}
  if (!name || target_amount == null) {
    return res.status(400).json({ error: 'name e target_amount são obrigatórios' })
  }
  const row = await queryOne(
    `insert into goals (user_id, name, target_amount, current_amount, deadline, account_id)
     values ($1,$2,$3,$4,$5,$6) returning *`,
    [req.userId, name, target_amount, current_amount, deadline ?? null, account_id ?? null],
  )
  res.status(201).json(row)
})

router.put('/:id', async (req, res) => {
  const { name, target_amount, current_amount, deadline, account_id } = req.body ?? {}
  const row = await queryOne(
    `update goals set
      name = coalesce($3, name),
      target_amount = coalesce($4, target_amount),
      current_amount = coalesce($5, current_amount),
      deadline = coalesce($6, deadline),
      account_id = coalesce($7, account_id)
     where id = $1 and user_id = $2 returning *`,
    [
      req.params.id,
      req.userId,
      name ?? null,
      target_amount ?? null,
      current_amount ?? null,
      deadline ?? null,
      account_id ?? null,
    ],
  )
  if (!row) return res.status(404).json({ error: 'Meta não encontrada' })
  res.json(row)
})

router.delete('/:id', async (req, res) => {
  const row = await queryOne(`delete from goals where id = $1 and user_id = $2 returning id`, [
    req.params.id,
    req.userId,
  ])
  if (!row) return res.status(404).json({ error: 'Meta não encontrada' })
  res.status(204).send()
})

export default router
