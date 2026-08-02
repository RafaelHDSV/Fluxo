# fluxo — especificacao do projeto

> Guia de produto e entrega deste repositorio. Complementa **`docs/context.md`**.

**Ano:** 2026

---

## Objetivo

Controle financeiro pessoal com dashboard como tela principal: registrar/importar transações, categorizar, orçar, acompanhar metas e analisar evolução em BRL.

---

## Stack

- **Front:** React, Vite, TypeScript, SASS, React Router, ECharts
- **Back:** Node, Express (BFF)
- **Banco:** PostgreSQL / Supabase + Auth + RLS
- **Tooling:** Yarn, Node 22+

---

## Setup e comandos locais

```bash
yarn          # instalar deps da raiz
yarn dev      # frontend + backend
```

Configure `frontend/.env` e `backend/.env` a partir dos `.env.example` (projeto Supabase). Aplique `backend/migrations/001_fluxo_schema.sql` no SQL Editor do Supabase.

---

## Decisoes registradas

| # | Tema | Decisao |
|---|------|---------|
| 1 | Nome | Fluxo |
| 2 | Auth MVP | Supabase Auth obrigatório |
| 3 | API | Express BFF |
| 4 | Gráficos | Apache ECharts |
| 5 | Importação | CSV + OFX |
| 6 | Moeda | BRL |

---

## Epic / issue GitHub

| Item | Link |
|------|------|
| Epic ou issue principal | https://github.com/RafaelHDSV/Fluxo/issues/1 |
| Proposta | `.issues/2026-08-02-fluxo-mvp.md` |

---

## Fora de escopo

- Conciliação bancária em tempo real / Open Finance
- Produto multiempresa

---

## Relacao com outros docs

| Arquivo | Uso |
|---------|-----|
| `docs/context.md` | Stack, portas, decisoes fixas |
| `docs/DESIGN.md` | Identidade visual |
| `docs/superpowers/specs/2026-08-02-notion-fluxo-gap-analysis.md` | Diagnóstico Notion → Fluxo (gaps, mapa de campos, backlog P0–P3) |
| `docs/superpowers/specs/2026-08-02-notion-import-design.md` | Design da importação Notion (paid, payment_method, carga one-shot) |
| Este arquivo | Objetivo, escopo, link da epic |

---

*MVP Fluxo — alinhado ao issue #1.*
