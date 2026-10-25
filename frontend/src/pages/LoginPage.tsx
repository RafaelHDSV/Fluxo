import { FormEvent, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { AuthField } from '@/components/auth/AuthField'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const { signIn, user, configured, loading } = useAuth()
  const notice = (useLocation().state as { notice?: string } | null)?.notice
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
    <>
      <header className="shrink-0 space-y-2">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[2rem]">
          Entrar no Fluxo
        </h1>
        <p className="text-sm text-muted-foreground">
          Use seu e-mail e senha para ver contas, orçamentos e o mês.
        </p>
      </header>

      {notice ? <p className="shrink-0 text-sm text-primary">{notice}</p> : null}
      {!configured && (
        <p className="shrink-0 text-sm text-destructive">
          Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no frontend/.env
        </p>
      )}

      <form className="shrink-0 space-y-4" onSubmit={onSubmit} autoComplete="on">
        <AuthField
          id="login-email"
          label="E-mail"
          icon={Mail}
          name="username"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onInput={(e) => setEmail(e.currentTarget.value)}
          required
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="voce@exemplo.com"
        />
        <AuthField
          id="login-password"
          label="Senha"
          icon={Lock}
          reveal
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onInput={(e) => setPassword(e.currentTarget.value)}
          required
          minLength={6}
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Sua senha"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending || !configured}>
          {pending ? 'Entrando…' : 'Entrar'}
          {pending ? null : <ArrowRight aria-hidden className="size-4" />}
        </Button>
      </form>

      <p className="shrink-0 text-center text-sm text-muted-foreground">
        Não tem conta?{' '}
        <Link
          to="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </>
  )
}
