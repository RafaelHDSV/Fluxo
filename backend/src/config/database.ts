import pg from 'pg'
import { DATABASE_URL } from '../globals/Config.js'

const { Pool } = pg

let pool: pg.Pool | null = null
let connecting: Promise<pg.Pool> | null = null

async function connectPool(): Promise<pg.Pool> {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL nao configurada')
  }
  const next = new Pool({
    connectionString: DATABASE_URL,
    // Serverless: evita esgotar conexoes no Supabase
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  })
  await next.query('SELECT 1')
  pool = next
  console.log('PostgreSQL conectado com sucesso!')
  return next
}

/** Lazy connect — seguro em serverless (sem process.exit). */
export async function ensureDatabase(): Promise<pg.Pool> {
  if (pool) return pool
  if (!connecting) {
    connecting = connectPool().catch((error) => {
      connecting = null
      console.error('Erro ao conectar no PostgreSQL', error)
      throw error
    })
  }
  return connecting
}

/** Compativel com server.ts local (conecta na subida). */
async function connectDatabase() {
  await ensureDatabase()
}

export default connectDatabase

export function getPool() {
  if (!pool) {
    throw new Error('Pool nao inicializado')
  }
  return pool
}
