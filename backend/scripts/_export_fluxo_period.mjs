import 'dotenv/config'
import pg from 'pg'
import fs from 'node:fs'

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()
const { rows } = await client.query(
  `select id::text, date::text, type, amount::numeric as amount, description, paid,
          external_fitid, source_ref, account_id::text
   from fluxo_transactions
   where user_id = 'f8eebe9e-d8a8-459f-807f-f0d6398251ae'
     and date between '2026-07-01' and '2026-08-03'
   order by date, amount, description`,
)
fs.writeFileSync('../ofx/_fluxo_period.json', JSON.stringify(rows, null, 2))
console.log('wrote', rows.length)
await client.end()
