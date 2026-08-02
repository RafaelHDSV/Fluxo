import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { currentMonthBounds, formatBRL, formatDate, todayISO } from '@/lib/format'
import { labelOf, paymentMethodLabel, transactionTypeLabel } from '@/lib/labels'
import { api } from '@/services/api'

type Account = { id: string; name: string }
type Category = { id: string; name: string }
type Tx = {
  id: string
  date: string
  description: string
  amount: string | number
  type: string
  category_id: string
  account_id: string
  transfer_account_id?: string | null
  notes?: string | null
  paid: boolean
  payment_method: 'debit' | 'credit' | null
}

type TxResponse = { items: Tx[]; total: number; limit: number; offset: number }

const PAGE_SIZE = 50

const emptyForm = {
  date: todayISO(),
  description: '',
  amount: '',
  type: 'expense',
  category_id: '',
  account_id: '',
  transfer_account_id: '',
  notes: '',
  paid: true,
  payment_method: 'debit' as '' | 'debit' | 'credit',
}

export function TransactionsPage() {
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') || ''

  const [items, setItems] = useState<Tx[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [type, setType] = useState(initialType)
  const [filterMode, setFilterMode] = useState<'all' | 'a_pagar'>('all')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )
  const accountMap = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a.name])), [accounts])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    setOffset(0)
  }, [debouncedQ, type, filterMode])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(offset))
      if (debouncedQ) params.set('q', debouncedQ)
      if (filterMode === 'a_pagar') {
        params.set('type', 'expense')
        params.set('paid', 'false')
        const { from, to } = currentMonthBounds()
        params.set('from', from)
        params.set('to', to)
      } else if (type) {
        params.set('type', type)
      }
      const qs = params.toString()
      const [txRes, accs, cats] = await Promise.all([
        api.get<TxResponse>(`/api/transactions?${qs}`),
        api.get<Account[]>('/api/accounts'),
        api.get<Category[]>('/api/categories'),
      ])
      setItems(txRes.items)
      setTotal(txRes.total)
      setAccounts(accs)
      setCategories(cats)
      setForm((f) => ({
        ...f,
        account_id: f.account_id || accs[0]?.id || '',
        category_id: f.category_id || cats[0]?.id || '',
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, type, filterMode, offset])

  useEffect(() => {
    load()
  }, [load])

  function cancelEdit() {
    setEditingId(null)
    setForm({
      ...emptyForm,
      account_id: form.account_id,
      category_id: form.category_id,
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        date: form.date,
        description: form.description,
        amount: Number(form.amount),
        type: form.type,
        category_id: form.category_id,
        account_id: form.account_id,
        paid: form.paid,
        payment_method: form.type === 'expense' ? form.payment_method || null : null,
        transfer_account_id:
          form.type === 'transfer' && form.transfer_account_id ? form.transfer_account_id : null,
        notes: form.type === 'adjustment' && form.notes ? form.notes : null,
      }
      if (editingId) await api.put(`/api/transactions/${editingId}`, payload)
      else await api.post('/api/transactions', payload)
      cancelEdit()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  async function onDelete(id: string) {
    await api.delete(`/api/transactions/${id}`)
    await load()
  }

  async function togglePaid(tx: Tx) {
    await api.put(`/api/transactions/${tx.id}`, { paid: !tx.paid })
    await load()
  }

  function startEdit(tx: Tx) {
    setEditingId(tx.id)
    setForm({
      date: String(tx.date).slice(0, 10),
      description: tx.description,
      amount: String(tx.amount),
      type: tx.type,
      category_id: tx.category_id,
      account_id: tx.account_id,
      transfer_account_id: tx.transfer_account_id || '',
      notes: tx.notes || '',
      paid: Boolean(tx.paid),
      payment_method: tx.payment_method || 'debit',
    })
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Transações</h1>
        <p className="text-muted-foreground">Crie, edite, filtre e categorize seus lançamentos.</p>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{editingId ? 'Editar lançamento' : 'Novo lançamento'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tx-date">Data</Label>
                <Input
                  id="tx-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tx-desc">Descrição</Label>
                <Input
                  id="tx-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-amount">Valor</Label>
                <Input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(transactionTypeLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.type === 'expense' && (
                <div className="space-y-2">
                  <Label>Meio de pagamento</Label>
                  <Select
                    value={form.payment_method}
                    onValueChange={(v) => setForm({ ...form, payment_method: v as 'debit' | 'credit' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paymentMethodLabel).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.type === 'transfer' && (
                <div className="space-y-2">
                  <Label>Conta destino</Label>
                  <Select
                    value={form.transfer_account_id}
                    onValueChange={(v) => setForm({ ...form, transfer_account_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((a) => a.id !== form.account_id)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.type === 'adjustment' && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="tx-notes">Motivo do ajuste</Label>
                  <Input
                    id="tx-notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Ex.: correção de saldo"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm({ ...form, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Checkbox
                  id="tx-paid"
                  checked={form.paid}
                  onCheckedChange={(c) => setForm({ ...form, paid: c === true })}
                />
                <Label htmlFor="tx-paid" className="cursor-pointer">
                  Pago
                </Label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{editingId ? 'Atualizar' : 'Adicionar'}</Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar edição
                </Button>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lançamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="filter-q">Buscar</Label>
              <Input
                id="filter-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Descrição"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type || 'all'} onValueChange={(v) => setType(v === 'all' ? '' : v)} disabled={filterMode === 'a_pagar'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(transactionTypeLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vista</Label>
              <Select value={filterMode} onValueChange={(v) => setFilterMode(v as 'all' | 'a_pagar')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="a_pagar">A pagar (mês)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma transação. Cadastre uma conta e lance o primeiro valor.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Meio</TableHead>
                      <TableHead>Pago</TableHead>
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
                          <Badge variant="muted">{labelOf(transactionTypeLabel, tx.type)}</Badge>
                        </TableCell>
                        <TableCell>
                          {tx.payment_method ? (
                            <Badge variant="outline">{labelOf(paymentMethodLabel, tx.payment_method)}</Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" type="button" onClick={() => togglePaid(tx)}>
                            <Badge variant={tx.paid ? 'success' : 'warning'}>{tx.paid ? 'Sim' : 'Não'}</Badge>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{formatBRL(tx.amount)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" type="button" onClick={() => startEdit(tx)}>
                              Editar
                            </Button>
                            <Button variant="destructive" size="sm" type="button" onClick={() => onDelete(tx.id)}>
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  {total} lançamento(s) · página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={offset === 0}
                    onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={offset + PAGE_SIZE >= total}
                    onClick={() => setOffset((o) => o + PAGE_SIZE)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
