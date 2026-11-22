const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')

const output = process.env.QA_OUTPUT || '/tmp/boardify-qa/command-center'
const url = process.env.QA_URL || 'http://127.0.0.1:4176/'

async function main() {
  await fs.mkdir(output, { recursive: true })
  const browser = await chromium.launch()
  const results = []
  try {
    for (const width of [1920, 1440]) {
      const height = Math.round((width / 16) * 9)
      const context = await browser.newContext({ viewport: { width, height }, colorScheme: 'light', serviceWorkers: 'block' })
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort())
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.stack))
      page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()) })
      page.on('requestfailed', request => errors.push(request.failure().errorText))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      async function check(name) {
        await page.waitForTimeout(600)
        assert.equal(await page.locator('vite-error-overlay').count(), 0)
        const layout = await page.evaluate(() => {
          const frame = document.querySelector('div[aria-label="营销活动指挥中心"] > div')
          const frameBottom = frame.getBoundingClientRect().bottom
          // 大屏内部元素（面板/卡片）不得越过设计稿底边，也不得互相重叠：分两段采集纵向区间
          const blocks = [...frame.querySelectorAll('section, [data-slot=card]')].map(element => {
            const rect = element.getBoundingClientRect()
            return { top: rect.top, bottom: rect.bottom }
          })
          return {
            viewport: innerWidth,
            width: document.documentElement.scrollWidth,
            dark: document.documentElement.classList.contains('dark'),
            palette: document.documentElement.dataset.palette,
            overflowBottom: blocks.filter(block => block.bottom > frameBottom + 1).length,
            charts: [...document.querySelectorAll('[_echarts_instance_]')].map(element => ({ width: element.clientWidth, svg: Number(element.querySelector('svg').getAttribute('width')) })),
          }
        })
        assert.equal(layout.width, layout.viewport, `${width} ${name} 页面溢出`)
        assert.equal(layout.dark, true, `${name} 大屏未强制深色`)
        assert.equal(layout.palette, 'midnight', `${name} 未使用 midnight 色板`)
        assert.equal(layout.overflowBottom, 0, `${name} 面板越过设计稿底边`)
        for (const chart of layout.charts) assert.ok(chart.width > 0 && Math.abs(chart.width - chart.svg) <= 1)
        assert.deepEqual(errors, [])
      }
      await page.goto(url)
      assert.match(await page.title(), /指挥中心/)
      // 图表实例：构成 / 雷达 / 排行 / 堆叠 / 走势 / 地图 = 6
      await page.locator('[_echarts_instance_]').first().waitFor()
      assert.equal(await page.locator('[_echarts_instance_]').count(), 6)
      await check('初始')
      await page.screenshot({ path: `${output}/${width}.png`, fullPage: false })
      // 合成地图真实下钻与返回（RegionMap 自带键盘可达的区域按钮）
      await page.getByRole('button', { name: '北部示范区' }).click()
      await page.waitForTimeout(600)
      await check('下钻北部示范区')
      await page.screenshot({ path: `${output}/${width}-drill.png`, fullPage: false })
      await page.getByRole('button', { name: '返回上级' }).click()
      await page.waitForTimeout(600)
      await check('返回全域')
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
