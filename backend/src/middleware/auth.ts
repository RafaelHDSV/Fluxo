import type { NextFunction, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { SUPABASE_JWT_SECRET, SUPABASE_URL } from '../globals/Config.js'

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJwks() {
  if (!SUPABASE_URL) return null
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  }
  return jwks
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente' })
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) {
    return res.status(401).json({ error: 'Token ausente' })
  }

  try {
    let payload: { sub?: string }

    if (SUPABASE_JWT_SECRET) {
      const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET)
      const verified = await jwtVerify(token, secret, {
        algorithms: ['HS256'],
      })
      payload = verified.payload
    } else {
      const keys = getJwks()
      if (!keys) {
        return res.status(500).json({ error: 'Auth não configurada (SUPABASE_JWT_SECRET ou SUPABASE_URL)' })
      }
      const verified = await jwtVerify(token, keys)
      payload = verified.payload
    }

    if (!payload.sub) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    req.userId = payload.sub
    req.accessToken = token
    return next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}
