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
  const { name, price, saved_amount = 0, category, url, purchased = false, source_ref } = body
  if (!name || price == null) {
    return res.status(400).json({ error: 'name e price são obrigatórios' })
  }

  try {
    const row = await queryOne(
      `insert into ${T.wishlist}
        (user_id, name, price, saved_amount, category, url, purchased, source_ref)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
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

router.post('/import', async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : null
  if (!items?.length) {
    return res.status(400).json({ error: 'items[] é obrigatório' })
  }

  let inserted = 0
  let skipped = 0

  for (const raw of items) {
    const name = String(raw.name || raw.Nome || '').trim()
    const price = toNumber(raw.price ?? raw.Preço ?? raw.preco ?? 0)
    if (!name) {
      skipped += 1
      continue
    }
    const saved = toNumber(raw.saved_amount ?? raw['Valor Guardado'] ?? raw.saved ?? 0)
    const category = raw.category ?? raw.Categoria ?? null
    const url = raw.url ?? raw.URL ?? raw.Link ?? null
    const purchased = Boolean(raw.purchased ?? (raw.Comprado === 'Yes' || raw.Comprado === true))
    const source_ref = (raw.source_ref ?? raw.url_page ?? raw.page_url ?? null) as string | null

    try {
      if (source_ref) {
        const existing = await queryOne(
          `select id from ${T.wishlist} where user_id = $1 and source_ref = $2`,
          [req.userId, source_ref],
        )
        if (existing) {
          skipped += 1
          continue
        }
      }
      const row = await queryOne(
        `insert into ${T.wishlist}
          (user_id, name, price, saved_amount, category, url, purchased, source_ref)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         returning id`,
        [req.userId, name, price, saved, category, url, purchased, source_ref],
      )
      if (row) inserted += 1
      else skipped += 1
    } catch {
      skipped += 1
    }
  }

  res.json({ inserted, skipped, total: items.length })
})

export default router
