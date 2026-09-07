import assert from 'node:assert/strict'
import { checkingCashDelta } from './accountCash.js'

assert.equal(
  checkingCashDelta({ type: 'income', amount: 100, paid: true, paymentMethod: 'debit' }),
  100,
)
assert.equal(
  checkingCashDelta({ type: 'expense', amount: 19.89, paid: true, paymentMethod: 'debit' }),
  -19.89,
)
assert.equal(
  checkingCashDelta({ type: 'expense', amount: 19.89, paid: false, paymentMethod: 'debit' }),
  0,
  'não pago ainda não é caixa na criação; toggle paid não deve usar o lado novo',
)
assert.equal(
  checkingCashDelta({ type: 'expense', amount: 50, paid: true, paymentMethod: 'credit' }),
  0,
)

console.log('accountCash.test.ts ok')
