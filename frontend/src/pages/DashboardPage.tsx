import { CreditCard, Receipt, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardCharts } from '@/components/charts/DashboardCharts'
import { SummaryCard } from '@/components/SummaryCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/format'
import { currentYearMonth, periodBounds, type PeriodMode } from '@/lib/period'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

type Dashboard = {
  balance: number
  openingBalance?: number | null
  closingBalance?: number | null
  balancesAnchored?: boolean
  income: number
  expense: number
  adjustments?: number
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
  periodCashflow?: Array<{ date: string; result: string | number }>
  balanceSeries?: Array<{ date: string; balance: string | number }>
  upcomingCards: Array<{ name: string; due_day: number }>
  alerts: Array<{ level: string; message: string }>
  goals: Array<{ name: string; current_amount: string | number; target_amount: string | number }>
}

export function DashboardPage() {
  const { year: defaultYear, month: defaultMonth } = currentYearMonth()
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')
  const [year, setYear] = useState(defaultYear)
  const [month, setMonth] = useState(defaultMonth)
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const periodLabel = useMemo(() => periodBounds(periodMode, year, month).label, [periodMode, year, month])

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    params.set('period', periodMode)
    if (periodMode !== 'all') {
      params.set('year', String(year))
      if (periodMode === 'month') params.set('month', String(month))
    }
    api
      .get<Dashboard>(`/api/reports/dashboard?${params}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar dashboard'))
      .finally(() => setLoading(false))
  }, [periodMode, year, month])

  const cashflow = useMemo(() => {
    if (data?.periodCashflow?.length) return data.periodCashflow
    if (data?.balanceSeries?.length) {
      return data.balanceSeries.map((b) => ({ date: b.date, result: b.balance }))
    }
    return []
  }, [data])

  const shortcuts = [
    { to: '/transactions?type=income', label: 'Receitas', icon: Wallet },
    { to: '/transactions?type=expense', label: 'Despesas', icon: Receipt },
    { to: '/a-pagar', label: 'A pagar', icon: CreditCard },
  ]

  const yearOptions = Array.from({ length: 5 }, (_, i) => defaultYear - 2 + i)
  const unpaidTotal = data?.unpaidTotal ?? 0
  const unpaidCount = data?.unpaidCount ?? 0
  const projectedAfterPayables = data ? data.balance - unpaidTotal : 0
  const carryIn =
    data?.openingBalance != null && Number.isFinite(data.openingBalance) ? data.openingBalance : 0
  const receitasTotais = data ? data.income + carryIn : 0
  const saldoMes = data ? receitasTotais - data.expense : 0
  const showCarryIn = periodMode !== 'all'

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Para onde seu dinheiro está indo — {periodLabel}.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Período</Label>
            <Select value={periodMode} onValueChange={(v) => setPeriodMode(v as PeriodMode)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
                <SelectItem value="all">Todo o histórico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {periodMode !== 'all' && (
            <div className="space-y-1">
              <Label className="text-xs">Ano</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {periodMode === 'month' && (
            <div className="space-y-1">
              <Label className="text-xs">Mês</Label>
              <Input
                type="number"
                min={1}
                max={12}
                className="w-[72px]"
                value={month}
                onChange={(e) => setMonth(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
              />
            </div>
          )}
        </div>
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
        <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: showCarryIn ? 6 : 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {showCarryIn && (
              <SummaryCard
                label="Do mês anterior"
                value={
                  data.openingBalance != null && Number.isFinite(data.openingBalance)
                    ? formatBRL(data.openingBalance)
                    : '—'
                }
                hint="Saldo trazido do período anterior"
              />
            )}
            <SummaryCard
              label="Receitas"
              value={formatBRL(receitasTotais)}
              tone="positive"
              hint={
                showCarryIn && carryIn !== 0
                  ? `Entradas (${formatBRL(data.income)}) + mês anterior`
                  : 'Tudo que entrou no período'
              }
            />
            <SummaryCard
              label="Despesas"
              value={formatBRL(data.expense)}
              tone="negative"
              hint="Já pagas no período"
            />
            <SummaryCard
              label="Saldo do mês"
              value={formatBRL(saldoMes)}
              tone={saldoMes >= 0 ? 'positive' : 'negative'}
              hint="Receitas − despesas pagas"
            />
            <SummaryCard
              label="Ainda a pagar"
              value={formatBRL(unpaidTotal)}
              tone={unpaidTotal > 0 ? 'negative' : 'default'}
              hint={
                unpaidCount > 0
                  ? `${unpaidCount} despesa(s) pendente(s)`
                  : 'Nenhuma pendência no período'
              }
              action={
                unpaidCount > 0 ? (
                  <Link to="/a-pagar" className="text-xs text-warning hover:underline">
                    Ver a pagar
                  </Link>
                ) : null
              }
            />
            <SummaryCard
              label="Saldo após a pagar"
              value={formatBRL(projectedAfterPayables)}
              tone={projectedAfterPayables >= 0 ? 'positive' : 'negative'}
              hint="Contas − a pagar"
            />
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
                cashflow={cashflow}
                loading={loading}
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
                <CardTitle className="text-base">Investimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {(data.goals?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma caixinha ainda.{' '}
                    <Link to="/investments" className="text-primary hover:underline">
                      Criar investimento
                    </Link>
                  </p>
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
