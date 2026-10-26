import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../../globals/Config.js'

/** Confere a senha no Supabase Auth (grant password) e revoga a sessão criada. */
export async function verifySupabasePassword(email: string, password: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw Object.assign(new Error('password_check_unavailable'), { status: 503 })
  }

  const res = await fetch(new URL('/auth/v1/token?grant_type=password', SUPABASE_URL), {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (res.ok) {
    const body = (await res.json().catch(() => null)) as { access_token?: unknown } | null
    const accessToken = typeof body?.access_token === 'string' ? body.access_token : null
    if (accessToken) {
      await fetch(new URL('/auth/v1/logout', SUPABASE_URL), {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
      }).catch(() => undefined)
    }
    return true
  }
  if (res.status === 400 || res.status === 401) return false
  throw Object.assign(new Error('password_check_unavailable'), { status: 503 })
}
