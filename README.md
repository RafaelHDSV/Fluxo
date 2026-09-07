# Fluxo

> Veja seu dinheiro com clareza.

Controle financeiro pessoal para entender o mês sem virar planilha: contas, lançamentos, importação de extrato, orçamentos, caixinhas de investimento, a pagar, dashboard e relatórios.

Uso individual em **BRL**, com autenticação Supabase e dados isolados por usuário (RLS).

---

## Por que existe

- O **saldo das contas** é a âncora (editável; OFX pode atualizar via `LEDGERBAL`)
- No dashboard (período atual), o **Saldo do mês** espelha esse saldo — não é “receitas − despesas”
- Entrada mensal principal: **OFX do Santander** (CSV/OFX genérico de apoio)
- No cartão, **compra** e **vencimento** são datas diferentes; períodos usam o vencimento
- Open Finance fica de fora de propósito (custo de agregador)

---

## Funcionalidades

### Contas e saldo
- Contas de débito e cartão de crédito
- Saldo âncora; OFX pode gravar `LEDGERBAL` no commit da importação
- Cartão: dia de fechamento e vencimento para calcular a fatura

### Transações
- Receita, despesa, **transferência** e ajuste
- Despesa: meio débito/crédito; **marcar pago é só status** (não move saldo de novo)
- Crédito: data da compra + vencimento da fatura
- Transferência ↔ **caixinha** (aporte/resgate): não entra em Despesas/Receitas; move saldo da conta e o valor da caixinha

### Importações
- OFX Santander (Money 2000+) e CSV/OFX genérico
- Regras de renomeação e categorização
- Preview + stepper antes de gravar

### Orçamentos, investimentos e wishlist
- Limite por categoria com alerta perto do teto
- Caixinhas (criar/editar/excluir) com progresso
- Wishlist com imagem opcional

### A pagar, dashboard e relatórios
- Pendências do período
- KPIs, gráficos (ECharts) e relatórios no mesmo critério de período
- Despesas do dashboard incluem cartão; o **Saldo do mês** (período atual) segue a conta corrente

### Experiência
- Tema claro/escuro
- Sidebar no desktop; nav inferior + “Mais” no mobile (safe-area)

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind, shadcn/ui, React Router, Apache ECharts, Lucide |
| Backend | Node.js, Express 5 (BFF; na Vercel vira Serverless Function em `/api`) |
| Auth / DB | Supabase — PostgreSQL, Auth (e-mail/senha), RLS |
| Tooling | Yarn workspaces-style na raiz, Node **22+** |

Tabelas com prefixo `fluxo_*`. O front fala com o BFF; o BFF valida o JWT e acessa o Postgres.

---

## Pré-requisitos

- Node.js 22+
- Yarn
- Projeto no [Supabase](https://supabase.com)

---

## Setup

### 1. Banco

No SQL Editor do Supabase, aplique as migrations em `backend/migrations/` **na ordem** (`001` → `010`).

### 2. Variáveis de ambiente

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

| Variável | Onde | Uso |
|----------|------|-----|
| `VITE_SUPABASE_URL` | frontend | URL do projeto |
| `VITE_SUPABASE_ANON_KEY` | frontend | Chave anônima (cliente) |
| `VITE_BACKEND_URL` | frontend | Local: `http://localhost:3693`. Produção (Vercel): **vazio** (same-origin) |
| `DATABASE_URL` | backend | Connection string Postgres |
| `SUPABASE_URL` | backend | Auth / JWKS |
| `SUPABASE_ANON_KEY` | backend | Runtime |
| `SUPABASE_JWT_SECRET` | backend | Recomendado (Dashboard → Settings → API → JWT Secret) |
| `CORS_ORIGIN` | backend | Local: `http://localhost:3333` |
| `PORT` | backend | Local: `3693` (padrão no example) |

Nunca commite `.env` com valores reais — só `.env.example` com placeholders.

### 3. Subir localmente

```bash
yarn
yarn dev
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3333 |
| API (BFF) | http://localhost:3693 |

Crie a conta na tela de registro, cadastre as contas (saldo) e, se quiser, importe o OFX.

---

## Scripts úteis

```bash
cd backend && yarn test    # parsers OFX/CSV e ciclo de crédito
cd frontend && yarn lint
cd frontend && yarn build
cd backend && yarn build
```

---

## Estrutura (resumo)

```
frontend/          # Vite + React
backend/           # Express BFF + migrations
  migrations/      # SQL na ordem numérica
  src/modules/     # rotas por domínio
.github/           # templates de issue/PR
```

Pastas locais como `docs/` (notas de produto) e `backend/scripts/` (one-shots) **não** fazem parte do repositório público.

---

## Deploy (Vercel — app único)

Um projeto na Vercel serve o **SPA** e o **BFF** como Serverless Function (`/api/*`).

1. Importe o repositório (Root Directory = raiz do monorepo).
2. Configure:

| Variável | Obrigatória | Notas |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | sim | Build do front |
| `VITE_SUPABASE_ANON_KEY` | sim | Build do front |
| `VITE_BACKEND_URL` | não | **Vazio** em produção |
| `DATABASE_URL` | sim | Runtime |
| `SUPABASE_URL` | sim | Runtime |
| `SUPABASE_ANON_KEY` | sim | Runtime |
| `SUPABASE_JWT_SECRET` | recomendado | Validação JWT |
| `CORS_ORIGIN` | opcional | Local usa `http://localhost:3333` |

3. Publique. Em produção o front chama `/api/...` no mesmo domínio.

---

## Decisões de produto (para contribuidores)

| Tema | Decisão |
|------|--------|
| Moeda | BRL apenas |
| Open Finance | Fora de escopo |
| Saldo | Âncora = `fluxo_accounts.balance`; período atual no dashboard usa essa âncora |
| Pago | Toggle de despesa = status; não reaplica delta de caixa |
| Crédito | Entra em despesas/orçamentos pela data efetiva; não move conta corrente até o pagamento da fatura |
| Caixinhas | Aporte/resgate via transferência + `goal_id` / `goal_direction` |

Mudanças que alterem essas decisões: discuta na issue antes de implementar.

---

## Contribuindo

1. Descreva o problema e a solução no PR
2. Rode lint, testes e build
3. Sem secrets no diff

Detalhes: [CONTRIBUTING.md](./CONTRIBUTING.md) · [Código de Conduta](./CODE_OF_CONDUCT.md)  
Vulnerabilidades: [SECURITY.md](./SECURITY.md) (reporte em privado)

---

## Licença

MIT © 2026 [Rafael Vieira](https://github.com/RafaelHDSV) — [LICENSE](./LICENSE).

---

## Apoie o projeto

Se o Fluxo te ajudou a organizar as finanças ou serviu de base para outro trabalho, um café faz diferença.

<a href="https://www.buymeacoffee.com/vieira" target="_blank" rel="noopener noreferrer">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="48" width="174" />
</a>
