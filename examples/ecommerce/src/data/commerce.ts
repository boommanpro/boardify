import { manifest, pathTo } from '@/lib/geography'

export const channels = ['自然搜索', '付费推广', '私域社群', '直接访问']
export const categories = ['数码家电', '服饰生活', '食品饮料']
export type Filters = { start: string; end: string; channel: string; category: string; region: string }
export const initialFilters: Filters = { start: '2026-10-01', end: '2026-10-14', channel: '全部', category: '全部', region: '100000' }
export type Fact = { date: string; region: string; ancestors: string[]; channel: string; category: string; cohort: string; visits: number; carts: number; orders: number; cents: number; shipped: number; delivered: number; refunds: number }
export function generate(seed = 20261015): Fact[] {
  let state = seed >>> 0
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 }
  const leaves = manifest.nodes.filter(node => !node.children.length)
  return leaves.flatMap(node => {
    const ancestors = pathTo(node.id).map(item => item.id)
    return Array.from({ length: 14 }, (_, day) => {
      const visits = 30 + Math.floor(random() * 250)
      const carts = Math.floor(visits * (0.15 + random() * 0.2))
      const orders = Math.floor(carts * (0.2 + random() * 0.5))
      const shipped = Math.floor(orders * (0.85 + random() * 0.15))
      return { date: `2026-10-${String(day + 1).padStart(2, '0')}`, region: node.id, ancestors, channel: channels[Math.floor(random() * channels.length)], category: categories[Math.floor(random() * categories.length)], cohort: random() > 0.4 ? '老客' : '新客', visits, carts, orders, cents: orders * (5000 + Math.floor(random() * 50000)), shipped, delivered: Math.floor(shipped * (0.8 + random() * 0.2)), refunds: Math.floor(orders * random() * 0.08) }
    })
  })
}
export const facts = generate()
export function filterFacts(filters: Filters, source = facts) {
  return source.filter(row => row.date >= filters.start && row.date <= filters.end && (filters.channel === '全部' || row.channel === filters.channel) && (filters.category === '全部' || row.category === filters.category) && row.ancestors.includes(filters.region))
}
export const fields = ['visits', 'carts', 'orders', 'cents', 'shipped', 'delivered', 'refunds'] as const
export function summarize(rows: Fact[]) {
  return rows.reduce((total, row) => { for (const key of fields) total[key] += row[key]; return total }, { visits: 0, carts: 0, orders: 0, cents: 0, shipped: 0, delivered: 0, refunds: 0 })
}
export function group(rows: Fact[], key: 'date' | 'channel' | 'category' | 'cohort') {
  const buckets = new Map<string, Fact[]>()
  for (const row of rows) { const items = buckets.get(row[key]) ?? []; items.push(row); buckets.set(row[key], items) }
  return [...buckets].sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => ({ name, ...summarize(items) }))
}
export const number = (n: number) => n.toLocaleString('zh-CN')
export const money = (cents: number) => (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const rate = (a: number, b: number) => b ? `${(a / b * 100).toFixed(2)}%` : '—'
