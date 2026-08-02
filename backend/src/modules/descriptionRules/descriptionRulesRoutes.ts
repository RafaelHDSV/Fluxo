import { Router } from 'express'
import { query, queryOne } from '../../lib/db.js'
import { T } from '../../lib/tables.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const rows = await query(
    `select * from ${T.descriptionRules} where user_id = $1 order by priority, created_at`,
    [req.userId],
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { pattern, replacement, match_type = 'contains', priority = 100 } = req.body ?? {}
  if (!pattern || !replacement) {
    return res.status(400).json({ error: 'pattern e replacement são obrigatórios' })
  }
  if (match_type !== 'contains') {
    return res.status(400).json({ error: 'match_type inválido' })
  }
  const row = await queryOne(
    `insert into ${T.descriptionRules} (user_id, pattern, replacement, match_type, priority)
     values ($1,$2,$3,$4,$5) returning *`,
    [req.userId, String(pattern).trim(), String(replacement).trim(), match_type, priority],
  )
  res.status(201).json(row)
})

router.delete('/:id', async (req, res) => {
  const row = await queryOne(
    `delete from ${T.descriptionRules} where id = $1 and user_id = $2 returning id`,
    [req.params.id, req.userId],
  )
  if (!row) return res.status(404).json({ error: 'Regra não encontrada' })
  res.status(204).send()
})

export default router
