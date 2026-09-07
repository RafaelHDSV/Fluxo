# Fluxo — especificação do projeto

> Guia de produto e entrega deste repositório. Complementa **`docs/context.md`** (contexto operacional para IA e stack).

**Ano:** 2026 | **Estado:** além do MVP — v1.2 (UX, OFX Santander, domínio) + polish mobile escopo A

---

## Objetivo

Controle financeiro pessoal com o **Dashboard** como tela principal: registrar e importar transações, categorizar, orçar, acompanhar investimentos e wishlist, pagar o que vence e analisar o período em BRL — com clareza, sem parecer planilha genérica.

---

## Personas e job-to-be-done

| Quem | Precisa |
|------|---------|
| Pessoa física (uso individual) | Ver a saúde do mês, importar o extrato OFX do Santander, ajustar categorias e orçamentos, acompanhar caixinhas e contas a pagar |

**Sucesso:** em poucos minutos no fim do mês (ou no dia a dia), o usuário sabe *para onde foi o dinheiro* e o que ainda falta pagar.

---

## Capabilidades (escopo atual)

| Área | Entrega |
|------|---------|
| Auth | Cadastro/login Supabase (e-mail/senha); dados sob RLS |
| Contas | Débito e cartão; saldo âncora (editável / OFX `LEDGERBAL`); marcar pago **não** altera saldo |
| Transações | CRUD; filtros de período; crédito com data da compra + `due_date`; `paid` = status A pagar |
| Importações | OFX Santander (Money 2000+) e CSV/OFX genérico; regras; preview + stepper |
| Orçamentos | Limite por categoria; progresso e alerta |
| Investimentos | Caixinhas com progresso (ex-Metas) |
| Wishlist | Lista de desejos; imagem opcional |
| A pagar | Visão de pendências |
| Dashboard | KPIs do período (mês/ano/todo); receita×despesa; categorias; resultado acumulado |
| Relatórios | Visões agregadas no período |
| Shell | Sidebar desktop; nav inferior + “Mais” no mobile; tema dark/light |

---

## Stack

- **Front:** React 18, Vite, TypeScript, Tailwind + shadcn/ui, React Router, ECharts, Lucide
- **Back:** Node, Express 5 (BFF)
- **Banco / Auth:** PostgreSQL / Supabase + Auth + RLS (`fluxo_*`)
- **Tooling:** Yarn, Node 22+

---

## Setup e comandos locais

```bash
yarn          # instalar deps da raiz
yarn dev      # frontend (3333) + backend (3693)
```

1. Crie o projeto no Supabase.
2. Aplique as migrations em `backend/migrations/` **em ordem** (001 → 007) no SQL Editor.
3. Configure `frontend/.env` e `backend/.env` a partir dos `.env.example`.

```bash
cd backend && yarn test    # parsers / dedupe
cd frontend && yarn build
cd backend && yarn build
```

---

## Decisões registradas

| # | Tema | Decisão |
|---|------|---------|
| 1 | Nome | Fluxo |
| 2 | Auth | Supabase Auth obrigatório |
| 3 | API | Express BFF |
| 4 | Gráficos | Apache ECharts |
| 5 | Importação principal | OFX Santander (+ CSV/OFX genérico) |
| 6 | Moeda | BRL |
| 7 | Open Finance | Fora (custo) |
| 8 | Notion | Carga histórica only; sem sync contínuo |
| 9 | Crédito | Compra (`date`) + vencimento (`due_date`); período usa data efetiva |
| 10 | Investimentos | Renomeação de Metas → caixinhas |
| 11 | UI | Tailwind + shadcn; identidade em `docs/DESIGN.md` |

---

## Epic / issues

| Item | Link |
|------|------|
| Epic | https://github.com/RafaelHDSV/Fluxo/issues/1 |
| Proposta MVP | `.issues/2026-08-02-fluxo-mvp.md` |
| Proposta v1.2 | `.issues/2026-08-02-fluxo-v1.2-ux-import.md` |

---

## Critérios de qualidade (produto)

- Valores monetários em BRL com tipografia mono (IBM Plex Mono)
- Filtros de período coerentes entre Dashboard, A pagar e Relatórios
- Importação não grava sem revisão do stepper quando há linhas novas
- Mobile: shell usável em ~320–390px (safe-area, filtros full-width, date picker fluido, eixos ECharts apertados) — tabelas densas ainda com scroll horizontal (escopo B futuro)

---

## Fora de escopo

- Conciliação bancária em tempo real / Open Finance
- App nativo e multi-moeda
- Produto multiempresa / multi-usuário compartilhado
- Parser de PDF de fatura de cartão
- Sync contínuo com Notion

---

## Relação com outros docs

| Arquivo | Uso |
|---------|-----|
| `docs/context.md` | Stack, portas, decisões fixas, migrations (IA) |
| `docs/DESIGN.md` | Identidade visual e layout |
| `docs/superpowers/specs/` | Specs de feature (Notion, v1.2, crédito, mobile…) |
| `docs/superpowers/plans/` | Planos de implementação |
| `README.md` | Entrada rápida para humanos |
| Este arquivo | Objetivo, escopo de produto, critérios |

---

*Atualizado em 2026-08-02 — alinhado ao issue #1 e entrega v1.2+.*
