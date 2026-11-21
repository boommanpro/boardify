import { describe, expect, it } from 'vitest'
import {
  LOAD_DAY_LABELS,
  LOAD_HOUR_LABELS,
  queryKpis,
  queryLoad,
  queryRegionRows,
  queryShare,
  queryStacked,
  queryTrend,
  type Filters,
} from '@/data/source'

const base: Filters = { period: 'week', channel: 'all' }

describe('数据层', () => {
  it('同一筛选结果确定，且不同周期产出不同口径', () => {
    expect(queryKpis(base)).toEqual(queryKpis({ ...base }))
    expect(queryKpis(base)[0].value).not.toBe(queryKpis({ period: 'quarter', channel: 'all' })[0].value)
  })
  it('渠道筛选收窄后占比构成同步变化', () => {
    expect(queryShare(base).length).toBeGreaterThan(queryShare({ ...base, channel: 'online' }).length)
  })
  it('明细与占比共享同一筛选口径', () => {
    const rows = queryRegionRows({ period: 'month', channel: 'offline' })
    expect(rows).toHaveLength(6)
    expect(rows.every(row => Number.isFinite(row.orders) && row.orders > 0)).toBe(true)
  })
  it('趋势点数随周期变化，且多系列共用同一时间轴', () => {
    const week = queryTrend(base)
    expect(week.labels).toHaveLength(7)
    expect(queryTrend({ ...base, period: 'month' }).labels).toHaveLength(30)
    expect(queryTrend({ ...base, period: 'quarter' }).labels).toHaveLength(13)
    expect(week.series).toHaveLength(2)
    expect(week.series.every(series => series.values.length === week.labels.length)).toBe(true)
  })
  it('堆叠柱各系列共用时间轴，标签取最近的时段', () => {
    const stacked = queryStacked(base)
    expect(stacked.series.length).toBeGreaterThan(1)
    expect(stacked.series.every(series => series.values.length === stacked.labels.length)).toBe(true)
    expect(stacked.labels.length).toBeLessThanOrEqual(7)
  })
  it('时段负载覆盖 7 天 × 全部时段，值均为有限数', () => {
    const cells = queryLoad(base)
    expect(cells).toHaveLength(LOAD_DAY_LABELS.length * LOAD_HOUR_LABELS.length)
    expect(cells.every(cell => Number.isFinite(cell.value) && cell.value >= 0)).toBe(true)
    const keys = new Set(cells.map(cell => `${cell.x},${cell.y}`))
    expect(keys.size).toBe(cells.length)
  })
})
