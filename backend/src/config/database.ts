import pg from 'pg'
import { DATABASE_URL } from '../globals/Config.js'

const { Pool } = pg

let pool: pg.Pool | null = null

async function connectDatabase() {
  try {
    pool = new Pool({ connectionString: DATABASE_URL })
    await pool.query('SELECT 1')
    console.log('PostgreSQL conectado com sucesso!')
  } catch (error) {
    console.error('Erro ao conectar no PostgreSQL', error)
    process.exit(1)
  }
}

export default connectDatabase
export function getPool() {
  if (!pool) {
    throw new Error('Pool nao inicializado')
  }
  return pool
}
