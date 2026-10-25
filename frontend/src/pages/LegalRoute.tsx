import { LegalPage } from '@vieira/institucional'
import { useAuth } from '@/hooks/useAuth'

export default function LegalRoute({ kind }: { kind: 'privacy' | 'terms' }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-dvh bg-background" />
  }

  return <LegalPage kind={kind} embedded={Boolean(user)} />
}
