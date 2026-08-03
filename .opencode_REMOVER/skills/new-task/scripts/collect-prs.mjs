// Coleta PRs de um autor na org AGX-Software via GraphQL e agrega por repo,
// card, scope de conventional commit e termo.
//
// Uso (da raiz do workspace):
//   node .opencode/skills/new-task/scripts/collect-prs.mjs <login> <since> [until]
//
// Escreve <PERFILS_DIR>/.raw/<login>.json, consumido por build-profile.mjs.
//
// Por que GraphQL e nao `gh search prs`: custa ~1 ponto por 100 PRs contra um
// orcamento de 5000/hora, enquanto a search REST da 30 requisicoes/minuto e
// estoura no bootstrap em lote.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const [login, since, until] = process.argv.slice(2)
if (!login || !since) {
  console.error('uso: node collect-prs.mjs <login> <since> [until]')
  process.exit(1)
}

const PERFILS = process.env.PERFILS_DIR ?? path.join(process.cwd(), '.perfils')
const OUT = process.env.RAW_DIR ?? path.join(PERFILS, '.raw')
fs.mkdirSync(OUT, { recursive: true })

const QUERY = `
query($q: String!, $cursor: String) {
  rateLimit { cost remaining }
  search(query: $q, type: ISSUE, first: 100, after: $cursor) {
    issueCount
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on PullRequest {
        number title createdAt mergedAt state merged
        repository { name }
      }
    }
  }
}`

function gh(args) {
  return JSON.parse(
    execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  )
}

function fetchWindow(q) {
  const nodes = []
  let cursor = null
  let issueCount = 0
  let cost = 0

  for (let page = 0; page < 12; page++) {
    const args = ['api', 'graphql', '-f', `query=${QUERY}`, '-f', `q=${q}`]
    if (cursor) args.push('-f', `cursor=${cursor}`)
    const r = gh(args).data
    issueCount = r.search.issueCount
    cost += r.rateLimit.cost
    nodes.push(...r.search.nodes.filter((n) => n && n.number))
    if (!r.search.pageInfo.hasNextPage) break
    cursor = r.search.pageInfo.endCursor
  }

  return { nodes, issueCount, cost }
}

// A search API corta em 1000 resultados. Acima disso, fatiar por semestre.
function fetchAll(login, since, until) {
  const range = until ? `${since}..${until}` : `>=${since}`
  const base = `is:pr author:${login} org:AGX-Software created:${range}`
  const probe = fetchWindow(base)

  if (probe.issueCount <= 1000) {
    return { ...probe, sliced: false }
  }

  const start = new Date(since)
  const end = new Date(
    until ?? process.env.TODAY ?? new Date().toISOString().slice(0, 10)
  )
  const slices = []
  let a = new Date(start)
  while (a < end) {
    const b = new Date(a)
    b.setMonth(b.getMonth() + 6)
    const bClamped = b > end ? end : b
    slices.push([
      a.toISOString().slice(0, 10),
      bClamped.toISOString().slice(0, 10)
    ])
    a = new Date(bClamped)
    a.setDate(a.getDate() + 1)
  }

  const all = []
  let cost = probe.cost
  for (const [s, e] of slices) {
    const r = fetchWindow(
      `is:pr author:${login} org:AGX-Software created:${s}..${e}`
    )
    all.push(...r.nodes)
    cost += r.cost
  }
  const seen = new Set()
  const nodes = all.filter((n) => {
    const k = `${n.repository.name}#${n.number}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return { nodes, issueCount: probe.issueCount, cost, sliced: true }
}

// Quatro convencoes de titulo convivem na org:
//   1. `[7639] - [TICKET] descricao`      -> card entre colchetes no inicio
//   2. `[PRODUCTION] 7384 descricao`      -> prefixo de branch + card
//   3. `3470 egi atualizar cnds`          -> card solto no inicio
//   4. `fix(bhs): descricao`              -> conventional commit, sem card
//   5. `7614-fix(auth): descricao`         -> card + dash + conventional commit
//   6. `... Gamificacao - #8522`           -> card com # em qualquer posicao
const CARD_PATTERNS = [
  /^\s*\[(\d{3,5})\]/, //                        1
  /^\s*\[[^\]]+\]\s*(\d{3,5})\b/, //             2
  /^\s*(\d{3,5})[\s-]/, //                       3 e 5
  /#(\d{3,5})\b/ //                              6
]

/**
 * PR de port/release: leva codigo pronto de uma branch para outra, sem
 * trabalho novo. Conta volume mas nao conta atuacao em feature — sem separar,
 * quem cuida de release aparece como dono de tudo.
 */
const PORT_RE = /^\s*(merges?\s+)?(main|production[a-z-]*|prod[a-z-]*|server|jobs|api|hml|staging|hooks?|develop)\s*(to|->|=>|para)\s*/i

function isPortPR(title) {
  const t = title.trim()
  if (PORT_RE.test(t)) return true
  if (/^\s*merges?\s+\S+\s+(to|para)\s+\S+/i.test(t)) return true
  if (/^\s*(production|main)\s+(hooks?|api|server|jobs)\s*$/i.test(t)) return true
  return false
}

function cardOf(title) {
  for (const re of CARD_PATTERNS) {
    const m = re.exec(title)
    if (m) return Number(m[1])
  }
  return null
}

/** Scope do conventional commit: `fix(bhs):` -> `bhs`. Sinal de feature de quem nao usa card. */
function ccScopeOf(title) {
  const m = /^\s*(feat|fix|refactor|chore|docs|test|perf|style|build|ci)\s*\(([^)]{1,40})\)\s*:/i.exec(
    title
  )
  return m ? m[2].trim().toLowerCase() : null
}

/** Descricao limpa: sem prefixo de branch, card, tipo e sufixo de ambiente. */
function scopeOf(title) {
  let t = title
    .replace(/^\s*\[\d{3,5}\]\s*-?\s*/, '')
    .replace(/^\s*\[[^\]]+\]\s*/, '')
    .replace(/^\s*\d{3,5}[\s-]+/, '')
    .replace(/[\s-]*#\d{3,5}\s*$/, '')
  t = t.replace(
    /^(FIX|FEATURE|IMPROVEMENT|SISTEMA|REFACTOR|HOTFIX|CHORE|DOCS|TEST|TICKET|TASK|AJUSTE CLIENTE)\b[:\s-]*/i,
    ''
  )
  // sufixo de ambiente, com um ou dois dashes: `-- Main`, `- Production-server`
  t = t.replace(
    /\s*-{1,2}\s*\(?(main|production[a-z-]*|prod[a-z-]*|jobs|api|hml|staging|selfcontract|hooks?|server)\)?\s*$/i,
    ''
  )
  t = t.replace(
    /\s*\((main|production[a-z-]*|jobs|api|hml|staging|selfcontract)\)\s*$/i,
    ''
  )
  return t.trim()
}

/**
 * Titulo normalizado para contar mudancas logicas: o mesmo trabalho portado
 * para N branches gera N PRs com o mesmo titulo. Contar PR cru infla quem
 * porta para producao.
 */
function logicalKey(title) {
  return scopeOf(title)
    .toLowerCase()
    .replace(/[^a-z0-9áàâãéêíóôõúüç ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const { nodes, issueCount, cost, sliced } = fetchAll(login, since, until)

// Termos de produto/integracao que aparecem no titulo. E o sinal de feature de
// quem nao usa card nem conventional commit.
const STOP = new Set(
  ('a as ao aos com da das de do dos e em na nas no nos o os para por que se um uma ' +
    'add adjust ajuste ajustes and at auth better bug bugfix change changes create ' +
    'created creating em fix fixed fixes fixing for from get handle if implement ' +
    'implementation improve in into is it main merge merges new not of on only or ' +
    'production remove removing return show stop test tests the to update updates ' +
    'updating use using validation when where with wrong api server jobs prod ' +
    'correcao correcoes ajustar criar erro novo nova alteracao implementacao ' +
    'pull request feat agx-software branch merged revert draft wip está sendo ' +
    'sem nao não ser via mais dos das pra por seu sua ' +
    // vocabulario generico de dev: aparece em todo mundo e nao discrimina
    'handling handle enhance enhanced correction corrections check checks method ' +
    'methods error errors simulation queue agent certified field fields logic ' +
    'status templates template issues prs melhorar melhoria melhorias ' +
    'causando salvar documentos excedem gerar gerando ajuste ajustes atualizacao ' +
    'atualização atualizar implementação implementar adicionar adicionando ' +
    'incluir incluindo permitir corrigir corrigido value values data date ' +
    'list listing search searching save saving load loading send sending ' +
    'refactor refatorar remover removendo alterar alterando trocar mudar ' +
    'improvement improvements bug bugs task ticket sistema tela telas page pages ' +
    'campo campos botao botão modal tabela lista item itens usuario usuário ' +
    'cliente clientes dev devs ' +
    // dominio compartilhado por quase todo o time: nao discrimina ninguem
    'proposal proposals proposta propostas produto produtos projeto projetos ' +
    'dados novos novas tipo tipos correct responses response master url urls ' +
    'migrating migration imp schema invoice fluxo link').split(' ')
)

function termsOf(title) {
  return scopeOf(title)
    .toLowerCase()
    .replace(/[^a-z0-9áàâãéêíóôõúüç-]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && w.length <= 24 && !STOP.has(w) && !/^\d+$/.test(w))
}

const byRepo = new Map()
const byCard = new Map()
const byScope = new Map()
const byTerm = new Map()
const logical = new Map()
let portPRs = 0

for (const n of nodes) {
  const repo = n.repository.name
  const date = (n.mergedAt ?? n.createdAt).slice(0, 10)
  const port = isPortPR(n.title)
  const card = cardOf(n.title)
  if (port) portPRs++

  if (!byRepo.has(repo)) {
    byRepo.set(repo, {
      repo,
      prs: 0,
      merged: 0,
      port: 0,
      mudancas: new Set(),
      last: ''
    })
  }
  const r = byRepo.get(repo)
  r.prs++
  if (n.merged) r.merged++
  if (port) r.port++
  r.mudancas.add(logicalKey(n.title))
  if (date > r.last) r.last = date

  // Termo conta por mudanca LOGICA, nao por PR: o mesmo titulo portado para 6
  // branches daria peso 6 a cada palavra dele e afogaria o sinal real.
  if (!port) {
    const lkey = logicalKey(n.title)
    for (const t of new Set(termsOf(n.title))) {
      if (!byTerm.has(t)) {
        byTerm.set(t, {
          termo: t,
          prs: 0,
          mudancas: new Set(),
          cards: new Set(),
          repos: new Set(),
          last: ''
        })
      }
      const tt = byTerm.get(t)
      tt.prs++
      tt.mudancas.add(lkey)
      if (card) tt.cards.add(card)
      tt.repos.add(repo)
      if (date > tt.last) tt.last = date
    }
  }

  const lk = `${repo}::${logicalKey(n.title)}`
  if (!logical.has(lk)) logical.set(lk, { title: n.title, prs: 0, last: '' })
  const lg = logical.get(lk)
  lg.prs++
  if (date > lg.last) lg.last = date

  if (card) {
    if (!byCard.has(card)) {
      byCard.set(card, {
        card,
        prs: 0,
        merged: 0,
        repos: new Set(),
        last: '',
        scopes: []
      })
    }
    const c = byCard.get(card)
    c.prs++
    if (n.merged) c.merged++
    c.repos.add(repo)
    if (date > c.last) c.last = date
    const s = scopeOf(n.title)
    if (s && !c.scopes.includes(s)) c.scopes.push(s)
  }

  const cc = ccScopeOf(n.title)
  if (cc) {
    if (!byScope.has(cc)) {
      byScope.set(cc, { scope: cc, prs: 0, repos: new Set(), last: '', exemplos: [] })
    }
    const sc = byScope.get(cc)
    sc.prs++
    sc.repos.add(repo)
    if (date > sc.last) sc.last = date
    if (sc.exemplos.length < 3) sc.exemplos.push(n.title)
  }
}

const result = {
  login,
  since,
  until: until ?? null,
  issueCount,
  collected: nodes.length,
  sliced,
  graphqlCost: cost,
  merged: nodes.filter((n) => n.merged).length,
  open: nodes.filter((n) => n.state === 'OPEN').length,
  comCard: nodes.filter((n) => cardOf(n.title)).length,
  semCard: nodes.filter((n) => !cardOf(n.title)).length,
  portPRs,
  mudancasLogicas: logical.size,
  repos: [...byRepo.values()]
    .map((r) => ({ ...r, mudancas: r.mudancas.size }))
    .sort((a, b) => b.prs - a.prs || b.last.localeCompare(a.last)),
  cards: [...byCard.values()]
    .map((c) => ({ ...c, repos: [...c.repos].sort() }))
    .sort((a, b) => b.last.localeCompare(a.last) || b.prs - a.prs),
  ccScopes: [...byScope.values()]
    .map((s) => ({ ...s, repos: [...s.repos].sort() }))
    .sort((a, b) => b.prs - a.prs),
  // Ordenado por mudancas distintas: e o que separa tema recorrente de
  // palavra que apareceu num unico titulo repetido em varias branches.
  termos: [...byTerm.values()]
    .map((t) => ({
      termo: t.termo,
      prs: t.prs,
      mudancas: t.mudancas.size,
      cards: [...t.cards].sort((a, b) => b - a),
      repos: [...t.repos].sort(),
      last: t.last
    }))
    .filter((t) => t.mudancas >= 3)
    .sort((a, b) => b.mudancas - a.mudancas || b.prs - a.prs)
    .slice(0, 40)
}

fs.writeFileSync(
  path.join(OUT, `${login}.json`),
  JSON.stringify(result, null, 2),
  'utf8'
)

console.log(
  `${login.padEnd(18)} PRs=${String(nodes.length).padStart(4)}` +
    `${sliced ? '*' : ' '} logicas=${String(result.mudancasLogicas).padStart(4)}` +
    ` port=${String(portPRs).padStart(3)}` +
    ` merged=${String(result.merged).padStart(4)}` +
    ` repos=${String(result.repos.length).padStart(2)}` +
    ` cards=${String(result.cards.length).padStart(3)}` +
    ` cc=${String(result.ccScopes.length).padStart(2)}` +
    ` termos=${String(result.termos.length).padStart(2)} cost=${cost}`
)
