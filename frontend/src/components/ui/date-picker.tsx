import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function parseISO(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthLabel(year: number, monthIndex: number) {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthIndex, 1),
  )
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function buildGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1)
  // Monday-first: getDay() Sun=0 → convert to Mon=0
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: Array<{ day: number; iso: string; inMonth: boolean } | null> = []

  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day)
    cells.push({ day, iso: toISO(date), inMonth: true })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** Calendário custom pt-BR — valor ISO (YYYY-MM-DD), exibição DD/MM/YYYY. */
export function DatePicker({ id, value, onChange, required, className, disabled }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = parseISO(value)
  const today = useMemo(() => toISO(new Date()), [])
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => selected?.getFullYear() ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? new Date().getMonth())

  useEffect(() => {
    if (!open) return
    if (selected) {
      setViewYear(selected.getFullYear())
      setViewMonth(selected.getMonth())
    }
  }, [open, value])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const cells = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth])

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-full justify-start font-normal"
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
        {value ? formatDate(value) : 'Selecionar data'}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Calendário"
          className="absolute left-0 top-full z-50 mt-1 w-[280px] rounded-xl border border-border bg-surface p-3 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold">{monthLabel(viewYear, viewMonth)}</p>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, idx) => {
              if (!cell) return <span key={`e-${idx}`} className="h-9" />
              const isSelected = cell.iso === value
              const isToday = cell.iso === today
              return (
                <button
                  key={cell.iso}
                  type="button"
                  className={cn(
                    'flex h-9 items-center justify-center rounded-lg text-sm transition-colors hover:bg-muted',
                    isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    !isSelected && isToday && 'ring-1 ring-primary/60',
                  )}
                  onClick={() => {
                    onChange(cell.iso)
                    setOpen(false)
                  }}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onChange(today)
                setOpen(false)
              }}
            >
              Hoje
            </Button>
            <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      )}

      <input type="hidden" value={value} required={required} readOnly aria-hidden />
    </div>
  )
}
