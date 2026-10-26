import { SiteFooter } from '@vieira/institucional'
import { AuthPresentation } from '@/components/auth/AuthPresentation'
import { authPresentation } from '@/config/authPresentation'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { Moon, Sun } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

type AuthShellProps = {
  children: ReactNode
}

type ScrollEdge = {
  top: boolean
  bottom: boolean
}

function AuthFormScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState<ScrollEdge>({ top: false, bottom: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const overflow = scrollHeight > clientHeight + 1
    setEdge({
      top: overflow && scrollTop > 6,
      bottom: overflow && scrollTop + clientHeight < scrollHeight - 6,
    })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    const inner = el.firstElementChild
    if (inner) ro.observe(inner)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update, children])

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div
        ref={ref}
        className="auth-form-scroll flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain px-6 sm:px-10 lg:px-10"
      >
        <div className="mx-auto my-auto flex w-full max-w-[23rem] flex-col gap-5 py-6">
          {children}
        </div>
      </div>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent transition-opacity duration-[120ms] ease-out motion-reduce:transition-none',
          edge.top ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent transition-opacity duration-[120ms] ease-out motion-reduce:transition-none',
          edge.bottom ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}

/**
 * Split that fits one viewport: form ~38% / product panel ~62%.
 * Login stays vertically centered (`my-auto`). Signup can grow: the column
 * scrolls from the top (not from a centered clip).
 */
export function AuthShell({ children }: AuthShellProps) {
  const cfg = authPresentation
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-dvh max-h-dvh w-full max-w-[100vw] overflow-hidden bg-background">
      <aside className="relative flex h-full min-h-0 w-full flex-col py-6 lg:w-[38%] lg:py-8">
        <div className="flex w-full shrink-0 items-center justify-between gap-4 px-6 sm:px-10 lg:px-10">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" width={36} height={36} className="rounded-lg" />
            <span className="font-display text-lg font-semibold tracking-tight">{cfg.name}</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Tema escuro — alternar para claro' : 'Tema claro — alternar para escuro'
            }
            className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {theme === 'dark' ? (
              <Moon aria-hidden className="size-5" />
            ) : (
              <Sun aria-hidden className="size-5" />
            )}
          </button>
        </div>

        <AuthFormScroll>{children}</AuthFormScroll>

        <div className="relative z-10 shrink-0 bg-background px-6 pt-3 sm:px-10 lg:px-10">
          <p className="text-center text-xs text-muted-foreground lg:hidden">{cfg.tagline}</p>
          <SiteFooter className="border-0 px-0 py-0 text-xs" />
        </div>
      </aside>

      <AuthPresentation />
    </div>
  )
}
