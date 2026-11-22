import { cp, lstat, mkdir, readdir, realpath } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const starter = fileURLToPath(new URL('../assets/starter/', import.meta.url))
const excluded = new Set(['node_modules', 'dist', 'build', 'coverage', '.git', '.vite', '.cache', '.DS_Store', 'playwright-report', 'test-results'])
const inside = (root, path) => path === root || path.startsWith(root + sep)

export async function initialize(target) {
  if (!target) throw new Error('用法：node init.mjs <目标目录>；目标必须不存在或为空目录')
  const destination = resolve(target)
  let ancestor = destination
  while (true) {
    try {
      await lstat(ancestor)
      break
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      ancestor = dirname(ancestor)
    }
  }
  const canonical = resolve(await realpath(ancestor), relative(ancestor, destination))
  const source = await realpath(starter)
  if (inside(source, canonical) || inside(canonical, source)) throw new Error('目标与模板目录不能重叠')
  try {
    const stat = await lstat(destination)
    if (!stat.isDirectory() || stat.isSymbolicLink() || (await readdir(destination)).length) throw new Error('拒绝覆盖：目标不是空的普通目录')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const filter = async (path) => {
    const parts = relative(source, path).split(sep)
    if (parts.some(part => excluded.has(part) || part.endsWith('.tsbuildinfo') || part.endsWith('.log') || /^\.env(?:\.|$)/.test(part))) return false
    if ((await lstat(path)).isSymbolicLink()) throw new Error(`模板不允许符号链接：${path}`)
    return true
  }
  async function inspect(path) {
    if (!await filter(path)) return
    if ((await lstat(path)).isDirectory()) for (const entry of await readdir(path)) await inspect(resolve(path, entry))
  }
  await inspect(source)
  await mkdir(destination, { recursive: true })
  for (const entry of await readdir(source)) {
    await cp(resolve(source, entry), resolve(destination, entry), { recursive: true, force: false, errorOnExist: true, filter })
  }
  console.log(`初始化成功：${destination}\n未复制依赖、构建产物、缓存或环境秘密；尚未安装依赖或验证浏览器。\n品牌色：按业务场景修改 index.html 的 <html data-palette="green">（green/blue/amber/violet/neutral/teal/rose/midnight，场景适配见 references/scenarios.md）。`)
  return destination
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error('用法：node init.mjs <目标目录>')
    await initialize(process.argv[2])
  } catch (error) {
    console.error(`初始化失败：${error.message}`)
    process.exitCode = 1
  }
}
