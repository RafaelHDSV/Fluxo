export const accountTypeLabel: Record<string, string> = {
  checking: 'Conta corrente',
  wallet: 'Carteira',
  investment: 'Investimento',
  credit_card: 'Cartão de crédito',
  external: 'Externa',
}

export const transactionTypeLabel: Record<string, string> = {
  income: 'Receita',
  expense: 'Despesa',
  transfer: 'Transferência',
  adjustment: 'Ajuste',
}

export const paymentMethodLabel: Record<string, string> = {
  debit: 'Débito',
  credit: 'Crédito',
}

export const matchTypeLabel: Record<string, string> = {
  contains: 'Contém texto',
  recurring: 'Recorrente',
  source: 'Origem',
}

export const categoryKindLabel: Record<string, string> = {
  income: 'Receita',
  expense: 'Despesa',
  both: 'Ambos',
}

export function labelOf(map: Record<string, string>, value: string | null | undefined, fallback = '—') {
  if (!value) return fallback
  return map[value] ?? value
}
