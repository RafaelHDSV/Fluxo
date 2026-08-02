# Diagnóstico Notion → Fluxo (gap analysis)

**Data:** 2026-08-02  
**Escopo:** só diagnóstico — sem importação, sem mudança de schema/UI nesta entrega.  
**Fonte Notion:** hub [Financeiro](https://app.notion.com/p/14cb8c951bbd423893cff1b656351391)  
**Alvo Fluxo:** tabelas `fluxo_*` + telas do MVP (`docs/superpowers/specs/2026-08-02-fluxo-mvp-design.md`, `backend/migrations/001_fluxo_schema.sql`)  
**Consulta Notion:** readonly em 2026-08-02

---

## 1. Resumo executivo

O Notion já funciona como **sistema operacional financeiro completo**: lançamentos tipados (Ganhos/Gastos), meio de pagamento (Crédito/Débito), checkbox **Pago** com view **A Pagar**, conta (Banco), categorias com orçamento vs realizado (mês/ano/geral), e dimensão **Meses** com rollups de saldo.

O Fluxo MVP cobre o **núcleo operacional** — contas tipadas, categorias, transações (`income|expense|transfer|adjustment`), orçamentos mensais por categoria, metas, importação CSV/OFX e dashboard/relatórios via BFF + ECharts.

**Não replica hoje:** status de pagamento (`Pago` / fila A Pagar), taxonomia real do Notion (seed genérico distinto), dimensão explícita Crédito/Débito como no Notion (há `credit_card` e `card_account_id`, mas o uso diário Notion é select por lançamento), nem as dezenas de fórmulas/rollups — no Fluxo isso vira agregação no BFF.

Conclusão: o produto cobre o caminho feliz de registro e análise; o gap crítico para paridade de hábito é **taxonomia + orçamentos reais** e, em seguida, **estado pago / a pagar**.

---

## 2. Inventário Notion

### 2.1 Hub e bases

| DB | URL | Papel |
|----|-----|--------|
| Financeiro | [collection](https://app.notion.com/p/182a29a59b0980ddab75f823b094de08) | Lançamentos (fonte primária) |
| Bancos | [collection](https://app.notion.com/p/be03cd8e65154c18be4d5a3557cabf6f) | Contas + rollups ganhos/gastos/saldo |
| Categorias | [collection](https://app.notion.com/p/2e6ea915008e4a528e9480f14a8b030e) | Taxonomia + orçamento mensal + % realizado |
| Meses | [collection](https://app.notion.com/p/253a29a59b098059a99adae2b02beea9) | Dimensão calendário (Ano + Mês) + rollups |

Também no hub (fora do núcleo de lançamentos): linked views de **Ganhos** (mesmo data source Financeiro) e **Wishlist** (itens com Preço / Valor Guardado / Progresso — candidato a metas ou desejo de compra, não inventariado linha a linha).

### 2.2 Volume (Financeiro)

| Métrica | Contagem |
|---------|----------|
| Total de lançamentos | **1.196** |
| Ganhos | 157 |
| Gastos | 1.039 |
| Gastos · Crédito | 334 |
| Gastos · Débito | 705 |
| Com `Pago` = sim | 517 |
| Com `Pago` = não / vazio | 679 |

### 2.3 Bancos

| Nome | Tipo |
|------|------|
| Santander | Bancos |

Uma única conta bancária ativa no DB Bancos (`Tipo = Bancos`).

### 2.4 Categorias (com Orçamento Mensal)

| Categoria | Orçamento Mensal |
|-----------|------------------|
| Alimentação | R$ 500 |
| Consumo & Compras | R$ 500 |
| Custos Fixos | R$ 500 |
| Desenvolvimento Pessoal & Profissional | R$ 500 |
| Estilo de Vida & Lazer | R$ 500 |
| Financeiro Estratégico | R$ 500 |
| Outros | R$ 500 |
| Social & Afetivo | R$ 500 |
| Transporte & Mobilidade | R$ 500 |

Todas com **R$ 500** — provável placeholder uniforme, não orçamento calibrado.

### 2.5 Meses

- **44** páginas · **4** anos distintos (views 2024–2027 + Geral).
- Propriedades: `Nome`, `Ano`, `Mês` (select), relations para Financeiro, rollups Ganhos/Gastos, fórmula Saldo.

### 2.6 Propriedades do lançamento (Financeiro)

| Propriedade | Tipo Notion | Observação |
|-------------|-------------|------------|
| Nome | title | Descrição do lançamento |
| Valor | number (real) | Valor absoluto |
| Data | date | Data do fato |
| Tipo de transação | select | Ganhos / Gastos |
| Tipo | select | Crédito / Débito |
| Pago | checkbox | Base da view A Pagar |
| Banco | relation → Bancos | Limite 1 |
| Categorias | relation → Categorias | Limite 1 |
| Mês | relation → Meses | Limite 1 |
| Ganhos / Gastos / … por mês | formula | Dezenas; várias não queryáveis via SQL MCP |

### 2.7 Views relevantes (Financeiro)

| View | Filtros / comportamento |
|------|-------------------------|
| Gastos | Tipo = Gastos · Data no mês corrente |
| Gastos Mês | Tipo = Gastos · últimos 2 meses |
| Gastos totais | Tipo = Gastos · group by mês da Data |
| **A Pagar** | Gastos · mês corrente · **Pago = false** |

### 2.8 Views Categorias

| View | Conteúdo |
|------|----------|
| Categorias | Gastos mensal formatado × Orçamento Mensal × Porcentagem |
| Categorias por Ano | Gastos anuais × orçamento anual (fórmula) |
| Categorias Gerais | Total histórico por categoria |

---

## 3. Mapa campo a campo (Notion → Fluxo)

### 3.1 Lançamento

| Notion | Fluxo | Status |
|--------|-------|--------|
| Nome | `fluxo_transactions.description` | Mapeável |
| Valor | `fluxo_transactions.amount` (≥ 0) | Mapeável (sinal via `type`) |
| Data | `fluxo_transactions.date` | Mapeável |
| Tipo de transação = Ganhos | `type = income` | Mapeável |
| Tipo de transação = Gastos | `type = expense` | Mapeável |
| — (inexistente) | `type = transfer` | Só no Fluxo |
| — (inexistente) | `type = adjustment` | Só no Fluxo |
| Tipo = Crédito / Débito | sem campo 1:1; aproximação: conta `credit_card` e/ou `card_account_id` | **Gap** |
| Pago | sem equivalente | **Gap** |
| Banco | `fluxo_accounts` (`account_id`) | Mapeável (1 conta hoje) |
| Categorias | `fluxo_categories` (`category_id`) | Mapeável com remapeamento de nomes |
| Mês | derivado de `date` (YYYY-MM) | Redundante no Fluxo |
| Fórmulas Ganhos/Gastos… | agregações BFF / relatórios | Paridade via queries, não por fórmula |

### 3.2 Contas (Bancos)

| Notion | Fluxo | Status |
|--------|-------|--------|
| Nome | `fluxo_accounts.name` | Mapeável |
| Tipo = Bancos | `type = checking` (candidato) | Mapeável com decisão |
| Tipo = Meses | não é conta real no Fluxo | Ignorar / legado Notion |
| Rollups Ganhos/Gastos/Saldo | saldo em `balance` + somas no BFF | Paridade parcial |

### 3.3 Categorias e orçamento

| Notion | Fluxo | Status |
|--------|-------|--------|
| Nome | `fluxo_categories.name` | Nomes **divergem** do seed |
| Orçamento Mensal | `fluxo_budgets.amount_limit` + `month` | Notion: valor “template” na categoria; Fluxo: linha por mês |
| Rollups Gastos Mensal/Ano/% | `reports` / dashboard | Paridade via agregação |

### 3.4 Seed Fluxo vs taxonomia Notion

| Seed Fluxo (`fluxo_handle_new_user`) | Notion |
|--------------------------------------|--------|
| Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Assinaturas, Investimentos, Dívidas, Viagens, Outros, Salário, Freelance | Alimentação, Consumo & Compras, Custos Fixos, Desenvolvimento Pessoal & Profissional, Estilo de Vida & Lazer, Financeiro Estratégico, Outros, Social & Afetivo, Transporte & Mobilidade |

Sobreposições parciais: Alimentação, Outros, Transporte≈Transporte & Mobilidade, Lazer≈Estilo de Vida & Lazer, Educação≈Desenvolvimento Pessoal & Profissional. O restante exige criação ou remapeamento.

### 3.5 Telas Fluxo (MVP) vs hábito Notion

| Hábito Notion | Tela Fluxo | Cobertura |
|---------------|------------|-----------|
| Lista Gastos / Gastos totais | Transações + filtros | Parcial (sem Pago) |
| A Pagar | — | **Ausente** |
| Gallery Bancos | Contas | Parcial (sem rollups de UI Notion) |
| Gallery Categorias orçamento×realizado | Orçamentos + Dashboard | Parcial |
| Cards Meses por ano | Relatórios / dashboard por período | Parcial (sem DB Meses) |
| Metas | Metas | Só no Fluxo (não no hub inventariado) |
| Import CSV/OFX | Importações | Só no Fluxo |

---

## 4. Gaps e riscos

| # | Gap | Risco / impacto |
|---|-----|-----------------|
| G1 | Taxonomia seed ≠ categorias Notion | Import/migração categoriza errado; usuário não reconhece o produto como “seu” financeiro |
| G2 | Orçamentos Notion todos R$ 500 | Migrar valores literais produz orçamento falso; calibração manual necessária |
| G3 | Checkbox `Pago` + view A Pagar | Fluxo trata todo lançamento como realizado; perde fluxo de contas a pagar do mês |
| G4 | Crédito/Débito por lançamento vs `credit_card` / `card_account_id` | Sem modelo explícito, relatórios por meio de pagamento e fatura de cartão ficam ambíguos |
| G5 | Dimensão Meses | Redundante com `date`; manter sync Notion→Meses é custo morto no Fluxo |
| G6 | Transferências / ajustes só no Fluxo | Notion não tem o conceito; migração não cria transfers — ok, mas histórico Notion não modela entre contas |
| G7 | Fórmulas/rollups Notion vs BFF | Paridade analítica depende de endpoints de relatório, não de portar fórmulas |
| G8 | Volume ~1,2k linhas | Importação futura precisa dedupe (`dedupe_hash`) e mapeamento estável de categoria/conta |
| G9 | Uma conta Santander | Simples no MVP; se cartão for só “Tipo=Crédito” sem conta cartão, saldo de conta corrente fica misturado |

---

## 5. Recomendações priorizadas (produto — para depois)

| Prioridade | Recomendação | Motivo |
|------------|--------------|--------|
| **P0** | Alinhar categorias reais do Notion (criar/renomear) e **recalibrar** orçamentos mensais (não copiar R$ 500 cegamente) | Sem taxonomia familiar, o resto do produto não engaja |
| **P1** | Status `paid` (ou equivalente) em transações + filtro/view **A Pagar** | Fecha o gap de hábito mais visível do hub |
| **P1** | Definir modelo de **Crédito/Débito**: campo `payment_method` **ou** conta cartão + `card_account_id` consistente | Destrava relatórios e saldo corretos |
| **P2** | Importação/migração Notion (CSV export ou sync) — fora da execução deste artefato | Volume já justifica pipeline; depende de P0/P1 |
| **P3** | Avaliar Wishlist do hub (Preço, Valor Guardado, Progresso) vs `fluxo_goals` | Há overlap conceitual com metas; decidir se vira import, feature separada ou fica só no Notion |

---

## 6. Fora de escopo deste artefato

- Migração ou carga de dados Notion → Supabase  
- Sync via Notion API  
- Mudanças de schema, seed, BFF ou UI  
- Commit/push deste diagnóstico (salvo pedido explícito)

---

## Referências

- Hub Notion: https://app.notion.com/p/14cb8c951bbd423893cff1b656351391  
- Spec MVP: `docs/superpowers/specs/2026-08-02-fluxo-mvp-design.md`  
- Schema: `backend/migrations/001_fluxo_schema.sql`  
- Contexto: `docs/context.md` · Especificação: `docs/especificacao.md`
