import { Router } from 'express'
import { computeCreditDueDate, effectiveDateSql } from '../../lib/creditCycle.js'
import { query, queryOne } from '../../lib/db.js'
import { buildDedupeHash, toNumber } from '../../lib/money.js'
import { T } from '../../lib/tables.js'
import { requireAuth } from '../../middleware/auth.js'
import { suggestCategoryId } from '../categories/suggestCategory.js'

const router = Router()
router.use(requireAuth)

const EFF = effectiveDateSql()

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

async function resolveDueDate(input: {
  userId: string
  paymentMethod: string | null
  purchaseDate: string
  cardAccountId: string | null
  dueDateOverride?: string | null
}): Promise<{ due_date: string | null; card_account_id: string | null; error?: string }> {
  if (input.paymentMethod !== 'credit') {
    return { due_date: null, card_account_id: null }
  }
  if (!input.cardAccountId) {
    return { due_date: null, card_account_id: null, error: 'card_account_id é obrigatório para crédito' }
  }
  const card = await queryOne<{
    id: string
    type: string
    due_day: number | null
    closing_day: number | null
  }>(`select id, type, due_day, closing_day from ${T.accounts} where id = $1 and user_id = $2`, [
    input.cardAccountId,
    input.userId,
  ])
  if (!card || card.type !== 'credit_card') {
    return { due_date: null, card_account_id: null, error: 'Conta cartão inválida' }
  }
  if (card.due_day == null || card.closing_day == null) {
    return {
      due_date: null,
      card_account_id: null,
      error: 'Cartão precisa de dia de fechamento e vencimento',
    }
  }
  if (input.dueDateOverride) {
    return { due_date: input.dueDateOverride.slice(0, 10), card_account_id: input.cardAccountId }
  }
  try {
    const due_date = computeCreditDueDate(input.purchaseDate, card.closing_day, card.due_day)
    return { due_date, card_account_id: input.cardAccountId }
  } catch {
    return { due_date: null, card_account_id: null, error: 'Não foi possível calcular o vencimento' }
  }
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
    where.push(`${EFF} >= $${params.length}`)
  }
  if (typeof to === 'string' && to) {
    params.push(to)
    where.push(`${EFF} <= $${params.length}`)
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
  const sortBy = req.query.sort === 'effective' ? EFF : 'date'

  const countRow = await queryOne<{ count: string }>(
    `select count(*)::text as count from ${T.transactions} where ${where.join(' and ')}`,
    params,
  )
  const total = Number(countRow?.count ?? 0)

  const limitIdx = params.length + 1
  const offsetIdx = params.length + 2
  const rows = await query(
    `select *, (${EFF})::text as effective_date
     from ${T.transactions}
     where ${where.join(' and ')}
     order by ${sortBy} desc, date desc, created_at desc
     limit $${limitIdx} offset $${offsetIdx}`,
    [...params, limit, offset],
  )

  res.json({ items: rows, total, limit, offset })
})

/** Descrições distintas para autocomplete (por frequência e recência). */
router.get('/descriptions', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : 12
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 40) : 12
  const params: unknown[] = [req.userId]
  let filter = ''
  if (q) {
    params.push(`%${q}%`)
    filter = ` and description ilike $${params.length}`
  }
  params.push(limit)
  const rows = await query<{ description: string; uses: number; category_id: string | null }>(
    `select description,
       count(*)::int as uses,
       (array_agg(category_id order by date desc nulls last, created_at desc))[1] as category_id
     from ${T.transactions}
     where user_id = $1${filter}
     group by description
     order by uses desc, max(date) desc nulls last
     limit $${params.length}`,
    params,
  )
  res.json({ items: rows })
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
  const resolvedMethod = paymentMethod === undefined ? null : paymentMethod

  let categoryId = category_id as string | undefined
  if (!categoryId) {
    categoryId = (await suggestCategoryId(req.userId!, description)) ?? undefined
  }
  if (!categoryId) {
    return res.status(400).json({ error: 'category_id é obrigatório (sem categoria padrão)' })
  }

  const dueResolved = await resolveDueDate({
    userId: req.userId!,
    paymentMethod: resolvedMethod,
    purchaseDate: String(date).slice(0, 10),
    cardAccountId: card_account_id ?? null,
    dueDateOverride: typeof body.due_date === 'string' ? body.due_date : null,
  })
  if (dueResolved.error) {
    return res.status(400).json({ error: dueResolved.error })
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
         card_account_id, tags, notes, dedupe_hash, external_fitid, paid, payment_method, source_ref, due_date)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       returning *, (${EFF})::text as effective_date`,
      [
        req.userId,
        date,
        description,
        toNumber(amount),
        type,
        categoryId,
        account_id,
        transfer_account_id ?? null,
        dueResolved.card_account_id,
        tags,
        notes ?? null,
        dedupe_hash,
        external_fitid ?? null,
        paid,
        resolvedMethod,
        source_ref ?? null,
        dueResolved.due_date,
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
    card_account_id: string | null
    due_date: string | null
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

  const cardAccountId =
    body.card_account_id !== undefined ? body.card_account_id : existing.card_account_id

  let finalDue: string | null = null
  let finalCard: string | null = null

  if (payment_method === 'credit') {
    const creditFieldsTouched =
      body.date !== undefined ||
      body.card_account_id !== undefined ||
      body.payment_method !== undefined ||
      body.due_date !== undefined

    // Crédito legado (sem cartão): permite update de paid/notas sem forçar ciclo
    if (!cardAccountId && !creditFieldsTouched) {
      finalDue = existing.due_date
      finalCard = existing.card_account_id
    } else {
      const explicitDue =
        body.due_date !== undefined
          ? body.due_date
            ? String(body.due_date).slice(0, 10)
            : null
          : null
      const shouldRecalc =
        body.due_date === undefined &&
        (body.date !== undefined || body.card_account_id !== undefined || body.payment_method !== undefined)

      const dueResolved = await resolveDueDate({
        userId: req.userId!,
        paymentMethod: payment_method,
        purchaseDate: String(date).slice(0, 10),
        cardAccountId: cardAccountId ?? null,
        dueDateOverride: body.due_date !== undefined ? explicitDue : shouldRecalc ? null : existing.due_date,
      })
      if (dueResolved.error) {
        return res.status(400).json({ error: dueResolved.error })
      }
      finalDue = dueResolved.due_date
      finalCard = dueResolved.card_account_id
    }
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
      card_account_id = $10,
      tags = coalesce($11, tags),
      notes = coalesce($12, notes),
      dedupe_hash = $13,
      external_fitid = $14,
      paid = $15,
      payment_method = $16,
      source_ref = $17,
      due_date = $18,
      updated_at = now()
     where id = $1 and user_id = $2
     returning *, (${EFF})::text as effective_date`,
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
      finalCard,
      body.tags ?? null,
      body.notes ?? null,
      dedupe_hash,
      external_fitid ?? null,
      paid,
      payment_method,
      source_ref ?? null,
      finalDue,
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

router.post('/bulk-paid', async (req, res) => {
  const ids = req.body?.ids
  const paid = parsePaid(req.body?.paid)
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids obrigatório' })
  }
  if (paid === null) {
    return res.status(400).json({ error: 'paid obrigatório (true|false)' })
  }
  const cleaned = ids.filter((id: unknown) => typeof id === 'string' && id.length > 0)
  if (cleaned.length === 0) {
    return res.status(400).json({ error: 'ids inválidos' })
  }
  const updated = await query<{ id: string }>(
    `update ${T.transactions}
     set paid = $3, updated_at = now()
     where user_id = $1 and id = any($2::uuid[]) and type = 'expense'
     returning id`,
    [req.userId, cleaned, paid],
  )
  res.json({ updated: updated.length })
})

export default router
