import assert from 'node:assert/strict'
import { goalAmountDelta } from './goalCash.js'

assert.equal(goalAmountDelta({ type: 'expense', amount: 100, goalId: 'g1' }), 100)
assert.equal(goalAmountDelta({ type: 'income', amount: 40, goalId: 'g1' }), -40)
assert.equal(goalAmountDelta({ type: 'expense', amount: 100, goalId: null }), 0)
assert.equal(goalAmountDelta({ type: 'transfer', amount: 100, goalId: 'g1' }), 0)

console.log('goalCash.test.ts ok')
