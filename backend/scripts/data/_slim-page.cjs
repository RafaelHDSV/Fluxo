#!/usr/bin/env node
/**
 * Slim a Notion MCP query dump into partial-*.json
 * Usage: node _slim-page.js <raw.txt> <out.json>
 */
const fs = require('fs');

function slimRow(row) {
  return {
    url: row.url,
    Nome: row.Nome,
    Valor: row.Valor,
    data: row['date:Data:start'] ?? row.data ?? null,
    'Tipo de transação': row['Tipo de transação'],
    Tipo: row.Tipo,
    Pago: row.Pago,
    Categorias: row.Categorias,
  };
}

const [,, rawPath, outPath] = process.argv;
if (!rawPath || !outPath) {
  console.error('Usage: node _slim-page.js <raw.txt> <out.json>');
  process.exit(1);
}

const text = fs.readFileSync(rawPath, 'utf8');
const parsed = JSON.parse(text);
const results = (parsed.results || []).map(slimRow);
const out = {
  results,
  next_cursor: parsed.next_cursor ?? null,
  has_more: !!parsed.has_more,
};
fs.writeFileSync(outPath, JSON.stringify(out));
console.log(JSON.stringify({
  wrote: outPath,
  count: results.length,
  has_more: out.has_more,
  next_cursor: out.next_cursor,
  sample: results[0] || null,
}));
