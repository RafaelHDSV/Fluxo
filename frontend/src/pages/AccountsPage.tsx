import { FormEvent, useEffect, useState } from 'react'
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
import { accountTypeLabel, categoryKindLabel, labelOf, matchTypeLabel } from '@/lib/labels'
import { api } from '@/services/api'

type Account = {
  id: string
  name: string
  type: string
  balance: string | number
  due_day?: number | null
  credit_limit?: string | number | null
}

type Category = { id: string; name: string; kind: string }
type Rule = { id: string; category_id: string; match_type: string; pattern: string }

const emptyAccountForm = {
  name: '',
  type: 'checking',
  balance: '0',
  due_day: '',
  credit_limit: '',
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [form, setForm] = useState(emptyAccountForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [catName, setCatName] = useState('')
  const [rule, setRule] = useState({ category_id: '', match_type: 'contains', pattern: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [accs, cats, rls] = await Promise.all([
        api.get<Account[]>('/api/accounts'),
        api.get<Category[]>('/api/categories'),
        api.get<Rule[]>('/api/categories/rules'),
      ])
      setAccounts(accs)
      setCategories(cats)
      setRules(rls)
      setRule((r) => ({ ...r, category_id: r.category_id || cats[0]?.id || '' }))
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
    const payload = {
      name: form.name,
      type: form.type,
      balance: Number(form.balance),
      due_day: form.due_day ? Number(form.due_day) : null,
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
      credit_limit: a.credit_limit != null ? String(a.credit_limit) : '',
    })
  }

  async function createCategory(e: FormEvent) {
    e.preventDefault()
    await api.post('/api/categories', { name: catName, kind: 'expense' })
    setCatName('')
    await load()
  }

  async function createRule(e: FormEvent) {
    e.preventDefault()
    await api.post('/api/categories/rules', rule)
    setRule((r) => ({ ...r, pattern: '' }))
    await load()
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Contas e categorias</h1>
        <p className="text-muted-foreground">Origens do dinheiro, cartões e regras de categorização.</p>
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
            <div className="space-y-2">
              <Label htmlFor="acc-due">Vencimento (cartão)</Label>
              <Input
                id="acc-due"
                type="number"
                min={1}
                max={31}
                value={form.due_day}
                onChange={(e) => setForm({ ...form, due_day: e.target.value })}
              />
            </div>
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
                    <TableHead>Venc.</TableHead>
                    <TableHead />
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
                      <TableCell>{a.due_day ?? '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" type="button" onClick={() => startEditAccount(a)}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={createCategory} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label htmlFor="cat-name">Nome</Label>
              <Input id="cat-name" value={catName} onChange={(e) => setCatName(e.target.value)} required />
            </div>
            <Button type="submit">Adicionar</Button>
          </form>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma categoria.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Badge key={c.id} variant="outline">
                  {c.name}
                  <span className="ml-1 text-muted-foreground">({labelOf(categoryKindLabel, c.kind)})</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Regras de categorização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={createRule} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={rule.category_id} onValueChange={(v) => setRule({ ...rule, category_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={rule.match_type} onValueChange={(v) => setRule({ ...rule, match_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(matchTypeLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rule-pattern">Padrão</Label>
              <Input
                id="rule-pattern"
                value={rule.pattern}
                onChange={(e) => setRule({ ...rule, pattern: e.target.value })}
                placeholder="Uber"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit">Criar regra</Button>
            </div>
          </form>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma regra cadastrada.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {rules.map((r) => (
                <li key={r.id} className="rounded-lg border border-border px-3 py-2">
                  <Badge variant="muted" className="mr-2">
                    {labelOf(matchTypeLabel, r.match_type)}
                  </Badge>
                  “{r.pattern}” → {categories.find((c) => c.id === r.category_id)?.name || r.category_id}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
