import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  value: string
  hint?: string
  /** Conteúdo no canto superior direito (ex.: link). */
  action?: ReactNode
  tone?: 'default' | 'positive' | 'negative'
  className?: string
}

export function SummaryCard({ label, value, hint, action, tone = 'default', className }: Props) {
  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-xl border border-border bg-surface p-4 shadow-sm',
        tone === 'positive' && 'border-primary/30',
        tone === 'negative' && 'border-destructive/30',
        className,
      )}
    >
      {action ? <div className="absolute right-3 top-3 z-10">{action}</div> : null}
      <p className={cn('text-sm text-muted-foreground', action && 'pr-20')}>{label}</p>
      <p
        className={cn(
          'mt-1 font-mono text-xl font-semibold tabular-nums',
          tone === 'positive' && 'text-primary',
          tone === 'negative' && 'text-destructive',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </article>
  )
}
