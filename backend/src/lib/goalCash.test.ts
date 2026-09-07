import assert from 'node:assert/strict'
import { goalAmountDelta, goalTransferAccountDelta } from './goalCash.js'

assert.equal(goalAmountDelta({ type: 'transfer', amount: 100, goalId: 'g1', goalDirection: 'to_goal' }), 100)
assert.equal(goalAmountDelta({ type: 'transfer', amount: 40, goalId: 'g1', goalDirection: 'from_goal' }), -40)
assert.equal(goalAmountDelta({ type: 'transfer', amount: 100, goalId: null }), 0)
assert.equal(goalAmountDelta({ type: 'expense', amount: 100, goalId: 'g1' }), 0)

assert.equal(
  goalTransferAccountDelta({ type: 'transfer', amount: 100, goalId: 'g1', goalDirection: 'to_goal' }),
  -100,
)
assert.equal(
  goalTransferAccountDelta({ type: 'transfer', amount: 40, goalId: 'g1', goalDirection: 'from_goal' }),
  40,
)

console.log('goalCash.test.ts ok')
