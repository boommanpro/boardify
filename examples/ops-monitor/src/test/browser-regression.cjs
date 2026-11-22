const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')

const output = process.env.QA_OUTPUT || '/tmp/boardify-qa/ops-monitor'
const url = process.env.QA_URL || 'http://127.0.0.1:4174/'

async function main() {
  await fs.mkdir(output, { recursive: true })
  const browser = await chromium.launch()
  const results = []
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: 'light', serviceWorkers: 'block' })
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort())
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.stack))
      page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()) })
      page.on('requestfailed', request => errors.push(request.failure().errorText))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      async function check(name) {
        await page.waitForTimeout(500)
        assert.equal(await page.locator('vite-error-overlay').count(), 0)
        const layout = await page.evaluate(() => ({
          viewport: innerWidth,
          width: document.documentElement.scrollWidth,
          charts: [...document.querySelectorAll('[_echarts_instance_]')].map(element => ({ width: element.clientWidth, svg: Number(element.querySelector('svg').getAttribute('width')) })),
          overflow: [...document.querySelectorAll('[data-slot="card"]')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).length,
        }))
        assert.equal(layout.width, layout.viewport, `${width} ${name} 页面溢出`)
        assert.equal(layout.overflow, 0, `${width} ${name} 卡片溢出`)
        for (const chart of layout.charts) assert.ok(chart.width > 0 && Math.abs(chart.width - chart.svg) <= 1)
        assert.deepEqual(errors, [])
      }
      await page.goto(url)
      assert.match(await page.title(), /运维监控/)
      // 图表实例：延迟趋势 / 错误热力 / 服务堆叠 = 3
      await page.locator('[_echarts_instance_]').first().waitFor()
      assert.equal(await page.locator('[_echarts_instance_]').count(), 3)
      await check('初始')
      await page.screenshot({ path: `${output}/${width}-light.png`, fullPage: true })
      // 暂停自动刷新（真实点击）后核对按钮状态
      await page.getByRole('button', { name: /自动刷新中/ }).click()
      assert.equal(await page.getByRole('button', { name: '已暂停' }).count(), 1)
      await check('暂停刷新')
      // 服务范围筛选真实切换
      await page.getByRole('combobox', { name: '服务范围' }).click()
      await page.getByRole('option', { name: '核心链路' }).click()
      await check('筛选核心链路')
      // 告警排序真实点击
      const sortButtons = page.getByRole('button', { name: /级别/ })
      if (width >= 1280 && (await sortButtons.count()) === 1) await sortButtons.click()
      await check('告警排序')
      // 暗色切换
      await page.getByRole('button', { name: '切换为暗色主题' }).click()
      await check('暗色')
      await page.screenshot({ path: `${output}/${width}-dark.png`, fullPage: true })
      results.push({ width, errors })
      await context.close()
    }
    await fs.writeFile(`${output}/results.json`, JSON.stringify({ browser: browser.version(), url, results }, null, 2))
    console.log(JSON.stringify({ browser: browser.version(), viewports: results.map(result => ({ width: result.width, errors: result.errors })) }, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
