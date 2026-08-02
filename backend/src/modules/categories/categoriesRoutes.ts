import { Router } from 'express'
import { effectiveDateSql } from '../../lib/creditCycle.js'
import { query, queryOne } from '../../lib/db.js'
import { T } from '../../lib/tables.js'
import { requireAuth } from '../../middleware/auth.js'

const EFF_T = effectiveDateSql('t')

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const rows = await query(`select * from ${T.categories} where user_id = $1 order by name`, [req.userId])
  res.json(rows)
})

router.get('/rules', async (req, res) => {
  const rows = await query(
    `select * from ${T.categoryRules} where user_id = $1 order by priority, created_at`,
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
    `insert into ${T.categoryRules} (user_id, category_id, match_type, pattern, priority)
     values ($1,$2,$3,$4,$5) returning *`,
    [req.userId, category_id, match_type, pattern, priority],
  )
  res.status(201).json(row)
})

router.delete('/rules/:id', async (req, res) => {
  const row = await queryOne(
    `delete from ${T.categoryRules} where id = $1 and user_id = $2 returning id`,
    [req.params.id, req.userId],
  )
  if (!row) return res.status(404).json({ error: 'Regra não encontrada' })
  res.status(204).send()
})

router.get('/stats', async (req, res) => {
  const now = new Date()
  const monthFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const yearFrom = `${now.getFullYear()}-01-01`
  const yearTo = `${now.getFullYear()}-12-31`
  const monthToDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const monthTo = `${monthToDate.getFullYear()}-${String(monthToDate.getMonth() + 1).padStart(2, '0')}-${String(monthToDate.getDate()).padStart(2, '0')}`

  const rows = await query(
    `select c.*,
      coalesce((
        select sum(t.amount) from ${T.transactions} t
        where t.user_id = c.user_id and t.category_id = c.id and t.type = 'expense' and t.paid = true
          and ${EFF_T} between $2 and $3
      ),0) as spent_month,
      coalesce((
        select sum(t.amount) from ${T.transactions} t
        where t.user_id = c.user_id and t.category_id = c.id and t.type = 'expense' and t.paid = true
          and ${EFF_T} between $4 and $5
      ),0) as spent_year,
      coalesce((
        select sum(t.amount) from ${T.transactions} t
        where t.user_id = c.user_id and t.category_id = c.id and t.type = 'expense' and t.paid = true
      ),0) as spent_all,
      (
        select b.amount_limit from ${T.budgets} b
        where b.user_id = c.user_id and b.category_id = c.id and b.month = $2::date
        limit 1
      ) as budget_limit,
      (
        select b.id from ${T.budgets} b
        where b.user_id = c.user_id and b.category_id = c.id and b.month = $2::date
        limit 1
      ) as budget_id
     from ${T.categories} c
     where c.user_id = $1
     order by c.name`,
    [req.userId, monthFrom, monthTo, yearFrom, yearTo],
  )

  // Garante meta mensal default para categorias de despesa sem orçamento
  for (const row of rows as Array<{ id: string; kind: string; budget_id: string | null }>) {
    if (!row.budget_id && (row.kind === 'expense' || row.kind === 'both')) {
      await queryOne(
        `insert into ${T.budgets} (user_id, category_id, month, amount_limit)
         values ($1,$2,$3::date,$4)
         on conflict (user_id, category_id, month) do nothing
         returning id`,
        [req.userId, row.id, monthFrom, 500],
      )
    }
  }

  const refreshed = await query(
    `select c.*,
      coalesce((
        select sum(t.amount) from ${T.transactions} t
        where t.user_id = c.user_id and t.category_id = c.id and t.type = 'expense' and t.paid = true
          and ${EFF_T} between $2 and $3
      ),0) as spent_month,
      coalesce((
        select sum(t.amount) from ${T.transactions} t
        where t.user_id = c.user_id and t.category_id = c.id and t.type = 'expense' and t.paid = true
          and ${EFF_T} between $4 and $5
      ),0) as spent_year,
      coalesce((
        select sum(t.amount) from ${T.transactions} t
        where t.user_id = c.user_id and t.category_id = c.id and t.type = 'expense' and t.paid = true
      ),0) as spent_all,
      (
        select b.amount_limit from ${T.budgets} b
        where b.user_id = c.user_id and b.category_id = c.id and b.month = $2::date
        limit 1
      ) as budget_limit,
      (
        select b.id from ${T.budgets} b
        where b.user_id = c.user_id and b.category_id = c.id and b.month = $2::date
        limit 1
      ) as budget_id
     from ${T.categories} c
     where c.user_id = $1
     order by c.name`,
    [req.userId, monthFrom, monthTo, yearFrom, yearTo],
  )
  res.json(refreshed)
})

router.post('/', async (req, res) => {
  const { name, kind = 'expense', color, icon } = req.body ?? {}
  if (!name) return res.status(400).json({ error: 'name é obrigatório' })
  const row = await queryOne(
    `insert into ${T.categories} (user_id, name, kind, color, icon) values ($1,$2,$3,$4,$5) returning *`,
    [req.userId, name, kind, color ?? null, icon ?? null],
  )
  if (row && (kind === 'expense' || kind === 'both')) {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    await queryOne(
      `insert into ${T.budgets} (user_id, category_id, month, amount_limit)
       values ($1,$2,$3::date,$4)
       on conflict (user_id, category_id, month) do nothing
       returning id`,
      [req.userId, (row as { id: string }).id, month, 500],
    )
  }
  res.status(201).json(row)
})

router.put('/:id', async (req, res) => {
  const { name, kind, color, icon } = req.body ?? {}
  const row = await queryOne(
    `update ${T.categories} set
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
  const row = await queryOne(`delete from ${T.categories} where id = $1 and user_id = $2 returning id`, [
    req.params.id,
    req.userId,
  ])
  if (!row) return res.status(404).json({ error: 'Categoria não encontrada' })
  res.status(204).send()
})

export default router
