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
  const base = input.fitid
    ? `${input.userId}|fitid|${input.fitid}|${input.accountId}`
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
