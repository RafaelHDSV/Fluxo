import { Router } from 'express'
import { query, queryOne } from '../../lib/db.js'
import { T } from '../../lib/tables.js'
import { toNumber } from '../../lib/money.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const purchased = req.query.purchased
  const params: unknown[] = [req.userId]
  const where = ['user_id = $1']

  if (purchased === 'true' || purchased === 'false') {
    params.push(purchased === 'true')
    where.push(`purchased = $${params.length}`)
  }

  const rows = await query(
    `select * from ${T.wishlist} where ${where.join(' and ')} order by purchased asc, created_at desc`,
    params,
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const body = req.body ?? {}
  const { name, price, saved_amount = 0, category, url, purchased = false, source_ref, image_url } = body
  if (!name || price == null) {
    return res.status(400).json({ error: 'name e price são obrigatórios' })
  }

  try {
    const row = await queryOne(
      `insert into ${T.wishlist}
        (user_id, name, price, saved_amount, category, url, purchased, source_ref, image_url)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning *`,
      [
        req.userId,
        name,
        toNumber(price),
        toNumber(saved_amount),
        category ?? null,
        url ?? null,
        Boolean(purchased),
        source_ref ?? null,
        image_url ?? null,
      ],
    )
    res.status(201).json(row)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('fluxo_wishlist_user_source_ref_uidx') || msg.includes('unique')) {
      return res.status(409).json({ error: 'Item já importado (source_ref duplicado)' })
    }
    throw err
  }
})

router.put('/:id', async (req, res) => {
  const body = req.body ?? {}
  const row = await queryOne(
    `update ${T.wishlist} set
      name = coalesce($3, name),
      price = coalesce($4, price),
      saved_amount = coalesce($5, saved_amount),
      category = coalesce($6, category),
      url = coalesce($7, url),
      purchased = coalesce($8, purchased),
      image_url = coalesce($9, image_url),
      updated_at = now()
     where id = $1 and user_id = $2
     returning *`,
    [
      req.params.id,
      req.userId,
      body.name ?? null,
      body.price != null ? toNumber(body.price) : null,
      body.saved_amount != null ? toNumber(body.saved_amount) : null,
      body.category !== undefined ? body.category : null,
      body.url !== undefined ? body.url : null,
      body.purchased !== undefined ? Boolean(body.purchased) : null,
      body.image_url !== undefined ? body.image_url : null,
    ],
  )
  if (!row) return res.status(404).json({ error: 'Item não encontrado' })
  res.json(row)
})

router.delete('/:id', async (req, res) => {
  const row = await queryOne(`delete from ${T.wishlist} where id = $1 and user_id = $2 returning id`, [
    req.params.id,
    req.userId,
  ])
  if (!row) return res.status(404).json({ error: 'Item não encontrado' })
  res.status(204).send()
})

export default router
