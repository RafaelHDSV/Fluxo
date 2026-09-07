import { createHash } from 'node:crypto'

export function normalizeDescription(description: string) {
  return description
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildDedupeHash(input: {
  userId: string
  date: string
  amount: number
  description: string
  accountId: string
  fitid?: string | null
}) {
  const fitid = input.fitid && input.fitid !== '000000' ? input.fitid : null
  // Santander reutiliza FITID em parcelas recorrentes (ex.: seguro) — incluir a data.
  const base = fitid
    ? `${input.userId}|fitid|${fitid}|${input.accountId}|${input.date}`
    : [
        input.userId,
        input.date,
        Number(input.amount).toFixed(2),
        normalizeDescription(input.description),
        input.accountId,
      ].join('|')

  return createHash('sha256').update(base).digest('hex')
}

export function toNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(n)) return 0
  return n
}
