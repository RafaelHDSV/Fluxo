import ReactECharts from 'echarts-for-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL, formatDate, formatMonth } from '@/lib/format'

type Props = {
  monthly: Array<{ month: string; income: string | number; expense: string | number }>
  byCategory: Array<{ name: string; color?: string; total: string | number }>
  balanceSeries: Array<{ date: string; balance: string | number }>
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

export function DashboardCharts({ monthly, byCategory, balanceSeries, loading }: Props) {
  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="col-span-full h-[300px] w-full" />
      </div>
    )
  }

  const hasMonthly = monthly.some((m) => Number(m.income) > 0 || Number(m.expense) > 0)
  const hasCategory = byCategory.some((c) => Number(c.total) > 0)
  const hasBalance = balanceSeries.length > 0

  const bars = {
    backgroundColor: 'transparent',
    textStyle: { color: '#8b9aab' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ seriesName: string; value: number }>) =>
        params
          .map((p) => `${p.seriesName}: ${formatBRL(p.value)}`)
          .join('<br/>'),
    },
    legend: { data: ['Receitas', 'Despesas'], textStyle: { color: '#8b9aab' } },
    grid: { left: 48, right: 16, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: monthly.map((m) => formatMonth(m.month)) },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => formatBRL(v).replace(/\s/g, '\u00a0') },
    },
    series: [
      {
        name: 'Receitas',
        type: 'bar',
        data: monthly.map((m) => Number(m.income)),
        itemStyle: { color: '#3ddc97', borderRadius: [6, 6, 0, 0] },
      },
      {
        name: 'Despesas',
        type: 'bar',
        data: monthly.map((m) => Number(m.expense)),
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
        return `${formatDate(p.axisValue)}<br/>Saldo: ${formatBRL(p.value)}`
      },
    },
    grid: { left: 48, right: 16, top: 24, bottom: 30 },
    xAxis: {
      type: 'category',
      data: balanceSeries.map((b) => b.date),
      axisLabel: { formatter: (v: string) => formatDate(v) },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => formatBRL(v).replace(/\s/g, '\u00a0') },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: balanceSeries.map((b) => Number(b.balance)),
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
          <ReactECharts option={bars} style={{ height: 280 }} />
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
        <h3 className="mb-2 font-medium">Evolução do saldo</h3>
        {hasBalance ? (
          <ReactECharts option={line} style={{ height: 260 }} />
        ) : (
          <EmptyChart title="Evolução do saldo" message="Cadastre transações para ver a evolução." />
        )}
      </div>
    </div>
  )
}
