// Gera .perfils/<login>.md a partir da saida de collect-prs.mjs, preservando
// as secoes escritas a mao.
//
// Uso (da raiz do workspace):
//   node .claude/skills/new-task/scripts/build-profile.mjs [login...]
//
// Sem login, gera o roster inteiro. Variaveis de ambiente:
//   PERFILS_DIR  destino  (padrao: <cwd>/.perfils)
//   RAW_DIR      entrada  (padrao: <PERFILS_DIR>/.raw)
//   TODAY        data do refresh, YYYY-MM-DD (padrao: hoje)
//   HISTORY_SINCE inicio do bootstrap (padrao: TODAY - 365 dias)
import fs from 'node:fs'
import path from 'node:path'

const PERFILS = process.env.PERFILS_DIR ?? path.join(process.cwd(), '.perfils')
const RAW = process.env.RAW_DIR ?? path.join(PERFILS, '.raw')
const TODAY = process.env.TODAY ?? new Date().toISOString().slice(0, 10)
const HISTORY_SINCE =
  process.env.HISTORY_SINCE ??
  (() => {
    const d = new Date(TODAY)
    d.setDate(d.getDate() - 365)
    return d.toISOString().slice(0, 10)
  })()
/** Corte de atividade para `status`: ultimos 30 dias. */
const ACTIVE_SINCE = (() => {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
})()
const BOARD = 'https://github.com/AGX-Software/board/issues'

const ROSTER = {
  abertanha: { nome: 'Adriano Bertanha', aliases: ['adriano'] },
  anamrcnds: { nome: 'Ana Marcondes', aliases: ['ana'] },
  DaviSanttos: { nome: 'Davi Santos', aliases: ['davi'] },
  mfernandanll: { nome: 'Fernanda Loureiro', aliases: ['fernanda'] },
  MathGueff: { nome: 'Matheus Augusto Santos Gueff', aliases: ['gueff'] },
  cardosoGu: { nome: 'Gustavo Cardoso', aliases: ['cardoso', 'gustavo'] },
  meirelleshugo: { nome: 'Hugo Meirelles', aliases: ['hugo'] },
  JandersonSR: { nome: 'Janderson', aliases: ['janderson', 'jander'] },
  marcuslaraa: { nome: 'Marcus Vinícius Lara', aliases: ['marcus'] },
  Nicolaskn95: { nome: 'Nicolas Nagano', aliases: ['nicolas'] },
  RomuuloGoncalves: { nome: 'Rômulo Gonçalves', aliases: ['romulo'] },
  thalesmanoel: { nome: 'Thales Manoel', aliases: ['thales'] },
  RafaelHDSV: { nome: 'Rafael Vieira', aliases: ['vieira'] },
  ViniciusRibeiro6: { nome: 'Vinicius Ribeiro', aliases: ['vinicius', 'vini'] },
  felipezarco: { nome: 'Luiz Felipe Zarco', aliases: ['zarco'] }
}

const PLACEHOLDER_ESTILO = '- _A preencher: preferências de escopo, testes, documentação._'
const PLACEHOLDER_NOTAS =
  '<!-- Preservar este bloco no refresh-profile. Edite à mão se precisar. -->'

/** Extrai o corpo de uma secao H2 de um perfil existente. */
function sectionOf(md, heading) {
  if (!md) return null
  const re = new RegExp(`^## ${heading}\\s*$`, 'm')
  const m = re.exec(md)
  if (!m) return null
  const rest = md.slice(m.index + m[0].length)
  const next = /^## /m.exec(rest)
  return (next ? rest.slice(0, next.index) : rest).replace(/^\s*\n|\s*$/g, '')
}

function truncate(s, n) {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t
}

// Nota de desenho: nao existe filtro de frequencia entre devs aqui. Nome de
// produto que muitos tocam (`crefaz`, `pine`, `nio`) e exatamente o que a
// triagem precisa para escolher entre eles por volume — um filtro de IDF
// apagava justamente esses. O ruido generico e tratado pela stoplist curada
// em `collect-prs.mjs`.

/**
 * Candidatos a feature: scope de conventional commit (nome de produto limpo)
 * primeiro, depois termos discriminantes. Card entra como evidencia, nao como
 * nome — o nome tem que ser legivel por humano.
 */
function features(d) {
  const link = (n) => `[#${n}](${BOARD}/${n})`
  const cardsByTerm = (term) => {
    const t = d.termos.find((x) => x.termo === term)
    if (t?.cards?.length) return t.cards.slice(0, 3).map(link)
    return d.cards
      .filter((c) => c.scopes.some((s) => s.toLowerCase().includes(term)))
      .slice(0, 3)
      .map((c) => link(c.card))
  }

  const candidatos = []

  // Scope de conventional commit: nome de produto/integracao ja limpo.
  for (const s of d.ccScopes) {
    if (s.prs < 2 || /^[#\d]/.test(s.scope) || s.scope.length > 24) continue
    candidatos.push({ nome: s.scope, peso: s.prs, repos: s.repos })
  }

  // Termos discriminantes. Exigir evidencia de tema, nao de titulo: o termo
  // precisa atravessar >=2 cards ou >=4 repos. Sem isso, palavra de um unico
  // titulo repetido em varias branches entraria como "feature".
  for (const t of d.termos) {
    if (t.mudancas < 3) continue
    if (t.cards.length < 2 && t.repos.length < 4) continue
    candidatos.push({ nome: t.termo, peso: t.mudancas, repos: t.repos })
  }

  // Dedup por substring com o MAIOR peso vencendo: ordenar antes de filtrar.
  // Sem isso, um `crefaz-v2` de peso 3 derrubava o `crefaz` de peso 45.
  const out = []
  for (const c of candidatos.sort((a, b) => b.peso - a.peso)) {
    if (out.length >= 6) break
    if (
      out.some((o) => o.nome.includes(c.nome) || c.nome.includes(o.nome))
    ) {
      continue
    }
    out.push({ ...c, cards: cardsByTerm(c.nome) })
  }

  return out
}

function build(login) {
  const d = JSON.parse(fs.readFileSync(path.join(RAW, `${login}.json`), 'utf8'))
  const meta = ROSTER[login]
  if (!meta) throw new Error(`login fora do roster: ${login}`)

  const file = path.join(PERFILS, `${login}.md`)
  const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
  const estilo = sectionOf(prev, 'Estilo de trabalho') || PLACEHOLDER_ESTILO
  const notas = sectionOf(prev, 'Notas manuais') || PLACEHOLDER_NOTAS

  // status: houve PR nos ultimos 30 dias?
  const cut = ACTIVE_SINCE
  const recentes = d.repos.filter((r) => r.last >= cut)
  const status = recentes.length > 0 ? 'ativo' : 'inativo'

  const portPct = d.collected ? Math.round((d.portPRs / d.collected) * 100) : 0

  const yaml = [
    '```yaml',
    `login: ${login}`,
    `nome: ${meta.nome}`,
    `aliases: [${meta.aliases.join(', ')}]`,
    `status: ${status}`,
    `historySince: ${HISTORY_SINCE}`,
    `updatedAt: ${TODAY}`,
    `refreshEveryDays: 30`,
    `prsNaJanela: ${d.collected}`,
    `mudancasLogicas: ${d.mudancasLogicas}`,
    `prsDePort: ${d.portPRs}`,
    '```'
  ].join('\n')

  const reposTable = [
    '| Repo | PRs | Mudanças | Merged | Port | Último PR |',
    '|------|-----|----------|--------|------|-----------|',
    ...d.repos
      .slice(0, 12)
      .map(
        (r) =>
          `| \`${r.repo}\` | ${r.prs} | ${r.mudancas} | ${r.merged} | ${r.port} | ${r.last} |`
      )
  ].join('\n')

  const feats = features(d)
  const featTable = feats.length
    ? [
        '| Feature / área | Mudanças | Repos | Evidência |',
        '|----------------|----------|-------|-----------|',
        ...feats.map(
          (f) =>
            `| ${f.nome} | ${f.peso} | ${f.repos.slice(0, 3).map((r) => `\`${r}\``).join(', ')} | ${f.cards.join(', ') || '—'} |`
        )
      ].join('\n')
    : '_Sem sinal discriminante de feature na janela — ver `## Tarefas desenvolvidas` e `## Sinais`._'

  const topCards = d.cards.slice(0, 25)
  const cardsTable = topCards.length
    ? [
        '| Card | Escopo | Repos | PRs | Último PR |',
        '|------|--------|-------|-----|-----------|',
        ...topCards.map(
          (c) =>
            `| [#${c.card}](${BOARD}/${c.card}) | ${truncate(c.scopes[0] || '—', 70)} | ${c.repos.map((r) => `\`${r}\``).join(', ')} | ${c.prs} | ${c.last} |`
        )
      ].join('\n') +
      (d.cards.length > topCards.length
        ? `\n\n… e ${d.cards.length - topCards.length} card(s) anteriores na janela.`
        : '')
    : '_Nenhum PR da janela referencia card do board pelo título._'

  const sinais = [
    `- ${d.collected} PRs na janela (${d.merged} merged, ${d.open} abertos), ${d.mudancasLogicas} mudanças lógicas distintas.`,
    d.portPRs > 0
      ? `- ${d.portPRs} PRs (${portPct}%) são port entre branches, não trabalho novo.`
      : '- Nenhum PR de port entre branches na janela.',
    `- ${d.comCard} PRs referenciam card do board no título; ${d.semCard} não.`,
    `- Repo de maior atuação: \`${d.repos[0]?.repo ?? '—'}\` (${d.repos[0]?.prs ?? 0} PRs).`,
    status === 'inativo'
      ? `- **Sem PRs desde ${d.repos[0]?.last ?? '—'}** — histórico preservado, mas não é candidato ativo.`
      : null
  ]
    .filter(Boolean)
    .join('\n')

  const fontes = [
    `- Janela: \`${HISTORY_SINCE}\` .. \`${TODAY}\`.`,
    '- `gh api graphql` — `search(type: ISSUE)` com `is:pr author:<login> org:AGX-Software`.',
    '- Script: `.ai/skills/new-task/scripts/collect-prs.mjs`.',
    '- Roster: `.ai/references/roster-agx.md`.'
  ].join('\n')

  const md = [
    `# Perfil: ${meta.nome}`,
    '',
    yaml,
    '',
    '> Gerado por `new-task` (skill). `## Estilo de trabalho` e `## Notas manuais` são escritas à mão e preservadas no refresh. Identidade: [roster](../.ai/references/roster-agx.md).',
    ...(login === 'RafaelHDSV'
      ? [
          '',
          '> **Perfil operacional.** O dossiê de voz e calibração do Rafael é outro arquivo: [`.ai/perfil-rafael-vieira.md`](../.ai/perfil-rafael-vieira.md), lido por `perfil-rafael` e `linkedin-posts`. Este aqui tem os números e é lido por `new-task` e `triagem-tickets`.'
        ]
      : []),
    '',
    '## Repositórios por atuação',
    '',
    reposTable,
    '',
    '## Features / áreas por atuação',
    '',
    featTable,
    '',
    '## Tarefas desenvolvidas',
    '',
    cardsTable,
    '',
    '## Estilo de trabalho',
    '',
    estilo,
    '',
    '## Sinais',
    '',
    sinais,
    '',
    '## Fontes',
    '',
    fontes,
    '',
    '## Notas manuais',
    '',
    notas,
    ''
  ].join('\n')

  fs.writeFileSync(file, md, 'utf8')
  return { login, status, prs: d.collected, feats: feats.length, cards: d.cards.length }
}

const targets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : Object.keys(ROSTER)

for (const l of targets) {
  const r = build(l)
  console.log(
    `${r.login.padEnd(18)} ${r.status.padEnd(8)} PRs=${String(r.prs).padStart(4)} features=${String(r.feats).padStart(2)} cards=${String(r.cards).padStart(3)}`
  )
}
