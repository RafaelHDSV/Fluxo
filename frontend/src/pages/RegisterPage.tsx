import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail, User } from 'lucide-react'
import { TermsAcceptance } from '@vieira/institucional'
import { AuthField } from '@/components/auth/AuthField'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { institucionalConfig } from '@/institucional.config'

export function RegisterPage() {
  const { signUp, user, configured, loading } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [pending, setPending] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError] = useState<string | null>(null)

  if (!loading && user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setOk('')
    setTermsError(null)
    if (!termsAccepted) {
      setTermsError('Marque o aceite para criar a conta.')
      return
    }
    setPending(true)
    try {
      await signUp(email, password, displayName, institucionalConfig.legalVersion)
      setOk('Conta criada. Se o e-mail precisar confirmação, verifique sua caixa de entrada.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <header className="shrink-0 space-y-2">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[2rem]">
          Criar conta
        </h1>
        <p className="text-sm text-muted-foreground">
          Comece a organizar seu fluxo com e-mail e senha.
        </p>
      </header>

      {!configured && (
        <p className="shrink-0 text-sm text-destructive">
          Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no frontend/.env
        </p>
      )}

      <form className="shrink-0 space-y-4" onSubmit={onSubmit} autoComplete="on">
        <AuthField
          id="reg-name"
          label="Nome"
          icon={User}
          name="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onInput={(e) => setDisplayName(e.currentTarget.value)}
          autoComplete="name"
          placeholder="Como quer ser chamado"
        />
        <AuthField
          id="reg-email"
          label="E-mail"
          icon={Mail}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onInput={(e) => setEmail(e.currentTarget.value)}
          required
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="voce@exemplo.com"
        />
        <AuthField
          id="reg-password"
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
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Mínimo 6 caracteres"
        />
        <TermsAcceptance
          checked={termsAccepted}
          onChange={setTermsAccepted}
          error={termsError}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {ok ? <p className="text-sm text-primary">{ok}</p> : null}
        <Button type="submit" className="w-full" disabled={pending || !configured}>
          {pending ? 'Criando…' : 'Cadastrar'}
          {pending ? null : <ArrowRight aria-hidden className="size-4" />}
        </Button>
      </form>

      <p className="shrink-0 text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </>
  )
}
