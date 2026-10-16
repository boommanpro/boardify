import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validate } from './validate.mjs'

export async function verify(project = fileURLToPath(new URL('../assets/starter/', import.meta.url))) {
  const cwd = resolve(project)
  const validation = await validate({ project: cwd })
  const results = []
  console.log(`验证目录：${cwd}\n运行时：${process.version}\n日志：当前标准输出与标准错误；不生成浏览器证据。`)
  try {
    const pkg = JSON.parse(await readFile(resolve(cwd, 'package.json'), 'utf8'))
    for (const name of ['typecheck', 'lint', 'test', 'build']) {
      if (typeof pkg.scripts?.[name] !== 'string' || !pkg.scripts[name].trim()) {
        console.log(`未单独执行：${name}，项目未定义该脚本${name === 'typecheck' ? '；请核对实际构建命令是否包含类型检查' : ''}`)
        if (name === 'test' || name === 'build') results.push({ name, code: 1 })
        continue
      }
      console.log(`执行：npm run ${name}\n实际脚本：${pkg.scripts[name]}`)
      const result = spawnSync('npm', ['run', name], { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' } })
      const code = result.status ?? 1
      results.push({ name, code })
      console.log(`结果：${name}，退出码 ${code}${result.signal ? `，信号 ${result.signal}` : ''}${result.error ? `，${result.error.message}` : ''}`)
    }
  } catch (error) {
    results.push({ name: '项目读取', code: 1 })
    console.error(`验证失败：${error.message}`)
  }
  const ok = validation.ok && results.every(result => result.code === 0)
  console.log(`自动化检查：${ok ? '通过' : '失败'}\n浏览器：未验证；真实 ECharts、生产启动、交互、控制台、网络、视觉及离线下钻均无浏览器证据。\n交付状态：${ok ? '部分完成，浏览器验收受阻' : '验证失败，且浏览器未验证'}。`)
  return { ok, browser: '未验证', results }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3) {
    console.error('用法：node verify.mjs [项目目录]')
    process.exitCode = 1
  } else {
    const result = await verify(process.argv[2])
    process.exitCode = result.ok ? 0 : 1
  }
}
