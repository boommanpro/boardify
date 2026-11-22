import { describe, expect, it } from 'vitest'
import { ERROR_DAY_LABELS, ERROR_HOUR_LABELS, queryAlerts, queryErrors, queryHealth, queryLatency, queryStacked, type Filters } from '@/data/source'

const base: Filters = { scope: 'all' }

describe('运维数据层', () => {
  it('同一数据版本结果确定，版本推进后指标变化', () => {
    expect(queryHealth(3, base)).toEqual(queryHealth(3, base))
    expect(queryHealth(3, base)[1].value).not.toBe(queryHealth(4, base)[1].value)
  })
  it('服务范围收窄后延迟口径同步缩小', () => {
    const all = Number(queryHealth(0, base)[1].value.replace(' ms', ''))
    const core = Number(queryHealth(0, { scope: 'core' })[1].value.replace(' ms', ''))
    expect(core).toBeLessThan(all)
  })
  it('延迟 P50/P95 共用时间轴且 P95 恒不低于 P50', () => {
    const latency = queryLatency(0, base)
    expect(latency.series).toHaveLength(2)
    expect(latency.series.every(series => series.values.length === latency.labels.length)).toBe(true)
    expect(latency.series[1].values.every((value, index) => value >= latency.series[0].values[index])).toBe(true)
  })
  it('错误热力覆盖 7 天 × 全部时段', () => {
    const cells = queryErrors(0, base)
    expect(cells).toHaveLength(ERROR_DAY_LABELS.length * ERROR_HOUR_LABELS.length)
    expect(new Set(cells.map(cell => `${cell.x},${cell.y}`)).size).toBe(cells.length)
  })
  it('堆叠各服务共用时间轴', () => {
    const stacked = queryStacked(0, base)
    expect(stacked.series.length).toBeGreaterThan(1)
    expect(stacked.series.every(series => series.values.length === stacked.labels.length)).toBe(true)
  })
  it('告警级别只取三档，特定数据版本出现空态与非空态', () => {
    const levels = new Set(['严重', '警告', '提示'])
    for (let tick = 0; tick < 40; tick++) {
      for (const alert of queryAlerts(tick)) expect(levels.has(alert.level)).toBe(true)
    }
    const emptiness = Array.from({ length: 60 }, (_, tick) => queryAlerts(tick).length === 0)
    expect(emptiness.some(Boolean)).toBe(true)
    expect(emptiness.some(empty => !empty)).toBe(true)
  })
})
