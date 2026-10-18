import type { LucideIcon } from 'lucide-react'
import { FileSpreadsheet, PieChart, LayoutDashboard } from 'lucide-react'

export type AuthBenefit = {
  icon: LucideIcon
  text: string
}

export type AuthPresentationConfig = {
  name: string
  tagline: string
  description: string
  benefits: [AuthBenefit, AuthBenefit, AuthBenefit]
}

/** Copy for /login and /register. Visuals live in AuthProductIllustration (themed). */
export const authPresentation: AuthPresentationConfig = {
  name: 'Fluxo',
  tagline: 'Veja seu dinheiro com clareza.',
  description:
    'Controle financeiro pessoal com contas, categorias, orçamentos e metas num painel só.',
  benefits: [
    {
      icon: FileSpreadsheet,
      text: 'Importação mensal de extrato OFX (Santander)',
    },
    {
      icon: PieChart,
      text: 'Orçamento por categoria e metas',
    },
    {
      icon: LayoutDashboard,
      text: 'Dashboard e relatórios do mês',
    },
  ],
}
