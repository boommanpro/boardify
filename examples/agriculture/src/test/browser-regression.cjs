const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')

const output = process.env.QA_OUTPUT || '/tmp/boardify-agri-qa/fixed'
const url = process.env.QA_URL || 'http://127.0.0.1:4173/'

async function main() {
  await fs.mkdir(output, { recursive: true })
  const browser = await chromium.launch()
  const results = []
  try {
    for (const viewport of [{ width: 2560, height: 1440 }, { width: 1920, height: 1080 }, { width: 1366, height: 768 }]) {
      const context = await browser.newContext({ viewport, colorScheme: 'dark', serviceWorkers: 'block' })
      // 阻断外网：地图必须本地加载
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort())
      const page = await context.newPage()
      const errors = []
      const states = []
      page.on('pageerror', error => errors.push(error.stack))
      page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()) })
      page.on('requestfailed', request => errors.push(request.failure().errorText))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      async function check(name, charts) {
        assert.equal(await page.locator('[_echarts_instance_]').count(), charts, `${name} 图表实例数`)
        assert.equal(await page.locator('vite-error-overlay').count(), 0)
        const layout = await page.evaluate(() => ({
          viewport: innerWidth,
          viewportHeight: innerHeight,
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          dark: document.querySelector('.screen')?.classList.contains('dark') ?? false,
          mapRatio: document.querySelector('.center-col').getBoundingClientRect().width / document.querySelector('.screen-main').getBoundingClientRect().width,
          kpiFont: parseFloat(getComputedStyle(document.querySelector('.kpi-value')).fontSize),
          internalOverflow: [...document.querySelectorAll('[data-slot="card"], .stat-box, .factor-box, .kpi-value')].filter(element => element.scrollHeight > element.clientHeight + 2 || element.scrollWidth > element.clientWidth + 2).map(element => element.className),
          overflow: [...document.querySelectorAll('[data-slot="card"]')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).length,
        }))
        assert.ok(layout.width <= layout.viewport + 1, `${name} 页面横向溢出 ${layout.width}/${layout.viewport}`)
        assert.ok(layout.height <= layout.viewportHeight + 1, `${name} 页面纵向溢出`)
        assert.equal(layout.overflow, 0)
        assert.equal(layout.dark, true)
        assert.ok(Math.abs(layout.mapRatio - 0.55) < 0.001)
        assert.ok(layout.kpiFont >= 44)
        assert.deepEqual(layout.internalOverflow, [], `${name} 面板内部溢出`)
        assert.deepEqual(errors, [], `${name} 存在控制台/网络错误`)
        if (await page.getByRole('img', { name: '全国农业产业分布地图', exact: true }).count()) {
          const geometry = await page.locator('.map-stage').evaluate(stage => {
            const bounds = stage.getBoundingClientRect()
            const paths = [...stage.querySelectorAll('svg path[stroke="#0b2228"]')].map(path => path.getBoundingClientRect())
            const width = Math.max(...paths.map(rect => rect.right)) - Math.min(...paths.map(rect => rect.left))
            const height = Math.max(...paths.map(rect => rect.bottom)) - Math.min(...paths.map(rect => rect.top))
            return { width, height, stageHeight: bounds.height, heightRatio: height / bounds.height, polygons: paths.length, inset: [...stage.querySelectorAll('svg text')].some(text => text.textContent === '南海诸岛') }
          })
          assert.ok(Math.abs(geometry.heightRatio - 0.75) < 0.01, `${name} 全国主体高度不符 ${JSON.stringify(geometry)}`)
          assert.ok(geometry.polygons >= 34)
          assert.ok(geometry.inset)
          layout.geometry = geometry
        }
        states.push({ name, ...layout })
      }
      await page.goto(url)
      assert.equal(page.url(), url)
      assert.match(await page.title(), /全国农业大数据驾驶舱/)
      await page.getByRole('img', { name: '全国农业产业分布地图', exact: true }).locator('svg path').first().waitFor()
      await page.waitForTimeout(600)
      await check('初始全国', 4)
      assert.equal(await page.getByRole('button', { name: '返回上级' }).isDisabled(), true)
      await page.screenshot({ path: `${output}/${viewport.width}-national.png`, fullPage: true })

      // 切换地图指标 → 排行标题与图例联动
      await page.getByRole('button', { name: '耕地面积', exact: true }).click()
      await page.waitForTimeout(300)
      assert.match(await page.locator('.map-legend small').innerText(), /耕地面积/)
      await check('切换耕地指标', 4)

      // 下钻链路：全国 → 黑龙江(省) → 哈尔滨(市) → 南岗区(区县)
      await page.getByLabel('选择下钻区域').selectOption('230000')
      await page.getByRole('img', { name: '黑龙江省农业产业分布地图', exact: true }).locator('svg path').first().waitFor()
      await page.waitForTimeout(500)
      await check('省级下钻', 5)
      assert.match(await page.locator('[data-slot="card-title"]').filter({ hasText: '区域详情' }).innerText(), /黑龙江省/)
      assert.equal(await page.getByRole('button', { name: '返回上级' }).isDisabled(), false)
      await page.screenshot({ path: `${output}/${viewport.width}-province.png`, fullPage: true })

      await page.getByLabel('选择下钻区域').selectOption('230100')
      await page.getByRole('img', { name: '哈尔滨市农业产业分布地图', exact: true }).locator('svg path').first().waitFor()
      await page.waitForTimeout(500)
      await check('市级下钻', 4)
      assert.match(await page.locator('[data-slot="card-title"]').filter({ hasText: '区域详情' }).innerText(), /哈尔滨市/)
      assert.match(await page.locator('[data-slot="card"]').filter({ hasText: '区域排行' }).locator('[data-slot="card-description"]').innerText(), /哈尔滨市/)

      await page.getByLabel('选择下钻区域').selectOption('230103')
      await page.getByRole('img', { name: '南岗区农业产业分布地图', exact: true }).locator('svg path').first().waitFor()
      await page.waitForTimeout(500)
      await check('区县下钻', 4)
      assert.match(await page.locator('[data-slot="card-title"]').filter({ hasText: '区域详情' }).innerText(), /南岗区/)
      await page.screenshot({ path: `${output}/${viewport.width}-district.png`, fullPage: true })

      // 区县为最细层级：点击地图应给出叶级提示且不崩溃
      const mapBox = await page.getByRole('img', { name: '南岗区农业产业分布地图', exact: true }).boundingBox()
      const x = mapBox.x + mapBox.width * 0.5
      const y = mapBox.y + mapBox.height * 0.5
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.up()
      await page.mouse.click(x, y)
      await page.waitForTimeout(400)
      assert.equal(await page.locator('[_echarts_instance_]').count(), 4)
      assert.deepEqual(errors, [])

      // 逐级返回全国
      await page.getByRole('button', { name: '返回上级' }).click()
      await page.getByRole('img', { name: '哈尔滨市农业产业分布地图', exact: true }).locator('svg path').first().waitFor()
      await page.waitForTimeout(400)
      await page.getByRole('button', { name: '返回上级' }).click()
      await page.getByRole('img', { name: '黑龙江省农业产业分布地图', exact: true }).locator('svg path').first().waitFor()
      await page.waitForTimeout(400)
      await page.getByRole('button', { name: '返回上级' }).click()
      await page.getByRole('img', { name: '全国农业产业分布地图', exact: true }).locator('svg path').first().waitFor()
      await page.waitForTimeout(400)
      await check('返回全国', 4)
      assert.equal(await page.getByRole('button', { name: '返回上级' }).isDisabled(), true)

      // 刷新保持正常渲染
      await page.reload()
      await page.getByRole('img', { name: '全国农业产业分布地图', exact: true }).locator('svg path').first().waitFor()
      await page.waitForTimeout(400)
      await check('刷新后渲染', 4)
      results.push({ viewport, states, errors })
      await context.close()
    }
    await fs.writeFile(`${output}/results.json`, JSON.stringify({ browser: browser.version(), url, results }, null, 2))
    console.log(JSON.stringify({ browser: browser.version(), viewports: results.map(result => ({ viewport: result.viewport, checks: result.states.length, errors: result.errors })) }, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
