# Fluxo MVP — Design Spec

**Data:** 2026-08-02  
**Epic:** https://github.com/RafaelHDSV/Fluxo/issues/1  
**Status:** aprovado (brainstorming + plano Cursor)

## Decisões

| Tema | Decisão |
|------|---------|
| Escopo | MVP completo, Fases 1–7 |
| Auth | Supabase Auth (e-mail/senha) + RLS |
| Dados/API | Supabase Postgres/Storage + Express BFF |
| Entrega | Por fases do épico |
| Estilo | SASS (sem Tailwind) |
| Gráficos | Apache ECharts |
| Moeda | BRL |
| Fora | Open Finance, Notion API nativa, mobile, multi-moeda |

## Arquitetura

```text
Browser (React + Vite + SASS)
  → Supabase Auth (JWT)
  → Express BFF (valida JWT, regras)
  → Supabase Postgres (RLS por user_id)
  → Supabase Storage (arquivos de importação)
```

Fluxo: importação/manual → normalização → transações → categorização → agregações → dashboard/relatórios.

## Domínio

- Transações: receita, despesa, transferência, ajuste.
- Contas: corrente, carteira, investimento, cartão, externa.
- Categorias seed + regras (contém texto, recorrência, origem).
- Dedupe: hash `user_id + date + amount + normalized_description + account_id` (+ fitid OFX).
- Orçamentos mensais (alertas 80%/100%); metas com progresso.
- Relatórios por período/conta/categoria/tag.

## UI

- Tagline: “Veja seu dinheiro com clareza.”
- Shell autenticado: Dashboard, Transações, Importações, Contas, Orçamentos, Metas, Relatórios.
- Dashboard home com indicadores e ECharts (linha, barras, donut no MVP).

## Fases

1. Identidade, shell, auth  
2. Schema + RLS + seeds  
3. CRUD contas/categorias/transações  
4. Importação CSV/OFX  
5. Dashboard ECharts  
6. Orçamentos e metas  
7. Relatórios e polimento  
