import { FormEvent, useEffect, useMemo, useState } from 'react'
import { formatBRL, todayISO } from '../lib/format'
import { api } from '../services/api'
import styles from './Page.module.scss'

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
}

const emptyForm = {
  date: todayISO(),
  description: '',
  amount: '',
  type: 'expense',
  category_id: '',
  account_id: '',
}

export function TransactionsPage() {
  const [items, setItems] = useState<Tx[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )
  const accountMap = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a.name])), [accounts])

  async function load() {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (type) params.set('type', type)
    const qs = params.toString()
    const [txs, accs, cats] = await Promise.all([
      api.get<Tx[]>(`/api/transactions${qs ? `?${qs}` : ''}`),
      api.get<Account[]>('/api/accounts'),
      api.get<Category[]>('/api/categories'),
    ])
    setItems(txs)
    setAccounts(accs)
    setCategories(cats)
    if (!form.account_id && accs[0]) setForm((f) => ({ ...f, account_id: accs[0].id }))
    if (!form.category_id && cats[0]) setForm((f) => ({ ...f, category_id: cats[0].id }))
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, amount: Number(form.amount) }
      if (editingId) await api.put(`/api/transactions/${editingId}`, payload)
      else await api.post('/api/transactions', payload)
      setForm({ ...emptyForm, account_id: form.account_id, category_id: form.category_id })
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  async function onDelete(id: string) {
    await api.delete(`/api/transactions/${id}`)
    await load()
  }

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1>Transações</h1>
          <p>Crie, edite, filtre e categorize seus lançamentos.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <form onSubmit={onSubmit} className={styles.formRow}>
          <label>
            Data
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </label>
          <label>
            Descrição
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </label>
          <label>
            Valor
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </label>
          <label>
            Tipo
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="transfer">Transferência</option>
              <option value="adjustment">Ajuste</option>
            </select>
          </label>
          <label>
            Categoria
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Conta
            <select
              value={form.account_id}
              onChange={(e) => setForm({ ...form, account_id: e.target.value })}
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button className="primary" type="submit">
              {editingId ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </form>
        {error && <p className={styles.error}>{error}</p>}
      </section>

      <section className={styles.panel}>
        <div className={styles.formRow}>
          <label>
            Buscar
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Descrição" />
          </label>
          <label>
            Tipo
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Todos</option>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="transfer">Transferência</option>
              <option value="adjustment">Ajuste</option>
            </select>
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button className="ghost" type="button" onClick={() => load()}>
              Filtrar
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className={styles.empty}>Nenhuma transação. Cadastre uma conta e lance o primeiro valor.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Conta</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.date?.toString().slice(0, 10)}</td>
                  <td>{tx.description}</td>
                  <td>{categoryMap[tx.category_id] || '—'}</td>
                  <td>{accountMap[tx.account_id] || '—'}</td>
                  <td>{tx.type}</td>
                  <td className="money">{formatBRL(tx.amount)}</td>
                  <td style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => {
                        setEditingId(tx.id)
                        setForm({
                          date: String(tx.date).slice(0, 10),
                          description: tx.description,
                          amount: String(tx.amount),
                          type: tx.type,
                          category_id: tx.category_id,
                          account_id: tx.account_id,
                        })
                      }}
                    >
                      Editar
                    </button>
                    <button className="danger" type="button" onClick={() => onDelete(tx.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
