/*
 * 数据层：唯一数据出口（运维监控场景）。页面与组件不得绕过本模块散落 fetch 或硬编码数据数组。
 * tick 为数据版本号：自动刷新每轮 +1，同一 (tick, scope) 结果确定；接真实数据时把 query 换成 fetch 即可。
 * 全部为可辨识的模拟数据，不代表真实服务指标。
 */

export type Scope = 'all' | 'core' | 'edge'
export interface Filters { scope: Scope }

const DATA_SOURCE: 'mock' | 'api' = 'mock'
export const dataSourceLabel = DATA_SOURCE === 'mock' ? '模拟数据' : '真实数据'

export interface Kpi { label: string; value: string; change: string; detail: string; trend: 'up' | 'down' | 'flat' }
export interface Cell { x: number; y: number; value: number }
export interface AlertRow { id: string; level: '严重' | '警告' | '提示'; service: string; summary: string; time: string }

/** 确定性伪随机（FNV-1a）：同一字符串恒得同一 0-1 值，保证同一数据版本下所有面板互相咬合；末位数字变化也会充分扩散 */
function hash(input: string): number {
  let value = 2166136261
  for (const char of input) {
    value ^= char.charCodeAt(0)
    value = Math.imul(value, 16777619) >>> 0
  }
  return (value % 100000) / 100000
}

const SCOPE_SCALE: Record<Scope, number> = { all: 1, core: 0.58, edge: 0.42 }

const scopeOf = (filters: Filters) => SCOPE_SCALE[filters.scope]
const pct = (seed: string) => `${(hash(seed) * 6 - 2).toFixed(1)}%`

export function queryHealth(tick: number, filters: Filters): Kpi[] {
  const factor = scopeOf(filters)
  const availability = 99.85 + hash(`avail${tick}`) * 0.14
  // (tick * 7) % 13 保证相邻数据版本延迟值必然不同（整数化后哈希项可能碰撞）
  const latency = Math.round((86 + ((tick * 7) % 13) + hash(`lat${tick}`) * 40) * factor)
  const errorRate = (0.12 + hash(`err${tick}`) * 0.3) * factor
  const alerts = Math.round(hash(`alert${tick}`) * 6 * factor)
  return [
    { label: '服务可用率', value: `${availability.toFixed(2)}%`, change: pct(`a${tick}`), detail: 'SLO 99.9%', trend: 'up' },
    // 延迟、错误率、告警数：下降为好（App 里 tone 传 good）
    { label: '平均响应延迟', value: `${latency} ms`, change: pct(`l${tick}`), detail: 'P95 口径', trend: 'down' },
    { label: '错误率', value: `${errorRate.toFixed(2)}%`, change: pct(`e${tick}`), detail: '5xx / 总请求', trend: 'down' },
    { label: '活跃告警', value: `${alerts} 条`, change: pct(`al${tick}`), detail: '未确认', trend: 'down' },
  ]
}

/** 延迟趋势：最近 24 个采样点 × P50/P95 两条线共用时间轴 */
export function queryLatency(tick: number, filters: Filters): { labels: string[]; series: { name: string; values: number[] }[] } {
  const base = tick - 23
  const factor = scopeOf(filters)
  return {
    labels: Array.from({ length: 24 }, (_, index) => `T${base + index}`),
    series: [
      { name: 'P50', values: Array.from({ length: 24 }, (_, index) => Math.round((60 + hash(`p50${tick}${index}`) * 40) * factor)) },
      { name: 'P95', values: Array.from({ length: 24 }, (_, index) => Math.round((150 + hash(`p95${tick}${index}`) * 120) * factor)) },
    ],
  }
}

/** 时段错误分布：近 7 天 × 12 个两小时时段 */
export const ERROR_HOUR_LABELS = Array.from({ length: 12 }, (_, index) => `${String(index * 2).padStart(2, '0')}:00`)
export const ERROR_DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export function queryErrors(tick: number, filters: Filters): Cell[] {
  const factor = scopeOf(filters)
  return ERROR_DAY_LABELS.flatMap((day, y) =>
    ERROR_HOUR_LABELS.map((_, x) => ({
      x,
      y,
      value: Math.round(hash(`err${tick}${day}${x}`) * 14 * factor * (x >= 4 && x <= 10 ? 1.4 : 0.5)),
    })),
  )
}

/** 服务请求量堆叠：最近 12 个采样 × 4 个服务 */
const SERVICES = ['网关', '订单', '支付', '搜索']
export function queryStacked(tick: number, filters: Filters): { labels: string[]; series: { name: string; values: number[] }[] } {
  const base = tick - 11
  const factor = scopeOf(filters)
  return {
    labels: Array.from({ length: 12 }, (_, index) => `T${base + index}`),
    series: SERVICES.map(service => ({
      name: service,
      values: Array.from({ length: 12 }, (_, index) => Math.round((40 + hash(`svc${service}${tick}${index}`) * 60) * factor)),
    })),
  }
}

/** 告警明细：级别用文字 + 语义色双重表达；特定数据版本无严重告警（空态演示） */
export function queryAlerts(tick: number): AlertRow[] {
  if (hash(`noalert${tick}`) > 0.82) return []
  return Array.from({ length: 3 + Math.round(hash(`alen${tick}`) * 4) }, (_, index) => {
    const roll = hash(`lvl${tick}${index}`)
    const service = SERVICES[Math.floor(hash(`svc${tick}${index}`) * SERVICES.length)]
    return {
      id: `ALT-${1000 + tick * 10 + index}`,
      level: roll > 0.85 ? '严重' : roll > 0.5 ? '警告' : '提示',
      service,
      summary: roll > 0.5 ? `${service}接口 5xx 比例超过阈值` : `${service}接口延迟接近预算上限`,
      time: `${String(8 + index).padStart(2, '0')}:${String(Math.floor(hash(`min${tick}${index}`) * 60)).padStart(2, '0')}`,
    }
  })
}
