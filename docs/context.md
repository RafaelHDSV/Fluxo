# Fluxo — contexto do projeto

> Contexto primário para assistentes de IA (regra `ai-context.mdc`). Atualize este arquivo ao evoluir o produto.

**Pacote:** `fluxo` | **Ano:** 2026 | **Estado:** v1.2+ (UX, OFX Santander, crédito com vencimento, polish mobile)

---

## Objetivo

Fluxo é um controle financeiro pessoal web: entradas, saídas, contas, categorias, **importação mensal OFX (Santander)**, orçamentos por categoria, investimentos (caixinhas), wishlist, contas a pagar e dashboard/relatórios com Apache ECharts.

Tagline: *Veja seu dinheiro com clareza.*

---

## Stack

| Camada | Tecnologia / nota |
|--------|-------------------|
| Front | React 18, Vite, TypeScript, Tailwind + shadcn/ui, React Router, ECharts, Lucide |
| Back | Node, Express 5 (BFF; na Vercel vira Serverless Function em `/api`) |
| Banco / Auth | PostgreSQL via Supabase (`fluxo_*`) + Auth + RLS |
| Tooling | Yarn workspaces-style (`yarn` na raiz), Node 22+ |

---

## Portas e URLs (desenvolvimento)

| Serviço | Porta / URL |
|---------|-------------|
| Front | http://localhost:3333 |
| API | http://localhost:3693 |

```bash
yarn          # deps da raiz + sobe front e back via concurrently
yarn dev
```

Envs: `frontend/.env` e `backend/.env` a partir dos `.env.example`. Migrations em `backend/migrations/` (aplicar em ordem no SQL Editor do Supabase).

---

## Decisões fixas

1. Auth obrigatória (Supabase e-mail/senha)
2. Express BFF + Supabase Postgres
3. Moeda BRL; **Open Finance fora** (custo de agregador)
4. Gráficos: Apache ECharts
5. Tailwind + shadcn com tema dark/light
6. **Entrada de dados mensal:** OFX da conta Santander (Money 2000+); CSV/OFX genérico também
7. Orçamentos = categorias + metas de gasto; **regras de rename/categoria ficam em Importações**
8. Investimentos = ex-Metas (`fluxo_goals`) — caixinhas com progresso (CRUD em Investimentos); aporte/resgate via **transferência** com `goal_id` + `goal_direction` — **não** entra em Despesas/Receitas; move o saldo da conta (âncora)
9. Notion foi carga inicial histórica; **não é fonte operacional**
10. **Saldo das contas** é a âncora (editável; OFX via `LEDGERBAL`). Criar receita/ajuste ou despesa **já paga** no débito ajusta o saldo; transferência ↔ caixinha também move a conta; **marcar/desmarcar pago é só status** (A pagar) e **não** baixa de novo — evita duplicar após importar o extrato. Saldo inicial do mês = saldo atual − movimento de caixa do mês (`date`, despesa débito paga + transferências de caixinha; sem crédito) — **não** a soma histórica do Notion
11. Importação: preview aplica regras de rename → categoria; **stepper** revisa descrição/categoria das linhas novas antes do commit
12. **Crédito:** `date` = data da compra; `due_date` = vencimento da fatura (ciclo `closing_day` + `due_day` do cartão). Resultado, orçamentos e filtros de período usam a data efetiva (`coalesce` do vencimento no crédito). Histórico antigo sem `due_date` continua em `date`
13. **Shell:** sidebar em `lg+`; mobile com nav inferior + sheet “Mais”; `viewport-fit=cover` e safe-area
14. **Saldo do mês (dashboard, período atual)** = **saldo das contas** (Santander) — mesma âncora de Contas/OFX; não é receitas−despesas

---

## Navegação (produto)

Dashboard · Transações · A pagar · Importações · Contas · Orçamentos · Investimentos · Wishlist · Relatórios

---

## Domínios principais

| Domínio | Notas |
|---------|--------|
| Contas | Débito, crédito (fechamento/vencimento), saldo âncora |
| Transações | Lançamento manual; filtros de período; crédito com compra + vencimento |
| Importações | OFX Santander + CSV/OFX; regras; stepper de revisão |
| Orçamentos | Limite por categoria; alerta ~80% |
| Investimentos | Caixinhas (`fluxo_goals`); progresso |
| Wishlist | Itens desejados; imagem opcional |
| A pagar | Débitos/faturas em aberto |
| Dashboard / Relatórios | KPIs, ECharts, filtro mês/ano/todo |

---

## Migrations (ordem)

| Arquivo | Papel |
|---------|--------|
| `001_fluxo_schema.sql` | Schema base |
| `002_paid_payment_method.sql` | Pago / meio de pagamento |
| `003_wishlist.sql` | Wishlist |
| `004_wishlist_image.sql` | Imagem na wishlist |
| `005_description_rules.sql` | Regras de descrição na importação |
| `006_due_date.sql` | Vencimento no crédito |
| `007_goals_optional_target.sql` | Meta opcional em investimentos |
| `008_import_ledger_balance.sql` | LEDGERBAL do OFX persistido no preview → commit |
| `009_transaction_goal_id.sql` | `goal_id` em transações → caixinha |
| `010_goal_direction.sql` | `goal_direction` (`to_goal` / `from_goal`) na transferência ↔ caixinha |

---

## Links

| Tipo | URL / caminho |
|------|----------------|
| Repositório | https://github.com/RafaelHDSV/Fluxo |
| Epic | https://github.com/RafaelHDSV/Fluxo/issues/1 |
| Specs | `docs/superpowers/specs/` |
| Planos | `docs/superpowers/plans/` |
| Proposta v1.2 | `.issues/2026-08-02-fluxo-v1.2-ux-import.md` |
| Design visual | `docs/DESIGN.md` |
| Especificação | `docs/especificacao.md` |
| Deploy | `vercel.json` + `api/index.ts` — front SPA + BFF serverless no mesmo app |

---

## Fora de escopo

- Open Finance / Pluggy / Belvo
- Parser de PDF consolidado / fatura de cartão automática (follow-up)
- Notion API / sync contínuo
- App nativo e multi-moeda
- Tabelas densas → cards no mobile (escopo B do polish responsivo)

---

*Atualizado em 2026-08-02 — v1.2+, crédito com vencimento, shell mobile (escopo A).*
