export const accountTypeLabel: Record<string, string> = {
  checking: 'Conta corrente',
  credit_card: 'Cartão de crédito',
}

/** Tipos ainda aceitos na API/legado, só para exibição de contas antigas. */
export const accountTypeLabelAll: Record<string, string> = {
  ...accountTypeLabel,
  wallet: 'Carteira',
  investment: 'Investimento',
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
