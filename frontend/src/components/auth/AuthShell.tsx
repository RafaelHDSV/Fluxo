import { SiteFooter } from '@vieira/institucional'
import { AuthPresentation } from '@/components/auth/AuthPresentation'
import { authPresentation } from '@/config/authPresentation'
import { useTheme } from '@/hooks/useTheme'
import { Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'

type AuthShellProps = {
  children: ReactNode
}

/**
 * Split that fits one viewport (h-dvh, overflow hidden): form ~38% / product panel ~62%.
 * The form column is flat (no card) and vertically centered; the panel hides below lg.
 */
export function AuthShell({ children }: AuthShellProps) {
  const cfg = authPresentation
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-dvh max-h-dvh w-full max-w-[100vw] overflow-hidden bg-background">
      <aside className="relative flex h-full min-h-0 w-full flex-col px-6 py-6 sm:px-10 lg:w-[38%] lg:px-10 lg:py-8">
        <div className="flex w-full shrink-0 items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" width={36} height={36} className="rounded-lg" />
            <span className="font-display text-lg font-semibold tracking-tight">{cfg.name}</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Tema escuro — alternar para claro' : 'Tema claro — alternar para escuro'}
            className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {theme === 'dark' ? (
              <Moon aria-hidden className="size-5" />
            ) : (
              <Sun aria-hidden className="size-5" />
            )}
          </button>
        </div>

        <div className="mx-auto flex min-h-0 w-full max-w-[23rem] flex-1 flex-col justify-center gap-7 py-6">
          {children}
        </div>

        <p className="shrink-0 text-center text-xs text-muted-foreground lg:hidden">{cfg.tagline}</p>
        <SiteFooter className="shrink-0 border-0 px-0 pb-0 pt-3 text-xs" />
      </aside>

      <AuthPresentation />
    </div>
  )
}
