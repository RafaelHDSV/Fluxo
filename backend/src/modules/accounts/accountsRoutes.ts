import { Router } from 'express'
import { query, queryOne } from '../../lib/db.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const rows = await query(
    `select * from accounts where user_id = $1 and archived = false order by name`,
    [req.userId],
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { name, type, balance = 0, credit_limit, due_day, closing_day, color } = req.body ?? {}
  if (!name || !type) {
    return res.status(400).json({ error: 'name e type são obrigatórios' })
  }

  const row = await queryOne(
    `insert into accounts (user_id, name, type, balance, credit_limit, due_day, closing_day, color)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning *`,
    [req.userId, name, type, balance, credit_limit ?? null, due_day ?? null, closing_day ?? null, color ?? null],
  )
  res.status(201).json(row)
})

router.put('/:id', async (req, res) => {
  const { name, type, balance, credit_limit, due_day, closing_day, color, archived } = req.body ?? {}
  const row = await queryOne(
    `update accounts set
      name = coalesce($3, name),
      type = coalesce($4, type),
      balance = coalesce($5, balance),
      credit_limit = coalesce($6, credit_limit),
      due_day = coalesce($7, due_day),
      closing_day = coalesce($8, closing_day),
      color = coalesce($9, color),
      archived = coalesce($10, archived)
     where id = $1 and user_id = $2
     returning *`,
    [
      req.params.id,
      req.userId,
      name ?? null,
      type ?? null,
      balance ?? null,
      credit_limit ?? null,
      due_day ?? null,
      closing_day ?? null,
      color ?? null,
      archived ?? null,
    ],
  )
  if (!row) return res.status(404).json({ error: 'Conta não encontrada' })
  res.json(row)
})

router.delete('/:id', async (req, res) => {
  const row = await queryOne(
    `update accounts set archived = true where id = $1 and user_id = $2 returning id`,
    [req.params.id, req.userId],
  )
  if (!row) return res.status(404).json({ error: 'Conta não encontrada' })
  res.status(204).send()
})

export default router
