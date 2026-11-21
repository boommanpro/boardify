import { describe, expect, it } from 'vitest'
import manifest from '@/data/maps/manifest.json'
import {
  facts, provinceValues, provinceRows, nationalTotals, childrenValues, provinceFact,
  regionMetric, regionStats, modernization, formatMetric, grainTrend, industryComposition, cropComposition, metricOptions,
} from '@/data/agriculture'

describe('农业演示数据层', () => {
  it('覆盖全部省级行政区（含台港澳）', () => {
    const ids = manifest.nodes.filter(node => node.level === 2).map(node => node.id).sort()
    expect(facts.map(fact => fact.adcode).sort()).toEqual(ids)
  })
  it('量级合理且数值为正', () => {
    expect(nationalTotals.grain).toBeGreaterThan(60000)
    expect(nationalTotals.grain).toBeLessThan(80000)
    expect(nationalTotals.output).toBeGreaterThan(140000)
    expect(nationalTotals.arable).toBeGreaterThan(150000)
    expect(nationalTotals.machinery).toBeGreaterThan(80000)
    expect(Object.keys(provinceValues('grain'))).toHaveLength(34)
  })
  it('省级汇总与全国总量一致', () => {
    expect(facts.reduce((sum, fact) => sum + fact.grain, 0)).toBe(nationalTotals.grain)
    expect(facts.reduce((sum, fact) => sum + fact.output, 0)).toBe(nationalTotals.output)
  })
  it('多级分摊确定性且父子一致（省→市→区县）', () => {
    const province = manifest.nodes.find(node => node.id === '230000')!
    const cityIds = province.children
    const first = childrenValues('230000', cityIds, 'grain')
    const second = childrenValues('230000', cityIds, 'grain')
    expect(first).toEqual(second)
    const citySum = Object.values(first).reduce((sum, value) => sum + value, 0)
    expect(citySum).toBe(provinceFact('230000').grain)
    const city = manifest.nodes.find(node => node.id === '230100')!
    const districtValues = childrenValues('230100', city.children, 'grain')
    expect(Object.keys(districtValues).length).toBeGreaterThan(0)
    expect(Object.values(districtValues).every(value => value > 0)).toBe(true)
    expect(regionMetric('230100', 'grain')).toBeGreaterThan(0)
    expect(regionMetric('230100', 'grain')).toBeLessThan(provinceFact('230000').grain)
    const stats = regionStats('230100')
    expect(stats.grain).toBeGreaterThan(0)
    expect(stats.output).toBeGreaterThan(0)
  })
  it('要素相对指数落在 0-100', () => {
    const dims = modernization('130000')
    expect(dims).toHaveLength(5)
    dims.forEach(dim => {
      expect(dim.value).toBeGreaterThanOrEqual(0)
      expect(dim.value).toBeLessThanOrEqual(100)
    })
  })
  it('雷达按省际单位面积强度归一化而非全国总量占比', () => {
    const all = facts.map(fact => modernization(fact.adcode))
    for (let index = 0; index < 5; index++) {
      expect(Math.max(...all.map(dims => dims[index].value))).toBe(100)
    }
    const fact = provinceFact('130000')
    const maxDensity = Math.max(...facts.map(row => row.machinery / Math.max(1, row.arable)))
    expect(modernization(fact.adcode)[0].value).toBe(Math.round(fact.machinery / fact.arable / maxDensity * 100))
  })
  it('趋势与构成数据完整', () => {
    expect(grainTrend).toHaveLength(10)
    expect(industryComposition.length).toBeGreaterThanOrEqual(4)
    expect(cropComposition.length).toBeGreaterThanOrEqual(5)
  })
  it('格式化与指标配置可用', () => {
    expect(formatMetric(1, 'output')).toBe('1 亿元')
    expect(formatMetric(12, 'arable')).toBe('12 万亩')
    expect(formatMetric(8, 'machinery')).toBe('8 万千瓦')
    expect(formatMetric(70600, 'grain')).toContain('万吨')
    expect(formatMetric(187000, 'output')).toContain('万亿')
    expect(formatMetric(191400, 'arable')).toContain('亿亩')
    expect(metricOptions.grain.unit).toBe('万吨')
    expect(provinceRows('grain')).toHaveLength(34)
  })
  it('构成与总量、趋势与同比使用同一口径', () => {
    expect(industryComposition.reduce((sum, row) => sum + row.value, 0)).toBe(nationalTotals.output)
    expect(cropComposition.reduce((sum, row) => sum + row.value, 0)).toBe(nationalTotals.grain)
    expect((grainTrend[9].value / grainTrend[8].value - 1) * 100).toBeCloseTo(nationalTotals.grainYoY, 8)
    const previous = facts.reduce((sum, fact) => sum + fact.grain / (1 + fact.grainYoY / 100), 0)
    expect(nationalTotals.grainYoY).toBe(+((nationalTotals.grain / previous - 1) * 100).toFixed(1))
  })
  it('所有非叶级区域四项指标严格守恒', () => {
    for (const node of manifest.nodes.filter(node => node.children.length)) {
      for (const metric of ['grain', 'output', 'arable', 'machinery'] as const) {
        expect(node.children.reduce((sum, id) => sum + regionMetric(id, metric), 0)).toBe(regionMetric(node.id, metric))
      }
    }
  })
})
