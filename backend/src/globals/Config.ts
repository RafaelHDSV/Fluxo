import dotenv from 'dotenv'

dotenv.config()

export const PORT = Number(process.env.PORT) || 3693
export const DATABASE_URL = process.env.DATABASE_URL
export const SUPABASE_URL = process.env.SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''
export const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || ''
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3333'
