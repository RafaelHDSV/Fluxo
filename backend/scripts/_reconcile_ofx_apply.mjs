import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { createHash } from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

const USER_ID = 'f8eebe9e-d8a8-459f-807f-f0d6398251ae'
const ACCOUNT_ID = '1b71cb24-375d-496e-b933-322ee337a4fc'

function normalizeDescription(description) {
  return description
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function buildDedupeHash({ userId, date, amount, description, accountId, fitid }) {
  const effectiveFitid = fitid && fitid !== '000000' ? fitid : null
  const base = effectiveFitid
    ? `${userId}|fitid|${effectiveFitid}|${accountId}`
    : [userId, date, Number(amount).toFixed(2), normalizeDescription(description), accountId].join('|')
  return createHash('sha256').update(base).digest('hex')
}

const softDupes = [
  {
    notionId: '93f03734-a2b3-4e56-a33a-d4457db74d06',
    ofxId: 'aed0a6d2-a2ea-4b27-aa42-23694f7e8fb1',
    friendly: 'Almoço',
  },
  {
    notionId: 'aec816a4-8c85-4f07-bff6-8d601a8c237b',
    ofxId: '3307d41c-1477-4c39-afed-7d30159c164e',
    friendly: 'Mercado',
  },
  {
    notionId: '90a1ccc0-138c-4d3e-be87-78f2a4351f9c',
    ofxId: '7c2d9a55-b748-4393-afa6-73aca7d60027',
    friendly: 'Almoço',
  },
  {
    notionId: 'd1903375-996d-4bbb-a60f-8c95e163dfd0',
    ofxId: 'bac14d67-35b9-42b8-ab02-c1e0bdcbd185',
    friendly: 'Johnny Joy',
  },
  {
    notionId: 'cda21514-3a3a-4b3c-b644-dbfc404451a7',
    ofxId: 'ee114137-e568-45b0-8ece-44ae2981b766',
    friendly: 'Almoço',
  },
  {
    notionId: '72c83aab-54b9-4c75-876b-6e18148d7200',
    ofxId: '0aa1931a-25b1-4def-a724-b817efaecbbd',
    friendly: 'Mercado',
  },
  {
    notionId: 'ae70d598-62f1-45cd-9e88-5123b0660030',
    ofxId: 'b8089615-8ba5-42e6-a455-7cdbda53e9f4',
    friendly: 'Seguro Santander',
  },
]

function parseOfx(content) {
  function parseDate(v) {
    const m = v.trim().match(/^(\d{4})(\d{2})(\d{2})/)
    return m ? `${m[1]}-${m[2]}-${m[3]}` : v.slice(0, 10)
  }
  function get(block, tag) {
    const m = block.match(new RegExp(`<${tag}>([^\\n<]+)`, 'i'))
    return m?.[1]?.trim() ?? ''
  }
  return content
    .split(/<STMTTRN>/i)
    .slice(1)
    .map((b) => {
      const tr = get(b, 'TRNAMT')
      const signed = Number(String(tr).replace(',', '.')) || 0
      const fitidRaw = get(b, 'FITID') || null
      return {
        date: parseDate(get(b, 'DTPOSTED')),
        description: get(b, 'MEMO') || get(b, 'NAME') || 'OFX',
        amount: Math.abs(signed),
        type: signed < 0 ? 'expense' : 'income',
        fitid: fitidRaw && fitidRaw !== '000000' ? fitidRaw : null,
      }
    })
    .filter((r) => r.date && r.amount > 0)
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()

try {
  await client.query('begin')

  // 1) Rename OFX rows with friendly Notion labels, then delete Notion dupes
  for (const d of softDupes) {
    await client.query(`update fluxo_transactions set description = $1 where id = $2::uuid and user_id = $3`, [
      d.friendly,
      d.ofxId,
      USER_ID,
    ])
  }

  const notionIds = softDupes.map((d) => d.notionId)
  const del = await client.query(
    `delete from fluxo_transactions
     where user_id = $1 and id = any($2::uuid[])
     returning id::text, description, amount::text, date::text`,
    [USER_ID, notionIds],
  )
  console.log('deleted_notion_dupes', del.rowCount)

  // 2) Load remaining fluxo rows in period for soft-match skip
  const { rows: existing } = await client.query(
    `select id::text, date::text, type, amount::numeric as amount, description, external_fitid
     from fluxo_transactions
     where user_id = $1 and date between '2026-07-01' and '2026-08-03'`,
    [USER_ID],
  )

  const ofx = parseOfx(fs.readFileSync(path.join(root, 'ofx/01-07---02-08.ofx'), 'utf8'))
  const existingFitids = new Set(existing.map((t) => t.external_fitid).filter(Boolean))

  function softMatched(o) {
    return existing.some((t) => {
      if (t.type !== o.type) return false
      if (Math.abs(Number(t.amount) - o.amount) > 0.009) return false
      return Math.abs(Date.parse(t.date) - Date.parse(o.date)) <= 2 * 86400000
    })
  }

  const toInsert = []
  for (const o of ofx) {
    if (o.fitid && existingFitids.has(o.fitid)) continue
    if (softMatched(o)) continue
    toInsert.push(o)
  }

  console.log('to_insert', toInsert.length)
  for (const o of toInsert) {
    console.log(`  + ${o.date} ${o.type} ${o.amount.toFixed(2)} ${o.description}`)
  }

  const { rows: catRows } = await client.query(
    `select id::text, name, kind from fluxo_categories where user_id = $1`,
    [USER_ID],
  )
  const catByName = Object.fromEntries(catRows.map((c) => [c.name, c.id]))
  const fallbackExpense = catByName['Outros'] || catByName['Consumo & Compras']
  const fallbackIncome = catByName['Outros'] || catByName['Freelance']

  function pickCategory(o) {
    const d = o.description.toLowerCase()
    if (o.type === 'income') return fallbackIncome
    if (d.includes('ifood') || d.includes('tuna')) return catByName['Alimentação'] || fallbackExpense
    if (d.includes('marketplace') || d.includes('american product') || d.includes('alpha')) {
      return catByName['Consumo & Compras'] || fallbackExpense
    }
    if (d.includes('syllos')) return catByName['Estilo de Vida & Lazer'] || fallbackExpense
    return fallbackExpense
  }

  let inserted = 0
  for (const o of toInsert) {
    const categoryId = pickCategory(o)
    if (!categoryId) throw new Error(`Sem categoria para ${o.description}`)
    const dedupe = buildDedupeHash({
      userId: USER_ID,
      date: o.date,
      amount: o.amount,
      description: o.description,
      accountId: ACCOUNT_ID,
      fitid: o.fitid,
    })
    const r = await client.query(
      `insert into fluxo_transactions
        (user_id, date, description, amount, type, category_id, account_id, dedupe_hash, external_fitid, paid, payment_method)
       values ($1, $2::date, $3, $4, $5, $6::uuid, $7::uuid, $8, $9, true, 'debit')
       on conflict (user_id, dedupe_hash) do nothing
       returning id::text`,
      [USER_ID, o.date, o.description, o.amount, o.type, categoryId, ACCOUNT_ID, dedupe, o.fitid],
    )
    if (r.rowCount) inserted += 1
  }

  await client.query('commit')

  const { rows: summary } = await client.query(
    `select count(*)::int as total,
            count(*) filter (where source_ref ilike '%notion%')::int as notion,
            count(*) filter (where external_fitid is not null)::int as ofx_fitid,
            coalesce(sum(case when type='income' then amount else 0 end),0)::text as income,
            coalesce(sum(case when type='expense' then amount else 0 end),0)::text as expense
     from fluxo_transactions
     where user_id = $1 and date between '2026-07-01' and '2026-08-03'`,
    [USER_ID],
  )

  console.log(JSON.stringify({ deleted: del.rowCount, inserted, period: summary[0] }, null, 2))
} catch (e) {
  await client.query('rollback')
  console.error(e)
  process.exitCode = 1
} finally {
  await client.end()
}
