import { FormEvent, useEffect, useState } from 'react'
import { formatBRL } from '../lib/format'
import { api } from '../services/api'
import styles from './Page.module.scss'

type Account = { id: string; name: string }
type ImportRow = {
  id: string
  date: string
  description: string
  amount: string | number
  type: string
  is_duplicate: boolean
  selected: boolean
}

export function ImportsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountId, setAccountId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [importId, setImportId] = useState<string | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<Account[]>('/api/accounts')
      .then((accs) => {
        setAccounts(accs)
        if (accs[0]) setAccountId(accs[0].id)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
  }, [])

  async function onPreview(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setError('')
    setMessage('')
    const form = new FormData()
    form.append('file', file)
    form.append('account_id', accountId)
    const result = await api.upload<{ import: { id: string }; rows: ImportRow[] }>(
      '/api/imports/preview',
      form,
    )
    setImportId(result.import.id)
    setRows(result.rows)
    setMessage(`${result.rows.length} linhas lidas. Revise e confirme.`)
  }

  async function onCommit() {
    if (!importId) return
    const result = await api.post<{ created: number; skipped: number }>(
      `/api/imports/${importId}/commit`,
      {},
    )
    setMessage(`Importação concluída: ${result.created} criadas, ${result.skipped} ignoradas.`)
  }

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1>Importações</h1>
          <p>CSV e OFX com preview, mapeamento automático e dedupe.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <form onSubmit={onPreview} className={styles.formRow}>
          <label>
            Conta destino
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Arquivo
            <input
              type="file"
              accept=".csv,.ofx,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button className="primary" type="submit">
              Pré-visualizar
            </button>
          </div>
        </form>
        {error && <p className={styles.error}>{error}</p>}
        {message && <p>{message}</p>}
      </section>

      {rows.length > 0 && (
        <section className={styles.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3>Preview</h3>
            <button className="primary" type="button" onClick={onCommit}>
              Confirmar importação
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{String(r.date).slice(0, 10)}</td>
                  <td>{r.description}</td>
                  <td>{r.type}</td>
                  <td className="money">{formatBRL(r.amount)}</td>
                  <td>{r.is_duplicate ? 'Duplicada' : 'Nova'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
