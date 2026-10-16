import manifest from '@/data/maps/manifest.json'

export type MapNode = typeof manifest.nodes[number]
export type MapData = { type: 'FeatureCollection'; features: { type: 'Feature'; properties: { id: string; name: string }; geometry: { type: 'Polygon'; coordinates: number[][][] } }[] }
const assets = import.meta.glob(['../data/maps/*.json', '!../data/maps/manifest.json'], { import: 'default' })
export const rootId = manifest.root
export function getNode(id: string): MapNode {
  const node = manifest.nodes.find(node => node.id === id)
  if (!node) throw new Error(`地图清单中不存在区域：${id}`)
  return node
}
export function getChild(parent: string, child: string) {
  if (!getNode(parent).children.includes(child)) throw new Error('不能跳级或进入非直属区域')
  return getNode(child)
}
export function validateMap(value: unknown): MapData {
  const map = value as MapData
  if (map?.type !== 'FeatureCollection' || !Array.isArray(map.features) || !map.features.length) throw new Error('地图数据为空或格式错误')
  const ids = new Set<string>()
  for (const feature of map.features) {
    if (feature.type !== 'Feature' || !feature.properties?.id || !feature.properties.name || ids.has(feature.properties.id) || feature.geometry?.type !== 'Polygon' || !Array.isArray(feature.geometry.coordinates) || !feature.geometry.coordinates.length) throw new Error('地图要素格式错误')
    ids.add(feature.properties.id)
    for (const ring of feature.geometry.coordinates) {
      if (!Array.isArray(ring) || ring.length < 4 || ring.some(point => !Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) || ring[0][0] !== ring.at(-1)![0] || ring[0][1] !== ring.at(-1)![1]) throw new Error('地图边界必须是闭合的有效坐标')
    }
  }
  return map
}
export async function loadMap(id: string): Promise<MapData> {
  const node = getNode(id)
  const loader = assets[`../data/maps/${node.asset}.json`]
  if (!loader) throw new Error(`缺少本地地图资源：${node.asset}`)
  const map = validateMap(await loader())
  if (node.children.some(child => !map.features.some(feature => feature.properties.id === child && feature.properties.name === getChild(id, child).name))) throw new Error('地图与下钻清单不一致')
  return map
}
export function breadcrumbs(id: string): MapNode[] {
  const node = getNode(id)
  return node.parent ? [...breadcrumbs(node.parent), node] : [node]
}
