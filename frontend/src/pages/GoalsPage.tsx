import { FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL, formatDate } from '@/lib/format'
import { api } from '@/services/api'

type Goal = {
  id: string
  name: string
  target_amount: string | number
  current_amount: string | number
  deadline?: string | null
}

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    deadline: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setGoals(await api.get<Goal[]>('/api/goals'))
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
    await api.post('/api/goals', {
      name: form.name,
      target_amount: Number(form.target_amount),
      current_amount: Number(form.current_amount),
      deadline: form.deadline || null,
    })
    setForm({ name: '', target_amount: '', current_amount: '0', deadline: '' })
    await load()
  }

  async function onDelete(id: string) {
    await api.delete(`/api/goals/${id}`)
    await load()
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Metas</h1>
        <p className="text-muted-foreground">Reserva, viagem, dívida — acompanhe o progresso.</p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nova meta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="goal-name">Nome</Label>
              <Input
                id="goal-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-target">Valor alvo</Label>
              <Input
                id="goal-target"
                type="number"
                min="0"
                step="0.01"
                value={form.target_amount}
                onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-current">Valor atual</Label>
              <Input
                id="goal-current"
                type="number"
                min="0"
                step="0.01"
                value={form.current_amount}
                onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-deadline">Prazo</Label>
              <Input
                id="goal-deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit">Criar meta</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Suas metas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>
          ) : (
            <div className="space-y-4">
              {goals.map((g) => {
                const current = Number(g.current_amount)
                const target = Number(g.target_amount)
                const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
                return (
                  <div key={g.id} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <strong>{g.name}</strong>
                        {g.deadline && (
                          <p className="text-xs text-muted-foreground">até {formatDate(g.deadline)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm tabular-nums">
                          {formatBRL(current)} / {formatBRL(target)}
                        </span>
                        <Button variant="destructive" size="sm" type="button" onClick={() => onDelete(g.id)}>
                          Excluir
                        </Button>
                      </div>
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
  )
}
