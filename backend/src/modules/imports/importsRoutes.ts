import { Router } from 'express'
import multer from 'multer'
import { query, queryOne } from '../../lib/db.js'
import { T } from '../../lib/tables.js'
import { buildDedupeHash, toNumber } from '../../lib/money.js'
import { requireAuth } from '../../middleware/auth.js'
import { suggestCategoryId } from '../categories/suggestCategory.js'
import { parseCsv, parseOfx } from './parsers.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
const router = Router()
router.use(requireAuth)

router.post('/preview', upload.single('file'), async (req, res) => {
  const file = req.file
  const accountId = String(req.body.account_id || '')
  if (!file) return res.status(400).json({ error: 'Arquivo obrigatório' })
  if (!accountId) return res.status(400).json({ error: 'account_id obrigatório' })

  const content = file.buffer.toString('utf8')
  const isOfx = /\.ofx$/i.test(file.originalname) || content.includes('<OFX')
  const sourceType = isOfx ? 'ofx' : 'csv'
  const mapping = req.body.mapping ? JSON.parse(String(req.body.mapping)) : undefined
  const parsed = isOfx ? parseOfx(content) : parseCsv(content, mapping)

  const imp = await queryOne<{ id: string }>(
    `insert into ${T.imports} (user_id, filename, source_type, status, account_id)
     values ($1,$2,$3,'preview',$4) returning id`,
    [req.userId, file.originalname, sourceType, accountId],
  )

  const existing = await query<{ dedupe_hash: string }>(
    `select dedupe_hash from ${T.transactions} where user_id = $1`,
    [req.userId],
  )
  const existingSet = new Set(existing.map((e) => e.dedupe_hash))

  const rows = []
  for (const p of parsed) {
    const dedupe_hash = buildDedupeHash({
      userId: req.userId!,
      date: p.date,
      amount: p.amount,
      description: p.description,
      accountId,
      fitid: p.external_fitid,
    })
    const suggested_category_id = await suggestCategoryId(req.userId!, p.description)
    const is_duplicate = existingSet.has(dedupe_hash)
    const inserted = await queryOne(
      `insert into ${T.importRows}
        (import_id, user_id, raw, date, description, amount, type, external_fitid, dedupe_hash,
         suggested_category_id, is_duplicate, selected)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       returning *`,
      [
        imp!.id,
        req.userId,
        JSON.stringify(p.raw),
        p.date,
        p.description,
        p.amount,
        p.type,
        p.external_fitid ?? null,
        dedupe_hash,
        suggested_category_id,
        is_duplicate,
        !is_duplicate,
      ],
    )
    rows.push(inserted)
  }

  res.status(201).json({ import: imp, rows })
})

router.get('/:id', async (req, res) => {
  const imp = await queryOne(`select * from ${T.imports} where id = $1 and user_id = $2`, [
    req.params.id,
    req.userId,
  ])
  if (!imp) return res.status(404).json({ error: 'Importação não encontrada' })
  const rows = await query(
    `select * from ${T.importRows} where import_id = $1 and user_id = $2 order by date`,
    [req.params.id, req.userId],
  )
  res.json({ import: imp, rows })
})

router.post('/:id/commit', async (req, res) => {
  const imp = await queryOne<{ id: string; account_id: string; status: string }>(
    `select * from ${T.imports} where id = $1 and user_id = $2`,
    [req.params.id, req.userId],
  )
  if (!imp) return res.status(404).json({ error: 'Importação não encontrada' })
  if (imp.status === 'committed') {
    return res.status(400).json({ error: 'Importação já confirmada' })
  }

  const selectedIds: string[] | undefined = req.body?.row_ids
  const params: unknown[] = [req.params.id, req.userId]
  let sql = `select * from ${T.importRows} where import_id = $1 and user_id = $2 and selected = true and is_duplicate = false`
  if (selectedIds?.length) {
    params.push(selectedIds)
    sql = `select * from ${T.importRows} where import_id = $1 and user_id = $2 and id = any($3::uuid[]) and is_duplicate = false`
  }

  const rows = await query<{
    id: string
    date: string
    description: string
    amount: string
    type: string
    suggested_category_id: string | null
    dedupe_hash: string
    external_fitid: string | null
  }>(sql, params)

  let created = 0
  for (const row of rows) {
    if (!row.suggested_category_id) continue
    try {
      await queryOne(
        `insert into ${T.transactions}
          (user_id, date, description, amount, type, category_id, account_id, tags, dedupe_hash, external_fitid, import_id)
         values ($1,$2,$3,$4,$5,$6,$7,'{}',$8,$9,$10)
         on conflict (user_id, dedupe_hash) do nothing
         returning id`,
        [
          req.userId,
          row.date,
          row.description,
          toNumber(row.amount),
          row.type,
          row.suggested_category_id,
          imp.account_id,
          row.dedupe_hash,
          row.external_fitid,
          imp.id,
        ],
      )
      created += 1
    } catch {
      // skip individual failures
    }
  }

  await queryOne(`update ${T.imports} set status = 'committed' where id = $1`, [imp.id])
  res.json({ created, skipped: rows.length - created })
})

export default router
