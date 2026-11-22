import { describe, expect, it } from 'vitest'
import { FUNNEL_STAGES, RETENTION_WEEKS, queryChannels, queryFunnel, queryKpis, queryRetention, querySegments, queryTrend, type Filters } from '@/data/source'

const base: Filters = { period: 'week', cohort: 'all' }

describe('增长分析数据层', () => {
  it('同一筛选结果确定', () => {
    expect(queryKpis(base)).toEqual(queryKpis(base))
    expect(queryFunnel(base)).toEqual(queryFunnel(base))
  })
  it('漏斗各级严格包含（下一级 ≤ 上一级）且阶段顺序稳定', () => {
    const funnel = queryFunnel(base)
    expect(funnel.map(stage => stage.name)).toEqual(FUNNEL_STAGES)
    for (let index = 1; index < funnel.length; index++) expect(funnel[index].value).toBeLessThanOrEqual(funnel[index - 1].value)
  })
  it('客群收窄后访客口径同步缩小', () => {
    const all = queryKpis(base)[0].value
    const fresh = queryKpis({ ...base, cohort: 'new' })[0].value
    expect(Number(fresh.replaceAll(',', ''))).toBeLessThan(Number(all.replaceAll(',', '')))
  })
  it('留存矩阵：注册当周 100%，未满周数不造数据，衰减单调', () => {
    const cells = queryRetention(base)
    const at = (x: number, y: number) => cells.find(cell => cell.x === x && cell.y === y)?.value
    for (let cohort = 0; cohort < RETENTION_WEEKS; cohort++) {
      expect(at(0, cohort)).toBe(100)
      // 越过已满周数的格子必须缺失（缺失保持缺失，不补零）
      expect(at(RETENTION_WEEKS - cohort, cohort)).toBeUndefined()
    }
    expect(at(1, 0)!).toBeLessThan(100)
    expect(at(2, 0)!).toBeLessThanOrEqual(at(1, 0)!)
  })
  it('趋势双系列共用时间轴', () => {
    const trend = queryTrend(base)
    expect(trend.series).toHaveLength(2)
    expect(trend.series.every(series => series.values.length === trend.labels.length)).toBe(true)
  })
  it('分层散点坐标与气泡均为有限正数', () => {
    expect(querySegments(base).every(point => point.x > 0 && point.y > 0 && point.size > 0)).toBe(true)
  })
  it('渠道明细可排序字段齐全', () => {
    const rows = queryChannels(base)
    expect(rows).toHaveLength(5)
    expect(rows.every(row => row.visitors > 0 && row.gmv > 0 && row.conversion.endsWith('%'))).toBe(true)
  })
})
