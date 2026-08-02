import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { currentMonthBounds, formatBRL, formatDate, formatMonth } from '@/lib/format'
import { labelOf, paymentMethodLabel } from '@/lib/labels'
import { api } from '@/services/api'

type Account = { id: string; name: string }
type Category = { id: string; name: string }
type Tx = {
  id: string
  date: string
  description: string
  amount: string | number
  category_id: string
  account_id: string
  paid: boolean
  payment_method: 'debit' | 'credit' | null
}

type TxResponse = { items: Tx[]; total: number }

export function PayablesPage() {
  const { from, to } = currentMonthBounds()
  const monthLabel = formatMonth(from, 'long')

  const [items, setItems] = useState<Tx[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )
  const accountMap = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a.name])), [accounts])

  const total = useMemo(() => items.reduce((sum, tx) => sum + Number(tx.amount), 0), [items])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        type: 'expense',
        paid: 'false',
        from,
        to,
        limit: '200',
        offset: '0',
      })
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
  }, [])

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">A pagar</h1>
        <p className="text-muted-foreground">
          Despesas não pagas de {monthLabel}.
        </p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">Total pendente</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="font-mono text-2xl font-semibold tabular-nums text-destructive">
                {formatBRL(total)}
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
            <p className="text-sm text-muted-foreground">Nenhuma despesa pendente neste mês. Tudo em dia!</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
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
                      <TableCell>{formatDate(tx.date)}</TableCell>
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
