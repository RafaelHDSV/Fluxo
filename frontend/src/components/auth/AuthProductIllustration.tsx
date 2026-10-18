import { cn } from '@/lib/utils'
import {
  ArrowLeftRight,
  BarChart3,
  CircleDollarSign,
  Heart,
  LayoutDashboard,
  PieChart,
  TrendingUp,
  Upload,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

type Slide = {
  id: string
  tab: string
  caption: string
  rail: number
  screen: ReactNode
}

/** Must match the `auth-progress` duration in the tab underline. */
const SLIDE_SECONDS = 6

/**
 * Tabbed product screens for the auth panel (início, contas, orçamentos, relatórios).
 * Progress underline drives auto-advance via animationend — never pauses on hover/focus;
 * reduced-motion (no animation) never advances. Theme tokens only — no photos.
 */
export function AuthProductIllustration() {
  const captionId = useId()
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length)
  }, [])

  function onTabKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight') go(index + 1)
    else if (e.key === 'ArrowLeft') go(index - 1)
    else return
    e.preventDefault()
  }

  return (
    <div className="mt-5 flex min-h-0 flex-1 flex-col xl:mt-6 [@media(max-height:700px)]:mt-3">
      <div
        role="tablist"
        aria-label="Telas do produto"
        onKeyDown={onTabKeyDown}
        className="flex shrink-0 gap-5 pr-6"
      >
        {SLIDES.map((s, i) => {
          const active = i === index
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={captionId}
              tabIndex={active ? 0 : -1}
              onClick={() => setIndex(i)}
              className={cn(
                'group relative pb-2.5 text-sm font-medium outline-none transition-colors focus-visible:text-foreground',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s.tab}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-full bg-border"
              >
                {active ? (
                  <span
                    key={index}
                    onAnimationEnd={() => go(index + 1)}
                    style={{ animationDuration: `${SLIDE_SECONDS}s` }}
                    className="absolute inset-0 origin-left animate-[auth-progress_linear_forwards] bg-primary motion-reduce:animate-none"
                  />
                ) : null}
              </span>
            </button>
          )
        })}
      </div>

      <p
        id={captionId}
        role="tabpanel"
        className="mt-2 line-clamp-2 min-h-8 max-w-2xl shrink-0 pr-6 text-sm text-muted-foreground [@media(max-height:700px)]:sr-only"
      >
        {slide.caption}
      </p>

      <ScaledFrame>
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_60px_-28px_rgba(0,0,0,0.5)]">
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
            <span className="font-display text-xs font-semibold tracking-tight text-foreground">
              Fluxo
            </span>
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Outubro 2026
            </span>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[3.25rem_1fr]">
            <nav
              aria-hidden
              className="flex flex-col items-center gap-1 border-r border-border bg-background py-3"
            >
              {RAIL.map((icon, i) => (
                <RailIcon key={i} icon={icon} active={i === slide.rail} />
              ))}
            </nav>

            <div key={slide.id} className="min-h-0 overflow-hidden bg-background p-5">
              {slide.screen}
            </div>
          </div>
        </div>
      </ScaledFrame>
    </div>
  )
}

/**
 * Laptop-like window that always fits entirely in the free box (no bleed).
 * Aspect stays in a notebook range (~1.30–1.50); Math.min scale, centered with inset.
 */
const FRAME_H = 520
const MIN_ASPECT = 1.3
const MAX_ASPECT = 1.5

function ScaledFrame({ children }: { children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({
    scale: 1,
    w: FRAME_H * 1.42,
    h: FRAME_H,
    x: 0,
    y: 0,
  })

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box || typeof ResizeObserver === 'undefined') return
    const fit = () => {
      const { width, height } = box.getBoundingClientRect()
      if (!width || !height) return
      const boxAspect = width / height
      const aspect = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, boxAspect))
      const designH = FRAME_H
      const designW = FRAME_H * aspect
      const scale = Math.min(width / designW, height / designH)
      setLayout({
        scale,
        w: designW,
        h: designH,
        x: (width - designW * scale) / 2,
        y: (height - designH * scale) / 2,
      })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="relative mt-4 min-h-0 flex-1 overflow-hidden [@media(max-height:700px)]:mt-3">
      <div
        ref={boxRef}
        className="absolute inset-0 bottom-4 right-4 [@media(max-height:700px)]:bottom-3 [@media(max-height:700px)]:right-3"
      >
        <div
          className="absolute origin-top-left"
          style={{
            width: layout.w,
            height: layout.h,
            left: layout.x,
            top: layout.y,
            transform: `scale(${layout.scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

const RAIL: LucideIcon[] = [
  LayoutDashboard,
  ArrowLeftRight,
  CircleDollarSign,
  Wallet,
  PieChart,
  TrendingUp,
  BarChart3,
  Heart,
]

function RailIcon({
  icon: Icon,
  active,
  className,
}: {
  icon: LucideIcon
  active?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex size-9 items-center justify-center rounded-md',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  )
}

function ScreenHeader({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string
  title: string
  meta?: string
}) {
  return (
    <div className="min-w-0 shrink-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {eyebrow}
      </p>
      <p className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</p>
      {meta ? <p className="font-mono text-xs text-muted-foreground">{meta}</p> : null}
    </div>
  )
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'font-mono text-base font-semibold',
          tone === 'positive' && 'text-primary',
          tone === 'negative' && 'text-destructive',
          (!tone || tone === 'neutral') && 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function ScreenInicio() {
  const pairs = [
    [70, 45],
    [85, 55],
    [60, 50],
    [90, 40],
    [75, 65],
    [80, 48],
    [95, 58],
  ]
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ScreenHeader eyebrow="Dashboard" title="Outubro 2026" meta="Saldo das contas · âncora" />

      <div className="grid shrink-0 grid-cols-3 gap-2">
        <Kpi label="Saldo" value="R$ 12.480" tone="positive" />
        <Kpi label="Receitas" value="R$ 8.200" tone="positive" />
        <Kpi label="Despesas" value="R$ 5.940" tone="negative" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-surface p-3.5">
        <p className="mb-3 shrink-0 text-sm font-semibold text-foreground">Receita × despesa</p>
        <div className="flex min-h-0 flex-1 items-end gap-2">
          {pairs.map(([income, expense], i) => (
            <div key={i} className="flex h-full flex-1 items-end justify-center gap-0.5">
              <div className="w-[45%] rounded-t-sm bg-primary/85" style={{ height: `${income}%` }} />
              <div
                className="w-[45%] rounded-t-sm bg-destructive/75"
                style={{ height: `${expense}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 rounded-xl border border-primary/40 bg-surface p-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Upload className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Extrato OFX</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            Importação mensal · Santander
          </p>
        </div>
      </div>
    </div>
  )
}

function ScreenContas() {
  const accounts = [
    { name: 'Conta corrente', kind: 'Débito', bal: 'R$ 4.820,00', tone: 'positive' as const },
    { name: 'Cartão Nubank', kind: 'Crédito · vence 10', bal: '− R$ 1.240,00', tone: 'negative' as const },
    { name: 'Poupança', kind: 'Débito', bal: 'R$ 8.900,00', tone: 'positive' as const },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ScreenHeader eyebrow="Contas" title="Saldo âncora" meta="3 contas · editável" />
      <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden">
        {accounts.map((a) => (
          <div
            key={a.name}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Wallet className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{a.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{a.kind}</p>
            </div>
            <p
              className={cn(
                'shrink-0 font-mono text-sm font-semibold',
                a.tone === 'positive' ? 'text-primary' : 'text-destructive',
              )}
            >
              {a.bal}
            </p>
          </div>
        ))}
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <Kpi label="Disponível" value="R$ 13.720" tone="positive" />
        <Kpi label="Fatura aberta" value="R$ 1.240" tone="negative" />
      </div>
    </div>
  )
}

function BudgetRow({
  label,
  spent,
  limit,
  pct,
}: {
  label: string
  spent: string
  limit: string
  pct: number
}) {
  const warn = pct >= 80
  return (
    <div className="space-y-1.5 rounded-xl border border-border bg-surface px-3.5 py-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {spent} / {limit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', warn ? 'bg-warning' : 'bg-primary')}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

function ScreenOrcamentos() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ScreenHeader eyebrow="Orçamentos" title="Categorias · Outubro" meta="Alerta ~80%" />
      <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden">
        <BudgetRow label="Alimentação" spent="R$ 980" limit="R$ 1.200" pct={82} />
        <BudgetRow label="Moradia" spent="R$ 2.100" limit="R$ 2.500" pct={84} />
        <BudgetRow label="Transporte" spent="R$ 320" limit="R$ 600" pct={53} />
        <BudgetRow label="Lazer" spent="R$ 180" limit="R$ 400" pct={45} />
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-lg border border-warning/40 bg-surface px-3 py-2 text-xs text-muted-foreground">
        <PieChart className="size-3.5 shrink-0 text-warning" />
        Duas categorias acima de 80% do limite
      </div>
    </div>
  )
}

function ScreenRelatorios() {
  const W = 400
  const H = 140
  const vals = [4.2, 5.1, 4.8, 6.2, 5.5, 7.1, 6.8, 8.0, 7.4, 8.9, 9.2, 10.1]
  const min = 3.5
  const max = 10.5
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = 10 + (1 - (v - min) / (max - min)) * (H - 20)
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${W} ${H} L0 ${H} Z`

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ScreenHeader eyebrow="Relatórios" title="Resultado do mês" meta="últimos 12 meses" />

      <div className="flex shrink-0 items-end gap-3">
        <p className="font-mono text-3xl font-semibold tracking-tight text-foreground">
          R$ 2.260
        </p>
        <span className="mb-1 font-mono text-xs text-primary">+12% vs set</span>
      </div>

      <div className="min-h-36 flex-1 rounded-xl border border-border bg-surface p-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          role="img"
          aria-label="Gráfico de resultado acumulado"
        >
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              x2={W}
              y1={H * f}
              y2={H * f}
              stroke="var(--border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={area} fill="var(--primary)" fillOpacity="0.12" />
          <path
            d={line}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-2">
        <Kpi label="Categorias" value="12" />
        <Kpi label="Pagas" value="28" tone="positive" />
        <Kpi label="A pagar" value="4" tone="negative" />
      </div>
    </div>
  )
}

const SLIDES: Slide[] = [
  {
    id: 'inicio',
    tab: 'Início',
    caption: 'O dashboard resume saldo, receitas e despesas do mês num painel só.',
    rail: 0,
    screen: <ScreenInicio />,
  },
  {
    id: 'contas',
    tab: 'Contas',
    caption: 'Saldo âncora por conta — débito e crédito com vencimento da fatura.',
    rail: 3,
    screen: <ScreenContas />,
  },
  {
    id: 'orcamentos',
    tab: 'Orçamentos',
    caption: 'Limite por categoria com alerta perto de 80% do orçamento.',
    rail: 4,
    screen: <ScreenOrcamentos />,
  },
  {
    id: 'relatorios',
    tab: 'Relatórios',
    caption: 'Resultado acumulado e visão agregada do período, com clareza.',
    rail: 6,
    screen: <ScreenRelatorios />,
  },
]
