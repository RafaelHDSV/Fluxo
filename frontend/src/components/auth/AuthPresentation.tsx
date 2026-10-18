import { AuthProductIllustration } from '@/components/auth/AuthProductIllustration'
import { authPresentation } from '@/config/authPresentation'

/**
 * Desktop product panel: tagline + tabs; product window fits entirely in free box.
 */
export function AuthPresentation() {
  const cfg = authPresentation

  return (
    <aside className="relative hidden h-dvh w-[62%] overflow-hidden border-l border-border bg-(--auth-panel) lg:block">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/3 size-[28rem] rounded-full bg-primary/10 blur-3xl"
      />
      <div aria-hidden className="mineral-noise pointer-events-none absolute inset-0 opacity-25" />

      <div className="relative z-10 flex h-full min-h-0 flex-col pl-8 pt-8 xl:pl-10 xl:pt-10 [@media(max-height:700px)]:pt-6">
        <header className="max-w-2xl shrink-0 pr-8">
          <h2 className="text-balance font-display text-2xl font-semibold leading-[1.15] tracking-tight xl:text-3xl [@media(max-height:700px)]:text-xl">
            {cfg.tagline}
          </h2>
          <p className="mt-2 line-clamp-2 max-w-xl text-sm text-muted-foreground [@media(max-height:820px)]:hidden">
            {cfg.description}
          </p>
        </header>

        <AuthProductIllustration />
      </div>
    </aside>
  )
}
