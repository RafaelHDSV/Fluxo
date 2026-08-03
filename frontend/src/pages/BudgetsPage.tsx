import { FormEvent, useCallback, useEffect, useState } from 'react'
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
import { CategoryIcon, categoryEmojiOptions } from '@/lib/categoryIcons'
import { formatBRL, todayISO } from '@/lib/format'
import { currentYearMonth, periodBounds } from '@/lib/period'
import { api } from '@/services/api'

type Category = { id: string; name: string; kind: string; color?: string | null; icon?: string | null }
type Budget = {
  id: string
  category_id: string
  category_name?: string
  amount_limit: string | number
  spent?: string | number
}

type CategoryStat = {
  id: string
  name: string
  kind: string
  color?: string | null
  icon?: string | null
  spentMonth: number
  spentYear: number
  spentAll: number
  budgetId?: string
  amountLimit: number
}

type Summary = {
  byCategory: Array<{ name: string; type: string; total: string | number }>
}

type ApiStatRow = Record<string, unknown>

function expenseMap(summary: Summary) {
  const map = new Map<string, number>()
  for (const row of summary.byCategory) {
    if (row.type === 'expense') {
      map.set(row.name, Number(row.total))
    }
  }
  return map
}

function mapStats(rows: ApiStatRow[]): CategoryStat[] {
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ''),
    kind: String(r.kind ?? 'expense'),
    color: (r.color as string | null) ?? null,
    icon: (r.icon as string | null) ?? null,
    spentMonth: Number(r.spent_month ?? r.spentMonth ?? 0),
    spentYear: Number(r.spent_year ?? r.spentYear ?? 0),
    spentAll: Number(r.spent_all ?? r.spentAll ?? 0),
    budgetId: (r.budget_id ?? r.budgetId) as string | undefined,
    amountLimit: Number(r.budget_limit ?? r.amountLimit ?? 0),
  }))
}

export function BudgetsPage() {
  const { year, month } = currentYearMonth()
  const [stats, setStats] = useState<CategoryStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [catForm, setCatForm] = useState({ name: '', kind: 'expense', icon: '' })
  const [editingBudget, setEditingBudget] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      let mapped: CategoryStat[] | null = null
      try {
        const rows = await api.get<ApiStatRow[]>('/api/categories/stats')
        if (rows?.length) mapped = mapStats(rows)
      } catch {
        mapped = null
      }

      if (mapped) {
        setStats(mapped)
        return
      }

      const [cats, budgets, monthSummary, yearSummary, allSummary] = await Promise.all([
        api.get<Category[]>('/api/categories'),
        api.get<Budget[]>('/api/budgets'),
        api.get<Summary>(
          `/api/reports/summary?from=${periodBounds('month', year, month).from}&to=${periodBounds('month', year, month).to}`,
        ),
        api.get<Summary>(
          `/api/reports/summary?from=${periodBounds('year', year).from}&to=${periodBounds('year', year).to}`,
        ),
        api.get<Summary>(`/api/reports/summary?from=2000-01-01&to=${todayISO()}`),
      ])

      const monthSpent = expenseMap(monthSummary)
      const yearSpent = expenseMap(yearSummary)
      const allSpent = expenseMap(allSummary)
      const budgetByCat = Object.fromEntries(
        budgets.map((b) => [b.category_id, { id: b.id, limit: Number(b.amount_limit) }]),
      )

      setStats(
        cats.map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
          color: c.color,
          icon: c.icon,
          spentMonth: monthSpent.get(c.name) ?? 0,
          spentYear: yearSpent.get(c.name) ?? 0,
          spentAll: allSpent.get(c.name) ?? 0,
          budgetId: budgetByCat[c.id]?.id,
          amountLimit: budgetByCat[c.id]?.limit ?? 0,
        })),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  async function createCategory(e: FormEvent) {
    e.preventDefault()
    await api.post('/api/categories', {
      name: catForm.name,
      kind: catForm.kind,
      icon: catForm.icon || null,
    })
    setCatForm({ name: '', kind: 'expense', icon: '' })
    await load()
  }

  async function saveBudget(categoryId: string) {
    const raw = editingBudget[categoryId]
    const amount = Number(raw)
    if (!Number.isFinite(amount) || amount < 0) return
    await api.post('/api/budgets', { category_id: categoryId, amount_limit: amount })
    setEditingBudget((prev) => {
      const next = { ...prev }
      delete next[categoryId]
      return next
    })
    await load()
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Orçamentos</h1>
        <p className="text-muted-foreground">
          Categorias, limites mensais e gastos realizados — mês, ano e histórico.
        </p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nova categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createCategory} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nome</Label>
              <Input
                id="cat-name"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={catForm.kind} onValueChange={(v) => setCatForm({ ...catForm, kind: v })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select
                value={catForm.icon || '__auto__'}
                onValueChange={(v) => setCatForm({ ...catForm, icon: v === '__auto__' ? '' : v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Automático" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__auto__">Automático pelo nome</SelectItem>
                  {categoryEmojiOptions().map((emoji) => (
                    <SelectItem key={emoji} value={emoji}>
                      {emoji}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="h-10">
              Adicionar categoria
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Categorias e orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : stats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Gasto mês</TableHead>
                    <TableHead className="text-right">Gasto ano</TableHead>
                    <TableHead className="text-right">Gasto total</TableHead>
                    <TableHead className="text-right">Limite mensal</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((row) => {
                    const editing = editingBudget[row.id] !== undefined
                    const limitValue = editing ? editingBudget[row.id] : String(row.amountLimit || '')
                    const pct =
                      row.amountLimit > 0 ? Math.min(100, (row.spentMonth / row.amountLimit) * 100) : 0
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CategoryIcon name={row.name} icon={row.icon} color={row.color} />
                            <span>{row.name}</span>
                          </div>
                          {row.amountLimit > 0 && (
                            <div className="mt-1 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatBRL(row.spentMonth)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatBRL(row.spentYear)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatBRL(row.spentAll)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="ml-auto w-[120px] font-mono tabular-nums"
                            value={limitValue}
                            onChange={(e) =>
                              setEditingBudget((prev) => ({ ...prev, [row.id]: e.target.value }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!editing}
                            onClick={() => void saveBudget(row.id)}
                          >
                            Salvar
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
