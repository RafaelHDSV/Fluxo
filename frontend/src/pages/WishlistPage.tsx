import { ExternalLink } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import notionDump from '@/data/notion-wishlist.json'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { formatBRL } from '@/lib/format'
import { api } from '@/services/api'

type WishItem = {
  id: string
  name: string
  price: string | number
  saved_amount: string | number
  category: string | null
  url: string | null
  purchased: boolean
}

const emptyForm = {
  name: '',
  price: '',
  saved_amount: '0',
  category: '',
  url: '',
}

export function WishlistPage() {
  const [items, setItems] = useState<WishItem[]>([])
  const [form, setForm] = useState(emptyForm)
  const [hidePurchased, setHidePurchased] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [importing, setImporting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = hidePurchased ? '?purchased=false' : ''
      setItems(await api.get<WishItem[]>(`/api/wishlist${params}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [hidePurchased])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        saved_amount: Number(form.saved_amount) || 0,
        category: form.category || null,
        url: form.url || null,
      }
      if (editingId) {
        await api.put(`/api/wishlist/${editingId}`, payload)
        setEditingId(null)
      } else {
        await api.post('/api/wishlist', payload)
      }
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  async function onDelete(id: string) {
    await api.delete(`/api/wishlist/${id}`)
    await load()
  }

  async function togglePurchased(item: WishItem) {
    await api.put(`/api/wishlist/${item.id}`, { purchased: !item.purchased })
    await load()
  }

  async function importFromNotion() {
    setImporting(true)
    setMessage('')
    setError('')
    try {
      const result = await api.post<{ inserted: number; skipped: number; total: number }>(
        '/api/wishlist/import',
        notionDump,
      )
      setMessage(
        `Importação concluída: ${result.inserted} inseridos, ${result.skipped} ignorados (de ${result.total}).`,
      )
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro na importação')
    } finally {
      setImporting(false)
    }
  }

  function startEdit(item: WishItem) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      price: String(item.price),
      saved_amount: String(item.saved_amount),
      category: item.category || '',
      url: item.url || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Wishlist</h1>
          <p className="text-muted-foreground">Itens desejados, progresso de economia e compras.</p>
        </div>
        <Button variant="outline" type="button" disabled={importing} onClick={importFromNotion}>
          {importing ? 'Importando…' : 'Importar do Notion (dump)'}
        </Button>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-primary">{message}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{editingId ? 'Editar item' : 'Novo item'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="wl-name">Nome</Label>
              <Input
                id="wl-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-price">Preço</Label>
              <Input
                id="wl-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-saved">Valor guardado</Label>
              <Input
                id="wl-saved"
                type="number"
                min="0"
                step="0.01"
                value={form.saved_amount}
                onChange={(e) => setForm({ ...form, saved_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-cat">Categoria</Label>
              <Input
                id="wl-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="wl-url">URL</Label>
              <Input
                id="wl-url"
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://"
              />
            </div>
            <div className="flex flex-wrap items-end gap-2 sm:col-span-full">
              <Button type="submit">{editingId ? 'Atualizar' : 'Adicionar'}</Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Switch id="hide-purchased" checked={hidePurchased} onCheckedChange={setHidePurchased} />
        <Label htmlFor="hide-purchased" className="cursor-pointer">
          Ocultar comprados
        </Label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item na wishlist.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const price = Number(item.price)
            const saved = Number(item.saved_amount)
            const pct = price > 0 ? Math.min(100, (saved / price) * 100) : 0
            return (
              <Card key={item.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      {item.category && (
                        <Badge variant="muted" className="mt-1">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                    {item.purchased && <Badge variant="success">Comprado</Badge>}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-mono tabular-nums">{formatBRL(saved)}</span>
                    <span className="text-muted-foreground">de {formatBRL(price)}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% guardado</p>
                  <div className="flex flex-wrap gap-2">
                    {item.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Link
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" type="button" onClick={() => startEdit(item)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" type="button" onClick={() => togglePurchased(item)}>
                      {item.purchased ? 'Desmarcar compra' : 'Marcar comprado'}
                    </Button>
                    <Button variant="destructive" size="sm" type="button" onClick={() => onDelete(item.id)}>
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
