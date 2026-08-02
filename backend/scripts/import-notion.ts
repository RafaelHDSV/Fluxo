/**
 * One-shot Notion → Fluxo import.
 * Usage (from backend/): npx tsx scripts/import-notion.ts
 * Requires DATABASE_URL and scripts/data/notion-financeiro.json
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const USER_ID = process.env.IMPORT_USER_ID || 'f8eebe9e-d8a8-459f-807f-f0d6398251ae'
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_PATH = join(__dirname, 'data', 'notion-financeiro.json')

const CATEGORY_SEED: Array<{ name: string; kind: string; color: string }> = [
  { name: 'Alimentação', kind: 'expense', color: '#E6B450' },
  { name: 'Consumo & Compras', kind: 'expense', color: '#FF8F70' },
  { name: 'Custos Fixos', kind: 'expense', color: '#F07178' },
  { name: 'Desenvolvimento Pessoal & Profissional', kind: 'expense', color: '#C3A6FF' },
  { name: 'Estilo de Vida & Lazer', kind: 'expense', color: '#5B8DEF' },
  { name: 'Financeiro Estratégico', kind: 'expense', color: '#3DDC97' },
  { name: 'Outros', kind: 'both', color: '#8B9AAB' },
  { name: 'Social & Afetivo', kind: 'expense', color: '#7AD7F0' },
  { name: 'Transporte & Mobilidade', kind: 'expense', color: '#5B8DEF' },
  { name: 'Salário', kind: 'income', color: '#3DDC97' },
  { name: 'Freelance', kind: 'income', color: '#5B8DEF' },
]

type DumpTx = {
  url: string
  Nome: string | null
  Valor: number | null
  data: string | null
  'Tipo de transação': string | null
  Tipo: string | null
  Pago: string | null
  Categorias: string | null
}

type DumpFile = {
  categories: Array<{ url: string; Nome: string }>
  transactions: DumpTx[]
}

function buildDedupeHash(input: { userId: string; accountId: string; sourceRef: string }) {
  // Notion page URL keeps same-day identical descriptions unique
  const base = `${input.userId}|notion|${input.sourceRef}|${input.accountId}`
  return createHash('sha256').update(base).digest('hex')
}

function parseRelationUrl(raw: string | null): string | null {
  if (!raw) return null
  try {
    const arr = JSON.parse(raw) as string[]
    return arr[0] ?? null
  } catch {
    return null
  }
}

function normalizeCategoryUrl(url: string) {
  return url.replace('/p/', '/').replace(/\/$/, '')
}

function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL ausente')

  const dump = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as DumpFile
  if (!dump.transactions?.length) throw new Error('Dump sem transactions')

  const catByUrl = new Map<string, string>()
  for (const c of dump.categories ?? []) {
    catByUrl.set(normalizeCategoryUrl(c.url), c.Nome)
  }

  const pool = new pg.Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  const client = await pool.connect()

  try {
    await client.query('begin')

    const existingAccount = await client.query<{ id: string }>(
      `select id from fluxo_accounts where user_id = $1 and name = 'Santander' limit 1`,
      [USER_ID],
    )
    let accountId = existingAccount.rows[0]?.id
    if (!accountId) {
      const accountRes = await client.query<{ id: string }>(
        `insert into fluxo_accounts (user_id, name, type, balance, color)
         values ($1, 'Santander', 'checking', 0, '#EC0000')
         returning id`,
        [USER_ID],
      )
      accountId = accountRes.rows[0]?.id
    }
    if (!accountId) throw new Error('Falha ao obter conta Santander')

    const categoryIds = new Map<string, string>()
    for (const cat of CATEGORY_SEED) {
      const r = await client.query<{ id: string }>(
        `insert into fluxo_categories (user_id, name, kind, color)
         values ($1, $2, $3, $4)
         on conflict (user_id, name) do update set kind = excluded.kind
         returning id`,
        [USER_ID, cat.name, cat.kind, cat.color],
      )
      categoryIds.set(cat.name, r.rows[0].id)
    }
    const outrosId = categoryIds.get('Outros')!
    const salarioId = categoryIds.get('Salário')!

    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const tx of dump.transactions) {
      if (!tx.url || !tx.data || tx.Valor == null || !tx['Tipo de transação']) {
        skipped++
        continue
      }

      const type = tx['Tipo de transação'] === 'Ganhos' ? 'income' : 'expense'
      const payment_method =
        tx.Tipo === 'Crédito' ? 'credit' : tx.Tipo === 'Débito' ? 'debit' : null
      const paid = tx.Pago === '__YES__'
      const description = (tx.Nome || 'Sem nome').trim()
      const amount = Math.abs(Number(tx.Valor))
      const date = String(tx.data).slice(0, 10)
      const source_ref = tx.url

      let categoryName: string | null = null
      const catUrl = parseRelationUrl(tx.Categorias)
      if (catUrl) categoryName = catByUrl.get(normalizeCategoryUrl(catUrl)) ?? null

      let category_id = categoryName ? categoryIds.get(categoryName) : undefined
      if (!category_id) {
        category_id = type === 'income' ? salarioId : outrosId
      }

      const dedupe_hash = buildDedupeHash({
        userId: USER_ID,
        accountId,
        sourceRef: source_ref,
      })

      const result = await client.query(
        `insert into fluxo_transactions
          (user_id, date, description, amount, type, category_id, account_id,
           tags, dedupe_hash, paid, payment_method, source_ref)
         values ($1,$2,$3,$4,$5,$6,$7,'{}',$8,$9,$10,$11)
         on conflict (user_id, source_ref) where source_ref is not null
         do update set
           date = excluded.date,
           description = excluded.description,
           amount = excluded.amount,
           type = excluded.type,
           category_id = excluded.category_id,
           account_id = excluded.account_id,
           paid = excluded.paid,
           payment_method = excluded.payment_method,
           dedupe_hash = excluded.dedupe_hash,
           updated_at = now()
         returning (xmax = 0) as inserted`,
        [
          USER_ID,
          date,
          description,
          amount,
          type,
          category_id,
          accountId,
          dedupe_hash,
          paid,
          payment_method,
          source_ref,
        ],
      )

      if (result.rows[0]?.inserted) inserted++
      else updated++
    }

    // Budgets: categories with expense in current month (America/Sao_Paulo ≈ UTC-3)
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000)
    const cur = monthStart(now)
    const curISO = toISODate(cur)
    const prevStart = addMonths(cur, -3)
    const prevEnd = addMonths(cur, 0)

    const spendCur = await client.query<{ category_id: string }>(
      `select distinct category_id from fluxo_transactions
       where user_id = $1 and type = 'expense'
         and date >= $2::date and date < $3::date`,
      [USER_ID, curISO, toISODate(addMonths(cur, 1))],
    )

    let budgets = 0
    for (const row of spendCur.rows) {
      const avgRow = await client.query<{ avg: string }>(
        `select coalesce(sum(amount), 0) / 3.0 as avg
         from fluxo_transactions
         where user_id = $1 and category_id = $2 and type = 'expense'
           and date >= $3::date and date < $4::date`,
        [USER_ID, row.category_id, toISODate(prevStart), toISODate(prevEnd)],
      )
      const avg = Number(avgRow.rows[0]?.avg ?? 0)
      if (avg <= 0) continue

      await client.query(
        `insert into fluxo_budgets (user_id, category_id, month, amount_limit)
         values ($1, $2, $3::date, $4)
         on conflict (user_id, category_id, month)
         do update set amount_limit = excluded.amount_limit`,
        [USER_ID, row.category_id, curISO, Math.round(avg * 100) / 100],
      )
      budgets++
    }

    await client.query('commit')

    const counts = await client.query(
      `select
         count(*)::int as total,
         count(*) filter (where type = 'income')::int as income,
         count(*) filter (where type = 'expense')::int as expense,
         count(*) filter (where type = 'expense' and payment_method = 'credit')::int as credit,
         count(*) filter (where type = 'expense' and payment_method = 'debit')::int as debit
       from fluxo_transactions where user_id = $1 and source_ref is not null`,
      [USER_ID],
    )

    console.log(
      JSON.stringify(
        {
          userId: USER_ID,
          accountId,
          inserted,
          updated,
          skipped,
          budgets,
          counts: counts.rows[0],
        },
        null,
        2,
      ),
    )
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
