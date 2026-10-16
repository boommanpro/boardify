import { createHash } from 'node:crypto'
import { readFile, readdir, realpath, stat } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const skill = fileURLToPath(new URL('../', import.meta.url))
const baseline = {
  'manifest.json': '458de3cf6171072dd9fd0a48994a375bf0da9b3a8bc2ab1648e753f66e02a670',
  'district.json': 'd43bf0e42222d998783f2994acfd2b5570802264e2ce9459265a7633453c9b2f',
  'north.json': '185dc946fdd1a905a2c2a9b21fba5ca6b3a5358dbc0f48ad469e5ee2d96975be',
  'overview.json': 'ca24714d13f8d77f1b6b112ea55031a2c5be3a6d77318f5c201cfdb88eafef82',
  'south.json': 'f638d0b6214aa626f321519c3147d36beef5565dd0dd5ddfeb00710ce6e9c20c'
}
const assert = (value, message) => { if (!value) throw new Error(message) }
const text = value => typeof value === 'string' && value.trim().length > 0

export function validateGeometry(map) {
  assert(map?.type === 'FeatureCollection' && Array.isArray(map.features) && map.features.length, '地图必须为非空 FeatureCollection')
  const ids = new Set()
  for (const feature of map.features) {
    const props = feature?.properties
    assert(feature?.type === 'Feature' && text(props?.id) && text(props?.name) && !ids.has(props.id), '要素标识、名称缺失或重复')
    ids.add(props.id)
    assert(feature.geometry?.type === 'Polygon', '当前 starter 仅支持 Polygon')
    const rings = feature.geometry.coordinates
    assert(Array.isArray(rings) && rings.length, '多边形缺少边界')
    for (const ring of rings) {
      assert(Array.isArray(ring) && ring.length >= 4, '边界点数不足')
      assert(ring.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)), '坐标必须是两个有限数值')
      assert(ring[0].every((value, index) => value === ring.at(-1)[index]), '边界未闭合')
      assert(new Set(ring.slice(0, -1).map(point => JSON.stringify(point))).size >= 3, '边界有效顶点不足')
      const area = ring.slice(1).reduce((sum, point, index) => sum + ring[index][0] * point[1] - point[0] * ring[index][1], 0)
      assert(Number.isFinite(area) && area !== 0, '边界面积退化或溢出')
    }
  }
  return map
}

export function validateTree(manifest, maps) {
  assert(text(manifest?.root) && Array.isArray(manifest.nodes) && manifest.nodes.length, '地图清单缺少根或节点')
  const nodes = new Map()
  for (const node of manifest.nodes) {
    assert(text(node.id) && !nodes.has(node.id) && text(node.name), '节点标识或名称无效、重复')
    assert(Number.isInteger(node.level) && node.level >= 1 && node.level <= 3, '节点层级必须为 1 至 3')
    assert(typeof node.asset === 'string' && /^[a-zA-Z0-9_-]+$/.test(node.asset) && maps.has(node.asset), '节点引用非法或缺失地图')
    assert(Array.isArray(node.children) && node.children.every(text) && new Set(node.children).size === node.children.length, '子节点清单无效或重复')
    nodes.set(node.id, node)
  }
  const root = nodes.get(manifest.root)
  assert(root?.parent === null && root.level === 1, '根节点父级或层级错误')
  for (const node of nodes.values()) {
    if (node !== root) {
      const parent = nodes.get(node.parent)
      assert(parent && parent.children.includes(node.id) && node.level === parent.level + 1, `父子关系或层级不一致：${node.id}`)
    }
    const features = maps.get(node.asset).features
    for (const id of node.children) {
      const child = nodes.get(id)
      assert(child && child.parent === node.id && child.level === node.level + 1, `子节点反向关系错误：${id}`)
      assert(features.some(feature => feature.properties.id === id && feature.properties.name === child.name), `父图缺少匹配子区域：${id}`)
    }
    if (node.children.length) assert(features.length === node.children.length, `父图存在清单外区域：${node.id}`)
  }
  const visited = new Set()
  function visit(id) {
    assert(!visited.has(id), `地图树出现环或重复引用：${id}`)
    visited.add(id)
    nodes.get(id).children.forEach(visit)
  }
  visit(manifest.root)
  assert(visited.size === nodes.size, '地图树包含不可达节点')
  assert(new Set(manifest.nodes.map(node => node.asset)).size === maps.size, '存在未引用地图资产')
}

async function validateLinks(root) {
  const base = await realpath(root)
  const entry = resolve(base, 'SKILL.md')
  assert((await stat(entry)).isFile(), '缺少 SKILL.md')
  let count = 0
  async function walk(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (['node_modules', 'dist', '.git'].includes(item.name)) continue
      const file = resolve(directory, item.name)
      if (item.isDirectory()) await walk(file)
      else if (item.isFile() && item.name.endsWith('.md')) {
        const content = await readFile(file, 'utf8')
        const definitions = new Map([...content.matchAll(/^\s{0,3}\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm)].map(match => [match[1].trim().toLowerCase(), match[2]]))
        const links = [...content.matchAll(/\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\s*\)/g)].map(match => match[1].replace(/^<|>$/g, ''))
        for (const match of content.matchAll(/\[([^\]]+)\]\[([^\]]*)\]/g)) {
          const label = (match[2] || match[1]).trim().toLowerCase()
          assert(definitions.has(label), `未定义链接：${file} ${label}`)
          links.push(definitions.get(label))
        }
        links.push(...definitions.values())
        for (const link of links) {
          if (/^(?:https?:|mailto:|#)/i.test(link)) continue
          assert(!/^[a-z][a-z0-9+.-]*:/i.test(link) && !link.startsWith('//'), `不支持的链接：${link}`)
          const pathname = decodeURIComponent(link.split(/[?#]/)[0])
          if (!pathname) continue
          const target = await realpath(resolve(dirname(file), pathname))
          assert(target === base || target.startsWith(base + sep), `链接越出技能目录：${link}`)
          count++
        }
      }
    }
  }
  await walk(base)
  return count
}

export async function validate({ project = resolve(skill, 'assets/starter'), skillRoot = skill } = {}) {
  const errors = []
  async function check(name, action) {
    try {
      await action()
      console.log(`通过：${name}`)
    } catch (error) {
      errors.push(`${name}：${error.message}`)
      console.error(`失败：${name}：${error.message}`)
    }
  }
  await check('技能入口及本地 Markdown 链接', () => validateLinks(skillRoot))
  const directory = resolve(project, 'src/data/maps')
  const maps = new Map()
  let manifest
  await check('地图文件集合、SHA-256 与几何', async () => {
    const files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort()
    assert(JSON.stringify(files) === JSON.stringify(Object.keys(baseline).sort()), '地图文件集合与固定 starter 基线不一致')
    const failures = []
    for (const file of files) {
      try {
        const bytes = await readFile(resolve(directory, file))
        const value = JSON.parse(bytes.toString('utf8'))
        if (file === 'manifest.json') manifest = value
        else maps.set(file.slice(0, -5), validateGeometry(value))
        assert(createHash('sha256').update(bytes).digest('hex') === baseline[file], `SHA-256 不匹配：${file}`)
      } catch (error) { failures.push(`${file}：${error.message}`) }
    }
    assert(!failures.length, failures.join('；'))
  })
  await check('地图清单父子关系与要素关联', () => validateTree(manifest, maps))
  console.log('范围：固定 starter 合成地图的完整性与基础几何检查；不证明真实行政边界、许可、坐标系或浏览器表现。外链与锚点未联网核验。')
  return { ok: errors.length === 0, errors }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3) {
    console.error('用法：node validate.mjs [项目目录]')
    process.exitCode = 1
  } else {
    const result = await validate({ project: process.argv[2] ? resolve(process.argv[2]) : undefined })
    process.exitCode = result.ok ? 0 : 1
  }
}
