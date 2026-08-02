/** Clamp day into the month (handles 29–31). */
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

/**
 * Calcula o vencimento da fatura a partir da data da compra e do ciclo do cartão.
 *
 * 1) Fechamento: se day(compra) <= closingDay → fechamento no mês da compra; senão no mês seguinte.
 * 2) Vencimento: primeiro dueDay estritamente após o fechamento.
 */
export function computeCreditDueDate(
  purchaseDate: string,
  closingDay: number,
  dueDay: number,
): string {
  if (!Number.isInteger(closingDay) || closingDay < 1 || closingDay > 31) {
    throw new Error('closing_day inválido')
  }
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    throw new Error('due_day inválido')
  }

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
  // Primeiro dueDay estritamente após o fechamento
  if (dueDay > closing.day) {
    // mesmo mês do fechamento
  } else {
    dueMonth += 1
    if (dueMonth > 11) {
      dueMonth = 0
      dueYear += 1
    }
  }
  return ymd(dueYear, dueMonth, dueDay)
}

/** SQL fragment: data efetiva (vencimento no crédito, senão date). Prefixo de alias opcional. */
export function effectiveDateSql(alias = '') {
  const col = alias ? `${alias}.` : ''
  return `coalesce(case when ${col}payment_method = 'credit' then ${col}due_date end, ${col}date)`
}
