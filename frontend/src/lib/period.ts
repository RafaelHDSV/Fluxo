export type PeriodMode = 'month' | 'year' | 'all'

export function periodBounds(
  mode: PeriodMode,
  year?: number,
  month?: number,
): { from?: string; to?: string; label: string } {
  const now = new Date()
  const y = year ?? now.getFullYear()
  const m = month ?? now.getMonth() + 1

  if (mode === 'all') {
    return { label: 'Todo o histórico' }
  }
  if (mode === 'year') {
    return {
      from: `${y}-01-01`,
      to: `${y}-12-31`,
      label: String(y),
    }
  }
  const last = new Date(y, m, 0)
  const from = `${y}-${String(m).padStart(2, '0')}-01`
  const to = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1),
  )
  return { from, to, label: label.charAt(0).toUpperCase() + label.slice(1) }
}

export function currentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
