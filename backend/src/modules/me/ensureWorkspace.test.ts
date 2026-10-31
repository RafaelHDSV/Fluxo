import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  FLUXO_DEFAULT_CATEGORIES,
  displayNameFromEmail,
  shouldSeedFluxoWorkspace,
} from './ensureWorkspace.js'

assert.equal(shouldSeedFluxoWorkspace(true), false)
assert.equal(shouldSeedFluxoWorkspace(false), true)

assert.equal(displayNameFromEmail('teste-12@yopmail.com'), 'teste-12')
assert.equal(displayNameFromEmail(undefined), 'Usuário')

assert.equal(FLUXO_DEFAULT_CATEGORIES.length, 11)
assert.deepEqual(
  FLUXO_DEFAULT_CATEGORIES.map((c) => c.name),
  [
    'Alimentação',
    'Consumo & Compras',
    'Custos Fixos',
    'Desenvolvimento Pessoal & Profissional',
    'Estilo de Vida & Lazer',
    'Financeiro Estratégico',
    'Outros',
    'Social & Afetivo',
    'Transporte & Mobilidade',
    'Salário',
    'Freelance',
  ],
)

const migration = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../migrations/012_seed_on_fluxo_login.sql'),
  'utf8',
)
assert.match(migration, /drop trigger if exists fluxo_on_auth_user_created on auth\.users/i)
assert.match(migration, /drop function if exists public\.fluxo_handle_new_user/)
assert.match(migration, /create or replace function public\.fluxo_ensure_user/)
assert.doesNotMatch(migration, /create trigger fluxo_on_auth_user_created/)
for (const category of FLUXO_DEFAULT_CATEGORIES) {
  assert.ok(migration.includes(`'${category.name}'`), category.name)
}

console.log('ensureWorkspace.test.ts ok')
