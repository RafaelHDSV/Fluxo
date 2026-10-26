import { LegalPage } from '@vieira/institucional'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'

export default function LegalRoute({ kind }: { kind: 'privacy' | 'terms' }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-dvh bg-background" />
  }

  const page = <LegalPage kind={kind} embedded={Boolean(user)} />
  if (user) return <Layout>{page}</Layout>
  return page
}
