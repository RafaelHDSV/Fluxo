import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DatePicker } from '@/components/ui/date-picker'
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

export function InvestmentsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    deadline: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const totalCurrent = useMemo(
    () => goals.reduce((sum, g) => sum + Number(g.current_amount || 0), 0),
    [goals],
  )

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
      target_amount: form.target_amount === '' ? 0 : Number(form.target_amount),
      current_amount: Number(form.current_amount || 0),
      deadline: form.deadline || null,
    })
    setForm({ name: '', target_amount: '', current_amount: '0', deadline: '' })
    await load()
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/api/goals/${deleteId}`)
      setDeleteId(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Investimentos</h1>
        <p className="text-muted-foreground">
          Caixinhas para reservas — emergência, viagem, reforma e outros objetivos.
        </p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nova caixinha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="inv-name">Nome</Label>
              <Input
                id="inv-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Reserva de emergência"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-target">Valor alvo (opcional)</Label>
              <Input
                id="inv-target"
                type="number"
                min="0"
                step="0.01"
                value={form.target_amount}
                onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-current">Valor atual</Label>
              <Input
                id="inv-current"
                type="number"
                min="0"
                step="0.01"
                value={form.current_amount}
                onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo (opcional)</Label>
              <DatePicker value={form.deadline} onChange={(deadline) => setForm({ ...form, deadline })} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="h-10">
                Criar caixinha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Suas caixinhas</CardTitle>
            {!loading && goals.length > 0 && (
              <p className="font-mono text-sm tabular-nums text-muted-foreground">
                Total: <span className="font-medium text-foreground">{formatBRL(totalCurrent)}</span>
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma caixinha cadastrada. Crie uma reserva de emergência ou meta de viagem.
            </p>
          ) : (
            <div className="space-y-4">
              {goals.map((g) => {
                const current = Number(g.current_amount)
                const target = Number(g.target_amount)
                const hasTarget = target > 0
                const pct = hasTarget ? Math.min(100, (current / target) * 100) : 0
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
                          {hasTarget ? (
                            <>
                              {formatBRL(current)} / {formatBRL(target)}
                            </>
                          ) : (
                            formatBRL(current)
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          aria-label="Excluir"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(g.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {hasTarget && (
                      <>
                        <Progress value={pct} className="h-2" />
                        <p className="mt-1 text-xs text-muted-foreground">{pct.toFixed(0)}% do objetivo</p>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir caixinha?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  )
}
