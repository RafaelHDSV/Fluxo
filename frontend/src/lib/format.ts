export function formatBRL(value: number | string) {
  const n = typeof value === 'number' ? value : Number(value)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(n) ? n : 0,
  )
}

/** Valor com sinal explícito: receita +, despesa − (NBSP evita quebra de linha). */
export function formatSignedBRL(
  value: number | string,
  type: 'income' | 'expense' | 'transfer' | 'adjustment' | string,
) {
  const formatted = formatBRL(value)
  if (type === 'income') return `+\u00A0${formatted}`
  if (type === 'expense') return `-\u00A0${formatted}`
  return formatted
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Exibe data amigável (DD/MM/YYYY). Aceita ISO date ou datetime. */
export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  const raw = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10)
  const [y, m, d] = raw.split('-')
  if (!y || !m || !d) return String(value)
  return `${d}/${m}/${y}`
}

/** Exibe mês (ex.: ago/2026 ou Agosto 2026). */
export function formatMonth(value: string | null | undefined, style: 'short' | 'long' = 'short') {
  if (!value) return '—'
  const raw = value.slice(0, 7)
  const [y, m] = raw.split('-')
  const monthIdx = Number(m) - 1
  if (!y || !Number.isFinite(monthIdx) || monthIdx < 0 || monthIdx > 11) return value
  const date = new Date(Number(y), monthIdx, 1)
  if (style === 'long') {
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
    return label.charAt(0).toUpperCase() + label.slice(1)
  }
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date).replace('.', '')
}

export function formatDeltaPct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function currentMonthBounds() {
  const now = new Date()
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const to = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  return { from, to }
}
