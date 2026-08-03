# Fluxo

> Veja seu dinheiro com clareza.

Controle financeiro pessoal para quem quer **entender o mês** sem virar planilha. O Fluxo concentra contas, lançamentos, importação de extrato, orçamentos, investimentos e o que ainda falta pagar — com dashboard e gráficos pensados para o dia a dia.

Feito para uso individual em BRL, com autenticação e dados isolados por usuário.

---

## Por que existe

A maior parte das ferramentas financeiras ou é genérica demais, ou esconde o que importa atrás de agregadores caros. O Fluxo parte de decisões simples:

- o **saldo das contas** é a âncora (não um histórico opaco)
- a entrada mensal principal é o **OFX do Santander** (com CSV/OFX genérico de apoio)
- no cartão, **compra** e **vencimento da fatura** são datas diferentes — o período usa o vencimento
- Open Finance fica de fora de propósito (custo de agregador)

---

## Funcionalidades

### Contas e saldo
- Contas de débito e cartão de crédito
- Saldo editável; importação OFX pode atualizar via `LEDGERBAL`
- No crédito: dia de fechamento e dia de vencimento para calcular a fatura

### Transações
- Lançamentos manuais (receita e despesa)
- Filtros por período (mês, ano ou histórico)
- Crédito com data da compra + vencimento da fatura

### Importações
- OFX Santander (Money 2000+) e CSV/OFX genérico
- Regras de renomeação e categorização
- Preview + stepper para revisar linhas novas antes de gravar

### Orçamentos e categorias
- Limite de gasto por categoria
- Progresso e alerta quando o uso se aproxima do limite

### Investimentos e wishlist
- Caixinhas de investimento com progresso
- Lista de desejos com imagem opcional

### A pagar, dashboard e relatórios
- Visão do que está em aberto
- KPIs do período, receita × despesa, gastos por categoria e resultado acumulado
- Relatórios agregados no mesmo critério de período

### Experiência
- Tema claro e escuro
- Sidebar no desktop; navegação inferior + menu “Mais” no celular
- Layout pensado para telas pequenas (safe-area, filtros e calendário fluídos)

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind, shadcn/ui, React Router, Apache ECharts, Lucide |
| Backend | Node.js, Express 5 (BFF) |
| Auth e banco | Supabase — PostgreSQL, Auth (e-mail/senha) e RLS |
| Tooling | Yarn, Node 22+ |

O front fala com o BFF; o BFF valida o JWT do Supabase e acessa o Postgres. As tabelas usam o prefixo `fluxo_*`.

---

## Pré-requisitos

- Node.js 22 ou superior
- Yarn
- Projeto no [Supabase](https://supabase.com)

---

## Setup

### 1. Banco

No SQL Editor do Supabase, aplique as migrations em `backend/migrations/` **na ordem** (001 → 007).

### 2. Variáveis de ambiente

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Preencha com os dados do seu projeto Supabase:

| Variável | Onde | Uso |
|----------|------|-----|
| `VITE_SUPABASE_URL` | frontend | URL do projeto |
| `VITE_SUPABASE_ANON_KEY` | frontend | Chave anônima (cliente) |
| `VITE_BACKEND_URL` | frontend | Local: `http://localhost:3693`. Produção (Vercel): **vazio** (same-origin) |
| `SUPABASE_URL` / JWT / `DATABASE_URL` | backend | Conforme o `.env.example` do back |

Nunca commite arquivos `.env` com valores reais.

### 3. Subir localmente

```bash
yarn
yarn dev
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3333 |
| API (BFF) | http://localhost:3693 |

Crie uma conta pela tela de registro e comece pelas contas (saldo) e, se quiser, pela importação OFX.

---

## Scripts úteis

```bash
cd backend && yarn test      # parsers OFX/CSV e ciclo de crédito
cd frontend && yarn lint
cd frontend && yarn build
cd backend && yarn build
```

---

## Deploy (Vercel — app único)

Um único projeto na Vercel serve o **frontend (SPA)** e o **BFF Express** como Serverless Function (`/api/*`).

1. Importe o repositório (Root Directory = raiz).
2. Configure as variáveis de ambiente:

| Variável | Obrigatória | Notas |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | sim | Build do front |
| `VITE_SUPABASE_ANON_KEY` | sim | Build do front |
| `VITE_BACKEND_URL` | não | **Deixe vazio** em produção (same-origin) |
| `DATABASE_URL` | sim | Runtime da function |
| `SUPABASE_URL` | sim | Runtime (Auth/JWKS) |
| `SUPABASE_ANON_KEY` | sim | Runtime |
| `SUPABASE_JWT_SECRET` | recomendado | Validação JWT |
| `CORS_ORIGIN` | opcional | Em prod same-origin quase não importa; local usa `http://localhost:3333` |

3. Publique.

Local continua com `yarn dev` (front :3333 + API :3693). Em produção o front chama `/api/...` no mesmo domínio.

---

## Contribuindo

Pull requests são bem-vindos. Antes de abrir um PR:

1. Descreva o problema e a solução no corpo do PR
2. Rode lint, testes e build
3. Evite secrets no diff

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) e o [Código de Conduta](./CODE_OF_CONDUCT.md).  
Vulnerabilidades: reporte em privado — [SECURITY.md](./SECURITY.md).

---

## Licença

MIT © 2026 [Rafael Vieira](https://github.com/RafaelHDSV) — [LICENSE](./LICENSE).

---

## Apoie o projeto

Se o Fluxo te ajudou a organizar as finanças ou serviu de base para outro trabalho, um café faz diferença.

<a href="https://www.buymeacoffee.com/vieira" target="_blank" rel="noopener noreferrer">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="48" width="174" />
</a>
