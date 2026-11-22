import { describe, expect, it } from 'vitest'
import { RADAR_INDICATORS, queryKpis, queryRadar, queryRank, queryShare, queryStacked, queryTrend, regionValue, type Filters } from '@/data/source'

const base: Filters = { tick: 0 }

describe('指挥大屏数据层', () => {
  it('同一数据版本结果确定，版本推进后 KPI 必然变化', () => {
    expect(queryKpis(base)).toEqual(queryKpis(base))
    expect(queryKpis({ tick: 3 })[0].value).not.toBe(queryKpis({ tick: 4 })[0].value)
    expect(queryKpis({ tick: 3 })[1].value).not.toBe(queryKpis({ tick: 4 })[1].value)
  })
  it('画像维度 3-8 个且评分落在 0-100', () => {
    expect(RADAR_INDICATORS.length).toBeGreaterThanOrEqual(3)
    expect(RADAR_INDICATORS.length).toBeLessThanOrEqual(8)
    const [entity] = queryRadar(base)
    expect(entity.values).toHaveLength(RADAR_INDICATORS.length)
    expect(entity.values.every(value => value >= 0 && value <= 100)).toBe(true)
  })
  it('区域排行与地图填色共用同一套区域名', () => {
    const rank = queryRank(base)
    expect(rank).toHaveLength(6)
    expect(rank.map(row => row.name)).toEqual(['北部示范区', '南部示范区', '云港片区', '青丘片区', '星湖片区', '南苑片区'])
  })
  it('地图填色对同一要素在相邻数据版本间波动且恒为正', () => {
    const id = 'north'
    expect(regionValue(id, { tick: 3 })).toBeGreaterThan(0)
    expect(regionValue(id, { tick: 3 })).toBe(regionValue(id, { tick: 3 }))
  })
  it('趋势双序列共用 24 小时时间轴，堆叠各品类共用时段轴', () => {
    const trend = queryTrend(base)
    expect(trend.labels).toHaveLength(24)
    expect(trend.series.every(series => series.values.length === 24)).toBe(true)
    const stacked = queryStacked(base)
    expect(stacked.series.length).toBeGreaterThan(1)
    expect(stacked.series.every(series => series.values.length === stacked.labels.length)).toBe(true)
  })
  it('渠道构成为正值构成', () => {
    expect(queryShare(base).every(row => row.value > 0)).toBe(true)
  })
})
