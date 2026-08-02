export type ParsedRow = {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  external_fitid?: string | null
  raw: Record<string, unknown>
}

function parseBrAmount(value: string) {
  const cleaned = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? Math.abs(n) : 0
}

function parseDate(value: string) {
  const v = value.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  const ofx = v.match(/^(\d{4})(\d{2})(\d{2})/)
  if (ofx) return `${ofx[1]}-${ofx[2]}-${ofx[3]}`
  return v.slice(0, 10)
}

export function parseCsv(content: string, mapping?: Partial<Record<string, string>>): ParsedRow[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []

  const delimiter = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''))
  const map = {
    date: mapping?.date || headers.find((h) => /data|date/i.test(h)) || headers[0],
    description:
      mapping?.description ||
      headers.find((h) => /desc|histórico|historico|memo|title/i.test(h)) ||
      headers[1],
    amount: mapping?.amount || headers.find((h) => /valor|amount|value/i.test(h)) || headers[2],
  }

  const idx = {
    date: headers.indexOf(map.date),
    description: headers.indexOf(map.description),
    amount: headers.indexOf(map.amount),
  }

  return lines
    .slice(1)
    .map((line): ParsedRow => {
      const cols = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''))
      const amountRaw = cols[idx.amount] || '0'
      const signed = amountRaw.includes('-') || amountRaw.trim().startsWith('(')
      const amount = parseBrAmount(amountRaw)
      const date = parseDate(cols[idx.date] || '')
      const description = cols[idx.description] || 'Sem descrição'
      const type: ParsedRow['type'] = signed || !amountRaw.trim().startsWith('+') ? 'expense' : 'income'
      return {
        date,
        description,
        amount,
        type,
        external_fitid: null,
        raw: Object.fromEntries(headers.map((h, i) => [h, cols[i]])),
      }
    })
    .filter((r) => r.date && r.amount > 0)
}

export function parseOfx(content: string): ParsedRow[] {
  const blocks = content.split(/<STMTTRN>/i).slice(1)
  return blocks
    .map((block) => {
      const get = (tag: string) => {
        const m = block.match(new RegExp(`<${tag}>([^\\n<]+)`, 'i'))
        return m?.[1]?.trim() ?? ''
      }
      const trnamt = get('TRNAMT')
      const amount = Math.abs(Number(trnamt.replace(',', '.')) || 0)
      const type = Number(trnamt) < 0 ? 'expense' : 'income'
      const fitidRaw = get('FITID') || null
      return {
        date: parseDate(get('DTPOSTED')),
        description: get('MEMO') || get('NAME') || 'OFX',
        amount,
        type: type as 'income' | 'expense',
        external_fitid: fitidRaw && fitidRaw !== '000000' ? fitidRaw : null,
        raw: { FITID: get('FITID'), TRNAMT: trnamt, MEMO: get('MEMO') },
      }
    })
    .filter((r) => r.date && r.amount > 0)
}

/** Saldo do extrato OFX (`LEDGERBAL` / `BALAMT`), se presente. */
export function parseOfxLedgerBalance(content: string): number | null {
  const m = content.match(/<LEDGERBAL>[\s\S]*?<BALAMT>([^\n<]+)/i)
  if (!m) return null
  const n = Number(String(m[1]).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
