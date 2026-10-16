import manifest from '@/data/maps/manifest.json'

export { manifest }
export type Region = { id: string; name: string; parent: string | null; level: number; administrativeLevel: string; asset: string; featureId: string | null; children: string[]; limitation: string }
export type Geometry = { type: 'Polygon'; coordinates: number[][][] } | { type: 'MultiPolygon'; coordinates: number[][][][] }
export type GeoData = { type: 'FeatureCollection'; features: { type: 'Feature'; properties: { adcode: string | number; name: string }; geometry: Geometry }[] }
const nodes = new Map(manifest.nodes.map(node => [node.id, node]))
export function region(id: string): Region {
  const node = nodes.get(id)
  if (!node) throw new Error(`未知行政区：${id}`)
  return node
}
export function pathTo(id: string): Region[] {
  const node = region(id)
  return node.parent ? [...pathTo(node.parent), node] : [node]
}
export function validateGeo(value: unknown): GeoData {
  const map = value as GeoData
  if (map?.type !== 'FeatureCollection' || !Array.isArray(map.features) || !map.features.length) throw new Error('地图为空或格式错误')
  const ids = new Set<string>()
  for (const feature of map.features) {
    const id = String(feature.properties?.adcode)
    if (feature.type !== 'Feature' || typeof feature.properties?.name !== 'string' || (!feature.properties.name && id !== '100000_JD') || !/^(\d{6}|100000_JD)$/.test(id) || ids.has(id)) throw new Error('要素标识无效或重复')
    ids.add(id)
    const geometry = feature.geometry
    if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) throw new Error('几何类型无效')
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
    if (!Array.isArray(polygons) || !polygons.length) throw new Error('几何为空')
    for (const polygon of polygons) {
      if (!Array.isArray(polygon) || !polygon.length) throw new Error('多边形为空')
      for (const ring of polygon) {
        if (!Array.isArray(ring) || ring.length < 4 || ring.some(p => !Array.isArray(p) || p.length < 2 || !p.every(Number.isFinite) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90) || ring[0][0] !== ring.at(-1)![0] || ring[0][1] !== ring.at(-1)![1]) throw new Error('坐标越界或环未闭合')
      }
    }
  }
  return map
}
export async function readGeo(id: string): Promise<GeoData> {
  const node = region(id)
  if (!manifest.assets.some(asset => asset.file === node.asset)) throw new Error('地图不在本地白名单')
  const response = await fetch(`${import.meta.env.BASE_URL}maps/${node.asset}`)
  if (!response.ok) throw new Error(`本地地图读取失败：${response.status}`)
  const map = validateGeo(await response.json())
  if (node.children.some(child => !map.features.some(feature => String(feature.properties.adcode) === child))) throw new Error('地图子级与清单不一致')
  const features = map.features.filter(feature => !node.featureId || String(feature.properties.adcode) === node.featureId).map(feature => ({ ...feature, properties: { ...feature.properties, adcode: String(feature.properties.adcode) } }))
  return validateGeo({ ...map, features })
}
