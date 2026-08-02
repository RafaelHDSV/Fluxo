import { Router } from 'express'
import { query, queryOne } from '../../lib/db.js'
import { buildDedupeHash, toNumber } from '../../lib/money.js'
import { T } from '../../lib/tables.js'
import { requireAuth } from '../../middleware/auth.js'
import { suggestCategoryId } from '../categories/suggestCategory.js'

const router = Router()
router.use(requireAuth)

function parsePaid(value: unknown): boolean | null {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return null
}

function parsePaymentMethod(value: unknown): 'debit' | 'credit' | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (value === 'debit' || value === 'credit') return value
  return undefined
}

router.get('/', async (req, res) => {
  const { q, type, account_id, category_id, from, to, paid, payment_method } = req.query
  const params: unknown[] = [req.userId]
  const where = ['user_id = $1']

  if (typeof q === 'string' && q.trim()) {
    params.push(`%${q.trim()}%`)
    where.push(`description ilike $${params.length}`)
  }
  if (typeof type === 'string' && type) {
    params.push(type)
    where.push(`type = $${params.length}`)
  }
  if (typeof account_id === 'string' && account_id) {
    params.push(account_id)
    where.push(`account_id = $${params.length}`)
  }
  if (typeof category_id === 'string' && category_id) {
    params.push(category_id)
    where.push(`category_id = $${params.length}`)
  }
  if (typeof from === 'string' && from) {
    params.push(from)
    where.push(`date >= $${params.length}`)
  }
  if (typeof to === 'string' && to) {
    params.push(to)
    where.push(`date <= $${params.length}`)
  }
  const paidFilter = parsePaid(paid)
  if (paidFilter !== null) {
    params.push(paidFilter)
    where.push(`paid = $${params.length}`)
  }
  if (typeof payment_method === 'string' && (payment_method === 'debit' || payment_method === 'credit')) {
    params.push(payment_method)
    where.push(`payment_method = $${params.length}`)
  }

  const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50
  const offsetRaw = typeof req.query.offset === 'string' ? Number(req.query.offset) : 0
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 200) : 50
  const offset = Number.isFinite(offsetRaw) ? Math.max(Math.trunc(offsetRaw), 0) : 0

  const countRow = await queryOne<{ count: string }>(
    `select count(*)::text as count from ${T.transactions} where ${where.join(' and ')}`,
    params,
  )
  const total = Number(countRow?.count ?? 0)

  const limitIdx = params.length + 1
  const offsetIdx = params.length + 2
  const rows = await query(
    `select * from ${T.transactions}
     where ${where.join(' and ')}
     order by date desc, created_at desc
     limit $${limitIdx} offset $${offsetIdx}`,
    [...params, limit, offset],
  )

  res.json({ items: rows, total, limit, offset })
})

router.post('/', async (req, res) => {
  const body = req.body ?? {}
  const {
    date,
    description,
    amount,
    type,
    category_id,
    account_id,
    transfer_account_id,
    card_account_id,
    tags = [],
    notes,
    external_fitid,
    source_ref,
  } = body

  if (!date || !description || amount == null || !type || !account_id) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' })
  }

  const paymentMethod = parsePaymentMethod(body.payment_method)
  if (body.payment_method !== undefined && paymentMethod === undefined) {
    return res.status(400).json({ error: 'payment_method inválido (debit|credit)' })
  }

  let categoryId = category_id as string | undefined
  if (!categoryId) {
    categoryId = (await suggestCategoryId(req.userId!, description)) ?? undefined
  }
  if (!categoryId) {
    return res.status(400).json({ error: 'category_id é obrigatório (sem categoria padrão)' })
  }

  const paid = parsePaid(body.paid) ?? true

  const dedupe_hash = buildDedupeHash({
    userId: req.userId!,
    date,
    amount: toNumber(amount),
    description,
    accountId: account_id,
    fitid: external_fitid,
  })

  try {
    const row = await queryOne(
      `insert into ${T.transactions}
        (user_id, date, description, amount, type, category_id, account_id, transfer_account_id,
         card_account_id, tags, notes, dedupe_hash, external_fitid, paid, payment_method, source_ref)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       returning *`,
      [
        req.userId,
        date,
        description,
        toNumber(amount),
        type,
        categoryId,
        account_id,
        transfer_account_id ?? null,
        card_account_id ?? null,
        tags,
        notes ?? null,
        dedupe_hash,
        external_fitid ?? null,
        paid,
        paymentMethod === undefined ? null : paymentMethod,
        source_ref ?? null,
      ],
    )
    res.status(201).json(row)
  } catch (error: unknown) {
    const pgError = error as { code?: string }
    if (pgError.code === '23505') {
      return res.status(409).json({ error: 'Transação duplicada' })
    }
    throw error
  }
})

router.put('/:id', async (req, res) => {
  const body = req.body ?? {}
  const existing = await queryOne<{
    id: string
    date: string
    description: string
    amount: string
    account_id: string
    external_fitid: string | null
    paid: boolean
    payment_method: string | null
    source_ref: string | null
  }>(`select * from ${T.transactions} where id = $1 and user_id = $2`, [req.params.id, req.userId])

  if (!existing) return res.status(404).json({ error: 'Transação não encontrada' })

  const date = body.date ?? existing.date
  const description = body.description ?? existing.description
  const amount = body.amount != null ? toNumber(body.amount) : toNumber(existing.amount)
  const account_id = body.account_id ?? existing.account_id
  const external_fitid = body.external_fitid ?? existing.external_fitid
  const paid = body.paid !== undefined ? (parsePaid(body.paid) ?? existing.paid) : existing.paid

  let payment_method: string | null = existing.payment_method
  if (body.payment_method !== undefined) {
    const parsed = parsePaymentMethod(body.payment_method)
    if (parsed === undefined) {
      return res.status(400).json({ error: 'payment_method inválido (debit|credit)' })
    }
    payment_method = parsed
  }

  const source_ref = body.source_ref !== undefined ? body.source_ref : existing.source_ref

  const dedupe_hash = buildDedupeHash({
    userId: req.userId!,
    date,
    amount,
    description,
    accountId: account_id,
    fitid: external_fitid,
  })

  const row = await queryOne(
    `update ${T.transactions} set
      date = $3,
      description = $4,
      amount = $5,
      type = coalesce($6, type),
      category_id = coalesce($7, category_id),
      account_id = $8,
      transfer_account_id = coalesce($9, transfer_account_id),
      card_account_id = coalesce($10, card_account_id),
      tags = coalesce($11, tags),
      notes = coalesce($12, notes),
      dedupe_hash = $13,
      external_fitid = $14,
      paid = $15,
      payment_method = $16,
      source_ref = $17,
      updated_at = now()
     where id = $1 and user_id = $2
     returning *`,
    [
      req.params.id,
      req.userId,
      date,
      description,
      amount,
      body.type ?? null,
      body.category_id ?? null,
      account_id,
      body.transfer_account_id ?? null,
      body.card_account_id ?? null,
      body.tags ?? null,
      body.notes ?? null,
      dedupe_hash,
      external_fitid ?? null,
      paid,
      payment_method,
      source_ref ?? null,
    ],
  )
  res.json(row)
})

router.delete('/:id', async (req, res) => {
  const row = await queryOne(`delete from ${T.transactions} where id = $1 and user_id = $2 returning id`, [
    req.params.id,
    req.userId,
  ])
  if (!row) return res.status(404).json({ error: 'Transação não encontrada' })
  res.status(204).send()
})

router.post('/bulk-delete', async (req, res) => {
  const ids = req.body?.ids
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids obrigatório' })
  }
  const cleaned = ids.filter((id: unknown) => typeof id === 'string' && id.length > 0)
  if (cleaned.length === 0) {
    return res.status(400).json({ error: 'ids inválidos' })
  }
  const deleted = await query<{ id: string }>(
    `delete from ${T.transactions}
     where user_id = $1 and id = any($2::uuid[])
     returning id`,
    [req.userId, cleaned],
  )
  res.json({ deleted: deleted.length })
})

export default router
