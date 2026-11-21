import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { fitMap, splitNationalMap } from '@/lib/map-layout'
import { validateGeo, type GeoData } from '@/lib/maps'

function points(map: GeoData) {
  return map.features.flatMap(feature => feature.geometry.type === 'Polygon' ? feature.geometry.coordinates.flat() : feature.geometry.coordinates.flat(2))
}

describe('全国主体与南海附图布局', () => {
  it('保留所有原始多边形，南海不参与主体边界计算', async () => {
    const map = validateGeo(JSON.parse(await readFile('public/maps/100000_full.json', 'utf8')))
    const original = JSON.stringify(map)
    const { mainland, inset } = splitNationalMap(map)
    expect(JSON.stringify(map)).toBe(original)
    expect(points(mainland).length + points(inset).length).toBe(points(map).length)
    expect(mainland.features).toHaveLength(34)
    expect(mainland.features.some(feature => String(feature.properties.adcode) === '710000')).toBe(true)
    expect(inset.features.some(feature => feature.properties.adcode === '100000_JD')).toBe(true)
    expect(Math.min(...points(mainland).map(point => point[1]))).toBeGreaterThan(18)
    expect(Math.min(...points(inset).map(point => point[1]))).toBeLessThan(4)
    const coordinates = points(mainland)
    const aspect = (Math.max(...coordinates.map(point => point[0])) - Math.min(...coordinates.map(point => point[0]))) / (Math.max(...coordinates.map(point => point[1])) - Math.min(...coordinates.map(point => point[1]))) * 0.94
    for (const [width, height] of [[997, 373], [1349, 640], [692, 162]]) {
      const size = fitMap(mainland, width, height, 0.94, 0.75) as number
      expect(size / aspect / height).toBeCloseTo(0.75)
      expect(size).toBeLessThan(width)
    }
    expect(fitMap(mainland, 0, 0, 0.94, 0.75)).toBe('100%')
  })
})
