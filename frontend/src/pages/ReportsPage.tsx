import { CalendarDays, FileBarChart, Filter } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBRL, formatDate, formatMonth, todayISO } from '@/lib/format'
import { currentYearMonth, periodBounds, type PeriodMode } from '@/lib/period'
import { labelOf, transactionTypeLabel } from '@/lib/labels'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

type Account = { id: string; name: string }
type Category = { id: string; name: string }
type Summary = {
  period: { from: string; to: string }
  totals: { income: string | number; expense: string | number; count: number }
  byCategory: Array<{ name: string; type: string; total: string | number }>
  byAccount: Array<{ name: string; type: string; total: string | number }>
}

type CalendarMonth = {
  month: string
  label: string
  income: number
  expense: number
  result: number
  isCurrent: boolean
}

type CalendarReport = {
  year: number
  months: CalendarMonth[]
  totals: { income: number; expense: number; result: number }
}

export function ReportsPage() {
  const { year: defaultYear, month: defaultMonth } = currentYearMonth()
  const currentYear = new Date().getFullYear()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')
  const [periodYear, setPeriodYear] = useState(defaultYear)
  const [periodMonth, setPeriodMonth] = useState(defaultMonth)
  const [filters, setFilters] = useState({
    from: `${todayISO().slice(0, 8)}01`,
    to: todayISO(),
    account_id: '',
    category_id: '',
    tag: '',
  })
  const [summary, setSummary] = useState<Summary | null>(null)
  const [openingBalance, setOpeningBalance] = useState(0)
  const [calendarYear, setCalendarYear] = useState(currentYear)
  const [calendar, setCalendar] = useState<CalendarReport | null>(null)
  const [loadingCalendar, setLoadingCalendar] = useState(true)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [error, setError] = useState('')

  const periodLabel = useMemo(
    () => periodBounds(periodMode, periodYear, periodMonth).label,
    [periodMode, periodYear, periodMonth],
  )

  useEffect(() => {
    Promise.all([api.get<Account[]>('/api/accounts'), api.get<Category[]>('/api/categories')])
      .then(([a, c]) => {
        setAccounts(a)
        setCategories(c)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
  }, [])

  useEffect(() => {
    setLoadingCalendar(true)
    api
      .get<CalendarReport>(`/api/reports/calendar?year=${calendarYear}`)
      .then(setCalendar)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro no calendário'))
      .finally(() => setLoadingCalendar(false))
  }, [calendarYear])

  useEffect(() => {
    const bounds = periodBounds(periodMode, periodYear, periodMonth)
    setFilters((f) => ({
      ...f,
      from: bounds.from ?? '2000-01-01',
      to: bounds.to ?? todayISO(),
    }))
  }, [periodMode, periodYear, periodMonth])

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true)
    setError('')
    const params = new URLSearchParams()
    params.set('from', filters.from)
    params.set('to', filters.to)
    if (filters.account_id) params.set('account_id', filters.account_id)
    if (filters.category_id) params.set('category_id', filters.category_id)
    if (filters.tag) params.set('tag', filters.tag)
    try {
      const summaryRes = await api.get<Summary>(`/api/reports/summary?${params}`)
      setSummary(summaryRes)

      // Sem filtros extras e com datas do atalho: mesmo saldo de abertura do dashboard
      const bounds = periodBounds(periodMode, periodYear, periodMonth)
      const matchesPeriodShortcut =
        periodMode !== 'all' &&
        filters.from === (bounds.from ?? filters.from) &&
        filters.to === (bounds.to ?? filters.to)
      const noExtraFilters = !filters.account_id && !filters.category_id && !filters.tag
      if (noExtraFilters && matchesPeriodShortcut) {
        const dashParams = new URLSearchParams({ period: periodMode, year: String(periodYear) })
        if (periodMode === 'month') dashParams.set('month', String(periodMonth))
        const dash = await api.get<{ openingBalance?: number | null }>(
          `/api/reports/dashboard?${dashParams}`,
        )
        setOpeningBalance(
          dash.openingBalance != null && Number.isFinite(dash.openingBalance) ? dash.openingBalance : 0,
        )
      } else {
        setOpeningBalance(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoadingSummary(false)
    }
  }, [filters, periodMode, periodYear, periodMonth])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const receitasTotais = summary
    ? Number(summary.totals.income) + (periodMode === 'all' ? 0 : openingBalance)
    : 0
  const despesasTotais = summary ? Number(summary.totals.expense) : 0
  const saldoMes = receitasTotais - despesasTotais

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Calendário anual e resumo detalhado por período, conta e categoria.</p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            Calendário {calendarYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={String(calendarYear)} onValueChange={(v) => setCalendarYear(Number(v))}>
                <SelectTrigger className="w-full sm:w-[120px]">
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
          </div>

          {loadingCalendar ? (
            <Skeleton className="h-48 w-full" />
          ) : calendar && calendar.months.some((m) => m.income > 0 || m.expense > 0) ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {calendar.months.map((m) => (
                  <div
                    key={m.month}
                    className={cn(
                      'rounded-lg border border-border p-3 text-sm',
                      m.isCurrent && 'border-primary/50 bg-primary/5',
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <strong>{formatMonth(m.month, 'long')}</strong>
                      {m.isCurrent && <Badge variant="success">Atual</Badge>}
                    </div>
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Receitas</span>
                        <span className="font-mono tabular-nums text-primary">{formatBRL(m.income)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Despesas</span>
                        <span className="font-mono tabular-nums text-destructive">{formatBRL(m.expense)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-1 font-medium text-foreground">
                        <span>Resultado</span>
                        <span
                          className={cn(
                            'font-mono tabular-nums',
                            m.result >= 0 ? 'text-primary' : 'text-destructive',
                          )}
                        >
                          {formatBRL(m.result)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas anuais</p>
                  <p className="font-mono text-lg tabular-nums text-primary">{formatBRL(calendar.totals.income)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Despesas anuais</p>
                  <p className="font-mono text-lg tabular-nums text-destructive">
                    {formatBRL(calendar.totals.expense)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resultado anual</p>
                  <p
                    className={cn(
                      'font-mono text-lg tabular-nums',
                      calendar.totals.result >= 0 ? 'text-primary' : 'text-destructive',
                    )}
                  >
                    {formatBRL(calendar.totals.result)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum lançamento em {calendarYear}.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Resumo por período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label>Período rápido</Label>
                <Select value={periodMode} onValueChange={(v) => setPeriodMode(v as PeriodMode)}>
                  <SelectTrigger className="h-10 w-full sm:w-[160px]">
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
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Select value={String(periodYear)} onValueChange={(v) => setPeriodYear(Number(v))}>
                    <SelectTrigger className="h-10 w-full sm:w-[100px]">
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
                <div className="space-y-2">
                  <Label>Mês</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    className="h-10 w-full sm:w-[72px]"
                    value={periodMonth}
                    onChange={(e) =>
                      setPeriodMonth(Math.min(12, Math.max(1, Number(e.target.value) || 1)))
                    }
                  />
                </div>
              )}
              <p className="pb-2 text-sm text-muted-foreground">{periodLabel}</p>
              {loadingSummary && <p className="pb-2 text-sm text-muted-foreground">Atualizando…</p>}
            </div>

            <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="space-y-2">
                <Label>De</Label>
                <DatePicker value={filters.from} onChange={(from) => setFilters({ ...filters, from })} />
              </div>
              <div className="space-y-2">
                <Label>Até</Label>
                <DatePicker value={filters.to} onChange={(to) => setFilters({ ...filters, to })} />
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Select
                  value={filters.account_id || 'all'}
                  onValueChange={(v) => setFilters({ ...filters, account_id: v === 'all' ? '' : v })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={filters.category_id || 'all'}
                  onValueChange={(v) => setFilters({ ...filters, category_id: v === 'all' ? '' : v })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rep-tag">Tag</Label>
                <Input
                  id="rep-tag"
                  value={filters.tag}
                  onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                  placeholder="opcional"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FileBarChart className="h-3.5 w-3.5" />
                  Receitas
                </p>
                <p className="font-mono text-xl tabular-nums text-primary">{formatBRL(receitasTotais)}</p>
                <p className="text-xs text-muted-foreground">
                  {openingBalance > 0
                    ? `inclui ${formatBRL(openingBalance)} do mês anterior`
                    : `${formatDate(summary.period.from)} — ${formatDate(summary.period.to)}`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="font-mono text-xl tabular-nums text-destructive">
                  {formatBRL(despesasTotais)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Saldo do período</p>
                <p className="font-mono text-xl tabular-nums">{formatBRL(saldoMes)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Lançamentos</p>
                <p className="font-mono text-xl tabular-nums">{summary.totals.count}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lançamento neste período.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.byCategory.map((row) => (
                        <TableRow key={`${row.name}-${row.type}`}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>
                            <Badge variant="muted">{labelOf(transactionTypeLabel, row.type)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatBRL(row.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por conta</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.byAccount.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lançamento neste período.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conta</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.byAccount.map((row) => (
                        <TableRow key={`${row.name}-${row.type}`}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>
                            <Badge variant="muted">{labelOf(transactionTypeLabel, row.type)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatBRL(row.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!summary && loadingSummary && <Skeleton className="h-40 w-full" />}
    </div>
  )
}
