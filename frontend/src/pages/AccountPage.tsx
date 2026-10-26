import { useNavigate } from 'react-router-dom'
import { AccountDataSection, LegalLinks } from '@vieira/institucional'
import { useAuth } from '@/hooks/useAuth'
import { deleteMyAccount, exportMyData } from '@/lib/account'

export function AccountPage() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  async function handleDelete(password: string) {
    const message = await deleteMyAccount(password)
    await signOut().catch(() => {
      /* a sessão pode já ter caído junto com a conta */
    })
    navigate('/login', { replace: true, state: { notice: message } })
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold">Conta</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </header>
      <AccountDataSection onExport={exportMyData} onDelete={handleDelete} />
      <section className="space-y-3" aria-labelledby="help-title">
        <h2 id="help-title" className="text-lg font-semibold">
          Ajuda e contato
        </h2>
        <LegalLinks />
      </section>
    </div>
  )
}
