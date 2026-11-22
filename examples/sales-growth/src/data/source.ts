/*
 * 数据层：唯一数据出口（销售增长分析场景）。页面与组件不得绕过本模块散落 fetch 或硬编码数据数组。
 * mock 与真实接口同构：接真实数据时把各 query 函数的实现换成 fetch（保持签名不变），切换点在 DATA_SOURCE。
 * 全部为可辨识的模拟数据（FNV-1a 确定性生成），不代表真实业务。
 */

export type Period = 'week' | 'month' | 'quarter'
export type Cohort = 'all' | 'new' | 'returning'
export interface Filters { period: Period; cohort: Cohort }

const DATA_SOURCE: 'mock' | 'api' = 'mock'
export const dataSourceLabel = DATA_SOURCE === 'mock' ? '模拟数据' : '真实数据'

export interface Kpi { label: string; value: string; change: string; detail: string; trend: 'up' | 'down' | 'flat' }
export interface Cell { x: number; y: number; value: number }
export interface ChannelRow { name: string; visitors: number; conversion: string; gmv: number; change: string }

/** 确定性伪随机（FNV-1a）：同一字符串恒得同一 0-1 值，保证同筛选下所有图表数字互相咬合 */
function hash(input: string): number {
  let value = 2166136261
  for (const char of input) {
    value ^= char.charCodeAt(0)
    value = Math.imul(value, 16777619) >>> 0
  }
  return (value % 100000) / 100000
}

const PERIOD_SCALE: Record<Period, number> = { week: 1, month: 4.3, quarter: 13 }
const COHORT_SCALE: Record<Cohort, number> = { all: 1, new: 0.55, returning: 0.45 }
const PERIOD_LABEL: Record<Period, string> = { week: '较上周', month: '较上月', quarter: '较上季' }

const scale = (filters: Filters) => PERIOD_SCALE[filters.period] * COHORT_SCALE[filters.cohort]
const pct = (seed: string, filters: Filters) => `${(hash(seed + filters.period + filters.cohort) * 16 - 4).toFixed(1)}%`

export function queryKpis(filters: Filters): Kpi[] {
  const factor = scale(filters)
  const visitors = Math.round(186420 * factor)
  const conversion = 3.2 + hash(`conv${filters.cohort}`) * 2.4
  const aov = 168 + hash(`aov${filters.cohort}`) * 60
  const repurchase = 24 + hash(`rep${filters.cohort}`) * 18
  return [
    { label: '访客数', value: visitors.toLocaleString('zh-CN'), change: pct('visitors', filters), detail: PERIOD_LABEL[filters.period], trend: 'up' },
    { label: '下单转化率', value: `${conversion.toFixed(1)}%`, change: pct('conversion', filters), detail: '下单 / 访问', trend: 'up' },
    { label: '客单价', value: `¥ ${aov.toFixed(0)}`, change: pct('aov', filters), detail: 'GMV / 订单数', trend: 'up' },
    { label: '复购率', value: `${repurchase.toFixed(1)}%`, change: pct('repurchase', filters), detail: '90 天内二次下单', trend: 'up' },
  ]
}

const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30, quarter: 13 }

export function queryLabels(filters: Filters): string[] {
  const days = PERIOD_DAYS[filters.period]
  return Array.from({ length: days }, (_, index) => filters.period === 'quarter' ? `第${index + 1}周` : filters.period === 'month' ? `${index + 1}日` : WEEK_LABELS[index])
}

/** GMV 趋势：新客 vs 复购 两条线共用时间轴 */
export function queryTrend(filters: Filters): { labels: string[]; series: { name: string; values: number[] }[] } {
  const labels = queryLabels(filters)
  const factor = scale(filters)
  return {
    labels,
    series: [
      { name: '新客 GMV', values: labels.map((_, index) => Math.round((22 + hash(`new${index}`) * 26) * factor)) },
      { name: '复购 GMV', values: labels.map((_, index) => Math.round((18 + hash(`rep${index}`) * 22) * factor)) },
    ],
  }
}

/** 转化漏斗：各级严格包含（下一级 ≤ 上一级）；占比口径为占首级（见 lib/options.ts 的漏斗工厂） */
export const FUNNEL_STAGES = ['访问', '注册', '加购', '下单', '支付']
export function queryFunnel(filters: Filters): { name: string; value: number }[] {
  const base = 100000 * PERIOD_SCALE[filters.period]
  const rates = [1, 0.42 + hash(`reg${filters.cohort}`) * 0.08, 0.3 + hash(`cart${filters.cohort}`) * 0.06, 0.09 + hash(`ord${filters.cohort}`) * 0.03, 0.06 + hash(`pay${filters.cohort}`) * 0.02]
  return FUNNEL_STAGES.map((name, index) => ({ name, value: Math.round(base * rates[index]) }))
}

/** 留存矩阵：近 8 个注册周 × 第 1..8 周留存率；注册当周为 100%，未满周数不造数据（缺失保持缺失） */
export const RETENTION_WEEKS = 8
export const RETENTION_COHORT_LABELS = Array.from({ length: RETENTION_WEEKS }, (_, index) => `W${index + 1}`)
export function queryRetention(filters: Filters): Cell[] {
  const cells: Cell[] = []
  for (let cohort = 0; cohort < RETENTION_WEEKS; cohort++) {
    cells.push({ x: 0, y: cohort, value: 100 })
    for (let week = 1; week + cohort < RETENTION_WEEKS; week++) {
      const decay = 100 * Math.pow(0.62 + hash(`ret${filters.cohort}`) * 0.12, week) * (0.9 + hash(`ret${cohort}${week}`) * 0.2)
      cells.push({ x: week, y: cohort, value: Math.round(decay) })
    }
  }
  return cells
}

/** 用户分层：访问频次 × 客单价，气泡 = 近期消费额 */
export function querySegments(filters: Filters): { x: number; y: number; size: number }[] {
  const factor = COHORT_SCALE[filters.cohort]
  return Array.from({ length: 12 }, (_, index) => ({
    x: Math.round(2 + hash(`freq${index}`) * 18),
    y: Math.round((90 + hash(`aov${index}`) * 320) * (0.6 + factor * 0.6)),
    size: Math.round((600 + hash(`spend${index}`) * 8600) * factor),
  }))
}

const CHANNELS = ['搜索广告', '内容种草', '社交裂变', '直邮唤醒', '自然流量']

export function queryChannels(filters: Filters): ChannelRow[] {
  return CHANNELS.map(name => ({
    name,
    visitors: Math.round((18000 + hash(`chv${name}`) * 42000) * PERIOD_SCALE[filters.period] * COHORT_SCALE[filters.cohort]),
    conversion: `${(1.4 + hash(`chc${name}`) * 4.2).toFixed(1)}%`,
    gmv: Math.round((86000 + hash(`chg${name}`) * 520000) * PERIOD_SCALE[filters.period] * COHORT_SCALE[filters.cohort]),
    change: pct(`ch${name}`, filters),
  }))
}
