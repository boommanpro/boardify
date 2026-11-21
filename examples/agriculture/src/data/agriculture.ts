import manifest from '@/data/maps/manifest.json'
import { region } from '@/lib/maps'

// 全国农业大盘 —— 唯一数据出口。
// 全部为固定种子生成的「演示数据」，字段与真实统计同构，可整层切换到真实接口。
// 指标口径（单位）：
//   grain     粮食产量（万吨）
//   output    农林牧渔总产值（亿元）
//   arable    耕地面积（万亩）
//   machinery 农机总动力（万千瓦）

export type MetricKey = 'grain' | 'output' | 'arable' | 'machinery'
export type MetricInfo = { label: string; unit: string; short: string; color: string }

export const metricOptions: Record<MetricKey, MetricInfo> = {
  grain: { label: '粮食产量', unit: '万吨', short: '粮食', color: '#a3e635' },
  output: { label: '农林牧渔总产值', unit: '亿元', short: '产值', color: '#34d399' },
  arable: { label: '耕地面积', unit: '万亩', short: '耕地', color: '#22d3ee' },
  machinery: { label: '农机总动力', unit: '万千瓦', short: '农机', color: '#fbbf24' },
}

export type ProvinceFact = {
  adcode: string
  name: string
  grain: number
  grainYoY: number
  output: number
  outputYoY: number
  arable: number
  sown: number
  irrigated: number
  machinery: number
  fertilizer: number
  population: number
  disaster: number
}

// 省级锚点（量级贴近公开统计口径，仅作为演示基数，不代表当期官方数值）
const anchors: Record<string, Omit<ProvinceFact, 'adcode' | 'grainYoY' | 'outputYoY'>> = {
  '110000': { name: '北京市', grain: 45, output: 450, arable: 180, sown: 260, irrigated: 150, machinery: 180, fertilizer: 6, population: 40, disaster: 3 },
  '120000': { name: '天津市', grain: 255, output: 480, arable: 550, sown: 700, irrigated: 450, machinery: 500, fertilizer: 16, population: 70, disaster: 10 },
  '130000': { name: '河北省', grain: 3800, output: 6800, arable: 9800, sown: 10600, irrigated: 6800, machinery: 8200, fertilizer: 280, population: 1200, disaster: 700 },
  '140000': { name: '山西省', grain: 1500, output: 2400, arable: 5500, sown: 5800, irrigated: 1900, machinery: 3200, fertilizer: 120, population: 640, disaster: 500 },
  '150000': { name: '内蒙古自治区', grain: 3900, output: 4000, arable: 17000, sown: 15500, irrigated: 4500, machinery: 6100, fertilizer: 240, population: 480, disaster: 900 },
  '210000': { name: '辽宁省', grain: 2500, output: 5000, arable: 7900, sown: 8100, irrigated: 2100, machinery: 3500, fertilizer: 160, population: 660, disaster: 400 },
  '220000': { name: '吉林省', grain: 4100, output: 3400, arable: 10700, sown: 10600, irrigated: 2300, machinery: 3800, fertilizer: 180, population: 480, disaster: 350 },
  '230000': { name: '黑龙江省', grain: 7800, output: 6200, arable: 25000, sown: 23000, irrigated: 9500, machinery: 7500, fertilizer: 320, population: 700, disaster: 1000 },
  '310000': { name: '上海市', grain: 90, output: 500, arable: 330, sown: 300, irrigated: 280, machinery: 180, fertilizer: 9, population: 40, disaster: 2 },
  '320000': { name: '江苏省', grain: 3800, output: 8500, arable: 9000, sown: 10500, irrigated: 6200, machinery: 5200, fertilizer: 320, population: 1200, disaster: 350 },
  '330000': { name: '浙江省', grain: 1200, output: 6000, arable: 2900, sown: 3900, irrigated: 2400, machinery: 2600, fertilizer: 110, population: 500, disaster: 200 },
  '340000': { name: '安徽省', grain: 4100, output: 6200, arable: 8800, sown: 11800, irrigated: 5200, machinery: 6900, fertilizer: 360, population: 1500, disaster: 600 },
  '350000': { name: '福建省', grain: 1100, output: 4600, arable: 2300, sown: 2900, irrigated: 1800, machinery: 1900, fertilizer: 95, population: 500, disaster: 200 },
  '360000': { name: '江西省', grain: 2100, output: 4000, arable: 4400, sown: 8400, irrigated: 3200, machinery: 2800, fertilizer: 140, population: 900, disaster: 500 },
  '370000': { name: '山东省', grain: 5400, output: 12500, arable: 9600, sown: 16500, irrigated: 8200, machinery: 12500, fertilizer: 420, population: 1500, disaster: 400 },
  '410000': { name: '河南省', grain: 6700, output: 11800, arable: 11000, sown: 22000, irrigated: 8000, machinery: 12200, fertilizer: 460, population: 2000, disaster: 900 },
  '420000': { name: '湖北省', grain: 2700, output: 6900, arable: 7100, sown: 8800, irrigated: 4700, machinery: 4500, fertilizer: 300, population: 1000, disaster: 500 },
  '430000': { name: '湖南省', grain: 3000, output: 7500, arable: 6000, sown: 11000, irrigated: 4500, machinery: 5800, fertilizer: 220, population: 1300, disaster: 700 },
  '440000': { name: '广东省', grain: 1300, output: 8500, arable: 4700, sown: 5100, irrigated: 2800, machinery: 2800, fertilizer: 220, population: 900, disaster: 250 },
  '450000': { name: '广西壮族自治区', grain: 1400, output: 5500, arable: 6400, sown: 7300, irrigated: 3300, machinery: 3600, fertilizer: 250, population: 1200, disaster: 600 },
  '460000': { name: '海南省', grain: 140, output: 1700, arable: 850, sown: 900, irrigated: 300, machinery: 500, fertilizer: 30, population: 180, disaster: 60 },
  '500000': { name: '重庆市', grain: 1080, output: 3300, arable: 2900, sown: 5700, irrigated: 1500, machinery: 1600, fertilizer: 80, population: 700, disaster: 300 },
  '510000': { name: '四川省', grain: 3500, output: 9800, arable: 9800, sown: 16500, irrigated: 5600, machinery: 4500, fertilizer: 240, population: 1500, disaster: 900 },
  '520000': { name: '贵州省', grain: 1080, output: 3600, arable: 6900, sown: 6400, irrigated: 1900, machinery: 2800, fertilizer: 80, population: 1000, disaster: 600 },
  '530000': { name: '云南省', grain: 1800, output: 6000, arable: 9200, sown: 9400, irrigated: 2800, machinery: 3400, fertilizer: 200, population: 1200, disaster: 600 },
  '540000': { name: '西藏自治区', grain: 105, output: 260, arable: 500, sown: 300, irrigated: 260, machinery: 300, fertilizer: 6, population: 150, disaster: 40 },
  '610000': { name: '陕西省', grain: 1300, output: 3600, arable: 6000, sown: 6500, irrigated: 2100, machinery: 2400, fertilizer: 170, population: 700, disaster: 400 },
  '620000': { name: '甘肃省', grain: 1200, output: 2200, arable: 7800, sown: 6200, irrigated: 2000, machinery: 2500, fertilizer: 100, population: 700, disaster: 800 },
  '630000': { name: '青海省', grain: 105, output: 430, arable: 950, sown: 450, irrigated: 340, machinery: 700, fertilizer: 9, population: 150, disaster: 100 },
  '640000': { name: '宁夏回族自治区', grain: 380, output: 700, arable: 1700, sown: 1350, irrigated: 800, machinery: 900, fertilizer: 30, population: 130, disaster: 120 },
  '650000': { name: '新疆维吾尔自治区', grain: 1900, output: 4400, arable: 13000, sown: 8000, irrigated: 7800, machinery: 3500, fertilizer: 300, population: 600, disaster: 400 },
  '710000': { name: '台湾省', grain: 120, output: 1900, arable: 1100, sown: 1100, irrigated: 500, machinery: 800, fertilizer: 30, population: 200, disaster: 30 },
  '810000': { name: '香港特别行政区', grain: 0, output: 60, arable: 7, sown: 7, irrigated: 3, machinery: 5, fertilizer: 1, population: 3, disaster: 0 },
  '820000': { name: '澳门特别行政区', grain: 0, output: 20, arable: 1, sown: 1, irrigated: 0.5, machinery: 1, fertilizer: 0.2, population: 1, disaster: 0 },
}

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 }
}

export const facts: ProvinceFact[] = (() => {
  const random = seededRandom(20261015)
  const yoy = () => +(random() * 12 - 4).toFixed(1)
  const noise = (value: number, range = 0.06) => Math.round(value * (1 + (random() * 2 - 1) * range))
  return manifest.nodes
    .filter(node => node.level === 2 && anchors[node.id])
    .map(node => {
      const anchor = anchors[node.id]
      return {
        adcode: node.id,
        name: anchor.name,
        grain: noise(anchor.grain),
        grainYoY: yoy(),
        output: noise(anchor.output),
        outputYoY: yoy(),
        arable: noise(anchor.arable, 0.04),
        sown: noise(anchor.sown, 0.04),
        irrigated: noise(anchor.irrigated, 0.04),
        machinery: noise(anchor.machinery, 0.04),
        fertilizer: noise(anchor.fertilizer, 0.05),
        population: noise(anchor.population, 0.05),
        disaster: noise(anchor.disaster, 0.1),
      }
    })
})()

export function provinceFact(adcode: string): ProvinceFact {
  const row = facts.find(fact => fact.adcode === adcode)
  if (!row) throw new Error(`未知省份数据：${adcode}`)
  return row
}

export function provinceValues(metric: MetricKey): Record<string, number> {
  return Object.fromEntries(facts.map(fact => [fact.adcode, fact[metric]]))
}

export function provinceRows(metric: MetricKey): { adcode: string; name: string; value: number }[] {
  return facts.map(fact => ({ adcode: fact.adcode, name: fact.name, value: fact[metric] }))
}

export const nationalTotals = (() => {
  const grain = facts.reduce((sum, fact) => sum + fact.grain, 0)
  const output = facts.reduce((sum, fact) => sum + fact.output, 0)
  const arable = facts.reduce((sum, fact) => sum + fact.arable, 0)
  const sown = facts.reduce((sum, fact) => sum + fact.sown, 0)
  const irrigated = facts.reduce((sum, fact) => sum + fact.irrigated, 0)
  const machinery = facts.reduce((sum, fact) => sum + fact.machinery, 0)
  const fertilizer = facts.reduce((sum, fact) => sum + fact.fertilizer, 0)
  const population = facts.reduce((sum, fact) => sum + fact.population, 0)
  const disaster = facts.reduce((sum, fact) => sum + fact.disaster, 0)
  return {
    grain, output, arable, sown, irrigated, machinery, fertilizer, population, disaster,
    grainYoY: +((grain / facts.reduce((s, f) => s + f.grain / (1 + f.grainYoY / 100), 0) - 1) * 100).toFixed(1),
    outputYoY: +((output / facts.reduce((s, f) => s + f.output / (1 + f.outputYoY / 100), 0) - 1) * 100).toFixed(1),
  }
})()

// 全国粮食产量年度趋势（2016–2025，万吨）
export const grainTrend = [
  { year: '2016', value: 61624 }, { year: '2017', value: 66161 }, { year: '2018', value: 65789 },
  { year: '2019', value: 66384 }, { year: '2020', value: 66949 }, { year: '2021', value: 68285 },
  { year: '2022', value: 68653 }, { year: '2023', value: 69541 }, { year: '2024', value: nationalTotals.grain / (1 + nationalTotals.grainYoY / 100) },
  { year: '2025', value: Math.round(nationalTotals.grain) },
]

// 农林牧渔总产值构成（亿元）：农业种植业 / 林业 / 牧业 / 渔业 / 农林牧渔服务业
function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((value, weight) => value + weight, 0)
  let cumulative = 0
  return weights.map(weight => {
    const previous = Math.round(total * cumulative / sum)
    cumulative += weight
    return Math.round(total * cumulative / sum) - previous
  })
}

function composition(rows: { name: string; value: number }[], total: number) {
  const values = allocate(total, rows.map(row => row.value))
  return rows.map((row, index) => ({ ...row, value: values[index] }))
}

export const industryComposition = composition([
  { name: '种植业', value: 102000 },
  { name: '牧业', value: 48800 },
  { name: '渔业', value: 19600 },
  { name: '林业', value: 8600 },
  { name: '农林牧渔服务业', value: 8000 },
], nationalTotals.output)

// 粮食作物构成（万吨）：玉米 / 稻谷 / 小麦 / 大豆 / 薯类 / 其他
export const cropComposition = composition([
  { name: '玉米', value: 28900 }, { name: '稻谷', value: 20650 }, { name: '小麦', value: 13660 },
  { name: '薯类', value: 2900 }, { name: '大豆', value: 2070 }, { name: '其他杂粮', value: 3400 },
], nationalTotals.grain)

export function modernization(adcode: string) {
  const fact = provinceFact(adcode)
  const dimensions: { name: string; read: (row: ProvinceFact) => number }[] = [
    { name: '农机密度', read: row => row.machinery / Math.max(1, row.arable) },
    { name: '灌溉比例', read: row => row.irrigated / Math.max(1, row.arable) },
    { name: '复种指数', read: row => row.sown / Math.max(1, row.arable) },
    { name: '粮食亩产', read: row => row.grain / Math.max(1, row.sown) },
    { name: '化肥强度', read: row => row.fertilizer / Math.max(1, row.sown) },
  ]
  return dimensions.map(({ name, read }) => ({ name, value: Math.round(read(fact) / Math.max(Number.EPSILON, ...facts.map(read)) * 100) }))
}

// 任意区域指标值：省级取锚点；市/区县沿父级链确定性分摊（adcode 决定份额，稳定不变）
function shareWeight(adcode: string): number {
  const random = seededRandom(Number(adcode) % 0xffffffff)
  return 0.35 + random() * 0.65
}
export function regionMetric(adcode: string, metric: MetricKey): number {
  const node = region(adcode)
  if (!node.parent) return nationalTotals[metric]
  if (node.level === 2) return provinceFact(adcode)[metric]
  const parent = region(node.parent)
  const siblings = parent.children
  const weights = siblings.map(shareWeight)
  const index = siblings.indexOf(adcode)
  return allocate(regionMetric(parent.id, metric), weights)[index]
}
export function childrenValues(regionId: string, childIds: string[], metric: MetricKey): Record<string, number> {
  return Object.fromEntries(childIds.map(id => [id, regionMetric(id, metric)]))
}
export function regionStats(adcode: string) {
  const node = region(adcode)
  if (node.level === 2) {
    const fact = provinceFact(adcode)
    return { grain: fact.grain, output: fact.output, arable: fact.arable, machinery: fact.machinery, grainYoY: fact.grainYoY, outputYoY: fact.outputYoY }
  }
  return { grain: regionMetric(adcode, 'grain'), output: regionMetric(adcode, 'output'), arable: regionMetric(adcode, 'arable'), machinery: regionMetric(adcode, 'machinery'), grainYoY: 0, outputYoY: 0 }
}

export const number = (value: number) => value.toLocaleString('zh-CN')
export const rate = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
export const yoy = (value: number) => rate(value)

export function formatMetric(value: number, metric: MetricKey): string {
  const info = metricOptions[metric]
  if (value >= 10000) {
    if (metric === 'output') return `${(value / 10000).toFixed(2)} 万亿元`
    if (metric === 'arable') return `${(value / 10000).toFixed(2)} 亿亩`
    if (metric === 'machinery') return `${(value / 10000).toFixed(2)} 亿千瓦`
  }
  return `${number(value)} ${info.unit}`
}
