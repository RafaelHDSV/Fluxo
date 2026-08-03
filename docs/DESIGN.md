# DESIGN — Fluxo

> Fonte de verdade visual. O código deriva daqui. Última atualização: 2026-08-02.

## Direction

**Thesis:** Clareza financeira premium — números e gráficos que respondem “para onde vai o dinheiro?”, sem parecer planilha genérica.

| Field | Value |
|-------|-------|
| Audience | Pessoa física organizando finanças pessoais |
| UI job | Ver saúde do mês e agir (lançar, importar, orçar, pagar) |
| Tone | Direto, limpo, confiante |

## Anti-defaults

- Fontes rejeitadas: Inter, Roboto, Arial, system-ui genérico
- Paletas rejeitadas: SaaS purple `#6366f1`, cream `#F4F1EA` + terracotta
- Layouts rejeitados: hero marketing com três cards iguais; glow neon
- Rationale: produto de dados financeiros precisa de hierarquia tipográfica e contraste, não estética “AI SaaS”

## Color

| Token | Hex | Role |
|-------|-----|------|
| `--background` | `#0F1419` | superfície principal (dark editorial) |
| `--foreground` | `#F2F5F7` | texto primário |
| `--surface` | `#1A222C` | painéis / shell |
| `--surface-elevated` | `#243040` | cards de KPI |
| `--primary` | `#3DDC97` | ação / positivo / receita |
| `--primary-foreground` | `#0A1210` | texto em primary |
| `--secondary` | `#2A3544` | superfícies secundárias |
| `--muted` | `#1E2833` | fundos sutis |
| `--muted-foreground` | `#8B9AAB` | texto secundário |
| `--accent` | `#5B8DEF` | destaque pontual (gráficos) |
| `--destructive` | `#F07178` | erro / despesa |
| `--warning` | `#E6B450` | alerta 80% orçamento |
| `--border` | `#2E3A48` | divisores |
| `--ring` | `#3DDC97` | focus |

**Dark mode:** paleta nativa escura (não invertida de light). Tema claro existe como variante; tokens primários do produto nasceram no dark.

## Typography

| Role | Family | Weights | Use |
|------|--------|---------|-----|
| Display | Fraunces | 600 | marca, títulos de seção |
| Body | Source Sans 3 | 400, 600 | UI, formulários |
| Mono / Data | IBM Plex Mono | 500 | valores monetários |

**Import:** Google Fonts — Fraunces, Source Sans 3, IBM Plex Mono.

## Spacing & radius

| Token | Value | Notes |
|-------|-------|-------|
| Base unit | 8px | |
| `--radius` | 12px | painéis |
| `--radius-sm` | 8px | inputs/botões |
| Density | comfortable | |

## Layout

**Concept:** shell com sidebar (desktop `lg+`) e conteúdo em bandas de KPI + gráficos; mobile com nav inferior (5 atalhos) + sheet “Mais”.

**Navegação:** Dashboard, Transações, A pagar, Importações, Contas, Orçamentos, Investimentos, Wishlist, Relatórios.

**Mobile (escopo A):**

- `viewport-fit=cover` + `env(safe-area-inset-bottom)` na nav e no sheet
- Sheet “Mais” com `max-h` e scroll (`min-h-0 flex-1`)
- Filtros de período: `w-full` abaixo de `sm`
- Date picker: largura fluida (`min(100%, 280px)`)
- ECharts: `grid.left` e `fontSize` do eixo Y menores em viewport estreita (`max-width: 639px`)
- Tabelas densas: scroll horizontal (cards/listas = escopo B)

## Signature

**One memorable element:** marca “Fluxo” em Fraunces + monograma **F preenchido com seta** (primary `#3DDC97` em fundo `#0F1419`) e KPIs em IBM Plex Mono.

**Why it serves the domain:** tipografia de dados + marca memorável sustentam uso recorrente do dashboard.

## Motion

| Moment | Behavior | Duration | Reduced motion |
|--------|----------|----------|----------------|
| Page enter | fade + 8px rise | 220ms | instant |
| KPI hover | elevação sutil | 150ms | none |
| Chart load | opacity | 300ms | skip |

## Components (notas)

| Peça | Direção |
|------|---------|
| Button / Input / Select | shadcn customizado com tokens acima |
| Date picker | Popover local (sem portal/flip); pt-BR |
| ConfirmDialog | Confirmações destrutivas e logout |
| SummaryCard | KPI com mono para valores |
| Charts | ECharts; cores semantic (`primary` / `destructive` / categorias) |

## Code map

| Artifact | Path |
|----------|------|
| CSS variables / tema | `frontend/src/index.css`, `frontend/src/styles/_variables.scss` |
| Global | `frontend/src/styles/_global.scss` |
| UI / pages | `frontend/src/components/`, `frontend/src/pages/` |
| Charts | `frontend/src/components/charts/` |
| Logo / favicon | `frontend/public/logo.svg`, `favicon.svg` |
| Media query hook | `frontend/src/hooks/useMediaQuery.ts` |

## Changelog

| Date | Change |
|------|--------|
| 2026-08-02 | Identidade inicial Fluxo MVP |
| 2026-08-02 | Nav atualizada (A pagar, Investimentos, Wishlist); logo F+seta; polish mobile escopo A |
