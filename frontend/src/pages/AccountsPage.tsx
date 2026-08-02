import { FormEvent, useEffect, useState } from 'react'
import { formatBRL } from '../lib/format'
import { api } from '../services/api'
import styles from './Page.module.scss'

type Account = {
  id: string
  name: string
  type: string
  balance: string | number
  due_day?: number | null
  credit_limit?: string | number | null
}

type Category = { id: string; name: string; kind: string }
type Rule = { id: string; category_id: string; match_type: string; pattern: string }

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [form, setForm] = useState({
    name: '',
    type: 'checking',
    balance: '0',
    due_day: '',
    credit_limit: '',
  })
  const [catName, setCatName] = useState('')
  const [rule, setRule] = useState({ category_id: '', match_type: 'contains', pattern: '' })
  const [error, setError] = useState('')

  async function load() {
    const [accs, cats, rls] = await Promise.all([
      api.get<Account[]>('/api/accounts'),
      api.get<Category[]>('/api/categories'),
      api.get<Rule[]>('/api/categories/rules'),
    ])
    setAccounts(accs)
    setCategories(cats)
    setRules(rls)
    if (!rule.category_id && cats[0]) setRule((r) => ({ ...r, category_id: cats[0].id }))
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
  }, [])

  async function createAccount(e: FormEvent) {
    e.preventDefault()
    await api.post('/api/accounts', {
      ...form,
      balance: Number(form.balance),
      due_day: form.due_day ? Number(form.due_day) : null,
      credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
    })
    setForm({ name: '', type: 'checking', balance: '0', due_day: '', credit_limit: '' })
    await load()
  }

  async function createCategory(e: FormEvent) {
    e.preventDefault()
    await api.post('/api/categories', { name: catName, kind: 'expense' })
    setCatName('')
    await load()
  }

  async function createRule(e: FormEvent) {
    e.preventDefault()
    await api.post('/api/categories/rules', rule)
    setRule((r) => ({ ...r, pattern: '' }))
    await load()
  }

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1>Contas e categorias</h1>
          <p>Origens do dinheiro, cartões e regras de categorização.</p>
        </div>
      </header>
      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.panel}>
        <h3>Nova conta / cartão</h3>
        <form onSubmit={createAccount} className={styles.formRow}>
          <label>
            Nome
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Tipo
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="checking">Conta corrente</option>
              <option value="wallet">Carteira</option>
              <option value="investment">Investimento</option>
              <option value="credit_card">Cartão de crédito</option>
              <option value="external">Externa</option>
            </select>
          </label>
          <label>
            Saldo
            <input
              type="number"
              step="0.01"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
            />
          </label>
          <label>
            Vencimento (cartão)
            <input
              type="number"
              min={1}
              max={31}
              value={form.due_day}
              onChange={(e) => setForm({ ...form, due_day: e.target.value })}
            />
          </label>
          <label>
            Limite
            <input
              type="number"
              step="0.01"
              value={form.credit_limit}
              onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
            />
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button className="primary" type="submit">
              Salvar conta
            </button>
          </div>
        </form>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Saldo</th>
              <th>Venc.</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.type}</td>
                <td className="money">{formatBRL(a.balance)}</td>
                <td>{a.due_day ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.panel}>
        <h3>Categorias</h3>
        <form onSubmit={createCategory} className={styles.formRow}>
          <label>
            Nome
            <input value={catName} onChange={(e) => setCatName(e.target.value)} required />
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button className="primary" type="submit">
              Adicionar
            </button>
          </div>
        </form>
        <p>{categories.map((c) => c.name).join(' · ')}</p>
      </section>

      <section className={styles.panel}>
        <h3>Regras de categorização</h3>
        <form onSubmit={createRule} className={styles.formRow}>
          <label>
            Categoria
            <select
              value={rule.category_id}
              onChange={(e) => setRule({ ...rule, category_id: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select
              value={rule.match_type}
              onChange={(e) => setRule({ ...rule, match_type: e.target.value })}
            >
              <option value="contains">Contém texto</option>
              <option value="recurring">Recorrente</option>
              <option value="source">Origem</option>
            </select>
          </label>
          <label>
            Padrão
            <input
              value={rule.pattern}
              onChange={(e) => setRule({ ...rule, pattern: e.target.value })}
              placeholder="Uber"
              required
            />
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button className="primary" type="submit">
              Criar regra
            </button>
          </div>
        </form>
        <ul>
          {rules.map((r) => (
            <li key={r.id}>
              [{r.match_type}] “{r.pattern}” →{' '}
              {categories.find((c) => c.id === r.category_id)?.name || r.category_id}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
