import { Router } from 'express'
import { query, queryOne } from '../../lib/db.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const rows = await query(`select * from categories where user_id = $1 order by name`, [req.userId])
  res.json(rows)
})

router.get('/rules', async (req, res) => {
  const rows = await query(
    `select * from category_rules where user_id = $1 order by priority, created_at`,
    [req.userId],
  )
  res.json(rows)
})

router.post('/rules', async (req, res) => {
  const { category_id, match_type, pattern, priority = 100 } = req.body ?? {}
  if (!category_id || !match_type || !pattern) {
    return res.status(400).json({ error: 'category_id, match_type e pattern são obrigatórios' })
  }
  const row = await queryOne(
    `insert into category_rules (user_id, category_id, match_type, pattern, priority)
     values ($1,$2,$3,$4,$5) returning *`,
    [req.userId, category_id, match_type, pattern, priority],
  )
  res.status(201).json(row)
})

router.delete('/rules/:id', async (req, res) => {
  const row = await queryOne(`delete from category_rules where id = $1 and user_id = $2 returning id`, [
    req.params.id,
    req.userId,
  ])
  if (!row) return res.status(404).json({ error: 'Regra não encontrada' })
  res.status(204).send()
})

router.post('/', async (req, res) => {
  const { name, kind = 'expense', color, icon } = req.body ?? {}
  if (!name) return res.status(400).json({ error: 'name é obrigatório' })
  const row = await queryOne(
    `insert into categories (user_id, name, kind, color, icon) values ($1,$2,$3,$4,$5) returning *`,
    [req.userId, name, kind, color ?? null, icon ?? null],
  )
  res.status(201).json(row)
})

router.put('/:id', async (req, res) => {
  const { name, kind, color, icon } = req.body ?? {}
  const row = await queryOne(
    `update categories set
      name = coalesce($3, name),
      kind = coalesce($4, kind),
      color = coalesce($5, color),
      icon = coalesce($6, icon)
     where id = $1 and user_id = $2 returning *`,
    [req.params.id, req.userId, name ?? null, kind ?? null, color ?? null, icon ?? null],
  )
  if (!row) return res.status(404).json({ error: 'Categoria não encontrada' })
  res.json(row)
})

router.delete('/:id', async (req, res) => {
  const row = await queryOne(`delete from categories where id = $1 and user_id = $2 returning id`, [
    req.params.id,
    req.userId,
  ])
  if (!row) return res.status(404).json({ error: 'Categoria não encontrada' })
  res.status(204).send()
})

export default router
