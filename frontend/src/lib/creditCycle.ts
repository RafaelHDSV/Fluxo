/** Mirror of backend `computeCreditDueDate` for preview in the form. */
function clampDay(year: number, monthIndex: number, day: number) {
  const last = new Date(year, monthIndex + 1, 0).getDate()
  return Math.min(day, last)
}

function ymd(year: number, monthIndex: number, day: number) {
  const d = clampDay(year, monthIndex, day)
  const mm = String(monthIndex + 1).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function parseISODate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) throw new Error(`Data inválida: ${iso}`)
  return { year: y, monthIndex: m - 1, day: d }
}

export function computeCreditDueDate(
  purchaseDate: string,
  closingDay: number,
  dueDay: number,
): string {
  const p = parseISODate(purchaseDate)
  let closeYear = p.year
  let closeMonth = p.monthIndex
  if (p.day > closingDay) {
    closeMonth += 1
    if (closeMonth > 11) {
      closeMonth = 0
      closeYear += 1
    }
  }
  const closing = parseISODate(ymd(closeYear, closeMonth, closingDay))
  let dueYear = closing.year
  let dueMonth = closing.monthIndex
  if (dueDay <= closing.day) {
    dueMonth += 1
    if (dueMonth > 11) {
      dueMonth = 0
      dueYear += 1
    }
  }
  return ymd(dueYear, dueMonth, dueDay)
}
