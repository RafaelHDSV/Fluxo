import { FormEvent, useEffect, useState } from 'react'
import { Archive, Pencil } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBRL } from '@/lib/format'
import { accountTypeLabel, labelOf } from '@/lib/labels'
import { api } from '@/services/api'

type Account = {
  id: string
  name: string
  type: string
  balance: string | number
  due_day?: number | null
  closing_day?: number | null
  credit_limit?: string | number | null
}

const emptyAccountForm = {
  name: '',
  type: 'checking',
  balance: '0',
  due_day: '',
  closing_day: '',
  credit_limit: '',
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState(emptyAccountForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setAccounts(await api.get<Account[]>('/api/accounts'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function saveAccount(e: FormEvent) {
    e.preventDefault()
    const isCard = form.type === 'credit_card'
    const payload = {
      name: form.name,
      type: form.type,
      balance: Number(form.balance),
      due_day: isCard && form.due_day ? Number(form.due_day) : null,
      closing_day: isCard && form.closing_day ? Number(form.closing_day) : null,
      credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
    }
    if (editingId) await api.put(`/api/accounts/${editingId}`, payload)
    else await api.post('/api/accounts', payload)
    setForm(emptyAccountForm)
    setEditingId(null)
    await load()
  }

  function startEditAccount(a: Account) {
    setEditingId(a.id)
    setForm({
      name: a.name,
      type: a.type,
      balance: String(a.balance),
      due_day: a.due_day != null ? String(a.due_day) : '',
      closing_day: a.closing_day != null ? String(a.closing_day) : '',
      credit_limit: a.credit_limit != null ? String(a.credit_limit) : '',
    })
  }

  const isCardForm = form.type === 'credit_card'

  async function confirmArchive() {
    if (!archiveId) return
    setArchiving(true)
    try {
      await api.delete(`/api/accounts/${archiveId}`)
      setArchiveId(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao arquivar')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Contas</h1>
        <p className="text-muted-foreground">Contas correntes, cartões e carteiras — origens do seu dinheiro.</p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{editingId ? 'Editar conta' : 'Nova conta / cartão'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveAccount} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="acc-name">Nome</Label>
              <Input
                id="acc-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(accountTypeLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-balance">Saldo</Label>
              <Input
                id="acc-balance"
                type="number"
                step="0.01"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
              />
            </div>
            {isCardForm && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="acc-closing">Fechamento (cartão)</Label>
                  <Input
                    id="acc-closing"
                    type="number"
                    min={1}
                    max={31}
                    value={form.closing_day}
                    onChange={(e) => setForm({ ...form, closing_day: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Dia em que a fatura fecha (ex.: 28).</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acc-due">Vencimento (cartão)</Label>
                  <Input
                    id="acc-due"
                    type="number"
                    min={1}
                    max={31}
                    value={form.due_day}
                    onChange={(e) => setForm({ ...form, due_day: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Dia do pagamento da fatura (ex.: 10).</p>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="acc-limit">Limite</Label>
              <Input
                id="acc-limit"
                type="number"
                step="0.01"
                value={form.credit_limit}
                onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">{editingId ? 'Atualizar' : 'Salvar conta'}</Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null)
                    setForm(emptyAccountForm)
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Fecha.</TableHead>
                    <TableHead>Venc.</TableHead>
                    <TableHead className="w-[88px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>
                        <Badge variant="muted">{labelOf(accountTypeLabel, a.type)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatBRL(a.balance)}</TableCell>
                      <TableCell>{a.type === 'credit_card' ? (a.closing_day ?? '—') : '—'}</TableCell>
                      <TableCell>{a.type === 'credit_card' ? (a.due_day ?? '—') : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            aria-label="Editar"
                            onClick={() => startEditAccount(a)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            aria-label="Arquivar"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setArchiveId(a.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={archiveId != null}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Arquivar conta?"
        description="A conta deixa de aparecer nas listagens, mas o histórico de lançamentos é preservado."
        confirmLabel="Arquivar"
        onConfirm={confirmArchive}
        loading={archiving}
      />
    </div>
  )
}
