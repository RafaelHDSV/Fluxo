import assert from 'node:assert/strict'
import { buildDedupeHash, normalizeDescription } from '../../lib/money.js'
import { parseCsv, parseOfx } from './parsers.js'

const csv = `Data;Descrição;Valor
01/08/2026;Uber Trip;45,90
02/08/2026;Salário;5000,00`

const rows = parseCsv(csv)
assert.equal(rows.length, 2)
assert.equal(rows[0].description, 'Uber Trip')
assert.equal(rows[0].amount, 45.9)

const ofx = `
OFXHEADER:100
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260801
<TRNAMT>-12.50
<FITID>ABC123
<MEMO>Cafe
</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`

const ofxRows = parseOfx(ofx)
assert.equal(ofxRows.length, 1)
assert.equal(ofxRows[0].external_fitid, 'ABC123')
assert.equal(ofxRows[0].type, 'expense')

assert.equal(normalizeDescription('  Café  Uber '), 'cafe uber')
const h1 = buildDedupeHash({
  userId: 'u1',
  date: '2026-08-01',
  amount: 10,
  description: 'Test',
  accountId: 'a1',
})
const h2 = buildDedupeHash({
  userId: 'u1',
  date: '2026-08-01',
  amount: 10,
  description: 'test',
  accountId: 'a1',
})
assert.equal(h1, h2)

console.log('parsers.test.ts ok')
