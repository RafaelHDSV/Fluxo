import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
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

/** Digits → DD/MM/YYYY mask while typing. */
function maskBrDate(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/** Parse DD/MM/YYYY (also accepts D/M/YYYY). Returns ISO or null. */
function parseBrDate(text: string): string | null {
  const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return toISO(date)
}

/** Calendário custom pt-BR — valor ISO (YYYY-MM-DD), digitação e picker em DD/MM/YYYY. */
export function DatePicker({ id, value, onChange, required, className, disabled }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = parseISO(value)
  const today = useMemo(() => toISO(new Date()), [])
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(() => (value ? formatDate(value) : ''))
  const [viewYear, setViewYear] = useState(() => selected?.getFullYear() ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? new Date().getMonth())

  useEffect(() => {
    setText(value ? formatDate(value) : '')
  }, [value])

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

  function commitText(next: string) {
    const iso = parseBrDate(next)
    if (iso) {
      onChange(iso)
      setText(formatDate(iso))
      return true
    }
    return false
  }

  function onInputChange(raw: string) {
    const masked = maskBrDate(raw)
    setText(masked)
    if (masked.length === 10) commitText(masked)
  }

  function onInputBlur() {
    if (!text.trim()) {
      if (!required) onChange('')
      else setText(value ? formatDate(value) : '')
      return
    }
    if (!commitText(text)) {
      setText(value ? formatDate(value) : '')
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="DD/MM/AAAA"
          disabled={disabled}
          required={required}
          value={text}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => {
            if (!disabled) setOpen(true)
          }}
          onClick={() => {
            if (!disabled) setOpen(true)
          }}
          onBlur={onInputBlur}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              // Fecha o painel para o Tab ir ao próximo campo do form, não aos botões do calendário
              setOpen(false)
              return
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              onInputBlur()
              ;(e.target as HTMLInputElement).blur()
            }
            if (e.key === 'ArrowDown' && !open) {
              e.preventDefault()
              setOpen(true)
            }
          }}
          className="pr-10"
          aria-expanded={open}
          aria-haspopup="dialog"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          tabIndex={-1}
          aria-label="Abrir calendário"
          className="absolute right-0.5 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((v) => !v)}
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Calendário"
          className="absolute left-0 top-full z-50 mt-1 w-[min(100%,280px)] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-3 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              tabIndex={-1}
              className="h-8 w-8"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold">{monthLabel(viewYear, viewMonth)}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              tabIndex={-1}
              className="h-8 w-8"
              onClick={() => shiftMonth(1)}
            >
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
                  tabIndex={-1}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-lg text-sm transition-colors hover:bg-muted',
                    isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    !isSelected && isToday && 'ring-1 ring-primary/60',
                  )}
                  onClick={() => {
                    onChange(cell.iso)
                    setText(formatDate(cell.iso))
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
              tabIndex={-1}
              className="flex-1"
              onClick={() => {
                onChange(today)
                setText(formatDate(today))
                setOpen(false)
              }}
            >
              Hoje
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              tabIndex={-1}
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
