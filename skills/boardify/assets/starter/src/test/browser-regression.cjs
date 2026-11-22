const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')

const output = process.env.QA_OUTPUT || '/tmp/boardify-qa/fixed'
const url = process.env.QA_URL || 'http://127.0.0.1:4173/'

async function main() {
  await fs.mkdir(output, { recursive: true })
  const browser = await chromium.launch()
  const results = []
  try {
    for (const width of [1440, 1280, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: 'light', serviceWorkers: 'block' })
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort())
      const page = await context.newPage()
      const errors = []
      const states = []
      page.on('pageerror', error => errors.push(error.stack))
      page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()) })
      page.on('requestfailed', request => errors.push(request.failure().errorText))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      const button = name => page.getByRole('button', { name, exact: true })
      async function check(name, region) {
        await page.getByRole('img', { name: `${region}合成服务地图`, exact: true }).locator('svg path').first().waitFor()
        await page.waitForTimeout(400)
        assert.equal(await page.locator('[_echarts_instance_]').count(), 6) // 趋势/构成/排行/堆叠/热力 + 地图
        assert.equal(await page.locator('vite-error-overlay').count(), 0)
        const layout = await page.evaluate(() => ({
          viewport: innerWidth,
          width: document.documentElement.scrollWidth,
          charts: [...document.querySelectorAll('[_echarts_instance_]')].map(element => ({ width: element.clientWidth, svg: Number(element.querySelector('svg').getAttribute('width')) })),
          overflow: [...document.querySelectorAll('[data-slot="card"]')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).length,
          dark: document.documentElement.classList.contains('dark'),
        }))
        assert.equal(layout.width, layout.viewport, `${width} ${name} 页面溢出`)
        assert.equal(layout.overflow, 0)
        for (const chart of layout.charts) assert.ok(chart.width > 0 && Math.abs(chart.width - chart.svg) <= 1)
        assert.deepEqual(errors, [])
        states.push({ name, ...layout })
      }
      await page.goto(url)
      assert.equal(page.url(), url)
      assert.match(await page.title(), /Boardify/)
      await check('初始明亮', '全域')
      assert.equal(await button('返回上级').isDisabled(), true)
      await page.screenshot({ path: `${output}/${width}-light.png`, fullPage: true })
      for (const [parent, children] of [['北部示范区', ['云港片区', '青丘片区']], ['南部示范区', ['星湖片区', '南苑片区']]]) {
        if (width >= 1280) {
          await page.getByRole('img', { name: '全域合成服务地图' }).locator('svg text').filter({ hasText: parent }).click()
        } else {
          await button(parent).focus()
          await page.keyboard.press('Enter')
        }
        await check(`${parent}首次下钻`, parent)
        for (const child of children) {
          await button(child).click()
          await check(`${child}第三级`, child)
          await button('核心服务网格').click()
          assert.match(await page.getByRole('status').innerText(), /已到第三级/)
          await button('切换为暗色主题').click()
          await check(`${child}暗色`, child)
          assert.equal(states.at(-1).dark, true)
          if (child === children[0]) await page.screenshot({ path: `${output}/${width}-${parent}-level3-dark.png`, fullPage: true })
          await button('切换为明亮主题').click()
          await check(`${child}恢复明亮`, child)
          assert.equal(states.at(-1).dark, false)
          await button('返回上级').click()
          await check(`${child}返回第二级`, parent)
        }
        await button('返回上级').click()
        await check(`${parent}返回根级`, '全域')
        assert.equal(await button('返回上级').isDisabled(), true)
      }
      await button('北部示范区').click()
      await check('再次进入第二级', '北部示范区')
      await button('云港片区').click()
      await check('再次进入第三级', '云港片区')
      await page.getByRole('navigation', { name: '地图路径' }).getByRole('button', { name: '全域', exact: true }).click()
      await check('面包屑返回根级', '全域')
      await button('切换为暗色主题').click()
      await page.reload()
      await check('暗色刷新保持', '全域')
      assert.equal(states.at(-1).dark, true)
      await page.screenshot({ path: `${output}/${width}-dark-reload.png`, fullPage: true })
      await page.setViewportSize({ width: width === 1440 ? 320 : 1440, height: 900 })
      await check('跨断点缩放', '全域')
      await page.setViewportSize({ width, height: 900 })
      await check('恢复视口', '全域')
      results.push({ width, states, errors })
      await context.close()
    }
    await fs.writeFile(`${output}/results.json`, JSON.stringify({ browser: browser.version(), url, results }, null, 2))
    console.log(JSON.stringify({ browser: browser.version(), viewports: results.map(result => ({ width: result.width, checks: result.states.length, errors: result.errors })) }, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
