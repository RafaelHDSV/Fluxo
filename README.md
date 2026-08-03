# Fluxo

Controle financeiro pessoal — dashboard, transações, importação OFX/CSV, orçamentos, investimentos, wishlist, contas a pagar e relatórios.

> Veja seu dinheiro com clareza.

**Epic:** [Fluxo #1](https://github.com/RafaelHDSV/Fluxo/issues/1)

## O que faz

- Consolida contas (débito e crédito) com **saldo como âncora**
- Importa extrato **OFX Santander** (e CSV/OFX genérico) com regras e revisão passo a passo
- Orça por categoria, acompanha **investimentos** (caixinhas) e **wishlist**
- Mostra saúde do período no Dashboard e nos Relatórios (ECharts)
- Separa no crédito a **data da compra** do **vencimento da fatura**

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind + shadcn/ui, ECharts |
| Backend | Express 5 (BFF) |
| Auth / DB | Supabase (Postgres + Auth + RLS) |

## Setup

1. Crie um projeto no Supabase e aplique as migrations em `backend/migrations/` **em ordem** (001 → 007) no SQL Editor.
2. Copie os envs:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

3. Preencha URL, anon key, JWT secret e `DATABASE_URL` do Supabase.
4. Instale e suba:

```bash
yarn
yarn dev
```

| Serviço | URL |
|---------|-----|
| Front | http://localhost:3333 |
| API | http://localhost:3693 |

## Scripts úteis

```bash
cd backend && yarn test     # parsers / dedupe
cd frontend && yarn build
cd backend && yarn build
cd frontend && yarn lint
```

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [`docs/context.md`](./docs/context.md) | Contexto para IA (stack, decisões, migrations) |
| [`docs/especificacao.md`](./docs/especificacao.md) | Produto e escopo |
| [`docs/DESIGN.md`](./docs/DESIGN.md) | Identidade visual |
| [`docs/superpowers/specs/`](./docs/superpowers/specs/) | Specs de features |
| [`.issues/`](./.issues/) | Propostas de implementação |

## Contribuindo

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) e o [Código de Conduta](./CODE_OF_CONDUCT.md).  
Vulnerabilidades: [SECURITY.md](./SECURITY.md).

## Licença

MIT © 2026 Rafael Vieira — [LICENSE](./LICENSE).
