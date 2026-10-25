import { useEffect, useState, type ReactNode } from 'react'
import { LegalGate, type LegalAcceptance } from '@vieira/institucional'
import { institucionalConfig } from '@/institucional.config'
import { useAuth } from '@/hooks/useAuth'
import { acceptLegal, fetchLegalAcceptance } from '@/lib/account'

type SignupLegal = { version?: string; accepted_at?: string }

function signupAcceptance(metadata: Record<string, unknown> | undefined): SignupLegal | null {
  const legal = metadata?.vieira_legal as { fluxo?: SignupLegal } | undefined
  return legal?.fluxo ?? null
}

export default function LegalGateHost({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const [acceptance, setAcceptance] = useState<LegalAcceptance | null | undefined>(undefined)
  const [legalStatus, setLegalStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!user) {
      setAcceptance(undefined)
      setLegalStatus('loading')
      return
    }
    let cancel = false
    const fromSignup = signupAcceptance(user.user_metadata as Record<string, unknown> | undefined)
    setLegalStatus('loading')

    fetchLegalAcceptance()
      .then(async (current) => {
        if (current === null && fromSignup?.version === institucionalConfig.legalVersion) {
          return acceptLegal(fromSignup.version, { acceptedAt: fromSignup.accepted_at })
        }
        return current
      })
      .then((next) => {
        if (cancel) return
        setAcceptance(next)
        setLegalStatus('ready')
      })
      .catch((error: unknown) => {
        console.error('[legal] falha ao carregar aceite', error)
        if (cancel) return
        setAcceptance(undefined)
        setLegalStatus('error')
      })

    return () => {
      cancel = true
    }
  }, [user])

  if (legalStatus === 'loading') {
    return <div className="min-h-dvh bg-background" />
  }

  if (legalStatus === 'error') {
    return children
  }

  return (
    <LegalGate
      acceptance={acceptance}
      onAccept={async () => {
        setAcceptance(await acceptLegal(institucionalConfig.legalVersion))
      }}
      onSignOut={() => {
        void signOut()
      }}
    >
      {children}
    </LegalGate>
  )
}
