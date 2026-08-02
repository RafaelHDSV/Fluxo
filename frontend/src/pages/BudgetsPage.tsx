import { FormEvent, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/format'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

type Category = { id: string; name: string }
type Budget = {
  id: string
  category_id: string
  category_name: string
  amount_limit: string | number
  spent: string | number
}

export function BudgetsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [form, setForm] = useState({ category_id: '', amount_limit: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [cats, buds] = await Promise.all([
        api.get<Category[]>('/api/categories'),
        api.get<Budget[]>('/api/budgets'),
      ])
      setCategories(cats)
      setBudgets(buds)
      setForm((f) => ({ ...f, category_id: f.category_id || cats[0]?.id || '' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await api.post('/api/budgets', {
      category_id: form.category_id,
      amount_limit: Number(form.amount_limit),
    })
    setForm((f) => ({ ...f, amount_limit: '' }))
    await load()
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Orçamentos</h1>
        <p className="text-muted-foreground">Limites mensais por categoria com alertas em 80% e 100%.</p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Novo orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
            <div className="min-w-[180px] space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
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
            <div className="min-w-[140px] space-y-2">
              <Label htmlFor="bud-limit">Limite (R$)</Label>
              <Input
                id="bud-limit"
                type="number"
                min="0"
                step="0.01"
                value={form.amount_limit}
                onChange={(e) => setForm({ ...form, amount_limit: e.target.value })}
                required
              />
            </div>
            <Button type="submit">Salvar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Orçamentos do mês</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum orçamento neste mês.</p>
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => {
                const spent = Number(b.spent)
                const limit = Number(b.amount_limit)
                const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
                return (
                  <div key={b.id}>
                    <div className="mb-1 flex justify-between gap-2 text-sm">
                      <strong>{b.category_name}</strong>
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {formatBRL(spent)} / {formatBRL(limit)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={cn(
                        'h-2',
                        pct >= 100 && '[&>div]:bg-destructive',
                        pct >= 80 && pct < 100 && '[&>div]:bg-warning',
                      )}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
