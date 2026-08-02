#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const categories = [
  { url: 'https://app.notion.com/2eca29a59b098082913cdd6e53ad61a1', Nome: 'Alimentação' },
  { url: 'https://app.notion.com/2eca29a59b098098bcc4eeacf46636f3', Nome: 'Consumo & Compras' },
  { url: 'https://app.notion.com/2eca29a59b0980b78e96ea4c065dc469', Nome: 'Custos Fixos' },
  { url: 'https://app.notion.com/2eca29a59b0980c58c01e09f4556a385', Nome: 'Desenvolvimento Pessoal & Profissional' },
  { url: 'https://app.notion.com/2eca29a59b098087b7d4dbacf40a8988', Nome: 'Estilo de Vida & Lazer' },
  { url: 'https://app.notion.com/2eca29a59b09800d8ec3ea0201349c66', Nome: 'Financeiro Estratégico' },
  { url: 'https://app.notion.com/2eca29a59b0980819dccc8cd757b6f04', Nome: 'Outros' },
  { url: 'https://app.notion.com/2eca29a59b098028b54fc43dbd525e0a', Nome: 'Social & Afetivo' },
  { url: 'https://app.notion.com/2eca29a59b0980b78fa3f1cc24b46f92', Nome: 'Transporte & Mobilidade' },
];

function loadPartials(prefix) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
    .sort((a, b) => {
      const na = parseInt(a.match(/(\d+)\.json$/)?.[1] ?? '0', 10);
      const nb = parseInt(b.match(/(\d+)\.json$/)?.[1] ?? '0', 10);
      return na - nb;
    });
  const rows = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const list = data.results || [];
    console.log(f, list.length);
    rows.push(...list);
  }
  return rows;
}

const gastosRaw = loadPartials('partial-gastos-');
const ganhosRaw = loadPartials('partial-ganhos-');

const byUrl = new Map();
for (const row of [...gastosRaw, ...ganhosRaw]) {
  if (!row?.url) continue;
  if (!byUrl.has(row.url)) byUrl.set(row.url, row);
}

const transactions = [...byUrl.values()];
const ganhos = transactions.filter((t) => t['Tipo de transação'] === 'Ganhos').length;
const gastos = transactions.filter((t) => t['Tipo de transação'] === 'Gastos').length;
const other = transactions.length - ganhos - gastos;

const out = {
  categories,
  transactions,
  meta: {
    total: transactions.length,
    ganhos,
    gastos,
    other,
    raw_gastos_pages: gastosRaw.length,
    raw_ganhos_pages: ganhosRaw.length,
    deduped_away: gastosRaw.length + ganhosRaw.length - transactions.length,
  },
};

const outPath = path.join(dir, 'notion-financeiro.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.meta, null, 2));
console.log('wrote', outPath);
