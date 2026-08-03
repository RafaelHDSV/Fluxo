import { Router } from 'express'
import { effectiveDateSql } from '../../lib/creditCycle.js'
import { query, queryOne } from '../../lib/db.js'
import { T } from '../../lib/tables.js'
import { requireAuth } from '../../middleware/auth.js'

const EFF_T = effectiveDateSql('t')

const router = Router()
router.use(requireAuth)

function monthStart(value?: string) {
  if (value && /^\d{4}-\d{2}/.test(value)) return `${value.slice(0, 7)}-01`
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

router.get('/', async (req, res) => {
  const month = monthStart(typeof req.query.month === 'string' ? req.query.month : undefined)
  const rows = await query(
    `select b.*, c.name as category_name,
      coalesce((
        select sum(t.amount) from ${T.transactions} t
        where t.user_id = b.user_id
          and t.category_id = b.category_id
          and t.type = 'expense'
          and t.paid = true
          and date_trunc('month', (${EFF_T})::timestamp) = date_trunc('month', b.month::timestamp)
      ), 0) as spent
     from ${T.budgets} b
     join ${T.categories} c on c.id = b.category_id
     where b.user_id = $1 and b.month = $2::date
     order by c.name`,
    [req.userId, month],
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { category_id, amount_limit, month } = req.body ?? {}
  if (!category_id || amount_limit == null) {
    return res.status(400).json({ error: 'category_id e amount_limit são obrigatórios' })
  }
  const m = monthStart(month)
  const row = await queryOne(
    `insert into ${T.budgets} (user_id, category_id, month, amount_limit)
     values ($1,$2,$3::date,$4)
     on conflict (user_id, category_id, month)
     do update set amount_limit = excluded.amount_limit
     returning *`,
    [req.userId, category_id, m, amount_limit],
  )
  res.status(201).json(row)
})

router.delete('/:id', async (req, res) => {
  const row = await queryOne(`delete from ${T.budgets} where id = $1 and user_id = $2 returning id`, [
    req.params.id,
    req.userId,
  ])
  if (!row) return res.status(404).json({ error: 'Orçamento não encontrado' })
  res.status(204).send()
})

export default router
