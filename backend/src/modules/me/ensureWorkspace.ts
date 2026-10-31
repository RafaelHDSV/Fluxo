export type FluxoDefaultCategory = {
  name: string
  kind: 'expense' | 'income' | 'both'
  color: string
}

/** Mesmas 11 categorias da migration 002 (alinhadas ao Notion). */
export const FLUXO_DEFAULT_CATEGORIES: readonly FluxoDefaultCategory[] = [
  { name: 'Alimentação', kind: 'expense', color: '#E6B450' },
  { name: 'Consumo & Compras', kind: 'expense', color: '#FF8F70' },
  { name: 'Custos Fixos', kind: 'expense', color: '#F07178' },
  { name: 'Desenvolvimento Pessoal & Profissional', kind: 'expense', color: '#C3A6FF' },
  { name: 'Estilo de Vida & Lazer', kind: 'expense', color: '#5B8DEF' },
  { name: 'Financeiro Estratégico', kind: 'expense', color: '#3DDC97' },
  { name: 'Outros', kind: 'both', color: '#8B9AAB' },
  { name: 'Social & Afetivo', kind: 'expense', color: '#7AD7F0' },
  { name: 'Transporte & Mobilidade', kind: 'expense', color: '#5B8DEF' },
  { name: 'Salário', kind: 'income', color: '#3DDC97' },
  { name: 'Freelance', kind: 'income', color: '#5B8DEF' },
]

export function displayNameFromEmail(email?: string | null): string {
  const local = email?.split('@')[0]?.trim()
  return local || 'Usuário'
}

export function shouldSeedFluxoWorkspace(profileExists: boolean): boolean {
  return !profileExists
}
