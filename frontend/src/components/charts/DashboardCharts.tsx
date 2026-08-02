import ReactECharts from 'echarts-for-react'
import { formatBRL } from '../../lib/format'

type Props = {
  monthly: Array<{ month: string; income: string | number; expense: string | number }>
  byCategory: Array<{ name: string; color?: string; total: string | number }>
  balanceSeries: Array<{ date: string; balance: string | number }>
}

export function DashboardCharts({ monthly, byCategory, balanceSeries }: Props) {
  const bars = {
    backgroundColor: 'transparent',
    textStyle: { color: '#8b9aab' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['Receitas', 'Despesas'], textStyle: { color: '#8b9aab' } },
    grid: { left: 40, right: 16, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: monthly.map((m) => m.month) },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${Math.round(v / 1000)}k` } },
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
        `${p.name}: ${formatBRL(p.value)} (${p.percent}%)`,
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
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 16, top: 24, bottom: 30 },
    xAxis: { type: 'category', data: balanceSeries.map((b) => b.date) },
    yAxis: { type: 'value' },
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
    <>
      <div>
        <h3 style={{ marginBottom: '0.5rem' }}>Receita × despesa</h3>
        <ReactECharts option={bars} style={{ height: 280 }} />
      </div>
      <div>
        <h3 style={{ marginBottom: '0.5rem' }}>Gastos por categoria</h3>
        <ReactECharts option={donut} style={{ height: 280 }} />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Evolução do saldo</h3>
        <ReactECharts option={line} style={{ height: 260 }} />
      </div>
    </>
  )
}
