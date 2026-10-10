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
  'despesa em aberto ainda não move caixa',
)
assert.equal(
  checkingCashDelta({ type: 'expense', amount: 50, paid: false, paymentMethod: 'credit' }),
  0,
  'compra no crédito em aberto não move corrente',
)
assert.equal(
  checkingCashDelta({ type: 'expense', amount: 50, paid: true, paymentMethod: 'credit' }),
  -50,
  'marcar fatura paga baixa a conta de pagamento',
)
assert.equal(
  checkingCashDelta({ type: 'adjustment', amount: -10, paid: true, paymentMethod: null }),
  -10,
)

console.log('accountCash.test.ts ok')
