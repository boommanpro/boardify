/*
 * 数据层：唯一数据出口（营销指挥大屏场景）。页面与组件不得绕过本模块散落 fetch 或硬编码数据数组。
 * tick 为数据版本号：大屏每 30 秒自动刷新推进一轮，同一 tick 结果确定。
 * 全部为可辨识的模拟数据（FNV-1a 确定性生成），不代表真实业务。
 */

export interface Filters { tick: number }

const DATA_SOURCE: 'mock' | 'api' = 'mock'
export const dataSourceLabel = DATA_SOURCE === 'mock' ? '模拟数据' : '真实数据'

export interface Kpi { label: string; value: string; change: string; detail: string; trend: 'up' | 'down' | 'flat' }
export interface Row { name: string; value: number }

/** 确定性伪随机（FNV-1a）：同一字符串恒得同一 0-1 值，保证同一数据版本下所有面板互相咬合 */
function hash(input: string): number {
  let value = 2166136261
  for (const char of input) {
    value ^= char.charCodeAt(0)
    value = Math.imul(value, 16777619) >>> 0
  }
  return (value % 100000) / 100000
}

const pct = (seed: string) => `${(hash(seed) * 18 - 5).toFixed(1)}%`

export function queryKpis(filters: Filters): Kpi[] {
  const { tick } = filters
  // (tick * 7) % 11 保证相邻数据版本数值必然变化（整数化后哈希项可能碰撞）
  const drift = ((tick * 7) % 11 - 5) / 10
  const gmv = 3860 + drift * 120 + hash(`gmv${tick}`) * 90
  const users = Math.round(524000 + drift * 8000 + hash(`usr${tick}`) * 6000)
  const conversion = 4.6 + drift * 0.2 + hash(`cvr${tick}`) * 0.8
  const online = Math.round(18200 + drift * 900 + hash(`onl${tick}`) * 900)
  return [
    { label: '活动累计 GMV', value: `¥ ${(gmv / 10).toFixed(1)} 万`, change: pct(`k1${tick}`), detail: '活动期累计', trend: 'up' },
    { label: '参与用户', value: users.toLocaleString('zh-CN'), change: pct(`k2${tick}`), detail: '去重参与', trend: 'up' },
    { label: '下单转化率', value: `${conversion.toFixed(1)}%`, change: pct(`k3${tick}`), detail: '下单 / 访问', trend: 'up' },
    { label: '实时在线', value: online.toLocaleString('zh-CN'), change: pct(`k4${tick}`), detail: '当前时刻', trend: 'up' },
  ]
}

const CHANNELS = ['搜索广告', '内容种草', '社交裂变', '直投唤醒', '自然流量']

export function queryShare(filters: Filters): Row[] {
  return CHANNELS.map(name => ({ name, value: Math.round(18 + hash(`share${name}${filters.tick % 7}`) * 46) }))
}

/** 用户画像：六维综合评分（0-100），逐版本小幅波动 */
export const RADAR_INDICATORS = [
  { name: '活跃度', max: 100 },
  { name: '忠诚度', max: 100 },
  { name: '传播力', max: 100 },
  { name: '消费力', max: 100 },
  { name: '复购力', max: 100 },
  { name: '新客占比', max: 100 },
]
export function queryRadar(filters: Filters): { name: string; values: number[] }[] {
  const base = [78, 66, 72, 84, 61, 70]
  return [{
    name: '本期画像',
    values: base.map((value, index) => Math.round(value + hash(`radar${index}${filters.tick % 5}`) * 12 - 6)),
  }]
}

/** 区域排行：与地图要素同名的片区口径（合成演示区域，非真实行政区划） */
export const REGION_NAMES = ['北部示范区', '南部示范区', '云港片区', '青丘片区', '星湖片区', '南苑片区']
export function queryRank(filters: Filters): Row[] {
  return REGION_NAMES.map(name => ({ name, value: Math.round(120 + hash(`rank${name}${filters.tick % 7}`) * 780) }))
}

const CATEGORIES = ['数码家电', '家居生活', '服饰美妆', '食品生鲜']
export function queryStacked(filters: Filters): { labels: string[]; series: { name: string; values: number[] }[] } {
  const labels = ['00-06', '06-12', '12-18', '18-24']
  return {
    labels,
    series: CATEGORIES.map((name, index) => ({
      name,
      values: labels.map((_, slot) => Math.round((14 + hash(`cat${name}${slot}${filters.tick % 7}`) * 40) * (1 - index * 0.1))),
    })),
  }
}

/** 今日 vs 昨日 GMV 走势：24 小时双序列 */
export function queryTrend(filters: Filters): { labels: string[]; series: { name: string; values: number[] }[] } {
  const labels = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}时`)
  return {
    labels,
    series: [
      { name: '今日', values: labels.map((_, index) => Math.round((18 + hash(`today${index}${filters.tick % 7}`) * 30) * (index > 8 && index < 23 ? 1.6 : 0.5))) },
      { name: '昨日', values: labels.map((_, index) => Math.round((16 + hash(`yday${index}`) * 26) * (index > 8 && index < 23 ? 1.5 : 0.5))) },
    ],
  }
}

/** 地图填色数据：键为合成地图要素 properties.id，与 GeoJSON 关联不走展示名 */
export function regionValue(id: string, filters?: Filters): number {
  const tick = filters?.tick ?? 0
  return Math.round((120 + hash(`region${id}${tick % 7}`) * 800))
}
