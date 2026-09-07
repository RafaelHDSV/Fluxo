import { Router } from 'express'
import { effectiveDateSql } from '../../lib/creditCycle.js'
import { query, queryOne } from '../../lib/db.js'
import { T } from '../../lib/tables.js'
import { toNumber } from '../../lib/money.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const EFF = effectiveDateSql()
const EFF_T = effectiveDateSql('t')

function currentMonthBounds() {
  const now = new Date()
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const to = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`
  return { from, to }
}

function resolvePeriod(query: Record<string, unknown>): { from: string | null; to: string | null; period: string } {
  const period = typeof query.period === 'string' ? query.period : 'month'
  const now = new Date()
  const yearRaw = typeof query.year === 'string' ? Number(query.year) : now.getFullYear()
  const monthRaw = typeof query.month === 'string' ? Number(query.month) : now.getMonth() + 1
  const year = Number.isFinite(yearRaw) ? Math.trunc(yearRaw) : now.getFullYear()
  const month = Number.isFinite(monthRaw) ? Math.min(12, Math.max(1, Math.trunc(monthRaw))) : now.getMonth() + 1

  if (period === 'all') return { from: null, to: null, period: 'all' }
  if (period === 'year') {
    return { from: `${year}-01-01`, to: `${year}-12-31`, period: 'year' }
  }
  const last = new Date(year, month, 0)
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  return { from, to, period: 'month' }
}

router.get('/dashboard', async (req, res) => {
  const bounds = resolvePeriod(req.query as Record<string, unknown>)
  const fallback = currentMonthBounds()
  const from = bounds.from ?? '2000-01-01'
  const to = bounds.to ?? '2100-12-31'
  const userId = req.userId
  const now = new Date()

  const balanceRow = await queryOne<{ sum: string }>(
    `select coalesce(sum(balance),0) as sum from ${T.accounts}
     where user_id = $1 and archived = false and type <> 'credit_card'`,
    [userId],
  )
  const accountBalance = toNumber(balanceRow?.sum)

  // Âncora: saldo das contas (editável / atualizado via OFX LEDGERBAL).
  // Não usar soma histórica de lançamentos — Notion/import incompleto distorce o carryover.
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const periodIncludesToday =
    bounds.period !== 'all' && Boolean(bounds.from && bounds.to && bounds.from <= today && bounds.to >= today)

  let openingBalance = 0
  let closingBalance = accountBalance
  let balancesFromAccounts = false

  if (bounds.period === 'all') {
    openingBalance = 0
    closingBalance = accountBalance
  } else if (periodIncludesToday) {
    // Saldo inicial = saldo atual das contas − movimento de caixa do período.
    // Usa `date` (não vencimento do crédito): cartão não mexe na conta corrente.
    // Mesma janela do card de despesas do mês (`from`→`to`), para bater com o total exibido.
    const cashNet = await queryOne<{ sum: string }>(
      `select coalesce(sum(case
         when type = 'income' then amount
         when type = 'adjustment' then amount
         when type = 'expense' and paid = true
           and coalesce(payment_method, 'debit') <> 'credit' then -amount
         when type = 'transfer' and goal_id is not null
           and coalesce(goal_direction, 'to_goal') = 'from_goal' then amount
         when type = 'transfer' and goal_id is not null then -amount
         else 0 end), 0) as sum
       from ${T.transactions}
       where user_id = $1 and date between $2::date and $3::date`,
      [userId, from, to],
    )
    openingBalance = accountBalance - toNumber(cashNet?.sum)
    balancesFromAccounts = true
  } else {
    // Mês/ano passado: sem âncora confiável no ledger Notion — não inventar saldo inicial
    openingBalance = Number.NaN
    closingBalance = Number.NaN
  }

  const monthAgg = await queryOne<{
    income: string
    expense: string
    adjustments: string
    goal_transfers: string
  }>(
    `select
      coalesce(sum(case when type = 'income' then amount else 0 end),0) as income,
      coalesce(sum(case when type = 'expense' and paid = true then amount else 0 end),0) as expense,
      coalesce(sum(case when type = 'adjustment' then amount else 0 end),0) as adjustments,
      coalesce(sum(case
        when type = 'transfer' and goal_id is not null
          and coalesce(goal_direction, 'to_goal') = 'from_goal' then amount
        when type = 'transfer' and goal_id is not null then -amount
        else 0 end),0) as goal_transfers
     from ${T.transactions}
     where user_id = $1 and ${EFF} between $2 and $3`,
    [userId, from, to],
  )

  const income = toNumber(monthAgg?.income)
  const expense = toNumber(monthAgg?.expense)
  const adjustments = toNumber(monthAgg?.adjustments)
  const goalTransfers = toNumber(monthAgg?.goal_transfers)
  // Aporte (to_goal) reduz o resultado; resgate aumenta — sem misturar com Despesas
  const result = income - expense + goalTransfers
  if (balancesFromAccounts || bounds.period === 'all') {
    closingBalance = openingBalance + result + adjustments
  }
  const savingsRate = income > 0 ? (result / income) * 100 : 0

  const cashflowOpening = Number.isFinite(openingBalance) ? openingBalance : 0

  const byCategory = await query(
    `select c.name, c.color, coalesce(sum(t.amount),0) as total
     from ${T.transactions} t
     join ${T.categories} c on c.id = t.category_id
     where t.user_id = $1 and t.type = 'expense' and t.paid = true and ${EFF_T} between $2 and $3
     group by c.name, c.color
     order by total desc
     limit 8`,
    [userId, from, to],
  )

  const monthly = await query(
    `select to_char(date_trunc('month', (${EFF})::timestamp), 'YYYY-MM') as month,
      coalesce(sum(case when type = 'income' then amount else 0 end),0) as income,
      coalesce(sum(case when type = 'expense' and paid = true then amount else 0 end),0) as expense
     from ${T.transactions}
     where user_id = $1 and ${EFF} between $2 and $3
     group by 1
     order by 1`,
    [userId, from, to],
  )

  const periodCashflowRaw = await query<{ date: string; result: string }>(
    `select d::text as date,
      ($4::numeric + sum(daily) over (order by d)) as result
     from (
       select (${EFF})::date as d,
         coalesce(sum(case
           when type = 'income' then amount
           when type = 'expense' and paid = true then -amount
           when type = 'adjustment' then amount
           when type = 'transfer' and goal_id is not null
             and coalesce(goal_direction, 'to_goal') = 'from_goal' then amount
           when type = 'transfer' and goal_id is not null then -amount
           else 0 end), 0) as daily
       from ${T.transactions}
       where user_id = $1 and ${EFF} between $2 and $3
       group by (${EFF})::date
     ) s
     order by d`,
    [userId, from, to, cashflowOpening],
  )
  // Garante ponto inicial no gráfico mesmo sem lançamentos no período
  const periodCashflow =
    bounds.period === 'all' || !Number.isFinite(openingBalance)
      ? periodCashflowRaw
      : periodCashflowRaw.length === 0 || periodCashflowRaw[0]?.date !== from
        ? [{ date: from, result: String(cashflowOpening) }, ...periodCashflowRaw]
        : periodCashflowRaw

  const upcomingCards = await query(
    `select id, name, due_day, credit_limit, balance
     from ${T.accounts}
     where user_id = $1 and type = 'credit_card' and archived = false and due_day is not null
     order by due_day`,
    [userId],
  )

  const budgetMonth = bounds.period === 'month' ? from : fallback.from
  const budgets = await query(
    `select b.*, c.name as category_name,
      coalesce((
        select sum(t.amount) from ${T.transactions} t
        where t.user_id = b.user_id and t.category_id = b.category_id and t.type = 'expense'
          and t.paid = true
          and date_trunc('month', (${EFF_T})::timestamp) = date_trunc('month', b.month::timestamp)
      ),0) as spent
     from ${T.budgets} b
     join ${T.categories} c on c.id = b.category_id
     where b.user_id = $1 and b.month = $2::date`,
    [userId, budgetMonth],
  )

  const alerts = (budgets as Array<{ category_name: string; spent: string; amount_limit: string }>)
    .map((b) => {
      const spent = toNumber(b.spent)
      const limit = toNumber(b.amount_limit)
      const pct = limit > 0 ? (spent / limit) * 100 : 0
      if (pct >= 100) {
        return { level: 'danger', message: `Orçamento de ${b.category_name} estourado (${pct.toFixed(0)}%)` }
      }
      if (pct >= 80) {
        return { level: 'warning', message: `Orçamento de ${b.category_name} em ${pct.toFixed(0)}%` }
      }
      return null
    })
    .filter(Boolean)

  const goals = await query(`select * from ${T.goals} where user_id = $1 order by created_at desc limit 5`, [
    userId,
  ])

  const prevFromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevToDate = new Date(now.getFullYear(), now.getMonth(), 0)
  const prevFrom = `${prevFromDate.getFullYear()}-${String(prevFromDate.getMonth() + 1).padStart(2, '0')}-01`
  const prevTo = `${prevToDate.getFullYear()}-${String(prevToDate.getMonth() + 1).padStart(2, '0')}-${String(prevToDate.getDate()).padStart(2, '0')}`

  const prevAgg = await queryOne<{ income: string; expense: string }>(
    `select
      coalesce(sum(case when type = 'income' then amount else 0 end),0) as income,
      coalesce(sum(case when type = 'expense' and paid = true then amount else 0 end),0) as expense
     from ${T.transactions}
     where user_id = $1 and ${EFF} between $2 and $3`,
    [userId, prevFrom, prevTo],
  )
  const previousIncome = toNumber(prevAgg?.income)
  const previousExpense = toNumber(prevAgg?.expense)
  const incomeDeltaPct =
    previousIncome > 0 ? ((income - previousIncome) / previousIncome) * 100 : income > 0 ? 100 : null
  const expenseDeltaPct =
    previousExpense > 0 ? ((expense - previousExpense) / previousExpense) * 100 : expense > 0 ? 100 : null

  const unpaidRow = await queryOne<{ count: string; total: string }>(
    `select count(*)::text as count, coalesce(sum(amount),0) as total
     from ${T.transactions}
     where user_id = $1 and type = 'expense' and paid = false and ${EFF} between $2 and $3`,
    [userId, bounds.period === 'all' ? from : bounds.from ?? fallback.from, bounds.period === 'all' ? to : bounds.to ?? fallback.to],
  )

  res.json({
    period: { from: bounds.from, to: bounds.to, mode: bounds.period },
    balance: accountBalance,
    openingBalance: Number.isFinite(openingBalance) ? openingBalance : null,
    closingBalance: Number.isFinite(closingBalance) ? closingBalance : null,
    balancesAnchored: balancesFromAccounts || bounds.period === 'all',
    income,
    expense,
    adjustments,
    goalTransfers,
    result,
    savingsRate,
    previousIncome,
    previousExpense,
    incomeDeltaPct,
    expenseDeltaPct,
    unpaidCount: Number(unpaidRow?.count ?? 0),
    unpaidTotal: toNumber(unpaidRow?.total),
    byCategory,
    monthly,
    periodCashflow,
    balanceSeries: periodCashflow,
    upcomingCards,
    budgets,
    alerts,
    goals,
  })
})

router.get('/calendar', async (req, res) => {
  const yearRaw = typeof req.query.year === 'string' ? Number(req.query.year) : new Date().getFullYear()
  const year = Number.isFinite(yearRaw) ? Math.trunc(yearRaw) : new Date().getFullYear()
  const from = `${year}-01-01`
  const to = `${year}-12-31`
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const months = await query<{ month: string; income: string; expense: string }>(
    `select to_char(date_trunc('month', (${EFF})::timestamp), 'YYYY-MM') as month,
      coalesce(sum(case when type = 'income' then amount else 0 end),0) as income,
      coalesce(sum(case when type = 'expense' and paid = true then amount else 0 end),0) as expense
     from ${T.transactions}
     where user_id = $1 and ${EFF} between $2 and $3
     group by 1
     order by 1`,
    [req.userId, from, to],
  )

  const byMonth = new Map(months.map((m) => [m.month, m]))
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const filled = Array.from({ length: 12 }, (_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, '0')}`
    const row = byMonth.get(month)
    const income = toNumber(row?.income)
    const expense = toNumber(row?.expense)
    return {
      month,
      label: monthNames[i],
      income,
      expense,
      result: income - expense,
      isCurrent: month === currentMonth,
    }
  })

  const totals = filled.reduce(
    (acc, m) => ({
      income: acc.income + m.income,
      expense: acc.expense + m.expense,
      result: acc.result + m.result,
    }),
    { income: 0, expense: 0, result: 0 },
  )

  res.json({ year, months: filled, totals })
})

router.get('/summary', async (req, res) => {
  const from = typeof req.query.from === 'string' ? req.query.from : currentMonthBounds().from
  const to = typeof req.query.to === 'string' ? req.query.to : currentMonthBounds().to
  const accountId = typeof req.query.account_id === 'string' ? req.query.account_id : null
  const categoryId = typeof req.query.category_id === 'string' ? req.query.category_id : null
  const tag = typeof req.query.tag === 'string' ? req.query.tag : null

  const totals = await queryOne(
    `select
      coalesce(sum(case when type = 'income' then amount else 0 end),0) as income,
      coalesce(sum(case when type = 'expense' and paid = true then amount else 0 end),0) as expense,
      count(*)::int as count
     from ${T.transactions}
     where user_id = $1 and ${EFF} between $2 and $3
       and ($4::uuid is null or account_id = $4)
       and ($5::uuid is null or category_id = $5)
       and ($6::text is null or $6 = any(tags))`,
    [req.userId, from, to, accountId, categoryId, tag],
  )

  const byCategory = await query(
    `select c.name, t.type, coalesce(sum(t.amount),0) as total
     from ${T.transactions} t
     join ${T.categories} c on c.id = t.category_id
     where t.user_id = $1 and ${EFF_T} between $2 and $3
       and (t.type <> 'expense' or t.paid = true)
       and ($4::uuid is null or t.account_id = $4)
       and ($5::uuid is null or t.category_id = $5)
       and ($6::text is null or $6 = any(t.tags))
     group by c.name, t.type
     order by total desc`,
    [req.userId, from, to, accountId, categoryId, tag],
  )

  const byAccount = await query(
    `select a.name, t.type, coalesce(sum(t.amount),0) as total
     from ${T.transactions} t
     join ${T.accounts} a on a.id = t.account_id
     where t.user_id = $1 and ${EFF_T} between $2 and $3
       and (t.type <> 'expense' or t.paid = true)
       and ($4::uuid is null or t.account_id = $4)
       and ($5::uuid is null or t.category_id = $5)
       and ($6::text is null or $6 = any(t.tags))
     group by a.name, t.type
     order by total desc`,
    [req.userId, from, to, accountId, categoryId, tag],
  )

  res.json({ period: { from, to }, totals, byCategory, byAccount })
})

export default router
