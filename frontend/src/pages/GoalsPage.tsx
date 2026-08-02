import { FormEvent, useEffect, useState } from 'react'
import { formatBRL } from '../lib/format'
import { api } from '../services/api'
import styles from './Page.module.scss'

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
  const [error, setError] = useState('')

  async function load() {
    setGoals(await api.get<Goal[]>('/api/goals'))
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
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
    <div>
      <header className={styles.header}>
        <div>
          <h1>Metas</h1>
          <p>Reserva, viagem, dívida — acompanhe o progresso.</p>
        </div>
      </header>
      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.panel}>
        <form onSubmit={onSubmit} className={styles.formRow}>
          <label>
            Nome
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Valor alvo
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.target_amount}
              onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
              required
            />
          </label>
          <label>
            Valor atual
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.current_amount}
              onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
            />
          </label>
          <label>
            Prazo
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button className="primary" type="submit">
              Criar meta
            </button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        {goals.length === 0 ? (
          <p className={styles.empty}>Nenhuma meta cadastrada.</p>
        ) : (
          goals.map((g) => {
            const current = Number(g.current_amount)
            const target = Number(g.target_amount)
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
            return (
              <div key={g.id} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <strong>{g.name}</strong>
                    {g.deadline && (
                      <div style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
                        até {String(g.deadline).slice(0, 10)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="money">
                      {formatBRL(current)} / {formatBRL(target)}
                    </span>
                    <button className="danger" type="button" onClick={() => onDelete(g.id)}>
                      Excluir
                    </button>
                  </div>
                </div>
                <div className={styles.progress}>
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
