import { describe, expect, it } from 'vitest'
import { resolveChartTheme } from '@/lib/chart-theme'
import {
  buildFunnelOption,
  buildGaugeOption,
  buildGeoOption,
  buildHeatmapOption,
  buildMapLinesSeries,
  buildMapScatterSeries,
  buildRadarOption,
  buildRankOption,
  buildScatterOption,
  buildShareOption,
  buildStackedBarOption,
  buildTrendOption,
} from '@/lib/options'

const theme = resolveChartTheme()

describe('图表配置工厂', () => {
  it('趋势折线含 dataZoom，单系列用 primary 且带面积', () => {
    const option = buildTrendOption(theme, ['周一', '周二'], [{ name: '营收', values: [42, 50] }])
    expect(option.dataZoom).toBeDefined()
    const series = (option.series as { type: string; lineStyle: { color: string }; areaStyle?: unknown }[])[0]
    expect(series.type).toBe('line')
    expect(series.lineStyle.color).toBe(theme.primary)
    expect(series.areaStyle).toBeDefined()
  })
  it('趋势多系列按 palette 顺序取色且不带面积', () => {
    const option = buildTrendOption(theme, ['1月'], [{ name: '新增', values: [10] }, { name: '流失', values: [4] }])
    const series = option.series as { lineStyle: { color: string }; areaStyle?: unknown }[]
    expect(series).toHaveLength(2)
    expect(series[0].lineStyle.color).toBe(theme.palette[0])
    expect(series[1].lineStyle.color).toBe(theme.palette[1])
    expect(series.every(item => item.areaStyle === undefined)).toBe(true)
  })
  it('排行条形按值升序，小值在下', () => {
    const option = buildRankOption(theme, [{ name: '甲', value: 30 }, { name: '乙', value: 10 }, { name: '丙', value: 20 }], '订单量')
    const series = (option.series as { data: number[] }[])[0]
    expect(series.data).toEqual([10, 20, 30])
    const yAxis = option.yAxis as { data: string[] }
    expect(yAxis.data).toEqual(['乙', '丙', '甲'])
  })
  it('占比环形使用主题色板且 tooltip 防裁切', () => {
    const option = buildShareOption(theme, [{ name: '甲', value: 1 }])
    expect(option.color).toEqual(theme.palette)
    expect((option.tooltip as { confine: boolean }).confine).toBe(true)
  })
  it('堆叠柱全部落在同一 stack 上且颜色区分', () => {
    const option = buildStackedBarOption(theme, ['1月', '2月'], [{ name: '线上', values: [1, 2] }, { name: '线下', values: [3, 4] }])
    const series = option.series as { stack: string; itemStyle: { color: string } }[]
    expect(series.every(item => item.stack === 'total')).toBe(true)
    expect(series[0].itemStyle.color).not.toBe(series[1].itemStyle.color)
  })
  it('热力图 visualMap 上限为数据最大值，单元格映射为 [x, y, v]', () => {
    const option = buildHeatmapOption(theme, ['周一'], ['00时', '01时'], [{ x: 0, y: 1, value: 8 }])
    expect((option.visualMap as { max: number }).max).toBe(8)
    expect((option.series as { data: number[][] }[])[0].data).toEqual([[0, 1, 8]])
  })
  it('散点无第三维时不设 symbolSize，有则按面积映射', () => {
    const plain = buildScatterOption(theme, [{ x: 1, y: 2 }], { xAxis: '投入', yAxis: '产出' })
    expect((plain.series as { symbolSize?: unknown }[])[0].symbolSize).toBeUndefined()
    const bubble = buildScatterOption(theme, [{ x: 1, y: 2, size: 100 }], { xAxis: '投入', yAxis: '产出' })
    const size = (bubble.series as { symbolSize: (value: unknown) => number }[])[0].symbolSize
    expect(size([1, 2, 100])).toBeGreaterThan(size([1, 2, 25]))
  })
  it('雷达透传维度上限，实体数量与系列数据一致', () => {
    const option = buildRadarOption(theme, [{ name: '效率', max: 100 }, { name: '质量', max: 100 }, { name: '成本', max: 100 }], [{ name: '本季', values: [80, 90, 70] }])
    expect((option.radar as { indicator: unknown[] }).indicator).toHaveLength(3)
    const series = option.series as { data: { name: string }[] }[]
    expect(series[0].data[0].name).toBe('本季')
  })
  it('漏斗占比以首级为基准而非 ECharts 总和口径', () => {
    const option = buildFunnelOption(theme, [{ name: '访问', value: 100 }, { name: '下单', value: 25 }])
    const formatter = (option.tooltip as { formatter: (params: unknown) => string }).formatter
    expect(formatter({ name: '下单', value: 25 })).toContain('占首级 25.0%')
  })
  it('仪表盘默认上限 100 并透传指标值', () => {
    const option = buildGaugeOption(theme, { name: 'CPU 使用率', value: 72, unit: '%' })
    const series = option.series as { max: number; data: { value: number }[] }[]
    expect(series[0].max).toBe(100)
    expect(series[0].data[0].value).toBe(72)
  })
  it('地图打点默认 silent 穿透（保住填色地图的点击下钻），坐标映射 [lng, lat, value]', () => {
    const series = buildMapScatterSeries(theme, [{ name: '枢纽', coord: [116.4, 39.9], value: 30 }])
    expect(series.silent).toBe(true)
    expect(series.coordinateSystem).toBe('geo')
    expect((series.data as { value: number[] }[])[0].value).toEqual([116.4, 39.9, 30])
  })
  it('飞线坐标成对映射且不参与事件', () => {
    const series = buildMapLinesSeries(theme, [{ from: [116.4, 39.9], to: [121.5, 31.2] }])
    expect(series.silent).toBe(true)
    expect((series.data as { coords: number[][] }[])[0].coords).toEqual([[116.4, 39.9], [121.5, 31.2]])
  })
  it('geo 底图透传注册名与主题描边', () => {
    const geo = buildGeoOption(theme, 'boardify-100000')
    expect(geo.map).toBe('boardify-100000')
    expect(geo.itemStyle?.borderColor).toBe(theme.surface)
  })
})
