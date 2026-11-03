# Regras de negócio

> **Para que serve:** algoritmos e regras do domínio que a IA não deve reinventar
> **Fonte da verdade:** módulos de domínio no código
> **Relacionados:** [especificacao](especificacao.md) · [api](api.md) · [banco-de-dados](banco-de-dados.md)

## Regras

1. Auth obrigatória (Supabase e-mail/senha)
2. Express BFF + Supabase Postgres
3. Moeda BRL; **Open Finance fora** (custo de agregador)
4. Gráficos: Apache ECharts
5. Tailwind + shadcn com tema dark/light
6. **Entrada de dados:** lançamento **manual** no dia a dia. Importação CSV/OFX permanece como legado (Santander descontinuou o internet banking / OFX)
7. Orçamentos = categorias + metas de gasto; **regras de rename/categoria ficam em Importações**
8. Investimentos = ex-Metas (`fluxo_goals`) — caixinhas com progresso (CRUD em Investimentos); aporte/resgate via **transferência** com `goal_id` + `goal_direction` — **não** entra em Despesas/Receitas; move o saldo da conta (âncora)
9. Notion foi carga inicial histórica; **não é fonte operacional**
10. **Saldo das contas** é a âncora (editável em Contas; OFX `LEDGERBAL` só se ainda importar). Receita/ajuste e despesa **paga** (débito ou crédito) movem o saldo; marcar/desmarcar pago **reaplica** o delta. No crédito, `account_id` = conta que paga a fatura (se estiver no cartão, o backend redireciona para a corrente). Saldo inicial do mês = saldo atual − movimento de caixa do período (data efetiva, despesas pagas + caixinhas)
11. Importaç
