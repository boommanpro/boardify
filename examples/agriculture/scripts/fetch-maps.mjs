import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

// 农业大盘专用：下载 全国→省→市→区县 全量 DataV.GeoAtlas 地图并生成本地清单。
// 用法：node scripts/fetch-maps.mjs --learning-only
if (!process.argv.includes('--learning-only')) throw new Error('用法：node scripts/fetch-maps.mjs --learning-only；仅本地学习，不授权分发')
const root = resolve(fileURLToPath(new URL('..', import.meta.url))) + '/'
const directory = `${root}public/maps`
await mkdir(directory, { recursive: true })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const nodes = []
const assets = []
const gaps = []
async function download(id) {
  const file = `${id}_full.json`
  const url = `https://geo.datav.aliyun.com/areas_v3/bound/${file}`
  let bytes
  try { bytes = await readFile(`${directory}/${file}`) } catch {
    let error
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const candidate = Buffer.from(await response.arrayBuffer())
        const data = JSON.parse(candidate)
        if (data.type !== 'FeatureCollection' || !data.features.length) throw new Error('无有效要素')
        bytes = candidate
        await writeFile(`${directory}/${file}`, bytes)
        break
      } catch (reason) { error = reason }
    }
    if (!bytes) throw error
  }
  const data = JSON.parse(bytes)
  assets.push({ file, url, sha256: sha(bytes), bytes: bytes.length, retrievedAt: new Date().toISOString() })
  return data
}
async function visit(id, name, parent, level, feature, parentAsset) {
  const node = { id, name, parent, level, administrativeLevel: feature?.properties.level ?? 'country', asset: parentAsset ?? `${id}_full.json`, featureId: parentAsset ? id : null, children: [], limitation: '' }
  nodes.push(node)
  if (feature && (!feature.properties.childrenNum || feature.properties.level === 'district')) {
    node.limitation = feature.properties.level === 'district' ? '区县边界为最细层级，不含乡镇' : '来源未提供下级边界'
    if (feature.properties.level !== 'district') gaps.push({ id, name, reason: node.limitation })
    return
  }
  let map
  try { map = await download(id) } catch (error) {
    node.limitation = `下级获取失败：${error.message}`
    gaps.push({ id, name, reason: node.limitation })
    if (!parentAsset) throw error
    return
  }
  node.asset = `${id}_full.json`
  node.featureId = null
  const children = map.features.filter(item => /^\d{6}$/.test(String(item.properties.adcode)) && String(item.properties.adcode) !== id)
  node.children = children.map(item => String(item.properties.adcode))
  if (feature && children.length !== feature.properties.childrenNum) gaps.push({ id, name, reason: `来源声明 ${feature.properties.childrenNum} 个子级，实际 ${children.length} 个` })
  for (let index = 0; index < children.length; index += 5) {
    await Promise.all(children.slice(index, index + 5).map(child => visit(String(child.properties.adcode), child.properties.name, id, level + 1, child, node.asset)))
  }
}
await visit('100000', '全国', null, 1)
nodes.sort((a, b) => a.id.localeCompare(b.id))
assets.sort((a, b) => a.file.localeCompare(b.file))
const manifest = {
  root: '100000', version: 'datav-areas-v3-2021.5',
  source: { provider: '阿里云 DataV.GeoAtlas / 高德开放平台', page: 'https://datav.aliyun.com/portal/school/atlas/area_selector', vintage: '2021.5', license: '仅供学习交流使用；未取得商用、修改、公开再分发许可', releaseApproved: false, crs: '未独立核实；禁止叠加外部地理点位', processing: '原始文件逐字节保存；区县从父文件提取完整 Feature，未简化或修改坐标', review: '审图适用性、坐标控制点、最新行政区划均未核实' },
  nodes, assets, gaps,
}
const bytes = JSON.stringify(manifest, null, 2) + '\n'
await writeFile(`${root}src/data/maps/manifest.json`, bytes)
await mkdir(`${root}docs`, { recursive: true })
await writeFile(`${root}docs/maps-baseline.json`, JSON.stringify({ manifestSha256: sha(bytes), assets: Object.fromEntries(assets.map(asset => [asset.file, asset.sha256])) }, null, 2) + '\n')
console.log(JSON.stringify({ nodes: nodes.length, assets: assets.length, bytes: assets.reduce((sum, asset) => sum + asset.bytes, 0), gaps }, null, 2))
