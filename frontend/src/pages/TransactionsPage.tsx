import { Fragment, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DatePicker } from '@/components/ui/date-picker'
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
import { formatDate, formatMonth, formatSignedBRL, todayISO } from '@/lib/format'
import { currentYearMonth, periodBounds, type PeriodMode } from '@/lib/period'
import { labelOf, paymentMethodLabel, transactionTypeLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'
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

function monthKey(date: string) {
  return String(date).slice(0, 7)
}

function parsePeriodMode(raw: string | null): PeriodMode {
  if (raw === 'month' || raw === 'year' || raw === 'all') return raw
  return 'all'
}

function parseFilterMode(raw: string | null): 'all' | 'a_pagar' {
  return raw === 'a_pagar' ? 'a_pagar' : 'all'
}

function colSpanFor(showMeio: boolean, isIncomeOnly: boolean) {
  // checkbox + data + desc + cat + conta + tipo + [meio] + [pago] + valor + ações
  let n = 8
  if (showMeio) n += 1
  if (!isIncomeOnly) n += 1
  return n
}

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { year: defaultYear, month: defaultMonth } = currentYearMonth()

  const [items, setItems] = useState<Tx[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(() => {
    const page = Number(searchParams.get('page') || '1')
    return Number.isFinite(page) && page > 1 ? (page - 1) * PAGE_SIZE : 0
  })
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState(() => searchParams.get('q') || '')
  const [debouncedQ, setDebouncedQ] = useState(() => searchParams.get('q') || '')
  const [type, setType] = useState(() => searchParams.get('type') || '')
  const [filterMode, setFilterMode] = useState<'all' | 'a_pagar'>(() =>
    parseFilterMode(searchParams.get('vista')),
  )
  const [periodMode, setPeriodMode] = useState<PeriodMode>(() =>
    parsePeriodMode(searchParams.get('period')),
  )
  const [periodYear, setPeriodYear] = useState(() => {
    const y = Number(searchParams.get('year'))
    return Number.isFinite(y) && y > 2000 ? y : defaultYear
  })
  const [periodMonth, setPeriodMonth] = useState(() => {
    const m = Number(searchParams.get('month'))
    return Number.isFinite(m) && m >= 1 && m <= 12 ? m : defaultMonth
  })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const formCardRef = useRef<HTMLDivElement>(null)
  const skipUrlWrite = useRef(true)
  const skipOffsetReset = useRef(true)

  const isIncomeOnly = type === 'income'
  const isExpenseForm = form.type === 'expense'
  const showMeioColumn = !isIncomeOnly
  const tableColSpan = colSpanFor(showMeioColumn, isIncomeOnly)

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )
  const accountMap = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a.name])), [accounts])

  const pageIds = useMemo(() => items.map((t) => t.id), [items])
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const somePageSelected = pageIds.some((id) => selectedIds.has(id))

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (skipOffsetReset.current) {
      skipOffsetReset.current = false
      return
    }
    setOffset(0)
  }, [debouncedQ, type, filterMode, periodMode, periodYear, periodMonth])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [debouncedQ, type, filterMode, periodMode, periodYear, periodMonth, offset])

  // Persiste filtros na URL
  useEffect(() => {
    if (skipUrlWrite.current) {
      skipUrlWrite.current = false
      return
    }
    const next = new URLSearchParams()
    if (debouncedQ) next.set('q', debouncedQ)
    if (type) next.set('type', type)
    if (filterMode === 'a_pagar') next.set('vista', 'a_pagar')
    if (filterMode === 'all' && periodMode !== 'all') {
      next.set('period', periodMode)
      next.set('year', String(periodYear))
      if (periodMode === 'month') next.set('month', String(periodMonth))
    }
    const page = Math.floor(offset / PAGE_SIZE) + 1
    if (page > 1) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [
    debouncedQ,
    type,
    filterMode,
    periodMode,
    periodYear,
    periodMonth,
    offset,
    setSearchParams,
  ])

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
        const { from, to } = periodBounds('month', periodYear, periodMonth)
        if (from) params.set('from', from)
        if (to) params.set('to', to)
      } else {
        if (type) params.set('type', type)
        if (periodMode !== 'all') {
          const { from, to } = periodBounds(periodMode, periodYear, periodMonth)
          if (from) params.set('from', from)
          if (to) params.set('to', to)
        }
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
  }, [debouncedQ, type, filterMode, offset, periodMode, periodYear, periodMonth])

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
        paid: form.type === 'income' ? true : form.paid,
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

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/api/transactions/${deleteId}`)
      setDeleteId(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(deleteId)
        return next
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setDeleting(false)
    }
  }

  async function confirmBulkDelete() {
    if (selectedIds.size === 0) return
    setDeleting(true)
    try {
      await api.post<{ deleted: number }>('/api/transactions/bulk-delete', {
        ids: Array.from(selectedIds),
      })
      setBulkDeleteOpen(false)
      setSelectedIds(new Set())
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir selecionadas')
    } finally {
      setDeleting(false)
    }
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleSelectAllPage(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of pageIds) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  async function togglePaid(tx: Tx) {
    if (tx.type !== 'expense') return
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
    requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const groupedRows = useMemo(() => {
    const groups: Array<{ key: string; label: string; items: Tx[] }> = []
    let currentKey = ''
    for (const tx of items) {
      const key = monthKey(tx.date)
      if (key !== currentKey) {
        currentKey = key
        groups.push({ key, label: formatMonth(key, 'long'), items: [tx] })
      } else {
        groups[groups.length - 1].items.push(tx)
      }
    }
    return groups
  }, [items])

  const page = Math.floor(offset / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const yearOptions = Array.from({ length: 5 }, (_, i) => defaultYear - 2 + i)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Transações</h1>
        <p className="text-muted-foreground">Crie, edite, filtre e categorize seus lançamentos.</p>
      </header>

      <Card ref={formCardRef}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{editingId ? 'Editar lançamento' : 'Novo lançamento'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Data</Label>
                <DatePicker value={form.date} onChange={(date) => setForm({ ...form, date })} required />
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
              {isExpenseForm && (
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
              {isExpenseForm && (
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
              )}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
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
            {filterMode === 'all' && (
              <>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={periodMode} onValueChange={(v) => setPeriodMode(v as PeriodMode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o histórico</SelectItem>
                      <SelectItem value="month">Mês</SelectItem>
                      <SelectItem value="year">Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {periodMode !== 'all' && (
                  <>
                    <div className="space-y-2">
                      <Label>Ano</Label>
                      <Select value={String(periodYear)} onValueChange={(v) => setPeriodYear(Number(v))}>
                        <SelectTrigger>
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
                    {periodMode === 'month' && (
                      <div className="space-y-2">
                        <Label>Mês</Label>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={periodMonth}
                          onChange={(e) =>
                            setPeriodMonth(Math.min(12, Math.max(1, Number(e.target.value) || 1)))
                          }
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <span>
                {selectedIds.size} selecionada{selectedIds.size === 1 ? '' : 's'}
              </span>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Limpar seleção
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  Excluir selecionadas
                </Button>
              </div>
            </div>
          )}

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
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                          onCheckedChange={(c) => toggleSelectAllPage(c === true)}
                          aria-label="Selecionar página"
                        />
                      </TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Tipo</TableHead>
                      {showMeioColumn && <TableHead>Meio</TableHead>}
                      {!isIncomeOnly && <TableHead>Pago</TableHead>}
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[88px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedRows.map((group) => (
                      <Fragment key={group.key}>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableCell colSpan={tableColSpan}>
                            <span className="text-sm font-semibold">{group.label}</span>
                          </TableCell>
                        </TableRow>
                        {group.items.map((tx) => (
                          <TableRow key={tx.id} data-state={selectedIds.has(tx.id) ? 'selected' : undefined}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(tx.id)}
                                onCheckedChange={(c) => toggleSelect(tx.id, c === true)}
                                aria-label={`Selecionar ${tx.description}`}
                              />
                            </TableCell>
                            <TableCell>{formatDate(tx.date)}</TableCell>
                            <TableCell>{tx.description}</TableCell>
                            <TableCell>{categoryMap[tx.category_id] || '—'}</TableCell>
                            <TableCell>{accountMap[tx.account_id] || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="muted">{labelOf(transactionTypeLabel, tx.type)}</Badge>
                            </TableCell>
                            {showMeioColumn && (
                              <TableCell>
                                {tx.type === 'expense' && tx.payment_method ? (
                                  <Badge variant="outline">
                                    {labelOf(paymentMethodLabel, tx.payment_method)}
                                  </Badge>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                            )}
                            {!isIncomeOnly && (
                              <TableCell>
                                {tx.type === 'expense' ? (
                                  <Button variant="ghost" size="sm" type="button" onClick={() => togglePaid(tx)}>
                                    <Badge variant={tx.paid ? 'success' : 'warning'}>
                                      {tx.paid ? 'Sim' : 'Não'}
                                    </Badge>
                                  </Button>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                            )}
                            <TableCell
                              className={cn(
                                'text-right font-mono tabular-nums',
                                tx.type === 'income' && 'text-primary',
                                tx.type === 'expense' && 'text-destructive',
                              )}
                            >
                              {formatSignedBRL(tx.amount, tx.type)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  type="button"
                                  aria-label="Editar"
                                  onClick={() => startEdit(tx)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  type="button"
                                  aria-label="Excluir"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeleteId(tx.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  {total} lançamento(s) · página {page} de {totalPages}
                  {selectedIds.size > 0 ? ` · ${selectedIds.size} selecionada(s)` : ''}
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

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir lançamento?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        loading={deleting}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Excluir ${selectedIds.size} lançamento(s)?`}
        description="As transações selecionadas serão removidas permanentemente."
        confirmLabel="Excluir selecionadas"
        onConfirm={confirmBulkDelete}
        loading={deleting}
      />
    </div>
  )
}
