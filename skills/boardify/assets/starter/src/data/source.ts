/*
 * 数据层：唯一数据出口。页面与组件不得绕过本模块散落 fetch 或硬编码数据数组。
 * mock 与真实接口同构：接真实数据时把各 query 函数的实现换成 fetch（建议保持函数签名不变），
 * 调用方零改动；切换点集中在本文件顶部的 DATA_SOURCE。
 *
 * 全部为可辨识的模拟数据：确定性生成（同筛选同结果），不代表真实业务。
 */

export type Period = 'week' | 'month' | 'quarter'
export type Channel = 'all' | 'online' | 'offline'
export interface Filters { period: Period; channel: Channel }

const DATA_SOURCE: 'mock' | 'api' = 'mock'
export const dataSourceLabel = DATA_SOURCE === 'mock' ? '模拟数据' : '真实数据'

export interface Kpi { label: string; value: string; change: string; detail: string; trend: 'up' | 'down' | 'flat' }
export interface Point { label: string; value: number }
export interface Row { name: string; value: number }
export interface RegionRow { name: string; orders: number; change: string; status: string }
export interface Cell { x: number; y: number; value: number }

/** 确定性伪随机（FNV-1a）：同一字符串恒得同一 0-1 值，保证同筛选下所有图表数字互相咬合；末位数字变化也会充分扩散 */
function hash(input: string): number {
  let value = 2166136261
  for (const char of input) {
    value ^= char.charCodeAt(0)
    value = Math.imul(value, 16777619) >>> 0
  }
  return (value % 100000) / 100000
}

const PERIOD_SCALE: Record<Period, number> = { week: 1, month: 4.3, quarter: 13 }
const CHANNEL_SCALE: Record<Channel, number> = { all: 1, online: 0.62, offline: 0.38 }
const PERIOD_LABEL: Record<Period, string> = { week: '较上周', month: '较上月', quarter: '较上季' }

const scale = (filters: Filters) => PERIOD_SCALE[filters.period] * CHANNEL_SCALE[filters.channel]
const pct = (seed: string, filters: Filters) => `${(hash(seed + filters.period + filters.channel) * 24 - 6).toFixed(1)}%`

export function queryKpis(filters: Filters): Kpi[] {
  const factor = scale(filters)
  const volume = Math.round(8426 * factor)
  const users = Math.round(24891 * (0.8 + factor * 0.2))
  const completion = (96 + hash('completion' + filters.channel) * 3.5)
  const hours = (2.4 + hash('hours') * 1.8)
  return [
    { label: '业务总量', value: `${volume.toLocaleString('zh-CN')} 单`, change: pct('volume', filters), detail: PERIOD_LABEL[filters.period], trend: 'up' },
    { label: '处理完成率', value: `${completion.toFixed(1)}%`, change: pct('completion', filters), detail: PERIOD_LABEL[filters.period], trend: 'up' },
    { label: '活跃用户', value: users.toLocaleString('zh-CN'), change: pct('users', filters), detail: PERIOD_LABEL[filters.period], trend: 'up' },
    // 平均处理时长：下降为好（App 里 tone 传 good），不用涨红跌绿的默认映射
    { label: '平均处理时长', value: `${hours.toFixed(1)} 小时`, change: `-${(hash('hoursDrop' + filters.period) * 8).toFixed(1)}%`, detail: PERIOD_LABEL[filters.period], trend: 'down' },
  ]
}

const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30, quarter: 13 }

/** 时间轴标签：周按星期、月按日、季按周 */
export function queryLabels(filters: Filters): string[] {
  const days = PERIOD_DAYS[filters.period]
  return Array.from({ length: days }, (_, index) => filters.period === 'quarter' ? `第${index + 1}周` : filters.period === 'month' ? `${index + 1}日` : WEEK_LABELS[index])
}

/** 趋势：新增 vs 完成，两条线共用同一时间轴（构成关联而非孤立随机数） */
export function queryTrend(filters: Filters): { labels: string[]; series: { name: string; values: number[] }[] } {
  const labels = queryLabels(filters)
  const factor = scale(filters)
  return {
    labels,
    series: [
      { name: '新增', values: labels.map((_, index) => Math.round((42 + hash(`trend${index}`) * 50) * factor)) },
      { name: '完成', values: labels.map((_, index) => Math.round((38 + hash(`trend${index}`) * 44) * factor)) },
    ],
  }
}

/** 业务总量迷你趋势（KPI 卡 sparkline 用）：取新增序列即可，不另造口径 */
export function querySparkline(filters: Filters): number[] {
  return queryTrend(filters).series[0].values
}

const CHANNEL_NAMES = ['线上商城', '直营门店', '合作渠道', '企业服务']

export function queryChannels(filters: Filters): Row[] {
  return CHANNEL_NAMES.map((name, index) => ({
    name,
    value: Math.round((82 - index * 16) * PERIOD_SCALE[filters.period] * (0.7 + hash(name) * 0.6)),
  }))
}

export function queryShare(filters: Filters): Row[] {
  const rows = queryChannels(filters)
  if (filters.channel === 'online') return rows.filter((_, index) => index !== 1)
  if (filters.channel === 'offline') return rows.filter((_, index) => index !== 0)
  return rows
}

/** 堆叠柱：时间 × 服务类型；各类型求和约等于业务总量口径（同一 factor 缩放） */
const SERVICE_TYPES = ['咨询', '办理', '报修', '回访']
export function queryStacked(filters: Filters): { labels: string[]; series: { name: string; values: number[] }[] } {
  const labels = queryLabels(filters).slice(-12)
  const factor = scale(filters)
  return {
    labels,
    series: SERVICE_TYPES.map((type, typeIndex) => ({
      name: type,
      values: labels.map((_, index) => Math.round((6 + hash(`stack${type}${index}`) * 14) * factor * (1 - typeIndex * 0.12))),
    })),
  }
}

/** 时段负载热力：近 7 天 × 12 个两小时时段（x=时段，y=天），白天高、深夜低 */
export const LOAD_HOUR_LABELS = Array.from({ length: 12 }, (_, index) => `${String(index * 2).padStart(2, '0')}:00`)
export const LOAD_DAY_LABELS = WEEK_LABELS
export function queryLoad(filters: Filters): Cell[] {
  const factor = PERIOD_SCALE[filters.period]
  return LOAD_DAY_LABELS.flatMap((day, y) =>
    LOAD_HOUR_LABELS.map((_, x) => {
      const dayFactor = 0.7 + hash(`load${day}`) * 0.5
      // 白天（8-22 点）负载高，夜间低：模拟真实作息分布而非均匀噪声
      const hourFactor = x >= 4 && x <= 10 ? 1 : 0.25
      return { x, y, value: Math.round(20 * hash(`load${day}${x}`) * dayFactor * hourFactor * factor) }
    }),
  )
}

/** 区域订单量：地图填色数据；键为地图要素 properties.id，与 GeoJSON 关联不走展示名 */
export function regionValue(id: string, filters?: Filters): number {
  const factor = filters ? scale(filters) : 1
  return Math.round((120 + hash(id) * 800) * factor)
}

export function queryRegionRows(filters: Filters): RegionRow[] {
  return ['北部示范区', '南部示范区', '云港片区', '青丘片区', '星湖片区', '南苑片区'].map(name => ({
    name,
    orders: Math.round((300 + hash(name) * 2200) * scale(filters)),
    change: pct(name, filters),
    status: hash(name + filters.period) > 0.25 ? '履约正常' : '关注',
  }))
}
