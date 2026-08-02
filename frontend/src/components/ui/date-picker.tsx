import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

type Props = {
  id?: string
  value: string
  onChange: (isoDate: string) => void
  required?: boolean
  className?: string
  disabled?: boolean
}

/** Display DD/MM/YYYY; value stored as YYYY-MM-DD for inputs/API. */
export function DatePicker({ id, value, onChange, required, className, disabled }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="w-full justify-start font-normal"
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
        {value ? formatDate(value) : 'Selecionar data'}
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-border bg-surface p-2 shadow-lg">
          <Input
            id={id}
            type="date"
            value={value}
            required={required}
            onChange={(e) => {
              onChange(e.target.value)
              setOpen(false)
            }}
            className="min-w-[12rem]"
          />
        </div>
      )}
      {/* keep required for forms when closed */}
      <input type="hidden" value={value} required={required} readOnly />
    </div>
  )
}
