import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Auth.module.scss'

export function LoginPage() {
  const { signIn, user, configured, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setPending(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <img src="/logo.svg" alt="Fluxo" width={44} height={44} />
          <div>
            <h1>Fluxo</h1>
            <p>Veja seu dinheiro com clareza.</p>
          </div>
        </div>
        {!configured && (
          <p className={styles.error}>
            Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no frontend/.env
          </p>
        )}
        <form onSubmit={onSubmit}>
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={pending || !configured}>
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className={styles.hint}>
          Não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      </div>
    </div>
  )
}
