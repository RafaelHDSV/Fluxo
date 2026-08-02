import { FormEvent, useEffect, useState } from 'react'
import { formatBRL, todayISO } from '../lib/format'
import { api } from '../services/api'
import styles from './Page.module.scss'

type Account = { id: string; name: string }
type Category = { id: string; name: string }
type Summary = {
  period: { from: string; to: string }
  totals: { income: string | number; expense: string | number; count: number }
  byCategory: Array<{ name: string; type: string; total: string | number }>
  byAccount: Array<{ name: string; type: string; total: string | number }>
}

export function ReportsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState({
    from: `${todayISO().slice(0, 8)}01`,
    to: todayISO(),
    account_id: '',
    category_id: '',
    tag: '',
  })
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get<Account[]>('/api/accounts'), api.get<Category[]>('/api/categories')])
      .then(([a, c]) => {
        setAccounts(a)
        setCategories(c)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    params.set('from', filters.from)
    params.set('to', filters.to)
    if (filters.account_id) params.set('account_id', filters.account_id)
    if (filters.category_id) params.set('category_id', filters.category_id)
    if (filters.tag) params.set('tag', filters.tag)
    try {
      setSummary(await api.get<Summary>(`/api/reports/summary?${params}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    }
  }

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1>Relatórios</h1>
          <p>Análise por período, conta, categoria e tag.</p>
        </div>
      </header>
      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.panel}>
        <form onSubmit={onSubmit} className={styles.formRow}>
          <label>
            De
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </label>
          <label>
            Até
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </label>
          <label>
            Conta
            <select
              value={filters.account_id}
              onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
            >
              <option value="">Todas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categoria
            <select
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tag
            <input
              value={filters.tag}
              onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
              placeholder="opcional"
            />
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button className="primary" type="submit">
              Gerar
            </button>
          </div>
        </form>
      </section>

      {summary && (
        <>
          <div className={styles.grid}>
            <article className={styles.panel}>
              <p>Receitas</p>
              <p className="money">{formatBRL(summary.totals.income)}</p>
            </article>
            <article className={styles.panel}>
              <p>Despesas</p>
              <p className="money">{formatBRL(summary.totals.expense)}</p>
            </article>
            <article className={styles.panel}>
              <p>Lançamentos</p>
              <p className="money">{summary.totals.count}</p>
            </article>
          </div>

          <section className={styles.panel}>
            <h3>Por categoria</h3>
            <table>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.byCategory.map((row) => (
                  <tr key={`${row.name}-${row.type}`}>
                    <td>{row.name}</td>
                    <td>{row.type}</td>
                    <td className="money">{formatBRL(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={styles.panel}>
            <h3>Por conta</h3>
            <table>
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>Tipo</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.byAccount.map((row) => (
                  <tr key={`${row.name}-${row.type}`}>
                    <td>{row.name}</td>
                    <td>{row.type}</td>
                    <td className="money">{formatBRL(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}
