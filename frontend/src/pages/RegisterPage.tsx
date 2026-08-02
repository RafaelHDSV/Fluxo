import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Auth.module.scss'

export function RegisterPage() {
  const { signUp, user, configured, loading } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [pending, setPending] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setOk('')
    setPending(true)
    try {
      await signUp(email, password, displayName)
      setOk('Conta criada. Se o e-mail precisar confirmação, verifique sua caixa de entrada.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro')
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
            <h1>Criar conta</h1>
            <p>Comece a organizar seu fluxo.</p>
          </div>
        </div>
        <form onSubmit={onSubmit}>
          <label>
            Nome
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
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
          {ok && <p className={styles.hint}>{ok}</p>}
          <button type="submit" disabled={pending || !configured}>
            {pending ? 'Criando…' : 'Cadastrar'}
          </button>
        </form>
        <p className={styles.hint}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
