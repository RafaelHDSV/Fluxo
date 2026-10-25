import dotenv from 'dotenv'

dotenv.config()

export const PORT = Number(process.env.PORT) || 3693
export const DATABASE_URL = process.env.DATABASE_URL
export const SUPABASE_URL = process.env.SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''
export const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || ''
export const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
export const MAIL_FROM = process.env.MAIL_FROM || 'Vieira <noreply@getvieira.com>'
export const PROTECTED_EMAILS = (process.env.VIEIRA_PROTECTED_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3333'
