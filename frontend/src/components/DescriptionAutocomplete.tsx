import { useEffect, useId, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'

export type DescriptionSuggestion = {
  description: string
  uses: number
  category_id: string | null
}

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: DescriptionSuggestion) => void
  required?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
}

type ApiResponse = { items: DescriptionSuggestion[] }

export function DescriptionAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  required,
  disabled,
  className,
  placeholder = 'Ex.: Uber, Aluguel…',
}: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<DescriptionSuggestion[]>([])
  const [highlight, setHighlight] = useState(0)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipFetchRef = useRef(false)

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false
      return
    }
    if (!open) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const qs = new URLSearchParams({ limit: '12' })
        if (value.trim()) qs.set('q', value.trim())
        const res = await api.get<ApiResponse>(`/api/transactions/descriptions?${qs}`)
        setItems(res.items)
        setHighlight(0)
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }, 180)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  function pick(item: DescriptionSuggestion) {
    skipFetchRef.current = true
    onChange(item.description)
    onSelect?.(item)
    setOpen(false)
    setItems([])
  }

  const showList = open && (items.length > 0 || loading)

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!showList || items.length === 0) {
            if (e.key === 'Escape') setOpen(false)
            return
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlight((h) => (h + 1) % items.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlight((h) => (h - 1 + items.length) % items.length)
          } else if (e.key === 'Enter' && items[highlight]) {
            e.preventDefault()
            pick(items[highlight])
          } else if (e.key === 'Escape') {
            e.preventDefault()
            setOpen(false)
          }
        }}
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {loading && items.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">Buscando…</li>
          ) : (
            items.map((item, idx) => (
              <li key={item.description} role="option" aria-selected={idx === highlight}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm',
                    idx === highlight ? 'bg-muted' : 'hover:bg-muted/70',
                  )}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(item)}
                >
                  <span className="truncate">{item.description}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.uses}×</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
