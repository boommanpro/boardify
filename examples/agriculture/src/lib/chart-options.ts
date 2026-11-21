import type { EChartsOption } from '@/lib/charts'

// 大屏暗色统一色板（hex，规避 oklch 与 zrender 兼容问题）
export const palette = {
  text: '#f3efe3',
  faint: '#a0b5b5',
  axis: '#2a454a',
  primary: '#dbb96c',
  area: 'rgba(219, 185, 108, 0.16)',
  series: ['#dbb96c', '#729b95', '#b7c9be', '#947c53', '#466c76', '#e9ddbd'],
  panelBorder: '#2a454a',
}

export function trendOption(names: string[], values: number[], unit: string, accent = palette.primary): EChartsOption {
  return {
    animation: false,
    grid: { top: 26, left: 8, right: 18, bottom: 4, containLabel: true },
    tooltip: { trigger: 'axis', valueFormatter: value => `${Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 4 })} ${unit}` },
    xAxis: { type: 'category', data: names, axisLine: { lineStyle: { color: palette.axis } }, axisTick: { show: false }, axisLabel: { color: palette.text, fontSize: 11 } },
    yAxis: { type: 'value', name: unit, nameTextStyle: { color: palette.faint, fontSize: 11 }, splitNumber: 3, axisLabel: { color: palette.faint, fontSize: 11 }, splitLine: { lineStyle: { color: palette.axis } } },
    series: [{
      type: 'line', data: values, smooth: true, symbol: 'circle', symbolSize: 5,
      lineStyle: { width: 2.5, color: accent },
      itemStyle: { color: accent },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: palette.area }, { offset: 1, color: 'rgba(219,185,108,0)' }] } },
    }],
  }
}

export function shareOption(rows: { name: string; value: number }[], center: { label: string; value: string }): EChartsOption {
  return {
    animation: false,
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 亿元（{d}%）' },
    legend: { bottom: 0, left: 'center', textStyle: { color: palette.text, fontSize: 11 }, itemWidth: 10, itemHeight: 10, type: 'scroll' },
    series: [{
      type: 'pie', top: 0, bottom: 26, radius: ['66%', '94%'], center: ['50%', '50%'], avoidLabelOverlap: true,
      itemStyle: { borderColor: '#10292e', borderWidth: 2 },
      label: { show: true, position: 'center', formatter: () => `{a|${center.value}}\n{b|${center.label}}`, rich: { a: { color: palette.text, fontSize: 18, fontWeight: 700 }, b: { color: palette.faint, fontSize: 11, lineHeight: 18 } } },
      emphasis: { scale: false },
      data: rows.map((row, index) => ({ ...row, itemStyle: { color: palette.series[index % palette.series.length] } })),
    }],
  }
}

export function rankOption(rows: { name: string; value: number }[], unit: string): EChartsOption {
  const sorted = [...rows].sort((a, b) => a.value - b.value)
  const max = Math.max(1, ...rows.map(row => row.value))
  return {
    animation: false,
    grid: { top: 4, left: 4, right: 54, bottom: 4, containLabel: true },
    tooltip: { trigger: 'item', formatter: (params: unknown) => { const item = params as { name: string; value: number }; return `${item.name}<br/>${item.value.toLocaleString('zh-CN')} ${unit}` } },
    xAxis: { type: 'value', show: false, max },
    yAxis: { type: 'category', data: sorted.map(row => row.name), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: palette.text, fontSize: 11, overflow: 'truncate', width: 110 } },
    series: [{
      type: 'bar', barMaxWidth: 12,
      data: sorted.map((row, index) => ({
        value: row.value,
        itemStyle: {
          color: index === sorted.length - 1 ? palette.primary : `rgba(114, 155, 149, ${0.4 + index / sorted.length * 0.5})`,
          borderRadius: [0, 3, 3, 0],
        },
      })),
      label: { show: true, position: 'right', color: palette.faint, fontSize: 11, formatter: (params: unknown) => { const item = params as { value: number }; return item.value.toLocaleString('zh-CN') } },
    }],
  }
}

export function radarOption(dims: { name: string; value: number }[], max = 100): EChartsOption {
  return {
    animation: false,
    tooltip: { trigger: 'item' },
    radar: {
      indicator: dims.map(item => ({ name: item.name, max })),
      radius: '56%',
      center: ['50%', '52%'],
      splitNumber: 3,
      axisName: { color: palette.text, fontSize: 10 },
      splitLine: { lineStyle: { color: palette.axis } },
      splitArea: { areaStyle: { color: ['rgba(219,185,108,0.02)', 'rgba(219,185,108,0.06)'] } },
      axisLine: { lineStyle: { color: palette.axis } },
    },
    series: [{
      type: 'radar',
      data: [{ value: dims.map(item => item.value), name: '生产要素相对指数', areaStyle: { color: palette.area }, lineStyle: { color: palette.primary, width: 2 }, itemStyle: { color: palette.primary } }],
    }],
  }
}
