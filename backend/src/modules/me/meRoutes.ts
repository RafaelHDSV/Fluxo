import { Router } from 'express'
import { accountRepo } from '../../db/accountRepo.js'
import { PROTECTED_EMAILS } from '../../globals/Config.js'
import { requireAuth } from '../../middleware/auth.js'
import { sendDeletionEmail } from '../../services/account/sendDeletionEmail.js'
import { verifySupabasePassword } from '../../services/account/verifyPassword.js'

const router = Router()
router.use(requireAuth)

const VERSION_RE = /^\d{4}-\d{2}-\d{2}$/
const DELETED_MESSAGE = 'Seus dados do Fluxo foram excluídos.'

function parseAcceptedAt(raw: unknown): Date | { error: string } {
  if (raw == null) return new Date()
  const date = new Date(String(raw))
  const now = Date.now()
  if (Number.isNaN(date.getTime()) || date.getTime() > now + 5 * 60_000) {
    return { error: 'invalid_accepted_at' }
  }
  return date
}

router.get('/me/legal', async (req, res, next) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Token ausente' })
    res.json({ acceptance: await accountRepo(req.userId).getLegal() })
  } catch (error) {
    next(error)
  }
})

router.post('/me/legal', async (req, res, next) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Token ausente' })
    const version = req.body?.version
    if (typeof version !== 'string' || !VERSION_RE.test(version)) {
      return res.status(400).json({ error: 'invalid_version' })
    }
    const acceptedAt = parseAcceptedAt(req.body?.acceptedAt)
    if ('error' in acceptedAt) {
      return res.status(400).json({ error: acceptedAt.error })
    }
    const acceptance = await accountRepo(req.userId).acceptLegal(version, acceptedAt)
    res.json({ acceptance })
  } catch (error) {
    next(error)
  }
})

router.get('/me/export', async (req, res, next) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Token ausente' })
    const data = await accountRepo(req.userId).exportData()
    res.setHeader('Cache-Control', 'no-store')
    res.json({
      app: 'fluxo',
      account: { id: req.userId, email: req.email ?? null },
      data,
    })
  } catch (error) {
    next(error)
  }
})

router.delete('/me', async (req, res, next) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Token ausente' })
    const email = req.email ?? null
    const password = req.body?.password

    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'password_required' })
    }
    if (!email) {
      return res.status(400).json({ error: 'email_unavailable' })
    }
    if (PROTECTED_EMAILS.includes(email.toLowerCase())) {
      return res.status(403).json({ error: 'protected_account' })
    }

    if (!(await verifySupabasePassword(email, password))) {
      return res.status(401).json({ error: 'invalid_password' })
    }

    try {
      await accountRepo(req.userId).deleteData(PROTECTED_EMAILS)
    } catch (error) {
      if (error instanceof Error && error.message.includes('protected_account')) {
        return res.status(403).json({ error: 'protected_account' })
      }
      throw error
    }

    await sendDeletionEmail(email)
    return res.json({ message: DELETED_MESSAGE })
  } catch (error) {
    next(error)
  }
})

export default router
