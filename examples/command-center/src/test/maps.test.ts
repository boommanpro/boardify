import { describe, it, expect } from 'vitest'
import manifest from '@/data/maps/manifest.json'
import { breadcrumbs, getChild, getNode, loadMap, validateMap } from '@/lib/maps'

describe('清单驱动的本地地图', () => {
  it.each(manifest.nodes)('加载并验证 $id', async node => {
    const map = await loadMap(node.id)
    expect(map.features.length).toBeGreaterThan(0)
    expect(breadcrumbs(node.id)).toHaveLength(node.level)
    node.children.forEach(child => expect(getChild(node.id, child).parent).toBe(node.id))
  })
  it('拒绝未知区域和跳级下钻', async () => {
    expect(() => getNode('missing')).toThrow('不存在')
    await expect(loadMap('missing')).rejects.toThrow('不存在')
    expect(() => getChild('overview', 'north-harbor')).toThrow('不能跳级')
  })
  it('拒绝空地图与无效坐标', () => {
    expect(() => validateMap(null)).toThrow('格式错误')
    expect(() => validateMap({ type: 'FeatureCollection', features: [] })).toThrow('为空')
    expect(() => validateMap({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { id: 'x', name: 'x' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 1], [2, 2], [3, 3]]] } }] })).toThrow('闭合')
  })
})
