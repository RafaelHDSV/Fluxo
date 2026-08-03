import {
  LayoutDashboard,
  ArrowLeftRight,
  CircleDollarSign,
  Upload,
  Wallet,
  PieChart,
  TrendingUp,
  Heart,
  BarChart3,
  Moon,
  Sun,
  MoreHorizontal,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { to: '/a-pagar', label: 'A pagar', icon: CircleDollarSign },
  { to: '/imports', label: 'Importações', icon: Upload },
  { to: '/accounts', label: 'Contas', icon: Wallet },
  { to: '/budgets', label: 'Orçamentos', icon: PieChart },
  { to: '/investments', label: 'Investimentos', icon: TrendingUp },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
]

const mobilePrimary = ['/', '/transactions', '/a-pagar', '/accounts', '/more'] as const

export function Layout() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [unpaidCount, setUnpaidCount] = useState(0)

  useEffect(() => {
    api
      .get<{ unpaidCount?: number }>('/api/reports/dashboard')
      .then((d) => setUnpaidCount(d.unpaidCount ?? 0))
      .catch(() => setUnpaidCount(0))
  }, [])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-surface p-5 lg:flex">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Fluxo" width={40} height={40} className="rounded-xl" />
          <div>
            <strong className="font-display text-lg">Fluxo</strong>
            <p className="text-xs text-muted-foreground">Veja seu dinheiro com clareza.</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                    isActive && 'bg-muted text-foreground',
                  )
                }
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  {link.label}
                </span>
                {link.to === '/a-pagar' && unpaidCount > 0 && (
                  <Badge variant="warning">{unpaidCount}</Badge>
                )}
              </NavLink>
            )
          })}
        </nav>
        <div className="space-y-3 border-t border-border pt-4">
          <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Tema {theme === 'dark' ? 'claro' : 'escuro'}
          </Button>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <Button type="button" variant="secondary" className="w-full" onClick={() => setLogoutOpen(true)}>
            Sair
          </Button>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 flex-1 overflow-y-auto px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 lg:px-8 lg:pb-8 lg:pt-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {mobilePrimary.map((to) => {
          if (to === '/more') {
            return (
              <button
                key="more"
                type="button"
                className="flex flex-col items-center gap-1 px-1 py-2 text-[11px] text-muted-foreground"
                onClick={() => setMoreOpen((v) => !v)}
              >
                <MoreHorizontal className="h-4 w-4" />
                Mais
              </button>
            )
          }
          const link = links.find((l) => l.to === to)!
          const Icon = link.icon
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-1 px-1 py-2 text-[11px] text-muted-foreground',
                  isActive && 'text-primary',
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{link.label.split(' ')[0]}</span>
              {to === '/a-pagar' && unpaidCount > 0 && (
                <span className="absolute right-2 top-1 rounded-full bg-warning px-1.5 text-[10px] font-bold text-primary-foreground">
                  {unpaidCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[min(85dvh,100%)] flex-col rounded-t-2xl border border-border bg-surface pb-[env(safe-area-inset-bottom)]">
            <p className="shrink-0 px-4 pb-2 pt-4 font-display text-lg">Navegação</p>
            <div className="min-h-0 flex-1 grid gap-2 overflow-y-auto px-4 pb-8">
              {links.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-lg bg-muted px-3 py-3 text-sm font-medium"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                    {link.to === '/a-pagar' && unpaidCount > 0 ? ` (${unpaidCount})` : ''}
                  </NavLink>
                )
              })}
              <Button type="button" variant="outline" onClick={toggleTheme}>
                Alternar tema ({theme})
              </Button>
              <Button type="button" variant="secondary" onClick={() => setLogoutOpen(true)}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Sair da plataforma?"
        description="Você precisará entrar novamente para ver seus dados financeiros."
        confirmLabel="Sair"
        onConfirm={() => signOut()}
      />
    </div>
  )
}
