export type DeleteMeFail = { ok: false; status: number; error: string }
export type DeleteMeOk = { ok: true; userId: string; email: string; password: string }

export function inspectDeleteMe(input: {
  userId?: string
  email?: string | null
  password: unknown
  protectedEmails: string[]
}): DeleteMeFail | DeleteMeOk {
  if (!input.userId) return { ok: false, status: 401, error: 'Token ausente' }
  if (typeof input.password !== 'string' || input.password.length === 0) {
    return { ok: false, status: 400, error: 'password_required' }
  }
  if (!input.email) return { ok: false, status: 400, error: 'email_unavailable' }
  if (input.protectedEmails.includes(input.email.toLowerCase())) {
    return { ok: false, status: 403, error: 'protected_account' }
  }
  return { ok: true, userId: input.userId, email: input.email, password: input.password }
}

export async function runDeleteMe(input: {
  userId?: string
  email?: string | null
  password: unknown
  protectedEmails: string[]
  bodyUserId?: unknown
  verifyPassword: (email: string, password: string) => Promise<boolean>
  deleteData: (userId: string, emails: string[]) => Promise<unknown>
}): Promise<{ status: number; body: Record<string, unknown>; deletedUserId?: string }> {
  const inspected = inspectDeleteMe(input)
  if (!inspected.ok) return { status: inspected.status, body: { error: inspected.error } }
  if (!(await input.verifyPassword(inspected.email, inspected.password))) {
    return { status: 401, body: { error: 'invalid_password' } }
  }
  await input.deleteData(inspected.userId, input.protectedEmails)
  return {
    status: 200,
    body: { message: 'Seus dados do Fluxo foram excluídos.' },
    deletedUserId: inspected.userId,
  }
}
