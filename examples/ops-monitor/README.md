# Boardify 起始工程

独立的 React、Vite、TypeScript、shadcn/ui、Tailwind CSS 与 ECharts 看板。所有指标为静态模拟数据，地图是合成多边形，不是真实行政区划，无需地图密钥或远程地图服务。

## 使用

需要 Node.js 22.12 或更新版本。复制本目录后运行：

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

构建产物位于 `dist`，需使用静态服务器访问，不支持直接双击 HTML。Vite 使用相对资源路径以支持子路径部署。

## 结构

- `src/components/ui`：通过官方注册表安装的 shadcn/ui 基础组件（button/card/table/select/tabs/breadcrumb/tooltip/progress 等）。
- `src/components/chart.tsx`：通用 ECharts 容器，支持主题更新、尺寸监听、事件与卸载清理。
- `src/components/kpi-card.tsx`、`chart-card.tsx`、`filter-bar.tsx`、`page-header.tsx`、`data-table.tsx`、`sparkline.tsx`、`status-block.tsx`、`palette-switch.tsx`：KPI 数字卡（迷你趋势/目标进度）、图表卡片（含可展开数据表）、筛选栏（字段配置驱动）、页头、明细表（排序/空态）、迷你趋势线、状态展示与色板切换器。
- `src/components/region-map.tsx`：加载状态、三级下钻、面包屑、返回、叶级提示、错误重试与过期请求隔离。
- `src/components/big-screen/`：`ScreenFrame`（16:9 等比缩放 + 强制深色）与 `Panel`（大屏面板），指挥大屏场景使用。
- `src/lib/chart-theme.ts`：语义令牌 → ECharts 安全颜色的适配层，oklch 防御与兜底色板；所有图表颜色从这里出。
- `src/lib/options.ts`：图表配置工厂（底座 + 趋势多系列/排行/占比/堆叠柱/热力/散点/雷达/漏斗/仪表/地图打点与飞线）。
- `src/data/maps/manifest.json`：地图树清单，指定根节点、父子关系、层级及本地资源名称。
- `src/data/maps/*.json`：构建时自动发现并按需加载的合成 GeoJSON。四个三级节点共享一个示范网格资源。
- `src/lib/maps.ts`：清单查询、直属区域校验、GeoJSON 校验与本地加载。
- `src/data/source.ts`：数据层唯一出口，确定性模拟指标与 DATA_SOURCE 切换点。
- `src/hooks/`：`use-theme`（明暗）、`use-palette`（色板覆盖）、`use-chart-theme`（明暗/色板切换后重解析图表令牌）、`use-auto-refresh`（轮询）、`use-screen-scale`（大屏缩放）。
- `src/test`：地图清单、下钻、返回、重试、竞态、主题、图表主题与配置工厂、数据层测试。

## 品牌色

按业务场景在 `index.html` 的 `<html data-palette="green">` 选定工程默认预设：green（默认）/ blue / amber / violet / neutral / teal / rose / midnight。全部界面与图表颜色随语义令牌联动，无需改组件代码；明暗模式页面内可切换，页头 `PaletteSwitch` 支持用户偏好运行时覆盖（不需要则移除该组件）。

## 扩展地图

新增本地 Polygon 类型的 GeoJSON，确保环闭合且坐标有限。清单的 `asset` 为 JSON 文件名去掉扩展名；父图要素的 `properties.id`、`properties.name` 必须匹配直属子节点的 `id`、`name`。节点层级为全域、示范区、片区，叶节点 `children` 为空。替换为真实地理数据时应自行核实来源、授权及行政边界合规要求。

## 验证边界

单元测试模拟图表容器以专注导航状态；真实 ECharts 渲染应在浏览器中检查。主题通过语义 CSS 变量控制界面，图表使用对应明暗配色。服务端接口与身份认证不在本起始工程范围内。

## 真实浏览器回归

依赖安装后执行 `npx playwright install chromium`。先运行 `npm run build`，另开终端运行 `npm run preview -- --port 4173`，保持服务运行后执行 `npm run test:browser`。

通过 `QA_URL` 指定其他生产预览地址，通过 `QA_OUTPUT` 指定证据目录；默认输出到 `/tmp/boardify-qa/fixed`。每个视口使用全新上下文、禁用 Service Worker、阻断非预览源请求，验证本地资源冷启动、真实地图下钻、返回、主题持久化及布局。共覆盖 1440、1280、390、320 四种视口，不代表 Safari、Firefox 或真机触摸验证。

技能的 `verify.mjs` 只执行非浏览器检查，其“浏览器未验证”仅描述该脚本范围；浏览器结论需单独引用本回归的结果。模板注册了全套图表类型（ECharts 分包约 716 KB），业务工程删减未用工厂时同步删减 `lib/charts.ts` 注册项。
