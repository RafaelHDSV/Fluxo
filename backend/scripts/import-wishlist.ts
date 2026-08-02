/**
 * One-shot Notion Wishlist → Fluxo.
 * Usage (from backend/): npx tsx scripts/import-wishlist.ts
 * Requires DATABASE_URL and scripts/data/notion-wishlist.json
 * Apply migration 003_wishlist.sql first.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const USER_ID = process.env.IMPORT_USER_ID || 'f8eebe9e-d8a8-459f-807f-f0d6398251ae'
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_PATH = join(__dirname, 'data', 'notion-wishlist.json')

type Item = {
  name: string
  price: number
  saved_amount?: number
  category?: string | null
  url?: string | null
  purchased?: boolean
  source_ref?: string | null
}

async function main() {
  const dump = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as { items: Item[] }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  let inserted = 0
  let skipped = 0

  for (const item of dump.items) {
    if (!item.name) {
      skipped += 1
      continue
    }
    try {
      const res = await client.query(
        `insert into fluxo_wishlist
          (user_id, name, price, saved_amount, category, url, purchased, source_ref)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (user_id, source_ref) where source_ref is not null do nothing
         returning id`,
        [
          USER_ID,
          item.name,
          item.price ?? 0,
          item.saved_amount ?? 0,
          item.category ?? null,
          item.url || null,
          Boolean(item.purchased),
          item.source_ref || null,
        ],
      )
      if (res.rowCount) inserted += 1
      else skipped += 1
    } catch (err) {
      // fallback if partial unique doesn't catch via ON CONFLICT
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('unique') || msg.includes('duplicate')) skipped += 1
      else throw err
    }
  }

  console.log(JSON.stringify({ inserted, skipped, total: dump.items.length }))
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
