import ReactECharts from 'echarts-for-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatBRL, formatDate, formatMonth } from '@/lib/format'

type Props = {
  monthly: Array<{ month: string; income: string | number; expense: string | number }>
  byCategory: Array<{ name: string; color?: string; total: string | number }>
  cashflow: Array<{ date: string; result: string | number }>
  /** Saldo do mês anterior — entra na 1ª barra de receitas (igual ao card Receitas). */
  openingBalance?: number
  loading?: boolean
}

function EmptyChart({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-center">
      <h3 className="mb-2 font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function DashboardCharts({
  monthly,
  byCategory,
  cashflow,
  openingBalance = 0,
  loading,
}: Props) {
  const narrow = useMediaQuery('(max-width: 639px)')
  const yAxisFontSize = narrow ? 10 : 12
  const gridLeft = narrow ? 36 : 48

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="col-span-full h-[300px] w-full" />
      </div>
    )
  }

  const carryIn = Number.isFinite(openingBalance) ? openingBalance : 0
  const chartMonthly =
    monthly.length === 0 && carryIn > 0
      ? [{ month: new Date().toISOString().slice(0, 7), income: carryIn, expense: 0 }]
      : monthly.map((m, i) =>
          i === 0 && carryIn !== 0
            ? { ...m, income: Number(m.income) + carryIn }
            : { ...m, income: Number(m.income), expense: Number(m.expense) },
        )

  const hasMonthly = chartMonthly.some((m) => Number(m.income) > 0 || Number(m.expense) > 0)
  const hasCategory = byCategory.some((c) => Number(c.total) > 0)
  const hasCashflow = cashflow.length > 0

  const bars = {
    backgroundColor: 'transparent',
    textStyle: { color: '#8b9aab' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ seriesName: string; value: number }>) =>
        params.map((p) => `${p.seriesName}: ${formatBRL(p.value)}`).join('<br/>'),
    },
    legend: {
      data: ['Receitas', 'Despesas'],
      top: 8,
      textStyle: { color: '#8b9aab' },
    },
    grid: { left: gridLeft, right: 16, top: 56, bottom: 30 },
    xAxis: { type: 'category', data: chartMonthly.map((m) => formatMonth(m.month)) },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: yAxisFontSize,
        formatter: (v: number) => formatBRL(v).replace(/\s/g, '\u00a0'),
      },
    },
    series: [
      {
        name: 'Receitas',
        type: 'bar',
        data: chartMonthly.map((m) => Number(m.income)),
        itemStyle: { color: '#3ddc97', borderRadius: [6, 6, 0, 0] },
      },
      {
        name: 'Despesas',
        type: 'bar',
        data: chartMonthly.map((m) => Number(m.expense)),
        itemStyle: { color: '#f07178', borderRadius: [6, 6, 0, 0] },
      },
    ],
  }

  const donut = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${p.name}: ${formatBRL(p.value)} (${p.percent.toFixed(1)}%)`,
    },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        label: { color: '#f2f5f7' },
        data: byCategory.map((c) => ({
          name: c.name,
          value: Number(c.total),
          itemStyle: { color: c.color || undefined },
        })),
      },
    ],
  }

  const line = {
    backgroundColor: 'transparent',
    textStyle: { color: '#8b9aab' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ axisValue: string; value: number }>) => {
        const p = params[0]
        return `${formatDate(p.axisValue)}<br/>Resultado: ${formatBRL(p.value)}`
      },
    },
    grid: { left: gridLeft, right: 16, top: 24, bottom: 30 },
    xAxis: {
      type: 'category',
      data: cashflow.map((b) => b.date),
      axisLabel: { formatter: (v: string) => formatDate(v) },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: yAxisFontSize,
        formatter: (v: number) => formatBRL(v).replace(/\s/g, '\u00a0'),
      },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: cashflow.map((b) => Number(b.result)),
        areaStyle: { color: 'rgba(61, 220, 151, 0.18)' },
        lineStyle: { color: '#3ddc97', width: 2 },
        itemStyle: { color: '#3ddc97' },
        showSymbol: false,
      },
    ],
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-2 font-medium">Receita × despesa</h3>
        {hasMonthly ? (
          <ReactECharts key={`bars-${narrow}`} option={bars} style={{ height: 280 }} />
        ) : (
          <EmptyChart title="Receita × despesa" message="Sem lançamentos nos últimos meses." />
        )}
      </div>
      <div>
        <h3 className="mb-2 font-medium">Gastos por categoria</h3>
        {hasCategory ? (
          <ReactECharts option={donut} style={{ height: 280 }} />
        ) : (
          <EmptyChart title="Gastos por categoria" message="Nenhuma despesa categorizada neste período." />
        )}
      </div>
      <div className="lg:col-span-2">
        <h3 className="mb-2 font-medium">Resultado no período</h3>
        {hasCashflow ? (
          <ReactECharts key={`line-${narrow}`} option={line} style={{ height: 260 }} />
        ) : (
          <EmptyChart title="Resultado no período" message="Cadastre transações para ver o resultado acumulado." />
        )}
      </div>
    </div>
  )
}
