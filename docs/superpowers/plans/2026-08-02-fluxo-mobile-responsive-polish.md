# Mobile Responsive Polish (escopo A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Em celulares 320–390px, eliminar overflow/clipping do shell, filtros, date picker e eixos ECharts — sem redesenhar tabelas.

**Architecture:** Ajustes cirúrgicos nos arquivos já responsáveis por cada sintoma. Hook leve `useMediaQuery` só para o ECharts reagir a `max-width: 640px`. Sem CSS global de `overflow-x: hidden`.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind, ECharts (`echarts-for-react`), React Router.

**Spec:** `docs/superpowers/specs/2026-08-02-fluxo-mobile-responsive-polish-design.md`

## Global Constraints

- Escopo A apenas (sem tabelas→cards; sem portal/flip do date picker; sem limpeza de SCSS morto).
- Artefatos e UI copy em pt-BR acentuado quando houver texto novo.
- Não criar commit/push sem pedido explícito do usuário (política `git-github` do workspace). Passos de “Commit” abaixo são **opcionais** e só rodam se o usuário pedir.
- Alvo de verificação: larguras ~320px e ~390px no DevTools.

## File map

| File | Responsibility |
|------|----------------|
| `frontend/src/hooks/useMediaQuery.ts` | Hook `matchMedia` (criar) |
| `frontend/src/components/Layout.tsx` | Safe-area nav + sheet “Mais” scrollável |
| `frontend/src/components/ui/date-picker.tsx` | Largura fluida do popover |
| `frontend/src/components/charts/DashboardCharts.tsx` | `grid.left` / `fontSize` no estreito |
| `frontend/src/pages/DashboardPage.tsx` | Filtros `w-full sm:w-[…]` |
| `frontend/src/pages/PayablesPage.tsx` | Idem |
| `frontend/src/pages/ReportsPage.tsx` | Idem |

---

### Task 1: Hook `useMediaQuery`

**Files:**
- Create: `frontend/src/hooks/useMediaQuery.ts`
- Test: verificação manual no Task 4 (charts) + `yarn` typecheck no Task 6

**Interfaces:**
- Consumes: `window.matchMedia`
- Produces: `useMediaQuery(query: string): boolean`

- [ ] **Step 1: Criar o hook**

```ts
import { useEffect, useState } from 'react'

/** Subscribe to a CSS media query. SSR-safe (starts `false`). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
```

- [ ] **Step 2: Smoke — import resolve**

Run from `frontend/`:  
`yarn tsc --noEmit`  
(or o script de typecheck do package, se existir).  
Expected: sem erro novo apontando para `useMediaQuery`.

- [ ] **Step 3: Commit (somente se o usuário pedir)**

```bash
git add frontend/src/hooks/useMediaQuery.ts
git commit -m "feat: add useMediaQuery hook for responsive charts"
```

---

### Task 2: Shell — safe-area + sheet “Mais”

**Files:**
- Modify: `frontend/src/components/Layout.tsx` (nav ~L105, sheet ~L146–176)
- Also bump main bottom padding if needed so content clears taller safe-area nav

**Interfaces:**
- Consumes: Tailwind + `env(safe-area-inset-bottom)`
- Produces: nav e sheet utilizáveis em iPhone com home indicator

- [ ] **Step 1: Nav inferior com safe-area**

No `<nav className="fixed inset-x-0 bottom-0 …">`, adicionar padding inferior com safe-area. Exemplo de classes finais:

```tsx
<nav
  className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
>
```

Manter `py-2` nos itens internos; o `pb-[env(…)]` no nav empurra o conteúdo acima da home indicator.

- [ ] **Step 2: Ajustar `main` clearance**

Hoje: `pb-24` no `<main>`. Se a nav ficar mais alta com safe-area, preferir:

```tsx
<main className="min-h-screen min-w-0 flex-1 overflow-y-auto px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 lg:px-8 lg:pb-8 lg:pt-8">
```

(`6rem` ≈ altura visual da nav de 5 colunas; ajuste fino se sobrar/faltar gap.)

- [ ] **Step 3: Sheet “Mais” scrollável + safe-area**

Substituir o painel absoluto (hoje `… p-4 pb-8`) por algo nesta linha:

```tsx
<div className="absolute inset-x-0 bottom-0 flex max-h-[min(85dvh,100%)] flex-col rounded-t-2xl border border-border bg-surface pb-[env(safe-area-inset-bottom)]">
  <p className="shrink-0 px-4 pb-2 pt-4 font-display text-lg">Navegação</p>
  <div className="grid gap-2 overflow-y-auto px-4 pb-8">
    {/* links + tema + Sair — conteúdo atual */}
  </div>
</div>
```

- [ ] **Step 4: Verificar no DevTools**

Abrir o app autenticado (ou layout mock), largura 320px:
1. Nav não cola na borda inferior simulando safe-area (DevTools → device com notch, se disponível).
2. Abrir “Mais”: rolar até “Sair”; nada cortado.

- [ ] **Step 5: Commit (somente se o usuário pedir)**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "fix: mobile shell safe-area and scrollable More sheet"
```

---

### Task 3: Date picker fluido

**Files:**
- Modify: `frontend/src/components/ui/date-picker.tsx` (~L204)

**Interfaces:**
- Consumes: Tailwind arbitrary values
- Produces: popover que não estoura ~320px com padding da página

- [ ] **Step 1: Trocar largura fixa**

De:

```tsx
className="absolute left-0 top-full z-50 mt-1 w-[280px] rounded-xl …"
```

Para:

```tsx
className="absolute left-0 top-full z-50 mt-1 w-[min(100%,280px)] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-3 shadow-lg"
```

Não adicionar portal/flip.

- [ ] **Step 2: Verificar**

Em 320px, abrir um date picker numa página de formulário (ex. Transações / Contas). O calendário deve caber na viewport sem scroll horizontal da página.

- [ ] **Step 3: Commit (somente se o usuário pedir)**

```bash
git add frontend/src/components/ui/date-picker.tsx
git commit -m "fix: make date picker popover width fluid on small screens"
```

---

### Task 4: DashboardCharts responsivo

**Files:**
- Modify: `frontend/src/components/charts/DashboardCharts.tsx`
- Consumes: `useMediaQuery` de Task 1

**Interfaces:**
- Consumes: `useMediaQuery('(max-width: 639px)')` → `narrow`
- Produces: options ECharts com `grid.left` e `axisLabel.fontSize` menores quando `narrow`

- [ ] **Step 1: Import + hook no componente**

```tsx
import { useMediaQuery } from '@/hooks/useMediaQuery'

// dentro de DashboardCharts:
const narrow = useMediaQuery('(max-width: 639px)')
const yAxisFontSize = narrow ? 10 : 12
const gridLeft = narrow ? 36 : 48
```

- [ ] **Step 2: Aplicar em `bars` e `line`**

Em ambos os option objects:

```ts
grid: { left: gridLeft, right: 16, top: /* manter 56 bars / 24 line */, bottom: 30 },
yAxis: {
  type: 'value',
  axisLabel: {
    fontSize: yAxisFontSize,
    formatter: (v: number) => formatBRL(v).replace(/\s/g, '\u00a0'),
  },
},
```

Manter alturas `280` / equivalentes. Donut sem mudança estrutural.

Como `bars`/`line` são objetos literais no render, basta usar `gridLeft`/`yAxisFontSize` no escopo — o `key` do `ReactECharts` pode incluir `narrow` se o chart não reagir sozinho:

```tsx
<ReactECharts key={`bars-${narrow}`} option={bars} style={{ height: 280 }} />
```

(Idem para line/donut se necessário.)

- [ ] **Step 3: Verificar**

Dashboard em 320px: eixos Y legíveis, sem clip óbvio do `formatBRL`; plot não some sob a legenda.

- [ ] **Step 4: Commit (somente se o usuário pedir)**

```bash
git add frontend/src/components/charts/DashboardCharts.tsx frontend/src/hooks/useMediaQuery.ts
git commit -m "fix: tighten ECharts axis padding on narrow viewports"
```

---

### Task 5: Filtros full-width (Dashboard, Payables, Reports)

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx` (~L111, L125, L145)
- Modify: `frontend/src/pages/PayablesPage.tsx` (~L226, L241, L259)
- Modify: `frontend/src/pages/ReportsPage.tsx` (~L181, L282, L296, L316)

**Interfaces:**
- Consumes: padrão Tailwind `w-full sm:w-[Npx]`
- Produces: toolbars de período sem forçar scroll-X da página

- [ ] **Step 1: DashboardPage**

```tsx
<SelectTrigger className="w-full sm:w-[140px]">
…
<SelectTrigger className="w-full sm:w-[100px]">
…
<Input … className="w-full sm:w-[72px]" … />
```

Garantir que o wrapper dos filtros continue com `flex flex-wrap` (já existe em ~L108).

- [ ] **Step 2: PayablesPage**

Mesmo padrão nas classes `w-[180px]`, `w-[100px]`, `w-[72px]` → `w-full sm:w-[…]`.

- [ ] **Step 3: ReportsPage**

Mesmo padrão em `w-[120px]`, `w-[160px]`, `w-[100px]`, `w-[72px]`.

- [ ] **Step 4: Verificar**

Em 320px: Dashboard, A pagar e Relatórios — filtros empilham/expandem; **sem** scroll horizontal da página (tabelas ainda podem scrollar no próprio wrapper).

- [ ] **Step 5: Commit (somente se o usuário pedir)**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/pages/PayablesPage.tsx frontend/src/pages/ReportsPage.tsx
git commit -m "fix: full-width period filters on small screens"
```

---

### Task 6: Verificação final

**Files:** nenhum novo — checklist da spec §7

- [ ] **Step 1: Typecheck / build**

```bash
cd frontend
yarn build
```

Expected: exit 0.

- [ ] **Step 2: Checklist visual (320 e 390)**

| # | Critério | Pass? |
|---|----------|-------|
| 1 | Nav + safe-area; main utilizável | |
| 2 | Sheet “Mais” rola até Sair | |
| 3 | Filtros Dashboard / A pagar / Relatórios sem scroll-X da página | |
| 4 | Date picker não estoura à direita | |
| 5 | Charts: eixos sem clip óbvio | |
| 6 | Tabelas ainda com scroll-X próprio (OK) | |

- [ ] **Step 3: Atualizar status da spec**

Em `docs/superpowers/specs/2026-08-02-fluxo-mobile-responsive-polish-design.md`, mudar Status para `implementado` quando o checklist passar.

- [ ] **Step 4: Commit docs (somente se o usuário pedir)**

```bash
git add docs/superpowers/specs/2026-08-02-fluxo-mobile-responsive-polish-design.md docs/superpowers/plans/2026-08-02-fluxo-mobile-responsive-polish.md
git commit -m "docs: mobile responsive polish spec and plan"
```

---

## Spec coverage (self-review)

| Spec § | Task |
|--------|------|
| §3 Shell safe-area + Mais scroll | Task 2 |
| §4 Filtros Dashboard/Payables/Reports | Task 5 |
| §5 Date picker fluido | Task 3 |
| §6 ECharts grid/fontSize | Tasks 1 + 4 |
| §7 Aceite | Task 6 |
| Fora de escopo (tabelas, portal, SCSS) | Não há tasks — intencional |

**Placeholders:** nenhum TBD.  
**Types:** `useMediaQuery(query: string): boolean` — único contrato cruzado Tasks 1↔4.
