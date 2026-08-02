import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, FileUp, Trash2 } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBRL, formatDate } from '@/lib/format'
import { labelOf, matchTypeLabel, transactionTypeLabel } from '@/lib/labels'
import { api } from '@/services/api'

type Account = { id: string; name: string }
type Category = { id: string; name: string; kind: string }
type CategoryRule = { id: string; category_id: string; match_type: string; pattern: string }
type DescriptionRule = {
  id: string
  pattern: string
  replacement: string
  match_type: string
  priority?: number
}
type ImportRow = {
  id: string
  date: string
  description: string
  original_description?: string | null
  amount: string | number
  type: string
  is_duplicate: boolean
  selected: boolean
  suggested_category_id?: string | null
}

const SANTANDER_STEPS = [
  'Acesse o Internet Banking do Santander',
  'Vá em Conta corrente → Extrato',
  'Exporte no formato Money 2000 ou superior (.OFX)',
  'Envie o arquivo abaixo na conta de destino correta',
]

export function ImportsPage() {
  const [tab, setTab] = useState('importar')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([])
  const [descriptionRules, setDescriptionRules] = useState<DescriptionRule[]>([])
  const [accountId, setAccountId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [importId, setImportId] = useState<string | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [ledgerBalance, setLedgerBalance] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [draftDescription, setDraftDescription] = useState('')
  const [draftCategoryId, setDraftCategoryId] = useState('')
  const [savingStep, setSavingStep] = useState(false)
  const [rulePatternDraft, setRulePatternDraft] = useState('')

  const [catRuleForm, setCatRuleForm] = useState({
    category_id: '',
    match_type: 'contains',
    pattern: '',
  })
  const [descRuleForm, setDescRuleForm] = useState({ pattern: '', replacement: '' })
  const [deleteCatRuleId, setDeleteCatRuleId] = useState<string | null>(null)
  const [deleteDescRuleId, setDeleteDescRuleId] = useState<string | null>(null)
  const [deletingRule, setDeletingRule] = useState(false)

  const reviewRows = useMemo(
    () => rows.filter((r) => !r.is_duplicate && r.selected),
    [rows],
  )
  const currentRow = reviewRows[stepIndex] ?? null

  const loadRules = useCallback(async () => {
    const [cats, catRules, descRules] = await Promise.all([
      api.get<Category[]>('/api/categories'),
      api.get<CategoryRule[]>('/api/categories/rules'),
      api.get<DescriptionRule[]>('/api/description-rules'),
    ])
    setCategories(cats)
    setCategoryRules(catRules)
    setDescriptionRules(descRules)
    setCatRuleForm((f) => ({ ...f, category_id: f.category_id || cats[0]?.id || '' }))
  }, [])

  useEffect(() => {
    api
      .get<Account[]>('/api/accounts')
      .then((accs) => {
        setAccounts(accs)
        if (accs[0]) setAccountId(accs[0].id)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
    loadRules().catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar regras'))
  }, [loadRules])

  useEffect(() => {
    if (!currentRow) return
    setDraftDescription(currentRow.description || '')
    setDraftCategoryId(currentRow.suggested_category_id || categories[0]?.id || '')
    setRulePatternDraft(currentRow.original_description || currentRow.description || '')
  }, [currentRow, categories])

  async function onPreview(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setError('')
    setMessage('')
    setPending(true)
    setReviewMode(false)
    setStepIndex(0)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('account_id', accountId)
      const result = await api.upload<{
        import: { id: string }
        rows: ImportRow[]
        ledger_balance?: number | null
      }>('/api/imports/preview', form)
      setImportId(result.import.id)
      setRows(result.rows)
      setLedgerBalance(result.ledger_balance ?? null)
      const novos = result.rows.filter((r) => !r.is_duplicate).length
      setMessage(
        `${result.rows.length} linhas (${novos} novas)` +
          (result.ledger_balance != null
            ? ` · Saldo do extrato: ${formatBRL(result.ledger_balance)}`
            : '') +
          '. Revise no stepper e confirme.',
      )
      if (novos > 0) {
        setReviewMode(true)
        setStepIndex(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no preview')
    } finally {
      setPending(false)
    }
  }

  async function persistCurrentStep() {
    if (!importId || !currentRow) return
    setSavingStep(true)
    try {
      const updated = await api.patch<ImportRow>(`/api/imports/${importId}/rows/${currentRow.id}`, {
        description: draftDescription,
        suggested_category_id: draftCategoryId || null,
      })
      setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
    } finally {
      setSavingStep(false)
    }
  }

  async function goNext() {
    await persistCurrentStep()
    setStepIndex((i) => Math.min(i + 1, Math.max(reviewRows.length - 1, 0)))
  }

  async function goPrev() {
    await persistCurrentStep()
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  async function saveAsDescriptionRule() {
    if (!rulePatternDraft.trim() || !draftDescription.trim()) return
    setPending(true)
    try {
      await persistCurrentStep()
      await api.post('/api/description-rules', {
        pattern: rulePatternDraft.trim(),
        replacement: draftDescription.trim(),
        match_type: 'contains',
      })
      await loadRules()
      setMessage(`Regra salva: “${rulePatternDraft.trim()}” → “${draftDescription.trim()}”`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar regra')
    } finally {
      setPending(false)
    }
  }

  async function onCommit() {
    if (!importId) return
    setPending(true)
    try {
      if (currentRow) await persistCurrentStep()
      const result = await api.post<{ created: number; skipped: number; skipped_no_category?: number }>(
        `/api/imports/${importId}/commit`,
        ledgerBalance != null ? { ledger_balance: ledgerBalance } : {},
      )
      setMessage(
        `Importação concluída: ${result.created} criadas, ${result.skipped} ignoradas` +
          (result.skipped_no_category
            ? ` (${result.skipped_no_category} sem categoria)`
            : '') +
          (ledgerBalance != null ? `. Saldo atualizado para ${formatBRL(ledgerBalance)}.` : '.'),
      )
      setReviewMode(false)
      setRows([])
      setImportId(null)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar')
    } finally {
      setPending(false)
    }
  }

  async function createCategoryRule(e: FormEvent) {
    e.preventDefault()
    await api.post('/api/categories/rules', catRuleForm)
    setCatRuleForm((f) => ({ ...f, pattern: '' }))
    await loadRules()
  }

  async function createDescriptionRule(e: FormEvent) {
    e.preventDefault()
    await api.post('/api/description-rules', {
      ...descRuleForm,
      match_type: 'contains',
    })
    setDescRuleForm({ pattern: '', replacement: '' })
    await loadRules()
  }

  async function confirmDeleteCatRule() {
    if (!deleteCatRuleId) return
    setDeletingRule(true)
    try {
      await api.delete(`/api/categories/rules/${deleteCatRuleId}`)
      setDeleteCatRuleId(null)
      await loadRules()
    } finally {
      setDeletingRule(false)
    }
  }

  async function confirmDeleteDescRule() {
    if (!deleteDescRuleId) return
    setDeletingRule(true)
    try {
      await api.delete(`/api/description-rules/${deleteDescRuleId}`)
      setDeleteDescRuleId(null)
      await loadRules()
    } finally {
      setDeletingRule(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Importações</h1>
        <p className="text-muted-foreground">
          Extrato OFX/CSV, revisão passo a passo e regras de nome/categoria.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="importar">Importar</TabsTrigger>
          <TabsTrigger value="regras">Regras</TabsTrigger>
        </TabsList>

        <TabsContent value="importar" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Como exportar do Santander</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                {SANTANDER_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                Enviar arquivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onPreview} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Conta destino</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import-file">Arquivo OFX ou CSV</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".csv,.ofx,text/csv,application/x-ofx"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={pending}>
                    {pending ? 'Processando…' : 'Pré-visualizar'}
                  </Button>
                </div>
              </form>
              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              {message && <p className="mt-3 text-sm text-primary">{message}</p>}
            </CardContent>
          </Card>

          {reviewMode && currentRow && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    Revisar lançamento {stepIndex + 1} de {reviewRows.length}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={stepIndex === 0 || savingStep}
                      onClick={() => void goPrev()}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={stepIndex >= reviewRows.length - 1 || savingStep}
                      onClick={() => void goNext()}
                    >
                      Próxima
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                    <Button type="button" disabled={pending || savingStep} onClick={() => void onCommit()}>
                      Confirmar importação
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Data</p>
                    <p className="font-medium">{formatDate(currentRow.date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <Badge variant="muted">{labelOf(transactionTypeLabel, currentRow.type)}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-mono tabular-nums font-medium">{formatBRL(currentRow.amount)}</p>
                  </div>
                </div>

                {currentRow.original_description &&
                  currentRow.original_description !== draftDescription && (
                    <p className="text-xs text-muted-foreground">
                      Original do banco: {currentRow.original_description}
                    </p>
                  )}

                <div className="space-y-2">
                  <Label htmlFor="step-desc">Descrição</Label>
                  <Input
                    id="step-desc"
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={draftCategoryId} onValueChange={setDraftCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <p className="text-sm font-medium">Salvar como regra de nome</p>
                  <p className="text-xs text-muted-foreground">
                    Próximas importações com esse texto na descrição usarão o nome abaixo.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="rule-pat">Se contém</Label>
                      <Input
                        id="rule-pat"
                        value={rulePatternDraft}
                        onChange={(e) => setRulePatternDraft(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vira</Label>
                      <Input value={draftDescription} readOnly />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={pending || !rulePatternDraft.trim() || !draftDescription.trim()}
                    onClick={() => void saveAsDescriptionRule()}
                  >
                    Salvar regra
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {rows.length > 0 && !reviewMode && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Preview</CardTitle>
                <div className="flex gap-2">
                  {reviewRows.length > 0 && (
                    <Button type="button" variant="outline" onClick={() => setReviewMode(true)}>
                      Revisar passo a passo
                    </Button>
                  )}
                  <Button type="button" disabled={pending} onClick={() => void onCommit()}>
                    Confirmar importação
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{formatDate(r.date)}</TableCell>
                          <TableCell>{r.description}</TableCell>
                          <TableCell>
                            <Badge variant="muted">{labelOf(transactionTypeLabel, r.type)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatBRL(r.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={r.is_duplicate ? 'warning' : 'success'}>
                              {r.is_duplicate ? 'Duplicada' : 'Nova'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {rows.length > 0 && reviewMode && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Resumo do arquivo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {reviewRows.length} novas para importar ·{' '}
                  {rows.filter((r) => r.is_duplicate).length} duplicadas ignoradas
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={() => setReviewMode(false)}>
                  Ver tabela completa
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="regras" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Regras de nome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Se a descrição do extrato contém um texto, ela vira um nome amigável no preview.
              </p>
              <form onSubmit={createDescriptionRule} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="desc-pat">Se contém</Label>
                  <Input
                    id="desc-pat"
                    value={descRuleForm.pattern}
                    onChange={(e) => setDescRuleForm({ ...descRuleForm, pattern: e.target.value })}
                    placeholder="CHOPPERIA"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc-rep">Vira</Label>
                  <Input
                    id="desc-rep"
                    value={descRuleForm.replacement}
                    onChange={(e) => setDescRuleForm({ ...descRuleForm, replacement: e.target.value })}
                    placeholder="Almoço"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit">Criar regra de nome</Button>
                </div>
              </form>
              {descriptionRules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma regra de nome.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {descriptionRules.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <span>
                        “{r.pattern}” → <strong>{r.replacement}</strong>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        aria-label="Excluir regra de nome"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteDescRuleId(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Regras de categorização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Se a descrição (já renomeada) contém um texto, sugere a categoria na importação.
              </p>
              <form onSubmit={createCategoryRule} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={catRuleForm.category_id}
                    onValueChange={(v) => setCatRuleForm({ ...catRuleForm, category_id: v })}
                  >
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
                  <Select
                    value={catRuleForm.match_type}
                    onValueChange={(v) => setCatRuleForm({ ...catRuleForm, match_type: v })}
                  >
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
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="cat-pat">Texto na descrição</Label>
                  <Input
                    id="cat-pat"
                    value={catRuleForm.pattern}
                    onChange={(e) => setCatRuleForm({ ...catRuleForm, pattern: e.target.value })}
                    placeholder="Almoço"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit">Criar regra</Button>
                </div>
              </form>
              {categoryRules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma regra de categoria.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {categoryRules.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <span>
                        <Badge variant="muted" className="mr-2">
                          {labelOf(matchTypeLabel, r.match_type)}
                        </Badge>
                        “{r.pattern}” →{' '}
                        {categories.find((c) => c.id === r.category_id)?.name || r.category_id}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        aria-label="Excluir regra"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteCatRuleId(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteCatRuleId != null}
        onOpenChange={(open) => !open && setDeleteCatRuleId(null)}
        title="Excluir regra de categoria?"
        description="A regra deixa de ser usada nas importações."
        confirmLabel="Excluir"
        onConfirm={confirmDeleteCatRule}
        loading={deletingRule}
      />
      <ConfirmDialog
        open={deleteDescRuleId != null}
        onOpenChange={(open) => !open && setDeleteDescRuleId(null)}
        title="Excluir regra de nome?"
        description="A regra deixa de renomear descrições no preview."
        confirmLabel="Excluir"
        onConfirm={confirmDeleteDescRule}
        loading={deletingRule}
      />
    </div>
  )
}
