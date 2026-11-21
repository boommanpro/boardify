import type { GeoData } from '@/lib/maps'

export function splitNationalMap(map: GeoData) {
  const mainland: GeoData = { type: 'FeatureCollection', features: [] }
  const inset: GeoData = { type: 'FeatureCollection', features: [] }
  for (const feature of map.features) {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
    const groups: number[][][][][] = [[], []]
    for (const polygon of polygons) {
      const offshore = String(feature.properties.adcode) === '100000_JD' || polygon.every(ring => ring.every(point => point[1] < 18))
      groups[offshore ? 1 : 0].push(polygon)
    }
    for (const [index, target] of [mainland, inset].entries()) {
      if (groups[index].length) target.features.push({ ...feature, geometry: { type: 'MultiPolygon', coordinates: groups[index] } })
    }
  }
  return { mainland, inset }
}

export function fitMap(map: GeoData, width: number, height: number, aspectScale: number, heightRatio = 0.99) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const feature of map.features) {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
    for (const polygon of polygons) for (const ring of polygon) for (const [x, y] of ring) {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  const aspect = (maxX - minX) / (maxY - minY) * aspectScale
  if (!width || !height || !Number.isFinite(aspect) || aspect <= 0) return '100%'
  const fittedHeight = Math.min(height * heightRatio, width * 0.99 / aspect)
  return fittedHeight * Math.max(1, aspect)
}
