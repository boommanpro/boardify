import type { EChartsOption } from '@/lib/charts'
import type { EffectScatterSeriesOption, LinesSeriesOption } from 'echarts/charts'
import type { GeoComponentOption } from 'echarts/components'
import type { ChartTheme } from '@/lib/chart-theme'

/*
 * 图表配置工厂：一个图表 = 一个工厂 + 一处使用。覆盖 references/echarts.md 选型矩阵的常用行。
 * 颜色只来自 ChartTheme（见 lib/chart-theme.ts）；同一业务实体的颜色由调用方保证顺序稳定。
 */

export function baseOption(theme: ChartTheme): EChartsOption {
  return {
    textStyle: { color: theme.text },
    tooltip: { trigger: 'axis', confine: true },
    legend: { top: 0, textStyle: { color: theme.text } },
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
  }
}

const axisStyle = (theme: ChartTheme) => ({
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { color: theme.text },
  splitLine: { lineStyle: { color: theme.line } },
})

/** 多系列取色：按 palette 顺序（同一实体顺序稳定即颜色稳定）；单系列场景由调用方直接用 primary */
function seriesColor(theme: ChartTheme, index: number): string {
  return theme.palette[index % theme.palette.length]
}

export interface Series { name: string; values: number[] }

/** 指标随时间怎么变：折线（可多系列）；点多时采样，时间跨度大加 dataZoom */
export function buildTrendOption(theme: ChartTheme, labels: string[], series: Series[]): EChartsOption {
  return {
    ...baseOption(theme),
    xAxis: { type: 'category', boundaryGap: false, data: labels, ...axisStyle(theme) },
    yAxis: { type: 'value', ...axisStyle(theme) },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 0, borderColor: theme.line, textStyle: { color: theme.text } }],
    series: series.map((item, index) => {
      const color = series.length === 1 ? theme.primary : seriesColor(theme, index)
      return {
        type: 'line' as const,
        name: item.name,
        smooth: true,
        symbolSize: 6,
        data: item.values,
        lineStyle: { width: 3, color },
        itemStyle: { color },
        areaStyle: series.length === 1 ? { color: theme.primary, opacity: 0.12 } : undefined,
      }
    }),
  }
}

/** 类别谁多谁少：条形，先排序，小值在下 */
export function buildRankOption(theme: ChartTheme, rows: { name: string; value: number }[], name: string): EChartsOption {
  const sorted = [...rows].sort((a, b) => a.value - b.value)
  return {
    ...baseOption(theme),
    tooltip: { trigger: 'item', confine: true },
    grid: { ...baseOption(theme).grid, bottom: 0 },
    xAxis: { type: 'value', ...axisStyle(theme) },
    yAxis: { type: 'category', data: sorted.map(row => row.name), ...axisStyle(theme) },
    series: [{ type: 'bar', name, data: sorted.map(row => row.value), barMaxWidth: 18, itemStyle: { color: theme.primary, borderRadius: [0, 5, 5, 0] } }],
  }
}

/** 整体构成占比：环形；类别超过 6 个应在数据层聚合为“其他” */
export function buildShareOption(theme: ChartTheme, rows: { name: string; value: number }[]): EChartsOption {
  return {
    color: theme.palette,
    textStyle: { color: theme.text },
    tooltip: { trigger: 'item', confine: true },
    legend: { bottom: 0, type: 'scroll', textStyle: { color: theme.text } },
    series: [{ type: 'pie', radius: ['55%', '80%'], center: ['50%', '45%'], data: rows, label: { color: theme.text, formatter: '{b} {d}%' } }],
  }
}

/** 时间 × 类别的量：堆叠柱；series 顺序即堆叠顺序，同一实体保持稳定 */
export function buildStackedBarOption(theme: ChartTheme, labels: string[], series: Series[]): EChartsOption {
  return {
    ...baseOption(theme),
    xAxis: { type: 'category', data: labels, ...axisStyle(theme) },
    yAxis: { type: 'value', ...axisStyle(theme) },
    series: series.map((item, index) => ({
      type: 'bar' as const,
      name: item.name,
      stack: 'total',
      barMaxWidth: 24,
      data: item.values,
      itemStyle: { color: seriesColor(theme, index) },
    })),
  }
}

/** 两变量是否相关：散点；size 作为第三维（气泡），按面积映射而不是半径映射 */
export function buildScatterOption(theme: ChartTheme, points: { x: number; y: number; size?: number }[], names: { xAxis: string; yAxis: string }): EChartsOption {
  const sizes = points.map(point => point.size).filter((size): size is number => size !== undefined)
  const maxSize = Math.max(...sizes, 1)
  const hasSize = sizes.length > 0
  return {
    ...baseOption(theme),
    tooltip: { trigger: 'item', confine: true },
    xAxis: { type: 'value', name: names.xAxis, nameTextStyle: { color: theme.text }, ...axisStyle(theme) },
    yAxis: { type: 'value', name: names.yAxis, nameTextStyle: { color: theme.text }, ...axisStyle(theme) },
    series: [{
      type: 'scatter',
      data: points.map(point => hasSize ? [point.x, point.y, point.size ?? 1] : [point.x, point.y]),
      symbolSize: hasSize ? (value: unknown) => 4 + Math.sqrt(((value as number[])[2] ?? 1) / maxSize) * 28 : undefined,
      itemStyle: { color: theme.primary, opacity: 0.72 },
    }],
  }
}

/** 多维度综合对比：雷达，维度 3 至 8 个；多实体对比时各自取 palette 色 */
export function buildRadarOption(theme: ChartTheme, indicators: { name: string; max: number }[], entities: Series[]): EChartsOption {
  return {
    ...baseOption(theme),
    tooltip: { trigger: 'item', confine: true },
    radar: { indicator: indicators, axisName: { color: theme.text }, splitLine: { lineStyle: { color: theme.line } }, axisLine: { lineStyle: { color: theme.line } } },
    series: [{
      type: 'radar',
      data: entities.map((entity, index) => ({
        name: entity.name,
        value: entity.values,
        lineStyle: { color: seriesColor(theme, index) },
        itemStyle: { color: seriesColor(theme, index) },
        areaStyle: { color: seriesColor(theme, index), opacity: 0.15 },
      })),
    }],
  }
}

/** 转化漏斗：rows 从大到小排列（数据层负责排序）；ECharts 的 {d}% 以总和为基准，业务口径是逐级占首级比例，故自定义 formatter */
export function buildFunnelOption(theme: ChartTheme, rows: { name: string; value: number }[]): EChartsOption {
  const first = rows[0]?.value || 1
  return {
    color: theme.palette,
    textStyle: { color: theme.text },
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (params: unknown) => {
        const { name, value } = params as { name: string; value: number }
        return `${name}：${value}（占首级 ${((value / first) * 100).toFixed(1)}%）`
      },
    },
    legend: { bottom: 0, type: 'scroll', textStyle: { color: theme.text } },
    series: [{ type: 'funnel', left: '8%', width: '84%', top: 8, bottom: 36, sort: 'descending', gap: 3, data: rows, label: { color: theme.text, formatter: '{b} {c}' }, labelLine: { lineStyle: { color: theme.line } } }],
  }
}

/** 单指标离目标多远：仪表盘——仅用户明确要求仪表盘时使用（选型矩阵约定），否则用 KPI 卡 + Progress */
export function buildGaugeOption(theme: ChartTheme, metric: { name: string; value: number; max?: number; unit?: string }): EChartsOption {
  const max = metric.max ?? 100
  return {
    textStyle: { color: theme.text },
    series: [{
      type: 'gauge',
      min: 0,
      max,
      startAngle: 210,
      endAngle: -30,
      progress: { show: true, width: 12, itemStyle: { color: theme.primary } },
      axisLine: { lineStyle: { width: 12, color: [[1, theme.line]] } },
      axisTick: { show: false },
      splitLine: { length: 6, lineStyle: { color: theme.text } },
      axisLabel: { color: theme.text, distance: 18, fontSize: 10 },
      pointer: { show: false },
      anchor: { show: false },
      detail: { valueAnimation: true, offsetCenter: [0, '18%'], color: theme.foreground, fontSize: 22, formatter: `{value}${metric.unit ?? ''}` },
      data: [{ value: metric.value, name: metric.name }],
      title: { color: theme.text, offsetCenter: [0, '42%'], fontSize: 12 },
    }],
  }
}

/** 热力矩阵（留存、时段活跃等）：连续强度用顺序色 mapFrom → primary */
export function buildHeatmapOption(theme: ChartTheme, xLabels: string[], yLabels: string[], cells: { x: number; y: number; value: number }[]): EChartsOption {
  const max = Math.max(...cells.map(cell => cell.value), 1)
  return {
    ...baseOption(theme),
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (params: unknown) => {
        const [x, y, value] = (params as { value: [number, number, number] }).value
        return `${xLabels[x]} · ${yLabels[y]}：${value}`
      },
    },
    grid: { ...baseOption(theme).grid, bottom: 56 },
    xAxis: { type: 'category', data: xLabels, ...axisStyle(theme), splitArea: { show: true, areaStyle: { color: [theme.surface, 'transparent'] } } },
    yAxis: { type: 'category', data: yLabels, ...axisStyle(theme), splitArea: { show: true, areaStyle: { color: [theme.surface, 'transparent'] } } },
    visualMap: { min: 0, max, calculable: false, orient: 'horizontal', left: 'center', bottom: 8, textStyle: { color: theme.text }, inRange: { color: [theme.mapFrom, theme.primary] } },
    series: [{ type: 'heatmap', data: cells.map(cell => [cell.x, cell.y, cell.value]), label: { show: false }, itemStyle: { borderColor: theme.surface, borderWidth: 1 } }],
  }
}

/*
 * 地图叠加（打点 / 飞线）：只打点不填色时用 geo 组件 + coordinateSystem: 'geo' 系列，
 * 不与 map series 双画叠层；需要下钻的填色地图上打点必须 silent 穿透（见 references/china-maps.md 实测坑）。
 */

export function buildGeoOption(theme: ChartTheme, mapName: string): GeoComponentOption {
  return {
    map: mapName,
    roam: false,
    itemStyle: { borderColor: theme.surface, borderWidth: 1, areaColor: theme.mapFrom },
    emphasis: { itemStyle: { areaColor: theme.palette[2] } },
    label: { show: false },
  }
}

export function buildMapScatterSeries(theme: ChartTheme, points: { name: string; coord: [number, number]; value: number }[], options: { silent?: boolean } = {}): EffectScatterSeriesOption {
  return {
    type: 'effectScatter',
    coordinateSystem: 'geo',
    silent: options.silent ?? true,
    symbolSize: (value: number[]) => 6 + Math.min(Math.sqrt(Math.max(value[2], 0)), 12),
    rippleEffect: { scale: 2.4, brushType: 'stroke' },
    itemStyle: { color: theme.warning },
    label: { show: true, formatter: '{b}', position: 'right', color: theme.text },
    data: points.map(point => ({ name: point.name, value: [...point.coord, point.value] })),
  }
}

export function buildMapLinesSeries(theme: ChartTheme, flows: { from: [number, number]; to: [number, number] }[]): LinesSeriesOption {
  return {
    type: 'lines',
    coordinateSystem: 'geo',
    silent: true,
    effect: { show: true, period: 4, trailLength: 0.3, symbolSize: 4, color: theme.primary },
    lineStyle: { color: theme.primary, width: 1.5, opacity: 0.4, curveness: 0.3 },
    data: flows.map(flow => ({ coords: [flow.from, flow.to] })),
  }
}
