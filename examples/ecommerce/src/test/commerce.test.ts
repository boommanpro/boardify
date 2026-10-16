import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { facts, generate, filterFacts, initialFilters, summarize, group, rate, fields } from '@/data/commerce'
import { manifest, pathTo, validateGeo } from '@/lib/geography'

describe('确定性业务数据', () => {
  it('种子可复现且各维度总量守恒', () => {
    expect(generate()).toEqual(facts)
    const rows = filterFacts(initialFilters)
    const total = summarize(rows)
    for (const dimension of ['date', 'channel', 'category', 'cohort'] as const) {
      for (const key of fields) expect(group(rows, dimension).reduce((sum, row) => sum + row[key], 0)).toBe(total[key])
    }
    expect(facts.every(row => row.delivered <= row.shipped && row.shipped <= row.orders && row.orders <= row.carts && row.carts <= row.visits)).toBe(true)
  })
  it('筛选、空集合与分母零', () => {
    expect(filterFacts({ ...initialFilters, start: '2027-01-01' })).toEqual([])
    expect(rate(0, 0)).toBe('—')
    const rows = filterFacts({ ...initialFilters, region: '440300', channel: '自然搜索', category: '数码家电' })
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every(row => row.ancestors.includes('440300') && row.channel === '自然搜索' && row.category === '数码家电')).toBe(true)
    expect(summarize(rows).orders).toBe(rows.reduce((sum, row) => sum + row.orders, 0))
  })
})
describe('真实资产与覆盖', () => {
  it('逐文件哈希、几何、层级与清单一致', () => {
    const maps = new Map(manifest.assets.map(asset => {
      const bytes = readFileSync(`public/maps/${asset.file}`)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256)
      expect(bytes.length).toBe(asset.bytes)
      return [asset.file, validateGeo(JSON.parse(bytes.toString()))]
    }))
    for (const node of manifest.nodes) {
      expect(pathTo(node.id)).toHaveLength(node.level)
      const map = maps.get(node.asset)!
      expect(map).toBeDefined()
      for (const id of node.featureId ? [node.featureId] : node.children) expect(map.features.some(feature => String(feature.properties.adcode) === id)).toBe(true)
    }
    expect(manifest.source.releaseApproved).toBe(false)
  })
  it('拒绝空图、越界及不闭合环，保留多多边形', () => {
    expect(() => validateGeo(null)).toThrow()
    const map = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { adcode: '110000', name: '测试' }, geometry: { type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]], [[[2, 2], [3, 2], [3, 3], [2, 2]]]] } }] }
    expect(validateGeo(map).features[0].geometry.coordinates).toHaveLength(2)
    map.features[0].geometry.coordinates[0][0][0][0] = 999
    expect(() => validateGeo(map)).toThrow()
  })
})
