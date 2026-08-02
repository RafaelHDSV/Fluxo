# Fluxo

Controle financeiro pessoal — dashboard, transações, importação CSV/OFX, orçamentos, metas e relatórios.

> Veja seu dinheiro com clareza.

Epic: https://github.com/RafaelHDSV/Fluxo/issues/1

## Stack

- Frontend: React + Vite + TypeScript + SASS + ECharts
- Backend: Express BFF
- Auth/DB: Supabase (Postgres + Auth + RLS)

## Setup

1. Crie um projeto no Supabase e rode `backend/migrations/001_fluxo_schema.sql` no SQL Editor.
2. Copie envs:

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

- Front: http://localhost:5173  
- API: http://localhost:3693  

## Scripts úteis

```bash
cd backend && yarn test    # parsers / dedupe
cd frontend && yarn build
cd backend && yarn build
```

## Docs

- `docs/context.md` — contexto para IA
- `docs/especificacao.md` — produto
- `docs/DESIGN.md` — identidade visual
- `.issues/2026-08-02-fluxo-mvp.md` — proposta MVP

## Licença

MIT (c) 2026 Rafael Vieira. Veja [LICENSE](./LICENSE).
