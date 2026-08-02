import { useEffect, useState } from 'react'
import { DashboardCharts } from '../components/charts/DashboardCharts'
import { SummaryCard } from '../components/SummaryCard'
import { formatBRL } from '../lib/format'
import { api } from '../services/api'
import styles from './Page.module.scss'

type Dashboard = {
  balance: number
  income: number
  expense: number
  result: number
  savingsRate: number
  byCategory: Array<{ name: string; color?: string; total: string | number }>
  monthly: Array<{ month: string; income: string | number; expense: string | number }>
  balanceSeries: Array<{ date: string; balance: string | number }>
  upcomingCards: Array<{ name: string; due_day: number }>
  alerts: Array<{ level: string; message: string }>
  goals: Array<{ name: string; current_amount: string | number; target_amount: string | number }>
}

export function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<Dashboard>('/api/reports/dashboard')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar dashboard'))
  }, [])

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1>Dashboard</h1>
          <p>Para onde seu dinheiro está indo este mês?</p>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {data && (
        <>
          <div className={styles.grid}>
            <SummaryCard label="Saldo atual" value={formatBRL(data.balance)} />
            <SummaryCard label="Receitas do mês" value={formatBRL(data.income)} tone="positive" />
            <SummaryCard label="Despesas do mês" value={formatBRL(data.expense)} tone="negative" />
            <SummaryCard
              label="Resultado mensal"
              value={formatBRL(data.result)}
              tone={data.result >= 0 ? 'positive' : 'negative'}
            />
            <SummaryCard label="Taxa de economia" value={`${data.savingsRate.toFixed(1)}%`} />
          </div>

          {(data.alerts?.length ?? 0) > 0 && (
            <section className={styles.panel}>
              <h3>Alertas</h3>
              {data.alerts.map((a) => (
                <div
                  key={a.message}
                  className={`${styles.alert} ${a.level === 'danger' ? styles.alertDanger : styles.alertWarning}`}
                >
                  {a.message}
                </div>
              ))}
            </section>
          )}

          <section className={`${styles.panel} ${styles.charts}`}>
            <DashboardCharts
              monthly={data.monthly || []}
              byCategory={data.byCategory || []}
              balanceSeries={data.balanceSeries || []}
            />
          </section>

          <div className={styles.charts}>
            <section className={styles.panel}>
              <h3>Próximas faturas</h3>
              {(data.upcomingCards?.length ?? 0) === 0 ? (
                <p className={styles.empty}>Nenhum cartão com vencimento cadastrado.</p>
              ) : (
                <ul>
                  {data.upcomingCards.map((c) => (
                    <li key={c.name}>
                      {c.name} — dia {c.due_day}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className={styles.panel}>
              <h3>Metas</h3>
              {(data.goals?.length ?? 0) === 0 ? (
                <p className={styles.empty}>Nenhuma meta ainda.</p>
              ) : (
                data.goals.map((g) => {
                  const current = Number(g.current_amount)
                  const target = Number(g.target_amount)
                  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
                  return (
                    <div key={g.name} style={{ marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{g.name}</strong>
                        <span className="money">
                          {formatBRL(current)} / {formatBRL(target)}
                        </span>
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
        </>
      )}
    </div>
  )
}
