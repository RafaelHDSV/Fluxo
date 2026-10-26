import { defineInstitucionalConfig } from '@vieira/institucional'

export const institucionalConfig = defineInstitucionalConfig({
  appName: 'Fluxo',
  appSlug: 'fluxo',
  publicUrl: import.meta.env.VITE_PUBLIC_URL ?? '',
  hasAccount: true,
  legalVersion: '2026-10-25',
  description: 'contas, transações, orçamentos, metas e o mês do seu dinheiro, num diário só seu',
  dataInventory: [
    {
      group: 'Conta',
      items: ['e-mail', 'senha (hash no Supabase Auth)', 'nome de exibição'],
      purpose: 'criar a conta, autenticar e recuperar o acesso',
      basis: 'contrato',
    },
    {
      group: 'Finanças',
      items: [
        'contas e saldos',
        'transações, categorias e regras de descrição',
        'orçamentos e contas a pagar',
        'metas e investimentos',
        'wishlist',
        'arquivos importados (OFX e similares)',
      ],
      purpose: 'organizar o seu dinheiro e mostrar relatórios',
      basis: 'contrato',
    },
  ],
  processors: [
    { name: 'Supabase', purpose: 'autenticação e banco de dados', location: 'EUA' },
    { name: 'Vercel', purpose: 'hospedagem do site e da API', location: 'EUA' },
    { name: 'Resend', purpose: 'envio de e-mails da conta', location: 'EUA' },
    { name: 'Vieira Analytics', purpose: 'contagem anônima de visitas', location: 'EUA' },
    { name: 'Sentry', purpose: 'registro de erros técnicos do app, sem e-mail, IP ou conteúdo seu', location: 'EUA' },
  ],
  extraPrivacyNotes: [
    'O login do Fluxo é o mesmo dos outros apps Vieira que usam o projeto de autenticação compartilhado (hoje: forge, Booker e vital). Excluir os dados do Fluxo apaga o financeiro neste app; o e-mail de login só some se você não tiver dados nos outros.',
  ],
  routes: {
    signIn: '/login',
  },
})
