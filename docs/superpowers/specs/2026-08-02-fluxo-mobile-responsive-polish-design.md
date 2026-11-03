# Fluxo — polish responsivo mobile (escopo A)

**Data:** 2026-08-02  
**Status:** implementado (código + build) — aceite visual 320/390px pendente (login)  
**Abordagem:** 1 — cirúrgico por sintoma  
**Alvo:** viewports 320–390px (celulares pequenos)

---

## 1. Objetivo

Corrigir overflow/clipping e densidade no mobile **sem** redesenhar tabelas em cards/listas. O shell já usa sidebar `lg:` + nav inferior; o trabalho é fechar buracos pontuais.

## 2. Escopo

| Inclui | Não inclui |
|--------|------------|
| Safe-area na nav inferior e no sheet “Mais” | Tabelas → lista/cards |
| Sheet “Mais” com `max-h` + scroll | Helpers CSS compartilhados novos |
| Filtros de período: `w-full sm:w-[…]` | `overflow-x: hidden` no `body` |
| Date picker sem largura fixa 280px | Portal/flip do calendário |
| ECharts: `grid.left` e `fontSize` menores no estreito | Mudança de altura dos charts |
| | Limpeza de SCSS morto |

## 3. Shell (`Layout.tsx`)

- Nav inferior (`fixed` `lg:hidden`): somar `env(safe-area-inset-bottom)` ao padding inferior existente.
- Sheet “Mais”:
  - `max-height` compatível com viewport (ex.: `max-h-[min(85vh,calc(100dvh-…))]` ou equivalente Tailwind).
  - Conteúdo com `overflow-y-auto`.
  - Padding inferior com safe-area (além do `pb-8` atual).
- Labels do nav: manter truncamento pela primeira palavra (`label.split(' ')[0]`); sem redesenho de ícones.

## 4. Filtros e toolbars

Trocar triggers com largura fixa por full-width abaixo de `sm`:

| Arquivo | Classes atuais (exemplos) |
|---------|---------------------------|
| `DashboardPage.tsx` | `w-[140px]`, `w-[100px]`, `w-[72px]` |
| `PayablesPage.tsx` | `w-[180px]`, `w-[100px]`, `w-[72px]` |
| `ReportsPage.tsx` | `w-[160px]`, `w-[120px]`, `w-[100px]`, `w-[72px]` |

Padrão: `w-full sm:w-[Npx]` (ou `min-w-0 flex-1` no grupo, se o wrap já for suficiente). Manter `flex-wrap` onde já existe.

**Fora deste item:** `AccountsPage`/`TransactionsPage` `w-[88px]` em coluna de ações de tabela; `BudgetsPage` input `w-[120px]` na célula — ficam para eventual escopo B.

## 5. Date picker (`date-picker.tsx`)

- Substituir `w-[280px]` por largura fluida que não ultrapasse o pai (ex.: `w-[min(100%,280px)]` via arbitrary Tailwind, ou `max-w-[280px] w-[calc(100vw-2rem)]` alinhado ao padding da página).
- Sem portal, sem flip automático nesta rodada.
- Calendário `grid-cols-7` permanece.

## 6. Gráficos (`DashboardCharts.tsx`)

Hoje: `grid: { left: 48, … }` e `axisLabel` com `formatBRL` completo — risco de clip em ~320px.

- Detectar viewport estreita (matchMedia `max-width: 640px` ou prop/`useMediaQuery` já existente no projeto, se houver).
- No modo estreito: reduzir `grid.left` (ex. ~28–36) e `axisLabel.fontSize` (ex. 10–11); opcionalmente formatar eixo Y de forma mais curta (sem “R$” ou com abreviação), se necessário para caber — preferir padding/`fontSize` antes de mudar formato.
- Alturas `280` / equivalentes: manter.
- Donut: sem mudança estrutural; só garantir que o container não cause overflow horizontal.

## 7. Critérios de aceite

Em ~320px e ~390px de largura (DevTools ou device):

1. Nav inferior não invade a home indicator; conteúdo principal continua com `pb-24` (ou equivalente) utilizável.
2. Sheet “Mais” rola até o fim (tema + Sair) sem cortar.
3. Filtros de período do Dashboard / A pagar / Relatórios não forçam scroll horizontal da página.
4. Abrir o date picker num formulário/card estreito não estoura a viewport à direita.
5. Barras e linha do dashboard: eixos e área do plot legíveis, sem clip óbvio do `formatBRL` no Y.
6. Tabelas densas: **aceitam** scroll horizontal (comportamento atual).

## 8. Arquivos tocados (previsto)

1. `frontend/src/components/Layout.tsx`
2. `frontend/src/components/ui/date-picker.tsx`
3. `frontend/src/components/charts/DashboardCharts.tsx`
4. `frontend/src/pages/DashboardPage.tsx`
5. `frontend/src/pages/PayablesPage.tsx`
6. `frontend/src/pages/ReportsPage.tsx`

Opcional: helper `useMediaQuery` só se ainda não existir e for o caminho mais limpo para o ECharts.

## 9. Verificação

- Checagem visual em 320 e 390 (browser DevTools).
- Build/typecheck do frontend após as mudanças.
- Sem commit/push nesta entrega salvo pedido explícito.

---

*Aprovado verbalmente no chat (escopo A, abordagem 1, seções shell + filtros/datepicker/gráficos).*
