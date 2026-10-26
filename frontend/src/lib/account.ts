import type { LegalAcceptance } from '@vieira/institucional'
import { api } from '@/services/api'

const ERROR_COPY: Record<string, string> = {
  invalid_password: 'Senha incorreta.',
  password_required: 'Informe a senha atual.',
  protected_account: 'Esta conta não pode ser excluída pela interface.',
  password_check_unavailable: 'Não foi possível conferir a senha agora. Tente de novo em instantes.',
}

function readable(error: unknown): Error {
  const code = error instanceof Error ? error.message : ''
  return new Error(ERROR_COPY[code] ?? 'Não foi possível concluir. Tente de novo.')
}

export async function fetchLegalAcceptance(): Promise<LegalAcceptance | null> {
  const { acceptance } = await api.get<{ acceptance: LegalAcceptance | null }>('/api/v1/me/legal')
  return acceptance
}

export async function acceptLegal(
  version: string,
  options?: { acceptedAt?: string },
): Promise<LegalAcceptance> {
  const { acceptance } = await api.post<{ acceptance: LegalAcceptance }>('/api/v1/me/legal', {
    version,
    acceptedAt: options?.acceptedAt,
  })
  return acceptance
}

export async function exportMyData(): Promise<unknown> {
  try {
    return await api.get<unknown>('/api/v1/me/export')
  } catch (error) {
    throw readable(error)
  }
}

export async function deleteMyAccount(password: string): Promise<string> {
  try {
    const { message } = await api.delete<{ message: string }>('/api/v1/me', { password })
    return message
  } catch (error) {
    throw readable(error)
  }
}
