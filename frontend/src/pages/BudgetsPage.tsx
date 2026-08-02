import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
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
import { formatBRL, todayISO } from '@/lib/format'
import { currentYearMonth, periodBounds } from '@/lib/period'
import { labelOf, matchTypeLabel } from '@/lib/labels'
import { api } from '@/services/api'

type Category = { id: string; name: string; kind: string; color?: string | null; icon?: string | null }
type Budget = {
  id: string
  category_id: string
  category_name?: string
  amount_limit: string | number
  spent?: string | number
}
type Rule = { id: string; category_id: string; match_type: string; pattern: string }

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

function expenseMap(summary: Summary) {
  const map = new Map<string, number>()
  for (const row of summary.byCategory) {
    if (row.type === 'expense') {
      map.set(row.name, Number(row.total))
    }
  }
  return map
}

export function BudgetsPage() {
  const { year, month } = currentYearMonth()
  const [stats, setStats] = useState<CategoryStat[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [catForm, setCatForm] = useState({ name: '', kind: 'expense' })
  const [ruleForm, setRuleForm] = useState({ category_id: '', match_type: 'contains', pattern: '' })
  const [editingBudget, setEditingBudget] = useState<Record<string, string>>({})
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null)
  const [deletingRule, setDeletingRule] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      let rows: CategoryStat[] | null = null
      try {
        rows = await api.get<CategoryStat[]>('/api/categories/stats')
      } catch {
        rows = null
      }

      const [cats, budgets, rulesRes, monthSummary, yearSummary, allSummary] = await Promise.all([
        api.get<Category[]>('/api/categories'),
        api.get<Budget[]>('/api/budgets'),
        api.get<Rule[]>('/api/categories/rules'),
        api.get<Summary>(
          `/api/reports/summary?from=${periodBounds('month', year, month).from}&to=${periodBounds('month', year, month).to}`,
        ),
        api.get<Summary>(
          `/api/reports/summary?from=${periodBounds('year', year).from}&to=${periodBounds('year', year).to}`,
        ),
        api.get<Summary>(`/api/reports/summary?from=2000-01-01&to=${todayISO()}`),
      ])

      setCategories(cats)
      setRules(rulesRes)
      setRuleForm((r) => ({ ...r, category_id: r.category_id || cats[0]?.id || '' }))

      if (rows?.length) {
        setStats(rows)
      } else {
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
      }
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
    await api.post('/api/categories', { name: catForm.name, kind: catForm.kind })
    setCatForm({ name: '', kind: 'expense' })
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

  async function createRule(e: FormEvent) {
    e.preventDefault()
    await api.post('/api/categories/rules', ruleForm)
    setRuleForm((r) => ({ ...r, pattern: '' }))
    await load()
  }

  async function confirmDeleteRule() {
    if (!deleteRuleId) return
    setDeletingRule(true)
    try {
      await api.delete(`/api/categories/rules/${deleteRuleId}`)
      setDeleteRuleId(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir regra')
    } finally {
      setDeletingRule(false)
    }
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
          <form onSubmit={createCategory} className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label htmlFor="cat-name">Nome</Label>
              <Input
                id="cat-name"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                required
              />
            </div>
            <div className="min-w-[140px] space-y-2">
              <Label>Tipo</Label>
              <Select value={catForm.kind} onValueChange={(v) => setCatForm({ ...catForm, kind: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Adicionar categoria</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Ao criar uma categoria de despesa, o Fluxo pode gerar um orçamento mensal automaticamente.
          </p>
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
                            {row.color && (
                              <span
                                className="inline-block h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: row.color }}
                              />
                            )}
                            {row.icon && <span className="text-sm">{row.icon}</span>}
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
                            onFocus={() => {
                              if (editingBudget[row.id] === undefined) {
                                setEditingBudget((prev) => ({
                                  ...prev,
                                  [row.id]: String(row.amountLimit || ''),
                                }))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            disabled={!editing && Number(limitValue) === row.amountLimit}
                            onClick={() => saveBudget(row.id)}
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Regras de categorização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Se a descrição do lançamento contém um texto, o Fluxo sugere essa categoria na importação.
          </p>
          <form onSubmit={createRule} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={ruleForm.category_id}
                onValueChange={(v) => setRuleForm({ ...ruleForm, category_id: v })}
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
              <Label>Tipo</Label>
              <Select
                value={ruleForm.match_type}
                onValueChange={(v) => setRuleForm({ ...ruleForm, match_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(matchTypeLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rule-pattern">Texto na descrição</Label>
              <Input
                id="rule-pattern"
                value={ruleForm.pattern}
                onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
                placeholder="Uber"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit">Criar regra</Button>
            </div>
          </form>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma regra cadastrada.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {rules.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <span>
                    <Badge variant="muted" className="mr-2">
                      {labelOf(matchTypeLabel, r.match_type)}
                    </Badge>
                    “{r.pattern}” → {categories.find((c) => c.id === r.category_id)?.name || r.category_id}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label="Excluir regra"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteRuleId(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteRuleId != null}
        onOpenChange={(open) => !open && setDeleteRuleId(null)}
        title="Excluir regra?"
        description="A regra deixa de ser usada nas importações."
        confirmLabel="Excluir"
        onConfirm={confirmDeleteRule}
        loading={deletingRule}
      />
    </div>
  )
}
