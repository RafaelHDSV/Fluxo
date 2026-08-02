import { useEffect, useMemo, useState } from 'react'
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
import { formatBRL, formatDate } from '@/lib/format'
import { currentYearMonth, periodBounds } from '@/lib/period'
import { labelOf, paymentMethodLabel } from '@/lib/labels'
import { api } from '@/services/api'

type Account = { id: string; name: string }
type Category = { id: string; name: string }
type Tx = {
  id: string
  date: string
  due_date?: string | null
  effective_date?: string | null
  description: string
  amount: string | number
  category_id: string
  account_id: string
  paid: boolean
  payment_method: 'debit' | 'credit' | null
}

type TxResponse = { items: Tx[]; total: number }

type PayablesFilter = 'current' | 'month' | 'all'

export function PayablesPage() {
  const { year: defaultYear, month: defaultMonth } = currentYearMonth()
  const [filter, setFilter] = useState<PayablesFilter>('current')
  const [pickYear, setPickYear] = useState(defaultYear)
  const [pickMonth, setPickMonth] = useState(defaultMonth)

  const [items, setItems] = useState<Tx[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const periodLabel = useMemo(() => {
    if (filter === 'all') return 'todo o histórico'
    if (filter === 'current') return periodBounds('month', defaultYear, defaultMonth).label
    return periodBounds('month', pickYear, pickMonth).label
  }, [filter, defaultYear, defaultMonth, pickYear, pickMonth])

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )
  const accountMap = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a.name])), [accounts])

  const totals = useMemo(() => {
    let total = 0
    let credit = 0
    let other = 0
    for (const tx of items) {
      const amount = Number(tx.amount) || 0
      total += amount
      if (tx.payment_method === 'credit') credit += amount
      else other += amount
    }
    return { total, credit, other }
  }, [items])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        type: 'expense',
        paid: 'false',
        sort: 'effective',
        limit: '500',
        offset: '0',
      })
      if (filter !== 'all') {
        const y = filter === 'current' ? defaultYear : pickYear
        const m = filter === 'current' ? defaultMonth : pickMonth
        const { from, to } = periodBounds('month', y, m)
        if (from) params.set('from', from)
        if (to) params.set('to', to)
      }
      const [txRes, accs, cats] = await Promise.all([
        api.get<TxResponse>(`/api/transactions?${params}`),
        api.get<Account[]>('/api/accounts'),
        api.get<Category[]>('/api/categories'),
      ])
      setItems(txRes.items)
      setAccounts(accs)
      setCategories(cats)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filter, pickYear, pickMonth])

  async function markPaid(tx: Tx) {
    setBusyId(tx.id)
    try {
      await api.put(`/api/transactions/${tx.id}`, { paid: true })
      setItems((prev) => prev.filter((t) => t.id !== tx.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao marcar como pago')
    } finally {
      setBusyId(null)
    }
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => defaultYear - 2 + i)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">A pagar</h1>
        <p className="text-muted-foreground">Despesas não pagas — {periodLabel}.</p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={filter} onValueChange={(v) => setFilter(v as PayablesFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Mês atual</SelectItem>
                <SelectItem value="month">Escolher mês</SelectItem>
                <SelectItem value="all">Todo o histórico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filter === 'month' && (
            <>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Select value={String(pickYear)} onValueChange={(v) => setPickYear(Number(v))}>
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
              <div className="space-y-2">
                <Label>Mês</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  className="w-[72px]"
                  value={pickMonth}
                  onChange={(e) => setPickMonth(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">Total a pagar</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="font-mono text-2xl font-semibold tabular-nums text-destructive">
                {formatBRL(totals.total)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">No cartão</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {formatBRL(totals.credit)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">Débito / outros</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {formatBRL(totals.other)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">Itens</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="font-mono text-2xl font-semibold tabular-nums">{items.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Despesas pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma despesa pendente neste período. Tudo em dia!
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Meio</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {tx.payment_method === 'credit' && tx.due_date ? (
                          <span className="whitespace-nowrap">
                            {formatDate(tx.effective_date || tx.due_date)}
                            <span className="text-muted-foreground">
                              {' '}
                              · compra {formatDate(tx.date)}
                            </span>
                          </span>
                        ) : (
                          formatDate(tx.effective_date || tx.date)
                        )}
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell>{categoryMap[tx.category_id] || '—'}</TableCell>
                      <TableCell>{accountMap[tx.account_id] || '—'}</TableCell>
                      <TableCell>
                        {tx.payment_method ? (
                          <Badge variant="outline">{labelOf(paymentMethodLabel, tx.payment_method)}</Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatBRL(tx.amount)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          type="button"
                          disabled={busyId === tx.id}
                          onClick={() => markPaid(tx)}
                        >
                          Marcar pago
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
