import { FormEvent, useEffect, useState } from 'react'
import { FileUp } from 'lucide-react'
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
import { formatBRL, formatDate } from '@/lib/format'
import { labelOf, transactionTypeLabel } from '@/lib/labels'
import { api } from '@/services/api'

type Account = { id: string; name: string }
type ImportRow = {
  id: string
  date: string
  description: string
  amount: string | number
  type: string
  is_duplicate: boolean
  selected: boolean
}

const SANTANDER_STEPS = [
  'Acesse o Internet Banking do Santander',
  'Vá em Conta corrente → Extrato',
  'Exporte no formato Money 2000 ou superior (.OFX)',
  'Envie o arquivo abaixo na conta de destino correta',
]

export function ImportsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountId, setAccountId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [importId, setImportId] = useState<string | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    api
      .get<Account[]>('/api/accounts')
      .then((accs) => {
        setAccounts(accs)
        if (accs[0]) setAccountId(accs[0].id)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
  }, [])

  async function onPreview(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setError('')
    setMessage('')
    setPending(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('account_id', accountId)
      const result = await api.upload<{ import: { id: string }; rows: ImportRow[] }>(
        '/api/imports/preview',
        form,
      )
      setImportId(result.import.id)
      setRows(result.rows)
      setMessage(`${result.rows.length} linhas lidas. Revise e confirme.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no preview')
    } finally {
      setPending(false)
    }
  }

  async function onCommit() {
    if (!importId) return
    setPending(true)
    try {
      const result = await api.post<{ created: number; skipped: number }>(
        `/api/imports/${importId}/commit`,
        {},
      )
      setMessage(`Importação concluída: ${result.created} criadas, ${result.skipped} ignoradas.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Importações</h1>
        <p className="text-muted-foreground">Importe extratos OFX ou CSV com preview e deduplicação.</p>
      </header>

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

      {rows.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Preview</CardTitle>
            <Button type="button" disabled={pending} onClick={onCommit}>
              Confirmar importação
            </Button>
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
                      <TableCell className="text-right font-mono tabular-nums">{formatBRL(r.amount)}</TableCell>
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
    </div>
  )
}
