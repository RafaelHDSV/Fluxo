import { FormEvent, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { formatBRL, formatMonth, todayISO } from '@/lib/format'
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
  const currentYear = new Date().getFullYear()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState({
    from: `${todayISO().slice(0, 8)}01`,
    to: todayISO(),
    account_id: '',
    category_id: '',
    tag: '',
  })
  const [summary, setSummary] = useState<Summary | null>(null)
  const [calendarYear, setCalendarYear] = useState(currentYear)
  const [calendar, setCalendar] = useState<CalendarReport | null>(null)
  const [loadingCalendar, setLoadingCalendar] = useState(true)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [error, setError] = useState('')

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoadingSummary(true)
    setError('')
    const params = new URLSearchParams()
    params.set('from', filters.from)
    params.set('to', filters.to)
    if (filters.account_id) params.set('account_id', filters.account_id)
    if (filters.category_id) params.set('category_id', filters.category_id)
    if (filters.tag) params.set('tag', filters.tag)
    try {
      setSummary(await api.get<Summary>(`/api/reports/summary?${params}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoadingSummary(false)
    }
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Análise por período, conta, categoria e calendário anual.</p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Calendário {calendarYear}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select
                value={String(calendarYear)}
                onValueChange={(v) => setCalendarYear(Number(v))}
              >
                <SelectTrigger className="w-[120px]">
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
          ) : calendar ? (
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
                      <strong>{m.label}</strong>
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
            <p className="text-sm text-muted-foreground">Sem dados para este ano.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumo por período</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="rep-from">De</Label>
              <Input
                id="rep-from"
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rep-to">Até</Label>
              <Input
                id="rep-to"
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Conta</Label>
              <Select
                value={filters.account_id || 'all'}
                onValueChange={(v) => setFilters({ ...filters, account_id: v === 'all' ? '' : v })}
              >
                <SelectTrigger>
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
                <SelectTrigger>
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
            <div className="flex items-end">
              <Button type="submit" disabled={loadingSummary}>
                {loadingSummary ? 'Gerando…' : 'Gerar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="font-mono text-xl tabular-nums text-primary">{formatBRL(summary.totals.income)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMonth(summary.period.from.slice(0, 7), 'long')} — {formatMonth(summary.period.to.slice(0, 7), 'long')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="font-mono text-xl tabular-nums text-destructive">
                  {formatBRL(summary.totals.expense)}
                </p>
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
                        <TableCell className="text-right font-mono tabular-nums">{formatBRL(row.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por conta</CardTitle>
            </CardHeader>
            <CardContent>
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
                        <TableCell className="text-right font-mono tabular-nums">{formatBRL(row.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
