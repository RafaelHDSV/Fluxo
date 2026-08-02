import assert from 'node:assert/strict'
import { computeCreditDueDate } from './creditCycle.ts'

// closing 28, due 10
assert.equal(computeCreditDueDate('2026-08-15', 28, 10), '2026-09-10')
assert.equal(computeCreditDueDate('2026-08-30', 28, 10), '2026-10-10')
assert.equal(computeCreditDueDate('2026-08-28', 28, 10), '2026-09-10')
assert.equal(computeCreditDueDate('2026-08-05', 28, 10), '2026-09-10')
assert.equal(computeCreditDueDate('2026-01-30', 28, 10), '2026-03-10')

// Feb edge
assert.equal(computeCreditDueDate('2026-02-15', 31, 10), '2026-03-10')

console.log('creditCycle.test.ts: ok')
