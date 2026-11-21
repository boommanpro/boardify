import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, describe, it, expect, vi } from 'vitest'
import manifest from '@/data/maps/manifest.json'
import { region, pathTo, readGeo, validateGeo } from '@/lib/maps'

afterEach(() => vi.unstubAllGlobals())
function stubLocalFetch() {
  vi.stubGlobal('fetch', async (input: string) => {
    const file = decodeURIComponent(String(input).split('/').at(-1) ?? '')
    const path = resolve(process.cwd(), 'public/maps', file)
    const content = await readFile(path, 'utf-8')
    return { ok: true, status: 200, json: async () => JSON.parse(content) }
  })
}

describe('清单驱动的本地地图（全国→省→市→区县）', () => {
  it('清单包含全国、34 省级与市/区县节点', () => {
    expect(manifest.root).toBe('100000')
    expect(manifest.nodes.filter(node => node.level === 2)).toHaveLength(34)
    expect(manifest.assets.length).toBeGreaterThanOrEqual(360)
    expect(manifest.nodes.some(node => node.level === 3 && node.administrativeLevel === 'city')).toBe(true)
    expect(manifest.nodes.some(node => node.level === 4 && node.administrativeLevel === 'district')).toBe(true)
    manifest.nodes.forEach(node => expect(pathTo(node.id)).toHaveLength(node.level))
  })
  it('全国地图加载并保留台湾与南海诸岛（九段线）', async () => {
    stubLocalFetch()
    const national = await readGeo('100000')
    const ids = national.features.map(feature => String(feature.properties.adcode))
    expect(ids).toContain('710000')
    expect(ids).toContain('100000_JD')
    expect(national.features.length).toBeGreaterThan(34)
  })
  it('省市县三级均可加载，区县为最细层级', async () => {
    stubLocalFetch()
    const heilongjiang = await readGeo('230000')
    expect(heilongjiang.features.length).toBeGreaterThan(0)
    expect(region('230000').children.length).toBeGreaterThan(0)
    const harbin = await readGeo('230100')
    expect(harbin.features.length).toBeGreaterThan(0)
    expect(region('230100').children.length).toBeGreaterThan(0)
    const nangang = await readGeo('230103')
    expect(nangang.features).toHaveLength(1)
    expect(region('230103').children).toHaveLength(0)
    expect(region('230103').limitation).toContain('最细层级')
  })
  it('拒绝未知区域与不在白名单的资产', async () => {
    stubLocalFetch()
    expect(() => region('missing')).toThrow('未知行政区')
    await expect(readGeo('missing')).rejects.toThrow('未知行政区')
  })
  it('拒绝空地图与无效坐标', () => {
    expect(() => validateGeo(null)).toThrow('格式错误')
    expect(() => validateGeo({ type: 'FeatureCollection', features: [] })).toThrow('为空')
    expect(() => validateGeo({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { adcode: '110000', name: '北京市' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 1], [2, 2], [3, 3]]] } }] })).toThrow('闭合')
  })
})
