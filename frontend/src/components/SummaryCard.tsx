import { cn } from '@/lib/utils'

type Props = {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative'
}

export function SummaryCard({ label, value, tone = 'default' }: Props) {
  return (
    <article
      className={cn(
        'rounded-xl border border-border bg-surface p-4 shadow-sm',
        tone === 'positive' && 'border-primary/30',
        tone === 'negative' && 'border-destructive/30',
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 font-mono text-xl font-semibold tabular-nums',
          tone === 'positive' && 'text-primary',
          tone === 'negative' && 'text-destructive',
        )}
      >
        {value}
      </p>
    </article>
  )
}
