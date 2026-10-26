import assert from 'node:assert/strict'
import { inspectDeleteMe, runDeleteMe } from './deleteMe.js'

const USER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const EMAIL = 'user@example.com'
const PROTECTED = ['owner@example.com']

assert.deepEqual(inspectDeleteMe({ password: 'x', protectedEmails: PROTECTED }), {
  ok: false,
  status: 401,
  error: 'Token ausente',
})

assert.deepEqual(
  inspectDeleteMe({ userId: USER_ID, email: EMAIL, password: '', protectedEmails: PROTECTED }),
  { ok: false, status: 400, error: 'password_required' },
)

assert.deepEqual(
  inspectDeleteMe({ userId: USER_ID, email: null, password: 'secret', protectedEmails: PROTECTED }),
  { ok: false, status: 400, error: 'email_unavailable' },
)

assert.deepEqual(
  inspectDeleteMe({
    userId: USER_ID,
    email: 'owner@example.com',
    password: 'secret',
    protectedEmails: PROTECTED,
  }),
  { ok: false, status: 403, error: 'protected_account' },
)

{
  const deleted: Array<{ userId: string; emails: string[] }> = []
  const result = await runDeleteMe({
    userId: USER_ID,
    email: EMAIL,
    password: 'wrong',
    protectedEmails: PROTECTED,
    bodyUserId: 'other-user',
    verifyPassword: async () => false,
    deleteData: async (userId, emails) => {
      deleted.push({ userId, emails })
    },
  })
  assert.deepEqual(result, { status: 401, body: { error: 'invalid_password' } })
  assert.equal(deleted.length, 0)
}

{
  const deleted: Array<{ userId: string; emails: string[] }> = []
  const result = await runDeleteMe({
    userId: USER_ID,
    email: EMAIL,
    password: 'secret',
    protectedEmails: PROTECTED,
    bodyUserId: 'other-user',
    verifyPassword: async (email, password) => email === EMAIL && password === 'secret',
    deleteData: async (userId, emails) => {
      deleted.push({ userId, emails })
    },
  })
  assert.equal(result.status, 200)
  assert.equal(result.deletedUserId, USER_ID)
  assert.deepEqual(deleted, [{ userId: USER_ID, emails: PROTECTED }])
}

console.log('deleteMe.test.ts ok')
