import { ArrowDownRight, ArrowUpRight, CreditCard, Receipt, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardCharts } from '@/components/charts/DashboardCharts'
import { SummaryCard } from '@/components/SummaryCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL, formatDeltaPct } from '@/lib/format'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

type Dashboard = {
  balance: number
  income: number
  expense: number
  result: number
  savingsRate: number
  previousIncome?: number
  previousExpense?: number
  incomeDeltaPct?: number | null
  expenseDeltaPct?: number | null
  unpaidCount?: number
  unpaidTotal?: number
  byCategory: Array<{ name: string; color?: string; total: string | number }>
  monthly: Array<{ month: string; income: string | number; expense: string | number }>
  balanceSeries: Array<{ date: string; balance: string | number }>
  upcomingCards: Array<{ name: string; due_day: number }>
  alerts: Array<{ level: string; message: string }>
  goals: Array<{ name: string; current_amount: string | number; target_amount: string | number }>
}

function DeltaHint({ value, invert }: { value: number | null | undefined; invert?: boolean }) {
  if (value == null || !Number.isFinite(value)) {
    return <span className="text-xs text-muted-foreground">— vs mês anterior</span>
  }
  const positive = invert ? value < 0 : value > 0
  const negative = invert ? value > 0 : value < 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs',
        positive && 'text-primary',
        negative && 'text-destructive',
        !positive && !negative && 'text-muted-foreground',
      )}
    >
      {value > 0 ? <ArrowUpRight className="h-3 w-3" /> : value < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
      {formatDeltaPct(value)} vs mês anterior
    </span>
  )
}

export function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .get<Dashboard>('/api/reports/dashboard')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar painel'))
      .finally(() => setLoading(false))
  }, [])

  const shortcuts = [
    { to: '/transactions?type=income', label: 'Receitas', icon: Wallet },
    { to: '/transactions?type=expense', label: 'Despesas', icon: Receipt },
    { to: '/a-pagar', label: 'A pagar', icon: CreditCard },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="text-muted-foreground">Para onde seu dinheiro está indo este mês?</p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {shortcuts.map(({ to, label, icon: Icon }) => (
          <Button key={to} variant="outline" size="sm" asChild>
            <Link to={to}>
              <Icon className="mr-1.5 h-4 w-4" />
              {label}
            </Link>
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1">
              <SummaryCard label="Saldo atual" value={formatBRL(data.balance)} />
            </div>
            <div className="space-y-1">
              <SummaryCard label="Receitas do mês" value={formatBRL(data.income)} tone="positive" />
              <DeltaHint value={data.incomeDeltaPct} />
            </div>
            <div className="space-y-1">
              <SummaryCard label="Despesas do mês" value={formatBRL(data.expense)} tone="negative" />
              <DeltaHint value={data.expenseDeltaPct} invert />
            </div>
            <div className="space-y-1">
              <SummaryCard
                label="Resultado mensal"
                value={formatBRL(data.result)}
                tone={data.result >= 0 ? 'positive' : 'negative'}
              />
            </div>
            <div className="space-y-1">
              <SummaryCard label="Taxa de economia" value={`${data.savingsRate.toFixed(1)}%`} />
            </div>
            {(data.unpaidCount ?? 0) > 0 && (
              <div className="space-y-1">
                <SummaryCard label="A pagar (mês)" value={formatBRL(data.unpaidTotal ?? 0)} tone="negative" />
                <Link to="/a-pagar" className="text-xs text-warning hover:underline">
                  {data.unpaidCount} despesa(s) pendente(s)
                </Link>
              </div>
            )}
          </div>

          {(data.alerts?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Alertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.alerts.map((a) => (
                  <div
                    key={a.message}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm',
                      a.level === 'danger'
                        ? 'border-destructive/40 bg-destructive/10 text-destructive'
                        : 'border-warning/40 bg-warning/10 text-warning',
                    )}
                  >
                    {a.message}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <DashboardCharts
                monthly={data.monthly || []}
                byCategory={data.byCategory || []}
                balanceSeries={data.balanceSeries || []}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Próximas faturas</CardTitle>
              </CardHeader>
              <CardContent>
                {(data.upcomingCards?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum cartão com vencimento cadastrado.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.upcomingCards.map((c) => (
                      <li key={c.name} className="flex justify-between border-b border-border/60 pb-2 last:border-0">
                        <span>{c.name}</span>
                        <span className="text-muted-foreground">dia {c.due_day}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Metas</CardTitle>
              </CardHeader>
              <CardContent>
                {(data.goals?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma meta ainda.</p>
                ) : (
                  <div className="space-y-4">
                    {data.goals.map((g) => {
                      const current = Number(g.current_amount)
                      const target = Number(g.target_amount)
                      const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
                      return (
                        <div key={g.name}>
                          <div className="mb-1 flex justify-between gap-2 text-sm">
                            <strong>{g.name}</strong>
                            <span className="font-mono tabular-nums text-muted-foreground">
                              {formatBRL(current)} / {formatBRL(target)}
                            </span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        !error && <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>
      )}
    </div>
  )
}
