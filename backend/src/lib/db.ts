import { getPool } from '../config/database.js'

export async function query<T = unknown>(text: string, params: unknown[] = []) {
  const result = await getPool().query(text, params)
  return result.rows as T[]
}

export async function queryOne<T = unknown>(text: string, params: unknown[] = []) {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}
