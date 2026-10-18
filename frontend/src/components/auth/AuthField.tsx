import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { useState, type ComponentProps, type ReactNode } from 'react'

type AuthFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  id: string
  label: string
  icon: LucideIcon
  /** Rendered on the label row, right-aligned (e.g. "Esqueci a senha"). */
  labelAside?: ReactNode
  /** Adds a show/hide button (password fields only). */
  reveal?: boolean
}

/**
 * Auth form field: label row + leading icon + optional reveal toggle.
 * Native input props pass through untouched (autofill attributes live in the pages).
 */
export function AuthField({
  id,
  label,
  icon: Icon,
  labelAside,
  reveal,
  type,
  className,
  ...props
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false)
  const inputType = reveal && visible ? 'text' : type

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {labelAside}
      </div>
      <div className="relative">
        <Icon
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          type={inputType}
          className={cn('h-12 bg-surface pl-10 text-base', reveal && 'pr-11', className)}
          {...props}
        />
        {reveal ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {visible ? (
              <EyeOff aria-hidden className="size-4" />
            ) : (
              <Eye aria-hidden className="size-4" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}
