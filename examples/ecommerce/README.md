# 青禾商析 · 电商经营大盘

独立 React / Vite / TypeScript / shadcn/ui / ECharts 本地学习示例。仅首屏经营大盘，无管理导航与专题页；顶部指标、中央地图、两侧趋势/渠道/漏斗/品类/履约共享日期和地域。适配 2560×1440、1920×1080、1366×768；种子 20261015，2026-10-01 至 10-14 模拟数据，不连接真实业务。

## 启动与验证

Node.js 22.12 以上，当前验证版本 22.23.1。

```sh
npm ci
npm test
npm run build
npm run preview -- --port 4186 --strictPort
```

另开终端执行：

```sh
QA_URL=http://127.0.0.1:4186/ npm run test:browser
```

若缺少浏览器，执行 `npx playwright install chromium`。构建目录 `dist` 通过静态服务器访问，不支持双击 HTML。不含服务工作线程，所谓离线是外网阻断、本地服务器可达，不是关闭本地服务器后仍可运行。

## 源码与证据

- `src/data/commerce.ts`：确定性事实、筛选、聚合、格式化。
- `src/App.tsx`：单屏编排及共享状态，明暗主题、日期与全屏。
- `src/components/business-panel.tsx`、`src/lib/business-charts.ts`：图表面板、读屏数据替代与配置。
- `src/components/commerce-map.tsx`：实际几何下钻、原子提交、失败保留原层、竞态隔离。
- `src/lib/geography.ts`：白名单加载、Polygon/MultiPolygon 校验、属性码字符串适配。
- `public/maps`：363 份真实源文件；清单位于 `src/data/maps/manifest.json`。
- `docs/single-screen-design.md`、`docs/map-source.md`、`docs/single-screen-acceptance.md`：当前契约、来源与验收限制；旧六专题文档与证据仅保留为历史。
- `docs/single-screen-*.log`、`docs/evidence/single-screen/results.json`、截图：当前测试、构建、三尺寸浏览器记录。

## 不可忽略的限制

地图源站仅声明学习交流用途，版本 2021.5。3238 节点含全国，35 个来源无子级记录；不等于现行全国市区完整覆盖。商用、修改、离线再分发、审图适用性与坐标控制点未核实。本地构建仅供本机学习验证，禁止当作已授权公开发布包。

数据模型为分组事实，不包含用户身份、去重人数、真实库存或物流轨迹。无真实后端及权限。没有独立 lint；构建含 TypeScript 检查。主包约 1.08 MB、图表包约 580 KB，仍有分包体积警告。浏览器覆盖 Chromium 桌面模拟视口，不代表真机、Safari、Firefox 或性能 SLA 验收。
