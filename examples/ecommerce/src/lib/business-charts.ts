import type { EChartsOption } from '@/lib/charts'
import type { Theme } from '@/hooks/use-theme'

export function businessChart(theme: Theme, names: string[], values: number[], type: 'line' | 'bar' = 'bar'): EChartsOption {
  const text = theme === 'dark' ? '#b2c6ba' : '#52645a'
  const primary = theme === 'dark' ? '#b8e48b' : '#24644b'
  return {
    animation: false,
    grid: { top: 12, left: type === 'bar' ? 72 : 48, right: 22, bottom: 24 },
    tooltip: { trigger: 'axis', renderMode: 'richText' },
    xAxis: type === 'bar' ? { type: 'value', splitNumber: 3, axisLabel: { color: text, formatter: value => value >= 10000 ? `${+(value / 10000).toFixed(1)}万` : String(value) }, splitLine: { show: false } } : { type: 'category', data: names, axisLabel: { color: text, hideOverlap: true }, axisTick: { show: false } },
    yAxis: type === 'bar' ? { type: 'category', data: names, inverse: true, axisLabel: { color: text }, axisLine: { show: false }, axisTick: { show: false } } : { type: 'value', splitNumber: 3, axisLabel: { color: text }, splitLine: { lineStyle: { color: theme === 'dark' ? '#2c3d34' : '#e4eae4' } } },
    series: [{ type, data: values, symbol: 'none', barMaxWidth: 18, itemStyle: { color: primary, borderRadius: [0, 3, 3, 0] }, lineStyle: { width: 2, color: primary }, areaStyle: { color: primary, opacity: 0.08 } }],
  }
}
