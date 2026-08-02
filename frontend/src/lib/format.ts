export function formatBRL(value: number | string) {
  const n = typeof value === 'number' ? value : Number(value)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(n) ? n : 0,
  )
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
