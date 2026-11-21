# 全国农业大数据驾驶舱 · 交付清单

- 源码、依赖锁文件与配置齐全：`src/`、`package.json`、`package-lock.json`、`tsconfig.json`、`vite.config.ts`；未包含 node_modules、密钥或临时调试文件。
- 静态构建产物：`dist/`（含 363 个本地地图资产，覆盖全国→省→市→区县四级）与记录的代码版本一致。
- 实际执行过的命令（Node.js v22.23.1）：
  - `npm ci`
  - `npm test`（5 文件 / 20 用例通过）
  - `npm run build`（tsc 类型检查 + vite 生产构建，退出码 0）
  - `npm run preview` → 浏览器回归 `node src/test/browser-regression.cjs`（2560/1920/1366 三视口通过，含四级下钻/逐级返回）
- 运行方式：静态服务器（vite preview / 任意静态托管），`base: './'` 支持子路径；不承诺双击 HTML。
- 真实与模拟数据明确区分：全部为固定种子演示数据，页面显著标注“演示数据”；指标口径与单位在各面板记录。
- 地图来源、许可、坐标系、覆盖层级、署名与版本：`src/data/maps/manifest.json` + `docs/maps-baseline.json`。
- 验收证据关联当前版本：`docs/evidence/single-screen/`（三视口全国/省级/区县级截图 + results.json）。
- 体积与限制如实列出：
  - `dist` 主 JS 约 1.09MB（gzip 172KB，含 3238 节点地图清单）、charts 分包 626KB（gzip 210KB，ECharts 手动分包，超出 500KB 属预期警告）。
  - 区县为最细下钻层级；台湾省与直筒子市无下级资产，下钻显示错误/叶级提示并保留原层（DataV 无数据）。
  - 地图许可仅限本地学习交流，未获商用、修改、公开再分发许可。
  - 大屏按等比缩放，低于约定尺寸的窗口文字会同比缩小。
