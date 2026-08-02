import { FormEvent, useEffect, useState } from 'react'
import { formatBRL } from '../lib/format'
import { api } from '../services/api'
import styles from './Page.module.scss'

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
  const [error, setError] = useState('')

  async function load() {
    const [cats, buds] = await Promise.all([
      api.get<Category[]>('/api/categories'),
      api.get<Budget[]>('/api/budgets'),
    ])
    setCategories(cats)
    setBudgets(buds)
    if (!form.category_id && cats[0]) setForm((f) => ({ ...f, category_id: cats[0].id }))
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
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
    <div>
      <header className={styles.header}>
        <div>
          <h1>Orçamentos</h1>
          <p>Limites mensais por categoria com alertas em 80% e 100%.</p>
        </div>
      </header>
      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.panel}>
        <form onSubmit={onSubmit} className={styles.formRow}>
          <label>
            Categoria
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Limite (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount_limit}
              onChange={(e) => setForm({ ...form, amount_limit: e.target.value })}
              required
            />
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button className="primary" type="submit">
              Salvar
            </button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        {budgets.length === 0 ? (
          <p className={styles.empty}>Nenhum orçamento neste mês.</p>
        ) : (
          budgets.map((b) => {
            const spent = Number(b.spent)
            const limit = Number(b.amount_limit)
            const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
            return (
              <div key={b.id} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{b.category_name}</strong>
                  <span className="money">
                    {formatBRL(spent)} / {formatBRL(limit)} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className={styles.progress}>
                  <span
                    style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? 'var(--destructive)' : pct >= 80 ? 'var(--warning)' : undefined,
                    }}
                  />
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
